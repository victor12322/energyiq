// Supabase Edge Function — Stripe webhook handler
// Deploy: supabase functions deploy stripe-webhook
// Set secrets:
//   supabase secrets set STRIPE_SECRET_KEY=sk_...
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//
// Register this URL in Stripe dashboard as a webhook endpoint:
//   https://<project-ref>.supabase.co/functions/v1/stripe-webhook

import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // @ts-ignore — Deno fetch
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req: Request) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    console.error('Signature verification failed:', err);
    return new Response(`Webhook error: ${err}`, { status: 400 });
  }

  console.log(`Processing event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession;
      const companyId = session.metadata?.companyId;
      const plan = session.metadata?.plan ?? null;
      if (!companyId) break;

      await supabase.from('Subscription').upsert(
        {
          companyId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          plan,
          status: 'trialing',
          updatedAt: new Date().toISOString(),
        },
        { onConflict: 'companyId' }
      );
      console.log(`Subscription created for company ${companyId}`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const { error } = await supabase
        .from('Subscription')
        .update({
          status: sub.status,
          stripePriceId: sub.items.data[0]?.price.id ?? null,
          currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('stripeSubscriptionId', sub.id);
      if (error) console.error('Update error:', error);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const { error } = await supabase
        .from('Subscription')
        .update({ status: 'canceled', updatedAt: new Date().toISOString() })
        .eq('stripeSubscriptionId', sub.id);
      if (error) console.error('Delete error:', error);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
