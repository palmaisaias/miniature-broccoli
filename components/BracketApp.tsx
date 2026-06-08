"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import FamilyPicksBoard from "@/components/FamilyPicksBoard";
import WorldCupGroups, { type WorldCupGroup } from "@/components/WorldCupGroups";
import type { FamilyPicksEntry } from "@/lib/family-picks";
import type { Match, MatchResult, Pick, PublicUser, ResultRefreshResponse, Stage } from "@/lib/types";
import AnimatedToast from "@/components/AnimatedToast";

type Props = {
  groups: WorldCupGroup[];
  matches: Match[];
};

type AuthMode = "login" | "register";
type Filter = "all" | "mine" | "group" | "knockout" | "wrong";
type ToastType = "success" | "error" | "info";

type ToastState = {
  message: string;
  type: ToastType;
  phase: "center" | "corner";
};

const FILTERS: { id: Filter; label: string; requiresAuth?: boolean }[] = [
  { id: "all", label: "All matches" },
  { id: "mine", label: "My picks" },
  { id: "group", label: "Groups" },
  { id: "knockout", label: "Knockouts" },
  { id: "wrong", label: "See Who's Wrong", requiresAuth: true }
];

const STAGE_ACCENT: Record<Stage, string> = {
  "Group Stage": "stageGreen",
  "Round of 32": "stageBlue",
  "Round of 16": "stageBlue",
  Quarterfinal: "stageGold",
  Semifinal: "stageGold",
  "Third-place match": "stageCoral",
  Final: "stageCoral"
};

type IconProps = {
  size?: number;
  className?: string;
};

function Icon({
  size = 18,
  className,
  children
}: IconProps & {
  children: React.ReactNode;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

function CalendarDays(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </Icon>
  );
}

function Check(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12 4 4L19 6" />
    </Icon>
  );
}

function Clock3(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l4 2" />
    </Icon>
  );
}

function LogOut(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 17 15 12 10 7" />
      <path d="M15 12H3" />
      <path d="M21 3v18h-8" />
    </Icon>
  );
}

function RefreshCw(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 11a8 8 0 0 0-14.5-4.5L4 8" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.5 4.5L20 16" />
      <path d="M20 20v-4h-4" />
    </Icon>
  );
}

function Shield(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </Icon>
  );
}

function Sparkles(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
      <path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />
    </Icon>
  );
}

function Trophy(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4v2a4 4 0 0 0 4 4" />
      <path d="M16 6h4v2a4 4 0 0 1-4 4" />
      <path d="M12 13v5" />
      <path d="M8 21h8" />
      <path d="M9 18h6" />
    </Icon>
  );
}

function UserRound(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Icon>
  );
}

function resultLabel(result?: MatchResult) {
  if (!result) return "No score";
  if (result.status === "final" && typeof result.homeScore === "number" && typeof result.awayScore === "number") {
    return `${result.homeScore}-${result.awayScore}`;
  }
  return result.status.replace("_", " ");
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(iso));
}

