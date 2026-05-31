import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/companies', async (_req: Request, res: Response): Promise<void> => {
  try {
    const companies = await prisma.company.findMany({
      where: { role: 'CLIENT' },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        emissionFactor: true,
        createdAt: true,
        _count: {
          select: { machines: true, monthlyBills: true, meterReadings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [companyCount, machineCount, totalBills] = await Promise.all([
      prisma.company.count({ where: { role: 'CLIENT' } }),
      prisma.machine.count(),
      prisma.monthlyBill.aggregate({ _sum: { totalCost: true, totalKwh: true } }),
    ]);

    // Rough MRR estimate: $299/company/month (pilot pricing)
    const MRR_PER_COMPANY = 299;

    res.json({
      totalCompanies: companyCount,
      totalMachines: machineCount,
      totalBillCost: totalBills._sum.totalCost ?? 0,
      totalBillKwh: totalBills._sum.totalKwh ?? 0,
      estimatedMrr: companyCount * MRR_PER_COMPANY,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as adminRouter };
