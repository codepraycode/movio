/**
 * Declarative survey definition. The Survey page renders entirely from this
 * config so the 18 questions live in one place and map 1:1 to the
 * `survey_responses` table columns documented in CLAUDE.md / supabase/schema.sql.
 *
 * The instrument covers FUTA's three campus transport modes — the shuttle
 * (campus bus), Keke (tricycle) and cab — rather than the shuttle alone.
 */

/** Keys mirror the `survey_responses` columns exactly. */
export interface SurveyAnswers {
    study_level: string
    /** Gate question — "Never" ends the survey early. */
    transport_frequency: string
    /** Which modes the student uses (multi-select). */
    transport_modes: string[]
    /** The mode they rely on most. */
    primary_mode: string
    wait_time: string
    arrival_awareness: string
    late_for_lecture: string
    full_bus_experience: string
    change_problem: string
    /** Per-mode 1–5 satisfaction, null when the mode is not used/rated. */
    shuttle_rating: number | null
    keke_rating: number | null
    cab_rating: number | null
    satisfaction_score: number | null
    biggest_problem: string
    has_nfc: string
    live_tracking_usefulness: string
    tap_to_board_interest: string
    desired_features: string[]
    app_comfort: string
    additional_comments: string
}

export type AnswerKey = keyof SurveyAnswers

export type QuestionType = 'radio' | 'scale' | 'textarea' | 'checkbox' | 'mode_matrix'

export interface Question {
    /** Column name in survey_responses (or a representative one for matrices). */
    key: AnswerKey
    /** Display number, e.g. "Q1". */
    number: string
    label: string
    type: QuestionType
    required: boolean
    helper?: string
    placeholder?: string
    /** Radio/checkbox options. For `scale`, value is the stored integer. */
    options?: { value: string; label: string }[]
    /** Checkbox cap (Q16 = max 3). */
    maxSelections?: number
    /** Rows for a `mode_matrix` — one rated column per transport mode. */
    rows?: { key: AnswerKey; label: string }[]
    /**
     * Optional "host whispers back" lines, keyed by the chosen answer value.
     * When the user picks a matching option, the founder reacts inline — this is
     * what makes the survey feel like a conversation instead of a form.
     */
    reactions?: Record<string, string>
}

export interface SurveyStep {
    id: number
    section: string
    title: string
    description: string
    /** What the founder "says" at the top of this step (speech bubble). */
    host: string
    questions: Question[]
}

/** The frequency answer that ends the survey early. */
export const NEVER_USES_TRANSPORT = 'Never — I walk or use my own vehicle'

/** Mode labels — reused across the modes, primary-mode and rating questions. */
export const MODE_SHUTTLE = 'Shuttle (campus bus)'
export const MODE_KEKE = 'Keke (tricycle)'
export const MODE_CAB = 'Cab / taxi'

/** Founder's line on the final contact step. */
export const CONTACT_HOST =
    'That’s a wrap — you absolute legend 🎉 Mind leaving your name and email? Totally optional, and your answers above stay anonymous. I’ll only use this to ping you the day Movio goes live.'

export const initialAnswers: SurveyAnswers = {
    study_level: '',
    transport_frequency: '',
    transport_modes: [],
    primary_mode: '',
    wait_time: '',
    arrival_awareness: '',
    late_for_lecture: '',
    full_bus_experience: '',
    change_problem: '',
    shuttle_rating: null,
    keke_rating: null,
    cab_rating: null,
    satisfaction_score: null,
    biggest_problem: '',
    has_nfc: '',
    live_tracking_usefulness: '',
    tap_to_board_interest: '',
    desired_features: [],
    app_comfort: '',
    additional_comments: '',
}

const opts = (...labels: string[]) => labels.map((label) => ({ value: label, label }))

