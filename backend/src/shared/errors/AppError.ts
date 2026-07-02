/** Base class for any error that should map to a specific HTTP status code. */
export class AppError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}
