let auraCheckLock = Promise.resolve();

export const checkAuras = foundry.utils.debounce(async function (scene) {
  if (!(canvas.ready && isInFocus(scene) && canHaveAuras(scene))) {
    return;
  }

  await auraCheckLock;
  const lock = { release: () => {} };
  auraCheckLock = new Promise((resolve) => {
    lock.release = resolve;
  });

  try {
    // Get all tokens in the scene, excluding additional tokens linked to a common actor
    // const tokens = scene.tokens.reduce((list, token) => {
    //   if (token.isLinked && list.some((t) => t.actor === token.actor)) {
    //     return list;
    //   }
    //   list.push(token);
    //   return list;
    // }, []);
    const tokens = scene.tokens.contents;

    // Wait for any token animation to finish
    await Promise.all(tokens.map((token) => animation(token.object)));

    for (const { parentToken, parentAura } of tokens.flatMap((t) =>
      t.actor.itemTypes.buff
        .filter(
          (aura) =>
            aura.system.flags.dictionary.radius != null &&
            (aura.system.active || aura.hasItemBooleanFlag("shareInactive")) &&
            canShareAura(t.actor, aura)
        )
        .map((aura) => ({ parentToken: t, parentAura: aura }))
    )) {
      // eslint-disable-next-line no-await-in-loop
      await notifyActors(parentToken, parentAura);
    }
  } finally {
    lock.release();
  }
}, 100);

export function removeAura(aura) {
  if (game.settings.get("aurashare", "DeleteAuras")) {
    const tokens = aura.actor.getActiveTokens()[0]?.scene.tokens.contents ?? [];
    for (const token of tokens) {
      const auraToDelete = token.ac;
    }
  } else {
    // TODO
  }
}

export function applyAura(aura) {}

async function notifyActors(parentToken, parentAura) {
  if (!isInFocus(parentToken.object.scene)) {
    return;
  }

  const auraActor = parentAura.actor;
  const radius = parentAura.getItemDictionaryFlag("radius");
  const tokensInAura = parentToken.object.scene.tokens.filter(
    (t) => primaryUpdater(t.actor) === game.user && radius >= measureTokenDistance(t, parentToken)
  );

  const affectedActors = new Set(tokensInAura.flatMap((t) => t.actor ?? []));

  const origin = { actor: auraActor, token: parentToken };
  for (const actor of affectedActors) {
    // TODO
    console.warn(actor);
  }
}

function measureTokenDistance(a, b) {
  const gs = canvas.dimensions.size;

  // get min x distance between the two
  let ax = a.x;
  let bx = b.x;
  if (ax + a.width * gs <= bx) {
    ax += (a.width - 1) * gs;
  } else if (ax >= bx + b.width * gs) {
    bx += (b.width - 1) * gs;
  } else {
    bx = ax;
  }

  // get min y distance between the two
  let ay = a.y;
  let by = b.y;
  if (ay + a.height * gs <= by) {
    ay += (a.height - 1) * gs;
  } else if (ay >= by + b.height * gs) {
    by += (b.height - 1) * gs;
  } else {
    by = ay;
  }

  // they overlap so distance is 0
  if (ax === bx && ay === by) {
    return 0;
  }

  return canvas.grid.measurePath([
    { x: ax, y: ay },
    { x: bx, y: by },
  ]).distance;
}

function generateChildAura(activeActor, parentAura) {
  const newAura = parentAura.toObject();

  // replaces @ references to parent rollData with their current values
  const rollData = activeActor.getRollData();
  newAura.system.changes.forEach((c) => {
    c.formula = Roll.replaceFormulaData(c.formula, rollData);
  });
  if (newAura.system.duration.value) {
    newAura.system.duration.value = Roll.replaceFormulaData(newAura.system.duration.value, rollData);
  }

  newAura.flags.aurashare = { parentAuraId: parentAura.id };
  newAura.name = parentAura.name + " (" + activeActor.name + ")";
  newAura.system.identifiedName = parentAura.name + " (" + activeActor.name + ")";
  newAura.system.flags.dictionary.radius = -1;
  newAura.system.active = true;
  newAura.system.buffType = "temp";
  return newAura;
}

function validateDisposition(childToken, parentToken, aura) {
  // everyone
  if (aura.hasItemBooleanFlag("shareAll")) {
    return true;
  }

  // neutral
  const childTokenDisposition = childToken.disposition;
  if (aura.hasItemBooleanFlag("shareNeutral") && childTokenDisposition === 0) {
    return true;
  }

  const parentTokenDisposition = parentToken.disposition;
  const hostileAura = aura.hasItemBooleanFlag("shareEnemies");
  //Enemies
  if (hostileAura) {
    return parentTokenDisposition === -childTokenDisposition;
  }
  //Allies
  return parentTokenDisposition === childTokenDisposition;
}

function canShareAura(actor, aura) {
  if (aura.hasItemBooleanFlag("shareUnconscious")) {
    return true;
  }
  if (game.settings.get("aurashare", "UnconsciousAuras")) {
    return true;
  }

  const shareThreshold = game.settings.get("aurashare", "ShareZero") ? 0 : 1;
  const hp = actor.system.attributes.hp.value;
  return hp >= shareThreshold || dieHardCheck(actor);
}

function dieHardCheck(actor) {
  const diehardEnabled = game.settings.get("aurashare", "Diehard");
  if (!diehardEnabled) {
    return false;
  }

  const hasDiehardKey = !!actor.items.find(
    (i) => (i._stats.compendiumSource ?? i.flags.core?.sourceId) === "Compendium.pf1.feats.Item.O0e0UCim27GPKFuW"
  );
  return !!actor.items.getName("Diehard") || hasDiehardKey;
}

// TODO what to do with this?
function primaryUpdater(actor) {
  // 1. The first active GM, sorted by ID
  const { activeGM } = game.users;
  if (activeGM) {
    return activeGM;
  }

  const activeUsers = game.users.filter((u) => u.active);
  // 2. The user with this actor assigned
  const primaryPlayer = actor.isToken ? null : activeUsers.find((u) => u.character?.id === actor.id);
  if (primaryPlayer) {
    return primaryPlayer;
  }

  // 3. Anyone who can update the actor
  const firstUpdater = game.users
    .filter((u) => actor.canUserModify(u, "update"))
    .sort((a, b) => (a.id > b.id ? 1 : -1))
    .shift();
  return firstUpdater ?? null;
}

function animation(tokenObj) {
  return (
    tokenObj?.animationContexts.get(tokenObj.animationName)?.promise ??
    tokenObj?.animationContexts.get(tokenObj.movementAnimationName)?.promise ??
    null
  );
}

function canHaveAuras(scene) {
  return scene.grid.type === CONST.GRID_TYPES.SQUARE;
}

function isInFocus(scene) {
  const soleUserIsGM = game.user.isGM && game.users.filter((u) => u.active).length === 1;
  return (scene.active && !soleUserIsGM) || (scene.isView && soleUserIsGM);
}
