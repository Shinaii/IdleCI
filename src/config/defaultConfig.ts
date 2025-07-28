import { FullConfig } from '../types';

export const defaultConfig: FullConfig = {
  startupCheats: [],
  cheatConfig: {
    unban: true,
    dungeon: {
      creditcap: 10000000,
      flurbocap: 1000000,
    },
    multiply: {
      damage: 1,
      efficiency: 1,
      afk: 1,
      drop: 1,
      printer: 6,
      monsters: 1,
    },
    godlike: {
      respawn: (t: any) => Math.min(t, 1),
    },
    nomore: {
      items: [],
    },
    unlock: {
      islands: "abcde_",
    },
    wide: {
      gembuylimit: 0,
      autoloot: {
        tochest: true,
        hidenotifications: true,
      },
      perfectobols: {
        preferredstat: "PRIMARY",
      },
      plunderous: {
        allcharacters: false,
      },
      arcade: {
        ArcadeCost: (t: any) => Math.min(t, 0),
      }
    },
    wipe: {
      cogs: 0,
    },
    cauldron: {
      liq_rate: (t: any) => 100000,
    },
    talent: {
      168: (t: any) => t * 2,
      169: (t: any) => 100,
      318: (t: any) => 10000,
      120: (t: any) => 800,
      483: (t: any) => Math.max(t, 3.5),
      45: (t: any, args: [1 | 2]) => { const fns = { 1: (t: any) => t, 2: (t: any) => t }; const fn = fns[args[0]]; return fn ? fn(t) : 0; },
    },
    w1: {
      anvil: {
        productionspeed: (t: any) => 5000000,
      },
      companion: {
        companions: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
          20, 21, 22, 23, 24, 25, 26
        ],
        current: "11",
      },
      owl: {
        OwlCost: (t: any) => t / 2,
        OwlFeatherRate: (t: any) => t * 2,
        OwlBonuses: (t: any) => t * 2,
        OwlFeatherShinyGe: (t: any) => t,
      },
    },
    w2: {
      roo: {
        RooCost: (t: any) => t / 2,
        RooShinyMulti: (t: any) => t * 2,
        RooCatchRate: (t: any) => t * 2,
        RooCatchREQ: (t: any) => t / 2,
        RooCatchFishQTY: (t: any) => t * 2,
        RooCatchRate_S: (t: any) => t * 2,
        RooCatchREQ_S: (t: any) => t / 2,
        RooCatchRate_T: (t: any) => t * 2,
        RooCatchREQ_T: (t: any) => t / 2,
      },
    },
    w4: {
      fastforaging: (t: any) => 3e8,
      superpets: {
        BlockChance: (t: any) => 100,
        TotalDMG: (t: any) => t * 5000,
      },
      mainframe: {
        0: (t: any) => 200,
        1: (t: any) => 2,
        2: (t: any) => 10,
        3: (t: any) => 10,
        4: (t: any) => 2,
        5: (t: any) => 1,
        6: (t: any) => 5,
        7: (t: any) => 2,
        8: (t: any) => 5,
        9: (t: any) => t * 2,
        10: (t: any) => 2,
        11: (t: any) => t * 1.2,
        12: (t: any) => 1,
        13: (t: any) => 300,
        100: (t: any) => 10,
        101: (t: any) => 3,
        102: (t: any) => 60,
        103: (t: any) => 36,
        104: (t: any) => 15,
        105: (t: any) => 100,
        106: (t: any) => 10,
        107: (t: any) => 2,
        108: (t: any) => 50,
        109: (t: any) => 145,
        110: (t: any) => 100,
        111: (t: any) => 500,
        112: (t: any) => 1500,
        113: (t: any) => 1.5,
        114: (t: any) => t * 3,
        115: (t: any) => 45,
        116: (t: any) => 50,
        117: (t: any) => 1.5,
      },
      chipbonuses: {
        resp: (t: any) => 50,
        card1: (t: any) => 1,
        card2: (t: any) => 1,
        crys: (t: any) => 95,
        star: (t: any) => 1,
        mkill: (t: any) => 40,
        linewidth: (t: any) => 12,
        dmg: (t: any) => 100,
        move: (t: any) => 30,
        acc: (t: any) => 30,
        pend: (t: any) => 1,
        key1: (t: any) => 1,
        troph: (t: any) => 1,
        def: (t: any) => 10,
        weappow: (t: any) => 100,
        dr: (t: any) => 60,
        toteff: (t: any) => 40,
        eff: (t: any) => 1200,
        labexp: (t: any) => 150,
        atkspd: (t: any) => 60,
        safk: (t: any) => 15,
        fafk: (t: any) => 25,
      },
      meals: {
        TotDmg: (t: any) => t,
        Mcook: (t: any) => t,
        Cash: (t: any) => t,
        Rcook: (t: any) => t,
        Npet: (t: any) => t,
        BrExp: (t: any) => t,
        Seff: (t: any) => t,
        VIP: (t: any) => t,
        Lexp: (t: any) => t,
        Def: (t: any) => t,
        PxLine: (t: any) => t,
        KitchenEff: (t: any) => t,
        TimeEgg: (t: any) => t,
        KitchC: (t: any) => t,
        PetDmg: (t: any) => t,
        TDpts: (t: any) => t,
        CookExp: (t: any) => t,
        Breed: (t: any) => t,
        TotAcc: (t: any) => t,
        AtkSpd: (t: any) => t,
        Sprow: (t: any) => t,
        Lib: (t: any) => t,
        Critter: (t: any) => t,
        Crit: (t: any) => t,
        LinePct: (t: any) => t,
        TPpete: (t: any) => t,
        Liquid12: (t: any) => t,
        DivExp: (t: any) => t,
        GamingBits: (t: any) => t,
        Liquid34: (t: any) => t,
        Sailing: (t: any) => t,
        GamingExp: (t: any) => t,
      },
    },
    w5: {
      sailing: {
        IslandDistance: (t: any) => t / 2,
        MaxChests: (t: any) => t,
        RareTreasureChance: (t: any) => t * 5,
      },
    },
  },
  injectorConfig: {
    enableUI: true,
    customUIPort: 8080,
    injreg: '\\w+\\.ApplicationMain\\s*?=',
    showConsoleLog: false,
    chrome: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    onTimeout: 30000,
    interceptPattern: '*N.js',
    gameExePath: undefined,
    // OPTIMIZATION: Add fast injection mode configuration
    fastInjectionMode: false, // Enable for faster injection with reduced timeouts
    cdpConnectionTimeout: 10000, // CDP connection timeout in ms
    cdpRetryAttempts: 3, // Number of CDP connection retry attempts
    pollingInterval: 200, // Polling interval for CDP detection in ms
    cheatContextTimeout: 15000, // Timeout for cheat context detection in ms
    cheatContextPollingInterval: 100, // Polling interval for cheat context detection in ms
  },
};
