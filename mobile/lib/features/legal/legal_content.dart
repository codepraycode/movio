import 'screens/document_screen.dart';

/// The actual text of MovIO's Terms of Service and Privacy Policy.
///
/// Written to describe what the app *actually* does — the data it collects, why,
/// and what it never does (e.g. no profile photos, credits are trip counts not
/// money) — so it's honest and defensible rather than boilerplate. It is NOT a
/// lawyer-reviewed document; before any public release the project team should
/// have it reviewed and host a canonical copy at a stable URL (see
/// docs/MOBILE_PRODUCTION_READINESS.md).
class LegalContent {
  LegalContent._();

  /// Bump this whenever the wording changes, and mention the change in-app.
  static const String lastUpdated = '6 July 2026';

  static DocumentScreen terms() => const DocumentScreen(
        title: 'Terms of Service',
        lastUpdated: lastUpdated,
        intro:
            'MovIO is a campus transport app for the Federal University of '
            'Technology, Akure (FUTA). By creating an account and using the app '
            'you agree to these terms. MovIO is a final-year academic project, '
            'provided as-is while it is being evaluated and piloted.',
        sections: [
          DocSection('1. Who can use MovIO', [
            'MovIO is intended for FUTA students and authorised campus transport '
                'staff. You are responsible for keeping your login details safe '
                'and for activity on your account.',
          ]),
          DocSection('2. Transit Credit', [
            'Transit Credit is a prepaid count of trips you can board — one '
                'credit is deducted per boarding. It is a ride count, not money, '
                'and has no cash value. Credit cannot be exchanged for cash and '
                'is not transferable between accounts.',
            'Top-ups are recorded against your wallet. If a boarding is charged '
                'in error, report it through the in-app "Report an issue" flow so '
                'it can be reviewed.',
          ]),
          DocSection('3. Boarding and tracking', [
            'Boarding uses a tap (NFC) against the shuttle reader. Live shuttle '
                'positions shown on the map are provided for convenience and may '
                'be delayed or unavailable depending on network and hardware '
                'conditions on campus.',
            'MovIO does not guarantee shuttle availability, arrival times, or '
                'uninterrupted service.',
          ]),
          DocSection('4. Acceptable use', [
            'Do not attempt to disrupt the service, access other users’ '
                'accounts, or misuse the boarding or wallet systems. Accounts '
                'found abusing the service may be suspended.',
          ]),
          DocSection('5. Availability and changes', [
            'As a project under active development, features may change, pause, '
                'or be removed, and the service may be unavailable at times. We '
                'may update these terms; continued use after an update means you '
                'accept the revised terms.',
          ]),
          DocSection('6. Liability', [
            'MovIO is provided without warranties. To the extent permitted by '
                'law, the project team is not liable for losses arising from use '
                'of the app, including missed rides or service interruptions.',
          ]),
          DocSection('7. Contact', [
            'Questions about these terms can be raised through the in-app '
                '"Report an issue" flow or with the MovIO project team.',
          ]),
        ],
      );

  static DocumentScreen privacy() => const DocumentScreen(
        title: 'Privacy Policy',
        lastUpdated: lastUpdated,
        intro:
            'This policy explains what MovIO collects, why, and how it is used. '
            'We collect only what the app needs to run — and deliberately do not '
            'collect a profile photo.',
        sections: [
          DocSection('Information you provide', [
            'When you register we collect your name, matriculation number, email '
                'address and, optionally, your phone number. Your password is '
                'stored only as a secure one-way hash — it is never kept or shown '
                'in plain text.',
            'MovIO does not ask for or store a profile picture.',
          ]),
          DocSection('Information from using the app', [
            'Boarding events (which trip you tapped onto, and when) and wallet '
                'transactions (top-ups and per-trip deductions) are recorded so '
                'your trip history and Transit Credit balance are accurate.',
            'If you allow location access, your device location is used to show '
                'where you are on the live campus map. This is used on your '
                'device to position the map and is not tracked in the background.',
          ]),
          DocSection('How your information is used', [
            'To authenticate you, run boarding and the Transit Credit wallet, '
                'show your trip and payment history, handle issues you report, '
                'and produce anonymised, aggregate ridership statistics for '
                'campus transport planning and sustainability reporting.',
          ]),
          DocSection('Where it is stored', [
            'Your data is stored in the MovIO backend database (hosted on '
                'Supabase). Your login token is held in your phone’s encrypted '
                'secure storage, not in plain text.',
          ]),
          DocSection('Sharing', [
            'MovIO does not sell your data or share it for advertising. '
                'Aggregate, non-identifying statistics (for example, total rides '
                'on a route) may be shared with the university for transport '
                'planning.',
          ]),
          DocSection('Your choices', [
            'You can decline location access and still use most of the app '
                '(the live map simply won’t centre on you). You can report a '
                'problem or request help with your data through the in-app '
                '"Report an issue" flow.',
          ]),
          DocSection('Note', [
            'MovIO is a final-year academic project. This policy describes the '
                'current behaviour of the app and will be updated as the project '
                'develops.',
          ]),
        ],
      );
}
