
import type { Resources, RaidReport } from "./types";

// D7: Calculate defense chance based on available weapons.
export function getDefenseChance(weapons: number): number {
  const chances = [10, 30, 60, 95, 100];

  return chances[Math.min(weapons, 4)];
}

// D7: Calculate the outcome of a goblin attack.
export function resolveRaid(
  resources: Resources,
  roll: number
): { resources: Resources; report: RaidReport } {

  const defenseChance = getDefenseChance(resources.weapons);

  // Roll is between 0 and 1.
  const defended = roll < defenseChance / 100;

  // At most 4 weapons are used during a defense.
  const usedWeapons = Math.min(resources.weapons, 4);
  const remainingWeapons = resources.weapons - usedWeapons;

  if (defended) {
    return {
      resources: {
        ...resources,
        wood: resources.wood + 15,
        stone: resources.stone + 10,
        weapons: remainingWeapons + 2,
      },
      report: {
        defended: true,
        defenseChance,
        usedWeapons,
        gainedWood: 15,
        gainedStone: 10,
        gainedWeapons: 2,
        lostWood: 0,
        lostStone: 0,
        lostFood: 0,
      },
    };
  }

  const lostWood = Math.min(resources.wood, 15);
  const lostStone = Math.min(resources.stone, 10);
  const lostFood = Math.min(resources.food, 5);

  return {
    resources: {
      ...resources,
      wood: resources.wood - lostWood,
      stone: resources.stone - lostStone,
      food: resources.food - lostFood,
      weapons: remainingWeapons,
    },
    report: {
      defended: false,
      defenseChance,
      usedWeapons,
      gainedWood: 0,
      gainedStone: 0,
      gainedWeapons: 0,
      lostWood,
      lostStone,
      lostFood,
    },
  };
}
