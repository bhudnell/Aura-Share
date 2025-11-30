import { checkAuras } from "./auralogic.js";
import { Settings } from "./settings.js";

const checkAurasPromisified = (scene) => Promise.resolve().then(() => checkAuras(scene));

Hooks.once("i18nInit", () => {
  Settings.registerSettings();
});

// check auras when disposition changes
Hooks.on("updateToken", (token, update, _options, _userId) => {
  if (update.disposition != null) {
    checkAurasPromisified(token.object.scene);
  }
});

// check auras when actor health changes
Hooks.on("updateActor", (actor, update, _options, _userId) => {
  if (update.system?.attributes?.hp != null) {
    checkAurasPromisified(actor.getActiveTokens()[0]?.scene);
  }
});

// check auras when buff is toggled or added/deleted when active // TODO buff radius changes
Hooks.on("pf1ToggleActorBuff", (actor, buff, _isActive) => {
  // only do for parent aura buffs
  if (buff.getItemDictionaryFlag("radius") > -1) {
    checkAurasPromisified(actor.getActiveTokens()[0]?.scene);
  }
});

Hooks.on("moveToken", (token, _movement, _operation, _user) => {
  checkAurasPromisified(token.object.scene);
});

Hooks.on("preDeleteToken", (token, _options, _userId) => {
  checkAurasPromisified(token.object.scene);
});

Hooks.on("createToken", (token, _options, _userId) => {
  checkAurasPromisified(token.object.scene);
});
