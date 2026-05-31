import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer,
} from 'recharts';
import { Euro, TrendingDown, Leaf, Cpu } from 'lucide-react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { analysisApi, readingsApi } from '../lib/api';
import type { AnalysisResult, MeterReading } from '../types';
import { useAuth } from '../contexts/AuthContext';

const GRID = '#27272a';
const TICK = { fontSize: 11, fill: '#71717a' };

function fmtCurrency(v: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(v);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analysisApi.run().then((r) => setAnalysis(r.data)),
      readingsApi.list({ limit: 2000 }).then((r) => setReadings(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const machineChartData = useMemo(() => {
    if (!analysis) return [];
    return analysis.machines
      .sort((a, b) => b.monthlyCost - a.monthlyCost)
      .map((m) => ({ name: m.machineName.length > 16 ? m.machineName.slice(0, 15) + '…' : m.machineName, kWh: Math.round(m.monthlyKwh), cost: Math.round(m.monthlyCost) }));
  }, [analysis]);

  const bandChartData = useMemo(() => {
    if (!analysis) return [];
    return Object.entries(analysis.bandDistribution).map(([name, v]) => ({
      name, kWh: Math.round(v.kwh), Cost: Math.round(v.cost),
    }));
  }, [analysis]);

  const timeSeriesData = useMemo(() => {
    const byDay: Record<string, number> = {};
    readings.forEach((r) => {
      const day = r.timestamp.slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + r.kwhDelta;
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, kwh]) => ({ date: date.slice(5), kWh: Math.round(kwh * 10) / 10 }));
  }, [readings]);

  if (loading) return <LoadingSpinner />;

  const cur = analysis?.currency ?? user?.currency ?? 'EUR';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
          {greeting}, {user?.name}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Energy overview · {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Monthly Energy Cost" value={fmtCurrency(analysis?.totalMonthlyCost ?? 0, cur)} subtitle="Based on machine specs & tariffs" Icon={Euro} color="blue" />
        <StatCard title="Potential Monthly Saving" value={fmtCurrency(analysis?.totalPotentialSaving ?? 0, cur)} subtitle={`${(analysis?.totalPotentialSavingPercent ?? 0).toFixed(1)}% of total spend`} Icon={TrendingDown} color="green" trend={{ value: analysis?.totalPotentialSavingPercent ?? 0 }} />
        <StatCard title="Avoidable CO₂" value={`${(analysis?.avoidableCo2KgMonth ?? 0).toFixed(0)} kg/mo`} subtitle={`Total footprint: ${(analysis?.totalCo2TonsMonth ?? 0).toFixed(2)} t/mo`} Icon={Leaf} color="amber" />
        <StatCard title="Machines Monitored" value={String(analysis?.machines.length ?? 0)} subtitle={`${analysis?.peakMachineNames.length ?? 0} running at peak rate`} Icon={Cpu} color="violet" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Machine Consumption (kWh/month)</h2>
          {machineChartData.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-10">No machines configured yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={machineChartData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="name" tick={TICK} />
                <YAxis tick={TICK} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="kWh" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Cost by Tariff Band</h2>
          {bandChartData.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-10">Configure tariff bands to see distribution.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bandChartData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="name" tick={TICK} />
                <YAxis tick={TICK} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="kWh" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Consumption Trend — last 30 days (kWh/day)</h2>
        {timeSeriesData.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-10">
            No meter readings yet. Go to <strong className="text-zinc-400">Analysis</strong> and click "Simulate readings".
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeSeriesData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="date" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip content={<DarkTooltip />} />
              <Line type="monotone" dataKey="kWh" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {analysis && analysis.recommendations.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300">Top Recommendations</h2>
            <a href="/analysis" className="text-xs text-green-400 hover:text-green-300 font-medium">View all →</a>
          </div>
          <div className="space-y-3">
            {analysis.recommendations.slice(0, 3).map((r, i) => (
              <div key={r.machineId} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
                <span className="flex-shrink-0 h-6 w-6 bg-green-500/20 text-green-400 border border-green-500/20 rounded-full text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">{r.machineName}</p>
                  <p className="text-xs text-zinc-500">
                    Shift from <span className="font-medium text-red-400">{r.currentBand}</span>{' '}→{' '}
                    <span className="font-medium text-green-400">{r.suggestedBand}</span>
                  </p>
                </div>
                <div className="ml-auto text-right flex-shrink-0">
                  <p className="text-sm font-bold text-green-400">{fmtCurrency(r.monthlySaving, cur)}/mo</p>
                  <p className="text-xs text-zinc-600">{r.percentageSaving.toFixed(0)}% saving</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
