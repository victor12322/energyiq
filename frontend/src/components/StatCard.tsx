import type { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  Icon: LucideIcon;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'violet';
  trend?: { value: number; suffix?: string };
}

const colorMap = {
  blue:   { icon: 'text-blue-400',   ring: 'border-blue-500/20  bg-blue-500/10'  },
  green:  { icon: 'text-green-400',  ring: 'border-green-500/20 bg-green-500/10' },
  amber:  { icon: 'text-amber-400',  ring: 'border-amber-500/20 bg-amber-500/10' },
  red:    { icon: 'text-red-400',    ring: 'border-red-500/20   bg-red-500/10'   },
  violet: { icon: 'text-violet-400', ring: 'border-violet-500/20 bg-violet-500/10'},
};

export default function StatCard({ title, value, subtitle, Icon, color = 'blue', trend }: Props) {
  const c = colorMap[color];
  return (
    <div className="card p-5 flex gap-4">
      <div className={`${c.ring} border rounded-xl p-3 h-fit flex-shrink-0`}>
        <Icon className={`${c.icon} h-6 w-6`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-zinc-500 font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-zinc-100 mt-0.5 truncate">{value}</p>
        {subtitle && <p className="text-xs text-zinc-600 mt-0.5 truncate">{subtitle}</p>}
        {trend !== undefined && (
          <p className={`text-xs font-medium mt-1 ${trend.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value).toFixed(1)}{trend.suffix ?? '%'}
          </p>
        )}
      </div>
    </div>
  );
}
