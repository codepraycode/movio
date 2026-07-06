# CLAUDE.md

@AGENTS.md

Everything above this line is pulled in automatically from `AGENTS.md` — that file is the canonical, tool-agnostic source of truth for this project (also readable by Cursor, Copilot, etc. if you ever use them). Edit `AGENTS.md`, not this file, when project context changes.

## Operating rules (in addition to everything imported above)

- **Realism check before recommending anything hardware-, cost-, or Nigeria-context-dependent.** If you don't have a verified current answer (component price, network availability, platform free-tier terms, etc.), say so plainly and ask, rather than filling in a plausible-sounding number. This has mattered in practice already - deployment platform choices and MQTT broker choice were both revised after checking current terms rather than relying on assumption.
- **Name the learning cost before recommending a new tool or framework.** If a suggestion would require the person to learn something substantial, say that explicitly as part of the recommendation, not as a caveat after the fact.
- **Treat the SDG/sustainability angle as a real feature to build, not a line to add to the report.** See the Sustainability Panel work in the milestone plan - when in doubt about whether a feature choice serves this, err toward building the real thing over describing it.
- **Journal/academic consistency is part of the job, not out of scope.** FUTAJEET and NIJOTECH are the confirmed real targets - don't suggest alternatives without the same level of verification that went into confirming those two.
- **Any `.docx` output stays lightly formatted and easy to edit**, except where a document's whole purpose is a formal/special deliverable.
- **Every claim about the system's behavior should be grounded in something actually run or verified in-session** (a command executed, a file checked, a test passed) rather than asserted from confidence alone - this project has a habit of catching things this way (bcrypt's native build failing, a fake seed password hash being misleading) and it's worth keeping up.
- **Update `docs/AGENTS.md`'s "Where things stand" and "Open items" sections before ending a session** - that's what lets the next session, in this tool or any other, resume without re-deriving state or re-asking questions already answered.
- **save drafted plan** - when the engineer agrees to a plan, you save the plan to the .plan folder, when you're done, you remove it. This is to ensure that we don't loose an approved plan execution midway because of anything.
- **Build to impress, without killing performance** - Impressing users is one important thing to consider without compromising performance, especially on the mobile aspect.

## Claude-Code-specific notes only

- This is a monorepo. If you're working deep in `mobile/` or `firmware/` and find yourself repeating tool-specific corrections across sessions, add a scoped `mobile/CLAUDE.md` or `firmware/CLAUDE.md` — Claude Code walks the directory tree from the current working directory up to the repo root and loads every `CLAUDE.md` it finds along the way, so a subfolder file adds to this one rather than replacing it.
- Auto memory is on by default in recent Claude Code versions and will pick up recurring corrections on its own — but don't rely on it for anything load-bearing. If something matters every session, put it in `AGENTS.md` explicitly rather than hoping auto memory caught it.
- At the end of a session, update the "Where things stand" checklist in `AGENTS.md` before you stop — that's what lets the next session (yours or mine) resume without re-deriving project state.
- To have good understanding of the project, examine the brief at docs/project_brief.md.

## Claude-Code-specific notes for website and dashboard

### UI & Component Management
- **Initialize shadcn/ui:** `yarn dlx shadcn@latest init`
- **Add Core Components:** `yarn dlx shadcn@latest add button card input label textarea radio-group checkbox progress toast badge separator`

## 2. Technical Stack & Architecture

### Stack Constraints
- **Frontend:** React 18+ (Vite) + TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui (Radix Primitives)
- **Database/Backend:** Supabase JS Client (`@supabase/supabase-js`)
- **State Management:** Local React `useState` (lifted safely across multi-step flows)
- **Routing:** React Router v6 (`/` and `/survey`)

### Directory Structure Requirements
Maintain strict adherence to this structural layout. Notice the migration from `.jsx` to `.tsx`:

### Code Style Archetype

* **Component Definitions:** Use concise functional components (`export const ComponentName = () => { ... }`).
* **Data Fetching/Mutations:** Explicitly wrap all asynchronous operations tracking Supabase states within `try/catch` wrappers.
* **State Isolation:** Keep layout and operational primitives highly isolated. Avoid bloated re-renders by collocated states where possible.

### UX & Form Submission Rules

* **Optimistic State Execution:** Show loading states immediately (`isSubmitting`) to prevent multiple clicks and redundant data ingestion.
* **Conditional Handling:** Ensure the step sequence cuts off gracefully right after the gate question if the user provides a negative use case choice on `transport_frequency` ("Never — I walk or use my own vehicle").
* **Error Interception:** Parse raw PostgreSQL unique-constraint or validation objects safely before flashing Toast notifications to users.
