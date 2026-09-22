import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/http";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    return res.status(400).json({
      error: issue?.message ?? "Invalid request payload",
      code: "VALIDATION_ERROR",
    });
  }

  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
  }

  console.error("[unhandled]", err);
  return res.status(500).json({ error: "Something went wrong. Try again." });
}
