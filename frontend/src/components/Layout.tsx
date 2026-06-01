import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FileText, LayoutTemplate, Key as KeyIcon, Tag, Database, Activity, UserPlus, Users, Trash2, Moon, Sun, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate, location]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const navItems = [
    { to: '/', label: 'Файлы', icon: FileText, show: true },
    { to: '/templates', label: 'Шаблоны', icon: LayoutTemplate, show: true },
    { to: '/keys', label: 'Ключи', icon: KeyIcon, show: true },
    { to: '/values', label: 'Значения', icon: Tag, show: true },
    { to: '/trash', label: 'Корзина', icon: Trash2, show: true },
    { to: '/users', label: 'Пользователи', icon: Users, show: isAdmin },
    { to: '/minio', label: 'Файлы в MinIO', icon: Database, show: true },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm flex-shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-lg">
            <Activity className="w-6 h-6" />
            <span>Files Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.filter(item => item.show).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden hidden-scrollbar">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0 z-10">
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">API Management Panel</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <NavLink to="/auth" className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                <div className="text-sm font-medium text-slate-600 hidden sm:block">
                  {user.name}
                  <span className={cn("ml-2 px-2 py-0.5 rounded-full text-xs font-semibold", isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600")}>
                    {isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>
              </NavLink>
            ) : (
              <NavLink to="/auth" className="flex items-center gap-2 hover:bg-slate-50 p-1.5 px-3 rounded-lg transition-colors border border-slate-200">
                <LogOut className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-600">Войти</span>
              </NavLink>
            )}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
                title={isDark ? 'Включить светлую тему' : 'Включить темную тему'}
              >
                {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="w-full h-full">
             <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