export const surveySteps: SurveyStep[] = [
    {
        id: 1,
        section: 'Section A',
        title: 'About you',
        description: 'A few quick things so we know who we are hearing from.',
        host: 'Hey — you actually showed up. Thank you 🙏🏽 Let’s start gentle: just a few tiny things so I know who I’m talking to. No wrong answers here.',
        questions: [
            {
                key: 'study_level',
                number: 'Q1',
                label: 'What is your current level of study at FUTA?',
                type: 'radio',
                required: true,
                options: opts(
                    '100 Level',
                    '200 Level',
                    '300 Level',
                    '400 Level',
                    '500 Level',
                    'Postgraduate',
                ),
            },
            {
                key: 'transport_frequency',
                number: 'Q2',
                label: 'How often do you use campus transport — the shuttle, Keke, or cab — to get around FUTA?',
                type: 'radio',
                required: true,
                options: opts(
                    'Daily',
                    'Several times a week',
                    'Occasionally',
                    'Rarely',
                    NEVER_USES_TRANSPORT,
                ),
            },
            {
                key: 'transport_modes',
                number: 'Q3',
                label: 'Which of these do you actually use to move around FUTA? Select all that apply.',
                type: 'checkbox',
                required: true,
                options: opts(MODE_SHUTTLE, MODE_KEKE, MODE_CAB),
            },
            {
                key: 'primary_mode',
                number: 'Q4',
                label: 'And which one do you rely on the most?',
                type: 'radio',
                required: true,
                options: opts(MODE_SHUTTLE, MODE_KEKE, MODE_CAB, 'It varies — depends on the day'),
                reactions: {
                    [MODE_KEKE]: 'Keke nation 🛺 The real MVP of FUTA movement.',
                    [MODE_CAB]: 'Cab life — comfort first. Noted.',
                    [MODE_SHUTTLE]: 'The classic. Let’s make it actually reliable.',
                },
            },
        ],
    },
    {
        id: 2,
        section: 'Section B',
        title: 'Getting around today',
        description: 'Tell us what moving around FUTA is actually like right now.',
        host: 'Okay, real talk now. Tell me what getting around FUTA is *actually* like — the waiting, the change wahala, all of it. I’m reading every single answer, I promise.',
        questions: [
            {
                key: 'wait_time',
                number: 'Q5',
                label: 'On a typical day, how long do you usually wait to get a ride (shuttle, Keke, or cab)?',
                type: 'radio',
                required: true,
                options: opts(
                    'Less than 5 minutes',
                    '5–10 minutes',
                    '11–20 minutes',
                    '21–30 minutes',
                    'More than 30 minutes',
                ),
                reactions: {
                    'Less than 5 minutes': 'Lucky you 😅 Not everyone’s stop is that kind.',
                    '11–20 minutes': 'Eleven to twenty minutes of just… standing. Noted. ⏳',
                    '21–30 minutes': 'Oof — that’s a serious chunk of your day gone. ⏳',
                    'More than 30 minutes':
                        'Over 30 minutes?! That’s a whole lecture intro lost. Loudly noted. 😤',
                },
            },
            {
                key: 'arrival_awareness',
                number: 'Q6',
                label: 'While waiting, do you have any way of knowing when your next ride(vehicle) will actually arrive?',
                type: 'radio',
                required: true,
                options: opts('Yes, always', 'Sometimes', 'Rarely', 'No, never'),
                reactions: {
                    Rarely: 'Yeah… guessing really shouldn’t be the default.',
                    'No, never': 'Right? The not-knowing is honestly the worst part of it.',
                },
            },
            {
                key: 'late_for_lecture',
                number: 'Q7',
                label: 'Have you ever missed a lecture or arrived late because of campus transport?',
                type: 'radio',
                required: true,
                options: opts('Yes, frequently', 'Yes, occasionally', 'Rarely', 'Never'),
                reactions: {
                    'Yes, frequently':
                        'Ugh, I’ve been there too. This is exactly the thing I want to kill. 🎯',
                    'Yes, occasionally': 'Even occasionally is too often, if you ask me. Noted.',
                },
            },
            {
                key: 'full_bus_experience',
                number: 'Q8',
                label: 'Have you ever been left stranded — a full shuttle, or no Keke/cab available when you needed one?',
                type: 'radio',
                required: true,
                options: opts('Yes, frequently', 'Yes, occasionally', 'Rarely', 'Never'),
                reactions: {
                    'Yes, frequently': 'Watching a full ride leave without you = pure pain. 😩',
                    'Yes, occasionally': 'Yeah, that one stings every time.',
                },
            },
            {
                key: 'change_problem',
                number: 'Q9',
                label: 'Have you ever overpaid because the driver or rider couldn’t give you change?',
                type: 'radio',
                required: true,
                options: opts(
                    'Yes, frequently',
                    'Yes, occasionally',
                    'Rarely',
                    'No, never',
                    'I always pay with exact change',
                ),
                reactions: {
                    'Yes, frequently':
                        'The change wahala is so real — quietly overpaying, again and again. 💸',
                    'Yes, occasionally': 'That change struggle… we’ve all been there. 💸',
                },
            },
            {
                key: 'shuttle_rating',
                number: 'Q10',
                label: 'How would you rate each mode you use? (Tap a score for the ones you use, skip the rest.)',
                type: 'mode_matrix',
                required: false,
                helper: '1 = terrible · 5 = great. Leave a mode blank if you don’t use it.',
                rows: [
                    { key: 'shuttle_rating', label: 'Shuttle' },
                    { key: 'keke_rating', label: 'Keke' },
                    { key: 'cab_rating', label: 'Cab' },
                ],
            },
            {
                key: 'satisfaction_score',
                number: 'Q11',
                label: 'Overall, how satisfied are you with campus transport at FUTA?',
                type: 'scale',
                required: true,
                helper: '1 = Very dissatisfied · 5 = Very satisfied',
                options: [
                    { value: '1', label: '1 — Very dissatisfied' },
                    { value: '2', label: '2 — Dissatisfied' },
                    { value: '3', label: '3 — Neutral' },
                    { value: '4', label: '4 — Satisfied' },
                    { value: '5', label: '5 — Very satisfied' },
                ],
            },
            {
                key: 'biggest_problem',
                number: 'Q12',
                label: 'In your own words, what’s the biggest problem you personally face getting around FUTA?',
                type: 'textarea',
                required: false,
                placeholder: 'e.g. I never know when the next ride is coming...',
            },
        ],
    },
    {
        id: 3,
        section: 'Section C',
        title: 'Technology and app features',
        description: 'How you feel about a smarter, app-based way to move around campus.',
        host: 'Last stretch, I promise 💪🏽 Now picture campus transport, but smart — every shuttle, Keke and cab in one app. Be brutally honest: would any of this actually make your day easier?',
        questions: [
            {
                key: 'has_nfc',
                number: 'Q13',
                label: 'Does your smartphone support NFC (contactless tap) functionality?',
                type: 'radio',
                required: true,
                helper: 'NFC lets your phone communicate by tapping it near another device — most Android phones made after 2018 have it.',
                options: opts(
                    'Yes, I know my phone has NFC',
                    "I'm not sure",
                    'No, my phone does not have NFC',
                ),
            },
            {
                key: 'live_tracking_usefulness',
                number: 'Q14',
                label: 'If an app showed the real-time location of shuttles, Kekes and cabs on a map, how useful would that be to you?',
                type: 'radio',
                required: true,
                options: opts('Extremely useful', 'Very useful', 'Somewhat useful', 'Not useful'),
                reactions: {
                    'Extremely useful': 'That’s the dream 🛰️ No more guessing at the stop.',
                    'Very useful': 'Right? Just *knowing* would change the whole vibe.',
                },
            },
            {
                key: 'tap_to_board_interest',
                number: 'Q15',
                label: 'If you could tap your student ID or phone to pay for any of them instead of cash, would you use it?',
                type: 'radio',
                required: true,
                options: opts('Yes, definitely', 'Probably yes', 'Not sure', 'Probably not', 'No'),
                reactions: {
                    'Yes, definitely': 'Same energy 🙌 Tap and go, zero cash drama.',
                    'Probably yes': 'I think you’d love it the moment it’s real.',
                },
            },
            {
                key: 'desired_features',
                number: 'Q16',
                label: 'Which features would matter most to you in a campus transport app? Select up to 3.',
                type: 'checkbox',
                required: true,
                maxSelections: 3,
                options: opts(
                    'Live map showing nearby rides',
                    'Estimated arrival time at my stop',
                    'Notification when a ride is nearby',
                    'Tap-to-pay instead of cash',
                    'Schedules, routes and fares',
                    'How full or available rides are',
                ),
            },
            {
                key: 'app_comfort',
                number: 'Q17',
                label: 'How comfortable are you using mobile apps for everyday tasks like payments and navigation?',
                type: 'radio',
                required: true,
                options: opts(
                    'Very comfortable',
                    'Comfortable',
                    'Neutral',
                    'Uncomfortable',
                    'Very uncomfortable',
                ),
            },
            {
                key: 'additional_comments',
                number: 'Q18',
                label: 'Any other thoughts on campus transport at FUTA, or features you’d like to see in the app?',
                type: 'textarea',
                required: false,
                placeholder: "Anything else you'd like us to know...",
            },
        ],
    },
]
