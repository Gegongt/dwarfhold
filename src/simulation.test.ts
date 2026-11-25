import { describe, expect, it } from "vitest";
import { advanceDay } from "./simulation";
import type { ColonyState } from "./types";
describe("colony simulation", () => {
  it("produces assigned resources and feeds the company", () => {
    const state: ColonyState = { day: 1, resources: { wood: 0, stone: 0, food: 5, tools: 0, weapons: 0 }, colonists: [{ id: "d1", name: "Brom", title: "", icon: "", species: "dwarf", assignment: "woodcutting", status: "working" }], foodShortage: false };
    expect(advanceDay(state)).toMatchObject({ day: 2, resources: { wood: 3, food: 4 } });
    expect(state.resources.wood).toBe(0);
  });
});

// D3: Test crafting completion.
  it("completes a tool on the scheduled day", () => {
    const state: ColonyState = {
      day: 1,
      resources: {
        wood: 0,
        stone: 0,
        food: 5,
        tools: 0,
        weapons: 0,
      },
      colonists: [
        {
          id: "d1",
          name: "Brom",
          title: "",
          icon: "",
          species: "dwarf",
          assignment: null,
          status: "crafting",
          crafting: {
            item: "tools",
            completesOnDay: 2,
          },
        },
      ],
      foodShortage: false,
    };

    const result = advanceDay(state);

    expect(result.resources.tools).toBe(1);
    expect(result.colonists[0].status).toBe("idle");
    expect(result.colonists[0].crafting).toBeUndefined();
    expect(state.resources.tools).toBe(0);
  });

  // D3: Test that crafting is not completed too early.
  it("does not complete a weapon before its scheduled day", () => {
    const state: ColonyState = {
      day: 1,
      resources: {
        wood: 0,
        stone: 0,
        food: 5,
        tools: 0,
        weapons: 0,
      },
      colonists: [
        {
          id: "d1",
          name: "Brom",
          title: "",
          icon: "",
          species: "dwarf",
          assignment: null,
          status: "crafting",
          crafting: {
            item: "weapons",
            completesOnDay: 3,
          },
        },
      ],
      foodShortage: false,
    };

    const result = advanceDay(state);

    expect(result.resources.weapons).toBe(0);
    expect(result.colonists[0].status).toBe("crafting");

    const completed = advanceDay(result);

    expect(completed.resources.weapons).toBe(1);
    expect(completed.colonists[0].status).toBe("idle");
  });

  // D3: Crafting prevents normal production.
  it("prevents normal production and restores the previous job", () => {
    const state: ColonyState = {
      day: 1,
      resources: {
        wood: 0,
        stone: 0,
        food: 5,
        tools: 0,
        weapons: 0,
      },
      colonists: [
        {
          id: "d1",
          name: "Brom",
          title: "",
          icon: "",
          species: "dwarf",
          assignment: "mining",
          status: "crafting",
          equippedTool: true,
          crafting: {
            item: "weapons",
            completesOnDay: 2,
          },
        },
      ],
      foodShortage: false,
    };

    const result = advanceDay(state);

    expect(result.resources.stone).toBe(0);
    expect(result.resources.weapons).toBe(1);
    expect(result.colonists[0].status).toBe("working");
    expect(result.colonists[0].assignment).toBe("mining");

    const nextDay = advanceDay(result);

    expect(nextDay.resources.stone).toBe(3);
    expect(nextDay.resources.weapons).toBe(1);
  });
