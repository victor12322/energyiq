import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { billingApi, type Subscription } from '../lib/api';

const ACTIVE_STATUSES = new Set(['active', 'trialing']);

async function fetchSubWithRetry(retries = 4, delayMs = 1500): Promise<Subscription> {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await billingApi.subscription();
      if (ACTIVE_STATUSES.has(data.status)) return data;
      // Webhook may not have fired yet — wait and retry
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs));
    } catch {
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  // Final attempt — return whatever we got
  try {
    const { data } = await billingApi.subscription();
    return data;
  } catch {
    return { status: 'none', plan: null };
  }
}

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  // Re-check when coming back from Stripe checkout
  const comingFromCheckout = new URLSearchParams(location.search).get('checkout') === 'success';

  useEffect(() => {
    if (!user) { setSubLoading(false); return; }

    const load = comingFromCheckout
      ? fetchSubWithRetry()          // poll up to 4× waiting for webhook
      : billingApi.subscription().then((r) => r.data).catch(() => ({ status: 'none', plan: null } as Subscription));

    load.then(setSub).finally(() => setSubLoading(false));
  }, [user, comingFromCheckout]);

  if (isLoading || subLoading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // Admins bypass subscription gate
  if (user.role === 'ADMIN') return <Outlet />;

  if (!sub || !ACTIVE_STATUSES.has(sub.status)) {
    return <Navigate to="/subscribe" replace />;
  }

  return <Outlet />;
}
