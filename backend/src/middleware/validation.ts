import { Request, Response, NextFunction } from 'express';

/**
 * Phase 36: Request Validation & Sanitization
 * 1. Empty query -> 400
 * 2. Query > 1000 chars -> 400 "Query too long"
 * 3. Sanitization (trim, remove HTML tags)
 */

/**
 * Helper to check for prompt injections, instruction overrides, or malicious searches.
 * Returns an error string if a violation is found, otherwise null.
 */
export function checkGuardrailViolation(query: string): string | null {
  const guardrailBlacklist = [
    /ignore[\s-_]*previous[\s-_]*instructions?/i,
    /ignore[\s-_]*all[\s-_]*instructions?/i,
    /disregard[\s-_]*previous[\s-_]*instructions?/i,
    /you[\s-_]*are[\s-_]*now[\s-_]*a/i,
    /system[\s-_]*prompt[\s-_]*override/i,
    /reveal[\s-_]*system[\s-_]*prompt/i,
    /bypass[\s-_]*guardrails/i,
    /jailbreak/i,
    /how[\s-_]*to[\s-_]*build[\s-_]*(?:a\s*)?bomb/i,
    /create[\s-_]*(?:a\s*)?malware/i,
    /write[\s-_]*(?:a\s*)?ransomware/i,
    /how[\s-_]*to[\s-_]*hack/i,
    /sql[\s-_]*injection/i,
    /cross[\s-_]*site[\s-_]*scripting/i,
    /bypass[\s-_]*password/i,
    // Catch instruction erasures / resets with typo support:
    /previous[\s-_]*inst?r[a-z]*[\s-_]*(?:erase|forget|reset|clear|delete|override)/i,
    /(?:erase|forget|reset|clear|delete|override)[\s-_]*previous[\s-_]*inst?r[a-z]*/i,
    /(?:erase|forget|reset|clear|delete|override)[\s-_]*(?:the\s*)?inst?r[a-z]*/i,
    /(?:erase|forget|reset|clear|delete|override)[\s-_]*instructions?/i,
    /inst?r[a-z]*[\s-_]*erase/i,
    /system[\s-_]*(?:erase|forget|reset|clear|override)/i
  ];

  const hasViolation = guardrailBlacklist.some(pattern => pattern.test(query));
  if (hasViolation) {
    return 'Security Warning: Unsafe instruction-override (jailbreak) or policy violation query detected. Prompt blocked by guardrails.';
  }
  return null;
}

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

  // Guardrail security check
  const violationError = checkGuardrailViolation(query);
  if (violationError) {
    console.warn(`🛡️ [Guardrails] Security block on research query: "${query}"`);
    return res.status(400).json({ error: violationError });
  }

  if (query.length > 1000) {
    return res.status(400).json({ error: 'Query too long (max 1000 characters).' });
  }

  // Update request body with sanitized query
  req.body.query = query;
  next();
};
