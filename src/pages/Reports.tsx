import { useState } from 'react';
import { FileDown, CheckCircle, AlertCircle } from 'lucide-react';
import { reportsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDownload = async () => {
    setLoading(true); setStatus('idle');
    try {
      const response = await reportsApi.downloadPdf();
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `energyiq-report-${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      setStatus('success');
    } catch { setStatus('error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>Reports</h1>
        <p className="text-zinc-500 text-sm mt-1">Generate branded PDF reports for {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileDown className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Energy Efficiency Report</h2>
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                A professional PDF covering your full energy analysis: machine breakdown, prioritised
                recommendations, estimated savings, and CO₂ reduction — ready for management or investors.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm text-zinc-400">
            {['Company details and report date', 'Executive summary (spend, savings, CO₂)', 'Ranked recommendations with savings figures', 'Machine-by-machine energy breakdown', 'EnergyIQ branding with page numbers'].map((f) => (
              <p key={f} className="flex items-center gap-2"><span className="text-green-500">✓</span> {f}</p>
            ))}
          </div>

          <div className="mt-6">
            {status === 'success' && (
              <div className="flex items-center gap-2 text-green-400 text-sm mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="h-4 w-4" /> Report downloaded successfully.
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4" /> Failed to generate report. Ensure you have machines and tariff bands configured.
              </div>
            )}
            <button onClick={handleDownload} disabled={loading} className="btn-primary w-full justify-center py-3">
              <FileDown className="h-4 w-4" />
              {loading ? 'Generating PDF…' : 'Download PDF Report'}
            </button>
          </div>
        </div>

        <div className="card p-6 bg-zinc-900/50">
          <h2 className="text-base font-semibold text-zinc-100 mb-4">How reports work</h2>
          <div className="space-y-4 text-sm">
            {[
              { title: 'Real-time analysis', body: 'Each report is generated fresh from your current machine and tariff data — no stale snapshots.' },
              { title: 'Configurable emission factor', body: `CO₂ figures use your configured grid factor (${user?.emissionFactor} kg/kWh). Update it in account settings.` },
              { title: 'Investor-ready', body: 'Reports are structured to demonstrate the ROI of the EnergyIQ platform to pilot customers and investors.' },
            ].map((item) => (
              <div key={item.title}>
                <p className="font-medium text-zinc-300">{item.title}</p>
                <p className="mt-0.5 text-zinc-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
