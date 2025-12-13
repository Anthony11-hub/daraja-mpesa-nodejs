import { prisma } from "../config/db";
import { RequestHandler } from "express";
import axios from "axios";
import { ValidationError } from "../error/validation.error";
import { AppError } from "../error/app.error";
import { utils } from "../utils";

// stk push
export const stkPush: RequestHandler = async (req, res, next) => {
  const { phone, amount } = req.body;

  if (!phone || typeof phone !== "string") {
    throw new ValidationError("Invalid phone number", "Invalid phone number");
  }

  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new ValidationError("Invalid amount", "Invalid amount");
  }

  const date = new Date();

  const timestamp =
    date.getFullYear() +
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
    throw new AppError(
      "Payment configuration error",
      "Shortcode or passkey not provided",
      500,
    );
  }

  const password = Buffer.from(shortcode + passkey + timestamp).toString(
    "base64",
  );

  const normalizedPhone = phone.startsWith("0")
    ? `254${phone.slice(1)}`
    : phone;

  if (!/^2547\d{8}$/.test(normalizedPhone)) {
    throw new ValidationError(
      "Invalid phone format",
      "Phone format provided is invalid",
    );
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
    response = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      body,
      config,
    );
  } catch (err: any) {
    const mpesaMessage =
      err.response?.data?.errorMessage ||
      err.response?.data?.ResponseDescription ||
      "Failed to initiate payment";

    throw new AppError(mpesaMessage, mpesaMessage, 502);
  }

  const { CheckoutRequestID } = response.data;

  const paymentRef = await utils.generateRef("transactions");

  await prisma.transaction.create({
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
// callback
export const callback: RequestHandler = async (req, res, next) => {
  try {
    const callbackData = req.body;
    // check security key
    const { securityKey } = req.params;

    if (securityKey !== process.env.MPESA_CALLBACK_SECRET_KEY) {
      return res.json({ status: "ok" });
    }

    const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;
    const mpesaReference =
      callbackData.Body.stkCallback.CallbackMetadata.Item[1].Value;
    const resultCode = callbackData.Body.stkCallback.ResultCode;

    // check if payment exists in db - status should be "pending"
    const transaction = await prisma.transaction.findFirst({
      where: { checkoutRequestId, status: "pending" },
    });

    // The transaction doesn't exist in our db
    if (!transaction) {
      return res.json({ status: "ok" });
    }

    // check the result code
    if (resultCode !== 0) {
      // Our payment has failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "failed",
        },
      });
      return res.json({ status: "ok" });
    }

    // update the payment mpesaRef and status to "complete"
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        mpesaRef: mpesaReference,
        status: "complete",
      },
    });

    return res.json({ status: "ok" });
  } catch (error) {
    return res.json({ status: "ok" });
  }
};
// transaction query
export const stkQuery: RequestHandler = async (req, res, next) => {
  const { checkoutRequestId } = req.body;

  if (!checkoutRequestId || typeof checkoutRequestId !== "string") {
    throw new ValidationError(
      "Invalid checkoutRequestId",
      "Invalid checkoutRequestId",
    );
  }

  const date = new Date();

  const timestamp =
    date.getFullYear() +
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
    throw new AppError(
      "Payment configuration error",
      "Shortcode or passkey not provided",
      500,
    );
  }

  const password = Buffer.from(shortcode + passkey + timestamp).toString(
    "base64",
  );

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  let response;

  try {
    response = await axios.post(
      "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      body,
      config,
    );
    console.log(response);
  } catch (err: any) {
    const mpesaMessage =
      err.response?.data?.errorMessage ||
      err.response?.data?.ResponseDescription ||
      "Failed to get transaction status";

    throw new AppError(mpesaMessage, mpesaMessage, 502);
  }

  return res.status(200).json({
    message: response.data.ResultDesc,
    code: response.data.ResultCode,
  });
};
// b2c
