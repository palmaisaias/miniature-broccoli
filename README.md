# Family World Cup Bracket

Private family bracket app for the 2026 World Cup.

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Data

- Match data is parsed from `WC Schedule.txt`.
- In production, users, sessions, picks, and refreshed results are stored in Supabase.
- In local development without Supabase env vars, the app falls back to `data/store.json`.

## Result Refresh

The `Check` button calls `/api/results/refresh`. Before kickoff it records the match as scheduled. After a match window has passed, it uses the OpenAI Responses API with web search filtered to `fifa.com`.

Create `.env.local`:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5
```

## Hosting

Use `HOSTING.md` for the Vercel + Supabase setup steps.
