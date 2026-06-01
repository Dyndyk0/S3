import React, { useEffect, useState } from 'react';
import { filesApi } from '../services/api';
import { FileDto } from '../types';
import { Button } from './ui/Button';
import { format } from 'date-fns';
import { Trash2, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function TrashPage() {
  const { isAdmin } = useAuth();
  const [files, setFiles] = useState<FileDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await filesApi.getFiles({ VisibleDeleted: true, Limit: 1000 });
      if (data && (data as any).items) {
        setFiles((data as any).items);
      } else if (Array.isArray(data)) {
        setFiles(data);
      } else {
        setFiles([]);
      }
    } catch (e) {
      console.error(e);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('ВНИМАНИЕ! Вы уверены, что хотите НАВСЕГДА удалить файл? (Только для администраторов)')) {
      try {
        await filesApi.deleteFile(id);
        fetchFiles();
      } catch (e: any) {
        console.error(e);
        alert(e.response?.data || 'Ошибка при удалении. Возможно, нет прав администратора.');
      }
    }
  };

  const handleRestore = async (id: number) => {
    try {
        await filesApi.patchFileStatus(id, false);
        fetchFiles();
    } catch (e: any) {
        console.error(e);
        alert('Ошибка при восстановлении.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Корзина</h2>
        <p className="text-slate-500 mt-1">Удаленные файлы (безвозвратное удаление доступно только администраторам)</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm">ID</th>
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm">Имя файла</th>
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm">Дата удаления/обновления</th>
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{file.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{file.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {file.lastUpdated ? format(new Date(file.lastUpdated), 'dd.MM.yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50" onClick={() => handleRestore(file.id)}>
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          Восстановить
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(file.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Удалить навсегда
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {files.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p>Корзина пуста</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
