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
import '../auth/data/auth_models.dart';
import '../auth/state/auth_provider.dart';

/// Home landing shown once authenticated. Proves the login/register → main-app
/// hand-off and session persistence.
///
/// Honesty note (per project rules): nothing here is faked. The wallet balance is
/// a shimmer placeholder until the wallet endpoint is wired; every action that has
/// no backend/mobile flow yet is tagged "Soon" and tells the student so on tap,
/// rather than pretending to work.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    // The hero is a dark green gradient, so the status-bar icons go light here.
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppSystemUi.light,
      child: DoubleBackToExit(
        child: Scaffold(
          backgroundColor: AppColors.paper,
          body: AppBackground(
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(child: _Hero(user: user)),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.page,
                    AppSpacing.xxl,
                    AppSpacing.page,
                    AppSpacing.xxxl,
                  ),
                  sliver: SliverList.list(
                    children: [
                      Entrance(
                        delay: const Duration(milliseconds: 120),
                        child: const _SectionLabel('Quick actions'),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Entrance(
                        delay: const Duration(milliseconds: 180),
                        child: const _QuickActions(),
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                      Entrance(
                        delay: const Duration(milliseconds: 240),
                        child: const _SustainabilityCard(),
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                      Entrance(
                        delay: const Duration(milliseconds: 300),
                        child: const _SectionLabel('Coming next'),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Entrance(
                        delay: const Duration(milliseconds: 360),
                        child: const _FeatureTile(
                          icon: Icons.map_outlined,
                          title: 'Live shuttle map',
                          subtitle: 'Track active shuttles and ETAs in real time',
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Entrance(
                        delay: const Duration(milliseconds: 420),
                        child: const _FeatureTile(
                          icon: Icons.nfc_rounded,
                          title: 'NFC boarding profile',
                          subtitle: 'Link your tap-to-board card for cashless boarding',
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Entrance(
                        delay: const Duration(milliseconds: 480),
                        child: const _FeatureTile(
                          icon: Icons.receipt_long_outlined,
                          title: 'Trip & payment history',
                          subtitle: 'Every boarding and top-up in one place',
                        ),
                      ),
                    ],
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

// ─── Hero header ────────────────────────────────────────────────────────────

/// Full-bleed green gradient header that runs under the status bar, carrying the
/// greeting, the student's identity, and the wallet card. This is the app's
/// signature surface — the first thing a student sees after signing in.
class _Hero extends StatelessWidget {
  const _Hero({required this.user});

  final AuthUser? user;

  String get _timeGreeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.of(context).padding.top;
    final name = (user?.firstName.isNotEmpty ?? false) ? user!.firstName : 'there';

    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.page,
        topInset + AppSpacing.lg,
        AppSpacing.page,
        AppSpacing.xxl,
      ),
      decoration: const BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(AppRadius.xl),
          bottomRight: Radius.circular(AppRadius.xl),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x330F7A52),
            blurRadius: 24,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Entrance(
            child: Row(
              children: [
                _Avatar(initials: user?.initials ?? '?'),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$_timeGreeting,',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.brand100,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.headingMd.copyWith(
                          color: AppColors.onBrand,
                        ),
                      ),
                    ],
                  ),
                ),
                _HeroIconButton(
                  tooltip: 'Log out',
                  icon: Icons.logout_rounded,
                  onPressed: () => context.read<AuthProvider>().logout(),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          Entrance(
            delay: const Duration(milliseconds: 80),
            child: _WalletCard(matricNo: user?.matricNo),
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.initials});

  final String initials;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 48,
      width: 48,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.onBrand.withValues(alpha: 0.18),
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.onBrand.withValues(alpha: 0.35)),
      ),
      child: Text(
        initials.isNotEmpty ? initials : '?',
        style: AppTypography.titleMd.copyWith(color: AppColors.onBrand),
      ),
    );
  }
}

class _HeroIconButton extends StatelessWidget {
  const _HeroIconButton({
    required this.icon,
    required this.onPressed,
    required this.tooltip,
  });

  final IconData icon;
  final VoidCallback onPressed;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.onBrand.withValues(alpha: 0.14),
      shape: const CircleBorder(),
      child: IconButton(
        tooltip: tooltip,
        onPressed: onPressed,
        icon: Icon(icon, color: AppColors.onBrand, size: 20),
      ),
    );
  }
}

/// The wallet centrepiece. A frosted white card lifting off the green hero, with
/// the balance set in mono to read as real telemetry. The figure itself is a
/// shimmer placeholder until the wallet endpoint is wired — deliberately not a
/// made-up number.
class _WalletCard extends StatelessWidget {
  const _WalletCard({this.matricNo});

  final String? matricNo;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.brLg,
        boxShadow: const [
          BoxShadow(
            color: Color(0x14101828),
            blurRadius: 20,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.account_balance_wallet_rounded,
                  color: AppColors.brand600, size: 18),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Transit Credit',
                style: AppTypography.label.copyWith(color: AppColors.inkMuted),
              ),
              const Spacer(),
              if (matricNo != null && matricNo!.isNotEmpty)
                Text(
                  matricNo!,
                  style: AppTypography.dataMd.copyWith(
                    color: AppColors.inkFaint,
                    fontSize: 12,
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                '₦',
                style: AppTypography.dataXl.copyWith(
                  color: AppColors.inkFaint,
                  fontSize: 22,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              const ShimmerBox(width: 130, height: 30, radius: 6),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Balance syncs once wallet top-up ships',
            style: AppTypography.caption.copyWith(color: AppColors.inkFaint),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: _WalletAction(
                  icon: Icons.add_rounded,
                  label: 'Top up',
                  filled: true,
                  onTap: () => _soon(context, 'Wallet top-up'),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: _WalletAction(
                  icon: Icons.qr_code_scanner_rounded,
                  label: 'Pay to board',
                  filled: false,
                  onTap: () => _soon(context, 'Tap-to-board'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _WalletAction extends StatelessWidget {
  const _WalletAction({
    required this.icon,
    required this.label,
    required this.filled,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool filled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final fg = filled ? AppColors.onBrand : AppColors.brand700;
    return Material(
      color: filled ? AppColors.brand600 : AppColors.brand50,
      borderRadius: AppRadius.brMd,
      child: InkWell(
        borderRadius: AppRadius.brMd,
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: fg),
              const SizedBox(width: AppSpacing.sm),
              Text(
                label,
                style: AppTypography.label.copyWith(color: fg),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Quick actions ──────────────────────────────────────────────────────────

class _QuickActions extends StatelessWidget {
  const _QuickActions();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _QuickAction(
            icon: Icons.nfc_rounded,
            label: 'Scan\nto board',
            onTap: () => _soon(context, 'NFC boarding'),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: _QuickAction(
            icon: Icons.map_outlined,
            label: 'Live\nshuttles',
            onTap: () => _soon(context, 'Live shuttle map'),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: _QuickAction(
            icon: Icons.report_problem_outlined,
            label: 'Report\nan issue',
            onTap: () => _soon(context, 'Complaints'),
          ),
        ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: AppRadius.brLg,
      child: InkWell(
        borderRadius: AppRadius.brLg,
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(
            vertical: AppSpacing.lg,
            horizontal: AppSpacing.sm,
          ),
          decoration: BoxDecoration(
            borderRadius: AppRadius.brLg,
            border: Border.all(color: AppColors.line),
          ),
          child: Column(
            children: [
              Container(
                height: 44,
                width: 44,
                decoration: const BoxDecoration(
                  color: AppColors.brand50,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: AppColors.brand700, size: 22),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                label,
                textAlign: TextAlign.center,
                style: AppTypography.caption.copyWith(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w600,
                  height: 1.25,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Sustainability ─────────────────────────────────────────────────────────

/// Ties the app to the project's SDG framing (SDG 11 / sustainable campus
/// mobility). Copy is aspirational-but-honest: it describes the panel, and the
/// impact figures are marked as arriving with the real trip data, not invented.
class _SustainabilityCard extends StatelessWidget {
  const _SustainabilityCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        borderRadius: AppRadius.brLg,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.brand50,
            AppColors.brand100.withValues(alpha: 0.6),
          ],
        ),
        border: Border.all(color: AppColors.brand200),
      ),
      child: Row(
        children: [
          Container(
            height: 46,
            width: 46,
            decoration: BoxDecoration(
              color: AppColors.brand600,
              borderRadius: AppRadius.brMd,
            ),
            child: const Icon(Icons.eco_rounded, color: AppColors.onBrand, size: 24),
          ),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Your campus impact', style: AppTypography.titleMd),
                const SizedBox(height: 2),
                Text(
                  'Shared shuttle rides cut emissions per student. Your impact tally lights up as you ride.',
                  style: AppTypography.caption.copyWith(color: AppColors.brand800),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Shared bits ────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text, style: AppTypography.titleMd);
  }
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile({required this.icon, required this.title, required this.subtitle});

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: AppRadius.brLg,
        border: Border.all(color: AppColors.line),
      ),
      child: Row(
        children: [
          Container(
            height: 44,
            width: 44,
            decoration: BoxDecoration(
              color: AppColors.brand50,
              borderRadius: AppRadius.brMd,
            ),
            child: Icon(icon, color: AppColors.brand700, size: 22),
          ),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.titleMd),
                const SizedBox(height: 2),
                Text(subtitle, style: AppTypography.caption),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          const _SoonTag(),
        ],
      ),
    );
  }
}

class _SoonTag extends StatelessWidget {
  const _SoonTag();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.lineSoft,
        borderRadius: AppRadius.brSm,
      ),
      child: Text(
        'Soon',
        style: AppTypography.caption.copyWith(
          color: AppColors.inkMuted,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// Honest feedback for a not-yet-built action: tells the student it's coming
/// rather than silently doing nothing or pretending to work.
void _soon(BuildContext context, String feature) {
  AppSnackbar.info(context, '$feature is coming soon');
}
