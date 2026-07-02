import { AppError } from './AppError';

export class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(409, message);
        this.name = 'ConflictError';
    }
}
