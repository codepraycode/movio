import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../shared/widgets/loaders/shimmer_box.dart';
import '../auth/state/auth_provider.dart';

/// Placeholder landing shown once authenticated. Its job for PSD-101 is to prove
/// the login/register → main-app hand-off and session persistence. The real home
/// (live map, wallet, NFC profile) lands in later MOB tickets — feature tiles are
/// marked "Soon" rather than faked.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: AppSpacing.page,
        title: const Text('MovIO'),
        actions: [
          IconButton(
            tooltip: 'Log out',
            onPressed: () => context.read<AuthProvider>().logout(),
            icon: const Icon(Icons.logout, color: AppColors.inkMuted),
          ),
          const SizedBox(width: AppSpacing.sm),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.page,
          AppSpacing.sm,
          AppSpacing.page,
          AppSpacing.xxxl,
        ),
        children: [
          _GreetingCard(name: user?.firstName ?? 'there', matricNo: user?.matricNo),
          const SizedBox(height: AppSpacing.xl),
          const _WalletPreviewCard(),
          const SizedBox(height: AppSpacing.xxl),
          Text('Coming next', style: AppTypography.titleMd),
          const SizedBox(height: AppSpacing.md),
          const _FeatureTile(
            icon: Icons.map_outlined,
            title: 'Live shuttle map',
            subtitle: 'See active shuttles and ETAs in real time',
          ),
          const SizedBox(height: AppSpacing.md),
          const _FeatureTile(
            icon: Icons.account_balance_wallet_outlined,
            title: 'Transit Credit wallet',
            subtitle: 'Top up and pay for boarding without cash',
          ),
          const SizedBox(height: AppSpacing.md),
          const _FeatureTile(
            icon: Icons.nfc,
            title: 'NFC boarding profile',
            subtitle: 'Link your tap-to-board card',
          ),
        ],
      ),
    );
  }
}

class _GreetingCard extends StatelessWidget {
  const _GreetingCard({required this.name, this.matricNo});

  final String name;
  final String? matricNo;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 26,
          backgroundColor: AppColors.brand100,
          child: Text(
            (name.isNotEmpty ? name[0] : '?').toUpperCase(),
            style: AppTypography.headingMd.copyWith(color: AppColors.brand700),
          ),
        ),
        const SizedBox(width: AppSpacing.lg),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Welcome, $name', style: AppTypography.headingMd),
              if (matricNo != null && matricNo!.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(matricNo!, style: AppTypography.dataMd.copyWith(color: AppColors.inkMuted)),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

/// Brand-gradient wallet card. Balance is a shimmer placeholder — wiring the real
/// wallet endpoint is a later ticket; this previews the layout honestly.
class _WalletPreviewCard extends StatelessWidget {
  const _WalletPreviewCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: AppRadius.brLg,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.account_balance_wallet, color: AppColors.onBrand, size: 20),
              const SizedBox(width: AppSpacing.sm),
              Text(
                'Transit Credit',
                style: AppTypography.label.copyWith(color: AppColors.onBrand),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          const ShimmerBox(width: 140, height: 30, radius: 6),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Wallet top-up coming soon',
            style: AppTypography.caption.copyWith(color: AppColors.brand100),
          ),
        ],
      ),
    );
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
          Container(
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
          ),
        ],
      ),
    );
  }
}
