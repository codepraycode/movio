import { query } from '../../config/db';
import type { UserRole, Vehicle, VehicleType } from '../../types';
import type { VehicleWithDriver } from './vehicles.types';

export async function listVehiclesWithDriver(): Promise<VehicleWithDriver[]> {
    const result = await query<VehicleWithDriver>(`
        SELECT v.*, u.first_name AS driver_first_name, u.last_name AS driver_last_name
        FROM vehicles v
        LEFT JOIN users u ON u.user_id = v.assigned_driver_id
        ORDER BY v.plate_number
    `);
    return result.rows;
}

export async function findVehicleWithDriverById(vehicleId: string): Promise<VehicleWithDriver | undefined> {
    const result = await query<VehicleWithDriver>(
        `SELECT v.*, u.first_name AS driver_first_name, u.last_name AS driver_last_name
         FROM vehicles v
         LEFT JOIN users u ON u.user_id = v.assigned_driver_id
         WHERE v.vehicle_id = $1`,
        [vehicleId]
    );
    return result.rows[0];
}

export async function findUserRole(userId: string): Promise<UserRole | undefined> {
    const result = await query<{ role: UserRole }>('SELECT role FROM users WHERE user_id = $1', [userId]);
    return result.rows[0]?.role;
}

export async function assignDriver(vehicleId: string, driverId: string | null): Promise<boolean> {
    const result = await query(`UPDATE vehicles SET assigned_driver_id = $1 WHERE vehicle_id = $2`, [
        driverId,
        vehicleId,
    ]);
    return (result.rowCount ?? 0) > 0;
}

export async function insertVehicle(
    plateNumber: string,
    vehicleType: VehicleType,
    capacity: number,
    isActive: boolean
): Promise<Vehicle> {
    const result = await query<Vehicle>(
        `INSERT INTO vehicles (plate_number, vehicle_type, capacity, is_active)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [plateNumber, vehicleType, capacity, isActive]
    );
    return result.rows[0];
}

export interface VehiclePatch {
    plate_number?: string;
    vehicle_type?: VehicleType;
    capacity?: number;
    is_active?: boolean;
}

export async function updateVehicle(vehicleId: string, patch: VehiclePatch): Promise<boolean> {
    const result = await query(
        `UPDATE vehicles SET
            plate_number = COALESCE($1, plate_number),
            vehicle_type = COALESCE($2, vehicle_type),
            capacity = COALESCE($3, capacity),
            is_active = COALESCE($4, is_active)
         WHERE vehicle_id = $5`,
        [
            patch.plate_number ?? null,
            patch.vehicle_type ?? null,
            patch.capacity ?? null,
            patch.is_active ?? null,
            vehicleId,
        ]
    );
    return (result.rowCount ?? 0) > 0;
}
