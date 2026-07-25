// /src/utils/AppError.ts

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errorCode: string = "UNKNOWN_ERROR",
  ) {
    super(message);

    this.name = "AppError";

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
