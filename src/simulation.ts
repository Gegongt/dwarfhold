import type { ColonyState, JobType, Resources } from "./types";

export const production: Record<Exclude<JobType, null>, Partial<Resources>> = {
  woodcutting: { wood: 3 }, mining: { stone: 2 }, farming: { food: 4 },
};

export function advanceDay(state: ColonyState): ColonyState {
  const resources = { ...state.resources };

  state.dwarves.forEach((dwarf) => {
    if (!dwarf.assignment) return;

    const output = production[dwarf.assignment];

    Object.entries(output).forEach(([resource, amount]) => {
      // D2: Equipped tools add one extra resource
      // when the dwarf performs a local job.
      const bonus =
        dwarf.equippedTool && dwarf.status === "working" ? 1 : 0;

      resources[resource as keyof Resources] += (amount ?? 0) + bonus;
    });

  });

  resources.food = Math.max(0, resources.food - state.dwarves.length);

  return { ...state, day: state.day + 1, resources };
}

export const jobLabel = (job: JobType) => job ? ({ 
  woodcutting: "Woodcutting", 
  mining: "Deep Mining", 
  farming: "Mushroom Farm" 
}[job]) : "Unassigned";
