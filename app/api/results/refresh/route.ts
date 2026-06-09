import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { refreshResultWithOpenAI, scheduledResult } from "@/lib/results";
import { getMatch } from "@/lib/schedule";
import { readStore, writeStore } from "@/lib/store";
import type { MatchResult } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const matchId = String(body.matchId ?? "");
  const match = getMatch(matchId);
  if (!match) return NextResponse.json({ error: "Unknown match." }, { status: 404 });

  const kickoff = new Date(match.kickoffIso).getTime();
  const now = Date.now();
  let result: MatchResult;

  try {
    if (now < kickoff + 1000 * 60 * 120) {
      result = scheduledResult(match);
    } else {
      result = await refreshResultWithOpenAI(match);
    }

    const store = await readStore();
    const existing = store.results.find((candidate) => candidate.matchId === result.matchId);
    if (existing) {
      Object.assign(existing, result);
    } else {
      store.results.push(result);
    }
    await writeStore(store);

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not refresh the result."
      },
      { status: 500 }
    );
  }
}
