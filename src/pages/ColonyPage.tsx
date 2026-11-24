
import { useState } from "react";
import { Chronicle } from "../components/Chronicle";
import { ColonistRoster } from "../components/ColonistRoster";
import { jobLabel, production } from "../simulation";
import { useColony } from "../state/ColonyContext";
import { getDefenseChance } from "../raid";
import type { ResourceKey } from "../types";

export function ColonyPage() {
  const {
    colony,
    activities,
    expeditionPending,
    assignColonist,
    equipTool,
    unequipTool,
    sendExpedition,
  } = useColony();

  const [destination, setDestination] = useState("crystal-cave");
  const [expeditionColonist, setExpeditionColonist] = useState("dwarf-3");

  const workingCount = colony.colonists.filter(
    (colonist) => colonist.status === "working"
  ).length;

  const dailyOutput = colony.colonists.reduce<Record<ResourceKey, number>>(
    (total, colonist) => {
      if (colonist.status === "working" && colonist.assignment) {
        const output = production[colonist.assignment];

        Object.entries(output).forEach(([resource, amount]) => {
          let produced = amount ?? 0;
          
          // D1: Reduce production during food shortage.
          if (colony.foodShortage && colonist.assignment !== "farming") {
            produced = Math.floor(produced / 2);
          }

          // D6: Include Ghoul farming bonus in the Shift Ledger.
          if (colonist.species === "ghoul" && colonist.assignment === "farming") {
            produced += 2;
          }
          
          // D2: Include equipped tool bonus in the ledger.
          const bonus =
            colonist.equippedTool && colonist.status === "working" ? 1 : 0;

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
      <ColonistRoster
        colonists={colony.colonists}
        availableTools={colony.resources.tools}
        onAssign={assignColonist}
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
                    colony.colonists.filter(
                      (colonist) => 
                        colonist.status === "working" &&
                        colonist.assignment === job,
                    ).length
                  }{" "}
                  assigned
                </p>
                <strong>+{Object.values(production[job])[0]} / day base</strong>
                <p>
                  Tool bonus: +
                  {
                    colony.colonists.filter(
                      (colonist) =>
                        colonist.assignment === job &&
                        colonist.status === "working" &&
                        colonist.equippedTool,
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
              value={expeditionColonist}
              onChange={(event) => setExpeditionColonist(event.target.value)}
            >
              {colony.colonists.map((colonist) => (
                <option key={colonist.id} value={colonist.id} disabled={
                  colonist.status !== "idle" &&
                  colonist.status !== "working"
                }>
                  {colonist.name}
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
              <option value="bombo-rift">Bombo Rift</option>
            </select>
          </label>

          {destination === "bombo-rift" && (
            <div className="raid-chance">
              <span>⚔ STONEHOME DEFENSE</span>

              <strong>
                {getDefenseChance(colony.resources.weapons)}%
              </strong>

              <p>
                {colony.resources.weapons} Weapons available
              </p>
            </div>
          )}

          <button
            disabled={
              expeditionPending ||
                !colony.colonists.some(
               (colonist) =>
                colonist.id === expeditionColonist &&
                  (colonist.status === "idle" ||
           colonist.status === "working")
  )
}
            onClick={() => sendExpedition(expeditionColonist, destination)}
          >
            {expeditionPending ? "Beyond the gate…" : "Send expedition"}
          </button>
          <p>
            A result returns in one request. The selected colonist is unavailable
            while travelling.
          </p>

          {colony.lastRaid && (
            <div
              className={`raid-result ${
                colony.lastRaid.defended ? "raid-victory" : "raid-defeat"
              }`}
              role="status"
            >
              <small>LAST GOBLIN RAID</small>

              <h3>
                {colony.lastRaid.defended
                  ? "⚔ Stonehome Victorious!"
                  : "☠ Stonehome Plundered!"}
              </h3>

              <p>
                Defense chance: {colony.lastRaid.defenseChance}%
              </p>

              {colony.lastRaid.defended ? (
                <p className="raid-rewards">
                  +{colony.lastRaid.gainedWood} Wood,
                  +{colony.lastRaid.gainedStone} Stone,
                  +{colony.lastRaid.gainedWeapons} Weapons
                </p>
              ) : (
                <p className="raid-losses">
                  -{colony.lastRaid.lostWood} Wood,
                  -{colony.lastRaid.lostStone} Stone,
                  -{colony.lastRaid.lostFood} Food
                </p>
              )}

              <p>
                Weapons consumed: {colony.lastRaid.usedWeapons}
              </p>
            </div>
          )}
        </section>

        <Chronicle activities={activities} />
      </aside>
    </div>
  );
}
