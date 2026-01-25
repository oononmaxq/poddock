import type { Context } from 'hono';
import type { AppEnv } from '../types';
import { ZodError } from 'zod';

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; reason: string }>;
  };
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Array<{ field: string; reason: string }>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function isAppError(error: unknown): error is AppError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'statusCode' in error &&
    'code' in error &&
    'message' in error
  );
}

export function handleError(error: Error, c: Context<AppEnv>) {
  if (isAppError(error)) {
    const body: ApiError = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
    return c.json(body, error.statusCode as 400 | 401 | 403 | 404 | 409 | 422 | 500);
  }

  if (error instanceof ZodError) {
    const body: ApiError = {
      error: {
        code: 'validation_error',
        message: 'Invalid request',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          reason: e.message,
        })),
      },
    };
    return c.json(body, 400);
  }

  console.error('Unexpected error:', error);
  const body: ApiError = {
    error: {
      code: 'internal_error',
      message: 'An unexpected error occurred',
    },
  };
  return c.json(body, 500);
}
