# Hosting Checklist

This app is ready for Vercel + Supabase once the database tables and environment variables are in place.

## 1. Create Supabase Tables

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Open `supabase/schema.sql` from this project.
4. Paste the full file into Supabase SQL Editor.
5. Click **Run**.

The app uses the Supabase service role key only from Next.js API routes. The browser never receives that key.

## 2. Get Supabase Values

In Supabase, go to **Project Settings -> API**.

Copy:

- Project URL -> `SUPABASE_URL`
- Service role key -> `SUPABASE_SERVICE_ROLE_KEY`

Keep the service role key private. Do not put it in client-side code and do not commit it to GitHub.

## 3. Local `.env.local`

Your local `.env.local` should look like this:

```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Restart `npm run dev` after changing `.env.local`.

## 4. Push to GitHub

Create a GitHub repo, then push this project.

Important: `.env.local` and `data/store.json` are ignored by git. That is intentional.

## 5. Deploy on Vercel

1. Open Vercel.
2. Click **Add New -> Project**.
3. Import the GitHub repo.
4. Framework preset should be **Next.js**.
5. Add these environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Click **Deploy**.

## 6. Share With Family

After deployment, Vercel gives you a URL like:

```text
https://your-project-name.vercel.app
```

Send that link to your brothers. Each person can create their own account in the app.

## Notes

- Local development still works without Supabase by falling back to `data/store.json`.
- Production should use Supabase so every phone sees the same saved accounts, picks, and results.
- The `Check` button uses OpenAI only after the match window has passed, so it should not spend API credits before games are played.
