const MODULE = "aurashare";
const PARENT_FLAG = "parentAuraId";

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
    const actors = new Set(
      scene.tokens.contents.flatMap((t) => (primaryUpdater(t.actor) === game.user ? t.actor : []))
    );

    const { parentAuras, childAuras } = collectAllAuras(actors);

    // Maps: actorId -> Set(itemId)
    const aurasToDelete = new Map();
    const aurasToCreate = new Map();

    // Index parent auras by ID for quick lookup
    const parentAurasById = new Map(parentAuras.map((a) => [a.id, a]));

    // cleanup child auras
    for (const childAura of childAuras) {
      const childActor = childAura.actor;

      const parentAuraId = childAura.getFlag(MODULE, PARENT_FLAG);
      if (!parentAuraId) {
        // orphaned child aura → delete it
        if (!aurasToDelete.has(childActor.uuid)) {
          aurasToDelete.set(childActor.uuid, new Set());
        }
        aurasToDelete.get(childActor.uuid).add(childAura.id);
        continue;
      }

      const parentAura = parentAurasById.get(parentAuraId);
      if (!parentAura) {
        // parent no longer exists → delete child
        if (!aurasToDelete.has(childActor.uuid)) {
          aurasToDelete.set(childActor.uuid, new Set());
        }
        aurasToDelete.get(childActor.uuid).add(childAura.id);
        continue;
      }

      const parentActor = parentAura.actor;

      const stillInRange = actorsInRange(parentActor, childActor, parentAura);
      if (!stillInRange) {
        if (!aurasToDelete.has(childActor.uuid)) {
          aurasToDelete.set(childActor.uuid, new Set());
        }
        aurasToDelete.get(childActor.uuid).add(childAura.id);
      }
    }

    // create child auras for each parent aura
    for (const parentAura of parentAuras) {
      const parentActor = parentAura.actor;

      // All other actors
      for (const targetActor of actors) {
        if (targetActor.uuid === parentActor.uuid) {
          continue;
        }

        const inRange = actorsInRange(parentActor, targetActor, parentAura);

        const existingChild = targetActor.itemTypes.buff.find(
          (i) => i.getItemDictionaryFlag("radius") === -1 && i.getFlag(MODULE, PARENT_FLAG) === parentAura.id
        );

        if (inRange && !existingChild) {
          // Need to create child aura
          if (!aurasToCreate.has(targetActor.uuid)) {
            aurasToCreate.set(targetActor.uuid, new Set());
          }
          aurasToCreate.get(targetActor.uuid).add(parentAura.id);
        }

        if (!inRange && existingChild) {
          // Need to delete child aura
          if (!aurasToDelete.has(targetActor.uuid)) {
            aurasToDelete.set(targetActor.uuid, new Set());
          }
          aurasToDelete.get(targetActor.uuid).add(existingChild.id);
        }
      }
    }

    // update the actors -> delete then create
    await Promise.all(
      Array.from(aurasToDelete, ([actorUuid, itemIds]) => {
        const actor = fromUuidSync(actorUuid);
        return actor.deleteEmbeddedDocuments("Item", [...itemIds]);
      })
    );

    await Promise.all(
      Array.from(aurasToCreate, ([actorUuid, parentIds]) => {
        const actor = fromUuidSync(actorUuid);
        const itemsToCreate = [...parentIds].map((pid) => generateChildAura(parentAurasById.get(pid)));
        return actor.createEmbeddedDocuments("Item", itemsToCreate);
      })
    );
  } finally {
    lock.release();
  }
}, 100);

function actorsInRange(parentActor, targetActor, aura) {
  const parentTokens = parentActor.getActiveTokens();
  const targetTokens = targetActor.getActiveTokens();
  const radius = aura.getItemDictionaryFlag("radius");

  if (!parentTokens.length || !targetTokens.length) {
    return false;
  }

  for (const pt of parentTokens) {
    for (const tt of targetTokens) {
      const d = measureTokenDistance(pt.document, tt.document);
      if (d <= radius && validateDisposition(pt.document, tt.document, aura)) {
        return true;
      }
    }
  }
  return false;
}

function collectAllAuras(actors) {
  const parentAuras = [];
  const childAuras = [];

  for (const actor of actors) {
    for (const item of actor.itemTypes.buff) {
      const radius = item.getItemDictionaryFlag("radius");
      if (radius === -1) {
        childAuras.push(item);
      } else if (
        radius > -1 &&
        (item.system.active || item.hasItemBooleanFlag("shareInactive")) &&
        canShareAura(actor, item)
      ) {
        parentAuras.push(item);
      }
    }
  }

  return { parentAuras, childAuras };
}

function measureTokenDistance(a, b) {
  const { size: gs, distance: gd } = canvas.dimensions;

  const aReal = a.movement.destination;
  const bReal = b.movement.destination;

  // get min x distance between the two
  let ax = aReal.x;
  let bx = bReal.x;
  if (ax + aReal.width * gs <= bx) {
    ax += (aReal.width - 1) * gs;
  } else if (ax >= bx + bReal.width * gs) {
    bx += (bReal.width - 1) * gs;
  } else {
    bx = ax;
  }

  // get min y distance between the two
  let ay = aReal.y;
  let by = bReal.y;
  if (ay + aReal.height * gs <= by) {
    ay += (aReal.height - 1) * gs;
  } else if (ay >= by + bReal.height * gs) {
    by += (bReal.height - 1) * gs;
  } else {
    by = ay;
  }

  // get the z distance between the two
  let az = aReal.elevation;
  let bz = bReal.elevation;
  if (az + Math.max(aReal.width, aReal.height) * gd <= bz) {
    az += (Math.max(aReal.width, aReal.height) - 1) * gd;
  } else if (az >= bz + Math.max(bReal.width, bReal.height) * gd) {
    bz += (Math.max(bReal.width, bReal.height) - 1) * gd;
  } else {
    bz = az;
  }

  // they overlap so distance is 0
  if (ax === bx && ay === by && az === bz) {
    return 0;
  }

  return canvas.grid.measurePath([
    { x: ax, y: ay, elevation: az },
    { x: bx, y: by, elevation: bz },
  ]).distance;
}

function generateChildAura(parentAura) {
  const parentActor = parentAura.actor;
  const newAura = parentAura.toObject();

  // replaces @ references to parent rollData with their current values
  const rollData = parentActor.getRollData();
  newAura.system.changes.forEach((c) => {
    c.formula = Roll.replaceFormulaData(c.formula, rollData);
  });
  if (newAura.system.duration.value) {
    newAura.system.duration.value = Roll.replaceFormulaData(newAura.system.duration.value, rollData);
  }

  newAura.flags[MODULE] = { [PARENT_FLAG]: parentAura.id };
  newAura.name = parentAura.name + " (" + parentActor.name + ")";
  newAura.system.identifiedName = parentAura.name + " (" + parentActor.name + ")";
  newAura.system.flags.dictionary.radius = -1;
  newAura.system.active = true;
  newAura.system.buffType = "temp";
  return newAura;
}

function validateDisposition(parentToken, childToken, aura) {
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

function canHaveAuras(scene) {
  return scene.grid.type === CONST.GRID_TYPES.SQUARE;
}

function isInFocus(scene) {
  const soleUserIsGM = game.user.isGM && game.users.filter((u) => u.active).length === 1;
  return (scene.active && !soleUserIsGM) || (scene.isView && soleUserIsGM);
}
