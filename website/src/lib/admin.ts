/**
 * Admin dashboard helpers — the access gate, the row shape, and the pure
 * functions that turn raw `survey_responses` rows into the aggregates the
 * Admin page renders. Kept framework-free so they stay easy to reason about
 * and unit-test.
 *
 * SECURITY NOTE: `ADMIN_TOKEN` lives in client code and the Supabase
 * publishable key ships to the browser, so this gate is a convenience lock,
 * not real authentication. Anyone determined can read the data. That is an
 * acceptable trade-off for an anonymous campus survey, but do not store
 * anything sensitive here. The real guard is the Supabase RLS SELECT policy
 * (see supabase/schema.sql) — remove it to fully lock reads down again.
 */

import type { SurveyAnswers, Question } from '@/lib/survey'
import { NEVER_USES_TRANSPORT } from '@/lib/survey'

/** Six-character alphanumeric access code. Change this to rotate access. */
export const ADMIN_TOKEN = 'K7M2QX'

/** sessionStorage key — keeps you signed in for the tab, re-prompts on reopen. */
const SESSION_KEY = 'movio_admin_ok'

export function isUnlocked(): boolean {
    try {
        return sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
        return false
    }
}

export function unlock(token: string): boolean {
    const ok = token.trim().toUpperCase() === ADMIN_TOKEN.toUpperCase()
    if (ok) {
        try {
            sessionStorage.setItem(SESSION_KEY, '1')
        } catch {
            /* sessionStorage unavailable (private mode) — gate still holds in memory */
        }
    }
    return ok
}

export function lock(): void {
    try {
        sessionStorage.removeItem(SESSION_KEY)
    } catch {
        /* no-op */
    }
}

/** A full row as read back from Supabase. */
export interface SurveyResponseRow extends SurveyAnswers {
    id: string
    created_at: string
}

export interface WaitlistRow {
    id: string
    name: string
    email: string
    created_at: string
}

/** One bar in a distribution chart. */
export interface Bucket {
    label: string
    count: number
    /** 0–100, share of the relevant denominator. */
    pct: number
}

const pct = (count: number, total: number) => (total === 0 ? 0 : (count / total) * 100)

/**
 * Distribution for a single-choice question (radio or scale). Buckets follow
 * the question's declared option order; any stored value that isn't a known
 * option is appended at the end so nothing is silently dropped.
 */
export function distributionFor(question: Question, rows: SurveyResponseRow[]): Bucket[] {
    const counts = new Map<string, number>()
    let answered = 0

    for (const row of rows) {
        const raw = row[question.key]
        if (raw === null || raw === undefined || raw === '') continue
        const value = String(raw)
        counts.set(value, (counts.get(value) ?? 0) + 1)
        answered += 1
    }

    const ordered: Bucket[] = []
    const seen = new Set<string>()

    for (const opt of question.options ?? []) {
        const count = counts.get(opt.value) ?? 0
        ordered.push({ label: opt.label, count, pct: pct(count, answered) })
        seen.add(opt.value)
    }
    for (const [value, count] of counts) {
        if (seen.has(value)) continue
        ordered.push({ label: value, count, pct: pct(count, answered) })
    }
    return ordered
}

/** Tally for a multi-select (array) column like transport_modes / desired_features. */
export function tallyMultiSelect(
    rows: SurveyResponseRow[],
    key: 'transport_modes' | 'desired_features',
): Bucket[] {
    const counts = new Map<string, number>()
    let respondents = 0

    for (const row of rows) {
        const values = row[key]
        if (!Array.isArray(values) || values.length === 0) continue
        respondents += 1
        for (const value of values) {
            counts.set(value, (counts.get(value) ?? 0) + 1)
        }
    }

    return [...counts.entries()]
        .map(([label, count]) => ({ label, count, pct: pct(count, respondents) }))
        .sort((a, b) => b.count - a.count)
}

/** Mean of a numeric rating column, ignoring nulls. Returns null when empty. */
export function averageRating(
    rows: SurveyResponseRow[],
    key: 'shuttle_rating' | 'keke_rating' | 'cab_rating' | 'satisfaction_score',
): { avg: number | null; n: number } {
    let sum = 0
    let n = 0
    for (const row of rows) {
        const v = row[key]
        if (typeof v === 'number' && !Number.isNaN(v)) {
            sum += v
            n += 1
        }
    }
    return { avg: n === 0 ? null : sum / n, n }
}

/** Non-empty free-text answers, newest first, paired with their date. */
export function textResponses(
    rows: SurveyResponseRow[],
    key: 'biggest_problem' | 'additional_comments',
): { text: string; date: string }[] {
    return rows
        .filter((r) => typeof r[key] === 'string' && (r[key] as string).trim() !== '')
        .map((r) => ({ text: (r[key] as string).trim(), date: r.created_at }))
}

/** How many respondents were gated out at Q2 ("Never use campus transport"). */
export function gatedOutCount(rows: SurveyResponseRow[]): number {
    return rows.filter((r) => r.transport_frequency === NEVER_USES_TRANSPORT).length
}

// ---------------------------------------------------------------------------
// CSV / JSON export
// ---------------------------------------------------------------------------

/** Column order for the survey CSV — id + timestamp, then every answer column. */
const SURVEY_COLUMNS: (keyof SurveyResponseRow)[] = [
    'id',
    'created_at',
    'study_level',
    'transport_frequency',
    'transport_modes',
    'primary_mode',
    'wait_time',
    'arrival_awareness',
    'late_for_lecture',
    'full_bus_experience',
    'change_problem',
    'shuttle_rating',
    'keke_rating',
    'cab_rating',
    'satisfaction_score',
    'biggest_problem',
    'has_nfc',
    'live_tracking_usefulness',
    'tap_to_board_interest',
    'desired_features',
    'app_comfort',
    'additional_comments',
]

/** RFC-4180-ish escaping: wrap in quotes when the cell has a comma, quote or newline. */
function csvCell(value: unknown): string {
    let str: string
    if (value === null || value === undefined) str = ''
    else if (Array.isArray(value)) str = value.join('; ')
    else str = String(value)

    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

function toCsv<T>(columns: (keyof T)[], rows: T[]): string {
    const header = columns.map((c) => csvCell(c as string)).join(',')
    const body = rows.map((row) => columns.map((c) => csvCell(row[c])).join(',')).join('\n')
    return `${header}\n${body}`
}

export function surveyResponsesCsv(rows: SurveyResponseRow[]): string {
    return toCsv(SURVEY_COLUMNS, rows)
}

export function waitlistCsv(rows: WaitlistRow[]): string {
    return toCsv(['id', 'name', 'email', 'created_at'], rows)
}

/** Trigger a browser download of `content` as `filename`. */
export function downloadFile(filename: string, content: string, mime: string): void {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

/** e.g. movio-survey-2026-06-24.csv */
export function exportStamp(): string {
    return new Date().toISOString().slice(0, 10)
}
