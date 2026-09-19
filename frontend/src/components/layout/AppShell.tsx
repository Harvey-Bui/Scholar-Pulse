import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Pulse, SquaresFour, CalendarBlank, Books, CheckSquareOffset, CalendarDots,
  ChartLineUp, Target, UserGear, Moon, Sun, SignOut,
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { settingsApi } from '../../api/resources';
import { NotificationBell } from '../notifications/NotificationBell';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: SquaresFour, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarBlank },
  { to: '/courses', label: 'Courses', icon: Books },
  { to: '/tasks', label: 'Tasks', icon: CheckSquareOffset },
  { to: '/sessions', label: 'Sessions', icon: CalendarDots },
  { to: '/analytics', label: 'Analytics', icon: ChartLineUp },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/settings', label: 'Settings', icon: UserGear },
];

const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export function AppShell() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const isDay = user?.theme === 'DAY';

  useEffect(() => {
    document.documentElement.dataset.theme = isDay ? 'day' : 'night';
  }, [isDay]);

  const toggleTheme = async () => {
    const next = isDay ? 'NIGHT' : 'DAY';
    const updated = await settingsApi.updateTheme(next);
    setUser(updated);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg text-text font-body text-sm">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-6 px-8 py-4 bg-bg border-b border-divider">
        <div className="flex items-center gap-3 mr-auto">
          <span className="grid place-items-center w-7 h-7 rounded-md border border-accent-600 text-accent-300">
            <Pulse size={16} />
          </span>
          <span className="font-heading font-medium text-base tracking-tight">Scholar Pulse</span>
          <span className="text-neutral-600 text-xs hidden sm:inline">{todayLabel}</span>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 min-h-9 rounded-md text-[13px] cursor-pointer border ${
                  isActive
                    ? 'bg-accent-900 text-accent-200 border-accent-700'
                    : 'bg-transparent text-neutral-400 border-transparent hover:bg-accent-900 hover:text-accent-200'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
          <NotificationBell />
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="grid place-items-center w-9 h-9 rounded-md bg-transparent text-neutral-400 border border-divider cursor-pointer hover:text-accent-300 hover:border-accent-700"
          >
            {isDay ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button
            type="button"
            aria-label="Log out"
            onClick={handleLogout}
            className="grid place-items-center w-9 h-9 rounded-md bg-transparent text-neutral-400 border border-divider cursor-pointer hover:text-accent-300 hover:border-accent-700"
          >
            <SignOut size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-8 pb-16 pt-8">
        <Outlet />
      </div>
    </div>
  );
}
