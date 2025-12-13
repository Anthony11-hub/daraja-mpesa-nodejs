import { Router } from "express";
import { utils } from "../utils";
import { generateMpesaToken } from "../middleware/mpesaToken";
import { callback, stkPush, stkQuery } from "../controllers/payment.controller";

const router = Router();
// Create Payment
router.post("/checkout", generateMpesaToken, utils.tryCatchBlock(stkPush));
// Transaction Query Status
router.post("/status", generateMpesaToken, utils.tryCatchBlock(stkQuery));
// callback
router.post("/callback/:securityKey", callback);

export default router;
