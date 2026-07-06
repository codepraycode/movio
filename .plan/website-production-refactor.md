# Plan: Production-ready `website/` refactor (approved 2026-07-06)

Branch: codepraycode/psd-159-mob-9-graceful-no-network-handling (current)

## Decisions
- Backend URL via env vars `VITE_API_BASE_URL` + `VITE_SOCKET_URL`, default `http://localhost:4000`.
- Live map: graceful empty + retry when backend unreachable (Render cold-start/sleep). NO fake demo data.
- Public map hides driver names (privacy).

## A. Backend (additive)
- [ ] `GET /api/v1/tracking/public/active` — no auth, active trips WITHOUT driver names. New model select or strip in controller. Inline TODO note.
- [ ] Manual test plan cases for the public endpoint.

## B. Website routing/shell
- [ ] Routes: `/`, `/live`, `/privacy`, `/terms`, `/survey`, `/admin`, `*`.
- [ ] Navbar: Home · Live map · Survey · Waitlist + mobile menu.
- [ ] Footer: add Live/Privacy/Terms links.

## C. Live map (web port of mobile)
- [ ] Deps (user installs): leaflet, react-leaflet@5, socket.io-client, @types/leaflet.
- [ ] `src/lib/track-api.ts`, `src/lib/socket.ts`.
- [ ] `pages/LiveMap.tsx`: OSM tiles, FUTA bounds, Southgate center, per-type pins, selected pulse, info panel (plate/route/occupancy/last-seen), summary bar + legend, empty/connecting/offline/tile-fail states.
- [ ] `.env.example`: VITE_API_BASE_URL, VITE_SOCKET_URL.

## D. Legal
- [ ] `pages/Privacy.tsx`, `pages/Terms.tsx`, `LegalLayout`. Consistent with mobile LegalContent (no photo, credits=trip counts, not lawyer-reviewed).

## E. Polish
- [ ] `Seo` helper (title/meta/canonical/OG per page).
- [ ] README refresh, AGENTS "Where things stand" update.

## Verify
- Backend yarn build/lint; website yarn build/lint; drive map via `yarn simulate:device`.
