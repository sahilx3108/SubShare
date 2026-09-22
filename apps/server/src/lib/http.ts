import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string, code?: string) {
    return new ApiError(400, message, code);
  }
  static unauthorized(message = "Authentication required", code?: string) {
    return new ApiError(401, message, code);
  }
  static forbidden(message = "Not allowed", code?: string) {
    return new ApiError(403, message, code);
  }
  static notFound(message = "Not found", code?: string) {
    return new ApiError(404, message, code);
  }
  static conflict(message: string, code?: string) {
    return new ApiError(409, message, code);
  }
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wraps async route handlers so rejections hit the error middleware. */
export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };
}
