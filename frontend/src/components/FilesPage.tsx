import React, { useEffect, useState, useMemo } from 'react';
import { filesApi, templatesApi, valuesApi, keysApi } from '../services/api';
import { FileDto, TemplateDto, TemplateDetailDto, ValueMetadataDto, KeyMetadataDto } from '../types';
import { Button } from './ui/Button';
import { format } from 'date-fns';
import { Download, Trash2, Search, Plus, FileUp, ExternalLink, ArrowUpDown, ArrowDown, ArrowUp, Settings2, X, Edit } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

export function FilesPage() {
  const [files, setFiles] = useState<FileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Search & Filter
  const [searchName, setSearchName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tagSearches, setTagSearches] = useState<string[]>([]);
  const [currentTagSearch, setCurrentTagSearch] = useState('');
  
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [currentSelectedTagId, setCurrentSelectedTagId] = useState<string>('');

  // Sort
  const [sortBy, setSortBy] = useState<string>('lastupdated');
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  // Column visibility
  const [showUploadDate, setShowUploadDate] = useState(true);
  const [showUpdateDate, setShowUpdateDate] = useState(true);

  // values and keys for metadata form rendering
  const [allValues, setAllValues] = useState<ValueMetadataDto[]>([]);
  const [keys, setKeys] = useState<KeyMetadataDto[]>([]);

  // Init file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Edit file
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileDto | null>(null);

  // Select template flow
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateDetails, setTemplateDetails] = useState<any>(null);
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const fetchData = async () => {
    try {
      const [t, v, k] = await Promise.all([
        templatesApi.getTemplates(),
        valuesApi.getValues(),
        keysApi.getKeys()
      ]);
      setTemplates(t && Array.isArray(t.items) ? t.items : []);
      setAllValues(Array.isArray(v) ? v : []);
      setKeys(Array.isArray(k) ? k : []);
      await fetchFiles(sortBy, sortDesc);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFiles = async (currentSortBy = sortBy, currentSortDesc = sortDesc) => {
    try {
      setLoading(true);
      const params: any = {};
      
      // We apply standard filters
      if (dateFrom) params.DateFrom = new Date(dateFrom).toISOString();
      if (dateTo) params.DateTo = new Date(dateTo).toISOString();
      if (currentSortBy) params.SortBy = currentSortBy.toLowerCase();
      params.SortDescending = currentSortDesc;
      
      if (tagSearches.length > 0) {
        params.TagsJson = JSON.stringify(tagSearches.map(val => ({ Value: val })));
      }
      if (selectedTagIds.length > 0) {
        params.TagIds = selectedTagIds;
      }

      const data = await filesApi.getFiles(params);
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Only on mount

  const handleAddTagSearch = () => {
    if (currentTagSearch.trim() && !tagSearches.includes(currentTagSearch.trim())) {
      setTagSearches([...tagSearches, currentTagSearch.trim()]);
      setCurrentTagSearch('');
    }
  };

  const handleRemoveTagSearch = (val: string) => {
    setTagSearches(tagSearches.filter(t => t !== val));
  };

  const handleAddTagId = (val: string) => {
    if (!val) return;
    const id = parseInt(val, 10);
    if (!selectedTagIds.includes(id)) {
      setSelectedTagIds([...selectedTagIds, id]);
    }
    setCurrentSelectedTagId('');
  };

  const handleRemoveTagId = (id: number) => {
    setSelectedTagIds(selectedTagIds.filter(t => t !== id));
  };

  const applySort = (column: string) => {
    let newDesc = sortDesc;
    if (sortBy === column) {
      newDesc = !sortDesc;
    } else {
      newDesc = (column === 'lastupdated' || column === 'dateupload');
    }
    setSortBy(column);
    setSortDesc(newDesc);
    fetchFiles(column, newDesc);
  };

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 ml-1 inline text-slate-300" />;
    return sortDesc ? <ArrowDown className="w-3 h-3 ml-1 inline text-indigo-500" /> : <ArrowUp className="w-3 h-3 ml-1 inline text-indigo-500" />;
  };

  const valuesByKey = useMemo(() => {
    const map = new Map<number, ValueMetadataDto[]>();
    allValues.forEach(v => {
      if (v.keyId) {
        if (!map.has(v.keyId)) map.set(v.keyId, []);
        map.get(v.keyId)!.push(v);
      }
    });
    return map;
  }, [allValues]);

  const activeKeyIds = useMemo<number[]>(() => {
    if (selectedTemplateId) {
      if (templateDetails?.fields && templateDetails.fields.length > 0) {
        return templateDetails.fields.map((f: any) => f.keyId);
      }
      if (templateDetails?.keyIds && templateDetails.keyIds.length > 0) {
        return templateDetails.keyIds;
      }
      return [];
    }
    // If no template is selected, show keys for whatever values we ALREADY have selected
    return Object.keys(selectedValues).map(Number).filter(k => !isNaN(k) && k > 0);
  }, [selectedTemplateId, templateDetails, selectedValues]);

  // Load template details when selectedTemplateId changes
  useEffect(() => {
    const loadTemplate = async () => {
      if (!selectedTemplateId) {
        setTemplateDetails(null);
        setSelectedValues({});
        return;
      }
      try {
        setLoadingTemplate(true);
        const data = await templatesApi.getTemplate(parseInt(selectedTemplateId));
        setTemplateDetails(data);
        setSelectedValues({}); // reset
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingTemplate(false);
      }
    };
    loadTemplate();
  }, [selectedTemplateId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить файл?')) {
      try {
        await filesApi.deleteFile(id);
        fetchFiles();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const openEditModal = (file: FileDto) => {
    setEditingFile(file);
    setSelectedFile(null); // clear any selected file
    
    // Extract name without extension if possible
    const lastDot = file.name.lastIndexOf('.');
    setCustomFileName(lastDot !== -1 ? file.name.substring(0, lastDot) : file.name);
    
    // By default, let's just prefill tags we know about
    const initVals: Record<number, number> = {};
    if (file.tags) {
      file.tags.forEach(t => {
        if (t.valueId && t.keyId) {
          initVals[t.keyId] = t.valueId;
        }
      });
    }
    setSelectedValues(initVals);
    setSelectedTemplateId('');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingFile(null);
    setSelectedFile(null);
    setCustomFileName('');
    setSelectedTemplateId('');
    setSelectedValues({});
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const valueIdsArray = Object.values(selectedValues).filter(Boolean);
    try {
      setUploading(true);
      const nameToSend = customFileName.trim() || selectedFile.name;
      const lastDot = selectedFile.name.lastIndexOf('.');
      const fileExt = lastDot !== -1 ? selectedFile.name.substring(lastDot + 1) : '';

      const result = await filesApi.initFile({ 
        fileName: nameToSend, 
        fileExtension: fileExt,
        valueIds: valueIdsArray 
      });
      
      // Upload directly to MinIO
      await fetch(result.uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream'
        }
      });

      closeInitModal();
      fetchFiles();
    } catch (e) {
      console.error(e);
      alert('Ошибка при загрузке файла');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingFile) return;
    const valueIdsArray = Object.values(selectedValues).filter(Boolean);
    try {
      setUploading(true);
      const payload: any = { valueIds: valueIdsArray };
      
      if (customFileName.trim()) {
        payload.fileName = customFileName.trim();
      }

      if (selectedFile) {
        payload.updateFile = true;
        const lastDot = selectedFile.name.lastIndexOf('.');
        if (lastDot !== -1) {
          payload.fileExtension = selectedFile.name.substring(lastDot + 1);
        }
      }
      
      const result = await filesApi.updateFile(editingFile.id, payload);
      
      if (result.uploadUrl && selectedFile) {
        await fetch(result.uploadUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': selectedFile.type || 'application/octet-stream'
          }
        });
      }

      closeEditModal();
      fetchFiles();
    } catch (e) {
      console.error(e);
      alert('Ошибка при редактировании файла');
    } finally {
      setUploading(false);
    }
  };

  const closeInitModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setCustomFileName('');
    setSelectedTemplateId('');
    setSelectedValues({});
  };

  // Local name filter (as the API may lack direct local name search, per original spec)
  const filteredFiles = files.filter(f => 
    f.name && f.name.toLowerCase().includes(searchName.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Файлы</h2>
          <p className="text-slate-500 mt-1">Управление файлами и их метаданными</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="gap-2 text-slate-600">
            <Settings2 className="w-4 h-4" /> Настройка колонок
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Добавить файл
          </Button>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-6 text-sm mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showUploadDate} onChange={e => setShowUploadDate(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-slate-700">Показывать "Дата загрузки"</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showUpdateDate} onChange={e => setShowUpdateDate(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-slate-700">Показывать "Дата обновления"</span>
          </label>
        </div>
      )}

      <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="text-sm font-medium text-slate-800">Параметры фильтрации</div>
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center flex-wrap">
          <div className="w-full md:w-48 space-y-1">
             <label className="text-xs font-medium text-slate-500">Фрагмент имени (локально)</label>
             <div className="relative">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <Input 
                 placeholder="report.pdf..." 
                 className="pl-9"
                 value={searchName}
                 onChange={e => setSearchName(e.target.value)}
               />
             </div>
          </div>
          <div className="w-full md:w-32 space-y-1">
             <label className="text-xs font-medium text-slate-500">Дата от</label>
             <Input 
               type="date"
               value={dateFrom}
               onChange={e => setDateFrom(e.target.value)}
             />
          </div>
          <div className="w-full md:w-32 space-y-1">
             <label className="text-xs font-medium text-slate-500">Дата до</label>
             <Input 
               type="date"
               value={dateTo}
               onChange={e => setDateTo(e.target.value)}
             />
          </div>
          <div className="w-full md:w-64 space-y-1">
             <label className="text-xs font-medium text-slate-500">Фрагменты тега (API)</label>
             <div className="flex gap-2">
               <Input 
                  placeholder="Текст значения..." 
                  value={currentTagSearch}
                  onChange={e => setCurrentTagSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTagSearch(); } }}
               />
               <Button type="button" variant="outline" onClick={handleAddTagSearch}>+</Button>
             </div>
             {tagSearches.length > 0 && (
               <div className="flex flex-wrap gap-1 mt-1">
                 {tagSearches.map((ts, idx) => (
                   <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                     {ts}
                     <button type="button" onClick={() => handleRemoveTagSearch(ts)} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                   </span>
                 ))}
               </div>
             )}
          </div>
          <div className="w-full md:w-64 space-y-1">
             <label className="text-xs font-medium text-slate-500">Точные теги (API)</label>
             <Select value={currentSelectedTagId} onChange={e => handleAddTagId(e.target.value)}>
               <option value="">Добавить тег...</option>
               {allValues.filter(v => !selectedTagIds.includes(v.id)).map(v => (
                 <option key={v.id} value={v.id}>{v.name}</option>
               ))}
             </Select>
             {selectedTagIds.length > 0 && (
               <div className="flex flex-wrap gap-1 mt-1">
                 {selectedTagIds.map((id, idx) => {
                   const valueDesc = allValues.find(v => v.id === id);
                   return (
                     <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
                       {valueDesc?.name || id}
                       <button type="button" onClick={() => handleRemoveTagId(id)} className="hover:text-emerald-900"><X className="w-3 h-3" /></button>
                     </span>
                   )
                 })}
               </div>
             )}
          </div>
          <Button type="submit" className="w-full md:w-auto mt-auto mb-[2px]">Применить</Button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm">ID</th>
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => applySort('name')}>
                    <span className="group-hover:text-indigo-600 transition-colors">Имя файла{renderSortIcon('name')}</span>
                  </th>
                  {showUploadDate && (
                    <th className="px-6 py-4 font-medium text-slate-600 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => applySort('dateupload')}>
                      <span className="group-hover:text-indigo-600 transition-colors">Дата загрузки{renderSortIcon('dateupload')}</span>
                    </th>
                  )}
                  {showUpdateDate && (
                    <th className="px-6 py-4 font-medium text-slate-600 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => applySort('lastupdated')}>
                      <span className="group-hover:text-indigo-600 transition-colors">Дата обновления{renderSortIcon('lastupdated')}</span>
                    </th>
                  )}
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm">Теги</th>
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{file.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{file.name}</td>
                    {showUploadDate && (
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {file.dateUpload ? format(new Date(file.dateUpload), 'dd.MM.yyyy HH:mm') : '—'}
                      </td>
                    )}
                    {showUpdateDate && (
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {file.lastUpdated ? format(new Date(file.lastUpdated), 'dd.MM.yyyy HH:mm') : '—'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {file.tags?.map((t, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                            {t.key ? `${t.key}: ` : ''}{t.value}
                          </span>
                        ))}
                        {(!file.tags || file.tags.length === 0) && <span className="text-slate-400 text-sm">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={filesApi.getFileDownloadUrl(file.id)}
                          download
                          className="inline-flex items-center justify-center rounded-md p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-slate-100" onClick={() => openEditModal(file)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(file.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFiles.length === 0 && (
                  <tr>
                    <td colSpan={((showUpdateDate ? 1 : 0) + (showUploadDate ? 1 : 0) + 4)} className="px-6 py-12 text-center text-slate-500">
                      <FileUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p>{files.length === 0 ? "Нет файлов для отображения" : "По вашему запросу файлов не найдено"}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={closeInitModal} 
        title="Добавить новый файл"
        footer={<Button onClick={handleUpload} disabled={!selectedFile || uploading}>{uploading ? 'Загрузка...' : 'Загрузить'}</Button>}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Выберите файл и укажите шаблон для добавления метаданных.</p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Файл</label>
            <Input type="file" onChange={e => {
              const f = e.target.files?.[0] || null;
              setSelectedFile(f);
              if (f) {
                const lastDot = f.name.lastIndexOf('.');
                setCustomFileName(lastDot !== -1 ? f.name.substring(0, lastDot) : f.name);
              } else {
                setCustomFileName('');
              }
            }} />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700">Название файла (без расширения)</label>
            <div className="flex items-center gap-2">
              <Input 
                value={customFileName} 
                onChange={e => setCustomFileName(e.target.value)} 
                placeholder="Введите желаемое имя..." 
              />
              {selectedFile && (
                <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 flex items-center rounded-md shrink-0 h-10">
                  .{selectedFile.name.split('.').pop()}
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700">Шаблон метаданных</label>
            <Select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}>
              <option value="">Без шаблона</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>

          {loadingTemplate && <div className="text-sm text-slate-500">Загрузка данных шаблона...</div>}

          {activeKeyIds.length > 0 && (
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mt-4 space-y-4">
                <h4 className="text-sm font-medium text-slate-800">Заполните поля (Теги)</h4>
                {activeKeyIds.map((keyId: number) => {
                  const keyDef = keys.find(k => k.id === keyId);
                  const keyName = keyDef ? keyDef.name : `Поле ${keyId}`;
                  const valuesForKey = valuesByKey.get(keyId) || [];
                  return (
                    <div key={keyId} className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">{keyName}</label>
                      <Select 
                        value={selectedValues[keyId] || ''} 
                        onChange={e => setSelectedValues({...selectedValues, [keyId]: parseInt(e.target.value)})}
                      >
                        <option value="">Выберите {keyName.toLowerCase()}...</option>
                        {valuesForKey.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </Select>
                    </div>
                  );
                })}
             </div>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={isEditModalOpen} 
        onClose={closeEditModal} 
        title="Редактировать файл"
        footer={<Button onClick={handleEdit} disabled={uploading}>{uploading ? 'Сохранение...' : 'Сохранить'}</Button>}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Измените файл или метаданные.</p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Новый файл (необязательно)</label>
            <Input type="file" onChange={e => {
              const f = e.target.files?.[0] || null;
              setSelectedFile(f);
              if (f) {
                const lastDot = f.name.lastIndexOf('.');
                setCustomFileName(lastDot !== -1 ? f.name.substring(0, lastDot) : f.name);
              }
            }} />
            <p className="text-xs text-slate-400">Текущий: {editingFile?.name}</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700">Название файла (без расширения)</label>
            <div className="flex items-center gap-2">
              <Input 
                value={customFileName} 
                onChange={e => setCustomFileName(e.target.value)} 
                placeholder="Введите новое имя..." 
              />
              <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 flex items-center rounded-md shrink-0 h-10">
                .{selectedFile ? selectedFile.name.split('.').pop() : editingFile?.name.split('.').pop()}
              </span>
            </div>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-sm font-medium text-slate-700">Шаблон метаданных</label>
            <Select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}>
              <option value="">Выбрать (очистит текущие теги)</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>

          {loadingTemplate && <div className="text-sm text-slate-500">Загрузка данных шаблона...</div>}

          {activeKeyIds.length > 0 && (
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mt-4 space-y-4">
                <h4 className="text-sm font-medium text-slate-800">Заполните поля (Теги)</h4>
                {activeKeyIds.map((keyId: number) => {
                  const keyDef = keys.find(k => k.id === keyId);
                  const keyName = keyDef ? keyDef.name : `Поле ${keyId}`;
                  const valuesForKey = valuesByKey.get(keyId) || [];
                  return (
                    <div key={keyId} className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600">{keyName}</label>
                      <Select 
                        value={selectedValues[keyId] || ''} 
                        onChange={e => setSelectedValues({...selectedValues, [keyId]: parseInt(e.target.value)})}
                      >
                        <option value="">Выберите {keyName.toLowerCase()}...</option>
                        {valuesForKey.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </Select>
                    </div>
                  );
                })}
             </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
