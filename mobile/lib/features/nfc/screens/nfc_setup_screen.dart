import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_system_ui.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/app_background.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../../../shared/widgets/entrance.dart';
import '../../../shared/widgets/primary_button.dart';
import '../data/nfc_capability_service.dart';

/// Tap-to-board setup / status (PSD-104, MOB-6).
///
/// Probes the phone's *real* NFC + HCE capability with a short sonar-scan
/// moment, then reveals one of four honest outcomes:
///   - ready (NFC on + HCE)      -> finish setup, phone acts as the card
///   - NFC off                   -> guided fix: jump to settings, auto re-check
///   - HCE missing / no NFC      -> "physical card required", gracefully — most
///                                  FUTA students are on this path (Ch.2 survey)
///
/// Opened from Home's "Board a trip" card: first visit runs as the setup flow
/// ([statusMode] false, ready ends with "Finish setup" and pops `true`);
/// once setup is done it reopens as a status/re-check screen.
///
/// The actual boarding flow ships with the TapTrace reader — this screen only
/// verifies (and never overstates) what this phone will be able to do.
class NfcSetupScreen extends StatefulWidget {
  NfcSetupScreen({
    super.key,
    this.statusMode = false,
    NfcCapabilityService? service,
    this.probe,
    this.scanTheatre = const Duration(milliseconds: 1800),
  }) : service = service ?? NfcCapabilityService();

  /// False on first run (setup flow), true once setup was completed before.
  final bool statusMode;

  final NfcCapabilityService service;

  /// Test seam — lets widget tests inject a fake capability without platform
  /// channels. Defaults to [NfcCapabilityService.probe].
  final Future<NfcCapability> Function()? probe;

  /// How long the scanning animation plays even if the probe answers
  /// instantly — the check *feeling* real is part of the UX. Zero in tests.
  final Duration scanTheatre;

  @override
  State<NfcSetupScreen> createState() => _NfcSetupScreenState();
}

