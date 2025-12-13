import { Prisma } from "../generated/prisma/client";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../error/app.error";
import { ValidationError } from "../error/validation.error";
import { utils } from "../utils";

const logError = (error: Error, req: Request, type: string) => {
  utils.logger.error({
    level: "error",
    message: `${type} Error: ${
      error instanceof AppError || error instanceof ValidationError
        ? error.errorLog
        : error.message
    }`,
    context: {
      route: req.originalUrl,
      method: req.method,
      body: req.body,
    },
  });
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof ValidationError) {
    logError(error, req, "Validation");
    return res.status(400).json({ message: error.message });
  }

  if (error instanceof AppError) {
    logError(error, req, "App");
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
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
