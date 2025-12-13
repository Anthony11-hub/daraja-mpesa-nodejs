import { RequestHandler } from "express";
import { createLogger, transports, format } from "winston";
import { prisma } from "./config/db";
import { format as dateFormat } from "date-fns";
import { randomBytes } from "crypto";
import { AppError } from "./error/app.error";

type RefType = "transactions";

// Define the mapping between reference types, Prisma model, field, and format
const REF_TYPE_CONFIG: Record<
  RefType,
  {
    model: keyof typeof prisma;
    field: string;
    prefix: string;
    dateFormat?: string;
  }
> = {
  transactions: {
    model: "transaction",
    field: "paymentRef",
    prefix: "TXN",
    dateFormat: "yyMM",
  },
};

const logger = createLogger({
  transports: [
    new transports.File({
      filename: "error.log",
      level: "error",
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.json(),
      ),
    }),
  ],
});

const tryCatchBlock =
  (controller: RequestHandler): RequestHandler =>
  async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };

const generateRef = async (refType: RefType): Promise<string> => {
  const config = REF_TYPE_CONFIG[refType];
  if (!config) throw new Error(`Unsupported reference type: ${refType}`);

  const datePart = config.dateFormat
    ? dateFormat(new Date(), config.dateFormat)
    : dateFormat(new Date(), "yyyyMMdd");

  const randomHex = randomBytes(3).toString("hex").toUpperCase();

  // Different types can have unique formats
  const referenceCode = `${config.prefix}${datePart}${randomHex}`;

  // Check uniqueness in DB
  const model = prisma[config.model] as any;
  const existingCode = await model.findUnique({
    where: { [config.field]: referenceCode },
  });

  if (existingCode) {
    return generateRef(refType); // Retry
  }

  return referenceCode;
};

const healthCheck = async (): Promise<void> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e: unknown) {
    const errorObj = e instanceof Error ? { e } : { err: String(e) };
    throw new AppError(
      "Internal server error",
      `Health check failed: ${errorObj}`,
      500,
    );
  }
};

export const utils = {
  logger,
  tryCatchBlock,
  generateRef,
  healthCheck,
};
