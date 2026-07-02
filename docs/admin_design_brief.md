# MovIO Admin Dashboard — Design Brief

Grounded in Chapter 3 §3.4.1 (Administrative Dashboard scope) and §3.7.4 (UI design considerations: split-panel layout, live fleet map primary, summary stats secondary). This brief elevates that spec into a distinctive, professional-grade design system — not a generic admin template.

## Subject grounding
This is not a SaaS marketing dashboard. It's an **operations tool** for people making real-time decisions about physical vehicles moving around a real campus, used during a work shift, glanced at repeatedly, not admired once. The design should read like a transit control room, not a startup's analytics page — legibility and glanceable state over decoration.

---

## Design tokens

### Color — functional, not decorative
Two considerations drove this palette: (1) genuine FUTA office conditions (bright rooms, mixed-quality monitors — see assumption above) argue against a dark-only theme, and (2) a live-data tool needs color to *carry meaning* (live vs. stale, normal vs. alert), not just look good.

| Token | Hex | Use |
|---|---|---|
| `ink` | `#101828` | Primary text, headers |
| `paper` | `#FAFAF8` | Base background — warm off-white, not stark clinical white |
| `surface` | `#FFFFFF` | Cards/panels on top of `paper` |
| `line` | `#E4E4E1` | Borders, dividers |
| `transit-blue` | `#1E4FD6` | Primary actions, active nav, links — the "MovIO" brand color |
| `signal-amber` | `#F59E0B` | Live/in-motion state (the pulse marker — see Signature below) |
| `sustain-green` | `#1F8A5F` | **Reserved exclusively for the Sustainability Panel** — nowhere else. This makes that panel visually distinct the moment you land on the dashboard, reinforcing the SDG feature as a real, separate thing rather than one metric among many |
| `alert-red` | `#D9483C` | Complaints, errors, stale-device warnings |

Reasoning for restraint: five functional accents, not one "AI-default" neon accent on black — each color means something specific, so an admin learns the vocabulary once and reads state at a glance from across a room.

### Typography — IBM Plex Sans + IBM Plex Mono
Not Inter (used everywhere, says nothing about this product) and not a cream-background serif (the generic "AI design" default). **IBM Plex Sans** for UI/headers — has real engineering/infrastructure character without being decorative, and excellent tabular figures for data tables. **IBM Plex Mono** for anything that's actually data: GPS coordinates, trip IDs, timestamps, NFC UIDs. This is a deliberate, subject-grounded choice: setting raw telemetry in monospace signals "this is real machine data" the moment you see it, distinct from prose UI text.

**Practical note, grounded in a real defence-day risk:** self-host both font files in the repo rather than loading from Google Fonts' CDN. If campus wifi hiccups during your actual defence demo, an external font request failing shouldn't be the thing that makes your UI flash unstyled text in front of examiners. Small effort, removes a real live-demo risk.

### Layout — elevating Ch.3's split-panel spec
Ch.3 already specifies the right shape: live fleet map as the primary panel, summary stats secondary. Elevate it with a **persistent left rail** (not a hamburger menu — this is used all day by the same few people, optimize for muscle memory over discoverability) and a **two-zone main area**:

```
+----------+------------------------------------------+
| Rail     |  Top bar: page title, admin name, alerts  |
| (nav)    +------------------------------------------+
|          |                                            |
| Fleet    |     PRIMARY ZONE                           |
| Vehicles |     (map, or the current screen's main     |
| Routes   |      content — map is the default/home)    |
| Trips    |                                            |
| Reports  +------------------------------------------+
| Sustain. |     SECONDARY ZONE (persistent strip)      |
| Compl.   |     Active vehicles · Passengers in transit|
+----------+------------------------------------------+
```
The secondary strip (active vehicles, passengers in transit, trips completed today) stays visible even when navigating to other screens — an admin checking the complaints queue shouldn't lose situational awareness of the live fleet.

