import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2, FileText, Zap, Leaf, ArrowRight,
  Check, ChevronRight, TrendingDown, Activity,
  Cpu, Clock, Shield, Download,
} from 'lucide-react';
import { useInView } from '../hooks/useInView';
import { billingApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// ── Fade-in wrapper ────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`fade-up ${inView ? 'in-view' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ── Dashboard mockup (hero right side) ────────────────────────────────────
function DashboardPreview() {
  return (
    <div className="relative">
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#0d0d0f] shadow-2xl shadow-black/60">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-800/80 bg-[#111113]">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="flex-1 mx-3">
            <div className="bg-zinc-900 rounded-md text-[11px] text-zinc-600 text-center py-0.5 px-3 w-fit mx-auto">
              app.energyiq.io/dashboard
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Monthly cost', value: '€3,499', sub: 'this period', color: 'text-zinc-100' },
              { label: 'Potential saving', value: '€1,948', sub: '55.7% of spend', color: 'text-green-400' },
              { label: 'CO₂ footprint', value: '5.9 t', sub: 'per month', color: 'text-zinc-100' },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5">
                <p className="text-[10px] text-zinc-500 mb-1">{s.label}</p>
                <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Mini bar chart */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 mb-2 font-medium">Consumption per machine — kWh/month</p>
            <div className="space-y-1.5">
              {[
                { name: 'Hydraulic Press', pct: 92, kwh: '3,960' },
                { name: 'CNC Milling Centre', pct: 74, kwh: '4,440' },
                { name: 'Industrial Compressor', pct: 52, kwh: '2,250' },
                { name: 'Conveyor Belt A', pct: 28, kwh: '810' },
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 w-32 flex-shrink-0 truncate">{m.name}</span>
                  <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-green-500"
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 w-10 text-right">{m.kwh}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation card */}
          <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <TrendingDown className="h-3 w-3 text-green-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-zinc-200">
                  Shift Hydraulic Press → off-peak
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Save <span className="text-green-400 font-semibold">€847/month</span> · 63.7% reduction on this machine
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glow */}
      <div className="absolute -inset-px rounded-xl bg-green-500/5 blur-xl -z-10" />
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-zinc-800/80 bg-[#09090b]/95 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-green-500 flex items-center justify-center">
            <Activity className="h-4 w-4 text-black" />
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">EnergyIQ</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to="/dashboard"
              className="text-sm font-medium bg-green-500 hover:bg-green-400 text-black px-4 py-1.5 rounded-lg transition-colors"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-green-500 hover:bg-green-400 text-black px-4 py-1.5 rounded-lg transition-colors"
              >
                Start free trial
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Pricing section ────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 299,
    description: 'For single-site operations getting a handle on energy costs.',
    features: [
      'Up to 10 machines',
      'Unlimited tariff band configuration',
      'Monthly PDF reports',
      'Per-machine cost breakdown',
      'Peak-rate detection',
      '1 user account',
      'Email support',
    ],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 599,
    description: 'For mid-size manufacturers ready to act on load-shifting savings.',
    features: [
      'Up to 50 machines',
      'Weekly PDF reports',
      'Load-shift simulation',
      'CO₂ tracking & reporting',
      'Band-level bill breakdown',
      '5 user accounts',
      'Priority email support',
    ],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    description: 'For multi-site operations and compliance-driven reporting.',
    features: [
      'Unlimited machines',
      'Daily PDF reports',
      'API access for IoT meter integration',
      'Custom CO₂ emission factors per site',
      'Unlimited user accounts',
      'Dedicated onboarding session',
      'Priority support + SLA',
    ],
    cta: 'Start free trial',
    highlighted: false,
  },
];

function PricingCard({ plan, onCheckout }: { plan: typeof PLANS[0]; onCheckout: (id: string) => void }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onCheckout(plan.id);
    setLoading(false);
  };

  return (
    <div
      className={`relative flex flex-col border rounded-xl p-6 ${
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

      <div className="mb-6">
        <h3 className="font-display font-bold text-white text-lg">{plan.name}</h3>
        <p className="text-zinc-500 text-sm mt-1 leading-relaxed">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="font-display font-bold text-white text-4xl">€{plan.price}</span>
          <span className="text-zinc-500 text-sm mb-1.5">/month</span>
        </div>
        <p className="text-zinc-600 text-xs mt-1">+ 14-day free trial, no credit card required</p>
      </div>

      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={handleClick}
        disabled={loading}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          plan.highlighted
            ? 'bg-green-500 hover:bg-green-400 text-black'
            : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
        }`}
      >
        {loading ? 'Redirecting…' : plan.cta}
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Landing() {
  const { user } = useAuth();

  const handleCheckout = async (plan: string) => {
    if (!user) {
      window.location.href = '/register';
      return;
    }
    try {
      const { data } = await billingApi.checkout(plan);
      if (data.url) window.location.href = data.url;
    } catch {
      window.location.href = '/register';
    }
  };

  return (
    <div className="bg-[#09090b] text-zinc-100 min-h-screen" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Nav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-green-400 border border-green-500/20 bg-green-500/8 px-3 py-1.5 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              Now in pilot — 12 manufacturers onboarded across Europe
            </div>

            <h1
              className="text-[3.25rem] lg:text-[4rem] font-bold leading-[1.05] tracking-tight text-white mb-6"
              style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
            >
              Cut peak-rate energy costs.
              <br />
              <span className="text-green-400">Without replacing</span>
              <br />
              a single machine.
            </h1>

            <p className="text-lg text-zinc-400 leading-relaxed mb-8 max-w-lg">
              EnergyIQ maps your equipment's consumption against your tariff structure,
              identifies which machines run at the wrong time, and gives you a ranked
              action list with exact monthly savings per machine.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
              >
                See how it works
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <p className="text-xs text-zinc-600">
              14-day free trial · No credit card required · Cancel anytime
            </p>
          </div>

          <div className="lg:col-span-6">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ── Proof bar ─────────────────────────────────────────────────────── */}
      <section className="border-y border-zinc-800/60 py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-zinc-600 uppercase tracking-widest font-medium text-center mb-5">
            Trusted by manufacturers across Europe
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-zinc-500 text-sm font-medium">
            {['Acme Manufacturing', 'TechPlast Industries', 'Ferretti Metalworks', 'Valmet Precision', 'Nordex Composites'].map((n) => (
              <span key={n} className="opacity-60 hover:opacity-100 transition-opacity">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#0d0d0f]">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">The problem</p>
            <h2
              className="text-3xl lg:text-4xl font-bold text-white mb-16 max-w-xl leading-tight"
              style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
            >
              Three reasons energy costs are running ahead of you.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800">
            {[
              {
                stat: '23%',
                label: 'wasted on avoidable peak-rate consumption',
                body: 'The average SME manufacturer consumes nearly a quarter of their energy during peak tariff windows — consumption that could shift off-peak with zero capital expenditure.',
              },
              {
                stat: '€12,000',
                label: 'typical one-time energy audit cost',
                body: 'Consultants charge for a single snapshot that\'s outdated within months. EnergyIQ gives you continuous, live analysis for a fixed monthly fee.',
              },
              {
                stat: '2026',
                label: 'EU Energy Efficiency Directive compliance deadline',
                body: 'New EU and UK regulations require SMEs to track and report consumption data. Manual spreadsheets won\'t cut it — and fines for non-compliance are real.',
              },
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 80} className="bg-[#0d0d0f] p-8 lg:p-10">
                <div
                  className="text-5xl font-bold text-green-400 mb-2 leading-none"
                  style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
                >
                  {item.stat}
                </div>
                <p className="text-sm font-semibold text-white mb-3">{item.label}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.body}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">How it works</p>
            <h2
              className="text-3xl lg:text-4xl font-bold text-white mb-16 max-w-xl leading-tight"
              style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
            >
              From first login to first recommendation: 15 minutes.
            </h2>
          </FadeUp>

          <div className="space-y-0 divide-y divide-zinc-800/60">
            {[
              {
                step: '01',
                title: 'Enter your machines and tariff rates',
                body: 'Add your equipment — name, rated power in kW, daily operating hours. Then configure your energy supplier\'s time bands (e.g. peak: 08:00–20:00 at €0.28/kWh, off-peak: €0.11/kWh). No hardware required.',
                aside: '15 min setup · No IT team needed',
              },
              {
                step: '02',
                title: 'EnergyIQ maps the cost of your factory floor',
                body: 'The analysis engine calculates what each machine costs per hour, per day, and per month. It identifies which machines are running during your most expensive tariff window and flags the highest-cost offenders.',
                aside: 'Refreshes every time you open the dashboard',
              },
              {
                step: '03',
                title: 'Get a ranked action list with exact savings',
                body: '"Shift your Hydraulic Press to the off-peak window → €847/month saved." Every recommendation shows the exact tariff bands involved, the kWh shifted, and the monthly and annual saving — before you touch anything.',
                aside: 'Export to PDF for management sign-off',
              },
            ].map((s, i) => (
              <FadeUp key={i} delay={i * 60}>
                <div className="py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-1">
                    <span
                      className="text-4xl font-bold text-zinc-800"
                      style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
                    >
                      {s.step}
                    </span>
                  </div>
                  <div className="lg:col-span-7">
                    <h3
                      className="text-xl font-semibold text-white mb-3"
                      style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
                    >
                      {s.title}
                    </h3>
                    <p className="text-zinc-400 leading-relaxed text-sm">{s.body}</p>
                  </div>
                  <div className="lg:col-span-4 lg:text-right">
                    <span className="text-xs text-zinc-600 font-medium">{s.aside}</span>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-[#0d0d0f]">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">Features</p>
            <h2
              className="text-3xl lg:text-4xl font-bold text-white mb-16 max-w-xl leading-tight"
              style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
            >
              Everything you need. Nothing you don't.
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800/60">
            {[
              {
                Icon: BarChart2,
                title: 'Per-machine cost breakdown',
                body: 'Not just total kWh — the exact monthly cost of every piece of equipment, ranked from most to least expensive.',
              },
              {
                Icon: Zap,
                title: 'Peak-rate detection',
                body: 'Automatically flags machines running during your highest-tariff windows. The expensive ones are always visible first.',
              },
              {
                Icon: TrendingDown,
                title: 'Load-shift simulation',
                body: 'Before changing any schedules, see the exact before/after cost totals if you apply all recommendations.',
              },
              {
                Icon: Leaf,
                title: 'CO₂ tracking',
                body: 'Configurable grid emission factor (EU, UK, US). Track your footprint monthly and show reduction progress over time.',
              },
              {
                Icon: FileText,
                title: 'Automated PDF reports',
                body: 'Branded, boardroom-ready reports generated in seconds. Structured for management sign-off and compliance submissions.',
              },
              {
                Icon: Cpu,
                title: 'IoT-ready ingestion',
                body: 'A REST endpoint accepts meter readings today. Connect smart meters or SCADA systems later — no data migration, no schema changes.',
              },
              {
                Icon: Clock,
                title: 'Configurable tariff bands',
                body: 'Define any number of named time bands — peak, mid, off-peak, weekend, seasonal. Works with any energy supplier in any market.',
              },
              {
                Icon: Download,
                title: 'Multi-site support',
                body: 'Enterprise accounts can manage multiple facilities, each with their own tariff structure and machine inventory.',
              },
              {
                Icon: Shield,
                title: 'Isolated tenant data',
                body: 'Every company\'s data is fully isolated. Admins see only their own machines and bills. No shared views, no cross-tenant risk.',
              },
            ].map(({ Icon, title, body }, i) => (
              <FadeUp key={i} delay={(i % 3) * 60} className="bg-[#0d0d0f] p-7">
                <div className="h-9 w-9 border border-zinc-800 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-4 w-4 text-zinc-400" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-2" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
                  {title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{body}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-12">What manufacturers say</p>
          </FadeUp>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              {
                quote: 'Within two weeks of using EnergyIQ, we identified €2,100/month in savings by rescheduling our injection moulding line. The subscription paid back in the first month.',
                name: '[Head of Operations]',
                company: '[Manufacturing Company, Germany]',
              },
              {
                quote: 'What used to take our energy manager a full week to compile manually, EnergyIQ generates in seconds. The PDF reports are now standard output for our monthly board meetings.',
                name: '[Managing Director]',
                company: '[Metal Processing Company, Netherlands]',
              },
            ].map((t, i) => (
              <FadeUp key={i} delay={i * 80}>
                <div className="border border-zinc-800 rounded-xl p-8 h-full flex flex-col">
                  <div className="text-green-500/60 text-4xl leading-none mb-4 font-serif">"</div>
                  <p className="text-zinc-300 text-sm leading-relaxed flex-1 italic">{t.quote}</p>
                  <div className="mt-6 pt-5 border-t border-zinc-800">
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{t.company}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={160} className="mt-4">
            <p className="text-center text-xs text-zinc-700 italic">
              Placeholders — replace with real testimonials before go-live.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-[#0d0d0f]">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium mb-4">Pricing</p>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
              <h2
                className="text-3xl lg:text-4xl font-bold text-white max-w-sm leading-tight"
                style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
              >
                Transparent pricing. No hidden metering fees.
              </h2>
              <p className="text-sm text-zinc-500 max-w-sm">
                All plans include a 14-day free trial. Cancel anytime — no minimum commitment.
                Annual billing available on request with 2 months free.
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PLANS.map((plan, i) => (
              <FadeUp key={plan.id} delay={i * 80}>
                <PricingCard plan={plan} onCheckout={handleCheckout} />
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={240}>
            <div className="mt-8 border border-zinc-800 rounded-xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white text-sm">Need a custom quote?</p>
                <p className="text-zinc-500 text-sm mt-0.5">Multi-site deployments, custom integrations, or procurement via purchase order — we can accommodate.</p>
              </div>
              <a
                href="mailto:sales@energyiq.io"
                className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-lg transition-colors"
              >
                Contact sales
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeUp>
            <h2
              className="text-3xl lg:text-5xl font-bold text-white mb-4 leading-tight"
              style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}
            >
              Ready to see what your machines
              <br />
              are actually costing you?
            </h2>
            <p className="text-zinc-500 mb-10 text-lg">
              15 minutes to set up. Recommendations on day one.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold px-7 py-3.5 rounded-lg transition-colors"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-medium px-7 py-3.5 rounded-lg transition-colors text-sm"
              >
                Sign in
              </Link>
            </div>
            <p className="text-xs text-zinc-700 mt-5">No credit card required · 14-day trial · Cancel anytime</p>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/60 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-green-500 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-black" />
                </div>
                <span className="font-display font-bold text-white text-base">EnergyIQ</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed max-w-[200px]">
                AI-powered energy efficiency for SME manufacturers.
              </p>
            </div>

            {[
              {
                heading: 'Product',
                links: [
                  { label: 'Dashboard', to: '/dashboard' },
                  { label: 'Analysis', to: '/analysis' },
                  { label: 'Reports', to: '/reports' },
                  { label: 'Pricing', href: '#pricing' },
                ],
              },
              {
                heading: 'Company',
                links: [
                  { label: 'About', href: '#' },
                  { label: 'Contact', href: 'mailto:hello@energyiq.io' },
                  { label: 'Privacy Policy', href: '#' },
                  { label: 'Terms of Service', href: '#' },
                ],
              },
              {
                heading: 'Developers',
                links: [
                  { label: 'API Reference', href: '#' },
                  { label: 'IoT Integration', href: '#' },
                  { label: 'Webhook docs', href: '#' },
                  { label: 'Status', href: '#' },
                ],
              },
            ].map((col) => (
              <div key={col.heading}>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">{col.heading}</p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {'to' in link ? (
                        <Link to={link.to!} className="text-sm text-zinc-600 hover:text-zinc-300 transition-colors">
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className="text-sm text-zinc-600 hover:text-zinc-300 transition-colors">
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-zinc-700">© {new Date().getFullYear()} EnergyIQ. All rights reserved.</p>
            <p className="text-xs text-zinc-700">Built for serious manufacturers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
