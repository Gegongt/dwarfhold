
import type { ColonyState } from "./types";

// D5: Save configuration.
const SAVE_KEY = "dwarfhold-save";
const SAVE_VERSION = 2;

function isAmount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

// D5: Validate saved colony data.
function isValidState(state: ColonyState): boolean {
  if (
    !state ||
    !isAmount(state.day) ||
    state.day < 1 ||
    !state.resources ||
    !Array.isArray(state.colonists) ||
    state.colonists.length === 0 ||
    typeof state.foodShortage !== "boolean"
  ) {
    return false;
  }

  const validResources = [
    state.resources.wood,
    state.resources.stone,
    state.resources.food,
    state.resources.tools,
    state.resources.weapons,
  ].every(isAmount);

  const validColonists = state.colonists.every((colonist) =>
    colonist &&
    typeof colonist.id === "string" &&
    typeof colonist.name === "string" &&
    typeof colonist.title === "string" &&
    typeof colonist.icon === "string" &&
    ["dwarf", "ghoul"].includes(colonist.species) &&
    ["idle", "working", "expedition", "crafting"].includes(colonist.status) &&
    [null, "woodcutting", "mining", "farming"].includes(colonist.assignment) &&
    (colonist.specialty === undefined ||
      ["woodcutting", "mining", "farming"].includes(colonist.specialty)) &&
    (colonist.equippedTool === undefined ||
      typeof colonist.equippedTool === "boolean") &&
    (colonist.status !== "working" || colonist.assignment !== null) &&
    (colonist.status !== "idle" || colonist.assignment === null) &&
    (colonist.status === "crafting"
      ? colonist.crafting &&
        ["tools", "weapons"].includes(colonist.crafting.item) &&
        !(colonist.species === "ghoul" &&
          colonist.crafting.item === "weapons") &&
        isAmount(colonist.crafting.completesOnDay) &&
        colonist.crafting.completesOnDay > state.day
      : colonist.crafting === undefined)
  );

  const uniqueIds =
    new Set(state.colonists.map((colonist) => colonist.id)).size ===
    state.colonists.length;

  const raid = state.lastRaid;

  const validRaid =
    raid === undefined ||
    (
      raid !== null &&
      typeof raid.defended === "boolean" &&
      typeof raid.defenseChance === "number" &&
      raid.defenseChance >= 0 &&
      raid.defenseChance <= 100 &&
      [
        raid.usedWeapons,
        raid.gainedWood,
        raid.gainedStone,
        raid.gainedWeapons,
        raid.lostWood,
        raid.lostStone,
        raid.lostFood,
      ].every(isAmount)
    );

  return validResources && validColonists && uniqueIds && validRaid;
}

// D5: Save the current colony state.
export function saveColony(state: ColonyState) {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        colony: state,
      })
    );
  } catch {
    console.warn("Could not save the colony.");
  }
}

// D5: Restore a saved colony or use the initial state.
export function loadColony(initialState: ColonyState): ColonyState {
  try {
    const saved = localStorage.getItem(SAVE_KEY);

    if (!saved) return initialState;

    const data = JSON.parse(saved);

    if (
      data.version !== SAVE_VERSION ||
      !isValidState(data.colony)
    ) {
      return initialState;
    }

    const colony: ColonyState = data.colony;

    // D5: Interrupted expeditions are cancelled.
    // Crafting tasks remain unchanged and continue.
    return {
      ...colony,
      colonists: colony.colonists.map((colonist) =>
        colonist.status === "expedition"
          ? {
              ...colonist,
              status: colonist.assignment ? "working" : "idle",
            }
          : colonist
      ),
    };
  } catch {
    return initialState;
  }
}
