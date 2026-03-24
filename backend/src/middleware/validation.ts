import { Request, Response, NextFunction } from 'express';

/**
 * Phase 36: Request Validation & Sanitization
 * 1. Empty query -> 400
 * 2. Query > 1000 chars -> 400 "Query too long"
 * 3. Sanitization (trim, remove HTML tags)
 */

export const validateResearchQuery = (req: Request, res: Response, next: NextFunction) => {
  let { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Research query is required.' });
  }

  // Sanitization: Trim whitespace
  query = query.trim();

  // Sanitization: Remove HTML tags using Regex (simple)
  query = query.replace(/<[^>]*>?/gm, '');

  if (query.length === 0) {
    return res.status(400).json({ error: 'Research query cannot be empty.' });
  }

  if (query.length > 1000) {
    return res.status(400).json({ error: 'Query too long (max 1000 characters).' });
  }

  // Update request body with sanitized query
  req.body.query = query;
  next();
};
