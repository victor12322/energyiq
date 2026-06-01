import { Router, Request, Response } from 'express';
import StripeLib from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Lazy-init so missing key doesn't crash the server at startup
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _stripe: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStripe(): any {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new StripeLib(key);
  }
  return _stripe;
}

const PRICE_IDS: Record<string, string> = {
  starter:    process.env.STRIPE_PRICE_STARTER    ?? '',
  growth:     process.env.STRIPE_PRICE_GROWTH     ?? '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
};

const APP_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

// GET /api/billing/subscription
router.get('/subscription', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { companyId: req.auth!.companyId },
    });
    res.json(sub ?? { status: 'none' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/billing/checkout
router.post('/checkout', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan } = req.body as { plan: string };
    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      res.status(400).json({ error: `Unknown plan or price not configured: ${plan}` });
      return;
    }

    const company = await prisma.company.findUniqueOrThrow({
      where: { id: req.auth!.companyId },
      include: { subscription: true },
    });

    let customerId: string | undefined = company.subscription?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: company.email,
        name: company.name,
        metadata: { companyId: company.id },
      });
      customerId = customer.id as string;
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard?checkout=success`,
      cancel_url: `${APP_URL}/subscribe?canceled=1`,
      metadata: { companyId: company.id, plan },
      subscription_data: {
        trial_period_days: 14,
        metadata: { companyId: company.id, plan },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/billing/portal
router.post('/portal', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { companyId: req.auth!.companyId },
    });
    if (!sub?.stripeCustomerId) {
      res.status(400).json({ error: 'No active subscription found' });
      return;
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${APP_URL}/dashboard`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// POST /api/billing/webhook (raw body via express.raw in index.ts)
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    res.status(400).json({ error: 'Missing stripe-signature or webhook secret' });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: { type: string; data: { object: any } };
  try {
    event = getStripe().webhooks.constructEvent(req.body as Buffer, sig, secret);
  } catch (err) {
    console.error('Webhook signature failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      const companyId: string | undefined = s.metadata?.companyId;
      const plan: string | null = s.metadata?.plan ?? null;
      if (companyId) {
        await prisma.subscription.upsert({
          where: { companyId },
          create: { companyId, stripeCustomerId: s.customer ?? null, stripeSubscriptionId: s.subscription ?? null, plan, status: 'trialing' },
          update: { stripeCustomerId: s.customer ?? null, stripeSubscriptionId: s.subscription ?? null, plan, status: 'trialing' },
        });
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const s = event.data.object;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: s.id },
        data: {
          status: s.status,
          stripePriceId: s.items?.data?.[0]?.price?.id ?? null,
          currentPeriodEnd: new Date((s.current_period_end as number) * 1000),
        },
      });
    }

    if (event.type === 'customer.subscription.deleted') {
      const s = event.data.object;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: s.id },
        data: { status: 'canceled' },
      });
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

export { router as billingRouter };
