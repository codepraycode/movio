/**
 * Runtime feature flags, stored in the single-row `app_settings` table in
 * Supabase (see supabase/schema.sql). Reading them at load time means the
 * survey can be opened or closed WITHOUT a rebuild/redeploy — flip the
 * `survey_open` boolean from the /admin page or the Supabase Table Editor and
 * the change takes effect the next time someone opens the page.
 */

import { supabase } from '@/lib/supabase'

/** The single settings row's id. The table is a singleton (id is always 1). */
const SETTINGS_ID = 1

/**
 * Fallback used only when the settings row can't be read (network/DB hiccup,
 * or the schema hasn't been run yet). Defaults to CLOSED so a failed read can
 * never silently re-open a survey you've ended. The real source of truth is
 * the `survey_open` column in Supabase.
 */
export const DEFAULT_SURVEY_OPEN = false

/** Reads whether the survey is currently accepting responses. */
export async function fetchSurveyOpen(): Promise<boolean> {
    const { data, error } = await supabase
        .from('app_settings')
        .select('survey_open')
        .eq('id', SETTINGS_ID)
        .maybeSingle()

    if (error || !data) return DEFAULT_SURVEY_OPEN
    return Boolean(data.survey_open)
}

/** Opens (true) or closes (false) the survey. Returns an error message or null. */
export async function setSurveyOpen(open: boolean): Promise<{ error: string | null }> {
    const { error } = await supabase
        .from('app_settings')
        .update({ survey_open: open })
        .eq('id', SETTINGS_ID)

    return { error: error ? error.message : null }
}
