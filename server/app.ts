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

// Auth is via Bearer token (not cookies), so a permissive CORS policy is safe.
// In production the frontend and API are same-origin, so CORS is a non-issue.
app.use(cors({ origin: true }));

// Stripe webhook must receive the raw body — mount before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/tariffs', tariffsRouter);
app.use('/api/machines', machinesRouter);
app.use('/api/bills', billsRouter);
app.use('/api/readings', readingsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/billing', billingRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
