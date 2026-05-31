import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const bandSchema = z.object({
  name: z.string().min(1).max(50),
  pricePerKwh: z.number().min(0),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(0).max(23),
  color: z.string().optional(),
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const bands = await prisma.tariffBand.findMany({
      where: { companyId: req.auth!.companyId },
      orderBy: { pricePerKwh: 'desc' },
    });
    res.json(bands);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = bandSchema.parse(req.body);

    const band = await prisma.tariffBand.create({
      data: { ...data, companyId: req.auth!.companyId },
    });
    res.status(201).json(band);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    if ((err as { code?: string }).code === 'P2002') {
      res.status(409).json({ error: 'A tariff band with that name already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = bandSchema.partial().parse(req.body);

    const existing = await prisma.tariffBand.findFirst({
      where: { id: req.params.id, companyId: req.auth!.companyId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Tariff band not found' });
      return;
    }

    const band = await prisma.tariffBand.update({
      where: { id: req.params.id },
      data,
    });
    res.json(band);
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
    const existing = await prisma.tariffBand.findFirst({
      where: { id: req.params.id, companyId: req.auth!.companyId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Tariff band not found' });
      return;
    }

    await prisma.tariffBand.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as tariffsRouter };
