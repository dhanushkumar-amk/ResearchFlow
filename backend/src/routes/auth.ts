import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/postgres';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { setMemory, getMemory, deleteMemory } from '../db/redis';
import { sendEmail } from '../utils/email';

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
    const normalizedEmail = email.toLowerCase().trim();
    // Check if email already exists
    const existing = await query('SELECT user_id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await bcrypt.hash(password, 12);

    // Save registration details to Redis temporarily for 30 minutes
    const tempUser = { name: name.trim(), email: normalizedEmail, passwordHash };
    await setMemory(`temp_user:${normalizedEmail}`, tempUser, 1800);
    // Save OTP to Redis for 10 minutes
    await setMemory(`otp:${normalizedEmail}`, code, 600);

    // Send verification code email
    await sendEmail({
      to: normalizedEmail,
      subject: 'Verify your ResearchMind account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #10b981; font-weight: bold; margin-bottom: 20px;">Welcome to ResearchMind!</h2>
          <p>Thank you for signing up. Please verify your email address by using the 6-digit verification code below:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 20px 0; border-radius: 6px;">
            ${code}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This verification code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({
      message: 'Verification code sent to email.'
    });
  } catch (err: any) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: err.message || 'Server error. Please try again.' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400).json({ error: 'Email and code are required.' });
    return;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Fetch OTP from Redis
    const storedCode = await getMemory(`otp:${normalizedEmail}`);
    if (!storedCode || storedCode !== code.trim()) {
      res.status(400).json({ error: 'Invalid or expired verification code.' });
      return;
    }

    // Fetch temp user data from Redis
    const tempUser = await getMemory(`temp_user:${normalizedEmail}`);
    if (!tempUser) {
      res.status(400).json({ error: 'Registration session expired. Please register again.' });
      return;
    }

    // Insert user into users database
    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, name, email, created_at',
      [tempUser.name, tempUser.email, tempUser.passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // Clean up Redis
    await deleteMemory(`otp:${normalizedEmail}`);
    await deleteMemory(`temp_user:${normalizedEmail}`);

    res.status(201).json({
      message: 'Account verified and created successfully!',
      token,
      user: { id: user.user_id, name: user.name, email: user.email, createdAt: user.created_at }
    });
  } catch (err: any) {
    console.error('[Auth] Verify email error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const tempUser = await getMemory(`temp_user:${normalizedEmail}`);
    if (!tempUser) {
      res.status(400).json({ error: 'Registration session expired. Please register again.' });
      return;
    }

    // Generate new OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await setMemory(`otp:${normalizedEmail}`, code, 600); // 10 minutes

    await sendEmail({
      to: normalizedEmail,
      subject: 'Verify your ResearchMind account (Resent)',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #10b981; font-weight: bold; margin-bottom: 20px;">Verify your email address</h2>
          <p>Use the 6-digit verification code below to complete your registration:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 20px 0; border-radius: 6px;">
            ${code}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'A new verification code has been sent.' });
  } catch (err: any) {
    console.error('[Auth] Resend error:', err);
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists
    const result = await query('SELECT user_id FROM users WHERE email = $1', [normalizedEmail]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No account found with this email address.' });
      return;
    }

    // Generate code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await setMemory(`reset_otp:${normalizedEmail}`, code, 600); // 10 minutes

    await sendEmail({
      to: normalizedEmail,
      subject: 'Reset your ResearchMind password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #10b981; font-weight: bold; margin-bottom: 20px;">Password Reset Request</h2>
          <p>We received a request to reset your password. Use the 6-digit code below to proceed:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 20px 0; border-radius: 6px;">
            ${code}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, you can ignore this email.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'Reset code sent to email.' });
  } catch (err: any) {
    console.error('[Auth] Forgot password error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/verify-reset-code
router.post('/verify-reset-code', async (req: Request, res: Response) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400).json({ error: 'Email and code are required.' });
    return;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const storedCode = await getMemory(`reset_otp:${normalizedEmail}`);

    if (!storedCode || storedCode !== code.trim()) {
      res.status(400).json({ error: 'Invalid or expired verification code.' });
      return;
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await setMemory(`reset_allowed:${normalizedEmail}`, resetToken, 900); // 15 minutes

    // Clean up reset code
    await deleteMemory(`reset_otp:${normalizedEmail}`);

    res.status(200).json({ resetToken });
  } catch (err: any) {
    console.error('[Auth] Verify reset code error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const { email, password, resetToken } = req.body;

  if (!email || !password || !resetToken) {
    res.status(400).json({ error: 'Email, password, and resetToken are required.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const storedToken = await getMemory(`reset_allowed:${normalizedEmail}`);

    if (!storedToken || storedToken !== resetToken) {
      res.status(400).json({ error: 'Session expired or invalid reset token. Please request a new code.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, normalizedEmail]);

    // Clean up reset token
    await deleteMemory(`reset_allowed:${normalizedEmail}`);

    res.status(200).json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err: any) {
    console.error('[Auth] Reset password error:', err);
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
