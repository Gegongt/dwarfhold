import type { ColonyState, JobType, Resources } from "./types";

export const production: Record<Exclude<JobType, null>, Partial<Resources>> = {
  woodcutting: { wood: 3 }, mining: { stone: 2 }, farming: { food: 4 },
};

export function advanceDay(state: ColonyState): ColonyState {
  const resources = { ...state.resources };

  state.dwarves.forEach((dwarf) => {
    if (dwarf.status !== "working") return;
    if (!dwarf.assignment) return;

    const output = production[dwarf.assignment];

    Object.entries(output).forEach(([resource, amount]) => {
      let produced = amount ?? 0;

      if (state.foodShortage && dwarf.assignment !== "farming"){
        produced = Math.floor(produced / 2);
      }

      resources[resource as keyof Resources] += produced;
    });

  });

  const requiredFood = state.dwarves.filter(
    (dwarf) => dwarf.status === "working"
  ).length;
  const foodShortage = resources.food < requiredFood;

  resources.food = Math.max(0, resources.food - requiredFood);

  return { ...state, day: state.day + 1, resources, foodShortage };
}

export const jobLabel = (job: JobType) => job ? ({ 
  woodcutting: "Woodcutting", 
  mining: "Deep Mining", 
  farming: "Mushroom Farm" 
}[job]) : "Unassigned";
