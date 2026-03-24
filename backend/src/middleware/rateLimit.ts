import rateLimit from 'express-rate-limit';

/**
 * Phase 36: Rate Limiting
 * 1. Research Endpoint: max 10 requests / 1 minute.
 * 2. Document Upload: max 5 requests / 1 hour.
 */

export const researchRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many research requests. Please try again after 1 minute.',
  },
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 uploads per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Upload limit reached (5 per hour). Please try again later.',
  },
});
