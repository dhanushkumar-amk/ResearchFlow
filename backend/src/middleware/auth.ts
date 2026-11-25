import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { config } from '../config';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  let token = '';
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({ error: 'No token provided. Please login.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
  }
}
