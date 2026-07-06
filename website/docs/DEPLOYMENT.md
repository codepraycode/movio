# Deploying to Vercel

The app is a static Vite SPA, so Vercel hosts it for free with zero config beyond
environment variables.

## Prerequisites

- The Supabase project is set up (see [`SUPABASE.md`](SUPABASE.md)).
- The code is pushed to a GitHub repository.

## Steps

1. **Import the repo**
   Go to <https://vercel.com>, **Add New → Project**, and import your GitHub repo.
   Vercel auto-detects the Vite framework preset:
   - Build command: `pnpm build`
   - Output directory: `dist`
   - Install command: `pnpm install`

2. **Add environment variables**
   Under **Project Settings → Environment Variables**, add (for all environments):

   | Name                     | Value                      |
   | ------------------------ | -------------------------- |
   | `VITE_SUPABASE_URL`      | your Supabase project URL  |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key     |

   > Vite only exposes variables prefixed with `VITE_` to the browser. After
   > changing env vars you must trigger a redeploy.

3. **Deploy**
   Click **Deploy**. Vercel builds and gives you a `*.vercel.app` URL. Every
   push to the default branch auto-deploys.

## Client-side routing

`vercel.json` rewrites all paths to `/index.html` so deep links like
`/survey` resolve to the SPA instead of 404-ing:

```json
{
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Post-deploy checklist

- [ ] Open the deployed URL on your **phone** — most students open it via WhatsApp.
- [ ] Submit a full survey and confirm the row lands in `survey_responses`.
- [ ] Test the **"Never"** conditional exit on Q2.
- [ ] Test the **Q13 max-3** validation.
- [ ] Submit a **duplicate waitlist email** and confirm the friendly error.
- [ ] Copy the final URL — this is what you share and paste into your report.
