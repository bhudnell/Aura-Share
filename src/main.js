import { checkAuras, removeAura, applyAura } from "./auralogic.js";
import { Settings } from "./settings.js";

const moduleId = "aurashare";

Hooks.once("i18nInit", () => {
  Settings.registerSettings();
});

Hooks.on("updateActor", (actor, update, _options, _userId) => {
  // todo actor health change
  if (update.system?.attributes?.hp !== undefined) {
    console.warn(update);
  }
});

Hooks.on("pf1ToggleActorBuff", (actor, itemData, isActive) => {
  if (isActive) {
    applyAura(itemData);
  } else {
    removeAura(itemData);
  }
});

Hooks.once("libWrapper.Ready", () => {
  console.log(`${moduleId} | Registering LibWrapper Hooks`);

  libWrapper.register(
    moduleId,
    "CONFIG.Scene.documentClass.prototype.prepareData",
    function (wrapper) {
      wrapper();
      Promise.resolve().then(() => {
        checkAuras(this);
      });
    },
    libWrapper.WRAPPER
  );
});

Hooks.once("ready", () => {
  if (!game.modules.get("lib-wrapper")?.active && game.user.isGM) {
    ui.notifications.error("AuraShare.LibWrapperError", { localize: true });
  }
});
