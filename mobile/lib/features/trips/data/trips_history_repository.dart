import '../../../core/config/env.dart';
import '../../../core/network/api_client.dart';

/// One boarding event from the student's own history: which vehicle they
/// boarded, who drove, on which route, and when they tapped in/out. One
/// tap-in = one Transit Credit spent, so this list *is* the account of where
/// their credits went.
class BoardedTrip {
  const BoardedTrip({
    required this.eventId,
    required this.tripId,
    required this.boardedAt,
    required this.alightedAt,
    required this.tripStatus,
    required this.plateNumber,
    required this.vehicleType,
    required this.routeName,
    required this.driverName,
  });

  final String eventId;
  final String tripId;
  final DateTime boardedAt;
  final DateTime? alightedAt;
  final String tripStatus;
  final String plateNumber;
  final String vehicleType; // backend enum: bus | cab | tricycle
  final String? routeName; // a trip can legitimately have no route assigned
  final String driverName;

  /// Still aboard: tapped in, not yet out, and the trip hasn't ended.
  bool get isAboard => alightedAt == null && tripStatus == 'active';

  factory BoardedTrip.fromJson(Map<String, dynamic> json) {
    DateTime? toDate(dynamic v) =>
        v == null ? null : DateTime.tryParse('$v')?.toLocal();
    final first = (json['driver_first_name'] as String?) ?? '';
    final last = (json['driver_last_name'] as String?) ?? '';
    return BoardedTrip(
      eventId: json['event_id'] as String,
      tripId: json['trip_id'] as String,
      boardedAt: toDate(json['boarded_at']) ?? DateTime.now(),
      alightedAt: toDate(json['alighted_at']),
      tripStatus: (json['trip_status'] as String?) ?? 'completed',
      plateNumber: (json['plate_number'] as String?) ?? '—',
      vehicleType: (json['vehicle_type'] as String?) ?? 'bus',
      routeName: json['route_name'] as String?,
      driverName: '$first $last'.trim(),
    );
  }
}

/// Reads the student's boarding history from `GET /api/v1/boarding/my-trips`.
class TripsHistoryRepository {
  TripsHistoryRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  Future<List<BoardedTrip>> myTrips(String token) async {
    final data = await _api.getList(ApiRoutes.myTrips, token: token);
    return data
        .whereType<Map<String, dynamic>>()
        .map(BoardedTrip.fromJson)
        .toList();
  }
}
