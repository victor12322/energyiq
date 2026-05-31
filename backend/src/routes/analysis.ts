import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { runAnalysis } from '../services/analysisEngine';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await runAnalysis(req.auth!.companyId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute analysis' });
  }
});

export { router as analysisRouter };
