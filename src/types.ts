export type ResourceKey = "wood" | "stone" | "food" | "tools" | "weapons";
export type JobType = "woodcutting" | "mining" | "farming" | null;
export type DwarfStatus = "idle" | "working" | "expedition" | "crafting";

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

export interface Dwarf { 
    id: string;
     name: string; 
     title: string; 
     icon: string; 
     assignment: JobType; 
     status: DwarfStatus; 
     specialty?: Exclude<JobType, null> 

     //D2: a dwarf can carry at most one tool
     equippedTool?: boolean; 

    // D3: Current crafting task.
    crafting?: CraftingTask;
}

export interface ColonyState { 
    day: number; 
    resources: Resources; 
    dwarves: Dwarf[];
    foodShortage: boolean;
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
