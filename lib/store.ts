import { promises as fs } from "fs";
import path from "path";
import type { MatchResult, Pick, PublicUser } from "./types";

type StoredUser = PublicUser & {
  passwordHash: string;
  salt: string;
  createdAt: string;
};

type Session = {
  token: string;
  userId: string;
  expiresAt: string;
};

type Store = {
  users: StoredUser[];
  sessions: Session[];
  picks: Pick[];
  results: MatchResult[];
};

const STORE_PATH = path.join(process.cwd(), "data", "store.json");
const TABLES = {
  users: "family_bracket_users",
  sessions: "family_bracket_sessions",
  picks: "family_bracket_picks",
  results: "family_bracket_results"
};

const EMPTY_STORE: Store = {
  users: [],
  sessions: [],
  picks: [],
  results: []
};

type SupabaseConfig = {
  restUrl: string;
  serviceRoleKey: string;
};

function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return {
    restUrl: `${url.replace(/\/$/, "")}/rest/v1`,
    serviceRoleKey
  };
}

async function ensureStore() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(EMPTY_STORE, null, 2));
  }
}

export async function readStore(): Promise<Store> {
  const config = getSupabaseConfig();
  if (config) {
    return readSupabaseStore(config);
  }

  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  return { ...EMPTY_STORE, ...JSON.parse(raw) };
}

export async function writeStore(store: Store) {
  const config = getSupabaseConfig();
  if (config) {
    await writeSupabaseStore(config, store);
    return;
  }

  await ensureStore();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName
  };
}

async function supabaseRequest<T>(
  config: SupabaseConfig,
  table: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    query?: string;
    body?: unknown;
    prefer?: string;
  } = {}
): Promise<T> {
  const response = await fetch(`${config.restUrl}/${table}${options.query ?? ""}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase ${table} request failed: ${detail}`);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function readSupabaseStore(config: SupabaseConfig): Promise<Store> {
  const [users, sessions, picks, results] = await Promise.all([
    supabaseRequest<Record<string, string>[]>(config, TABLES.users, { query: "?select=*" }),
    supabaseRequest<Record<string, string>[]>(config, TABLES.sessions, { query: "?select=*" }),
    supabaseRequest<Record<string, string>[]>(config, TABLES.picks, { query: "?select=*" }),
    supabaseRequest<Record<string, string | number | null>[]>(config, TABLES.results, { query: "?select=*" })
  ]);

  return {
    users: users.map((row) => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      passwordHash: row.password_hash,
      salt: row.salt,
      createdAt: row.created_at
    })),
    sessions: sessions.map((row) => ({
      token: row.token,
      userId: row.user_id,
      expiresAt: row.expires_at
    })),
    picks: picks.map((row) => ({
      userId: row.user_id,
      matchId: row.match_id,
      winner: row.winner,
      updatedAt: row.updated_at
    })),
    results: results.map((row) => ({
      matchId: String(row.match_id),
      status: row.status as MatchResult["status"],
      winner: typeof row.winner === "string" ? row.winner : undefined,
      homeScore: typeof row.home_score === "number" ? row.home_score : undefined,
      awayScore: typeof row.away_score === "number" ? row.away_score : undefined,
      note: typeof row.note === "string" ? row.note : undefined,
      sourceUrl: typeof row.source_url === "string" ? row.source_url : undefined,
      updatedAt: String(row.updated_at)
    }))
  };
}

async function writeSupabaseStore(config: SupabaseConfig, store: Store) {
  const userRows = store.users.map((user) => ({
    id: user.id,
    username: user.username,
    display_name: user.displayName,
    password_hash: user.passwordHash,
    salt: user.salt,
    created_at: user.createdAt
  }));

  const sessionRows = store.sessions.map((session) => ({
    token: session.token,
    user_id: session.userId,
    expires_at: session.expiresAt
  }));

  const pickRows = store.picks.map((pick) => ({
    user_id: pick.userId,
    match_id: pick.matchId,
    winner: pick.winner,
    updated_at: pick.updatedAt
  }));

  const resultRows = store.results.map((result) => ({
    match_id: result.matchId,
    status: result.status,
    winner: result.winner ?? null,
    home_score: result.homeScore ?? null,
    away_score: result.awayScore ?? null,
    note: result.note ?? null,
    source_url: result.sourceUrl ?? null,
    updated_at: result.updatedAt
  }));

  await Promise.all([
    userRows.length
      ? supabaseRequest(config, TABLES.users, {
          method: "POST",
          query: "?on_conflict=id",
          body: userRows,
          prefer: "resolution=merge-duplicates"
        })
      : Promise.resolve(),
    supabaseRequest(config, TABLES.sessions, {
      method: "DELETE",
      query: "?token=not.is.null"
    }),
    pickRows.length
      ? supabaseRequest(config, TABLES.picks, {
          method: "POST",
          query: "?on_conflict=user_id,match_id",
          body: pickRows,
          prefer: "resolution=merge-duplicates"
        })
      : Promise.resolve(),
    resultRows.length
      ? supabaseRequest(config, TABLES.results, {
          method: "POST",
          query: "?on_conflict=match_id",
          body: resultRows,
          prefer: "resolution=merge-duplicates"
        })
      : Promise.resolve()
  ]);

  if (sessionRows.length) {
    await supabaseRequest(config, TABLES.sessions, {
      method: "POST",
      body: sessionRows
    });
  }
}
