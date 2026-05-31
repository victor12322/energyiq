-- ─────────────────────────────────────────────────────────────────────────────
-- EnergyIQ — Subscriptions table + RLS
-- Run this in: Supabase dashboard → SQL Editor → New query → Run
--
-- NOTE: Prisma already created the "Subscription" table via db:push.
-- This file adds RLS policies so the Supabase Edge Function (service role)
-- can write to it, and the app can read its own row.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent re-run)
DROP POLICY IF EXISTS "Companies can read own subscription"   ON "Subscription";
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON "Subscription";

-- Companies can read their own subscription row
CREATE POLICY "Companies can read own subscription"
  ON "Subscription"
  FOR SELECT
  USING (true);   -- auth is handled by JWT in the Express layer, not Supabase Auth

-- Only the service role (Edge Function + backend) can insert/update
CREATE POLICY "Service role can manage subscriptions"
  ON "Subscription"
  FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- Useful index for webhook lookups
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_subscription_stripe_sub_id
  ON "Subscription" ("stripeSubscriptionId");

CREATE INDEX IF NOT EXISTS idx_subscription_stripe_customer_id
  ON "Subscription" ("stripeCustomerId");

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  id, "companyId", plan, status, "currentPeriodEnd", "createdAt"
FROM "Subscription"
ORDER BY "createdAt" DESC
LIMIT 10;
