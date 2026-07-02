import * as trackingModel from './tracking.model';
import type { LocationUpdateRow, ActiveTripRow } from './tracking.types';

export async function recordLocationUpdate(
    tripId: string,
    latitude: number,
    longitude: number
): Promise<LocationUpdateRow> {
    return trackingModel.insertLocationUpdate(tripId, latitude, longitude);
}

/** What the student app map and admin dashboard both poll/subscribe to. */
export async function getActiveTripsWithLocation(): Promise<ActiveTripRow[]> {
    return trackingModel.findActiveTripsWithLastLocation();
}
