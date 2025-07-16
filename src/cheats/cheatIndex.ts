import combatCheats from './combat';
import utilityCheats from './utility';
import w1Cheats from './w1';
import w2Cheats from './w2';
import w3Cheats from './w3';
import w4Cheats from './w4';
import w5Cheats from './w5';
import w6Cheats from './w6';
import economyCheats from './economy';
import miscCheats from './misc';
import otherCheats from './other';
import { Cheat } from '../types';

export const allCheats: Cheat[] = [
  ...combatCheats,
  ...utilityCheats,
  ...w1Cheats,
  ...w2Cheats,
  ...w3Cheats,
  ...w4Cheats,
  ...w5Cheats,
  ...w6Cheats,
  ...economyCheats,
  ...miscCheats,
  ...otherCheats,
]; 