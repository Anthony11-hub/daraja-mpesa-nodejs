export class AppError extends Error {
  statusCode: number;
  errorLog: string;

  constructor(message: string, errorLog: string, statusCode: number) {
    super(message); // User-facing generic message
    this.statusCode = statusCode;
    this.errorLog = errorLog; // Internal detailed error
  }
}
