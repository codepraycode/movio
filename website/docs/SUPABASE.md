# Supabase setup

Movio Survey uses Supabase (hosted Postgres) for two tables: `waitlist` and
`survey_responses`. The browser only ever **inserts** — Row Level Security blocks
client-side reads, so you read collected data from the Supabase dashboard.

## 1. Create a project

1. Go to <https://supabase.com> and create a free project.
2. Wait for it to finish provisioning.

## 2. Create the tables and policies

Open **Dashboard → SQL Editor → New query**, paste the contents of
[`../supabase/schema.sql`](../supabase/schema.sql), and click **Run**.

This creates:

- **`waitlist`** — `id`, `name`, `email` (unique), `created_at`.
- **`survey_responses`** — `id`, `created_at`, and one column per survey question
  (see mapping below).

It also enables RLS and adds an **insert-only policy for anonymous users** on both
tables. The script is safe to re-run.

## 3. Get your API keys

**Dashboard → Settings → API**, copy:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`

Put them in `.env.local` locally and in Vercel's environment variables for
production. The anon key is safe to expose in the browser — RLS is what protects
your data.

## 4. Question → column mapping

The survey definition in `src/lib/survey.ts` uses keys that match the
`survey_responses` columns exactly, so the whole answer object inserts in one call.

| Q   | Column                     | Type      |
| --- | -------------------------- | --------- |
| Q1  | `study_level`              | text      |
| Q2  | `shuttle_frequency`        | text      |
| Q3  | `wait_time`                | text      |
| Q4  | `arrival_awareness`        | text      |
| Q5  | `late_for_lecture`         | text      |
| Q6  | `full_bus_experience`      | text      |
| Q7  | `change_problem`           | text      |
| Q8  | `satisfaction_score`       | integer   |
| Q9  | `biggest_problem`          | text      |
| Q10 | `has_nfc`                  | text      |
| Q11 | `live_tracking_usefulness` | text      |
| Q12 | `tap_to_board_interest`    | text      |
| Q13 | `desired_features`         | text[]    |
| Q14 | `app_comfort`              | text      |
| Q15 | `additional_comments`      | text      |

## 5. Reading & exporting your data

- **View:** Dashboard → **Table Editor** → `survey_responses` / `waitlist`.
- **Export for your report:** select the table → the export / download icon →
  **Download as CSV**. Include the summary as an appendix if your supervisor asks
  for raw data.

## Troubleshooting

- **Inserts fail with a policy error** — the RLS insert policy didn't get created.
  Re-run `schema.sql`.
- **Console warns about missing env vars** — `.env.local` is missing or empty.
  Copy `.env.example` and fill it in, then restart `pnpm dev`.
- **Duplicate waitlist email** — expected; the unique constraint on `email`
  raises Postgres error `23505`, which the form catches and shows as
  "This email is already on the waitlist."
