import type { Request, Response, NextFunction } from 'express';
import * as usersModel from './users.model';
import { sendSuccess } from '../../shared/utils/ApiResponse';
import { BadRequestError } from '../../shared/errors';
import { USER_ROLES } from '../../types';
import type { UserRole } from '../../types';

/**
 * GET /api/v1/admin/users?role=driver
 * Admin JWT required. role is optional - omit it to list every user.
 */
export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;

    if (role && !USER_ROLES.includes(role as UserRole)) {
        next(new BadRequestError(`Invalid role. Must be one of: ${USER_ROLES.join(', ')}`));
        return;
    }

    try {
        const users = await usersModel.listUsersByRole(role as UserRole | undefined);
        sendSuccess(res, users, 'Users retrieved');
    } catch (err) {
        next(err);
    }
}
