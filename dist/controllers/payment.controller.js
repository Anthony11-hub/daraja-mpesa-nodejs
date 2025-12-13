"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stkQuery = exports.callback = exports.stkPush = void 0;
const db_1 = require("../config/db");
const axios_1 = __importDefault(require("axios"));
const validation_error_1 = require("../error/validation.error");
const app_error_1 = require("../error/app.error");
const utils_1 = require("../utils");
// stk push
const stkPush = async (req, res, next) => {
    const { phone, amount } = req.body;
    if (!phone || typeof phone !== "string") {
        throw new validation_error_1.ValidationError("Invalid phone number", "Invalid phone number");
    }
    if (!amount || typeof amount !== "number" || amount <= 0) {
        throw new validation_error_1.ValidationError("Invalid amount", "Invalid amount");
    }
    const date = new Date();
    const timestamp = date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);
    const config = {
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${req.token}`,
        },
    };
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    if (!shortcode || !passkey) {
        throw new app_error_1.AppError("Payment configuration error", "Shortcode or passkey not provided", 500);
    }
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");
    const normalizedPhone = phone.startsWith("0")
        ? `254${phone.slice(1)}`
        : phone;
    if (!/^2547\d{8}$/.test(normalizedPhone)) {
        throw new validation_error_1.ValidationError("Invalid phone format", "Phone format provided is invalid");
    }
    const body = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: `254${normalizedPhone}`,
        PartyB: shortcode,
        PhoneNumber: `254${phone.substring(1)}`,
        CallBackURL: `${process.env.MPESA_CALLBACK_URL}/${process.env.MPESA_CALLBACK_SECRET_KEY}`,
        AccountReference: `254${phone.substring(1)}`,
        TransactionDesc: "sale purchase",
    };
    let response;
    try {
        response = await axios_1.default.post("https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest", body, config);
    }
    catch (err) {
        const mpesaMessage = err.response?.data?.errorMessage ||
            err.response?.data?.ResponseDescription ||
            "Failed to initiate payment";
        throw new app_error_1.AppError(mpesaMessage, mpesaMessage, 502);
    }
    const { CheckoutRequestID } = response.data;
    const paymentRef = await utils_1.utils.generateRef("transactions");
    await db_1.prisma.transaction.create({
        data: {
            amount,
            phone,
            checkoutRequestId: CheckoutRequestID,
            paymentRef,
        },
    });
    return res.status(200).json({
        message: "STK push initiated",
        checkoutRequestId: CheckoutRequestID,
    });
};
exports.stkPush = stkPush;
// callback
const callback = async (req, res, next) => {
    try {
        const callbackData = req.body;
        // check security key
        const { securityKey } = req.params;
        if (securityKey !== process.env.MPESA_CALLBACK_SECRET_KEY) {
            return res.json({ status: "ok" });
        }
        const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;
        const mpesaReference = callbackData.Body.stkCallback.CallbackMetadata.Item[1].Value;
        const resultCode = callbackData.Body.stkCallback.ResultCode;
        // check if payment exists in db - status should be "pending"
        const transaction = await db_1.prisma.transaction.findFirst({
            where: { checkoutRequestId, status: "pending" },
        });
        // The transaction doesn't exist in our db
        if (!transaction) {
            return res.json({ status: "ok" });
        }
        // check the result code
        if (resultCode !== 0) {
            // Our payment has failed
            await db_1.prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: "failed",
                },
            });
            return res.json({ status: "ok" });
        }
        // update the payment mpesaRef and status to "complete"
        await db_1.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
                mpesaRef: mpesaReference,
                status: "complete",
            },
        });
        return res.json({ status: "ok" });
    }
    catch (error) {
        return res.json({ status: "ok" });
    }
};
exports.callback = callback;
// transaction query
const stkQuery = async (req, res, next) => {
    const { checkoutRequestId } = req.body;
    if (!checkoutRequestId || typeof checkoutRequestId !== "string") {
        throw new validation_error_1.ValidationError("Invalid checkoutRequestId", "Invalid checkoutRequestId");
    }
    const date = new Date();
    const timestamp = date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);
    const config = {
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${req.token}`,
        },
    };
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    if (!shortcode || !passkey) {
        throw new app_error_1.AppError("Payment configuration error", "Shortcode or passkey not provided", 500);
    }
    const password = Buffer.from(shortcode + passkey + timestamp).toString("base64");
    const body = {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
    };
    let response;
    try {
        response = await axios_1.default.post("https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query", body, config);
        console.log(response);
    }
    catch (err) {
        const mpesaMessage = err.response?.data?.errorMessage ||
            err.response?.data?.ResponseDescription ||
            "Failed to get transaction status";
        throw new app_error_1.AppError(mpesaMessage, mpesaMessage, 502);
    }
    return res.status(200).json({
        message: response.data.ResultDesc,
        code: response.data.ResultCode,
    });
};
exports.stkQuery = stkQuery;
// b2c
//# sourceMappingURL=payment.controller.js.map