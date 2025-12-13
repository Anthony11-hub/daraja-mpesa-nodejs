import axios from "axios";
import { RequestHandler } from "express";
import { AppError } from "../error/app.error";

export const generateMpesaToken: RequestHandler = async (req, res, next) => {
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

    const response = await axios.get(
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      config,
    );

    const token = response.data.access_token;

    req.token = token;

    next();
  } catch (error) {
    throw new AppError(
      "Internal server error",
      `An error occurred while generating the token: ${error}`,
      500,
    );
  }
};