export default function BracketApp({ groups, matches }: Props) {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [savingPick, setSavingPick] = useState("");
  const [refreshing, setRefreshing] = useState("");
  const [familyEntries, setFamilyEntries] = useState<FamilyPicksEntry[]>([]);
  const [familyEntriesLoading, setFamilyEntriesLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [outcomeMatchId, setOutcomeMatchId] = useState<string | null>(null);

  function showAnimatedToast(message: string, type: ToastType = "info") {
    setToast({
      message,
      type,
      phase: "center"
    });

    window.setTimeout(() => {
      setToast((current) => (current ? { ...current, phase: "corner" } : current));
    }, 900);

    window.setTimeout(() => {
      setToast(null);
    }, 4200);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((payload) => {
        setUser(payload.user);
        setPicks(payload.picks ?? []);
        setResults(payload.results ?? []);
      })
      .catch(() => showAnimatedToast("Could not load your saved bracket.", "error"));
  }, []);

  const picksByMatch = useMemo(() => new Map(picks.map((pick) => [pick.matchId, pick])), [picks]);
  const resultsByMatch = useMemo(() => new Map(results.map((result) => [result.matchId, result])), [results]);

  const summary = useMemo(() => {
    const decidedPicks = picks.filter((pick) => resultsByMatch.get(pick.matchId)?.status === "final");
    const correct = decidedPicks.filter((pick) => resultsByMatch.get(pick.matchId)?.winner === pick.winner).length;

    return {
      picks: picks.length,
      correct,
      decided: decidedPicks.length,
      remaining: matches.length - picks.length
    };
  }, [matches.length, picks, resultsByMatch]);

  const visibleMatches = useMemo(() => {
    return matches.filter((match) => {
      if (filter === "mine") return picksByMatch.has(match.id);
      if (filter === "group") return false;
      if (filter === "wrong") return false;
      if (filter === "knockout") return match.stage !== "Group Stage";
      return true;
    });
  }, [filter, matches, picksByMatch]);

  const groupedMatches = useMemo(() => {
    return visibleMatches.reduce<Record<string, Match[]>>((groups, match) => {
      groups[match.dateLabel] ??= [];
      groups[match.dateLabel].push(match);
      return groups;
    }, {});
  }, [visibleMatches]);

  useEffect(() => {
    if (!user) return;
    const finalPick = picks.find((pick) => {
      const result = resultsByMatch.get(pick.matchId);
      const dismissedKey = `wc-outcome-${user.id}-${pick.matchId}`;
      return result?.status === "final" && result.winner && sessionStorage.getItem(dismissedKey) !== "dismissed";
    });

    setOutcomeMatchId(finalPick?.matchId ?? null);
  }, [picks, resultsByMatch, user]);

  useEffect(() => {
    if (filter !== "wrong" || !user) return;

    setFamilyEntriesLoading(true);
    fetch("/api/family-picks")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Could not load family picks.");
        setFamilyEntries(payload.entries ?? []);
      })
      .catch((error) =>
        showAnimatedToast(error instanceof Error ? error.message : "Could not load family picks.", "error")
      )
      .finally(() => setFamilyEntriesLoading(false));
  }, [filter, user]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, displayName })
    });
    const payload = await response.json();

    if (!response.ok) {
      setAuthError(payload.error ?? "Could not sign in.");
      return;
    }

    setUser(payload.user);
    setPicks([]);
    setAuthError("");
    showAnimatedToast(authMode === "register" ? "Bracket created. Start making picks." : "Welcome back.", "success");

    const session = await fetch("/api/auth/me").then((res) => res.json());
    setPicks(session.picks ?? []);
    setResults(session.results ?? []);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setPicks([]);
    setFamilyEntries([]);
    if (filter === "wrong") setFilter("all");
    showAnimatedToast("Signed out.", "info");
  }

  function selectFilter(item: (typeof FILTERS)[number]) {
    if (item.requiresAuth && !user) {
      showAnimatedToast("Sign in first. Public humiliation has a login screen.", "error");
      return;
    }

    setFilter(item.id);
  }

  async function savePick(match: Match, winner: string) {
    if (!user) {
      showAnimatedToast("Sign in first...dumbass.", "error");
      return;
    }

    setSavingPick(match.id);
    const response = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, winner })
    });
    const payload = await response.json();
    setSavingPick("");

    if (!response.ok) {
      showAnimatedToast(payload.error ?? "Could not save that pick.", "error");
      return;
    }

    setPicks((current) => {
      const rest = current.filter((pick) => pick.matchId !== match.id);
      return [...rest, payload.pick];
    });
    showAnimatedToast(`${winner} saved for ${match.homeTeam} vs ${match.awayTeam}.`, "success");
  }

  async function refreshResult(match: Match) {
    if (!user) {
      showAnimatedToast("Sign in first to check saved results.", "error");
      return;
    }

    setRefreshing(match.id);
    const response = await fetch("/api/results/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id })
    });
    const payload: ResultRefreshResponse & { error?: string } = await response.json();
    setRefreshing("");

    if (!response.ok) {
      showAnimatedToast(payload.error ?? "Could not refresh this result.", "error");
      return;
    }

    setResults((current) => {
      const rest = current.filter((result) => result.matchId !== payload.result.matchId);
      return [...rest, payload.result];
    });
    showAnimatedToast(payload.result.status === "final" ? "Final score updated." : "No final score yet.", "info");
  }

  const outcomeMatch = outcomeMatchId ? matches.find((match) => match.id === outcomeMatchId) : null;
  const outcomePick = outcomeMatchId ? picksByMatch.get(outcomeMatchId) : null;
  const outcomeResult = outcomeMatchId ? resultsByMatch.get(outcomeMatchId) : null;
  const pickedWinner = outcomePick && outcomeResult?.winner === outcomePick.winner;

  function dismissOutcome() {
    if (user && outcomeMatchId) {
      sessionStorage.setItem(`wc-outcome-${user.id}-${outcomeMatchId}`, "dismissed");
    }
    setOutcomeMatchId(null);
  }

  return (
    <main className="appShell">
      <section className="hero">
        <div className="heroMedia" />
        <div className="heroOverlay" />
        <div className="heroContent">
          <div className="brandLockup">
            <span className="mark">
              <Trophy size={22} />
            </span>
            <span>Palma Family World Cup Bracket</span>
          </div>
          <h1>Pick every matchup, no one is gonna get it anyway.</h1>
          <p>
            Sign in once, make your picks, and come back through the tournament to check scores and outcomes.
          </p>
        </div>
      </section>

      <section className="workspace">
        <aside className="sidePanel">
          <div className="panelHeader">
            <Shield size={20} />
            <div>
              <span>Private bracket</span>
              <strong>{user ? user.displayName : "Family login"}</strong>
            </div>
          </div>

          {user ? (
            <div className="accountPanel">
              <div className="scoreGrid">
                <div>
                  <span>{summary.picks}</span>
                  <small>Picks</small>
                </div>
                <div>
                  <span>{summary.decided ? `${summary.correct}/${summary.decided}` : "-"}</span>
                  <small>Correct</small>
                </div>
                <div>
                  <span>{summary.remaining}</span>
                  <small>Open</small>
                </div>
              </div>
              <button className="ghostButton fullWidth" onClick={signOut}>
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          ) : (
            <form className="authForm" onSubmit={handleAuth}>
              <div className="modeSwitch" aria-label="Authentication mode">
                <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>
                  Log in
                </button>
                <button
                  type="button"
                  className={authMode === "register" ? "active" : ""}
                  onClick={() => setAuthMode("register")}
                >
                  Create
                </button>
              </div>

              {authMode === "register" && (
                <label>
                  Display name
                  <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Isaias" />
                </label>
              )}

              <label>
                Username
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="isaias" />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 4 characters"
                />
              </label>

              {authError && <p className="formError">{authError}</p>}

              <button className="primaryButton" type="submit">
                <UserRound size={16} />
                {authMode === "register" ? "Create bracket" : "Log in"}
              </button>
            </form>
          )}

          <div className="notesBlock">
            <div>
              <CalendarDays size={16} />
              <span>Pacific time schedule</span>
            </div>
            <div>
              <Sparkles size={16} />
              <span>OpenAI result checks after games</span>
            </div>
          </div>
        </aside>

        <section className="schedulePanel">
          <div className="scheduleTopbar">
            <div>
              <span className="eyebrow">2026 World Cup</span>
              <h2>{filter === "wrong" ? "Family Picks" : filter === "group" ? "Groups" : "Match Schedule"}</h2>
            </div>
            <div className="filters">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  className={filter === item.id ? "active" : ""}
                  onClick={() => selectFilter(item)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="matchList">
            {filter === "group" ? (
              <WorldCupGroups groups={groups} />
            ) : filter === "wrong" ? (
              familyEntriesLoading ? (
                <div className="emptyState">
                  <h3>Loading everyone else's picks.</h3>
                  <p>Preparing judgment. Please hydrate.</p>
                </div>
              ) : (
                <FamilyPicksBoard entries={familyEntries} matches={matches} />
              )
            ) : Object.entries(groupedMatches).map(([dateLabel, dateMatches]) => (
              <section className="dayGroup" key={dateLabel}>
                <h3>{dateLabel}</h3>
                <div className="dayMatches">
                  {dateMatches.map((match) => {
                    const selected = picksByMatch.get(match.id)?.winner;
                    const result = resultsByMatch.get(match.id);
                    const finalCorrect = result?.status === "final" && selected && result.winner === selected;
                    const finalWrong = result?.status === "final" && selected && result.winner && result.winner !== selected;

                    return (
                      <article className="matchCard" key={match.id}>
                        <div className="matchMeta">
                          <span className={`stagePill ${STAGE_ACCENT[match.stage]}`}>{match.stage}</span>
                          <span>
                            <Clock3 size={14} />
                            {match.kickoff}
                          </span>
                          <span>{match.venue}</span>
                        </div>

                        <div className="teams">
                          {[match.homeTeam, match.awayTeam].map((team, teamIndex) => (
                            <button
                              key={`${match.id}-${teamIndex}-${team}`}
                              className={`teamButton ${selected === team ? "selected" : ""}`}
                              disabled={!match.selectable || savingPick === match.id}
                              onClick={() => savePick(match, team)}
                            >
                              <span>{team}</span>
                              {selected === team && <Check size={17} />}
                            </button>
                          ))}
                        </div>

                        <div className="matchFooter">
                          <div className={`resultBadge ${finalCorrect ? "win" : ""} ${finalWrong ? "loss" : ""}`}>
                            {resultLabel(result)}
                          </div>
                          <button className="iconButton" onClick={() => refreshResult(match)} disabled={refreshing === match.id}>
                            <RefreshCw size={15} className={refreshing === match.id ? "spin" : ""} />
                            Check
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      </section>

      {toast && (
        <AnimatedToast
          message={toast.message}
          type={toast.type}
          phase={toast.phase}
          // onClose={() => setToast(null)}
        />
      )}

      {outcomeMatch && outcomePick && outcomeResult?.winner && (
        <div className="modalBackdrop" role="dialog" aria-modal="true">
          <div className="outcomeModal">
            <span className={pickedWinner ? "outcomeIcon win" : "outcomeIcon loss"}>
              <Trophy size={28} />
            </span>
            <p className="eyebrow">{formatDate(outcomeResult.updatedAt)}</p>
            <h2>{pickedWinner ? "Your pick won." : "Your pick lost."}</h2>
            <p>
              You picked {outcomePick.winner}. {outcomeResult.winner} won {outcomeMatch.homeTeam} vs {outcomeMatch.awayTeam}.
            </p>
            <button className="primaryButton" onClick={dismissOutcome}>
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
}