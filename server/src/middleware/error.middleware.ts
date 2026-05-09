import type { ErrorRequestHandler, RequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';
import { isProduction } from '../config/env';
import { AppError } from '../utils/AppError';

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Something went wrong.';
  let details: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed.';
    details = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (error instanceof TokenExpiredError) {
    statusCode = 401;
    message = 'Your session has expired. Please login again.';
  } else if (error instanceof JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid session. Please login again.';
  } else if ((error as MongoServerError).code === 11000) {
    statusCode = 409;
    const duplicateFields = Object.keys((error as MongoServerError).keyValue || {});
    message = `${duplicateFields.join(', ') || 'Value'} already exists.`;
  }

  if (!isProduction && error instanceof Error) {
    details = details || error.stack;
    console.error(error);
  }

  const response: {
    success: boolean;
    message: string;
    details?: unknown;
  } = {
    success: false,
    message,
  };

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};
