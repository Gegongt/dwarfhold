
import { useState } from "react";
import { Chronicle } from "../components/Chronicle";
import { DwarfRoster } from "../components/DwarfRoster";
import { jobLabel, production } from "../simulation";
import { useColony } from "../state/ColonyContext";
import type { ResourceKey } from "../types";

export function ColonyPage() {
  const {
    colony,
    activities,
    expeditionPending,
    assignDwarf,
    equipTool,
    unequipTool,
    sendExpedition,
  } = useColony();

  const [destination, setDestination] = useState("crystal-cave");
  const [expeditionDwarf, setExpeditionDwarf] = useState("dwarf-3");

  const workingCount = colony.dwarves.filter(
    (dwarf) => dwarf.status === "working"
  ).length;

  const dailyOutput = colony.dwarves.reduce<Record<ResourceKey, number>>(
    (total, dwarf) => {
      if (dwarf.status === "working" && dwarf.assignment) {
        const output = production[dwarf.assignment];

        Object.entries(output).forEach(([resource, amount]) => {
          let produced = amount ?? 0;
          
          // D1: Reduce production during food shortage.
          if (colony.foodShortage && dwarf.assignment !== "farming") {
            produced = Math.floor(produced / 2);
          }
          
          // D2: Include equipped tool bonus in the ledger.
          const bonus =
            dwarf.equippedTool && dwarf.status === "working" ? 1 : 0;

          total[resource as ResourceKey] += produced + bonus;
        });
      }

      return total;
    },
    {
      wood: 0,
      stone: 0,
      food: -workingCount,
      tools: 0,
      weapons: 0,
    },
  );

  return (
    <div className="dashboard">
      <DwarfRoster
        dwarves={colony.dwarves}
        availableTools={colony.resources.tools}
        onAssign={assignDwarf}
        onEquip={equipTool}
        onUnequip={unequipTool}
      />

      <section className="center-stack">
        <section className="panel production">
          <header>
            <div>
              <small>SHIFT LEDGER</small>
              <h2>Daily Production</h2>
            </div>
            <span>updates each day</span>
          </header>

          {colony.foodShortage && (
              <p role="alert" className="shortage-warning">
                  ⚠ Food shortage! Woodcutting and Mining
                  production is reduced by 50% (rounded down).
                  Assign workers to Farming to recover.
              </p>
          )}
          <div className="job-grid">
            
            {(["woodcutting", "mining", "farming"] as const).map((job) => (
              <article key={job}>
                <b>
                  {job === "woodcutting"
                    ? "🌲"
                    : job === "mining"
                      ? "⛏️"
                      : "🍄"}
                </b>
                <h3>{jobLabel(job)}</h3>
                <p>
                  {
                    colony.dwarves.filter(
                      (dwarf) => 
                        dwarf.status === "working" &&
                        dwarf.assignment === job,
                    ).length
                  }{" "}
                  assigned
                </p>
                <strong>+{Object.values(production[job])[0]} / day base</strong>
                <p>
                  Tool bonus: +
                  {
                    colony.dwarves.filter(
                      (dwarf) =>
                        dwarf.assignment === job &&
                        dwarf.status === "working" &&
                        dwarf.equippedTool,
                    ).length
                  }{" "}
                  / day
                </p>
              </article>
            ))}
          </div>

          <div className="net-line">
            <span>NET FOOD AFTER MEALS</span>
            <strong className={dailyOutput.food >= 0 ? "gain" : "loss"}>
              {dailyOutput.food >= 0 ? "+" : ""}
              {dailyOutput.food}
            </strong>
          </div>
        </section>
      </section>

      <aside className="side-stack">
        <section className="panel expedition">
          <header>
            <div>
              <small>BEYOND THE GATE</small>
              <h2>Expedition</h2>
            </div>
            <b>🗺️</b>
          </header>

          <label>
            Scout
            <select
              value={expeditionDwarf}
              onChange={(event) => setExpeditionDwarf(event.target.value)}
            >
              {colony.dwarves.map((dwarf) => (
                <option key={dwarf.id} value={dwarf.id}>
                  {dwarf.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Destination
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
            >
              <option value="crystal-cave">Crystal Cave</option>
              <option value="old-mine">The Old Mine</option>
              <option value="blocked-pass">Blocked Pass</option>
            </select>
          </label>

          <button
            disabled={expeditionPending}
            onClick={() => sendExpedition(expeditionDwarf, destination)}
          >
            {expeditionPending ? "Beyond the gate…" : "Send expedition"}
          </button>
          <p>
            A result returns in one request. The selected dwarf is unavailable
            while travelling.
          </p>
        </section>

        <Chronicle activities={activities} />
      </aside>
    </div>
  );
}
