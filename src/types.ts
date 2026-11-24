export type ResourceKey = "wood" | "stone" | "food" | "tools" | "weapons";
export type JobType = "woodcutting" | "mining" | "farming" | null;
export type ColonistStatus = "idle" | "working" | "expedition" | "crafting";
export type Species = "dwarf" | "ghoul";

// D3: Information about an ongoing crafting task.
export interface CraftingTask {
    item: "tools" | "weapons";
    completesOnDay: number;
}

export interface Resources { 
    wood: number; 
    stone: number; 
    food: number; 
    tools: number;
    weapons: number;
}

export interface Colonist  { 
    id: string;
     name: string; 
     title: string; 
     icon: string; 
     //D6: Which species does the colonist belong to ?
     species: Species;
     assignment: JobType; 
     status: ColonistStatus; 
     specialty?: Exclude<JobType, null> 

     //D2: a dwarf can carry at most one tool
     equippedTool?: boolean; 

    // D3: Current crafting task.
    crafting?: CraftingTask;
}

export interface ColonyState { 
    day: number; 
    resources: Resources; 
    colonists: Colonist[];
    foodShortage: boolean;
    lastRaid?: RaidReport;
}

export interface ExpeditionResult {     
    expeditionId: string; 
    status: "completed"; 
    rewards: Partial<Resources>; 
    message: string 
}

export interface Activity { 
    id: string; 
    day: number; 
    message: string; 
    tone?: "good" | "warning" 
}

export interface RaidReport {
  defended: boolean;
  defenseChance: number;
  usedWeapons: number;

  gainedWood: number;
  gainedStone: number;
  gainedWeapons: number;

  lostWood: number;
  lostStone: number;
  lostFood: number;
}