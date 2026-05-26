import React, { useEffect, useState } from 'react';
import { keysApi } from '../services/api';
import { KeyMetadataDto } from '../types';
import { Button } from './ui/Button';
import { Trash2, Plus, Key as KeyIcon, Search, Edit } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

export function KeysPage() {
  const [keys, setKeys] = useState<KeyMetadataDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [keyTypes, setKeyTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchDataType, setSearchDataType] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<any>('');

  const fetchKeys = async (currentPage = page) => {
    try {
      setLoading(true);
      const params: any = { Offset: (currentPage - 1) * pageSize, Limit: pageSize };
      if (searchName.trim()) params.Name = searchName.trim();
      if (searchDataType) params.DataType = searchDataType;
      const data = await keysApi.getKeys(params);
      if (data && data.items) {
        setKeys(data.items);
        setTotalCount(data.total || 0);
      } else if (Array.isArray(data)) {
        setKeys(data);
        setTotalCount(data.length);
      } else {
        setKeys([]);
        setTotalCount(0);
      }
    } catch (e) {
      console.error(e);
      setKeys([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchKeyTypes = async () => {
    try {
      const types = await keysApi.getKeyTypes();
      setKeyTypes(Array.isArray(types) ? types.map(String) : ['text', 'number', 'boolean', 'date', 'select']);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchKeyTypes();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchKeys(1);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить этот ключ?')) {
      try {
        await keysApi.deleteKey(id);
        fetchKeys();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setNewKeyName('');
    setNewKeyType(keyTypes[0] || 'text');
    setIsModalOpen(true);
  };

  const openEditModal = (key: KeyMetadataDto) => {
    setIsEditMode(true);
    setEditingId(key.id);
    setNewKeyName(key.name);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!newKeyName.trim()) return;
    try {
      if (isEditMode && editingId) {
        await keysApi.updateKey(editingId, newKeyName);
      } else {
        await keysApi.createKey(newKeyName, newKeyType);
      }
      setIsModalOpen(false);
      setNewKeyName('');
      fetchKeys();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ключи метаданных</h2>
          <p className="text-slate-500 mt-1">Управление словарем ключей для тегирования файлов</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" /> Добавить ключ
        </Button>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Поиск ключей по имени..." 
            className="pl-9"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={searchDataType} onChange={e => setSearchDataType(e.target.value)}>
            <option value="">Все типы</option>
            {keyTypes.map((t, idx) => (
              <option key={idx} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <Button type="submit" className="w-full sm:w-auto">Найти</Button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Загрузка...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-medium text-slate-600 text-sm w-24">ID</th>
                <th className="px-6 py-4 font-medium text-slate-600 text-sm">Название ключа</th>
                <th className="px-6 py-4 font-medium text-slate-600 text-sm">Тип данных</th>
                <th className="px-6 py-4 font-medium text-slate-600 text-sm text-right w-32">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{key.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{key.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{key.dataType || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-slate-100" onClick={() => openEditModal(key)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(key.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <KeyIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p>Нет ключей для отображения</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {!loading && (keys.length > 0 || page > 1) && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white">
            <div className="text-sm text-slate-500">
              Страница {page} (Всего: {totalCount})
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                disabled={page === 1} 
                onClick={() => {
                  const newPage = Math.max(1, page - 1);
                  setPage(newPage);
                  fetchKeys(newPage);
                }}
              >
                Назад
              </Button>
              <Button 
                variant="outline"
                disabled={keys.length < pageSize}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  fetchKeys(newPage);
                }}
              >
                Вперед
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Редактировать ключ метаданных" : "Новый ключ метаданных"}
        footer={<Button onClick={handleSave}>Сохранить</Button>}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Название ключа</label>
            <Input 
              autoFocus 
              value={newKeyName} 
              onChange={e => setNewKeyName(e.target.value)} 
              placeholder="Например: Категория, Проект, Год..." 
            />
          </div>
          {!isEditMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Тип данных</label>
              <Select value={newKeyType} onChange={e => setNewKeyType(e.target.value)}>
                {keyTypes.map((t, idx) => (
                  <option key={idx} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
