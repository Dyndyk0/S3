import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { transformPassword } from '../utils/auth';
import { authApi } from '../services/api';

export function AuthPage() {
  const [userName, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [requestLog, setRequestLog] = useState<any>(null);
  const [responseLog, setResponseLog] = useState<any>(null);
  const [errorLog, setErrorLog] = useState<any>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRequestLog(null);
    setResponseLog(null);
    setErrorLog(null);

    try {
      const transformedPassword = await transformPassword(password);
      
      const payload = {
        userName,
        password: transformedPassword
      };

      setRequestLog(payload);

      const res = await authApi.register(payload);
      setResponseLog(res);
    } catch (err: any) {
      console.error(err);
      setErrorLog(err.response?.data || err.message || 'Произошла ошибка при отправке запроса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Регистрация (Тестирование)</h2>
        <p className="text-slate-500 mt-1">
          Здесь вы можете протестировать функцию преобразования пароля и отправку данных на API.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleRegister} className="space-y-4">
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
            {loading ? 'Отправка...' : 'Отправить запрос'}
          </Button>
        </form>
      </div>

      {(requestLog || responseLog || errorLog) && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden p-4 space-y-4 text-sm font-mono text-slate-300">
          {requestLog && (
            <div>
              <div className="text-blue-400 font-semibold mb-1">Отправлено (Request Payload):</div>
              <pre className="bg-black/50 p-3 rounded-md overflow-x-auto">
                {JSON.stringify(requestLog, null, 2)}
              </pre>
            </div>
          )}

          {responseLog && (
            <div>
              <div className="text-emerald-400 font-semibold mb-1">Получено (Response):</div>
              <pre className="bg-black/50 p-3 rounded-md overflow-x-auto">
                {JSON.stringify(responseLog, null, 2)}
              </pre>
            </div>
          )}

          {errorLog && (
            <div>
              <div className="text-red-400 font-semibold mb-1">Ошибка:</div>
              <pre className="bg-black/50 p-3 rounded-md overflow-x-auto text-red-200">
                {typeof errorLog === 'string' ? errorLog : JSON.stringify(errorLog, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
