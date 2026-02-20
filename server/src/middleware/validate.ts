// ─────────────────────────────────────────────────────────────────────────────
// Guardian AI – Request Validation Middleware (Zod)
// ─────────────────────────────────────────────────────────────────────────────
import type { RequestHandler } from 'express';
import { z } from 'zod';

/**
 * Creates a middleware that validates req.body against the given Zod schema.
 * On failure, responds 422 with field-level errors.
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        error: true,
        message: 'Validation error',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data as z.infer<T>;
    next();
  };
}

/**
 * Creates a middleware that validates req.query against the given Zod schema.
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(422).json({
        error: true,
        message: 'Query validation error',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    (req as unknown as { validatedQuery: z.infer<T> }).validatedQuery = result.data as z.infer<T>;
    next();
  };
}

// ─── Shared Zod schemas ───────────────────────────────────────────────────────

export const urlSchema = z
  .string()
  .min(3)
  .max(2048)
  .refine(v => {
    try { new URL(v.startsWith('http') ? v : `http://${v}`); return true; } catch { return false; }
  }, 'Invalid URL format');

export const scanUrlBodySchema = z.object({
  url: urlSchema,
  options: z.object({
    skipMl:          z.boolean().optional(),
    skipLlm:         z.boolean().optional(),
    skipThreatIntel: z.boolean().optional(),
    skipBlockchain:  z.boolean().optional(),
  }).optional(),
});

export const batchScanBodySchema = z.object({
  urls: z.array(urlSchema).min(1).max(10),
  options: scanUrlBodySchema.shape.options,
});

export const emailBodySchema = z.object({
  subject:        z.string().min(0).max(500),
  body:           z.string().min(1).max(50_000),
  sender:         z.string().max(500),
  recipientCount: z.number().int().positive().optional(),
  attachments:    z.array(z.string().max(255)).max(20).optional(),
  extractedUrls:  z.array(z.string().max(2048)).max(20).optional(),
});

export const paginationSchema = z.object({
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
