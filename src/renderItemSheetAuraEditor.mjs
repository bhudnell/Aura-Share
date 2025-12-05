import { flagLabels, OPTIONS_FLAG, MODULE, RADIUS_FLAG } from "./config.mjs";

export async function renderItemSheetAuraEditor(sheet, [html], options) {
  if (!options.editable) {
    return;
  }

  const item = sheet.document;
  if (item?.type !== "buff") {
    return;
  }

  const tab = html.querySelector('.tab[data-tab="advanced"]');
  if (!tab) {
    return;
  }

  const checkedFlags = item.getFlag(MODULE, OPTIONS_FLAG) ?? [];
  const templateData = {
    radius: item.getFlag(MODULE, RADIUS_FLAG),
    flags: checkedFlags.map((flag) => flagLabels[flag]),
    flagDataPath: `flags.${MODULE}.${OPTIONS_FLAG}`,
  };

  const renderedHTML = await renderTemplate(`modules/${MODULE}/templates/editor.hbs`, templateData);
  const d = document.createElement("div");
  d.innerHTML = renderedHTML;

  const radiusInput = d.querySelector(".aura-share-radius");
  const flagInput = d.querySelector(".aura-share-flag-selector");

  tab.append(...d.children);

  const saveRadius = async (e) => {
    e.preventDefault();

    const radius = e.target.value;
    if (radius) {
      item.setFlag(MODULE, RADIUS_FLAG, Number(radius));
    } else {
      item.unsetFlag(MODULE, RADIUS_FLAG);
    }
  };

  radiusInput.addEventListener("change", saveRadius);
  flagInput.addEventListener("click", sheet._onTraitSelector.bind(sheet));
}
