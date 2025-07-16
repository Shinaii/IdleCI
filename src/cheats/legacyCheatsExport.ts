/// <reference types="node" />
import { allCheats } from './cheatIndex';

// Convert array to object map by id, for legacy compatibility
const cheatsMap: Record<string, any> = {};
for (const cheat of allCheats) {
  cheatsMap[cheat.id] = cheat;
}

module.exports = cheatsMap; 