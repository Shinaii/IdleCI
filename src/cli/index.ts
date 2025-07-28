/**
 * CLI Interface Module
 * 
 * Provides the command-line interface for the Idleon Cheat Injector.
 * Handles user interaction through an autocomplete prompt system, cheat execution,
 * and special commands like Chrome DevTools integration. Supports confirmation
 * prompts for destructive operations and maintains an interactive loop.
 */

import { spawn } from 'child_process';
import { getLogger } from '../lib/logger';

let Enquirer: any;
try {
  Enquirer = require('enquirer');
} catch (error) {
  // Fallback if enquirer is not available
  console.warn('Enquirer not available, CLI will use basic readline interface');
}

interface CliOptions {
  injectorConfig: any;
  cdpPort: number;
}

/**
 * Start the CLI interface for user interaction
 * @param {string} context - JavaScript expression for game context
 * @param {Object} client - CDP client instance
 * @param {Object} options - Configuration options
 * @param {Object} options.injectorConfig - Injector configuration
 * @param {number} options.cdpPort - CDP port number
 */
export async function startCliInterface(
  context: string, 
  client: any, 
  options: CliOptions = { injectorConfig: {}, cdpPort: 32123 }
): Promise<void> {
  const logger = getLogger('CLI', 'info');
  const { injectorConfig, cdpPort } = options;
  const { Runtime } = client;

  logger.debug(`Starting CLI interface with context: ${context}`);
  logger.debug(`CLI options: ${JSON.stringify(options)}`);

  // Fetch autocomplete suggestions and confirmation requirements from the cheat context
  let choicesResult = await Runtime.evaluate({
    expression: `getAutoCompleteSuggestions.call(${context})`,
    awaitPromise: true,
    returnByValue: true
  });

  if (choicesResult.exceptionDetails) {
    console.error("Error getting autocomplete suggestions:", choicesResult.exceptionDetails.text);
    return; // Stop if fetching suggestions fails
  }

  let choices = choicesResult.result.value || []; // Default to empty array
  logger.debug(`Loaded ${choices.length} autocomplete choices`);

  let cheatsNeedingConfirmationResult = await Runtime.evaluate({
    expression: `getChoicesNeedingConfirmation.call(${context})`,
    awaitPromise: true,
    returnByValue: true
  });

  if (cheatsNeedingConfirmationResult.exceptionDetails) {
    console.error("Error getting confirmation choices:", cheatsNeedingConfirmationResult.exceptionDetails.text);
    return; // Stop if fetching confirmation list fails
  }

  let cheatsNeedingConfirmation = cheatsNeedingConfirmationResult.result.value || []; // Default to empty array
  logger.debug(`Loaded ${cheatsNeedingConfirmation.length} cheats needing confirmation`);

  // Function to continuously prompt the user for cheat commands
  async function promptUser(): Promise<void> {
    try {
      let valueChosen = false;
      let enquirer = new Enquirer();
      
      let { action } = await enquirer.prompt({
        name: 'action',
        message: 'Action',
        type: 'autocomplete',
        initial: 0,
        limit: 15,
        choices: choices,
        suggest: function (input: string, choices: any[]) {
          if (input.length == 0) return [choices[0]];
          let str = input.toLowerCase();
          let mustInclude = str.split(" ");
          return choices.filter((ch: any) => {
            // Ensure the choice message includes all words from the input
            for (let word of mustInclude) {
              if (!ch.message.toLowerCase().includes(word)) return false;
            }
            return true;
          });
        },
        // Custom submit logic to handle confirmation for specific cheats
        onSubmit: function (name: string, value: string, prompt: any) {
          value = this.focused ? this.focused.value : value; // Use focused value if available
          let choiceNeedsConfirmation = false;
          
          // Check if the selected cheat requires confirmation
          cheatsNeedingConfirmation.forEach((e: string) => {
            if (value.indexOf(e) === 0) choiceNeedsConfirmation = true;
          });

          // If confirmation is needed and not yet given, re-render the prompt
          // with the chosen value, requiring a second Enter press to confirm
          if (choiceNeedsConfirmation && !valueChosen && this.focused) {
            prompt.input = value;
            prompt.state.cursor = value.length;
            prompt.render();
            valueChosen = true;
            return new Promise(function (resolve) {
              // This will be resolved on the next Enter press
            });
          } else {
            this.addChoice({ name: value, value: value }, this.choices.length + 1);
            return true;
          }
        },
        onRun: async function () {
          // Ensure completion runs, potentially needed for async operations within prompt
          await this.complete();
        },
        cancel: function () {
          // Define cancel behavior if needed
        }
      });

      logger.debug(`User selected action: ${action}`);

      // Special command to open Chrome DevTools for the game instance
      if (action === 'chromedebug') {
        const response = await client.Target.getTargetInfo();
        const url = `http://localhost:${cdpPort}/devtools/inspector.html?experiment=true&ws=localhost:${cdpPort}/devtools/page/${response.targetInfo.targetId}`;
        spawn(injectorConfig.chrome, ["--new-window", url]);
        console.log('Opened idleon chrome debugger');
        logger.debug('Chrome DevTools opened');
      } else {
        // Execute the selected cheat command within the game's context
        const cheatResponse = await Runtime.evaluate({
          expression: `cheat.call(${context}, '${action}')`,
          awaitPromise: true,
          allowUnsafeEvalBlockedByCSP: true
        });

        if (cheatResponse.exceptionDetails) {
          console.error(`Error executing cheat '${action}':`, cheatResponse.exceptionDetails.text);
          logger.error(`Cheat execution failed: ${cheatResponse.exceptionDetails.text}`);
        } else {
          console.log(`${cheatResponse.result.value}`);
          logger.debug(`Cheat executed successfully: ${action}`);
        }
      }

      // Recursive call needs careful handling, maybe add a delay or condition to exit
      await promptUser();
    } catch (promptError) {
      console.error("Error in promptUser:", promptError);
      logger.error(`CLI prompt error: ${promptError}`);
      // Decide how to handle prompt errors, maybe retry or exit
      // Consider adding a small delay before retrying
      await new Promise(res => setTimeout(res, 1000));
      await promptUser(); // Be cautious with recursion on error
    }
  }

  // Start the initial user prompt loop
  await promptUser();
} 