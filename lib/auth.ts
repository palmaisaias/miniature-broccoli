import { cookies } from "next/headers";
import crypto from "crypto";
import { readStore, toPublicUser, writeStore } from "./store";
import type { PublicUser } from "./types";

const COOKIE_NAME = "wc_family_session";
const SESSION_DAYS = 45;

function normalizeUsername(username: string) {
  return username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
}

function sessionExpiry() {
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DAYS);
  return expires;
}

export function validateCredentials(username: string, password: string) {
  const cleanUsername = normalizeUsername(username);
  if (cleanUsername.length < 2) {
    return { ok: false as const, error: "Use at least 2 letters or numbers for the username." };
  }

  if (password.length < 4) {
    return { ok: false as const, error: "Use a password with at least 4 characters." };
  }

  return { ok: true as const, username: cleanUsername };
}

export async function createUser(username: string, password: string, displayName: string) {
  const store = await readStore();
  if (store.users.some((user) => user.username === username)) {
    return { ok: false as const, error: "That username is already taken." };
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    username,
    displayName: displayName.trim() || username,
    salt,
    passwordHash: hashPassword(password, salt),
    createdAt: now
  };

  store.users.push(user);
  await writeStore(store);

  return { ok: true as const, user: toPublicUser(user) };
}

export async function verifyUser(username: string, password: string) {
  const store = await readStore();
  const user = store.users.find((candidate) => candidate.username === username);
  if (!user) return null;

  const hash = hashPassword(password, user.salt);
  const left = Buffer.from(hash, "hex");
  const right = Buffer.from(user.passwordHash, "hex");

  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  return toPublicUser(user);
}

export async function createSession(user: PublicUser) {
  const store = await readStore();
  const token = crypto.randomBytes(32).toString("hex");
  const expires = sessionExpiry();

  store.sessions = store.sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());
  store.sessions.push({
    token,
    userId: user.id,
    expiresAt: expires.toISOString()
  });
  await writeStore(store);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const store = await readStore();
  const session = store.sessions.find(
    (candidate) => candidate.token === token && new Date(candidate.expiresAt).getTime() > Date.now()
  );
  if (!session) return null;

  const user = store.users.find((candidate) => candidate.id === session.userId);
  return user ? toPublicUser(user) : null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const store = await readStore();
    store.sessions = store.sessions.filter((session) => session.token !== token);
    await writeStore(store);
  }

  cookieStore.delete(COOKIE_NAME);
}
