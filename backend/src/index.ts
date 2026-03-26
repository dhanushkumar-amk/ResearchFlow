import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { config } from './config';
import researchRouter from './routes/research';
import documentsRouter from './routes/documents';
import authRouter from './routes/auth';
import { requireAuth } from './middleware/auth';

const app = express();
const port = config.port;

// Phase 36: Security - Restricted CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    process.env.FRONTEND_URL || '',
  ].filter(Boolean),
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Required for rate limiting (behind proxy check)
app.set('trust proxy', 1);

app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/research', researchRouter);
app.use('/api/documents', requireAuth, documentsRouter);

app.get('/', (req: Request, res: Response) => {
  res.send('Server running');
});

const server = app.listen(port, () => {
  console.log(`✅ [Express] Server successfully bound to port ${port}`);
  console.log('🚀 ResearchFlow Backend is ready for requests.');
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${port} is already in use.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

