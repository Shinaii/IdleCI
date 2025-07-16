/****************************************************************************************************
 *	This file is an example of how to create a custom config file. Make a copy of this file called config.custom.js and edit it to your liking.
	It's done this way so that you can update the injector without losing your custom config.

 * 	Add any cheats you want to run on startup here. A reasonable starting point is given, but you can add/remove 
	any cheats you want each on a new line in single quotes, separated by commas. 
	For example, if you want to unlock the quickref, add the line 
	'unlock quickref', 
	to the list below.
 */

exports.startupCheats = [
	'multiply afk 2',
	'multiply printer 6',
	'godlike food',
	'godlike intervention',
	'talent 168',
	'talent 169',
	'unlock',
	'upstones rng',
	'wide mtx',
	'wide star',
	'wide candy',
	'wide perfectobols',
	'wide autoloot',
	'wide plunderous',
	'minigame',
	'cauldron vialrng',
	'w3 prayer',
	'w3 freeworship',
	'w3 book',
	'w3 globalshrines',
	'w3 trapping',
	'w4 petrng',
	'w4 labpx',
	'w4 arena',
	'w4 petchance',
	'w4 mainframe',
	'w4 chipbonuses',
	'w4 fastforaging',
	'w4 spiceclaim',
	'w5',
	'w6',
	'nomore ^InvBag.*', // inventory bags
	'nomore ^InvStorage.*', // chests
	'nomore ^Obol([Bronze|Silver|Gold]).*', // bronze, silver, gold obols
];

/****************************************************************************************************
 * 	This is configuration for some of the cheats. You can change the values to suit your needs.
	Configurations that use functions (ie start with t =>) will be passed the current value of the variable, and should return the new value.
	If you change those, just make sure you leave the t => part at the start. Over time I will be trying to make most of the cheats configurable in this way where it makes sense.
	You can also change configuration on the fly, by typing the cheat name into the console, followed by the configuration you want to change eg
	Typing 'wide autoloot hidenotifications false' will disable the hidenotifications option for the wide autoloot cheat.
 */
exports.cheatConfig = {
	wide: {
		autoloot: {
			hidenotifications: false,
		},
	},
	w5: {
		gaming: {
			FertilizerUpgCosts: t => t * 0.8, // fertilizer upgrades reduced by 20%
			SproutCapacity: t => Math.max(22, t + 2), // 2 more sprout slots, or 22 if that's higher
			MutateUpgCosts: t => t * 0.8, // mutate upgrade costs reduced by 20%
			LogBookBitBonus: t => Math.max(20, t * 2), // 2x logbook bits bonus, or 20 if that's higher
			GamingExpPCT: t => t * 1.5, // 1.5x gaming exp
			NewMutantChanceDEC: t => 1, // new mutant guaranteed
			SproutGrowthCHANCEperMUT: t => t, // could be a bit fiddly, i assume this gives the chance of each plant type growing
			SproutGrowthTime: t => t / 5, // sprouts grow 5x faster
			SaveSprinkler: t => t * 1.1, // Don't use water when using the sprinkler. 1 is a guarantee
			ImportItemCOST: t => t * 0.8, // import items are 20% cheaper
			AcornShopCost: t => t * 0.8, //acorn shop upgrades are 20% cheaper
			BoxCost: t => t * 0.8, //new boxes are 20% cheaper
		},
	},
	w6: {
		farming: {
			GrowthReq: t => t / 5, // time for plants to grow (base is 4 hours * 1.5 ^ seedtype (0 for basic, etc))
			OGunlocked: t => t, //if overgrowth unlocked in shop (0 -> locked, 1 -> unlocked)
			NextOGchance: t => t * 5, // chance to get next OG multi (5x chance)
			OGmulti: t => t == 1 ? 1 : Math.max(1, t * 2), // OG bonus multiplier (1 -> no multiplier, 2 -> 2x, 4 -> 4x, etc) minimum is 1x to prevent bricking
			PlotOwned: t => Math.min(36, t + 2), // number of plots owned, additional two plots to your farm, max is 36
			MarketCostType: t => t, // plant type for upgrade
			MarketCostQTY: t => Math.floor(t / 5), // plant amount for upgrade, t => 0 for free upgrades
			NextCropChance: t => t * 2, // chance to get next plant evo level (2x chance)
			CropsBonusValue: t => t * 2, // how much each crop is worth (2x)
			CropsOnVine: t => t * 2, // 2 x Num of crops on each plant
			GrowthRate: t => t, // Growth rate multiplier (growth increase/sec)
		},
		ninja: {
			EmporiumCost: t => t / 5, // emporium cost are 5x cheaper
			KOtime: t => t / 5, // KO time 5x shorter (lower is better)
			ActionSpd: t => t * 2, // Action speed 2x faster
			Stealth: t => t * 2, // Stealth 2x more
			DetectionDEC: t => t / 5, // Detection rate 5x lesser (lower is better)
			DoorMaxHP: t => t, // Door HP 
			JadeUpgCost: t => t, // Jade upgrades cost 5x cheaper (lower is better), t => 0 for free upgrades
			ItemStat: t => t * 2, // 2x Item stats
			ItemFindOdds: t => t * 2, // 2x Item find rate
			PristineBon: t => t, // 1.2x Pristine Bon stats (WARNING don't over multiply in case of shadow ban due to too high drop rate)	
		},
		summoning: {
			ManaStart: t => t, // starting mana (can be t * 2 for 2x current start or t => 10)
			ManaRegen: t => t * 2, // 2x mana regen rate
			UnitSpd: t => t, // set own unit speed
			UnitHP: t => t * 2, // 2x unit HP
			UnitDMG: t => t * 2, // 2x unit damage
			UnitDODGE: t => Math.min(1, t * 2), // 2x dodge rate max of 1
			SummUpgBonus: t => t * 2, // 2x value of all summoning upgrade bonuses
			SummRockEssGen: t => t * 1.5, // 1.5x essence gain for all colours
			UpgCost: t => t / 2, // t => 0 for free upgrades
			UnitCost: t => Math.ceil(t / 2), // halved unit cost (lower is better)
			RerollCost: t => 0, // summon unit cost always 0
			SummEXPgain: t => t, // increase summoning exp gain
			EnemyHP: t => t / 2, // halved enemy hp
			EnemyDMG: t => t / 2, // halved enemy dmg
			EnemySpd: t => t, // set enemy unit speed
		}
	},
};

/****************************************************************************************************
	Finally some injector config. The only thing you might need to change here is chromePath, which should be the path to your chrome.exe file.
*/
exports.injectorConfig = {
	customUIPort: 1293,
};