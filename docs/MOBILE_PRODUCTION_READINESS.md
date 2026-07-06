# MovIO Mobile — Production Readiness Checklist

Things to attend to before the student app could be treated as a real, publishable
production release (Play Store) rather than a defence/pilot build. Grouped by how
blocking each is. Nothing here is required for the defence demo; it's the honest
gap between "works on the test phone" and "shippable to the public".

Owner: the engineer. Tick items as they're done.

---

## 1. Must-do before any public release

- [ ] **App signing.** Generate a release keystore, configure
      `android/key.properties` + `signingConfigs` in `android/app/build.gradle`,
      and **never** commit the keystore. Right now builds are debug-signed.
- [ ] **Turn off cleartext HTTP for production.** `usesCleartextTraffic="true"`
      is in the manifest only because the dev backend is `http://<LAN-IP>:4000`.
      A production build must talk to an **HTTPS** backend and set
      `usesCleartextTraffic="false"` (or a scoped `network_security_config.xml`).
- [ ] **Production API base URL.** `Env.apiBaseUrl` defaults to a LAN IP. Ship a
      real hosted HTTPS URL via `--dart-define=API_BASE_URL=…` (and the Socket URL
      derives from it). Decide the deploy target for the backend first.
- [ ] **Host the legal documents at a stable URL.** The Play Console requires a
      publicly reachable **Privacy Policy URL**. The in-app Terms/Privacy text
      (`features/legal/legal_content.dart`) is honest and accurate but has **not**
      been legally reviewed — get it reviewed and publish a canonical copy.
- [ ] **Play Data Safety form.** Declare what's collected (name, matric no, email,
      optional phone, location for the live map, boarding/wallet activity) and
      that no data is sold. This must match the Privacy Policy above.
- [ ] **Confirm a real support contact.** The Help screen currently routes support
      through the in-app "Report an issue" flow (which is real). If a support
      email/phone is expected, add a confirmed one — don't invent one.

## 2. Should-do for a credible production app

- [ ] **Crash & error reporting.** No crash reporting today. Add Sentry or Firebase
      Crashlytics so real-device crashes are visible. (Cost/tier check needed —
      both have free tiers; confirm current terms.)
- [ ] **Session/token strategy.** The app now signs the user out cleanly on a 401
      (expired/revoked JWT) and sends them back to login — see
      `ApiClient.onUnauthorized` → `AuthProvider.handleUnauthorized`. There is no
      **refresh token** yet, so sessions end when the JWT expires. If long-lived
      sessions are wanted, add refresh tokens on the backend and a refresh flow
      here. Decide the JWT expiry deliberately.
- [ ] **Location permission UX.** If/when the live map uses the device location,
      add the runtime permission request + a rationale, and a graceful path when
      it's denied (the map should still open, just not centre on the user).
- [ ] **R8/ProGuard + shrinking** for a smaller, obfuscated release APK/AAB, with
      keep-rules verified against the plugins in use (secure storage, NFC, maps).
- [ ] **App version & build number** bumped intentionally per release
      (`pubspec.yaml` `version:`), and a changelog kept.
- [ ] **Store listing assets** — icon (already generated), feature graphic,
      screenshots, short/full description.

## 3. Nice-to-have / polish

- [ ] **Real reachability check.** `connectivity_plus` reports interface presence,
      not true internet reach. The API layer already catches an unreachable
      backend and shows a friendly message, so this is covered functionally; a
      lightweight reachability ping could make the offline banner even more
      accurate.
- [ ] **Offline caching** of last-known data (wallet balance, trip history) so the
      app shows something useful while offline instead of only an error state.
- [ ] **Accessibility pass** — semantic labels on icon-only buttons, dynamic text
      scaling, contrast check.
- [ ] **Localization scaffolding** if non-English support is ever wanted.
- [ ] **Analytics** (privacy-respecting) if usage insight is wanted for the report.
- [ ] **Automated widget/integration tests** beyond the current smoke tests for the
      critical flows (login, boarding, offline handling).

---

### Already handled (this branch, PSD-159 / MOB-9)

- Graceful no-network handling: a global connectivity banner (offline notice +
  "back online" confirmation), plus the pre-existing friendly "can't reach the
  server" message from the API layer. Turning Wi-Fi off mid-use no longer hangs
  silently.
- Expired-session handling: a 401 on an authenticated request signs the user out
  and returns them to login with a "session expired" notice.
- Production account screens: Terms of Service, Privacy Policy, and Help & Support
  added to the profile screen. No profile picture is collected, by design.