### Signature element — the pulse ring
One memorable, meaningful thing, not a decorative flourish: **every vehicle marker on the live map has a pulse ring keyed to GPS update recency.** Fresh update (within the last ~5s, matching the system's actual update interval) → visible amber pulse. Update between 5-15s old → marker present but static. Older than 15s (device likely offline) → marker fades to grey outline only.

This isn't decoration — it makes Chapter 3's actual non-functional requirement (GPS update visible within 10s) **literally visible** to the person using the dashboard, and doubles as instant offline-device detection without a separate "device status" screen. CSS keyframe animation only — no need for a new animation library (Framer Motion would be a real added dependency and learning curve for one effect; plain CSS `@keyframes` does this fully).

---

## Screen-by-screen

### Live Fleet Map (home/default screen)
- Map fills the primary zone, Leaflet + OSM per the confirmed stack
- Vehicle markers use the pulse-ring signature
- Clicking a marker opens a small panel: plate number, route, driver, passenger count, last update time — not a full page navigation, stay on the map
- **Empty state** (no active trips): don't just show a blank map. Show the campus map with a plain message — "No active trips right now. Trips appear here once a driver starts one." — an empty screen should tell the admin what to expect, not look broken

### Vehicle / Route management (FE-6, FE-7)
- Simple table + form pattern, not a heavy modal-within-modal flow
- Deactivating a vehicle (not deleting) should say exactly that: button reads "Deactivate", not "Delete" — matches the actual soft-delete behavior in the schema, and the interface shouldn't promise something the system doesn't do

### Trip Monitoring (FE-8)
- One row per active trip: vehicle, route, driver, live passenger count, trip duration so far
- Passenger count should visibly tick up in place (a small number transition, not a full re-render) when a boarding event arrives via socket — reinforces "this is live," not a page you have to refresh

### Ridership Reports (FE-9)
- Table-first, chart-second — admins making planning decisions need exact numbers, not just a pretty bar chart
- **Recommend `recharts`** for the chart layer if you want a visual alongside the table — genuinely low learning cost since its API is idiomatic React (components, not an imperative canvas API like Chart.js), and it's already confirmed available in your stack's ecosystem

### Complaints (FE-10)
- Status badges use `alert-red` (open), amber (under review), a muted green (resolved) — consistent with the color vocabulary established on the map
- **Empty state copy**, per the actual voice this interface should have: "No open complaints." — not "Great job, no complaints! 🎉" — this is an ops tool, not a consumer app; keep the register plain and factual throughout, not falsely cheerful

### Sustainability Panel (SDG-1 to SDG-4)
- This is the one screen allowed to use `sustain-green` — makes it visually distinct the moment an examiner sees the dashboard
- Show the admin-adjustable fuel-figure input directly in this panel (not buried in a settings page) with the methodology tooltip immediately next to the number it explains
- Label honestly: if the figure is still an estimate pending Transport Unit data (per `SDG-2`), the panel should say so in the UI itself, not just in Chapter 4 — "Estimated · pending confirmed fuel data" as a small caption under the headline number, in `line`-colored text, not hidden

### Driver Assignment (FE-11)
- Simple dropdown-to-dropdown form is genuinely sufficient here — resist the temptation to over-design a screen that's used rarely and briefly

---

## Interaction and quality floor
- Every interactive element gets a visible keyboard focus ring in `transit-blue` — this is a real accessibility floor, not optional polish
- No motion beyond the pulse-ring signature and simple number transitions — an ops tool that's constantly animating is an ops tool that's hard to trust at a glance
- Buttons/actions name exactly what happens: "Deactivate vehicle," "Mark resolved," "Start trip" — never "Submit" or "Confirm" with no object

## Icons
**Recommend `lucide-react`** — already listed as available in your broader tooling context, tree-shakeable, low learning cost (drop-in components, no new API pattern to learn), and its line-icon style matches the disciplined, non-decorative direction of this whole brief better than a filled/rounded icon set would.


