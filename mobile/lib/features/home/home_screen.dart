import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_system_ui.dart';
import '../../core/theme/app_typography.dart';
import '../../shared/widgets/app_background.dart';
import '../../shared/widgets/app_snackbar.dart';
import '../../shared/widgets/double_back_to_exit.dart';
import '../../shared/widgets/entrance.dart';
import '../../shared/widgets/loaders/shimmer_box.dart';
import '../auth/state/auth_provider.dart';
import '../nfc/data/nfc_capability_service.dart';
import '../nfc/screens/nfc_setup_screen.dart';
import '../tracking/screens/live_map_screen.dart';
import '../wallet/data/wallet_repository.dart';

/// Home landing shown once authenticated. The student's transit hub: how much
/// Transit Credit they hold, boarding, spend history, reporting, and a live view
/// of shuttles moving on campus.
///
/// Honesty note (project rule): Transit Credit is a *count of trips*, not money —
/// 1 credit = 1 boarding. The balance and the boarding/history/report flows have
/// no mobile endpoint yet, so they read as "Soon" and never show invented data.
/// The live map is real and wired to `GET /tracking/active` + the socket stream.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ScrollController _scroll = ScrollController();
  final WalletRepository _walletRepo = WalletRepository();

  // Drives the status-bar scrim: transparent at the very top (hero/glow shows
  // through), solid paper + hairline once the content starts sliding under it.
  bool _scrolled = false;

  // Real Transit Credit balance (PSD-103). null while first loading; the card
  // shimmers when both are null, shows a dash on error, else the count.
  int? _credits;
  String? _walletError;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      final scrolled = _scroll.offset > 6;
      if (scrolled != _scrolled) setState(() => _scrolled = scrolled);
    });
    _loadWallet();
  }

  /// Fetches the live balance. Pull-to-refresh re-runs this — that's how the
  /// count drops after a simulated boarding deducts a credit (PSD-103 AC).
  Future<void> _loadWallet() async {
    final token = context.read<AuthProvider>().token;
    if (token == null) return;
    try {
      final wallet = await _walletRepo.myWallet(token);
      if (!mounted) return;
      setState(() {
        _credits = wallet.balanceCredits;
        _walletError = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _walletError = 'Couldn’t load balance');
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final firstName =
        (user?.firstName.isNotEmpty ?? false) ? user!.firstName : 'there';
    final topInset = MediaQuery.of(context).padding.top;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.dark,
      child: DoubleBackToExit(
        child: Scaffold(
          backgroundColor: AppColors.paper,
          body: AppBackground(
            child: Stack(
              children: [
                RefreshIndicator(
                  onRefresh: _loadWallet,
                  color: AppColors.brand600,
                  backgroundColor: AppColors.surface,
                  child: ListView(
                  controller: _scroll,
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: EdgeInsets.fromLTRB(
                    AppSpacing.page,
                    topInset + AppSpacing.md,
                    AppSpacing.page,
                    AppSpacing.xxxl,
                  ),
                  children: [
                    Entrance(child: _GreetingBar(name: firstName)),
                  const SizedBox(height: AppSpacing.xl),
                  Entrance(
                    delay: const Duration(milliseconds: 60),
                    child: _TransitCreditCard(
                      credits: _credits,
                      error: _walletError,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Entrance(
                    delay: const Duration(milliseconds: 120),
                    child: const _BoardTripCard(),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Entrance(
                    delay: const Duration(milliseconds: 180),
                    child: const _LiveMapCta(),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Entrance(
                    delay: const Duration(milliseconds: 240),
                    child: const Row(
                      children: [
                        Expanded(
                          child: _MiniTile(
                            icon: Icons.receipt_long_rounded,
                            title: 'My trips',
                            subtitle: 'Credits you’ve spent',
                          ),
                        ),
                        SizedBox(width: AppSpacing.lg),
                        Expanded(
                          child: _MiniTile(
                            icon: Icons.flag_outlined,
                            title: 'Report',
                            subtitle: 'Tell us what happened',
                          ),
                        ),
                      ],
                    ),
                    ),
                  ],
                  ),
                ),
                // Status-bar scrim — fades in on scroll so the system icons
                // always sit on a clean, on-brand surface.
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: IgnorePointer(
                    child: AnimatedOpacity(
                      opacity: _scrolled ? 1 : 0,
                      duration: const Duration(milliseconds: 220),
                      child: Container(
                        height: topInset,
                        decoration: BoxDecoration(
                          color: AppColors.paper,
                          border: Border(
                            bottom: BorderSide(
                              color: AppColors.line.withValues(alpha: 0.7),
                            ),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.ink.withValues(alpha: 0.05),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Greeting ────────────────────────────────────────────────────────────────

class _GreetingBar extends StatelessWidget {
  const _GreetingBar({required this.name});

  final String name;

  String get _timeGreeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('$_timeGreeting,', style: AppTypography.caption),
              const SizedBox(height: 2),
              Text(
                name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.headingLg,
              ),
            ],
          ),
        ),
        Material(
          color: AppColors.surface,
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: () => context.read<AuthProvider>().logout(),
            child: Container(
              height: 42,
              width: 42,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.line),
              ),
              child: const Icon(Icons.logout_rounded,
                  size: 19, color: AppColors.inkMuted),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Transit Credit hero ─────────────────────────────────────────────────────

/// The centrepiece: the student's Transit Credit balance — a *count of trips*,
/// not a cash figure (PSD-103). The real balance is fetched from the backend;
/// while it loads we shimmer, and on failure we show a dash — never a fake count.
class _TransitCreditCard extends StatelessWidget {
  const _TransitCreditCard({this.credits, this.error});

  final int? credits;
  final String? error;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: AppRadius.brXl,
        boxShadow: const [
          BoxShadow(
            color: Color(0x2E0F7A52),
            blurRadius: 28,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.confirmation_number_outlined,
                  color: AppColors.onBrand, size: 18),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'TRANSIT CREDIT',
                style: AppTypography.caption.copyWith(
                  color: AppColors.brand100,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.8,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.onBrand.withValues(alpha: 0.16),
                  borderRadius: AppRadius.brSm,
                ),
                child: Text(
                  '1 credit = 1 trip',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.onBrand,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          // Real balance + unit. Shimmer while first loading; dash on error.
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              if (credits != null)
                Text('$credits',
                    style: AppTypography.dataXl.copyWith(color: AppColors.onBrand))
              else if (error != null)
                Text('—',
                    style: AppTypography.dataXl.copyWith(color: AppColors.brand100))
              else
                ShimmerBox(
                  width: 58,
                  height: 40,
                  radius: 8,
                  baseColor: AppColors.onBrand.withValues(alpha: 0.22),
                  highlightColor: AppColors.onBrand.withValues(alpha: 0.42),
                ),
              const SizedBox(width: AppSpacing.md),
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  credits == 1 ? 'credit' : 'credits',
                  style: AppTypography.titleMd.copyWith(color: AppColors.brand100),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            error != null
                ? 'Pull down to refresh your balance.'
                : credits == null
                    ? 'Loading your balance…'
                    : credits == 0
                        ? 'No credits left — add some to board.'
                        : 'Good for $credits ${credits == 1 ? 'trip' : 'trips'} — 1 credit per boarding.',
            style: AppTypography.caption.copyWith(color: AppColors.brand100),
          ),
          const SizedBox(height: AppSpacing.xl),
          _HeroButton(
            icon: Icons.add_rounded,
            label: 'Add Transit Credit',
            onTap: () => _soon(context, 'Adding Transit Credit'),
          ),
        ],
      ),
    );
  }
}

/// A full-width light button that sits on the green hero.
class _HeroButton extends StatelessWidget {
  const _HeroButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.onBrand,
      borderRadius: AppRadius.brMd,
      child: InkWell(
        borderRadius: AppRadius.brMd,
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 20, color: AppColors.brand700),
              const SizedBox(width: AppSpacing.sm),
              Text(
                label,
                style: AppTypography.button.copyWith(
                  color: AppColors.brand700,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Board a trip (NFC) ──────────────────────────────────────────────────────

/// The key everyday action. Boarding is a tap-to-pay gesture: hold the phone to
/// the shuttle's NFC reader and 1 credit is deducted automatically. The reader
/// flow ships with the TapTrace hardware; until then this card routes into the
/// NFC/HCE setup flow (PSD-104): first tap runs setup, later taps open status.
class _BoardTripCard extends StatelessWidget {
  const _BoardTripCard();

  Future<void> _open(BuildContext context) async {
    HapticFeedback.selectionClick();
    // Already set up? Reopen as a status/re-check screen instead of setup.
    final setupDone = await NfcCapabilityService().isSetupDone();
    if (!context.mounted) return;
    final justFinished = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => NfcSetupScreen(statusMode: setupDone),
      ),
    );
    if (justFinished == true && context.mounted) {
      AppSnackbar.success(
          context, 'You’re set — tap-to-board launches with TapTrace');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.brand50,
      borderRadius: AppRadius.brLg,
      child: InkWell(
        borderRadius: AppRadius.brLg,
        onTap: () => _open(context),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            borderRadius: AppRadius.brLg,
            border: Border.all(color: AppColors.brand200),
          ),
          child: Row(
            children: [
              Container(
                height: 48,
                width: 48,
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  borderRadius: AppRadius.brMd,
                ),
                child: const Icon(Icons.contactless_rounded,
                    color: AppColors.onBrand, size: 26),
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Board a trip', style: AppTypography.titleMd),
                    const SizedBox(height: 3),
                    Text(
                      'Hold your phone to TapTrace — 1 credit is deducted automatically.',
                      style: AppTypography.caption.copyWith(color: AppColors.brand800),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              const Icon(Icons.chevron_right_rounded,
                  size: 22, color: AppColors.brand700),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Live map CTA (activated) ────────────────────────────────────────────────

/// The app's signature "wow": a live look at shuttles moving across campus.
/// Real — on tap it fetches active trips from the backend and opens the live map.
class _LiveMapCta extends StatefulWidget {
  const _LiveMapCta();

  @override
  State<_LiveMapCta> createState() => _LiveMapCtaState();
}

class _LiveMapCtaState extends State<_LiveMapCta>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat();

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  void _openMap() {
    HapticFeedback.selectionClick();
    // The campus map loads every active vehicle itself (and shows its own empty
    // state), so we just open it.
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => LiveMapScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: AppRadius.brLg,
      child: InkWell(
        borderRadius: AppRadius.brLg,
        onTap: _openMap,
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            borderRadius: AppRadius.brLg,
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppColors.brand700, AppColors.brand900],
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x24134E35),
                blurRadius: 20,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            children: [
              _LivePulse(pulse: _pulse),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            'See live movement',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.titleMd.copyWith(
                                color: AppColors.onBrand),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        _LiveBadge(pulse: _pulse),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Watch shuttles move across campus in real time.',
                      style: AppTypography.caption
                          .copyWith(color: AppColors.brand200),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Container(
                height: 32,
                width: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.onBrand.withValues(alpha: 0.16),
                ),
                child: const Icon(Icons.arrow_forward_rounded,
                    size: 18, color: AppColors.onBrand),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The radar-style pulsing map glyph on the live CTA.
class _LivePulse extends StatelessWidget {
  const _LivePulse({required this.pulse});

  final Animation<double> pulse;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      width: 52,
      child: AnimatedBuilder(
        animation: pulse,
        builder: (context, _) {
          final t = pulse.value;
          return Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 30 + 20 * t,
                height: 30 + 20 * t,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.brand300.withValues(alpha: (1 - t) * 0.5),
                ),
              ),
              Container(
                height: 40,
                width: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.onBrand.withValues(alpha: 0.14),
                ),
                child: const Icon(Icons.map_rounded,
                    color: AppColors.onBrand, size: 22),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Tiny "● LIVE" badge with a breathing dot.
class _LiveBadge extends StatelessWidget {
  const _LiveBadge({required this.pulse});

  final Animation<double> pulse;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.onBrand.withValues(alpha: 0.14),
        borderRadius: AppRadius.brSm,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedBuilder(
            animation: pulse,
            builder: (context, _) => Container(
              height: 6,
              width: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.brand300
                    .withValues(alpha: 0.5 + 0.5 * pulse.value),
              ),
            ),
          ),
          const SizedBox(width: 5),
          Text(
            'LIVE',
            style: AppTypography.caption.copyWith(
              color: AppColors.onBrand,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Secondary tiles ─────────────────────────────────────────────────────────

class _MiniTile extends StatelessWidget {
  const _MiniTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: AppRadius.brLg,
      child: InkWell(
        borderRadius: AppRadius.brLg,
        onTap: () => _soon(context, title),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            borderRadius: AppRadius.brLg,
            border: Border.all(color: AppColors.line),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 40,
                width: 40,
                decoration: BoxDecoration(
                  color: AppColors.brand50,
                  borderRadius: AppRadius.brMd,
                ),
                child: Icon(icon, color: AppColors.brand700, size: 20),
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Flexible(
                    child: Text(title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.titleMd),
                  ),
                  const SizedBox(width: 6),
                  const _SoonTag(),
                ],
              ),
              const SizedBox(height: 2),
              Text(subtitle, style: AppTypography.caption),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

class _SoonTag extends StatelessWidget {
  const _SoonTag();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.lineSoft,
        borderRadius: AppRadius.brSm,
      ),
      child: Text(
        'Soon',
        style: AppTypography.caption.copyWith(
          color: AppColors.inkMuted,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

/// Honest feedback for a not-yet-built action.
void _soon(BuildContext context, String feature) {
  AppSnackbar.info(context, '$feature is coming soon');
}
