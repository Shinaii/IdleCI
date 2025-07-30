import { CheatConfig } from '../types';

// Helper function to convert functions to strings for serialization
const fn = (str: string) => ({ __isFunction: true, __functionString: str });

export const defaultStartupCheats: string[] = [];

export const defaultCheatConfig: CheatConfig = {
  unban: true,
  dungeon: {
    creditcap: 10000000, // lots of people breaking things by having too many credits
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
    respawn: fn('(t) => Math.min(t, 1)'),
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
      preferredstat: "PRIMARY", // PRIMARY, STR, AGI, WIS or LUK
    },
    plunderous: {
      allcharacters: false,
    },
    arcade: {
      ArcadeCost: fn('(t) => Math.min(t, 0)'),
    }
  },
  wipe: {
    cogs: 0,
  },
  cauldron: {
    liq_rate: fn('(t) => 100000'),
  },
  talent: {
    168: fn('(t) => t * 2'), // orb of remembrance time doubled,
    169: fn('(t) => 100'), // 100% shockwave
    318: fn('(t) => 10000'), // 10x hp/drop plunderous mobs
    120: fn('(t) => 800'), // 800% shockwave damage
    483: fn('(t) => Math.max(t, 3.5)'), // Tenteycle
    // 1: time? 2: points?
    45: fn('(t, args) => { const fns = { 1: (t) => t, 2: (t) => t }; const fn = fns[args[0]]; return fn ? fn(t) : 0; }'),
  },
  w1: {
    anvil: {
      productionspeed: fn('(t) => 5000000'),
    },
    companion: {
      companions: [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26
      ], // Set the companions you have unlocked (0=doot, down to 23=green mush)
      current: "11", //current companion - Glunko Supreme
    },
    owl: {
      OwlCost: fn('(t) => t / 2'),
      OwlFeatherRate: fn('(t) => t * 2'),
      OwlBonuses: fn('(t) => t * 2'),
      OwlFeatherShinyGe: fn('(t) => t'), // not sure what this does
      // OwlMegafeather: (t) => t,
      // OwlNextUpgReq: (t) => t,
    },
  },
  w2: {
    roo: {
      RooCost: fn('(t) => t / 2'),
      RooShinyMulti: fn('(t) => t * 2'),
      RooCatchRate: fn('(t) => t * 2'),
      RooCatchREQ: fn('(t) => t / 2'),
      RooCatchFishQTY: fn('(t) => t * 2'),
      RooCatchRate_S: fn('(t) => t * 2'),
      RooCatchREQ_S: fn('(t) => t / 2'),
      RooCatchRate_T: fn('(t) => t * 2'),
      RooCatchREQ_T: fn('(t) => t / 2'),
      // RooNextUpgReq: (t) => t,
      // RooShinyLuck: (t) => t, // not sure what this does
      // RooTarOwned: (t) => t,
      // RooCost_T: (t) => t,
      // RooRESETbon: (t) => t,
      // RooMegafeather: (t) => t,
      // RooBonuse: (t) => t,
    },
  },
  w4: {
    fastforaging: fn('(t) => 3e8'),
    superpets: {
      BlockChance: fn('(t) => 100'),
      TotalDMG: fn('(t) => t * 5000'),
    },
    mainframe: {
      0: fn('(t) => 200'), // Animal farm damage bonus (119 is all pets)
      1: fn('(t) => 2'), // Wired in uploaded player printer multiplier
      2: fn('(t) => 10'), // Refinery cycle speed multiplier
      3: fn('(t) => 10'), // alch bubble level gain (game subtracts 1 from this number, and affects min(this number, 4) + up to 2 more bubbles from sailing for a max of 6)
      4: fn('(t) => 2'), // Deathnote/portal kill multiplier
      5: fn('(t) => 1'), // Shrine world tour activated
      6: fn('(t) => 5'), // Alchemy liquid capacity multi (-30% speed)
      7: fn('(t) => 2'), // Stamp bonus multiplier (must be equal to 2 to work)
      8: fn('(t) => 5'), // Spelunker jewel effect multiplier
      9: fn('(t) => t * 2'), // Fungi finger pocketer %cash bonus
      10: fn('(t) => 2'), // Alchemy vial bonus multiplier
      11: fn('(t) => t * 1.2'), // Banking fury, %damage multiplier
      12: fn('(t) => 1'), // enable sigils (this is either 1 or 0)
      13: fn('(t) => 300'), // % larger connection range
      100: fn('(t) => 10'), // meal cooking speed multiplier
      101: fn('(t) => 3'), // Animal farm additional damage % per pet
      102: fn('(t) => 60'), // additional % lab xp
      103: fn('(t) => 36'), // trim all building slots
      104: fn('(t) => 15'), // % all stat
      105: fn('(t) => 100'), //additional breeding xp
      106: fn('(t) => 10'), // kitchens gain a level each day
      107: fn('(t) => 2'), // adds to bonus 3
      108: fn('(t) => 50'), // % food non consume chance
      109: fn('(t) => 145'), // % larger connection range for bonuses and jewels
      110: fn('(t) => 100'), // % extra damage
      111: fn('(t) => 500'), // % reduced egg incubation
      112: fn('(t) => 1500'), // +base efficiency in all skills
      113: fn('(t) => 1.5'), //fungi finger pocketer extra cash %
      114: fn('(t) => t * 3'), //meal cooking bonus speed %
      115: fn('(t) => 45'), //pet passive ability speed %
      116: fn('(t) => 50'), // % additional meal bonus
      117: fn('(t) => 1.5'), // % additional damage per greened stack
    },
    chipbonuses: {
      resp: fn('(t) => 50'), //mob respawn speed bonus
      card1: fn('(t) => 1'), //double top left card effect (1=yes, 0=no)
      card2: fn('(t) => 1'), //double bottom right card effect (1=yes, 0=no)
      crys: fn('(t) => 95'), //crystal spawn % on kill
      star: fn('(t) => 1'), //double star sign effects (1=yes, 0=no)
      mkill: fn('(t) => 40'), //% multikill per tier bonus
      linewidth: fn('(t) => 12'), //lab line width % bonus
      dmg: fn('(t) => 100'), //% damage bonus
      move: fn('(t) => 30'), //mpvement speed bonus,
      acc: fn('(t) => 30'), //accuracy bonus
      pend: fn('(t) => 1'), //double pendant bonuses
      key1: fn('(t) => 1'), //double first keychain bonuses
      troph: fn('(t) => 1'), //souble trophy bonuses
      def: fn('(t) => 10'), //bonus defence %
      weappow: fn('(t) => 100'), //bonus weapon power %
      dr: fn('(t) => 60'), //bonus drop rarity %
      toteff: fn('(t) => 40'), //% skilling efficiency bonus
      eff: fn('(t) => 1200'), //base skilling efficiency bonus
      labexp: fn('(t) => 150'), //% bonus lab xp
      atkspd: fn('(t) => 60'), //% bonus attack speed
      safk: fn('(t) => 15'), //skill afk gains bonus %
      fafk: fn('(t) => 25'), //fight afk gains bonus %
    },
    meals: {
      TotDmg: fn('(t) => t'),
      Mcook: fn('(t) => t'),
      Cash: fn('(t) => t'),
      Rcook: fn('(t) => t'),
      Npet: fn('(t) => t'),
      BrExp: fn('(t) => t'),
      Seff: fn('(t) => t'),
      VIP: fn('(t) => t'),
      Lexp: fn('(t) => t'),
      Def: fn('(t) => t'),
      PxLine: fn('(t) => t'),
      KitchenEff: fn('(t) => t'),
      TimeEgg: fn('(t) => t'),
      KitchC: fn('(t) => t'),
      PetDmg: fn('(t) => t'),
      TDpts: fn('(t) => t'),
      CookExp: fn('(t) => t'),
      Breed: fn('(t) => t'),
      TotAcc: fn('(t) => t'),
      AtkSpd: fn('(t) => t'),
      Sprow: fn('(t) => t'),
      Lib: fn('(t) => t'),
      Critter: fn('(t) => t'),
      Crit: fn('(t) => t'),
      LinePct: fn('(t) => t'),
      TPpete: fn('(t) => t'),
      Liquid12: fn('(t) => t'),
      DivExp: fn('(t) => t'),
      GamingBits: fn('(t) => t'),
      Liquid34: fn('(t) => t'),
      Sailing: fn('(t) => t'),
      GamingExp: fn('(t) => t'),
    },
  },
  w5: {
    sailing: {
      IslandDistance: fn('(t) => t / 2'), // islands 50% closer
      MaxChests: fn('(t) => t'), // ! Caution if the pile is too high the game wont save to the cloud anymore !
      RareTreasureChance: fn('(t) => t * 5'), // 5x chance for rare treasure
      Minimumtraveltime: fn('(t) => t / 5'), // minimum travel time reduced from 2h to 30m ( t => 10 would be 10 minues )
      BoatUpgCostType: fn('(t) => t'), // loot type for upgrade
      BoatUpgCostQty: fn('(t) => t'), // loot amount for upgrade, t => 0 for free upgrades
      BoatValue: fn('(t) => t * 2'), // 2x boat loot
      BoatSpeed: fn('(t) => t * 2'), // 2x boat speed
      CloudDiscoverBonus: fn('(t) => t * 2'), // 2x cloud discover bonus
      ArtifactChance: fn('(t) => t'), // ! Caution changing this causes crashes. ! artifact discover bonus (lower is better)
      AncientChances: fn('(t) => t / 5'), // 5x ancient chance (lower is better)
      EldritchChances: fn('(t) => t'), // eldritch chance (is lower is better?)
      SovereignChances: fn('(t) => t'), // sovereign chance (is lower is better?)
      NewCaptBoatSlot: fn('(t) => 0'), // free boat and captain slots
      BuyCaptainCost: fn('(t) => 0'), // free captains
      ArtifactBonus: fn('(t) => t'), // bonus from the artifact, needs investigation as to what can be done here!
    },
    gaming: {
      FertilizerUpgCosts: fn('(t) => 0'), // fertilizer upgrade costs are free
      SproutCapacity: fn('(t) => Math.max(22, t + 2)'), // 2 more sprout slots, or 22 if that's higher
      MutateUpgCosts: fn('(t) => 0'), // mutate upgrade costs are free
      LogBookBitBonus: fn('(t) => Math.max(20, t * 2)'), // 2x logbook bits bonus, or 20 if that's higher
      GamingExpPCT: fn('(t) => t * 1.5'), // 1x gaming exp multiple
      NewMutantChanceDEC: fn('(t) => 1'), // new mutant guaranteed
      SproutGrowthCHANCEperMUT: fn('(t) => t'), // could be a bit fiddly, i assume this gives the chance of each plant type growing
      SproutGrowthTime: fn('(t) => t / 5'), // sprouts grow 5x faster
      SaveSprinkler: fn('(t) => t * 1.1'), // Don't use water when using the sprinkler. 1 is a guarantee
      ImportItemCOST: fn('(t) => 0'), // import item upgrades are free
      AcornShopCost: fn('(t) => 0'), //acorn shop upgrades are free
      BoxCost: fn('(t) => 0'), //new boxes are free
      // 0: upgrade chance 1: reset chance 2: bit multiplier
      SnailStuff: fn('(t, args) => { const fns = { 0: (t) => 1, 1: (t) => 0, 2: (t) => t }; return fns[args[1]] ? fns[args[1]](t) : 0; }'),
      SnailMail: false,
    },
    divinity: {
      unlinks: true,
      StyleLvReq: fn('(t) => 0'), // allow all meditation styles from lvl 0
      DivPerHr: fn('(t) => t * 3'), // base div per hr
      DivPerHr_EXP: fn('(t) => t * 3'), // base xp per hr
      BlesssBonus: fn('(t) => t * 2'), // god blessing bonus
      Bonus_MAJOR: fn('(t) => t'), // main bonus
      Bonus_Minor: fn('(t) => t * 2'), // passive bonus
      OfferingCost: fn('(t) => 0'), // free offerings
      OfferingOdds: fn('(t) => 1'), //offerings always work
    },
    collider: {
      AtomsUnlocked: fn('(t) => t'), // max 10
      AtomCost: fn('(t) => 0'), // atom collider upgrades are free,
      AtomBonuses: fn('(t) => t'), // atom bonus amount. Unclear how this works yet, assume t => t * 2 would be 2x regular bonus
      AtomBubbleUpgCost: fn('(t) => 0'), // atom bubble upgrades are free,
    },
    holes: {
      VillagerExpPerHour: fn('(t) => t * 2'), // 2x villager exp
      BuildCost: fn('(t) => t / 2'), // building upgrades are 0.5x cost
      BucketFillRate: fn('(t) => t * 2'), // 2x bucket fill rate
      AmpMulti: fn('(t) => t * 2'), // 2x amp multiplier
      MeasurementCost: fn('(t) => t / 2'), // measurement upgrades are 0.5x cost
      MeasurementBaseBonus: fn('(t) => t * 2'), // 2x measurement base bonus
      MotherlodeEffBase: fn('(t) => t / 2'), // 0.5 motherlode efficiency
      MonumentRewardMulti: fn('(t) => t * 2'), // 2x bravery reward multiplier this is the time multiplier
      MonumentROGbonuses: fn('(t) => t * 2'), // 2x bravery right side rewards
      // MonumentHRbonuses: t => t * 2, // 2x bravery left side rewards
      Bravery_MinDMG: fn('(t) => t * 10'), // 10x bravery min damage
      Bravery_MaxDMG: fn('(t) => t * 2'), // 2x bravery max damage
      Bravery_SwordsOwned: fn('(t) => 8'), // 8 swords for bravery 10 swords glitch out
      MaxRerolls: fn('(t) => 20'), // 20 rerolls for bravery
      MaxRevisions: fn('(t) => 5'), // 5 revisions for bravery
      Bravery_MonsterHP: fn('(t) => t / 2'), // 0.5 x monster hp
      Bravery_BlueChestChanceDEC: fn('(t) => 0.5'), // 50% blue chest chance. Those are really rare 0.001% its like double loot.
      BellCosts: fn('(t) => t / 2'), // bell improvements are 0.5x cost
      BellBonuss: fn('(t) => t * 2'), // 2x bell bonus from first bell
      BellExpPerHR: fn('(t) => t * 2'), // 2x all bell exp
      BellEXPreq: fn('(t) => t / 2'), // 0.5x bell uses cost.
      HarpNewNote_Cost: fn('(t) => t / 2'), // harp new note cost is 0.5x
      HarpNoteProduced: fn('(t) => t * 2'), // 2x harp note produced
      HarpPOWperHR: fn('(t) => t * 10'), // 10x harp power per hr
      LampWishCost: fn('(t) => t / 2'), // lamp wish cost is 0.5x
      LampWishPerDay: fn('(t) => t * 2'), // 2x lamp wish per day
      MushKillsLeft: fn('(t) => 0'), // always able to kill boss.
      J_StartCoins: fn('(t) => t * 5'), // justice start with 5x coins
      J_Happiness: fn('(t) => t * 5'), // justice start with 5x happiness
      J_Dismissals: fn('(t) => t * 5'), // justice start with 5x dismissals
      J_StartHealth: fn('(t) => t * 5'), // justice start with 5x health
      Justice_BlueChestChanceDEC: fn('(t) => 0.5'), // 50% blue chest chance. Those are really rare 0.001% its like double loot.
      // New bonuses 13.03.2024
      BolaiaStudyRate: fn('(t) => t * 2'), // 2x bolaia study rate
      JarProductionPerHR: fn('(t) => t * 2'), // 2x jar production rate
    },
    fixobj: false,
  },
  w6: {
    farming: {
      GrowthReq: fn('(t) => t / 5'), // time for plants to grow (base is 4 hours * 1.5 ^ seedtype (0 for basic, etc))
      OGunlocked: fn('(t) => t'), //if overgrowth unlocked in shop (0 -> locked, 1 -> unlocked)
      NextOGchance: fn('(t) => t * 5'), // chance to get next OG multi (5x chance)
      OGmulti: fn('(t) => (t == 1 ? 1 : Math.max(1, t * 2))'), // OG bonus multiplier (1 -> no multiplier, 2 -> 2x, 4 -> 4x, etc) minimum is 1x to prevent bricking
      PlotOwned: fn('(t) => Math.min(36, t + 2)'), // number of plots owned, additional two plots to your farm, max is 36
      MarketCostType: fn('(t) => t'), // plant type for upgrade
      MarketCostQTY: fn('(t) => Math.floor(t / 5)'), // plant amount for upgrade, t => 0 for free upgrades
      NextCropChance: fn('(t) => t * 2'), // chance to get next plant evo level (2x chance)
      CropsBonusValue: fn('(t) => t * 2'), // how much each crop is worth (2x)
      CropsOnVine: fn('(t) => t * 2'), // 2 x Num of crops on each plant
      GrowthRate: fn('(t) => t'), // Growth rate multiplier (growth increase/sec)
    },
    ninja: {
      EmporiumCost: fn('(t) => t / 5'), // emporium cost are 5x cheaper
      KOtime: fn('(t) => t / 5'), // KO time 5x shorter (lower is better)
      ActionSpd: fn('(t) => t * 2'), // Action speed 2x faster
      Stealth: fn('(t) => t * 2'), // Stealth 2x more
      DetectionDEC: fn('(t) => t / 5'), // Detection rate 5x lesser (lower is better)
      DoorMaxHP: fn('(t) => t'), // Door HP
      JadeUpgCost: fn('(t) => t'), // Jade upgrades cost 5x cheaper (lower is better), t => 0 for free upgrades
      ItemStat: fn('(t) => t * 2'), // 2x Item stats
      ItemFindOdds: fn('(t) => t * 2'), // 2x Item find rate
      PristineBon: fn('(t) => t'), // 2x Pristine Bon stats
    },
    summoning: {
      ManaStart: fn('(t) => t'), // starting mana (can be t * 2 for 2x current start or t => 10)
      ManaRegen: fn('(t) => t * 2'), // 2x mana regen rate
      UnitSpd: fn('(t) => t'), // set own unit speed
      UnitHP: fn('(t) => t * 2'), // 2x unit HP
      UnitDMG: fn('(t) => t * 2'), // 2x unit damage
      UnitDODGE: fn('(t) => Math.min(1, t * 2)'), // 2x dodge rate max of 1
      EndlessUnlocked: fn('(t) => 1'), // unlock endless mode
      SummUpgBonus: fn('(t) => t * 2'), // 2x value of all summoning upgrade bonuses
      SummRockEssGen: fn('(t) => t * 1.5'), // 1.5x essence gain for all colours
      UpgCost: fn('(t) => t / 2'), // t => 0 for free upgrades
      UnitCost: fn('(t) => Math.ceil(t / 2)'), // halved unit cost (lower is better)
      RerollCost: fn('(t) => 0'), // summon unit cost always 0
      SummEXPgain: fn('(t) => t'), // increase summoning exp gain
      EnemyHP: fn('(t) => t / 2'), // halved enemy hp
      EnemyDMG: fn('(t) => t / 2'), // halved enemy dmg
      EnemySpd: fn('(t) => t'), // set enemy unit speed
    },
    grimoire: {
      GrimoireUpgCost: fn('(t) => t / 2'), // grimoire upgrade costs are halfed, set this to 0 for free upgrades
      Grimoire_HP: fn('(t) => t * 2'),
      Grimoire_DMG: fn('(t) => t * 2'),
      Grimoire_ACC: fn('(t) => t * 2'),
      Grimoire_DEF: fn('(t) => t * 2'),
      Grimoire_CRITPCT: fn('(t) => t * 2'),
      Grimoire_CRITDMG: fn('(t) => t * 2'),
    },
    windwalker: {
      CompassUpgCost: fn('(t) => t / 2'),
      Compass_HP: fn('(t) => t * 2'),
      Compass_DMG: fn('(t) => t * 2'),
      Compass_ACC: fn('(t) => t * 2'),
      Compass_DEF: fn('(t) => t * 2'),
      Compass_CRITPCT: fn('(t) => t * 2'),
      Compass_CRITDMG: fn('(t) => t * 2'),
      Compass_MoveSpeed: fn('(t) => Math.max(300, t)'),
      TempestMultishotPCT: fn('(t) => t * 2'),
      CompassDustQTYbase: fn('(t) => t * 2'),
      TempestWepDropChance: fn('(t) => Math.max(0.1, t)'),
      TempestRingDropChance: fn('(t) => Math.max(0.1, t)'),
      TempestStoneDropChance: fn('(t) => Math.max(0.1, t)'),
      TempestMedallionDropChance: fn('(t) => 1'),
      PortalCostQTY: fn('(t) => 1'),
    // Not tested and or not interesting or maybe dangerous!
    // PortalCostType: (t) => t,
    // CompassBonus: (t) => t,
    // StampDoubler: (t) => t,
    // StampDoublersLeft: (t) => t,
    // Compass_AttackSpdPCT: (t) => t,
    // Compass_InvulnSec: (t) => t,
    // Compass_Range: (t) => t,
    // CompassUpgTotal: (t) => t,
    // TotBreedzWWz: (t) => t,
    // TotalTitanKills: (t) => t,
    // CompassDustType: (t) => t,
    // TempestWepDrop: (t) => t,
    // TempestRingDrop: (t) => t,
    // TempestWeaponXtraPowerChance: (t) => t,
    // TempestAllDropBonus: (t) => t,
    // TempestNovadustChance: (t) => t,
    // StoneChancePCT: (t) => t,
    // ExtraDust: (t) => t,
    // CompassUpgXY: (t) => t,
    // CompassTempest: (t) => t,
    // Compass_MASTERY: (t) => t,
    // TitanWeakness: (t) => t,
    // MobWeakness: (t) => t,
    // EffectAmount: (t) => t,
    // CurrentEffect: (t) => t,
    // TotalTitansKilled: (t) => t,
    // InitializeTitanHP: (t) => t,
    // TitanKillReqTown: (t) => t,
    // CanWeEnterPortal: (t) => t,
    },
    arcane: {
      ArcaneUpgCost: fn('(t) => t / 2'),
      Arcane_HP: fn('(t) => t * 2'),
      Arcane_DMG: fn('(t) => t * 2'),
      Arcane_ACC: fn('(t) => t * 2'),
      Arcane_DEF: fn('(t) => t * 2'),
      Arcane_CRITPCT: fn('(t) => t * 2'),
      Arcane_CRITDMG: fn('(t) => t * 2'),
      Arcane_AttackSpdPCT: fn('(t) => t * 2'),
      ArcaneMultishotPCT: fn('(t) => t * 2'),
      TenteyeclePCT: fn('(t) => Math.max(100, t)'), // this is the same as fully upgraded tent.
      PrismaBubDropChance: fn('(t) => t * 2'),
      WepDropChance: fn('(t) => t * 2'),
      // WepDropQuality: (t) => t, // not sure about that needs testing
      RingDropChance: fn('(t) => t * 2'),
      // RingDropQuality: (t) => t, // not sure about that needs testing
      DoubleItemDropz: fn('(t) => Math.max(100, t)'), // always double statue drops
      ExtraTachyon: fn('(t) => t * 2'),
      ExtraTachyonMulti: fn('(t) => t * 2'),
      ArcaneTachyonQTYbase: fn('(t) => t * 2'),
    // Not tested and or not interesting or maybe dangerous!
    // TesseractArcanist: (t) => t,
    // ArcaneUpgUNLOCKED: (t) => t,
    // ArcaneUpgTotal: (t) => t,
    // ArcaneUpgBonus: (t) => t,
    // ArcaneMapMulti: (t) => t,
    // ArcaneMobSpawnQTY: (t) => t,
    // CrystalChargeReq: (t) => t,
    // ArcaneMapMulti_bon: (t) => t,
    // ArcaneMapMulti_bonMAX: (t) => t,
    // Arcane_MASTERY: (t) => t,
    // TimeLeft: (t) => t,
    // KillsReq: (t) => t,
    // is_NBLB_on: (t) => t,
    // NBLB_bubbleQTY: (t) => t,
    // NBLB_bubbleLVrangeDisp: (t) => t,
    // ArcaneTachyonType: (t) => t,
    },
  },
  misc: {
    keychain: fn('(t) => t'),
  },
}; 