import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PageTransition from '../components/PageTransition';
import {
  IconDashboard,
  IconUserPlus,
  IconUsers,
  IconQr,
  IconCalendar,
  IconCard,
  IconPrint,
  IconUpload,
  IconShield,
  IconSettings,
  IconLogout,
  IconSun,
  IconMoon,
} from '../components/ui/Icons';
import { IconStar } from '../components/ui/Icons';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/register', label: 'Registration', icon: IconUserPlus },
  { to: '/guests', label: 'Guest Registration', icon: IconUserPlus },
  { to: '/participants', label: 'Participants', icon: IconUsers },
  { to: '/verify', label: 'QR Verify', icon: IconQr },
  { to: '/attendance', label: 'Attendance', icon: IconCalendar },
  { to: '/card-layout', label: 'Card Layout', icon: IconCard },
];

const adminItems = [
  { to: '/bulk-members', label: 'Bulk Members', icon: IconUpload },
  { to: '/honorary-guests', label: 'Honorary Guests', icon: IconStar },
  { to: '/bulk-print', label: 'Bulk Print', icon: IconPrint },
  { to: '/import', label: 'Bulk Import', icon: IconUpload },
  { to: '/audit', label: 'Audit Logs', icon: IconShield },
  { to: '/settings', label: 'Settings', icon: IconSettings },
];

const DashboardLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, toggleDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'nav-link-active' : ''}`;

  return (
    <div className="min-h-screen flex mesh-bg">
      <aside className="hidden md:flex w-64 flex-col shrink-0 bg-sidebar text-white shadow-xl">
        <div className="relative overflow-hidden border-b border-white/10 p-6">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-dark font-display text-lg font-bold text-navy shadow-glow">
              IIA
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-gold">IIA Event</h1>
              <p className="text-[11px] uppercase tracking-widest text-slate-400">
                ID Card & QR
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${linkClass({ isActive })} animate-slide-in-left`
              }
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="my-4 border-t border-white/10 pt-4">
                <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Admin
                </p>
              </div>
              {adminItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <item.icon />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-3 backdrop-blur-sm">
            <p className="font-semibold text-sm truncate">{user?.name}</p>
            <span className="badge-gold mt-1 capitalize">{user?.role}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs font-medium text-slate-300 transition-all duration-200 hover:border-gold/40 hover:bg-white/5 hover:text-gold"
            >
              <IconLogout />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-header sticky top-0 z-40 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="md:hidden flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-sm font-bold text-gold">
                IIA
              </div>
              <span className="font-display font-bold text-navy dark:text-gold text-sm">
                IIA Event
              </span>
            </div>
            <p className="hidden md:block text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-navy dark:text-gold">
                Indian Industries Association
              </span>
              <span className="mx-2 text-gold">·</span>
              Annual Industrial Meet 2026
            </p>
            <button
              type="button"
              onClick={toggleDark}
              className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/60 px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-300 hover:border-gold/50 hover:shadow-soft dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300"
              aria-label="Toggle theme"
            >
              {darkMode ? <IconSun /> : <IconMoon />}
              <span className="hidden sm:inline">{darkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

        <nav className="md:hidden flex gap-1 overflow-x-auto border-b border-slate-200/60 bg-navy px-2 py-2 text-white dark:border-slate-700">
          {[...navItems, ...(isAdmin ? adminItems : [])].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  isActive ? 'bg-gold text-navy' : 'bg-white/10 text-slate-200'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
