"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const client_1 = require("../generated/prisma/client");
const app_error_1 = require("../error/app.error");
const validation_error_1 = require("../error/validation.error");
const utils_1 = require("../utils");
const logError = (error, req, type) => {
    utils_1.utils.logger.error({
        level: "error",
        message: `${type} Error: ${error instanceof app_error_1.AppError || error instanceof validation_error_1.ValidationError
            ? error.errorLog
            : error.message}`,
        context: {
            route: req.originalUrl,
            method: req.method,
            body: req.body,
        },
    });
};
const errorHandler = (error, req, res, next) => {
    if (error instanceof validation_error_1.ValidationError) {
        logError(error, req, "Validation");
        return res.status(400).json({ message: error.message });
    }
    if (error instanceof app_error_1.AppError) {
        logError(error, req, "App");
        return res.status(error.statusCode).json({ message: error.message });
    }
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        logError(error, req, "Prisma");
        let errorMessage;
        switch (error.code) {
            case "P2002": // Unique constraint violation
                errorMessage = "A record with this information already exists.";
                break;
            case "P2025": // Record not found
                errorMessage = "The requested record could not be found.";
                break;
            default:
                errorMessage = "An unexpected database error occurred.";
                break;
        }
        return res.status(409).json({ message: errorMessage });
    }
    // handle unknown errorMessage
    logError(error, req, "Unknown");
    return res.status(500).json({
        message: "Internal server error",
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error-handler.js.map