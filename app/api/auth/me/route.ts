import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readStore } from "@/lib/store";

export async function GET() {
  const user = await getCurrentUser();
  const store = await readStore();

  if (!user) {
    return NextResponse.json({
      user: null,
      picks: [],
      results: store.results
    });
  }

  return NextResponse.json({
    user,
    picks: store.picks.filter((pick) => pick.userId === user.id),
    results: store.results
  });
}
