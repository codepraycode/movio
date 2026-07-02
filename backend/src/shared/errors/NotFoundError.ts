import { AppError } from './AppError';

export class NotFoundError extends AppError {
    constructor(message = 'Not found') {
        super(404, message);
        this.name = 'NotFoundError';
    }
}
