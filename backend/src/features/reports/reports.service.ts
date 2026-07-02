import * as reportsModel from './reports.model';
import { BadRequestError } from '../../shared/errors';
import { RIDERSHIP_GROUP_BY_VALUES } from './reports.types';
import type { RidershipByDay, RidershipByRoute, RidershipByVehicle } from './reports.types';

export async function getRidershipReport(
    groupBy?: string
): Promise<RidershipByRoute[] | RidershipByVehicle[] | RidershipByDay[]> {
    const resolvedGroupBy = groupBy ?? 'route';

    if (!RIDERSHIP_GROUP_BY_VALUES.includes(resolvedGroupBy as (typeof RIDERSHIP_GROUP_BY_VALUES)[number])) {
        throw new BadRequestError(`Invalid groupBy. Must be one of: ${RIDERSHIP_GROUP_BY_VALUES.join(', ')}`);
    }

    switch (resolvedGroupBy) {
        case 'vehicle':
            return reportsModel.ridershipByVehicle();
        case 'day':
            return reportsModel.ridershipByDay();
        default:
            return reportsModel.ridershipByRoute();
    }
}
