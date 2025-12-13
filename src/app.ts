import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { errorHandler } from "./middleware/error-handler";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
import paymentRoutes from "./routes/payment.route";
import { utils } from "./utils";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://196.201.214.200",
      "http://196.201.214.206",
      "http://196.201.213.114",
      "http://196.201.214.207",
      "http://196.201.214.208",
      "http://196.201.213.44",
      "http://196.201.212.127",
      "http://196.201.212.138",
      "http://196.201.212.129",
      "http://196.201.212.136",
      "http://196.201.212.74",
      "http://196.201.212.69",
      `${process.env.NODE_ENV === "dev" ? "http://localhost:3000" : process.env.APP_URL}`,
    ],
    credentials: true,
  }),
);

// routes
app.get(
  "/health",
  utils.tryCatchBlock(async (req, res) => {
    await utils.healthCheck();
    return res.status(200).send({
      message: "Health check endpoint success.",
    });
  }),
);
app.use("/v1/pay", paymentRoutes);

// errorHandler
app.use(errorHandler as unknown as express.ErrorRequestHandler);

export default app;
