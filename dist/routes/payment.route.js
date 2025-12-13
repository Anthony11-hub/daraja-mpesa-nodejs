"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const utils_1 = require("../utils");
const mpesaToken_1 = require("../middleware/mpesaToken");
const payment_controller_1 = require("../controllers/payment.controller");
const router = (0, express_1.Router)();
// Create Payment
router.post("/checkout", mpesaToken_1.generateMpesaToken, utils_1.utils.tryCatchBlock(payment_controller_1.stkPush));
// Transaction Query Status
router.post("/status", mpesaToken_1.generateMpesaToken, utils_1.utils.tryCatchBlock(payment_controller_1.stkQuery));
// callback
router.post("/callback/:securityKey", payment_controller_1.callback);
exports.default = router;
//# sourceMappingURL=payment.route.js.map