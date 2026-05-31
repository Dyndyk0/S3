import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FileText, LayoutTemplate, Key as KeyIcon, Tag, Database, Activity, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout() {
  const navItems = [
    { to: '/', label: 'Файлы', icon: FileText },
    { to: '/templates', label: 'Шаблоны', icon: LayoutTemplate },
    { to: '/keys', label: 'Ключи', icon: KeyIcon },
    { to: '/values', label: 'Значения', icon: Tag },
    { to: '/minio', label: 'Файлы в MinIO', icon: Database },
    { to: '/auth', label: 'Авторизация', icon: UserPlus },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-lg">
            <Activity className="w-6 h-6" />
            <span>Files Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
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
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm flex-shrink-0 z-10">
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">API Management Panel</h1>
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
