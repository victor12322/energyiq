import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { generatePdfReport } from '../services/reportService';
import { PrismaClient } from '@prisma/client';
import { runAnalysis } from '../services/analysisEngine';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await prisma.company.findUniqueOrThrow({
      where: { id: req.auth!.companyId },
    });
    const analysis = await runAnalysis(req.auth!.companyId);

    const filename = `energyiq-report-${company.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = await generatePdfReport(company, analysis);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export { router as reportsRouter };
