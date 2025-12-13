"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMpesaToken = void 0;
const axios_1 = __importDefault(require("axios"));
const app_error_1 = require("../error/app.error");
const generateMpesaToken = async (req, res, next) => {
    try {
        const key = process.env.MPESA_CONSUMER_KEY;
        const secret = process.env.MPESA_CONSUMER_SECRET;
        const auth = Buffer.from(`${key}:${secret}`).toString("base64");
        const config = {
            headers: {
                Accept: "application/json",
                Authorization: `Basic ${auth}`,
            },
        };
        const response = await axios_1.default.get("https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", config);
        const token = response.data.access_token;
        req.token = token;
        next();
    }
    catch (error) {
        throw new app_error_1.AppError("Internal server error", `An error occurred while generating the token: ${error}`, 500);
    }
};
exports.generateMpesaToken = generateMpesaToken;
//# sourceMappingURL=mpesaToken.js.map