import '../../../core/config/env.dart';
import '../../../core/network/api_client.dart';

/// The student's transit wallet. `balanceCredits` is a *count of trips* they can
/// still board — 1 credit is spent per boarding — not a cash amount.
class Wallet {
  const Wallet({required this.balanceCredits});

  final int balanceCredits;

  factory Wallet.fromJson(Map<String, dynamic> json) {
    final v = json['balance_credits'];
    return Wallet(
      balanceCredits: v is num ? v.toInt() : int.tryParse('$v') ?? 0,
    );
  }
}

/// One credit_transactions row: a top-up (positive amount) or a boarding
/// deduction (negative). `reference` holds a trip_id for deductions and the
/// staff user_id for cash top-ups — traceability, not display data.
class CreditTransaction {
  const CreditTransaction({
    required this.transactionId,
    required this.amount,
    required this.type,
    required this.createdAt,
  });

  final String transactionId;
  final int amount;
  final String type; // topup_app | topup_cash | boarding_deduction | redemption
  final DateTime createdAt;

  bool get isCredit => amount > 0;

  factory CreditTransaction.fromJson(Map<String, dynamic> json) {
    final v = json['amount'];
    return CreditTransaction(
      transactionId: json['transaction_id'] as String,
      amount: v is num ? v.toInt() : int.tryParse('$v') ?? 0,
      type: (json['type'] as String?) ?? 'boarding_deduction',
      createdAt:
          DateTime.tryParse('${json['created_at']}')?.toLocal() ?? DateTime.now(),
    );
  }
}

/// Reads the logged-in student's wallet from `GET /api/v1/wallet` and their
/// transaction history from `GET /api/v1/wallet/transactions`.
class WalletRepository {
  WalletRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  Future<Wallet> myWallet(String token) async {
    final data = await _api.get(ApiRoutes.wallet, token: token);
    return Wallet.fromJson(data);
  }

  Future<List<CreditTransaction>> transactions(String token) async {
    final data = await _api.getList(ApiRoutes.walletTransactions, token: token);
    return data
        .whereType<Map<String, dynamic>>()
        .map(CreditTransaction.fromJson)
        .toList();
  }
}
