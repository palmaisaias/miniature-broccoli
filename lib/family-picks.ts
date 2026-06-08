import { readStore } from "./store";

export type FamilyPick = {
  matchId: string;
  winner: string;
  updatedAt: string;
};

export type FamilyPicksEntry = {
  displayName: string;
  picks: FamilyPick[];
};

export async function getFamilyPicksForViewer(viewerUserId: string): Promise<FamilyPicksEntry[]> {
  const store = await readStore();

  return store.users
    .filter((user) => user.id !== viewerUserId)
    .map((user) => ({
      displayName: user.displayName,
      picks: store.picks
        .filter((pick) => pick.userId === user.id)
        .map((pick) => ({
          matchId: pick.matchId,
          winner: pick.winner,
          updatedAt: pick.updatedAt
        }))
        .sort((a, b) => a.matchId.localeCompare(b.matchId))
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}
