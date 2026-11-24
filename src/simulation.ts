import type { ColonyState, JobType, Resources } from "./types";

export const production: Record<Exclude<JobType, null>, Partial<Resources>> = {
  woodcutting: { wood: 3 }, mining: { stone: 2 }, farming: { food: 4 },
};

export function advanceDay(state: ColonyState): ColonyState {
  const resources = { ...state.resources };

  state.colonists.forEach((colonist) => {
    if (colonist.status !== "working") return;
    if (!colonist.assignment) return;

    const output = production[colonist.assignment];

    Object.entries(output).forEach(([resource, amount]) => {
      let produced = amount ?? 0;
      
      // D1: Reduce production during food shortage.
      if (state.foodShortage && colonist.assignment !== "farming"){
        produced = Math.floor(produced / 2);
      }
      
      // D6: Ghouls produce 2 additional food when farming.
      if (colonist.species === "ghoul" && colonist.assignment === "farming") {
        produced += 2;
      }

      // D2: Equipped tools add one extra resource
      // when the dwarf performs a local job.
      const bonus =
        colonist.equippedTool && colonist.status === "working" ? 1 : 0;

      resources[resource as keyof Resources] += produced + bonus;
    });

  });

  const requiredFood = state.colonists.filter(
    (colonist) => colonist.status === "working"
  ).length;
  const foodShortage = resources.food < requiredFood;

  resources.food = Math.max(0, resources.food - requiredFood);

  // D3: Complete crafting tasks when the next day is reached.
const nextDay = state.day + 1;

const colonists = state.colonists.map((colonist) => {
  if (
    colonist.status === "crafting" &&
    colonist.crafting &&
    nextDay >= colonist.crafting.completesOnDay
  ) {
    resources[colonist.crafting.item] += 1;

    return {
      ...colonist,
      status: colonist.assignment ? "working" as const : "idle" as const,
      crafting: undefined,
    };
  }

  return colonist;
});

return { ...state, day: nextDay, resources, colonists, foodShortage };
}

export const jobLabel = (job: JobType) => job ? ({ 
  woodcutting: "Woodcutting", 
  mining: "Deep Mining", 
  farming: "Mushroom Farm" 
}[job]) : "Unassigned";
