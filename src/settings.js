import { MODULE } from "./config.mjs";

export class Settings {
  static registerSettings() {
    game.settings.register(MODULE, "Diehard", {
      name: game.i18n.localize("AuraShare.Settings.Diehard"),
      hint: game.i18n.localize("AuraShare.Settings.DiehardHint"),
      scope: "world",
      config: true,
      requiresReload: true,
      type: Boolean,
      default: true,
    });
    game.settings.register(MODULE, "UnconsciousAuras", {
      name: game.i18n.localize("AuraShare.Settings.UnconsciousAuras"),
      hint: game.i18n.localize("AuraShare.Settings.UnconsciousAurasHint"),
      scope: "world",
      config: true,
      requiresReload: true,
      type: Boolean,
      default: false,
    });
    game.settings.register(MODULE, "DeleteAuras", {
      name: game.i18n.localize("AuraShare.Settings.DeleteAuras"),
      hint: game.i18n.localize("AuraShare.Settings.DeleteAurasHint"),
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
    });
    game.settings.register(MODULE, "ShareZero", {
      name: game.i18n.localize("AuraShare.Settings.ShareZero"),
      hint: game.i18n.localize("AuraShare.Settings.ShareZeroHint"),
      scope: "world",
      config: true,
      requiresReload: true,
      type: Boolean,
      default: true,
    });
    game.settings.register(MODULE, "migration", {
      scope: "world",
      config: false,
      type: Number,
      default: 0,
    });
  }
}
