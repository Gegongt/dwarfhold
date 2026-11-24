
import type { ColonyState } from "./types";

// D5: Save configuration.
const SAVE_KEY = "dwarfhold-save";
const SAVE_VERSION = 1;

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
    !Array.isArray(state.dwarves) ||
    state.dwarves.length === 0 ||
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

  const validDwarves = state.dwarves.every((dwarf) =>
    dwarf &&
    typeof dwarf.id === "string" &&
    typeof dwarf.name === "string" &&
    typeof dwarf.title === "string" &&
    typeof dwarf.icon === "string" &&
    ["idle", "working", "expedition", "crafting"].includes(dwarf.status) &&
    [null, "woodcutting", "mining", "farming"].includes(dwarf.assignment) &&
    (dwarf.specialty === undefined ||
      ["woodcutting", "mining", "farming"].includes(dwarf.specialty)) &&
    (dwarf.equippedTool === undefined ||
      typeof dwarf.equippedTool === "boolean") &&
    (dwarf.status !== "working" || dwarf.assignment !== null) &&
    (dwarf.status !== "idle" || dwarf.assignment === null) &&
    (dwarf.status === "crafting"
      ? dwarf.crafting &&
        ["tools", "weapons"].includes(dwarf.crafting.item) &&
        isAmount(dwarf.crafting.completesOnDay) &&
        dwarf.crafting.completesOnDay > state.day
      : dwarf.crafting === undefined)
  );

  const uniqueIds =
    new Set(state.dwarves.map((dwarf) => dwarf.id)).size ===
    state.dwarves.length;

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

  return validResources && validDwarves && uniqueIds && validRaid;
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
      dwarves: colony.dwarves.map((dwarf) =>
        dwarf.status === "expedition"
          ? {
              ...dwarf,
              status: dwarf.assignment ? "working" : "idle",
            }
          : dwarf
      ),
    };
  } catch {
    return initialState;
  }
}
