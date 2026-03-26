import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/postgres';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'researchflow_secret_key_change_in_prod';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email and password are required.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  try {
    // Check if email already exists
    const existing = await query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, name, email, created_at',
      [name.trim(), email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user.user_id, name: user.name, email: user.email, createdAt: user.created_at },
    });
  } catch (err: any) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const result = await query(
      'SELECT user_id, name, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const user = result.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.user_id, name: user.name, email: user.email },
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /api/auth/me  — returns current user info (requires token)
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT user_id, name, email, created_at FROM users WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const user = result.rows[0];
    res.json({ id: user.user_id, name: user.name, email: user.email, createdAt: user.created_at });
  } catch (err: any) {
    console.error('[Auth] Me error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
