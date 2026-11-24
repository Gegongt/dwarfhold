import { useEffect, useRef, useState, type ReactNode } from "react";
import { beginExpedition } from "../api";
import { advanceDay, jobLabel } from "../simulation";
import { resolveRaid } from "../raid";
import type {
  Activity,
  ColonyState,
  JobType,
  ResourceKey,
} from "../types";
import { ColonyContext, type ColonyContextValue } from "./ColonyContext";
import { loadColony, saveColony } from "../persistence";

const initialState: ColonyState = {
  day: 12,
  resources: {
    wood: 14,
    stone: 9,
    food: 18,
    tools: 1,
    weapons: 0,
  },
  dwarves: [
    {
      id: "dwarf-1",
      name: "Bromli Copperkeg",
      title: "Hold Warden",
      icon: "🧔🏻",
      assignment: "mining",
      status: "working",
      specialty: "mining",
      equippedTool: false,
    },
    {
      id: "dwarf-2",
      name: "Yrsa Flintbraid",
      title: "Trail Scout",
      icon: "🧔🏼‍♀️",
      assignment: "woodcutting",
      status: "working",
      specialty: "woodcutting",
      equippedTool: false,
    },
    {
      id: "dwarf-3",
      name: "Dori Ashmantle",
      title: "Stone Singer",
      icon: "🧔🏽",
      assignment: null,
      status: "idle",
      equippedTool: false,
    },
  ],
  foodShortage: false
};

export function ColonyProvider({ children }: { children: ReactNode }) {
  // D5: Restore the saved colony when the game starts.
  const [colony, setColony] = useState(() => loadColony(initialState));
  const [paused, setPaused] = useState(false);
  const [expeditionPending, setExpeditionPending] = useState(false);
  //D4: prevent multiple expeditions from being initiated simultaneously
  const expeditionLock = useRef(false);
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: "welcome",
      day: 12,
      message: "The forge fires are lit. Stonehome wakes.",
    },
  ]);

  useEffect(() => {
    if (paused) return;

    const timer = window.setInterval(
      () => setColony((current) => advanceDay(current)),
      8_000,
    );

    return () => window.clearInterval(timer);
  }, [paused]);

  // D5: Automatically save whenever the colony state changes.
  useEffect(() => {
    saveColony(colony);
  }, [colony]);

  function assignDwarf(id: string, assignment: JobType) {
    // D3: Busy dwarves cannot change their assignment.
const selectedDwarf = colony.dwarves.find(
  (dwarf) => dwarf.id === id
);

if (
  !selectedDwarf ||
  selectedDwarf.status === "crafting" ||
  selectedDwarf.status === "expedition"
) {
  return;
}
    setColony((current) => ({
      ...current,
      dwarves: current.dwarves.map((dwarf) =>
        dwarf.id === id
          ? {
              ...dwarf,
              assignment,
              status: assignment ? "working" : "idle",
            }
          : dwarf,
      ),
    }));

    const dwarf = colony.dwarves.find((item) => item.id === id);
    setActivities((current) =>
      [
        {
          id: crypto.randomUUID(),
          day: colony.day,
          message: `${dwarf?.name ?? "A dwarf"} assigned to ${jobLabel(assignment)}.`,
        },
        ...current,
      ].slice(0, 6),
    );
  }

 // D2: Equip one available tool.
  function equipTool(id: string) {
  setColony((current) => {
    const dwarf = current.dwarves.find((item) => item.id === id);

    if (
      !dwarf ||
      dwarf.equippedTool ||
      dwarf.status === "expedition" ||
      dwarf.status === "crafting" ||
      current.resources.tools < 1
    ) {
      return current;
    }

    return {
      ...current,
      resources: {
        ...current.resources,
        tools: current.resources.tools - 1,
      },
      dwarves: current.dwarves.map((item) =>
        item.id === id ? { ...item, equippedTool: true } : item,
      ),
    };
  });
}

  // D2: Return the equipped tool to inventory.
  function unequipTool(id: string) {
  setColony((current) => {
    const dwarf = current.dwarves.find((item) => item.id === id);

    if (
      !dwarf ||
      !dwarf.equippedTool ||
      dwarf.status === "expedition"
    ) {
      return current;
    }

    return {
      ...current,
      resources: {
        ...current.resources,
        tools: current.resources.tools + 1,
      },
      dwarves: current.dwarves.map((item) =>
        item.id === id ? { ...item, equippedTool: false } : item,
      ),
    };
  });
}

 // D3: Start crafting with an eligible dwarf.
