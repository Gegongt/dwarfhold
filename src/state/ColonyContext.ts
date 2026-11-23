import { createContext, useContext } from "react";
import type { Activity, ColonyState, JobType } from "../types";

export interface ColonyContextValue {
  colony: ColonyState;
  paused: boolean;
  activities: Activity[];
  expeditionPending: boolean;

  togglePaused: () => void;
  assignDwarf: (id: string, assignment: JobType) => void;
  
  //D2: equipment actions
  equipTool: (dwarfId: string) => void;
  unequipTool: (dwarfId: string) => void;
 
  craftTool: () => void;

  //D2: wepon crafting
  craftWeapon: () => void;

  sendExpedition: (dwarfId: string, destination: string) => Promise<void>;
}

export const ColonyContext = createContext<ColonyContextValue | null>(null);

export function useColony(): ColonyContextValue {
  const context = useContext(ColonyContext);
  if (!context) {
    throw new Error("useColony must be used inside <ColonyProvider>");
  }
  return context;
}
