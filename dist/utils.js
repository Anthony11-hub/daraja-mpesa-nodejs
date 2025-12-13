"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = void 0;
const winston_1 = require("winston");
const db_1 = require("./config/db");
const date_fns_1 = require("date-fns");
const crypto_1 = require("crypto");
const app_error_1 = require("./error/app.error");
// Define the mapping between reference types, Prisma model, field, and format
const REF_TYPE_CONFIG = {
    transactions: {
        model: "transaction",
        field: "paymentRef",
        prefix: "TXN",
        dateFormat: "yyMM",
    },
};
const logger = (0, winston_1.createLogger)({
    transports: [
        new winston_1.transports.File({
            filename: "error.log",
            level: "error",
            format: winston_1.format.combine(winston_1.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.format.json()),
        }),
    ],
});
const tryCatchBlock = (controller) => async (req, res, next) => {
    try {
        await controller(req, res, next);
    }
    catch (error) {
        next(error);
    }
};
const generateRef = async (refType) => {
    const config = REF_TYPE_CONFIG[refType];
    if (!config)
        throw new Error(`Unsupported reference type: ${refType}`);
    const datePart = config.dateFormat
        ? (0, date_fns_1.format)(new Date(), config.dateFormat)
        : (0, date_fns_1.format)(new Date(), "yyyyMMdd");
    const randomHex = (0, crypto_1.randomBytes)(3).toString("hex").toUpperCase();
    // Different types can have unique formats
    const referenceCode = `${config.prefix}${datePart}${randomHex}`;
    // Check uniqueness in DB
    const model = db_1.prisma[config.model];
    const existingCode = await model.findUnique({
        where: { [config.field]: referenceCode },
    });
    if (existingCode) {
        return generateRef(refType); // Retry
    }
    return referenceCode;
};
const healthCheck = async () => {
    try {
        await db_1.prisma.$queryRaw `SELECT 1`;
    }
    catch (e) {
        const errorObj = e instanceof Error ? { e } : { err: String(e) };
        throw new app_error_1.AppError("Internal server error", `Health check failed: ${errorObj}`, 500);
    }
};
exports.utils = {
    logger,
    tryCatchBlock,
    generateRef,
    healthCheck,
};
//# sourceMappingURL=utils.js.map