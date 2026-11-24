import { createContext, useContext } from "react";
import type { Activity, ColonyState, JobType } from "../types";

export interface ColonyContextValue {
  colony: ColonyState;
  paused: boolean;
  activities: Activity[];
  expeditionPending: boolean;

  togglePaused: () => void;
  assignColonist: (id: string, assignment: JobType) => void;
  
  //D2: equipment actions
  equipTool: (colonistId: string) => void;
  unequipTool: (colonistId: string) => void;
 
  // D3: Crafting requires a selected dwarf.
  craftTool: (colonistId: string) => void;
  craftWeapon: (colonistId: string) => void;

  sendExpedition: (colonistId: string, destination: string) => Promise<void>;
}

export const ColonyContext = createContext<ColonyContextValue | null>(null);

export function useColony(): ColonyContextValue {
  const context = useContext(ColonyContext);
  if (!context) {
    throw new Error("useColony must be used inside <ColonyProvider>");
  }
  return context;
}
