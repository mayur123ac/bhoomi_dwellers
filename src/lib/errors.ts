// src/lib/errors.ts
// ─────────────────────────────────────────────────────────────────────────────
// Custom error types for the SaaS CRM platform.
//
// Using typed errors instead of plain `throw new Error(...)` gives us:
//   - Type-safe catch blocks
//   - Consistent HTTP status mapping
//   - Easy API error handler pattern
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Thrown when a request attempts to access data belonging to a different
 * organization. This is the most critical security boundary in a multi-tenant
 * system — any catch of this error should be logged and the request rejected
 * with 403 Forbidden.
 */
export class TenantViolationError extends Error {
  readonly statusCode = 403;

  constructor(message = "Access denied: cross-tenant data access is not permitted.") {
    super(message);
    this.name = "TenantViolationError";
    // Maintains proper prototype chain in TypeScript compiled output
    Object.setPrototypeOf(this, TenantViolationError.prototype);
  }
}

/**
 * Thrown when a request is not authenticated (no session / invalid session).
 * Maps to HTTP 401.
 */
export class UnauthorizedError extends Error {
  readonly statusCode = 401;

  constructor(message = "Unauthorized: please log in to continue.") {
    super(message);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Thrown when a user is authenticated but lacks the required role or permission.
 * Maps to HTTP 403.
 */
export class ForbiddenError extends Error {
  readonly statusCode = 403;

  constructor(message = "Forbidden: you do not have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Thrown when a requested resource does not exist within the current
 * tenant's scope. Maps to HTTP 404.
 */
export class NotFoundError extends Error {
  readonly statusCode = 404;

  constructor(resource = "Resource") {
    super(`${resource} not found.`);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Thrown for validation failures on incoming request bodies.
 * Maps to HTTP 400.
 */
export class ValidationError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// ── Helper: map a custom error to its HTTP status code ───────────────────────
type KnownError =
  | TenantViolationError
  | UnauthorizedError
  | ForbiddenError
  | NotFoundError
  | ValidationError;

export function isKnownError(err: unknown): err is KnownError {
  return (
    err instanceof TenantViolationError ||
    err instanceof UnauthorizedError ||
    err instanceof ForbiddenError ||
    err instanceof NotFoundError ||
    err instanceof ValidationError
  );
}

export function errorToStatus(err: KnownError): number {
  return err.statusCode;
}
