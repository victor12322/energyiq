import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { tariffsRouter } from './routes/tariffs';
import { machinesRouter } from './routes/machines';
import { billsRouter } from './routes/bills';
import { readingsRouter } from './routes/readings';
import { analysisRouter } from './routes/analysis';
import { reportsRouter } from './routes/reports';
import { adminRouter } from './routes/admin';
import { billingRouter } from './routes/billing';

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://energyiq.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) cb(null, true);
    else cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Stripe webhook must receive raw body — mount before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/tariffs', tariffsRouter);
app.use('/api/machines', machinesRouter);
app.use('/api/bills', billsRouter);
app.use('/api/readings', readingsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/billing', billingRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
