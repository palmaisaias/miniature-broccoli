export type WorldCupGroup = {
  name: string;
  teams: string[];
};

type Props = {
  groups: WorldCupGroup[];
};

export default function WorldCupGroups({ groups }: Props) {
  return (
    <div className="groupsGrid">
      {groups.map((group) => (
        <article className="groupCard" key={group.name}>
          <div className="groupHeader">
            <span>{group.name}</span>
            <small>{group.teams.length} teams</small>
          </div>
          <ol className="groupTeams">
            {group.teams.map((team) => (
              <li key={`${group.name}-${team}`}>{team}</li>
            ))}
          </ol>
        </article>
      ))}
    </div>
  );
}
