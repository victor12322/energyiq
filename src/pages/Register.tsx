import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', currency: 'EUR', emissionFactor: 0.4,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.register(form);
      login(data.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-brand-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">EnergyIQ</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Create account</h1>
          <p className="text-slate-500 text-sm mb-6">Register your manufacturing company</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Company name</label>
              <input id="name" type="text" required className="input" value={form.name} onChange={set('name')} placeholder="Acme Manufacturing Ltd" />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input" value={form.email} onChange={set('email')} placeholder="you@company.com" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password <span className="text-slate-400 font-normal">(min 8 chars)</span></label>
              <input id="password" type="password" required minLength={8} className="input" value={form.password} onChange={set('password')} placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="currency">Currency</label>
                <select id="currency" className="input" value={form.currency} onChange={set('currency')}>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>USD</option>
                  <option>CHF</option>
                  <option>SEK</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="ef">CO₂ factor <span className="text-slate-400 font-normal">kg/kWh</span></label>
                <input
                  id="ef" type="number" step="0.01" min="0" max="2" className="input"
                  value={form.emissionFactor}
                  onChange={(e) => setForm((p) => ({ ...p, emissionFactor: parseFloat(e.target.value) }))}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already registered?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
