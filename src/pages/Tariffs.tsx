import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Zap } from 'lucide-react';
import { tariffsApi } from '../lib/api';
import type { TariffBand } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

type FormState = Omit<TariffBand, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>;
const blank: FormState = { name: '', pricePerKwh: 0, startHour: 0, endHour: 8, color: '#22c55e' };
const PALETTE = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

function fmtHour(h: number) { return `${String(h).padStart(2, '0')}:00`; }

export default function Tariffs() {
  const [bands, setBands] = useState<TariffBand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TariffBand | null>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => tariffsApi.list().then((r) => setBands(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(blank); setError(''); setShowModal(true); };
  const openEdit = (b: TariffBand) => {
    setEditing(b);
    setForm({ name: b.name, pricePerKwh: b.pricePerKwh, startHour: b.startHour, endHour: b.endHour, color: b.color ?? '#22c55e' });
    setError(''); setShowModal(true);
  };

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      if (editing) await tariffsApi.update(editing.id, form);
      else await tariffsApi.create(form);
      setShowModal(false); await load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tariff band?')) return;
    await tariffsApi.delete(id); await load();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>Tariff Bands</h1>
          <p className="text-zinc-500 text-sm mt-1">Define your energy pricing structure — peak, mid-peak, off-peak, etc.</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus className="h-4 w-4" /> Add band</button>
      </div>

      {bands.length === 0 ? (
        <div className="card p-12 text-center">
          <Zap className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 font-medium">No tariff bands configured</p>
          <button onClick={openNew} className="btn-primary mt-4">Add tariff band</button>
        </div>
      ) : (
        <>
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-zinc-300 mb-4">24-hour Rate Timeline</h2>
            <div className="flex rounded-lg overflow-hidden h-8">
              {Array.from({ length: 24 }, (_, h) => {
                const band = bands.find((b) => b.startHour < b.endHour ? h >= b.startHour && h < b.endHour : h >= b.startHour || h < b.endHour);
                return <div key={h} title={`${fmtHour(h)} — ${band?.name ?? 'no band'}`} className="flex-1 border-r border-zinc-950/30 last:border-r-0" style={{ background: band?.color ?? '#27272a' }} />;
              })}
            </div>
            <div className="flex justify-between text-xs text-zinc-600 mt-1">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {bands.map((b) => (
                <div key={b.id} className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: b.color ?? '#52525b' }} />
                  {b.name}
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-800/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-zinc-400">Band name</th>
                  <th className="text-right px-4 py-3 font-medium text-zinc-400">Price/kWh</th>
                  <th className="text-center px-4 py-3 font-medium text-zinc-400">Hours</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {bands.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: b.color ?? '#52525b' }} />
                        <span className="font-medium text-zinc-100">{b.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-zinc-100">{b.pricePerKwh.toFixed(4)}</td>
                    <td className="px-4 py-3 text-center text-zinc-300">
                      {fmtHour(b.startHour)} → {fmtHour(b.endHour)}
                      {b.startHour > b.endHour && <span className="text-xs text-zinc-600 ml-1">(wraps midnight)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(b)} className="p-1.5 text-zinc-600 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-zinc-100 mb-4">{editing ? 'Edit tariff band' : 'New tariff band'}</h2>
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="label">Band name</label>
                <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. peak, off-peak" />
              </div>
              <div>
                <label className="label">Price per kWh</label>
                <input type="number" min="0" step="0.001" className="input" value={form.pricePerKwh} onChange={(e) => setForm((p) => ({ ...p, pricePerKwh: parseFloat(e.target.value) }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start hour (0–23)</label>
                  <input type="number" min="0" max="23" className="input" value={form.startHour} onChange={(e) => setForm((p) => ({ ...p, startHour: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">End hour (0–23)</label>
                  <input type="number" min="0" max="23" className="input" value={form.endHour} onChange={(e) => setForm((p) => ({ ...p, endHour: parseInt(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="label">Colour</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {PALETTE.map((c) => (
                    <button key={c} type="button" onClick={() => setForm((p) => ({ ...p, color: c }))} className={`h-8 w-8 rounded-lg transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-zinc-400 scale-110' : ''}`} style={{ background: c }} />
                  ))}
                </div>
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