function startCrafting(
  dwarfId: string,
  item: "tools" | "weapons"
) {
  const woodCost = item === "tools" ? 3 : 4;
  const stoneCost = item === "tools" ? 2 : 3;

  setColony((current) => {
    const dwarf = current.dwarves.find(
      (item) => item.id === dwarfId
    );

    // D3: Invalid attempts must not change the state.
    if (
      !dwarf ||
      (dwarf.status !== "idle" && dwarf.status !== "working") ||
      current.resources.wood < woodCost ||
      current.resources.stone < stoneCost
    ) {
      return current;
    }

    return {
      ...current,
      resources: {
        ...current.resources,
        wood: current.resources.wood - woodCost,
        stone: current.resources.stone - stoneCost,
      },
      dwarves: current.dwarves.map((dwarf) =>
        dwarf.id === dwarfId
          ? {
              ...dwarf,
              status: "crafting",
              crafting: {
                item,
                completesOnDay: current.day + 1,
              },
            }
          : dwarf
      ),
    };
  });
}

function craftTool(dwarfId: string) {
  startCrafting(dwarfId, "tools");
}

function craftWeapon(dwarfId: string) {
  startCrafting(dwarfId, "weapons");
}
  
  async function sendExpedition(dwarfId: string, destination: string) {
    //D4: prevent multiple expeditions from being initiated simultaneously
    if (expeditionLock.current) return;

    const dwarf = colony.dwarves.find((item) => item.id === dwarfId);
    if (!dwarf || ((dwarf.status !== "working" && dwarf.status !== "idle"))) return; //D4 prevent starting an expedition with a dwarf not available

    expeditionLock.current = true;
    setExpeditionPending(true);
    setColony((current) => ({
      ...current,
      dwarves: current.dwarves.map((item) =>
        item.id === dwarf.id ? { ...item, status: "expedition" } : item,
      ),
    }));
    setActivities((current) => [
      {
        id: crypto.randomUUID(),
        day: colony.day,
        message: `${dwarf.name} departed for ${destination.replace("-", " ")}.`,
      },
      ...current,
    ]);

    try {
      const result = await beginExpedition(dwarf.id, destination);

      const raidRoll =
        destination === "bombo-rift"
          ? Math.random()
          : null;

      setColony((current) => {
        // Apply normal expedition rewards.
        const rewardedResources = Object.entries(result.rewards).reduce(
          (all, [key, amount]) => ({
            ...all,
            [key]: all[key as ResourceKey] + (amount ?? 0),
          }),
          current.resources,
        );

        // D7: Trigger a raid only after a successful Bombo Rift expedition.
        const raid =
          raidRoll !== null
            ? resolveRaid(rewardedResources, raidRoll)
            : null;

        return {
          ...current,
          resources: raid ? raid.resources : rewardedResources,
          lastRaid: raid ? raid.report : current.lastRaid,
          dwarves: current.dwarves.map((item) =>
            item.id === dwarf.id
              ? {
                  ...item,
                  status: item.assignment ? "working" : "idle",
                }
              : item,
          ),
        };
      });
      setActivities((current) =>
        [
          {
            id: result.expeditionId,
            day: colony.day,
            message: result.message,
            tone: "good" as const,
          },
          ...current,
        ].slice(0, 6),
      );
    } catch (error) {
      // D4: prevent the colony from being left without the dwarf if the expedition fails
      setColony((current) => ({
          ...current,
          dwarves: current.dwarves.map((item) =>
              item.id === dwarf.id
                  ? {
                        ...item,
                        status: item.assignment ? "working" : "idle",
                    }
                  : item,
          ),
      }));
      setActivities((current) =>
        [
          {
            id: crypto.randomUUID(),
            day: colony.day,
            message:
              error instanceof Error
                ? error.message
                : "The expedition was lost from view.",
            tone: "warning" as const,
          },
          ...current,
        ].slice(0, 6),
      );
    }

    expeditionLock.current = false; //D4: release the expedition lock after the expedition concludes
    setExpeditionPending(false);
  }

  const value: ColonyContextValue = {
    colony,
    paused,
    activities,
    expeditionPending,
    togglePaused: () => setPaused((value) => !value),
    assignDwarf,
    equipTool,
    unequipTool,
    craftWeapon,
    craftTool,
    sendExpedition,
  };

  return <ColonyContext value={value}>{children}</ColonyContext>;
}
