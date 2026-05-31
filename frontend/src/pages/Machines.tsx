import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Cpu } from 'lucide-react';
import { machinesApi, tariffsApi } from '../lib/api';
import type { Machine, TariffBand } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

type FormState = Omit<Machine, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>;
const blank: FormState = { name: '', ratedPowerKw: 0, dailyHours: 0, tariffBandName: null, description: null };

export default function Machines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [bands, setBands] = useState<TariffBand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    Promise.all([
      machinesApi.list().then((r) => setMachines(r.data)),
      tariffsApi.list().then((r) => setBands(r.data)),
    ]).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(blank); setError(''); setShowModal(true); };
  const openEdit = (m: Machine) => {
    setEditing(m);
    setForm({ name: m.name, ratedPowerKw: m.ratedPowerKw, dailyHours: m.dailyHours, tariffBandName: m.tariffBandName, description: m.description });
    setError(''); setShowModal(true);
  };

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      if (editing) await machinesApi.update(editing.id, form);
      else await machinesApi.create(form);
      setShowModal(false); await load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this machine?')) return;
    await machinesApi.delete(id); await load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>Machines</h1>
          <p className="text-zinc-500 text-sm mt-1">{machines.length} machines · {machines.reduce((s, m) => s + m.ratedPowerKw * m.dailyHours * 30, 0).toLocaleString()} kWh estimated/month</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus className="h-4 w-4" /> Add machine</button>
      </div>

      {machines.length === 0 ? (
        <div className="card p-12 text-center">
          <Cpu className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No machines yet</p>
          <button onClick={openNew} className="btn-primary mt-4">Add machine</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-800/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Machine</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">Rated power</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">Daily hours</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-400">kWh/month</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-400">Tariff band</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {machines.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-100">{m.name}</p>
                    {m.description && <p className="text-xs text-zinc-600 mt-0.5">{m.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-300">{m.ratedPowerKw} kW</td>
                  <td className="px-4 py-3 text-right text-zinc-300">{m.dailyHours} h</td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-100">{Math.round(m.ratedPowerKw * m.dailyHours * 30).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {m.tariffBandName
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">{m.tariffBandName}</span>
                      : <span className="text-zinc-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => openEdit(m)} className="p-1.5 text-zinc-600 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-zinc-100 mb-4">{editing ? 'Edit machine' : 'New machine'}</h2>
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="label">Machine name</label>
                <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. CNC Milling Centre" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Rated power (kW)</label>
                  <input type="number" min="0.01" step="0.1" className="input" value={form.ratedPowerKw} onChange={(e) => setForm((p) => ({ ...p, ratedPowerKw: parseFloat(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Daily hours</label>
                  <input type="number" min="0.01" max="24" step="0.5" className="input" value={form.dailyHours} onChange={(e) => setForm((p) => ({ ...p, dailyHours: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="label">Operating tariff band</label>
                <select className="input" value={form.tariffBandName ?? ''} onChange={(e) => setForm((p) => ({ ...p, tariffBandName: e.target.value || null }))}>
                  <option value="">— Not assigned —</option>
                  {bands.map((b) => <option key={b.id} value={b.name}>{b.name} ({b.pricePerKwh.toFixed(3)}/kWh)</option>)}
                </select>
              </div>
              <div>
                <label className="label">Description <span className="text-zinc-600 font-normal">(optional)</span></label>
                <input className="input" value={form.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value || null }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
