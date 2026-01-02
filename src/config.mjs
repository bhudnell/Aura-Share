export const MODULE = "aurashare";
export const PARENT_AURA_FLAG = "parentAuraUuid";
export const RADIUS_FLAG = "radius";
export const OPTIONS_FLAG = "flags";

export const flagLabels = {
  shareInactive: "AuraShare.Sheet.Flags.ShareInactive",
  shareEnemies: "AuraShare.Sheet.Flags.ShareEnemies",
  shareNeutral: "AuraShare.Sheet.Flags.ShareNeutral",
  shareAll: "AuraShare.Sheet.Flags.ShareAll",
  shareUnconscious: "AuraShare.Sheet.Flags.ShareUnconscious",
};

/**
 * Data structure:
 * flags: {
 *   [MODULE]: {
 *     [PARENT_AURA_FLAG]: <some id>,
 *     [RADIUS_FLAG]: <radius>,
 *     [OPTIONS_FLAG]: <['shareInactive'|'shareEnemies'|'shareNeutral'|'shareAll'|'shareUnconscious']>
 *   }
 * }
 */
