import { useEffect, useState } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import { billsApi, tariffsApi } from '../lib/api';
import type { MonthlyBill, TariffBand } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Bills() {
  const { user } = useAuth();
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [bands, setBands] = useState<TariffBand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const now = new Date();
  const [form, setForm] = useState({
    month: now.getMonth() + 1, year: now.getFullYear(),
    totalCost: '', totalKwh: '', currency: user?.currency ?? 'EUR', notes: '',
    bandBreakdowns: [] as { bandName: string; kwh: string; cost: string }[],
  });

  const load = () => Promise.all([
    billsApi.list().then((r) => setBills(r.data)),
    tariffsApi.list().then((r) => setBands(r.data)),
  ]).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ month: now.getMonth() + 1, year: now.getFullYear(), totalCost: '', totalKwh: '', currency: user?.currency ?? 'EUR', notes: '', bandBreakdowns: bands.map((b) => ({ bandName: b.name, kwh: '', cost: '' })) });
    setError(''); setShowModal(true);
  };

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      const breakdowns = form.bandBreakdowns.filter((b) => b.kwh !== '' && b.cost !== '').map((b) => ({ bandName: b.bandName, kwh: parseFloat(b.kwh), cost: parseFloat(b.cost) }));
      await billsApi.create({ month: form.month, year: form.year, totalCost: parseFloat(form.totalCost), totalKwh: parseFloat(form.totalKwh), currency: form.currency, notes: form.notes || null, bandBreakdowns: breakdowns });
      setShowModal(false); await load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>Monthly Bills</h1>
          <p className="text-zinc-500 text-sm mt-1">{bills.length} bills · {bills.reduce((s, b) => s + b.totalKwh, 0).toLocaleString()} kWh · {bills.reduce((s, b) => s + b.totalCost, 0).toFixed(2)} {user?.currency}</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus className="h-4 w-4" /> Add bill</button>
      </div>

      {bills.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No bills yet</p>
          <button onClick={openNew} className="btn-primary mt-4">Add first bill</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-800/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Period</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">Total kWh</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">Total cost</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">Avg rate</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Breakdown</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-100">{MONTHS[bill.month - 1]} {bill.year}</td>
                  <td className="px-4 py-3 text-right text-zinc-300">{bill.totalKwh.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-zinc-100">{bill.totalCost.toFixed(2)} {bill.currency}</td>
                  <td className="px-4 py-3 text-right text-zinc-500">{bill.totalKwh > 0 ? (bill.totalCost / bill.totalKwh).toFixed(4) : '—'}</td>
                  <td className="px-4 py-3">
                    {bill.bandBreakdowns.length > 0
                      ? <div className="flex flex-wrap gap-1">{bill.bandBreakdowns.map((bd) => <span key={bd.id} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">{bd.bandName}: {bd.kwh} kWh</span>)}</div>
                      : <span className="text-zinc-600 text-xs">No breakdown</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={async () => { if (!confirm('Delete this bill?')) return; await billsApi.delete(bill.id); await load(); }} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 my-4">
            <h2 className="text-lg font-bold text-zinc-100 mb-4">Add monthly bill</h2>
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Month</label>
                  <select className="input" value={form.month} onChange={(e) => setForm((p) => ({ ...p, month: parseInt(e.target.value) }))}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <input type="number" className="input" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select className="input" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}>
                    <option>EUR</option><option>GBP</option><option>USD</option><option>CHF</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Total cost</label>
                  <input type="number" min="0" step="0.01" className="input" placeholder="0.00" value={form.totalCost} onChange={(e) => setForm((p) => ({ ...p, totalCost: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Total kWh</label>
                  <input type="number" min="0" className="input" placeholder="0" value={form.totalKwh} onChange={(e) => setForm((p) => ({ ...p, totalKwh: e.target.value }))} />
                </div>
              </div>
              {form.bandBreakdowns.length > 0 && (
                <div>
                  <label className="label">Band breakdown <span className="text-zinc-600 font-normal">(optional)</span></label>
                  <div className="space-y-2 mt-1">
                    {form.bandBreakdowns.map((bd, i) => (
                      <div key={bd.bandName} className="flex items-center gap-2">
                        <span className="text-sm text-zinc-400 w-24 flex-shrink-0">{bd.bandName}</span>
                        <input type="number" className="input flex-1" placeholder="kWh" value={bd.kwh} onChange={(e) => { const bds = [...form.bandBreakdowns]; bds[i] = { ...bds[i], kwh: e.target.value }; setForm((p) => ({ ...p, bandBreakdowns: bds })); }} />
                        <input type="number" className="input flex-1" placeholder="Cost" value={bd.cost} onChange={(e) => { const bds = [...form.bandBreakdowns]; bds[i] = { ...bds[i], cost: e.target.value }; setForm((p) => ({ ...p, bandBreakdowns: bds })); }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : 'Save bill'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
