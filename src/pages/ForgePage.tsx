
import { useState } from "react";
import { Chronicle } from "../components/Chronicle";
import { useColony } from "../state/ColonyContext";

export function ForgePage() {
  const { colony, activities, craftTool, craftWeapon } = useColony();

  // D3: Select a dwarf for crafting.
  const [selectedColonist, setSelectedColonist] = useState("");

  const availableColonists = colony.colonists.filter(
    (colonist) => colonist.status === "idle" || colonist.status === "working"
  );

  const craftingColonists = colony.colonists.filter(
    (colonist) => colonist.status === "crafting"
  );

  const canCraft = availableColonists.some(
    (colonist) => colonist.id === selectedColonist
  );

  const selectedCrafter = colony.colonists.find(
    (colonist) => colonist.id === selectedColonist
  );

  return (
    <div className="forge-layout">

      {/* D3: Select an available dwarf */}
      <section className="panel">
        <h2>Select a crafter</h2>

        <select
          value={canCraft ? selectedColonist : ""}
          onChange={(event) => setSelectedColonist(event.target.value)}
        >
          <option value="">Select a colonist</option>

          {availableColonists.map((colonist) => (
            <option key={colonist.id} value={colonist.id}>
              {colonist.name}
            </option>
          ))}
        </select>

        <p>Crafting completes on the next game day.</p>

        {/* D5: Explain the crafting refresh policy. */}
        <p>
          Active crafting tasks are saved and continue after a browser
          refresh without additional material costs.
        </p>
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
            onClick={() => craftTool(selectedColonist)}
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
                selectedCrafter?.species === "ghoul" ||
                colony.resources.wood < 4 ||
                colony.resources.stone < 3
              }
              onClick={() => craftWeapon(selectedColonist)}
            >
              Forge weapon
            </button>
          </div>
        </section>
        {selectedCrafter?.species === "ghoul" && (
          <p>Ghouls cannot craft weapons, but they can craft tools.</p>
        )}
      </div>

      {/* D3: Show active crafting tasks */}
      <section className="panel">
        <h2>Active Crafting</h2>

        {craftingColonists.length === 0 && (
          <p>No active crafting tasks.</p>
        )}

        {craftingColonists.map((colonist) => (
          <p key={colonist.id}>
            {colonist.name} is crafting a{" "}
            {colonist.crafting?.item === "tools" ? "tool" : "weapon"}.
            Completes on day {colonist.crafting?.completesOnDay}.
          </p>
        ))}
      </section>

      <Chronicle activities={activities} />
    </div>
  );
}
