import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const breakdownSchema = z.object({
  bandName: z.string().min(1),
  kwh: z.number().min(0),
  cost: z.number().min(0),
});

const billSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  totalCost: z.number().min(0),
  totalKwh: z.number().min(0),
  currency: z.string().length(3),
  notes: z.string().nullable().optional(),
  bandBreakdowns: z.array(breakdownSchema).optional(),
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const bills = await prisma.monthlyBill.findMany({
      where: { companyId: req.auth!.companyId },
      include: { bandBreakdowns: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    res.json(bills);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { bandBreakdowns, ...rest } = billSchema.parse(req.body);

    const bill = await prisma.monthlyBill.create({
      data: {
        ...rest,
        companyId: req.auth!.companyId,
        bandBreakdowns: bandBreakdowns
          ? { create: bandBreakdowns }
          : undefined,
      },
      include: { bandBreakdowns: true },
    });
    res.status(201).json(bill);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    if ((err as { code?: string }).code === 'P2002') {
      res.status(409).json({ error: 'A bill for that month/year already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { bandBreakdowns, ...rest } = billSchema.partial().parse(req.body);

    const existing = await prisma.monthlyBill.findFirst({
      where: { id: req.params.id, companyId: req.auth!.companyId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    // Replace breakdowns if provided
    const bill = await prisma.monthlyBill.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(bandBreakdowns !== undefined
          ? {
              bandBreakdowns: {
                deleteMany: {},
                create: bandBreakdowns,
              },
            }
          : {}),
      },
      include: { bandBreakdowns: true },
    });
    res.json(bill);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.monthlyBill.findFirst({
      where: { id: req.params.id, companyId: req.auth!.companyId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    await prisma.monthlyBill.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as billsRouter };
