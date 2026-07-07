import { LegalLayout, type DocSection } from '@/components/LegalLayout'

const LAST_UPDATED = '7 July 2026'

const sections: DocSection[] = [
    {
        heading: 'This website',
        paragraphs: [
            'On this website you can browse the project, view the live campus map, ' +
                'take the needs-assessment survey, and optionally join the waitlist. ' +
                'The live map requires no sign-in and collects nothing about you.',
            'If you join the waitlist we store the name and email address you enter, ' +
                'solely so we can let you know when Movio launches at FUTA. Survey ' +
                'responses are stored anonymously for the project’s requirements ' +
                'research; a name/email is only attached if you choose to opt into ' +
                'the waitlist at the end.',
        ],
    },
    {
        heading: 'The Movio app — information you provide',
        paragraphs: [
            'When you register in the Movio mobile app we collect your name, ' +
                'matriculation number, email address and, optionally, your phone ' +
                'number. Your password is stored only as a secure one-way hash — it ' +
                'is never kept or shown in plain text.',
            'Movio does not ask for or store a profile picture.',
        ],
    },
    {
        heading: 'Information from using the app',
        paragraphs: [
            'Boarding events (which trip you tapped onto, and when) and wallet ' +
                'transactions (top-ups and per-trip deductions) are recorded so your ' +
                'trip history and Transit Credit balance are accurate.',
            'If you allow location access, your device location is used to show ' +
                'where you are on the live campus map. This is used on your device to ' +
                'position the map and is not tracked in the background.',
        ],
    },
    {
        heading: 'Topping up on this website',
        paragraphs: [
            'If you top up Transit Credit on this website, we look up your account ' +
                'by the matriculation number or email you type, process the payment ' +
                'through Paystack, and add the credits to that account. Card details ' +
                'are entered directly with Paystack and are never seen or stored by ' +
                'Movio.',
            'For your privacy, this website never displays your Transit Credit ' +
                'balance or your trip history — the top-up page is deliberately ' +
                'write-only. The only thing shown back is a first name, so you can ' +
                'confirm you are crediting the right person.',
        ],
    },
    {
        heading: 'Reporting a problem or requesting deletion without logging in',
        paragraphs: [
            'If you submit a complaint or an account-deletion request from this ' +
                'website without logging in, we store the contact details you provide ' +
                '(email and/or phone) solely so we can respond to you and act on your ' +
                'request. These are not used for anything else.',
        ],
    },
    {
        heading: 'Live map data',
        paragraphs: [
            'The live map shows campus vehicles that are currently on a trip — their ' +
                'type, vehicle number, route, position and how many riders are ' +
                'onboard. It deliberately does not show driver names or any personal ' +
                'details of drivers or riders.',
        ],
    },
    {
        heading: 'How your information is used',
        paragraphs: [
            'To authenticate you, run boarding and the Transit Credit wallet, show ' +
                'your trip and payment history, handle issues you report, and produce ' +
                'anonymised, aggregate ridership statistics for campus transport ' +
                'planning and sustainability reporting.',
        ],
    },
    {
        heading: 'Where it is stored',
        paragraphs: [
            'Data is stored in the Movio backend database (hosted on Supabase). In ' +
                'the mobile app, your login token is held in your phone’s encrypted ' +
                'secure storage, not in plain text.',
        ],
    },
    {
        heading: 'Sharing',
        paragraphs: [
            'Movio does not sell your data or share it for advertising. Aggregate, ' +
                'non-identifying statistics (for example, total rides on a route) may ' +
                'be shared with the university for transport planning.',
        ],
    },
    {
        heading: 'Your choices',
        paragraphs: [
            'You can decline location access and still use most of the app (the live ' +
                'map simply won’t centre on you). You can report a problem or request ' +
                'help with your data through the in-app “Report an issue” flow, or on ' +
                'this website’s “Report a problem” page.',
            'You can request permanent deletion of your Movio account and its data ' +
                'at any time. Use the account-deletion page linked in the footer of ' +
                'every page (movioapp.vercel.app/delete-account) — no login required.',
        ],
    },
]

export function Privacy() {
    return (
        <LegalLayout
            title="Privacy Policy"
            lastUpdated={LAST_UPDATED}
            path="/privacy"
            seoDescription="How Movio collects and uses data — deliberately minimal, no profile photos, no selling data. A FUTA final-year project."
            intro="This policy explains what Movio collects, why, and how it is used — across this website and the Movio mobile app. We collect only what the service needs to run, and deliberately do not collect a profile photo."
            sections={sections}
            footnote={
                <>
                    <strong className="font-semibold text-neutral-800">Please note:</strong> Movio is
                    a final-year academic project at the Federal University of Technology, Akure
                    (FUTA). This policy describes the current behaviour of the service and will be
                    updated as the project develops. It has not yet been reviewed by a lawyer.
                    Questions can be raised through the in-app “Report an issue” flow or with the
                    Movio project team.
                </>
            }
        />
    )
}
