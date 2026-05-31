// Vercel serverless entry — wraps the Express app.
// All /api/* requests are rewritten here (see vercel.json) and routed by Express.
import app from '../server/app';

export default app;
