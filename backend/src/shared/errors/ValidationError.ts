import { AppError } from './AppError';

export interface ValidationErrorDetail {
    field: string;
    constraints: string[];
}

/** Thrown by validate.middleware.ts when a request body fails its class-validator DTO checks. */
export class ValidationError extends AppError {
    details: ValidationErrorDetail[];

    constructor(details: ValidationErrorDetail[]) {
        super(422, 'Validation failed');
        this.name = 'ValidationError';
        this.details = details;
    }
}
