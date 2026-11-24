import { useEffect, useRef, useState, type ReactNode } from "react";
import { beginExpedition } from "../api";
import { advanceDay, jobLabel } from "../simulation";
import { resolveRaid } from "../raid";
import { ghoul } from "../ghoul";
import type {
  Activity,
  ColonistStatus,
  ColonyState,
  JobType,
  ResourceKey,
} from "../types";
import { ColonyContext, type ColonyContextValue } from "./ColonyContext";

const initialState: ColonyState = {
  day: 12,
  resources: {
    wood: 14,
    stone: 9,
    food: 18,
    tools: 1,
    weapons: 0,
  },
  colonists: [
    {
      id: "dwarf-1",
      name: "Bromli Copperkeg",
      title: "Hold Warden",
      icon: "🧔🏻",
      species: "dwarf",
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
      species: "dwarf",
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
      species: "dwarf",
      assignment: null,
      status: "idle",
      equippedTool: false,
    },
  ],
  foodShortage: false
};

export function ColonyProvider({ children }: { children: ReactNode }) {
  const [colony, setColony] = useState(initialState);
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

  function assignColonist(id: string, assignment: JobType) {
    // D3: Busy dwarves cannot change their assignment.
const selectedColonist = colony.colonists.find(
  (colonist) => colonist.id === id
);

if (
  !selectedColonist ||
  selectedColonist.status === "crafting" ||
  selectedColonist.status === "expedition"
) {
  return;
}
    setColony((current) => ({
      ...current,
      colonists: current.colonists.map((colonist) =>
        colonist.id === id
          ? {
              ...colonist,
              assignment,
              status: assignment ? "working" : "idle",
            }
          : colonist,
      ),
    }));

    const colonist = colony.colonists.find((item) => item.id === id);
    setActivities((current) =>
      [
        {
          id: crypto.randomUUID(),
          day: colony.day,
          message: `${colonist?.name ?? "A colonist"} assigned to ${jobLabel(assignment)}.`,
        },
        ...current,
      ].slice(0, 6),
    );
  }

 // D2: Equip one available tool.
  function equipTool(id: string) {
  setColony((current) => {
    const colonist = current.colonists.find((item) => item.id === id);

    if (
      !colonist ||
      colonist.equippedTool ||
      colonist.status === "expedition" ||
      colonist.status === "crafting" ||
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
      colonists: current.colonists.map((item) =>
        item.id === id ? { ...item, equippedTool: true } : item,
      ),
    };
  });
}

  // D2: Return the equipped tool to inventory.
  function unequipTool(id: string) {
  setColony((current) => {
    const colonist = current.colonists.find((item) => item.id === id);

    if (
      !colonist ||
      !colonist.equippedTool ||
      colonist.status === "expedition"
    ) {
      return current;
    }

    return {
      ...current,
      resources: {
        ...current.resources,
        tools: current.resources.tools + 1,
      },
      colonists: current.colonists.map((item) =>
        item.id === id ? { ...item, equippedTool: false } : item,
      ),
    };
  });
}

 // D3: Start crafting with an eligible dwarf.
function startCrafting(
  colonistId: string,
  item: "tools" | "weapons"
) {
  const woodCost = item === "tools" ? 3 : 4;
  const stoneCost = item === "tools" ? 2 : 3;

  setColony((current) => {
    const colonist = current.colonists.find(
      (item) => item.id === colonistId
    );

    // D3: Invalid attempts must not change the state.
    if (
      !colonist ||
      (colonist.status !== "idle" && colonist.status !== "working") ||
      (colonist.species === "ghoul" && item === "weapons") ||
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
      colonists: current.colonists.map((colonist) =>
        colonist.id === colonistId
          ? {
              ...colonist,
              status: "crafting",
              crafting: {
                item,
                completesOnDay: current.day + 1,
              },
            }
          : colonist
      ),
    };
  });
}

function craftTool(colonistId: string) {
  startCrafting(colonistId, "tools");
}

function craftWeapon(colonistId: string) {
  startCrafting(colonistId, "weapons");
}
  
  async function sendExpedition(colonistId: string, destination: string) {
    //D4: prevent multiple expeditions from being initiated simultaneously
    if (expeditionLock.current) return;

    const colonist = colony.colonists.find((item) => item.id === colonistId);
    if (!colonist || ((colonist.status !== "working" && colonist.status !== "idle"))) return; //D4 prevent starting an expedition with a dwarf not available

    expeditionLock.current = true;
    setExpeditionPending(true);
    setColony((current) => ({
      ...current,
      colonists: current.colonists.map((item) =>
        item.id === colonist.id ? { ...item, status: "expedition" } : item,
      ),
    }));
    setActivities((current) => [
      {
        id: crypto.randomUUID(),
        day: colony.day,
        message: `${colonist.name} departed for ${destination.replace("-", " ")}.`,
      },
      ...current,
    ]);

    try {
      const result = await beginExpedition(colonist.id, destination);

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

        // D6: Check whether the Ghoul should be recruited.
        const recruitGhoul =
          destination === "crystal-cave" &&
          !current.colonists.some((item) => item.id === ghoul.id);

        return {
          ...current,
          resources: raid ? raid.resources : rewardedResources,
          lastRaid: raid ? raid.report : current.lastRaid,
          colonists: [
            ...current.colonists.map((item) =>
              item.id === colonist.id
                ? {
                    ...item,
                    status: (item.assignment ? "working" : "idle") as ColonistStatus,
                  }
                : item,
          ),
          ...(recruitGhoul ? [{ ...ghoul }] : []),
          ],
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
          colonists: current.colonists.map((item) =>
              item.id === colonist.id
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
    assignColonist,
    equipTool,
    unequipTool,
    craftWeapon,
    craftTool,
    sendExpedition,
  };

  return <ColonyContext value={value}>{children}</ColonyContext>;
}
