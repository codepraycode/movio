import 'package:flutter/services.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// The four honest answers to "can this phone tap to board?" (PSD-104).
enum NfcReadiness {
  /// NFC hardware present + turned on + HCE supported: phone can act as the card.
  hceReady,

  /// NFC exists but the phone can't emulate a card (no HCE system feature) —
  /// rare on modern Androids, but real. A physical card is required.
  cardOnly,

  /// Hardware supports everything, the NFC toggle is just off. Fixable by the
  /// user in system settings.
  nfcOff,

  /// No NFC hardware at all — a physical card is the only option. Roughly 6 in
  /// 10 FUTA students are in this group (Ch.2 survey), so this path is a first-
  /// class experience, not an error.
  noNfc,
}

/// A single live probe of the phone, straight from the hardware — never cached,
/// never invented. [hceSupported] is nullable because it comes over our own
/// platform channel; if that query somehow fails we say "unknown" rather than
/// guessing a definite yes/no.
class NfcCapability {
  const NfcCapability({
    required this.hasHardware,
    required this.enabled,
    required this.hceSupported,
  });

  final bool hasHardware;
  final bool enabled;
  final bool? hceSupported;

  NfcReadiness get readiness {
    if (!hasHardware) return NfcReadiness.noNfc;
    // HCE definitively absent trumps the toggle — turning NFC on wouldn't help.
    if (hceSupported == false) return NfcReadiness.cardOnly;
    if (!enabled) return NfcReadiness.nfcOff;
    return NfcReadiness.hceReady;
  }
}

/// Probes NFC/HCE capability and remembers whether the student has completed
/// the tap-to-board setup flow.
///
/// Detection is two-source:
///  - `flutter_nfc_kit` for hardware presence + the on/off toggle
///    (`NFCAvailability.not_supported / disabled / available`)
///  - our own `movio/nfc` MethodChannel (see MainActivity.kt) for the HCE
///    system feature, which the plugin does not expose
///
/// Every platform call is wrapped so a plugin/channel failure degrades to an
/// honest "no / unknown" instead of crashing — the PSD-104 acceptance criterion.
class NfcCapabilityService {
  NfcCapabilityService([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();

  static const _channel = MethodChannel('movio/nfc');

  // Same Keystore-backed store the auth session uses; "1" once the student has
  // walked the setup flow to a ready phone. A pure device fact isn't secret,
  // but reusing secure storage avoids adding a shared_preferences dependency.
  static const _kHceSetupDone = 'movio.hce_setup_done';

  final FlutterSecureStorage _storage;

  Future<NfcCapability> probe() async {
    NFCAvailability availability;
    try {
      availability = await FlutterNfcKit.nfcAvailability;
    } on Exception {
      // Plugin unavailable == behave exactly like a phone with no NFC.
      availability = NFCAvailability.not_supported;
    }

    bool? hce;
    if (availability == NFCAvailability.not_supported) {
      hce = false; // no NFC radio -> HCE is impossible by definition
    } else {
      try {
        hce = await _channel.invokeMethod<bool>('hasHce');
      } on Exception {
        hce = null; // channel failed: report "couldn't confirm", don't guess
      }
    }

    return NfcCapability(
      hasHardware: availability != NFCAvailability.not_supported,
      enabled: availability == NFCAvailability.available,
      hceSupported: hce,
    );
  }

  /// Opens Android's NFC settings screen. Returns false (rather than throwing)
  /// if the device has no such screen.
  Future<bool> openNfcSettings() async {
    try {
      return await _channel.invokeMethod<bool>('openNfcSettings') ?? false;
    } on Exception {
      return false;
    }
  }

  Future<bool> isSetupDone() async =>
      (await _storage.read(key: _kHceSetupDone)) == '1';

  Future<void> markSetupDone() =>
      _storage.write(key: _kHceSetupDone, value: '1');
}
