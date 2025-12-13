"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(message, errorLog, statusCode) {
        super(message); // User-facing generic message
        this.statusCode = statusCode;
        this.errorLog = errorLog; // Internal detailed error
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app.error.js.map