class _NfcSetupScreenState extends State<NfcSetupScreen>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  // Drives the sonar rings + breathing disc; only runs while scanning, so the
  // revealed screen is animation-free (cheap, and widget tests can settle).
  late final AnimationController _sonar = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1800),
  );

  bool _scanning = true;
  NfcCapability? _cap;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _runScan();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _sonar.dispose();
    super.dispose();
  }

  /// Re-probe when the app comes back to the foreground and the last verdict
  /// was "NFC off" — the user most likely just flipped the toggle in settings.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed &&
        !_scanning &&
        _cap?.readiness == NfcReadiness.nfcOff) {
      _runScan();
    }
  }

  Future<void> _runScan() async {
    setState(() {
      _scanning = true;
      _cap = null;
    });
    _sonar.repeat();
    // The probe is near-instant; the parallel delay gives the scan its moment.
    final results = await Future.wait<Object?>([
      (widget.probe ?? widget.service.probe)(),
      Future<void>.delayed(widget.scanTheatre),
    ]);
    if (!mounted) return;
    _sonar.stop();
    final cap = results.first! as NfcCapability;
    setState(() {
      _scanning = false;
      _cap = cap;
    });
    // A little physical punctuation on the reveal.
    if (cap.readiness == NfcReadiness.hceReady) {
      HapticFeedback.mediumImpact();
    } else {
      HapticFeedback.selectionClick();
    }
  }

  Future<void> _openNfcSettings() async {
    HapticFeedback.selectionClick();
    final opened = await widget.service.openNfcSettings();
    if (!opened && mounted) {
      AppSnackbar.info(
          context, 'Couldn’t open NFC settings — look for “NFC” in Settings');
    }
  }

  Future<void> _finishSetup() async {
    HapticFeedback.mediumImpact();
    await widget.service.markSetupDone();
    if (mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.dark,
      child: Scaffold(
        backgroundColor: AppColors.paper,
        body: AppBackground(
          child: SafeArea(
            child: Column(
              children: [
                _Header(
                  title: widget.statusMode
                      ? 'Tap-to-board status'
                      : 'Set up tap-to-board',
                ),
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.page),
                    child: Column(
                      children: [
                        const SizedBox(height: AppSpacing.lg),
                        _ScanStage(
                          sonar: _sonar,
                          scanning: _scanning,
                          readiness: _cap?.readiness,
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        // Crossfade scanning caption <-> revealed verdict.
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 350),
                          child: _scanning
                              ? const _ScanningCaption()
                              : _ResultBody(
                                  key: ValueKey(_cap!.readiness),
                                  cap: _cap!,
                                ),
                        ),
                        const SizedBox(height: AppSpacing.xl),
                      ],
                    ),
                  ),
                ),
                if (!_scanning) _buildActions(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActions() {
    final readiness = _cap!.readiness;
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.page, 0, AppSpacing.page, AppSpacing.lg),
      child: Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: switch (readiness) {
              NfcReadiness.hceReady when !widget.statusMode => PrimaryButton(
                  label: 'Finish setup',
                  icon: Icons.check_rounded,
                  onPressed: _finishSetup,
                ),
              NfcReadiness.hceReady => PrimaryButton(
                  label: 'Done',
                  icon: Icons.check_rounded,
                  onPressed: () => Navigator.of(context).pop(),
                ),
              NfcReadiness.nfcOff => PrimaryButton(
                  label: 'Turn on NFC',
                  icon: Icons.settings_rounded,
                  onPressed: _openNfcSettings,
                ),
              _ => PrimaryButton(
                  label: 'Got it',
                  onPressed: () => Navigator.of(context).pop(),
                ),
            },
          ),
          TextButton.icon(
            onPressed: _runScan,
            icon: const Icon(Icons.refresh_rounded,
                size: 18, color: AppColors.brand700),
            label: Text(
              'Run the check again',
              style: AppTypography.button.copyWith(color: AppColors.brand700),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Header ──────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg, AppSpacing.md, AppSpacing.page, 0),
      child: Row(
        children: [
          Material(
            color: AppColors.surface,
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: () => Navigator.of(context).maybePop(),
              child: Container(
                height: 42,
                width: 42,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.line),
                ),
                child: const Icon(Icons.arrow_back_rounded,
                    size: 20, color: AppColors.ink),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.headingMd,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Scan stage (the centrepiece visual) ─────────────────────────────────────

/// While scanning: sonar rings ripple outward around a breathing brand disc.
/// Once revealed: the disc pops (elastic) into the verdict badge and all
/// continuous animation stops.
class _ScanStage extends StatelessWidget {
  const _ScanStage({
    required this.sonar,
    required this.scanning,
    this.readiness,
  });

  final Animation<double> sonar;
  final bool scanning;
  final NfcReadiness? readiness;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 240,
      width: 240,
      child: scanning
          ? AnimatedBuilder(
              animation: sonar,
              builder: (context, _) {
                final t = sonar.value;
                // Gentle breathing: ±4% scale over one sonar cycle.
                final breath = 1 + 0.04 * math.sin(t * 2 * math.pi);
                return Stack(
                  alignment: Alignment.center,
                  children: [
                    CustomPaint(
                      size: const Size.square(240),
                      painter: _SonarPainter(t),
                    ),
                    Transform.scale(
                      scale: breath,
                      child: const _Disc(
                        gradient: AppColors.brandGradient,
                        icon: Icons.contactless_rounded,
                      ),
                    ),
                  ],
                );
              },
            )
          : _ResultBadge(readiness: readiness!),
    );
  }
}

/// Three staggered, expanding-and-fading rings — the "actively probing" signal
/// (same visual language as the live map's pulse markers).
class _SonarPainter extends CustomPainter {
  _SonarPainter(this.t);

  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final maxR = size.width / 2;
    for (var i = 0; i < 3; i++) {
      final p = (t + i / 3) % 1.0;
      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..color = AppColors.brand500.withValues(alpha: (1 - p) * 0.45);
      canvas.drawCircle(center, 44 + (maxR - 44) * p, paint);
    }
  }

  @override
  bool shouldRepaint(_SonarPainter old) => old.t != t;
}

/// The verdict badge: soft halo + coloured disc + icon, popping in with an
/// elastic one-shot scale so the reveal feels like a landing, not a swap.
class _ResultBadge extends StatelessWidget {
  const _ResultBadge({required this.readiness});

  final NfcReadiness readiness;

  @override
  Widget build(BuildContext context) {
    final style = _readinessStyle(readiness);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.6, end: 1),
      duration: const Duration(milliseconds: 650),
      curve: Curves.elasticOut,
      builder: (context, scale, child) => Opacity(
        // elasticOut overshoots past 1; clamp so Opacity stays legal.
        opacity: ((scale - 0.6) / 0.4).clamp(0.0, 1.0),
        child: Transform.scale(scale: scale, child: child),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            height: 190,
            width: 190,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: style.accent.withValues(alpha: 0.10),
            ),
          ),
          Container(
            height: 150,
            width: 150,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: style.accent.withValues(alpha: 0.16),
            ),
          ),
          _Disc(gradient: style.gradient, color: style.accent, icon: style.icon),
        ],
      ),
    );
  }
}

