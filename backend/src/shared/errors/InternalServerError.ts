import { AppError } from './AppError';

export class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(500, message);
        this.name = 'InternalServerError';
    }
}
