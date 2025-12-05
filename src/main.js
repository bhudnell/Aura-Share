import { checkAuras } from "./auralogic.js";
import { flagLabels } from "./config.mjs";
import { migrate } from "./migration.mjs";
import { renderItemSheetAuraEditor } from "./renderItemSheetAuraEditor.mjs";
import { Settings } from "./settings.js";

Hooks.once("i18nInit", () => {
  Settings.registerSettings();

  // translate these object keys
  for (const key of Object.keys(flagLabels)) {
    flagLabels[key] = game.i18n.localize(flagLabels[key]);
  }
});

Hooks.once("init", () => {
  pf1.config.auraShareFlagLabels = flagLabels;
});

Hooks.once("pf1PostReady", () => migrate());

Hooks.on("renderItemSheetPF", renderItemSheetAuraEditor);

/**
 * CHECK AURA TRIGGER STUFF BELOW
 */
const checkAurasPromisified = (scene) => Promise.resolve().then(() => checkAuras(scene));

// check auras when actor health changes
Hooks.on("updateActor", (actor, update, _options, _userId) => {
  if (update.system?.attributes?.hp != null) {
    checkAurasPromisified(actor.getActiveTokens()[0]?.scene);
  }
});

// check auras when token moves, token elevation changes, or scene loads
Hooks.on("moveToken", (token, _movement, _operation, _user) => {
  checkAurasPromisified(token.object.scene);
});

// check auras when token created
Hooks.on("createToken", (token, _options, _userId) => {
  checkAurasPromisified(token.object.scene);
});

// check auras when disposition changes
Hooks.on("updateToken", (token, update, _options, _userId) => {
  if (update.disposition != null) {
    checkAurasPromisified(token.object.scene);
  }
});

// check auras when token deleted
Hooks.on("preDeleteToken", (token, _options, _userId) => {
  checkAurasPromisified(token.object.scene);
});

// check auras when parent aura is created
Hooks.on("createItem", (item, _options, _userId) => {
  if (item.actor && item.type === "buff" && item.getItemDictionaryFlag("radius") > -1) {
    checkAurasPromisified(item.actor.getActiveTokens()[0]?.scene);
  }
});

// check auras when aura radius changes or aura is toggled
Hooks.on("updateItem", (item, update, _options, _userId) => {
  if (
    item.actor &&
    item.type === "buff" &&
    (update.system?.active != null || update.system?.flags?.dictionary?.radius != null)
  ) {
    checkAurasPromisified(item.actor.getActiveTokens()[0]?.scene);
  }
});

// check auras when parent aura is deleted
Hooks.on("preDeleteItem", (item, _options, _userId) => {
  if (item.actor && item.type === "buff" && item.getItemDictionaryFlag("radius") > -1) {
    checkAurasPromisified(item.actor.getActiveTokens()[0]?.scene);
  }
});
