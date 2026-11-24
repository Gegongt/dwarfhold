import { jobLabel } from "../simulation";
import type { Colonist, JobType } from "../types";

const jobs: Exclude<JobType, null>[] = [
  "woodcutting",
  "mining",
  "farming",
];

interface Props {
  colonists: Colonist[];
  availableTools: number;
  onAssign: (id: string, job: JobType) => void;
  onEquip: (id: string) => void;
  onUnequip: (id: string) => void;
}

export function ColonistRoster({ colonists, availableTools, onAssign, onEquip, onUnequip }: Props) {
  const presentColonists = colonists.filter(
    (colonist) => colonist.status !== "expedition",
  ).length;

  return (
    <section className="panel roster">
      <header>
        <div>
          <small>THE COMPANY</small>
          <h2>Holdfolk</h2>
        </div>
        <span>
          {presentColonists} / {colonists.length} present
        </span>
      </header>

      <div className="dwarf-list">
        {colonists.map((colonist) => {
          const isAway = colonist.status === "expedition";
          // D3: Crafting dwarves are temporarily unavailable.
          const isCrafting = colonist.status === "crafting";
          const specialty = colonist.specialty
            ? `Skilled in ${jobLabel(colonist.specialty)}`
            : "Generalist";

          return (
            <article
              className={isAway ? "dwarf away" : "dwarf"}
              key={colonist.id}
            >
              <div className="portrait">
                {colonist.icon}
                <i className={colonist.status} />
              </div>

              <div className="dwarf-details">
                <h3>{colonist.name}</h3>
                <p>
                  {colonist.title} · {specialty}
                </p>

                {colonist.species === "ghoul" && (
                  <p>
                    🍄 Farming: +2 Food/day · Cannot craft weapons
                  </p>
                )}

                <select
                  value={colonist.assignment ?? ""}
                  disabled={isAway || isCrafting}
                  onChange={(event) =>
                    onAssign(
                      colonist.id,
                      (event.target.value || null) as JobType,
                    )
                  }
                >
                  <option value="">Unassigned</option>
                  {jobs.map((job) => (
                    <option value={job} key={job}>
                      {jobLabel(job)}
                    </option>
                  ))}
                </select>

                {/* D2: Show equipment ownership */}
                <p>
                  Tool: {colonist.equippedTool ? "⚒️ Equipped" : "None"}
                </p>

                {/* D2: Equip or return a tool */}
                <button
                  className="tool-button"
                  type="button"
                  disabled={
                    isAway ||
                    isCrafting ||
                    (!colonist.equippedTool && availableTools < 1)
                  }
                  onClick={() =>
                    colonist.equippedTool
                      ? onUnequip(colonist.id)
                      : onEquip(colonist.id)
                  }
                >
                  {colonist.equippedTool ? "Return Tool" : "Equip Tool"}
                </button>
              </div>

              <span className="status">{colonist.status}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
