import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { config } from './config';
import researchRouter from './routes/research';
import documentsRouter from './routes/documents';

const app = express();
const port = config.port;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/research', researchRouter);
app.use('/api/documents', documentsRouter);

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

