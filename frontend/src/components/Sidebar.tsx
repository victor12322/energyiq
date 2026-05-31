import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, FileText, Zap, BarChart3,
  FileDown, ShieldCheck, LogOut, Activity,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/machines',  Icon: Cpu,             label: 'Machines'  },
  { to: '/tariffs',   Icon: Zap,             label: 'Tariffs'   },
  { to: '/bills',     Icon: FileText,        label: 'Bills'     },
  { to: '/analysis',  Icon: BarChart3,       label: 'Analysis'  },
  { to: '/reports',   Icon: FileDown,        label: 'Reports'   },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r border-zinc-800" style={{ background: '#09090b' }}>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-800">
        <div className="h-7 w-7 rounded-lg bg-green-500 flex items-center justify-center">
          <Activity className="h-4 w-4 text-black" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: 'Space Grotesk, system-ui, sans-serif' }}>
          EnergyIQ
        </span>
      </div>

      {/* Company */}
      <div className="px-5 py-4 border-b border-zinc-800">
        <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium">Company</p>
        <p className="text-sm text-zinc-100 font-medium mt-1 truncate">{user?.name}</p>
        <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-500 text-black'
                  : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 ${
                isActive
                  ? 'bg-violet-500 text-white'
                  : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`
            }
          >
            <ShieldCheck className="h-4 w-4 flex-shrink-0" />
            Admin
          </NavLink>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-zinc-800">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-800/60 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
