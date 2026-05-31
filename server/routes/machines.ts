import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const machineSchema = z.object({
  name: z.string().min(1).max(100),
  ratedPowerKw: z.number().min(0.01),
  dailyHours: z.number().min(0.01).max(24),
  tariffBandName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const machines = await prisma.machine.findMany({
      where: { companyId: req.auth!.companyId },
      orderBy: { name: 'asc' },
    });
    res.json(machines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = machineSchema.parse(req.body);

    const machine = await prisma.machine.create({
      data: { ...data, companyId: req.auth!.companyId },
    });
    res.status(201).json(machine);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = machineSchema.partial().parse(req.body);

    const existing = await prisma.machine.findFirst({
      where: { id: req.params.id, companyId: req.auth!.companyId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Machine not found' });
      return;
    }

    const machine = await prisma.machine.update({ where: { id: req.params.id }, data });
    res.json(machine);
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
    const existing = await prisma.machine.findFirst({
      where: { id: req.params.id, companyId: req.auth!.companyId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Machine not found' });
      return;
    }

    await prisma.machine.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as machinesRouter };
