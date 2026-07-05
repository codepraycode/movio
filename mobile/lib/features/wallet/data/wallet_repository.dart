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

/// Reads the logged-in student's wallet from `GET /api/v1/wallet`.
class WalletRepository {
  WalletRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  Future<Wallet> myWallet(String token) async {
    final data = await _api.get(ApiRoutes.wallet, token: token);
    return Wallet.fromJson(data);
  }
}
