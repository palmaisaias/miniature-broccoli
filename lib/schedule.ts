import { readFileSync } from "fs";
import path from "path";
import type { Match, Stage } from "./types";

const MONTHS: Record<string, number> = {
  JUNE: 5,
  JULY: 6
};

const STAGES: Stage[] = [
  "Round of 32",
  "Round of 16.",
  "Quarterfinal",
  "Semifinal",
  "Third-place match",
  "Final"
];

function titleCaseDay(header: string) {
  return header
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toTwentyFourHour(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s(PM|AM)$/);
  if (!match) return { hour: 0, minute: 0 };
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3];

  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  return { hour, minute };
}

function parseStage(matchup: string): { stage: Stage; homeTeam: string; awayTeam: string } {
  const knownStage = STAGES.find((stage) => matchup.startsWith(`${stage} - `));
  const stage = knownStage ?? "Group Stage";
  const teamText = knownStage ? matchup.slice(`${knownStage} - `.length) : matchup;
  const [homeTeam = "TBD", awayTeam = "TBD"] = teamText.split(" vs ").map((team) => team.trim());

  return { stage, homeTeam, awayTeam };
}

export function getSchedule(): Match[] {
  const filePath = path.join(process.cwd(), "WC Schedule.txt");
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  const matches: Match[] = [];
  let currentDateLabel = "";
  let currentDateKey = "";
  let month = 5;
  let day = 11;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("2026 WORLD CUP") || line.startsWith("Times:")) continue;

    const dateMatch = line.match(/^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY),\s+(JUNE|JULY)\s+(\d{1,2})$/);
    if (dateMatch) {
      month = MONTHS[dateMatch[2]];
      day = Number(dateMatch[3]);
      currentDateLabel = titleCaseDay(line);
      currentDateKey = `2026-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      continue;
    }

    const match = line.match(/^(\d{1,2}:\d{2}\s(?:AM|PM))\s-\s(.+)\s-\s(.+)$/);
    if (!match || !currentDateKey) continue;

    const kickoff = match[1];
    const matchup = match[2];
    const venue = match[3];
    const { stage, homeTeam, awayTeam } = parseStage(matchup);
    const { hour, minute } = toTwentyFourHour(kickoff);
    const kickoffIso = new Date(2026, month, day, hour, minute).toISOString();
    const index = matches.length + 1;

    matches.push({
      id: `m${String(index).padStart(3, "0")}-${slug(`${currentDateKey}-${kickoff}-${homeTeam}-${awayTeam}`)}`,
      stage,
      dateLabel: currentDateLabel,
      dateKey: currentDateKey,
      kickoff,
      kickoffIso,
      venue,
      homeTeam,
      awayTeam,
      selectable: !homeTeam.includes("TBD") && !awayTeam.includes("TBD")
    });
  }

  return matches;
}

export function getMatch(matchId: string) {
  return getSchedule().find((match) => match.id === matchId);
}
