import React, { useEffect, useState } from 'react';
import { valuesApi, keysApi } from '../services/api';
import { ValueMetadataDto, KeyMetadataDto } from '../types';
import { Button } from './ui/Button';
import { Search, Trash2, Plus, Tag, Edit } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { useAuth } from '../context/AuthContext';

export function ValuesPage() {
  const { isAdmin } = useAuth();
  const [values, setValues] = useState<ValueMetadataDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [keys, setKeys] = useState<KeyMetadataDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchName, setSearchName] = useState('');
  const [searchKeyId, setSearchKeyId] = useState('');
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newValueName, setNewValueName] = useState('');
  const [newKeyId, setNewKeyId] = useState('');

  const fetchData = async () => {
    try {
      const keysData = await keysApi.getKeys({ DataType: 'select', Limit: 1000 });
      if (keysData && (keysData as any).items) {
        setKeys((keysData as any).items);
      } else if (Array.isArray(keysData)) {
        setKeys(keysData);
      } else {
        setKeys([]);
      }
      await fetchValues();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchValues = async (currentPage = page) => {
    try {
      setLoading(true);
      const params: any = { Offset: (currentPage - 1) * pageSize, Limit: pageSize };
      if (searchName.trim()) params.Name = searchName.trim();
      if (searchKeyId) params.KeyId = parseInt(searchKeyId);
      
      const data = await valuesApi.getValues(params);
      if (data && data.items) {
        setValues(data.items);
        setTotalCount(data.total || 0);
      } else if (Array.isArray(data)) {
        setValues(data);
        setTotalCount(data.length);
      } else {
        setValues([]);
        setTotalCount(0);
      }
    } catch (e) {
      console.error(e);
      setValues([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchValues(1);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить это значение?')) {
      try {
        await valuesApi.deleteValue(id);
        fetchValues();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setNewValueName('');
    setNewKeyId('');
    setIsModalOpen(true);
  };

  const openEditModal = (val: ValueMetadataDto) => {
    setIsEditMode(true);
    setEditingId(val.id);
    setNewValueName(val.name);
    setNewKeyId(val.keyId ? val.keyId.toString() : '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!newValueName.trim() || !newKeyId.trim()) return;
    try {
      if (isEditMode && editingId) {
        await valuesApi.updateValue(editingId, newValueName); 
        // Note: The API schema provided previously (`PUT /valuemetadata`) only accepts `{ id, name }`.
        // If it also accepts `KeyId`, you might need to adjust the payload in `api.ts`.
      } else {
        await valuesApi.createValue(parseInt(newKeyId, 10), newValueName);
      }
      setIsModalOpen(false);
      setNewValueName('');
      setNewKeyId('');
      fetchValues();
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to find key name
  const getKeyName = (id?: number) => {
    if (!id) return '—';
    const k = keys.find(x => x.id === id);
    return k ? `${k.name} (ID: ${id})` : id.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Значения метаданных</h2>
          <p className="text-slate-500 mt-1">Возможные значения для тегов</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="w-4 h-4" /> Добавить значение
          </Button>
        )}
      </div>

      <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end sm:items-center">
        <div className="flex-1 w-full space-y-1">
          <label className="text-xs font-medium text-slate-500">Поиск по значению</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input 
              placeholder="Значение..." 
              className="pl-9"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full sm:w-64 space-y-1">
           <label className="text-xs font-medium text-slate-500">Фильтр по ключу</label>
           <Select value={searchKeyId} onChange={e => setSearchKeyId(e.target.value)}>
             <option value="">Все ключи</option>
             {keys.map(k => (
               <option key={k.id} value={k.id}>{k.name}</option>
             ))}
           </Select>
        </div>
        <Button type="submit" className="w-full sm:w-auto mt-4 sm:mt-0">Найти</Button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Загрузка...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 font-medium text-slate-600 text-sm w-24">ID</th>
                <th className="px-6 py-4 font-medium text-slate-600 text-sm w-1/3">Ключ</th>
                <th className="px-6 py-4 font-medium text-slate-600 text-sm">Значение</th>
                <th className="px-6 py-4 font-medium text-slate-600 text-sm text-right w-32">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {values.map((val) => (
                <tr key={val.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{val.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-[15rem] truncate" title={getKeyName(val.keyId)}>{getKeyName(val.keyId)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-sm truncate" title={val.name}>{val.name}</td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-slate-100" onClick={() => openEditModal(val)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(val.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {values.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p>Нет значений для отображения</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        
        {!loading && (values.length > 0 || page > 1) && (
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
                  fetchValues(newPage);
                }}
              >
                Назад
              </Button>
              <Button 
                variant="outline"
                disabled={values.length < pageSize}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  fetchValues(newPage);
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
        title={isEditMode ? "Редактировать значение метаданных" : "Новое значение метаданных"}
        footer={<Button onClick={handleSave} disabled={!newValueName.trim() || !newKeyId}>Сохранить</Button>}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Ключ</label>
            <Select value={newKeyId} onChange={e => setNewKeyId(e.target.value)} disabled={isEditMode}>
               <option value="">Выберите ключ...</option>
               {keys.map(k => (
                 <option key={k.id} value={k.id}>{k.name}</option>
               ))}
            </Select>
            {isEditMode && <p className="text-xs text-slate-400 mt-1">Редактирование ключа не поддерживается API.</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Значение</label>
            <Input 
              value={newValueName} 
              onChange={e => setNewValueName(e.target.value)} 
              placeholder="Например: Отчет..." 
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
