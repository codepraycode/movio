-- Movio Survey — Supabase schema
-- Run this in your Supabase project: Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: uses IF NOT EXISTS / drops policies before recreating them.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists waitlist (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    email text not null unique,
    created_at timestamp with time zone default now()
);

create table if not exists survey_responses (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default now(),

    -- Section A: About you
    study_level text,
    transport_frequency text,        -- gate: "Never" ends the survey early
    transport_modes text[],          -- modes used (shuttle / Keke / cab)
    primary_mode text,               -- mode relied on most

    -- Section B: Current experience
    wait_time text,
    arrival_awareness text,
    late_for_lecture text,
    full_bus_experience text,
    change_problem text,
    shuttle_rating integer,          -- per-mode 1–5 satisfaction
    keke_rating integer,
    cab_rating integer,
    satisfaction_score integer,      -- overall campus transport satisfaction
    biggest_problem text,

    -- Section C: Technology
    has_nfc text,
    live_tracking_usefulness text,
    tap_to_board_interest text,
    desired_features text[],
    app_comfort text,
    additional_comments text
);

-- ---------------------------------------------------------------------------
-- Migration — bring an EXISTING survey_responses table up to the 3-mode shape.
-- Safe to re-run; no-ops once applied. (New databases get everything from the
-- CREATE above and can skip this block.)
-- ---------------------------------------------------------------------------

-- Rename shuttle_frequency → transport_frequency, only if not already done.
do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_name = 'survey_responses' and column_name = 'shuttle_frequency'
    ) and not exists (
        select 1 from information_schema.columns
        where table_name = 'survey_responses' and column_name = 'transport_frequency'
    ) then
        alter table survey_responses rename column shuttle_frequency to transport_frequency;
    end if;
end $$;

alter table survey_responses add column if not exists transport_frequency text;
alter table survey_responses add column if not exists transport_modes text[];
alter table survey_responses add column if not exists primary_mode text;
alter table survey_responses add column if not exists shuttle_rating integer;
alter table survey_responses add column if not exists keke_rating integer;
alter table survey_responses add column if not exists cab_rating integer;

-- ---------------------------------------------------------------------------
-- Row Level Security — anonymous inserts only, no client-side reads.
-- You read the collected data from the Supabase dashboard / Table Editor.
-- ---------------------------------------------------------------------------

alter table waitlist enable row level security;
alter table survey_responses enable row level security;

drop policy if exists "Allow anonymous inserts" on waitlist;
create policy "Allow anonymous inserts" on waitlist
    for insert with check (true);

drop policy if exists "Allow anonymous inserts" on survey_responses;
create policy "Allow anonymous inserts" on survey_responses
    for insert with check (true);

-- ---------------------------------------------------------------------------
-- Admin dashboard reads (/admin page).
--
-- The dashboard runs entirely in the browser with the public publishable key,
-- so enabling SELECT here makes the collected data readable by anyone holding
-- that key — the 6-character access code on /admin is a convenience lock, NOT
-- real security. That is acceptable for an anonymous transport survey.
--
-- To fully lock reads down again, DROP both policies below; the dashboard will
-- then surface a clear "reads are blocked" message instead of data.
-- ---------------------------------------------------------------------------

drop policy if exists "Allow anonymous reads" on survey_responses;
create policy "Allow anonymous reads" on survey_responses
    for select using (true);

drop policy if exists "Allow anonymous reads" on waitlist;
create policy "Allow anonymous reads" on waitlist
    for select using (true);

-- ---------------------------------------------------------------------------
-- App settings — runtime switches read by the app on load.
--
-- A single-row table (id is always 1). `survey_open` is the master switch:
--   false → the /survey page shows a "survey has ended" screen and accepts no
--            new responses; true → the survey runs normally.
--
-- Flip it WITHOUT redeploying, either from the /admin page (Survey status card)
-- or right here in Supabase (Table Editor → app_settings → toggle survey_open).
-- It takes effect the next time someone loads the page.
-- ---------------------------------------------------------------------------

create table if not exists app_settings (
    id integer primary key default 1,
    survey_open boolean not null default true,
    constraint app_settings_singleton check (id = 1)
);

-- Seed the single row. Seeded CLOSED to match the current "survey has ended"
-- state; set survey_open = true (or use the /admin toggle) to reopen it.
insert into app_settings (id, survey_open) values (1, false)
    on conflict (id) do nothing;

alter table app_settings enable row level security;

-- Everyone can read the flag (the app needs it on every page load)...
drop policy if exists "Allow anonymous reads" on app_settings;
create policy "Allow anonymous reads" on app_settings
    for select using (true);

-- ...and update it. Like the /admin reads, this is a convenience lock guarded
-- by the access code in the UI, NOT real security — the publishable key ships
-- to the browser, so anyone with it could flip this flag. Acceptable for a
-- campus survey. To lock it down, DROP this policy and toggle from Supabase only.
drop policy if exists "Allow anonymous updates" on app_settings;
create policy "Allow anonymous updates" on app_settings
    for update using (true) with check (true);
