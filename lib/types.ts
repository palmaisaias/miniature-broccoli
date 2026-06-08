export type Stage =
  | "Group Stage"
  | "Round of 32"
  | "Round of 16"
  | "Quarterfinal"
  | "Semifinal"
  | "Third-place match"
  | "Final";

export type Match = {
  id: string;
  stage: Stage;
  dateLabel: string;
  dateKey: string;
  kickoff: string;
  kickoffIso: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  selectable: boolean;
};

export type PublicUser = {
  id: string;
  username: string;
  displayName: string;
};

export type Pick = {
  userId: string;
  matchId: string;
  winner: string;
  updatedAt: string;
};

export type ResultStatus = "scheduled" | "in_progress" | "final" | "unknown";

export type MatchResult = {
  matchId: string;
  status: ResultStatus;
  winner?: string;
  homeScore?: number;
  awayScore?: number;
  note?: string;
  sourceUrl?: string;
  updatedAt: string;
};

export type ResultRefreshResponse = {
  result: MatchResult;
  message?: string;
};
