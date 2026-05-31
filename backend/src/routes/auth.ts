import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, signToken } from '../middleware/auth';
import { Role } from '../types';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  currency: z.string().length(3).default('EUR'),
  emissionFactor: z.number().min(0).max(2).default(0.4),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.company.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const company = await prisma.company.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        currency: data.currency,
        emissionFactor: data.emissionFactor,
        role: 'CLIENT',
      },
    });

    const token = signToken({
      companyId: company.id,
      email: company.email,
      name: company.name,
      role: company.role as Role,
      currency: company.currency,
      emissionFactor: company.emissionFactor,
    });

    res.status(201).json({
      token,
      company: { id: company.id, name: company.name, email: company.email, role: company.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    const company = await prisma.company.findUnique({ where: { email: data.email } });
    if (!company || !(await bcrypt.compare(data.password, company.passwordHash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({
      companyId: company.id,
      email: company.email,
      name: company.name,
      role: company.role as Role,
      currency: company.currency,
      emissionFactor: company.emissionFactor,
    });

    res.json({
      token,
      company: { id: company.id, name: company.name, email: company.email, role: company.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.auth!.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        currency: true,
        emissionFactor: true,
        createdAt: true,
      },
    });
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const updateSchema = z.object({
      name: z.string().min(2).max(100).optional(),
      currency: z.string().length(3).optional(),
      emissionFactor: z.number().min(0).max(2).optional(),
    });
    const data = updateSchema.parse(req.body);

    const company = await prisma.company.update({
      where: { id: req.auth!.companyId },
      data,
      select: { id: true, name: true, email: true, role: true, currency: true, emissionFactor: true },
    });
    res.json(company);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as authRouter };
