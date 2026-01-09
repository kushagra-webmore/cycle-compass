export class HttpError extends Error {
    status;
    details;
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}
//# sourceMappingURL=http-error.js.map