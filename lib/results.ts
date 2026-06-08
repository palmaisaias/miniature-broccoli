import type { Match, MatchResult } from "./types";

function outputTextFromResponse(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;

  const output = Array.isArray(payload.output) ? payload.output : [];
  return output
    .flatMap((item) => {
      const content = item && typeof item === "object" && "content" in item ? item.content : [];
      return Array.isArray(content) ? content : [];
    })
    .map((content) => {
      if (content && typeof content === "object" && "text" in content && typeof content.text === "string") {
        return content.text;
      }
      return "";
    })
    .join("\n")
    .trim();
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const jsonText = fenced?.[1] ?? text.match(/\{[\s\S]*\}/)?.[0] ?? text;
  return JSON.parse(jsonText);
}

function normalizedWinner(winner: unknown, match: Match) {
  if (typeof winner !== "string") return undefined;
  const lower = winner.toLowerCase();
  if (lower === match.homeTeam.toLowerCase()) return match.homeTeam;
  if (lower === match.awayTeam.toLowerCase()) return match.awayTeam;
  return winner;
}

export function scheduledResult(match: Match, note = "This match has not kicked off yet."): MatchResult {
  return {
    matchId: match.id,
    status: "scheduled",
    note,
    updatedAt: new Date().toISOString()
  };
}

export async function refreshResultWithOpenAI(match: Match): Promise<MatchResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY. Add it to .env.local before refreshing match results.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5",
      tools: [
        {
          type: "web_search",
          filters: {
            allowed_domains: ["fifa.com"]
          }
        }
      ],
      input: [
        {
          role: "system",
          content:
            "You verify football match results using current web sources. Return only strict JSON and do not guess."
        },
        {
          role: "user",
          content: `Find the official result for this 2026 FIFA World Cup match:
Date/time: ${match.dateLabel} ${match.kickoff} Pacific Time
Venue: ${match.venue}
Match: ${match.homeTeam} vs ${match.awayTeam}

Return only JSON with this shape:
{
  "status": "scheduled" | "in_progress" | "final" | "unknown",
  "homeScore": number | null,
  "awayScore": number | null,
  "winner": string | null,
  "note": string,
  "sourceUrl": string | null
}

Only mark "final" when a reliable FIFA source shows a completed score. If the match has not been played, use "scheduled".`
        }
      ]
    })
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? JSON.stringify(payload.error)
        : "OpenAI result refresh failed.";
    throw new Error(message);
  }

  const text = outputTextFromResponse(payload);
  const parsed = extractJson(text);
  const status = ["scheduled", "in_progress", "final", "unknown"].includes(parsed.status)
    ? parsed.status
    : "unknown";

  return {
    matchId: match.id,
    status,
    homeScore: typeof parsed.homeScore === "number" ? parsed.homeScore : undefined,
    awayScore: typeof parsed.awayScore === "number" ? parsed.awayScore : undefined,
    winner: normalizedWinner(parsed.winner, match),
    note: typeof parsed.note === "string" ? parsed.note : undefined,
    sourceUrl: typeof parsed.sourceUrl === "string" ? parsed.sourceUrl : undefined,
    updatedAt: new Date().toISOString()
  };
}
