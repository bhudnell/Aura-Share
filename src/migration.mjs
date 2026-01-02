/* eslint-disable no-await-in-loop */
import { flagLabels, MODULE, OPTIONS_FLAG, PARENT_AURA_FLAG, RADIUS_FLAG } from "./config.mjs";

const truthiness = (x) => (typeof x === "string" ? !!x?.trim() : !!x);

function log(msg) {
  console.log(`${MODULE} - ${msg}`);
}

class Migration {
  static getItemUpdateData(item) {
    if (item.type === "buff") {
      const radius = item.getItemDictionaryFlag("radius");
      if (radius != null) {
        const oldFlags = item.getItemBooleanFlags();
        const newFlags = Object.keys(flagLabels).filter((flag) => oldFlags.includes(flag));

        const update = {
          _id: item.id,
          system: {
            flags: {
              dictionary: {
                "-=radius": null,
              },
              boolean: {
                "-=shareInactive": null,
                "-=shareEnemies": null,
                "-=shareNeutral": null,
                "-=shareAll": null,
                "-=shareUnconscious": null,
              },
            },
          },
          flags: {
            [MODULE]: {},
          },
        };

        if (radius === -1) {
          // this aura will be deleted and remade with the correct parent aura id but this is needed to mark it as a child aura
          update.flags[MODULE][PARENT_AURA_FLAG] = "fakeParentAuraId";
        } else {
          update.flags[MODULE][RADIUS_FLAG] = radius;
        }

        if (radius > -1 && newFlags.length) {
          update.flags[MODULE][OPTIONS_FLAG] = newFlags;
        }

        return update;
      }
    }
  }

  static async migrateActor(actor) {
    log(`migrating items for actor '${actor?.name}'`);

    if (actor?.items?.size) {
      const updates = actor.items.map(this.getItemUpdateData).filter(truthiness);
      if (updates.length) {
        await actor.updateEmbeddedDocuments("Item", updates);
      }
    }

    log("...finished migrating actor");
  }

  static async migrateWorldItems() {
    log("migrating game items");

    await game.items?.updateAll((item) => this.getItemUpdateData(item) || {});

    log("...finished migrating game items");
  }

  static async migratePacks() {
    log("migrating unlocked packs");

    for (const pack of game.packs.filter((x) => x.documentName === "Item" && !x.locked)) {
      await pack.updateAll((item) => this.getItemUpdateData(item) || {});
    }

    for (const pack of game.packs.filter((x) => x.documentName === "Actor" && !x.locked)) {
      const actors = await pack.getDocuments();
      for (const actor of actors) {
        await this.migrateActor(actor);
      }
    }

    log("...finished migrating unlocked packs");
  }

  static async migrateWorldActors() {
    log("migrating world actors");

    for (const actor of game.actors) {
      await this.migrateActor(actor);
    }

    log("...finished migrating world actors");
  }

  static async migrateSyntheticActors() {
    log("migrating synthetic actors");

    const synthetics = [...game.scenes].flatMap((s) =>
      [...s.tokens].filter((t) => !t.isLinked && t.actor?.items?.size)
    );
    for (const synthetic of synthetics) {
      if (synthetic.actor) {
        await this.migrateActor(synthetic.actor);
      }
    }

    log("...finished migrating synthetic actors");
  }

  static async migrateWorld() {
    await this.migrateWorldItems();
    await this.migratePacks();
    await this.migrateWorldActors();
    await this.migrateSyntheticActors();
  }
}

export async function migrate() {
  if (!game.users.activeGM?.isSelf) {
    return;
  }

  const migration = game.settings.get(MODULE, "migration");
  if (migration === 1) {
    return;
  }

  await Migration.migrateWorld();

  game.settings.set(MODULE, "migration", 1);
}
