import '../../../core/config/env.dart';
import '../../../core/network/api_client.dart';

/// One stop on a route, in board order. Coordinates exist in the payload but
/// the info screen only needs names; keep them anyway for a future map view.
class TransitStop {
  const TransitStop({required this.name, this.lat, this.lng});

  final String name;
  final double? lat;
  final double? lng;

  factory TransitStop.fromJson(Map<String, dynamic> json) {
    double? toD(dynamic v) => v is num ? v.toDouble() : double.tryParse('$v');
    return TransitStop(
      name: (json['name'] as String?) ?? 'Stop',
      lat: toD(json['lat']),
      lng: toD(json['lng']),
    );
  }
}

/// A campus shuttle route as created by admins (FE-7): a name plus its stops.
class TransitRoute {
  const TransitRoute({
    required this.routeId,
    required this.routeName,
    required this.stops,
  });

  final String routeId;
  final String routeName;
  final List<TransitStop> stops;

  factory TransitRoute.fromJson(Map<String, dynamic> json) {
    final rawStops = json['stops'];
    return TransitRoute(
      routeId: json['route_id'] as String,
      routeName: (json['route_name'] as String?) ?? 'Route',
      stops: rawStops is List
          ? rawStops
              .whereType<Map<String, dynamic>>()
              .map(TransitStop.fromJson)
              .toList()
          : const [],
    );
  }
}

/// Reads active routes from `GET /api/v1/routes` (MOB-8/PSD-158).
class RoutesRepository {
  RoutesRepository({ApiClient? api}) : _api = api ?? ApiClient();

  final ApiClient _api;

  Future<List<TransitRoute>> activeRoutes(String token) async {
    final data = await _api.getList(ApiRoutes.routes, token: token);
    return data
        .whereType<Map<String, dynamic>>()
        .map(TransitRoute.fromJson)
        .toList();
  }
}
