import type { FamilyPicksEntry } from "@/lib/family-picks";
import type { Match } from "@/lib/types";

type Props = {
  entries: FamilyPicksEntry[];
  matches: Match[];
};

const COMMENTARY = [
  "A pick made with impressive confidence and limited evidence.",
  "Bold. Not wise, exactly, but bold.",
  "The committee has reviewed this and chosen silence.",
  "This has strong group chat screenshot energy.",
  "A selection that really asks the bracket to do unpaid labor.",
  "Mathematically possible, emotionally suspicious.",
  "A pick so personal it may need its own apology.",
  "Respectfully, this is why pencils have erasers."
];

function pickComment(displayName: string, matchId: string, winner: string) {
  const seed = `${displayName}-${matchId}-${winner}`;
  const total = Array.from(seed).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return COMMENTARY[total % COMMENTARY.length];
}

export default function FamilyPicksBoard({ entries, matches }: Props) {
  const matchesById = new Map(matches.map((match) => [match.id, match]));
  const activeEntries = entries.filter((entry) => entry.picks.length > 0);

  if (entries.length === 0) {
    return (
      <div className="emptyState">
        <h3>No one else has joined yet.</h3>
        <p>The family is currently undefeated at avoiding accountability.</p>
      </div>
    );
  }

  if (activeEntries.length === 0) {
    return (
      <div className="emptyState">
        <h3>No picks from anyone else yet.</h3>
        <p>A rare moment where nobody is wrong. Deeply temporary.</p>
      </div>
    );
  }

  return (
    <div className="familyPicksBoard">
      {activeEntries.map((entry, entryIndex) => (
        <section className="familyPickPerson" key={`${entry.displayName}-${entryIndex}`}>
          <div className="familyPickHeader">
            <h3>{entry.displayName}</h3>
            <span>{entry.picks.length} picks</span>
          </div>

          <div className="familyPickList">
            {entry.picks.map((pick, pickIndex) => {
              const match = matchesById.get(pick.matchId);

              return (
                <article className="familyPickCard" key={`${entry.displayName}-${pick.matchId}-${pickIndex}`}>
                  <div>
                    <span className="familyPickMatch">
                      {match ? `${match.homeTeam} vs ${match.awayTeam}` : "Unknown match"}
                    </span>
                    {match && (
                      <span className="familyPickMeta">
                        {match.dateLabel} · {match.kickoff}
                      </span>
                    )}
                  </div>
                  <strong>{pick.winner}</strong>
                  <p>{pickComment(entry.displayName, pick.matchId, pick.winner)}</p>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
