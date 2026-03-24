import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { config } from './config';

const app = express();
const port = config.port;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Server running');
});

app.listen(port, () => {
  console.log(`➡️  Server running on port ${port}`);
});
