
import { useState } from "react";
import { Chronicle } from "../components/Chronicle";
import { useColony } from "../state/ColonyContext";

export function ForgePage() {
  const { colony, activities, craftTool, craftWeapon } = useColony();

  // D3: Select a dwarf for crafting.
  const [selectedDwarf, setSelectedDwarf] = useState("");

  const availableDwarves = colony.dwarves.filter(
    (dwarf) => dwarf.status === "idle" || dwarf.status === "working"
  );

  const craftingDwarves = colony.dwarves.filter(
    (dwarf) => dwarf.status === "crafting"
  );

  const canCraft = availableDwarves.some(
    (dwarf) => dwarf.id === selectedDwarf
  );

  return (
    <div className="forge-layout">

      {/* D3: Select an available dwarf */}
      <section className="panel">
        <h2>Select a crafter</h2>

        <select
          value={canCraft ? selectedDwarf : ""}
          onChange={(event) => setSelectedDwarf(event.target.value)}
        >
          <option value="">Select a dwarf</option>

          {availableDwarves.map((dwarf) => (
            <option key={dwarf.id} value={dwarf.id}>
              {dwarf.name}
            </option>
          ))}
        </select>

        <p>Crafting completes on the next game day.</p>
      </section>

      <section className="panel forge">
        <div>
          <small>EMBER FORGE</small>
          <h2>Craft a tool</h2>
          <p>Equip the hold for future work.</p>
        </div>

        <div className="recipe">
          <span>3 🪵</span>
          <i>+</i>
          <span>2 🪨</span>
          <i>→</i>
          <span>1 ⚒️</span>

          <button
            disabled={
              !canCraft ||
              colony.resources.wood < 3 ||
              colony.resources.stone < 2
            }
            onClick={() => craftTool(selectedDwarf)}
          >
            Forge tool
          </button>
        </div>
      </section>

      {/* D2: Weapon recipe */}
      <div>
        <section className="panel forge">
          <div>
            <small>EMBER FORGE</small>
            <h2>Craft a weapon</h2>
            <p>Prepare Stonehome for hostile events.</p>
          </div>

          <div className="recipe">
            <span>4 🪵</span>
            <i>+</i>
            <span>3 🪨</span>
            <i>→</i>
            <span>1 ⚔️</span>

            <button
              disabled={
                !canCraft ||
                colony.resources.wood < 4 ||
                colony.resources.stone < 3
              }
              onClick={() => craftWeapon(selectedDwarf)}
            >
              Forge weapon
            </button>
          </div>
        </section>
      </div>

      {/* D3: Show active crafting tasks */}
      <section className="panel">
        <h2>Active Crafting</h2>

        {craftingDwarves.length === 0 && (
          <p>No active crafting tasks.</p>
        )}

        {craftingDwarves.map((dwarf) => (
          <p key={dwarf.id}>
            {dwarf.name} is crafting a{" "}
            {dwarf.crafting?.item === "tools" ? "tool" : "weapon"}.
            Completes on day {dwarf.crafting?.completesOnDay}.
          </p>
        ))}
      </section>

      <Chronicle activities={activities} />
    </div>
  );
}
