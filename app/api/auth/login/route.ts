import { NextResponse } from "next/server";
import { createSession, validateCredentials, verifyUser } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username ?? "");
  const password = String(body.password ?? "");
  const credentials = validateCredentials(username, password);

  if (!credentials.ok) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const user = await verifyUser(credentials.username, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  await createSession(user);
  return NextResponse.json({ user });
}
