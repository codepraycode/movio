import '../../../core/config/env.dart';
import '../../../core/network/api_client.dart';

/// Submits complaints to `POST /api/v1/complaints` (BE-8; student JWT).
/// `tripId` is optional — a complaint may reference a specific boarded trip.
class ComplaintsRepository {
  ComplaintsRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  Future<void> submit(
    String token, {
    required String description,
    String? tripId,
  }) async {
    await _api.post(
      ApiRoutes.complaints,
      token: token,
      body: {
        'description': description,
        'trip_id': ?tripId,
      },
    );
  }
}
