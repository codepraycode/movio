import '../../../core/config/env.dart';
import '../../../core/network/api_client.dart';

/// One active trip as returned by `GET /tracking/active`. Mirrors the backend
/// `ActiveTripRow` (tracking.types.ts): trip + vehicle + route + last location.
/// [latitude]/[longitude] are null until the shuttle has reported a position.
class ActiveTrip {
  const ActiveTrip({
    required this.tripId,
    required this.plateNumber,
    required this.vehicleType,
    required this.capacity,
    required this.passengerCount,
    required this.status,
    required this.driverFirstName,
    required this.driverLastName,
    this.routeName,
    this.latitude,
    this.longitude,
    this.lastLocationAt,
  });

  final String tripId;
  final String plateNumber;
  final String vehicleType; // 'bus' | 'cab' | 'tricycle'
  final int capacity;
  final int passengerCount;
  final String status;
  final String driverFirstName;
  final String driverLastName;
  final String? routeName;
  final double? latitude;
  final double? longitude;
  final DateTime? lastLocationAt;

  bool get hasLocation => latitude != null && longitude != null;

  String get driverName => '$driverFirstName $driverLastName'.trim();

  /// A human label for the shuttle: its route if known, else its plate.
  String get title =>
      (routeName != null && routeName!.isNotEmpty) ? routeName! : plateNumber;

  /// Copy with a new live passenger count — applied when a `trip:passengers`
  /// socket event arrives, so the info sheet updates without a roster refetch.
  ActiveTrip copyWith({int? passengerCount}) {
    return ActiveTrip(
      tripId: tripId,
      plateNumber: plateNumber,
      vehicleType: vehicleType,
      capacity: capacity,
      passengerCount: passengerCount ?? this.passengerCount,
      status: status,
      driverFirstName: driverFirstName,
      driverLastName: driverLastName,
      routeName: routeName,
      latitude: latitude,
      longitude: longitude,
      lastLocationAt: lastLocationAt,
    );
  }

  factory ActiveTrip.fromJson(Map<String, dynamic> json) {
    // Backend parses NUMERIC → number (db.ts), but stay tolerant of strings.
    double? toDouble(dynamic v) =>
        v == null ? null : (v is num ? v.toDouble() : double.tryParse('$v'));
    int toInt(dynamic v) =>
        v == null ? 0 : (v is num ? v.toInt() : int.tryParse('$v') ?? 0);
    DateTime? toDate(dynamic v) =>
        v == null ? null : DateTime.tryParse(v as String);

    return ActiveTrip(
      tripId: json['trip_id'] as String,
      plateNumber: (json['plate_number'] as String?) ?? '—',
      vehicleType: (json['vehicle_type'] as String?) ?? 'bus',
      capacity: toInt(json['capacity']),
      passengerCount: toInt(json['passenger_count']),
      status: (json['status'] as String?) ?? 'active',
      driverFirstName: (json['driver_first_name'] as String?) ?? '',
      driverLastName: (json['driver_last_name'] as String?) ?? '',
      routeName: json['route_name'] as String?,
      latitude: toDouble(json['latitude']),
      longitude: toDouble(json['longitude']),
      lastLocationAt: toDate(json['last_location_at']),
    );
  }
}

/// Reads live tracking data from the backend. Kept thin — the realtime position
/// stream itself comes over Socket.io in [LiveMapScreen]; this only fetches the
/// initial roster of active shuttles.
class TrackingRepository {
  TrackingRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  /// The shuttles currently on the move. Requires the student's JWT.
  Future<List<ActiveTrip>> activeTrips(String token) async {
    final data = await _api.getList(ApiRoutes.trackingActive, token: token);
    return data
        .whereType<Map<String, dynamic>>()
        .map(ActiveTrip.fromJson)
        .toList();
  }
}