/// The 110px centre disc used by both the scanning and revealed states.
class _Disc extends StatelessWidget {
  const _Disc({required this.icon, this.gradient, this.color});

  final IconData icon;
  final Gradient? gradient;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 110,
      width: 110,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: gradient,
        color: gradient == null ? color : null,
        boxShadow: [
          BoxShadow(
            color: (color ?? AppColors.brand700).withValues(alpha: 0.35),
            blurRadius: 26,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Icon(icon, color: AppColors.onBrand, size: 46),
    );
  }
}

// ─── Copy + result body ──────────────────────────────────────────────────────

class _ScanningCaption extends StatelessWidget {
  const _ScanningCaption();

  @override
  Widget build(BuildContext context) {
    return Column(
      key: const ValueKey('scanning'),
      children: [
        Text('Checking your phone…', style: AppTypography.titleMd),
        const SizedBox(height: 6),
        Text(
          'Looking for NFC hardware and card-emulation (HCE) support.',
          textAlign: TextAlign.center,
          style: AppTypography.caption,
        ),
      ],
    );
  }
}

/// Headline + the literal diagnostic line + explanation + capability breakdown.
class _ResultBody extends StatelessWidget {
  const _ResultBody({super.key, required this.cap});

  final NfcCapability cap;

  @override
  Widget build(BuildContext context) {
    final style = _readinessStyle(cap.readiness);
    return Column(
      children: [
        Entrance(child: Text(style.headline, style: AppTypography.headingMd)),
        const SizedBox(height: AppSpacing.sm),
        // The machine-truth line, verbatim per the PSD-104 acceptance example.
        Entrance(
          delay: const Duration(milliseconds: 60),
          child: Container(
            padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.md, vertical: 5),
            decoration: BoxDecoration(
              color: style.accent.withValues(alpha: 0.10),
              borderRadius: AppRadius.brSm,
            ),
            child: Text(
              style.diagnostic,
              textAlign: TextAlign.center,
              style: AppTypography.caption.copyWith(
                fontFamily: AppTypography.mono,
                color: style.accent,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Entrance(
          delay: const Duration(milliseconds: 120),
          child: Text(
            style.explanation,
            textAlign: TextAlign.center,
            style: AppTypography.bodyMd.copyWith(color: AppColors.inkMuted),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        Entrance(
          delay: const Duration(milliseconds: 180),
          child: _CapabilityCard(cap: cap),
        ),
        const SizedBox(height: AppSpacing.lg),
        Entrance(
          delay: const Duration(milliseconds: 240),
          child: Text(
            'Boarding with your phone launches with the TapTrace reader — '
            'this check makes sure you’re ready on day one.',
            textAlign: TextAlign.center,
            style: AppTypography.caption,
          ),
        ),
      ],
    );
  }
}

/// The three raw facts behind the verdict, so the result never feels like
/// magic: hardware, toggle, HCE — each with its own honest chip.
class _CapabilityCard extends StatelessWidget {
  const _CapabilityCard({required this.cap});

  final NfcCapability cap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        children: [
          _CapabilityRow(
            label: 'NFC hardware',
            chip: cap.hasHardware
                ? const _Chip.good('Present')
                : const _Chip.absent('Not found'),
          ),
          const Divider(height: 1, color: AppColors.lineSoft),
          _CapabilityRow(
            label: 'NFC turned on',
            chip: cap.enabled
                ? const _Chip.good('On')
                : cap.hasHardware
                    ? const _Chip.fixable('Off')
                    : const _Chip.absent('—'),
          ),
          const Divider(height: 1, color: AppColors.lineSoft),
          _CapabilityRow(
            label: 'Card emulation (HCE)',
            chip: switch (cap.hceSupported) {
              true => const _Chip.good('Supported'),
              false => const _Chip.absent('Not supported'),
              null => const _Chip.fixable('Couldn’t confirm'),
            },
          ),
        ],
      ),
    );
  }
}

class _CapabilityRow extends StatelessWidget {
  const _CapabilityRow({required this.label, required this.chip});

  final String label;
  final Widget chip;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
      child: Row(
        children: [
          Expanded(child: Text(label, style: AppTypography.bodyMd)),
          chip,
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip.good(this.text)
      : bg = AppColors.brand50,
        fg = AppColors.brand700,
        icon = Icons.check_rounded;

  const _Chip.fixable(this.text)
      : bg = const Color(0x1FF59E0B), // warning @ 12%
        fg = const Color(0xFFB45309), // darkened amber for contrast on light
        icon = Icons.priority_high_rounded;

  const _Chip.absent(this.text)
      : bg = AppColors.lineSoft,
        fg = AppColors.inkMuted,
        icon = Icons.close_rounded;

  final String text;
  final Color bg;
  final Color fg;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: AppRadius.brSm),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: fg),
          const SizedBox(width: 4),
          Text(
            text,
            style: AppTypography.caption.copyWith(
              color: fg,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Per-readiness presentation ──────────────────────────────────────────────

class _ReadinessStyle {
  const _ReadinessStyle({
    required this.accent,
    required this.icon,
    required this.headline,
    required this.diagnostic,
    required this.explanation,
    this.gradient,
  });

  final Color accent;
  final Gradient? gradient;
  final IconData icon;
  final String headline;

  /// The literal capability report (PSD-104's acceptance example strings).
  final String diagnostic;
  final String explanation;
}

_ReadinessStyle _readinessStyle(NfcReadiness readiness) {
  switch (readiness) {
    case NfcReadiness.hceReady:
      return const _ReadinessStyle(
        accent: AppColors.brand600,
        gradient: AppColors.brandGradient,
        icon: Icons.check_rounded,
        headline: 'Your phone can tap to board',
        diagnostic: 'NFC available — HCE mode supported',
        explanation:
            'Hold your phone to the TapTrace reader on any shuttle and one '
            'Transit Credit is deducted automatically.',
      );
    case NfcReadiness.nfcOff:
      return const _ReadinessStyle(
        accent: AppColors.warning,
        icon: Icons.nfc_rounded,
        headline: 'Almost there — NFC is off',
        diagnostic: 'NFC hardware found — currently turned off',
        explanation:
            'Turn NFC on in your phone’s settings. We’ll re-check '
            'automatically the moment you come back.',
      );
    case NfcReadiness.cardOnly:
      return const _ReadinessStyle(
        accent: AppColors.inkMuted,
        icon: Icons.credit_card_rounded,
        headline: 'You’ll board with a card',
        diagnostic: 'NFC available — HCE not supported — physical card required',
        explanation:
            'This phone can’t emulate a transit card, so you’ll tap a '
            'physical MovIO card instead. Everything else works normally.',
      );
    case NfcReadiness.noNfc:
      return const _ReadinessStyle(
        accent: AppColors.inkMuted,
        icon: Icons.credit_card_rounded,
        headline: 'You’ll board with a card',
        diagnostic: 'NFC not available — physical card required',
        explanation:
            'No NFC on this phone — and that’s fine: you’ll tap a physical '
            'MovIO card at the door. Every other feature works without NFC.',
      );
  }
}
