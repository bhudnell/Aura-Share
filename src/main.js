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

// check auras when buff is toggled or added/deleted when active
Hooks.on("pf1ToggleActorBuff", (actor, buff, _isActive) => {
  // only do for parent aura buffs
  if (buff.getItemDictionaryFlag("radius") > -1) {
    checkAurasPromisified(actor.getActiveTokens()[0]?.scene);
  }
});

// check auras when token moves, token elevation changes, or scene loads
Hooks.on("moveToken", (token, _movement, _operation, _user) => {
  // TODO see if "updateToken" hook works too to keep things v12 compatible (other than 3d distance)
  checkAurasPromisified(token.object.scene);
});

// check auras when token deleted
Hooks.on("preDeleteToken", (token, _options, _userId) => {
  checkAurasPromisified(token.object.scene);
});

// check auras when token created
Hooks.on("createToken", (token, _options, _userId) => {
  checkAurasPromisified(token.object.scene);
});

// check auras when buff radius changes
Hooks.on("updateItem", (item, update, _options, _userId) => {
  if (item.actor && item.type === "buff" && update.system?.flags?.dictionary?.radius != null) {
    checkAurasPromisified(item.actor.getActiveTokens()[0]?.scene);
  }
});

/**
 * TODOS:
 * go away from system flags and use foundry flags with a UI (stretch goal)
 *
 * test flags:
 * - shareInactive
 * - shareEnemies
 * - shareNeutral
 * - shareAll
 * - shareUnconcious
 */
