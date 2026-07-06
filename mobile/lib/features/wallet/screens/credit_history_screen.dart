import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_system_ui.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/format.dart';
import '../../../shared/widgets/app_background.dart';
import '../../../shared/widgets/entrance.dart';
import '../../../shared/widgets/list_states.dart';
import '../../../shared/widgets/loaders/shimmer_box.dart';
import '../../../shared/widgets/screen_header.dart';
import '../../auth/state/auth_provider.dart';
import '../data/wallet_repository.dart';

/// Transit Credit history: every credit in (top-up) and out (boarding), newest
/// first, with the live balance on top — the wallet's full account, in credits
/// (trips), never naira.
class CreditHistoryScreen extends StatefulWidget {
  const CreditHistoryScreen({super.key});

  @override
  State<CreditHistoryScreen> createState() => _CreditHistoryScreenState();
}

class _CreditHistoryScreenState extends State<CreditHistoryScreen> {
  final WalletRepository _repo = WalletRepository();

  List<CreditTransaction>? _transactions;
  int? _balance;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final token = context.read<AuthProvider>().token;
    if (token == null) return;
    try {
      // Balance + history together so the header never contradicts the list.
      final results = await Future.wait([
        _repo.myWallet(token),
        _repo.transactions(token),
      ]);
      if (!mounted) return;
      setState(() {
        _balance = (results[0] as Wallet).balanceCredits;
        _transactions = (results[1] as List<CreditTransaction>);
        _error = null;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'Couldn’t load your credit history');
    }
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
                const ScreenHeader(title: 'Credit history'),
                Expanded(child: _buildBody()),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    final txs = _transactions;

    if (_error != null && txs == null) {
      return ListMessage(
        icon: Icons.cloud_off_rounded,
        title: _error!,
        body: 'Pull down to try again.',
        onRefresh: _load,
      );
    }
    if (txs == null) return const ListLoading(itemHeight: 72);

    return RefreshIndicator(
      onRefresh: _load,
      color: AppColors.brand600,
      backgroundColor: AppColors.surface,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.page),
        children: [
          Entrance(child: _BalanceHeader(balance: _balance)),
          const SizedBox(height: AppSpacing.xl),
          if (txs.isEmpty)
            Entrance(
              delay: const Duration(milliseconds: 60),
              child: Padding(
                padding: const EdgeInsets.only(top: AppSpacing.xxxl),
                child: Column(
                  children: [
                    const Icon(Icons.receipt_long_rounded,
                        size: 40, color: AppColors.inkFaint),
                    const SizedBox(height: AppSpacing.md),
                    Text('No credit activity yet',
                        style: AppTypography.titleMd),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Top-ups and trip fares will appear here.',
                      textAlign: TextAlign.center,
                      style: AppTypography.caption,
                    ),
                  ],
                ),
              ),
            )
          else ...[
            for (var i = 0; i < txs.length; i++) ...[
              Entrance(
                delay: Duration(milliseconds: 40 * (i < 10 ? i : 0)),
                child: _TransactionRow(tx: txs[i]),
              ),
              if (i != txs.length - 1)
                const Divider(height: 1, color: AppColors.lineSoft),
            ],
          ],
        ],
      ),
    );
  }
}

/// Compact green hero echoing the home wallet card, with the live balance.
class _BalanceHeader extends StatelessWidget {
  const _BalanceHeader({this.balance});

  final int? balance;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: AppRadius.brXl,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CURRENT BALANCE',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.brand100,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                if (balance != null)
                  Text(
                    '$balance ${balance == 1 ? 'credit' : 'credits'}',
                    style:
                        AppTypography.dataXl.copyWith(color: AppColors.onBrand),
                  )
                else
                  ShimmerBox(
                    width: 120,
                    height: 36,
                    radius: 8,
                    baseColor: AppColors.onBrand.withValues(alpha: 0.22),
                    highlightColor: AppColors.onBrand.withValues(alpha: 0.42),
                  ),
              ],
            ),
          ),
          Text(
            '1 credit = 1 trip',
            style: AppTypography.caption.copyWith(color: AppColors.brand100),
          ),
        ],
      ),
    );
  }
}

class _TransactionRow extends StatelessWidget {
  const _TransactionRow({required this.tx});

  final CreditTransaction tx;

  /// Human name per credit_transactions type (backend CHECK constraint).
  String get _label {
    switch (tx.type) {
      case 'topup_cash':
        return 'Cash top-up';
      case 'topup_app':
        return 'Top-up';
      case 'redemption':
        return 'Redemption';
      case 'boarding_deduction':
      default:
        return 'Trip fare';
    }
  }

  @override
  Widget build(BuildContext context) {
    final credit = tx.isCredit;
    final accent = credit ? AppColors.brand600 : AppColors.ink;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
      child: Row(
        children: [
          Container(
            height: 40,
            width: 40,
            decoration: BoxDecoration(
              color: credit ? AppColors.brand50 : AppColors.lineSoft,
              shape: BoxShape.circle,
            ),
            child: Icon(
              credit ? Icons.add_rounded : Icons.directions_bus_rounded,
              size: 20,
              color: credit ? AppColors.brand700 : AppColors.inkMuted,
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_label, style: AppTypography.titleMd),
                const SizedBox(height: 2),
                Text(
                  formatDayTime(tx.createdAt),
                  style: AppTypography.caption
                      .copyWith(fontFamily: AppTypography.mono),
                ),
              ],
            ),
          ),
          Text(
            '${credit ? '+' : ''}${tx.amount}',
            style: AppTypography.dataMd.copyWith(color: accent),
          ),
        ],
      ),
    );
  }
}
