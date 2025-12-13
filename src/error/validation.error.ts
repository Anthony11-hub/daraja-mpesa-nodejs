export class ValidationError extends Error {
  errorLog: string;
  constructor(message: string, errorLog: string) {
    super(message);
    this.name = "ValidationError";
    this.errorLog = errorLog;
  }
}
