import { jobLabel } from "../simulation";
import type { Dwarf, JobType } from "../types";

const jobs: Exclude<JobType, null>[] = [
  "woodcutting",
  "mining",
  "farming",
];

interface Props {
  dwarves: Dwarf[];
  availableTools: number;
  onAssign: (id: string, job: JobType) => void;
  onEquip: (id: string) => void;
  onUnequip: (id: string) => void;
}

export function DwarfRoster({ dwarves, availableTools, onAssign, onEquip, onUnequip }: Props) {
  const presentDwarves = dwarves.filter(
    (dwarf) => dwarf.status !== "expedition",
  ).length;

  return (
    <section className="panel roster">
      <header>
        <div>
          <small>THE COMPANY</small>
          <h2>Holdfolk</h2>
        </div>
        <span>
          {presentDwarves} / {dwarves.length} present
        </span>
      </header>

      <div className="dwarf-list">
        {dwarves.map((dwarf) => {
          const isAway = dwarf.status === "expedition";
          const specialty = dwarf.specialty
            ? `Skilled in ${jobLabel(dwarf.specialty)}`
            : "Generalist";

          return (
            <article
              className={isAway ? "dwarf away" : "dwarf"}
              key={dwarf.id}
            >
              <div className="portrait">
                {dwarf.icon}
                <i className={dwarf.status} />
              </div>

              <div className="dwarf-details">
                <h3>{dwarf.name}</h3>
                <p>
                  {dwarf.title} · {specialty}
                </p>

                <select
                  value={dwarf.assignment ?? ""}
                  disabled={isAway}
                  onChange={(event) =>
                    onAssign(
                      dwarf.id,
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
                  Tool: {dwarf.equippedTool ? "⚒️ Equipped" : "None"}
                </p>

                {/* D2: Equip or return a tool */}
                <button
                  className="tool-button"
                  type="button"
                  disabled={
                    isAway ||
                    (!dwarf.equippedTool && availableTools < 1)
                  }
                  onClick={() =>
                    dwarf.equippedTool
                      ? onUnequip(dwarf.id)
                      : onEquip(dwarf.id)
                  }
                >
                  {dwarf.equippedTool ? "Return Tool" : "Equip Tool"}
                </button>
              </div>

              <span className="status">{dwarf.status}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
