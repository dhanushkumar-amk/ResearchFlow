import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { config } from './config';
import researchRouter from './routes/research';

const app = express();
const port = config.port;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/research', researchRouter);

app.get('/', (req: Request, res: Response) => {
  res.send('Server running');
});

app.listen(port, () => {
  console.log(`➡️  Server running on port ${port}`);
});
