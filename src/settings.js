export class Settings {
  static registerSettings() {
    game.settings.register("aurashare", "Diehard", {
      name: game.i18n.localize("AuraShare.Diehard"),
      hint: game.i18n.localize("AuraShare.DiehardHint"),
      scope: "world",
      config: true,
      requiresReload: true,
      type: Boolean,
      default: true,
    });
    game.settings.register("aurashare", "UnconsciousAuras", {
      name: game.i18n.localize("AuraShare.UnconsciousAuras"),
      hint: game.i18n.localize("AuraShare.UnconsciousAurasHint"),
      scope: "world",
      config: true,
      requiresReload: true,
      type: Boolean,
      default: false,
    });
    game.settings.register("aurashare", "DeleteAuras", {
      name: game.i18n.localize("AuraShare.DeleteAuras"),
      hint: game.i18n.localize("AuraShare.DeleteAurasHint"),
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
    });
    game.settings.register("aurashare", "ShareZero", {
      name: game.i18n.localize("AuraShare.ShareZero"),
      hint: game.i18n.localize("AuraShare.ShareZeroHint"),
      scope: "world",
      config: true,
      requiresReload: true,
      type: Boolean,
      default: true,
    });
  }
}
