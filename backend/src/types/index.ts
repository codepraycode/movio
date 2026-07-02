/**
 * TypeScript interfaces mirroring backend/db/schema.sql, table for table.
 * These describe what `pg` actually returns for a full row (see config/db.ts
 * for the NUMERIC type parser that makes DECIMAL columns come back as
 * `number`, not `string` - pg's own default). Feature-level model/service
 * files should type their query results against these (directly, or via
 * Pick<>/composition for joined queries) instead of `Record<string, unknown>`.
 */

export const USER_ROLES = ['student', 'driver', 'transport_personnel', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
    user_id: string;
    matric_no: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    password_hash: string;
    created_at: Date;
}

export const NFC_CREDENTIAL_TYPES = ['mifare_card', 'hce_phone'] as const;
export type NfcCredentialType = (typeof NFC_CREDENTIAL_TYPES)[number];

export interface NfcCredential {
    credential_id: string;
    user_id: string;
    nfc_uid: string;
    credential_type: NfcCredentialType;
    is_active: boolean;
    registered_at: Date;
}

export const VEHICLE_TYPES = ['bus', 'cab', 'tricycle'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export interface Vehicle {
    vehicle_id: string;
    plate_number: string;
    vehicle_type: VehicleType;
    capacity: number;
    is_active: boolean;
}

export interface RouteStop {
    name: string;
    lat: number;
    lng: number;
}

export interface Route {
    route_id: string;
    route_name: string;
    stops: RouteStop[];
    is_active: boolean;
}

export interface TapTraceDevice {
    device_id: string;
    vehicle_id: string | null;
    sim_number: string | null;
    firmware_version: string | null;
    last_seen: Date | null;
}

export const TRIP_STATUSES = ['active', 'completed', 'cancelled'] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export interface Trip {
    trip_id: string;
    vehicle_id: string;
    driver_id: string;
    route_id: string | null;
    device_id: string | null;
    start_time: Date;
    end_time: Date | null;
    status: TripStatus;
}

export interface LocationUpdate {
    update_id: string;
    trip_id: string;
    latitude: number;
    longitude: number;
    recorded_at: Date;
}

export interface TransitWallet {
    wallet_id: string;
    user_id: string;
    balance_credits: number;
    last_updated: Date;
}

export const CREDIT_TRANSACTION_TYPES = [
    'topup_app',
    'topup_cash',
    'boarding_deduction',
    'redemption',
] as const;
export type CreditTransactionType = (typeof CREDIT_TRANSACTION_TYPES)[number];

export interface CreditTransaction {
    transaction_id: string;
    wallet_id: string;
    amount: number;
    type: CreditTransactionType;
    reference: string | null;
    created_at: Date;
}

export interface BoardingEvent {
    event_id: string;
    trip_id: string;
    student_id: string;
    credential_id: string;
    boarded_at: Date;
    latitude: number | null;
    longitude: number | null;
}

export const COMPLAINT_STATUSES = ['open', 'under_review', 'resolved'] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export interface Complaint {
    complaint_id: string;
    student_id: string;
    trip_id: string | null;
    description: string;
    status: ComplaintStatus;
    created_at: Date;
}
