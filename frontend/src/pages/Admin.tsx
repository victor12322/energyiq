import { useEffect, useState } from 'react';
import { Building2, Cpu, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { adminApi } from '../lib/api';
import type { AdminStats, AdminCompany } from '../types';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.stats().then((r) => setStats(r.data)),
      adminApi.companies().then((r) => setCompanies(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>Admin Overview</h1>
          <p className="text-zinc-500 text-sm">All pilot companies · EnergyIQ platform</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Pilot Companies" value={String(stats?.totalCompanies ?? 0)} Icon={Building2} color="violet" />
        <StatCard title="Total Machines" value={String(stats?.totalMachines ?? 0)} Icon={Cpu} color="blue" />
        <StatCard title="Estimated MRR" value={`$${(stats?.estimatedMrr ?? 0).toLocaleString()}`} subtitle="$299/company/month" Icon={TrendingUp} color="green" />
        <StatCard title="Total Bill Volume" value={`${((stats?.totalBillKwh ?? 0) / 1000).toFixed(0)} MWh`} Icon={Zap} color="amber" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Pilot Customers</h2>
          <span className="text-xs text-zinc-600">{companies.length} companies</span>
        </div>
        {companies.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-12">No client companies yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-800/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Company</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Email</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Currency</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">Machines</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">Bills</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">Readings</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-100">{c.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{c.email}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">{c.currency}</span></td>
                  <td className="px-4 py-3 text-right text-zinc-300">{c._count.machines}</td>
                  <td className="px-4 py-3 text-right text-zinc-300">{c._count.monthlyBills}</td>
                  <td className="px-4 py-3 text-right text-zinc-300">{c._count.meterReadings.toLocaleString()}</td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
