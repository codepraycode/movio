import type { RequestHandler } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ValidationError as DtoValidationError } from '../errors/ValidationError';

/**
 * Validates req.body against a class-validator DTO before it reaches the
 * controller. On success, req.body is replaced with the validated/transformed
 * DTO instance; on failure, a 422 ValidationError (with per-field details) is
 * passed to the error middleware instead of the route handler ever running.
 */
export function validateDto<T extends object>(DtoClass: new () => T): RequestHandler {
    return (req, _res, next) => {
        const instance = plainToInstance(DtoClass, req.body);

        validate(instance, { whitelist: true }).then((errors) => {
            if (errors.length > 0) {
                const details = errors.map((error) => ({
                    field: error.property,
                    constraints: error.constraints ? Object.values(error.constraints) : [],
                }));
                next(new DtoValidationError(details));
                return;
            }

            req.body = instance;
            next();
        }, next);
    };
}
