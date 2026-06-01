import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { transformPassword } from '../utils/auth';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function AuthPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [userName, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLog, setActionLog] = useState<{type: string, data: any} | null>(null);

  useEffect(() => {
    if (user) {
       setCurrentUser(user.name);
    } else {
       setCurrentUser(null);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setActionLog(null);

    try {
      const transformedPassword = await transformPassword(password);
      const payload = { userName, password: transformedPassword };
      const res = await authApi.login(payload);
      setActionLog({ type: 'success', data: res });
      await refreshUser();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setActionLog({ type: 'error', data: err.response?.data || err.message || 'Ошибка входа' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setActionLog(null);
    try {
      await authApi.logout();
      setActionLog({ type: 'success', data: 'Успешный выход' });
      await refreshUser();
    } catch (err: any) {
      setActionLog({ type: 'error', data: 'Ошибка выхода' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Аккаунт</h2>
        <p className="text-slate-500 mt-1">
          Вход в систему и проверка текущего статуса.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
           <p className="text-sm font-medium text-slate-500 mb-1">Статус авторизации:</p>
           {currentUser ? (
             <p className="text-lg font-semibold text-emerald-600">В сети: {currentUser}</p>
           ) : (
             <p className="text-lg font-semibold text-slate-500">Не авторизован</p>
           )}
        </div>
        {currentUser && (
           <Button variant="outline" onClick={handleLogout} disabled={loading}>
             Выйти из аккаунта
           </Button>
        )}
      </div>

      {!currentUser && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Имя пользователя (Логин)</label>
              <Input 
                value={userName}
                onChange={e => setUsername(e.target.value)}
                placeholder="Введите логин..."
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Пароль</label>
              <Input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль..."
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Отправка...' : 'Войти'}
            </Button>
          </form>
        </div>
      )}

      {actionLog && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden p-4 space-y-4 text-sm font-mono text-slate-300">
           <div>
              <div className={`font-semibold mb-1 ${actionLog.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                {actionLog.type === 'error' ? 'Ошибка:' : 'Ответ:'}
              </div>
              <pre className="bg-black/50 p-3 rounded-md overflow-x-auto">
                {typeof actionLog.data === 'string' ? actionLog.data : JSON.stringify(actionLog.data, null, 2)}
              </pre>
           </div>
        </div>
      )}
    </div>
  );
}
