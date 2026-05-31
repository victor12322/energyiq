import { useState, useEffect } from 'react';
import { Check, Activity, LogOut } from 'lucide-react';
import { billingApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 299,
    machines: '10 machines',
    features: ['Per-machine cost breakdown', 'Peak-rate detection', 'Monthly PDF reports', '1 user account'],
    highlighted: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 599,
    machines: '50 machines',
    features: ['Load-shift simulation', 'Weekly PDF reports', 'CO₂ tracking & reporting', '5 user accounts'],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    machines: 'Unlimited',
    features: ['API access for IoT meters', 'Daily PDF reports', 'Custom emission factors', 'Unlimited users + SLA'],
    highlighted: false,
  },
];

export default function Subscribe() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const canceled = params.get('canceled') === '1';

  // If already subscribed, skip straight to dashboard
  useEffect(() => {
    if (!user) return;
    billingApi.subscription().then(({ data }) => {
      if (data.status === 'active' || data.status === 'trialing') {
        navigate('/dashboard', { replace: true });
      }
    }).catch(() => {});
  }, [user, navigate]);

  const handleCheckout = async (plan: string) => {
    setLoading(plan);
    try {
      const { data } = await billingApi.checkout(plan);
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(null);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top bar */}
      <header className="border-b border-zinc-800 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-green-500 flex items-center justify-center">
            <Activity className="h-4 w-4 text-black" />
          </div>
          <span className="font-bold text-white text-base" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
            EnergyIQ
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <span>{user?.email}</span>
          <button onClick={handleLogout} className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-4xl w-full">
          {canceled && (
            <div className="mb-8 p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg text-sm text-amber-400 text-center">
              Checkout was cancelled. Choose a plan below whenever you're ready.
            </div>
          )}

          <div className="text-center mb-12">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-3">Choose a plan</p>
            <h1
              className="text-3xl font-bold text-white mb-3"
              style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
            >
              Activate your EnergyIQ subscription
            </h1>
            <p className="text-zinc-500 text-sm">
              14-day free trial on all plans. Cancel anytime. No credit card required to start.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative border rounded-xl p-6 flex flex-col ${
                  plan.highlighted
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-zinc-800 bg-zinc-900/30'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-500 text-black text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h2
                    className="text-lg font-bold text-white mb-1"
                    style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
                  >
                    {plan.name}
                  </h2>
                  <p className="text-xs text-zinc-500">{plan.machines}</p>
                </div>

                <div className="mb-5">
                  <span
                    className="text-3xl font-bold text-white"
                    style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
                  >
                    €{plan.price}
                  </span>
                  <span className="text-zinc-500 text-sm">/month</span>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading !== null}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-green-500 hover:bg-green-400 text-black'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                  } disabled:opacity-50`}
                >
                  {loading === plan.id ? 'Redirecting…' : 'Start free trial'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
