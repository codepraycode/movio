import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:movio_mobile/core/theme/app_theme.dart';
import 'package:movio_mobile/features/nfc/data/nfc_capability_service.dart';
import 'package:movio_mobile/features/nfc/screens/nfc_setup_screen.dart';

/// PSD-104: the screen must report the phone's *real* capability and handle
/// the no-NFC path gracefully. These tests inject fake probes (the `probe`
/// test seam) so no platform channel is touched.
void main() {
  Widget screenWith(NfcCapability cap) => MaterialApp(
        theme: AppTheme.light(),
        home: NfcSetupScreen(
          probe: () async => cap,
          scanTheatre: Duration.zero, // skip the scan theatre in tests
        ),
      );

  testWidgets('no-NFC phone reports "physical card required" without crashing',
      (tester) async {
    await tester.pumpWidget(screenWith(const NfcCapability(
      hasHardware: false,
      enabled: false,
      hceSupported: false,
    )));
    await tester.pumpAndSettle();

    expect(
        find.text('NFC not available — physical card required'), findsOneWidget);
    expect(find.text('Got it'), findsOneWidget); // graceful, actionable exit
  });

  testWidgets('NFC + HCE phone reports HCE mode supported', (tester) async {
    await tester.pumpWidget(screenWith(const NfcCapability(
      hasHardware: true,
      enabled: true,
      hceSupported: true,
    )));
    await tester.pumpAndSettle();

    expect(find.text('NFC available — HCE mode supported'), findsOneWidget);
    expect(find.text('Finish setup'), findsOneWidget); // setup (not status) mode
  });

  testWidgets('NFC off shows the guided "Turn on NFC" fix', (tester) async {
    await tester.pumpWidget(screenWith(const NfcCapability(
      hasHardware: true,
      enabled: false,
      hceSupported: true,
    )));
    await tester.pumpAndSettle();

    expect(find.text('Turn on NFC'), findsOneWidget);
  });

  test('readiness mapping puts a missing HCE feature above the NFC toggle', () {
    // HCE definitively absent -> card required even though NFC is merely off.
    const cap =
        NfcCapability(hasHardware: true, enabled: false, hceSupported: false);
    expect(cap.readiness, NfcReadiness.cardOnly);
  });
}
