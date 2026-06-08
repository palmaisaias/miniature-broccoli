import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMatch } from "@/lib/schedule";
import { readStore, writeStore } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const store = await readStore();
  return NextResponse.json({
    picks: store.picks.filter((pick) => pick.userId === user.id)
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const matchId = String(body.matchId ?? "");
  const winner = String(body.winner ?? "");
  const match = getMatch(matchId);

  if (!match) {
    return NextResponse.json({ error: "Unknown match." }, { status: 404 });
  }

  if (![match.homeTeam, match.awayTeam].includes(winner)) {
    return NextResponse.json({ error: "Pick one of the two listed sides." }, { status: 400 });
  }

  const store = await readStore();
  const existing = store.picks.find((pick) => pick.userId === user.id && pick.matchId === match.id);
  const updatedPick = {
    userId: user.id,
    matchId: match.id,
    winner,
    updatedAt: new Date().toISOString()
  };

  if (existing) {
    Object.assign(existing, updatedPick);
  } else {
    store.picks.push(updatedPick);
  }

  await writeStore(store);
  return NextResponse.json({ pick: updatedPick });
}
