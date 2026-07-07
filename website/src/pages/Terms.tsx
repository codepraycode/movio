import { LegalLayout, type DocSection } from '@/components/LegalLayout'

const LAST_UPDATED = '7 July 2026'

const sections: DocSection[] = [
    {
        heading: '1. Who can use Movio',
        paragraphs: [
            'Movio is intended for FUTA students and authorised campus transport ' +
                'staff. You are responsible for keeping your login details safe and ' +
                'for activity on your account. This website — including the live map, ' +
                'survey and waitlist — is open to anyone.',
        ],
    },
    {
        heading: '2. Transit Credit',
        paragraphs: [
            'Transit Credit is a prepaid count of trips you can board — one credit is ' +
                'deducted per boarding. It is a ride count, not money, and has no cash ' +
                'value. Credit cannot be exchanged for cash and is not transferable ' +
                'between accounts.',
            'Top-ups are recorded against your wallet. If a boarding is charged in ' +
                'error, report it through the in-app “Report an issue” flow so it can ' +
                'be reviewed.',
        ],
    },
    {
        heading: '3. Paying for top-ups on this website',
        paragraphs: [
            'Payments for Transit Credit on this website are processed by Paystack; ' +
                'by paying, you also agree to Paystack’s own terms (paystack.com/terms). ' +
                'Movio does not receive or store your card details.',
            'Because topping up on this website does not require a login, you identify ' +
                'the account by the matriculation number or email you enter. Please ' +
                'check it carefully: if you enter the wrong identifier, the credits may ' +
                'be added to the wrong account, and there is no automatic reversal. ' +
                'This is the honest trade-off of the no-login convenience — contact us ' +
                'if a genuine mistake happens and we’ll do what we reasonably can.',
        ],
    },
    {
        heading: '4. Boarding and tracking',
        paragraphs: [
            'Boarding uses a tap (NFC) against the shuttle reader. Live vehicle ' +
                'positions shown on the map are provided for convenience and may be ' +
                'delayed or unavailable depending on network and hardware conditions ' +
                'on campus.',
            'Movio does not guarantee vehicle availability, arrival times, or ' +
                'uninterrupted service.',
        ],
    },
    {
        heading: '5. Acceptable use',
        paragraphs: [
            'Do not attempt to disrupt the service, access other users’ accounts, or ' +
                'misuse the boarding or wallet systems. Accounts found abusing the ' +
                'service may be suspended.',
        ],
    },
    {
        heading: '6. Availability and changes',
        paragraphs: [
            'As a project under active development, features may change, pause, or be ' +
                'removed, and the service may be unavailable at times. We may update ' +
                'these terms; continued use after an update means you accept the ' +
                'revised terms.',
        ],
    },
    {
        heading: '7. Liability',
        paragraphs: [
            'Movio is provided without warranties. To the extent permitted by law, ' +
                'the project team is not liable for losses arising from use of the ' +
                'service, including missed rides or service interruptions.',
        ],
    },
    {
        heading: '8. Contact',
        paragraphs: [
            'Questions about these terms can be raised through the in-app “Report an ' +
                'issue” flow or with the Movio project team.',
        ],
    },
]

export function Terms() {
    return (
        <LegalLayout
            title="Terms of Service"
            lastUpdated={LAST_UPDATED}
            path="/terms"
            seoDescription="The terms for using Movio — the smart campus transport service for FUTA. A final-year academic project, provided as-is."
            intro="Movio is a campus transport service for the Federal University of Technology, Akure (FUTA). By using the Movio app and this website you agree to these terms. Movio is a final-year academic project, provided as-is while it is being evaluated and piloted."
            sections={sections}
            footnote={
                <>
                    <strong className="font-semibold text-neutral-800">Please note:</strong> These
                    terms describe a final-year academic project and have not yet been reviewed by a
                    lawyer. They will be updated before any wider public release.
                </>
            }
        />
    )
}
