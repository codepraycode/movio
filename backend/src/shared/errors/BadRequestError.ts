import { AppError } from './AppError';

export class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(400, message);
        this.name = 'BadRequestError';
    }
}
