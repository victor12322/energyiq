import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, Leaf, AlertTriangle, RefreshCw } from 'lucide-react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { analysisApi, readingsApi } from '../lib/api';
import type { AnalysisResult } from '../types';

const GRID = '#27272a';
const TICK = { fontSize: 11, fill: '#71717a' };

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

function fmtCurrency(v: number, cur: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 0 }).format(v);
}

export default function Analysis() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const load = () => analysisApi.run().then((r) => setAnalysis(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSimulate = async () => {
    setSimulating(true);
    try { await readingsApi.simulate(30); await load(); }
    finally { setSimulating(false); }
  };

  if (loading) return <LoadingSpinner />;

  const cur = analysis?.currency ?? 'EUR';

  const machineCostData = (analysis?.machines ?? [])
    .sort((a, b) => b.monthlyCost - a.monthlyCost)
    .map((m) => ({
      name: m.machineName.length > 14 ? m.machineName.slice(0, 13) + '…' : m.machineName,
      Current: Math.round(m.monthlyCost),
      Optimised: Math.round(m.monthlyKwh * (analysis!.recommendations.find((r) => r.machineId === m.machineId)?.suggestedPricePerKwh ?? m.currentPricePerKwh)),
    }));

  const loadShiftData = analysis?.loadShift
    ? [{ name: 'Current', cost: Math.round(analysis.loadShift.currentTotalCost) }, { name: 'Optimised', cost: Math.round(analysis.loadShift.optimizedTotalCost) }]
    : [];

  if (!analysis || analysis.machines.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-100" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>Analysis</h1>
        <div className="card p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
          <p className="text-zinc-300 font-medium">No data to analyse</p>
          <p className="text-zinc-600 text-sm mt-1">Add tariff bands and machines first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>Analysis</h1>
          <p className="text-zinc-500 text-sm mt-1">Computed {new Date(analysis.computedAt).toLocaleString()}</p>
        </div>
        <button onClick={handleSimulate} disabled={simulating} className="btn-secondary">
          <RefreshCw className={`h-4 w-4 ${simulating ? 'animate-spin' : ''}`} />
          {simulating ? 'Simulating…' : 'Simulate readings'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Monthly Cost" value={fmtCurrency(analysis.totalMonthlyCost, cur)} Icon={TrendingDown} color="blue" />
        <StatCard title="Potential Saving" value={fmtCurrency(analysis.totalPotentialSaving, cur)} subtitle={`${analysis.totalPotentialSavingPercent.toFixed(1)}% of spend`} Icon={TrendingDown} color="green" />
        <StatCard title="Annual Opportunity" value={fmtCurrency(analysis.totalPotentialSaving * 12, cur)} Icon={TrendingDown} color="amber" />
        <StatCard title="Avoidable CO₂" value={`${analysis.avoidableCo2KgMonth.toFixed(0)} kg/mo`} subtitle={`${analysis.totalCo2TonsMonth.toFixed(2)} t total`} Icon={Leaf} color="green" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-1">Load-Shift Simulation</h2>
          <p className="text-xs text-zinc-600 mb-4">Monthly cost before vs. after applying all recommendations</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={loadShiftData} barSize={60} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="name" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="cost" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-1">Machine Cost: Current vs Optimised</h2>
          <p className="text-xs text-zinc-600 mb-4">Monthly cost per machine before and after load shifting</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={machineCostData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="name" tick={TICK} />
              <YAxis tick={TICK} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#71717a' }} />
              <Bar dataKey="Current" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Optimised" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">
          Recommendations{' '}
          <span className="ml-2 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-normal">{analysis.recommendations.length} actions</span>
        </h2>
        {analysis.recommendations.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8">All machines are in the most cost-effective band.</p>
        ) : (
          <div className="space-y-3">
            {analysis.recommendations.map((r, i) => (
              <div key={r.machineId} className="p-4 border border-zinc-800 rounded-xl hover:border-green-500/30 hover:bg-green-500/5 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-7 w-7 bg-green-500 text-black rounded-full text-sm font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-zinc-100">{r.machineName}</span>
                      <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">{r.currentBand} @ {r.currentPricePerKwh.toFixed(3)}/kWh</span>
                      <span className="text-zinc-600">→</span>
                      <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">{r.suggestedBand} @ {r.suggestedPricePerKwh.toFixed(3)}/kWh</span>
                    </div>
                    <p className="text-xs text-zinc-500">Shift {r.monthlyKwhShifted.toFixed(0)} kWh/month from <strong className="text-zinc-400">{r.currentBand}</strong> to <strong className="text-zinc-400">{r.suggestedBand}</strong></p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-lg font-bold text-green-400">{fmtCurrency(r.monthlySaving, cur)}<span className="text-xs font-normal text-zinc-600">/mo</span></p>
                    <p className="text-xs text-zinc-500">{fmtCurrency(r.annualSaving, cur)}/yr</p>
                    <p className="text-xs text-zinc-600">{r.co2ReductionKg.toFixed(1)} kg CO₂</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-300">Machine Energy Breakdown</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-800/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-zinc-400">Machine</th>
              <th className="text-right px-4 py-3 font-medium text-zinc-400">kW</th>
              <th className="text-right px-4 py-3 font-medium text-zinc-400">h/day</th>
              <th className="text-right px-4 py-3 font-medium text-zinc-400">kWh/mo</th>
              <th className="text-right px-4 py-3 font-medium text-zinc-400">Cost/mo</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-400">Band</th>
              <th className="text-center px-4 py-3 font-medium text-zinc-400">Peak?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {analysis.machines.sort((a, b) => b.monthlyCost - a.monthlyCost).map((m) => (
              <tr key={m.machineId} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-100">{m.machineName}</td>
                <td className="px-4 py-3 text-right text-zinc-300">{m.ratedPowerKw}</td>
                <td className="px-4 py-3 text-right text-zinc-300">{m.dailyHours}</td>
                <td className="px-4 py-3 text-right text-zinc-300">{m.monthlyKwh.toFixed(0)}</td>
                <td className="px-4 py-3 text-right font-semibold text-zinc-100">{fmtCurrency(m.monthlyCost, cur)}</td>
                <td className="px-4 py-3">{m.currentBand ? <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">{m.currentBand}</span> : <span className="text-zinc-600 text-xs">—</span>}</td>
                <td className="px-4 py-3 text-center">{m.isPeakOperation ? <span className="text-red-400 text-xs font-bold">YES</span> : <span className="text-zinc-700 text-xs">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
