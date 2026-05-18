import React, { useEffect, useState } from 'react';
import { minioApi } from '../services/api';
import { MinioFileDto } from '../types';
import { Database, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

export function MinioPage() {
  const [files, setFiles] = useState<MinioFileDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const data = await minioApi.getFiles();
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      // Fallback empty array on error since it's likely not implemented on backend yet or cors
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">MinIO Debug</h2>
          <p className="text-slate-500 mt-1">Просмотр физического наличия файлов в бакете (для отладки)</p>
        </div>
        <Button onClick={fetchFiles} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Обновить
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Загрузка списка из MinIO...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-medium text-slate-600 text-sm">Object Key</th>
                <th className="px-6 py-4 font-medium text-slate-600 text-sm">Size / Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((file, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-900">{file.key || JSON.stringify(file)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {file.size ? `${(file.size / 1024).toFixed(2)} KB` : '—'}
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-slate-500">
                    <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p>Нет файлов в бакете MinIO или сервис недоступен</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
