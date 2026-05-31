import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { simulateReadings } from '../services/meterSimulator';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const readingSchema = z.object({
  machineId: z.string().nullable().optional(),
  timestamp: z.string().datetime(),
  kwhDelta: z.number().min(0),
});

// POST /api/readings — ingest a single meter reading (IoT endpoint)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = readingSchema.parse(req.body);

    if (data.machineId) {
      const machine = await prisma.machine.findFirst({
        where: { id: data.machineId, companyId: req.auth!.companyId },
      });
      if (!machine) {
        res.status(404).json({ error: 'Machine not found' });
        return;
      }
    }

    const reading = await prisma.meterReading.create({
      data: {
        companyId: req.auth!.companyId,
        machineId: data.machineId ?? null,
        timestamp: new Date(data.timestamp),
        kwhDelta: data.kwhDelta,
      },
    });
    res.status(201).json(reading);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/readings — retrieve readings for this company
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { machineId, from, to, limit } = req.query;

    const readings = await prisma.meterReading.findMany({
      where: {
        companyId: req.auth!.companyId,
        ...(machineId ? { machineId: String(machineId) } : {}),
        ...(from || to
          ? {
              timestamp: {
                ...(from ? { gte: new Date(String(from)) } : {}),
                ...(to ? { lte: new Date(String(to)) } : {}),
              },
            }
          : {}),
      },
      orderBy: { timestamp: 'asc' },
      take: limit ? Number(limit) : 2000,
      include: { machine: { select: { name: true } } },
    });
    res.json(readings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/readings/simulate — generate mock readings for all machines of this company
router.post('/simulate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 30 } = req.body as { days?: number };
    const count = await simulateReadings(req.auth!.companyId, Number(days));
    res.json({ message: `Generated ${count} simulated readings`, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as readingsRouter };
