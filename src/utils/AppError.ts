// utils/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: number,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
