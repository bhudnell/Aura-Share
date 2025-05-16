import { AuraLogic } from "./auralogic.js";
import { Settings } from "./settings.js";
import { Utils } from "./utils.js";

let sceneTokens = [];
//to prevent over looping tokens are handled here.

Hooks.once("i18nInit", () => {
  Settings.registerSettings();
});

Hooks.on("canvasInit", (_canvas) => {
  if (Utils.shouldHandle()) {
    sceneTokens.length = 0;
    sceneTokens = Utils.createTokenArray();
  }
});

Hooks.on("canvasReady", (_canvas) => {
  if (Utils.shouldHandle()) {
    sceneTokens.length = 0;
    sceneTokens = Utils.createTokenArray();
  }
});

Hooks.on("canvasTeardown", (_canvas) => {
  if (Utils.shouldHandle()) {
    sceneTokens.length = 0;
    return;
  }
});

Hooks.on("updateToken", (token, update, _options, _userId) => {
  if (Utils.shouldHandle() && ("x" in update || "y" in update || "disposition" in update)) {
    sceneTokens = Utils.createTokenArray();
    AuraLogic.tradeAuras(token, sceneTokens, false);
  }
});

Hooks.on("updateActor", (actor, update, _options, _userId) => {
  if (Utils.shouldHandle() && update.system?.attributes?.hp !== undefined) {
    if (sceneTokens?.length < 1) {
      sceneTokens.length = 0;
      sceneTokens = Utils.createTokenArray();
    }
    let tokens = actor.getActiveTokens();
    if (tokens?.length > 0) {
      let token = tokens[0].document;
      AuraLogic.tradeAuras(token, sceneTokens, false);
    }
  }
});

Hooks.on("preDeleteToken", (token, _options, _userId) => {
  if (Utils.shouldHandle()) {
    AuraLogic.clearInheritedAuras(token, sceneTokens);
  }
});

Hooks.on("deleteToken", (token, _options, _userId) => {
  if (Utils.shouldHandle()) {
    sceneTokens.length = 0;
    sceneTokens = Utils.createTokenArray(token);
  }
});

Hooks.on("createToken", (token, _options, _userId) => {
  if (Utils.shouldHandle()) {
    if (!sceneTokens[0]) {
      sceneTokens.length = 0;
      sceneTokens = Utils.createTokenArray();
    }
    AuraLogic.tradeAuras(token, sceneTokens);
  }
});

Hooks.on("pf1ToggleActorBuff", (actor, itemData) => {
  if (Utils.shouldHandle() && itemData.getItemDictionaryFlag("radius") > 0) {
    if (sceneTokens?.length < 1) {
      sceneTokens.length = 0;
      sceneTokens = Utils.createTokenArray();
    }
    let tokens = actor.getActiveTokens();
    if (tokens?.length > 0) {
      let token = tokens[0].document;
      AuraLogic.tradeAuras(token, sceneTokens);
    }
  }
});
