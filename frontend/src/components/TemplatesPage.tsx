import React, { useEffect, useState } from 'react';
import { templatesApi, keysApi } from '../services/api';
import { TemplateDto, KeyMetadataDto } from '../types';
import { Button } from './ui/Button';
import { Search, Trash2, Plus, LayoutTemplate, X, Edit } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

export function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [keys, setKeys] = useState<KeyMetadataDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Search
  const [searchName, setSearchName] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newKeyIds, setNewKeyIds] = useState<(number | '')[]>(['']);

  const fetchData = async () => {
    try {
      const keysData = await keysApi.getKeys();
      setKeys(Array.isArray(keysData) ? keysData : []);
      await fetchTemplates(page, searchName);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTemplates = async (currentPage: number = page, currentSearch: string = searchName) => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, pageSize };
      if (currentSearch.trim()) {
        params.search = currentSearch.trim();
        params.name = currentSearch.trim(); // Send both just in case API checks one or the other
      }
      const data = await templatesApi.getTemplates(params);
      setTemplates(data && Array.isArray(data.items) ? data.items : []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error(e);
      setTemplates([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTemplates(1, searchName);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить шаблон?')) {
      try {
        await templatesApi.deleteTemplate(id);
        fetchTemplates();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setNewTemplateName('');
    setNewKeyIds(['']);
    setIsModalOpen(true);
  };

  const openEditModal = async (template: TemplateDto) => {
    setIsEditMode(true);
    setEditingId(template.id);
    setNewTemplateName(template.name || '');
    
    // Fetch details to get keys
    try {
      const detail: any = await templatesApi.getTemplate(template.id);
      if (detail && detail.fields && detail.fields.length > 0) {
        setNewKeyIds(detail.fields.map((f: any) => f.keyId));
      } else if (detail && detail.keyIds && detail.keyIds.length > 0) {
        setNewKeyIds(detail.keyIds);
      } else {
        setNewKeyIds(['']);
      }
    } catch (e) {
      console.error("Failed to load template details", e);
      setNewKeyIds(['']);
    }
    
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!newTemplateName.trim()) return;
    const validKeys = newKeyIds.filter((k): k is number => typeof k === 'number' && !isNaN(k));
    
    try {
      if (validKeys.length === 0) return; // Prevent empty template according to API
      
      if (isEditMode && editingId) {
        await templatesApi.updateTemplate(editingId, { name: newTemplateName, keyIds: validKeys });
      } else {
        await templatesApi.createTemplate({ name: newTemplateName, keyIds: validKeys });
      }
      
      setIsModalOpen(false);
      fetchTemplates();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddKeySelect = () => {
    setNewKeyIds([...newKeyIds, '']);
  };

  const handleRemoveKeySelect = (index: number) => {
    const updated = [...newKeyIds];
    updated.splice(index, 1);
    setNewKeyIds(updated);
  };

  const handleKeySelectChange = (index: number, val: string) => {
    const updated = [...newKeyIds];
    updated[index] = val ? parseInt(val, 10) : '';
    setNewKeyIds(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Шаблоны</h2>
          <p className="text-slate-500 mt-1">Управление шаблонами метаданных</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" /> Создать шаблон
        </Button>
      </div>

      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Поиск шаблонов по имени..." 
            className="pl-9"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
        </div>
        <Button type="submit">Найти</Button>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Загрузка...</div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm w-24">ID</th>
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm">Название шаблона</th>
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm text-right w-32">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{template.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{template.name}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-slate-100" onClick={() => openEditModal(template)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                      <LayoutTemplate className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p>По вашему запросу шаблонов не найдено</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {total > 0 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Страница {page} из {Math.ceil(total / pageSize) || 1} (Всего: {total})
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    disabled={page === 1} 
                    onClick={() => {
                      const newPage = Math.max(1, page - 1);
                      setPage(newPage);
                      fetchTemplates(newPage);
                    }}
                  >
                    Назад
                  </Button>
                  <Button 
                    variant="outline"
                    disabled={page * pageSize >= total}
                    onClick={() => {
                      const newPage = page + 1;
                      setPage(newPage);
                      fetchTemplates(newPage);
                    }}
                  >
                    Вперед
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Редактировать шаблон" : "Новый шаблон"}
        footer={<Button onClick={handleSave} disabled={!newTemplateName.trim() || newKeyIds.filter(k => k !== '').length === 0}>Сохранить</Button>}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Название</label>
            <Input 
              autoFocus 
              value={newTemplateName} 
              onChange={e => setNewTemplateName(e.target.value)} 
              placeholder="Например: Договор подряда" 
            />
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Ключи метаданных шаблона</label>
            </div>
            {newKeyIds.map((keyId, index) => (
              <div key={index} className="flex gap-2 items-center mb-2">
                <Select 
                  value={keyId} 
                  onChange={e => handleKeySelectChange(index, e.target.value)}
                >
                  <option value="">Выберите ключ...</option>
                  {keys.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </Select>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="flex-shrink-0 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleRemoveKeySelect(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddKeySelect} 
              className="w-full mt-2 border-dashed flex gap-2"
            >
              <Plus className="w-3 h-3" /> Добавить ключ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
