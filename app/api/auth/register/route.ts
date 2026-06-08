import { NextResponse } from "next/server";
import { createSession, createUser, validateCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username ?? "");
  const password = String(body.password ?? "");
  const displayName = String(body.displayName ?? "");
  const credentials = validateCredentials(username, password);

  if (!credentials.ok) {
    return NextResponse.json({ error: credentials.error }, { status: 400 });
  }

  const result = await createUser(credentials.username, password, displayName);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  await createSession(result.user);
  return NextResponse.json({ user: result.user });
}
