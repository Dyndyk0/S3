import React, { useEffect, useState, useMemo } from 'react';
import { filesApi, templatesApi, valuesApi, keysApi } from '../services/api';
import { FileDto, TemplateDto, TemplateDetailDto, ValueMetadataDto, KeyMetadataDto } from '../types';
import { Button } from './ui/Button';
import { format } from 'date-fns';
import { Download, Trash2, Search, Plus, FileUp, ExternalLink, ArrowUpDown, ArrowDown, ArrowUp, Settings2, X, Edit } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

const getFileExt = (filename?: string) => {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot + 1) : '';
};

export function FilesPage() {
  const [files, setFiles] = useState<FileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Search & Filter
  const [searchName, setSearchName] = useState('');
  const [searchExt, setSearchExt] = useState('');
  const [uploadDateFrom, setUploadDateFrom] = useState('');
  const [uploadTimeFrom, setUploadTimeFrom] = useState('');
  const [uploadDateTo, setUploadDateTo] = useState('');
  const [uploadTimeTo, setUploadTimeTo] = useState('');
  const [updatedDateFrom, setUpdatedDateFrom] = useState('');
  const [updatedTimeFrom, setUpdatedTimeFrom] = useState('');
  const [updatedDateTo, setUpdatedDateTo] = useState('');
  const [updatedTimeTo, setUpdatedTimeTo] = useState('');
  const [tagSearches, setTagSearches] = useState<{keyId: number, value: string}[]>([]);
  const [tagSearchKeyId, setTagSearchKeyId] = useState<string>('');
  const [tagSearchValue, setTagSearchValue] = useState<string>('');
  
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [currentSelectedTagId, setCurrentSelectedTagId] = useState<string>('');

  const [searchTemplateId, setSearchTemplateId] = useState<string>('');
  const [showTemplateName, setShowTemplateName] = useState(() => localStorage.getItem('fileCols_tpl') !== 'false');

  // Pagination for files
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalFiles, setTotalFiles] = useState(0);

  // Sort
  const [sortBy, setSortBy] = useState<string>('lastupdated');
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  // Column visibility
  const [showExtension, setShowExtension] = useState(() => localStorage.getItem('fileCols_ext') !== 'false');
  const [showUploadDate, setShowUploadDate] = useState(() => localStorage.getItem('fileCols_upl') !== 'false');
  const [showUpdateDate, setShowUpdateDate] = useState(() => localStorage.getItem('fileCols_upd') !== 'false');
  const [showCreator, setShowCreator] = useState(() => localStorage.getItem('fileCols_creator') !== 'false');
  const [showLastEditor, setShowLastEditor] = useState(() => localStorage.getItem('fileCols_editor') !== 'false');

  useEffect(() => {
    localStorage.setItem('fileCols_tpl', showTemplateName.toString());
    localStorage.setItem('fileCols_ext', showExtension.toString());
    localStorage.setItem('fileCols_upl', showUploadDate.toString());
    localStorage.setItem('fileCols_upd', showUpdateDate.toString());
    localStorage.setItem('fileCols_creator', showCreator.toString());
    localStorage.setItem('fileCols_editor', showLastEditor.toString());
  }, [showTemplateName, showExtension, showUploadDate, showUpdateDate, showCreator, showLastEditor]);

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
  
  // selectedValues will hold { keyId: string/number } for rendering 
  // and we'll transform it before sending. 
  // It handles both manual input texts and select inputs.
  const [selectedValues, setSelectedValues] = useState<Record<number, string | string[]>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const fetchData = async () => {
    try {
      const [t, v, k] = await Promise.all([
        templatesApi.getTemplates({ Limit: 1000 }),
        valuesApi.getValues({ Limit: 1000 }),
        keysApi.getKeys({ Limit: 1000 })
      ]);
      setTemplates(t && (t as any).items ? (t as any).items : Array.isArray(t) ? t : []);
      setAllValues(v && (v as any).items ? (v as any).items : Array.isArray(v) ? v : []);
      setKeys(k && (k as any).items ? (k as any).items : Array.isArray(k) ? k : []);
      await fetchFiles(page, sortBy, sortDesc);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFiles = async (currentPage = page, currentSortBy = sortBy, currentSortDesc = sortDesc) => {
    try {
      setLoading(true);
      const params: any = { Offset: (currentPage - 1) * pageSize, Limit: pageSize };
      
      // We apply standard filters
      if (uploadDateFrom) params.DateUploadFrom = new Date(`${uploadDateFrom}T${uploadTimeFrom || '00:00'}:00`).toISOString();
      if (uploadDateTo) params.DateUploadTo = new Date(`${uploadDateTo}T${uploadTimeTo || '23:59'}:59`).toISOString();
      if (updatedDateFrom) params.LastUpdatedFrom = new Date(`${updatedDateFrom}T${updatedTimeFrom || '00:00'}:00`).toISOString();
      if (updatedDateTo) params.LastUpdatedTo = new Date(`${updatedDateTo}T${updatedTimeTo || '23:59'}:59`).toISOString();
      
      if (currentSortBy) params.SortBy = currentSortBy.toLowerCase();
      params.SortDescending = currentSortDesc;
      if (searchName.trim()) params.FileName = searchName.trim();
      if (searchExt.trim()) params.FileExtension = searchExt.trim();
      if (searchTemplateId) params.TemplateId = parseInt(searchTemplateId);
      
      if (tagSearches.length > 0) {
        params.TagsJson = JSON.stringify(tagSearches.map(val => ({ KeyId: val.keyId, Value: val.value })));
      }
      if (selectedTagIds.length > 0) {
        params.TagIds = selectedTagIds;
      }

      const data = await filesApi.getFiles(params);
      if (data && (data as any).items) {
        setFiles((data as any).items);
        setTotalFiles((data as any).total || 0);
      } else if (Array.isArray(data)) {
        setFiles(data);
        setTotalFiles(data.length);
      } else {
        setFiles([]);
        setTotalFiles(0);
      }
    } catch (e) {
      console.error(e);
      setFiles([]);
      setTotalFiles(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Only on mount

  const handleAddTagSearch = () => {
    if (tagSearchKeyId && tagSearchValue.trim()) {
      const kid = parseInt(tagSearchKeyId, 10);
      // checks if already exists
      if (!tagSearches.find(t => t.keyId === kid && t.value === tagSearchValue.trim())) {
        setTagSearches([...tagSearches, { keyId: kid, value: tagSearchValue.trim() }]);
        setTagSearchValue('');
      }
    }
  };

  const handleRemoveTagSearch = (idxToRemove: number) => {
    setTagSearches(tagSearches.filter((_, idx) => idx !== idxToRemove));
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
    fetchFiles(page, column, newDesc);
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

  const renderTagField = (keyId: number) => {
    const keyDef = keys.find(k => k.id === keyId);
    let keyName = keyDef ? keyDef.name : `Поле ${keyId}`;
    const dt = keyDef?.dataType || 'text';
    
    const tplField = templateDetails?.fields?.find((f: any) => f.keyId === keyId);
    let isRequired = false;
    let isMultiple = false;

    if (tplField) {
      isRequired = !!tplField.isRequired;
      isMultiple = !!tplField.isMultiple;
    } else if (templateDetails?.keys) { // fallback
      const k = templateDetails.keys.find((kf: any) => kf.keyId === keyId);
      isRequired = !!k?.isRequired;
      isMultiple = !!k?.isMultiple;
    }

    const currentValue = selectedValues[keyId];

    if (dt === 'select') {
      const valuesForKey = valuesByKey.get(keyId) || [];
      return (
        <div key={keyId} className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            {keyName} {isRequired && <span className="text-red-500">*</span>} {isMultiple && <span className="text-slate-400 font-normal">(множественный)</span>}
          </label>
          {isMultiple ? (
            <div className="space-y-1 mt-1 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-md">
              {valuesForKey.map(v => {
                const checked = Array.isArray(currentValue) ? currentValue.includes(v.id.toString()) : currentValue === v.id.toString();
                return (
                  <label key={v.id} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      checked={checked}
                      onChange={(e) => {
                        let currentArr = Array.isArray(currentValue) ? [...currentValue] : (currentValue ? [currentValue as string] : []);
                        if (e.target.checked) {
                          currentArr.push(v.id.toString());
                        } else {
                          currentArr = currentArr.filter(x => x !== v.id.toString());
                        }
                        setSelectedValues({...selectedValues, [keyId]: currentArr});
                      }}
                    />
                    <span className="text-sm text-slate-700">{v.name}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <Select 
              value={(currentValue as string) || ''} 
              onChange={e => setSelectedValues({...selectedValues, [keyId]: e.target.value})}
            >
              <option value="">Выберите {keyName.toLowerCase()}...</option>
              {valuesForKey.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </Select>
          )}
        </div>
      );
    }

    if (dt === 'boolean') {
      return (
        <div key={keyId} className="flex items-center gap-2 mt-2">
          <input 
            type="checkbox" 
            checked={currentValue === 'true'} 
            onChange={e => setSelectedValues({...selectedValues, [keyId]: e.target.checked ? 'true' : 'false'})}
            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
          />
          <label className="text-sm font-semibold text-slate-600">
             {keyName} {isRequired && <span className="text-red-500">*</span>}
          </label>
        </div>
      );
    }
    
    // text, number, date
    let arrValues = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue as string] : []);
    if (!isMultiple && arrValues.length > 1) {
       arrValues = [arrValues[0]];
    } else if (arrValues.length === 0) {
       arrValues = [''];
    }

    return (
      <div key={keyId} className="space-y-1">
        <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
          {keyName} {isRequired && <span className="text-red-500">*</span>} {isMultiple && <span className="text-slate-400 font-normal">(множественный)</span>}
        </label>
        {arrValues.map((val, idx) => (
          <div key={idx} className="flex gap-2 mb-1">
            <Input 
              type={dt === 'number' ? 'number' : dt === 'date' ? 'date' : 'text'}
              value={val} 
              onChange={e => {
                const newArr = [...arrValues];
                newArr[idx] = e.target.value;
                setSelectedValues({...selectedValues, [keyId]: isMultiple ? newArr : newArr[0]});
              }}
              placeholder={`Введите ${keyName.toLowerCase()}...`}
            />
            {isMultiple && (
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => {
                  const newArr = arrValues.filter((_, i) => i !== idx);
                  setSelectedValues({...selectedValues, [keyId]: newArr});
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        {isMultiple && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSelectedValues({...selectedValues, [keyId]: [...arrValues, '']});
            }}
          >
            + Добавить еще
          </Button>
        )}
      </div>
    );
  };
  useEffect(() => {
    const loadTemplate = async () => {
      if (!selectedTemplateId) {
        setTemplateDetails(null);
        if (!editingFile) setSelectedValues({});
        return;
      }
      try {
        setLoadingTemplate(true);
        const data = await templatesApi.getTemplate(parseInt(selectedTemplateId));
        setTemplateDetails(data);
        if (!editingFile || editingFile.templateId?.toString() !== selectedTemplateId) {
           setSelectedValues({}); // reset
        }
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
    setPage(1);
    fetchFiles(1);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить файл в корзину?')) {
      try {
        await filesApi.patchFileStatus(id, true);
        fetchFiles();
      } catch (e) {
        console.error(e);
        alert('Ошибка при перемещении в корзину. Возможно, нет прав.');
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
    const initVals: Record<number, string | string[]> = {};
    if (file.tags) {
      file.tags.forEach(t => {
        if (t.keyId) {
          // the api returns it as value, we fill it
          let val = '';
          if (t.valueId) {
             val = t.valueId.toString(); // assuming it was a select
          } else {
             val = t.value || '';
          }
          if (initVals[t.keyId] !== undefined) {
            if (Array.isArray(initVals[t.keyId])) {
              (initVals[t.keyId] as string[]).push(val);
            } else {
              initVals[t.keyId] = [initVals[t.keyId] as string, val];
            }
          } else {
            initVals[t.keyId] = val;
          }
        }
      });
    }
    setSelectedValues(initVals);
    setSelectedTemplateId(file.templateId ? file.templateId.toString() : '');
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

  const getTagsArray = () => {
    return Object.entries(selectedValues)
      .flatMap(([kid, val]) => {
        if (Array.isArray(val)) {
           return val.filter(v => typeof v === 'string' && v.trim() !== '').map(v => ({ keyId: parseInt(kid), value: v.trim() }));
        } else if (val && val.toString().trim() !== '') {
           return [{ keyId: parseInt(kid), value: val.toString().trim() }];
        }
        return [];
      });
  };

  const validateRequiredFields = () => {
    const missingRequired = activeKeyIds.some(kid => {
      const isReq = templateDetails?.fields?.find((f: any) => f.keyId === kid)?.isRequired || templateDetails?.keys?.find((kf: any) => kf.keyId === kid)?.isRequired;
      if (!isReq) return false;
      const val = selectedValues[kid];
      if (Array.isArray(val)) return val.filter(v => typeof v === 'string' && v.trim() !== '').length === 0;
      return !val || val.toString().trim() === '';
    });
    if (missingRequired) {
      alert('Пожалуйста, заполните все обязательные поля');
      return false;
    }
    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!validateRequiredFields()) return;
    
    // Construct FileTagInitDto
    const tagsArray = getTagsArray();
      
    try {
      setUploading(true);
      const nameToSend = customFileName.trim() || selectedFile.name;
      const lastDot = selectedFile.name.lastIndexOf('.');
      const fileExt = lastDot !== -1 ? selectedFile.name.substring(lastDot + 1) : '';

      const payload: any = { 
        fileName: nameToSend, 
        fileExtension: fileExt,
        tags: tagsArray 
      };
      if (selectedTemplateId) {
        payload.templateId = parseInt(selectedTemplateId);
      }

      const result = await filesApi.initFile(payload);
      
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
    if (!validateRequiredFields()) return;
    
    const tagsArray = getTagsArray();
      
    try {
      setUploading(true);
      const payload: any = { tags: tagsArray };
      
      if (selectedTemplateId) {
        payload.templateId = parseInt(selectedTemplateId);
      }
      
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
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-6 text-sm mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showTemplateName} onChange={e => setShowTemplateName(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-slate-700">Показывать "Шаблон файла"</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showExtension} onChange={e => setShowExtension(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-slate-700">Показывать "Расширение"</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showUploadDate} onChange={e => setShowUploadDate(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-slate-700">Показывать "Дата загрузки"</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showUpdateDate} onChange={e => setShowUpdateDate(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-slate-700">Показывать "Дата обновления"</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showCreator} onChange={e => setShowCreator(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-slate-700">Показывать "Загрузил"</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showLastEditor} onChange={e => setShowLastEditor(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-slate-700">Показывать "Отредактировал"</span>
          </label>
        </div>
      )}

      <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="text-sm font-medium text-slate-800">Параметры фильтрации</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Имя файла (API)</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="report..." 
                className="pl-9"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Расширение файла</label>
            <Input 
              placeholder="pdf"
              value={searchExt}
              onChange={e => setSearchExt(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Поиск по шаблону</label>
            <Select 
              value={searchTemplateId}
              onChange={e => setSearchTemplateId(e.target.value)}
            >
              <option value="">Любой</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>

          <div className="space-y-1 lg:col-span-2">
            <label className="text-xs font-medium text-slate-500">Добавить фрагмент тега (содержит)</label>
            <div className="flex gap-2">
              <Select 
                value={tagSearchKeyId}
                onChange={e => setTagSearchKeyId(e.target.value)}
                className="w-1/3"
              >
                <option value="">Ключ...</option>
                {keys.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </Select>
              <Input 
                placeholder="Текст значения..." 
                value={tagSearchValue}
                onChange={e => setTagSearchValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTagSearch(); } }}
              />
              <Button type="button" variant="outline" onClick={handleAddTagSearch}>+</Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Добавить точный тег</label>
            <Select value={currentSelectedTagId} onChange={e => handleAddTagId(e.target.value)}>
              <option value="">Добавить тег...</option>
              {allValues.filter(v => !selectedTagIds.includes(v.id)).map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Дата загрузки (от)</label>
            <div className="flex gap-1">
              <Input type="date" value={uploadDateFrom} onChange={e => setUploadDateFrom(e.target.value)} className="w-full" />
              <Input type="time" value={uploadTimeFrom} onChange={e => setUploadTimeFrom(e.target.value)} className="w-24" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Дата загрузки (до)</label>
            <div className="flex gap-1">
              <Input type="date" value={uploadDateTo} onChange={e => setUploadDateTo(e.target.value)} className="w-full" />
              <Input type="time" value={uploadTimeTo} onChange={e => setUploadTimeTo(e.target.value)} className="w-24" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Дата обновления (от)</label>
            <div className="flex gap-1">
              <Input type="date" value={updatedDateFrom} onChange={e => setUpdatedDateFrom(e.target.value)} className="w-full" />
              <Input type="time" value={updatedTimeFrom} onChange={e => setUpdatedTimeFrom(e.target.value)} className="w-24" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Дата обновления (до)</label>
            <div className="flex gap-1">
              <Input type="date" value={updatedDateTo} onChange={e => setUpdatedDateTo(e.target.value)} className="w-full" />
              <Input type="time" value={updatedTimeTo} onChange={e => setUpdatedTimeTo(e.target.value)} className="w-24" />
            </div>
          </div>
        </div>

        {(tagSearches.length > 0 || selectedTagIds.length > 0) && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            {tagSearches.length > 0 && (
              <div>
                <span className="text-xs text-slate-500 block mb-1">Выбранные фрагменты тегов:</span>
                <div className="flex flex-wrap gap-1">
                  {tagSearches.map((ts, idx) => {
                    const keyName = keys.find(k => k.id === ts.keyId)?.name || ts.keyId;
                    return (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                        {keyName}: {ts.value}
                        <button type="button" onClick={() => handleRemoveTagSearch(idx)} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            {selectedTagIds.length > 0 && (
              <div>
                <span className="text-xs text-slate-500 block mb-1">Выбранные точные теги:</span>
                <div className="flex flex-wrap gap-1">
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
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <Button type="submit">Применить фильтры</Button>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm">ID</th>
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => applySort('name')}>
                    <span className="group-hover:text-indigo-600 transition-colors">Имя файла{renderSortIcon('name')}</span>
                  </th>
                  {/* <th className="px-6 py-4 font-medium text-slate-600 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => applySort('templatename')}>
                    <span className="group-hover:text-indigo-600 transition-colors">Шаблон{renderSortIcon('templatename')}</span>
                  </th> */}
                  <th className="px-6 py-4 font-medium text-slate-600 text-sm">Шаблон</th>
                  {showCreator && (
                    <th className="px-6 py-4 font-medium text-slate-600 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => applySort('creator')}>
                      <span className="group-hover:text-indigo-600 transition-colors">Загрузил{renderSortIcon('creator')}</span>
                    </th>
                  )}
                  {showLastEditor && (
                    <th className="px-6 py-4 font-medium text-slate-600 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => applySort('lasteditor')}>
                      <span className="group-hover:text-indigo-600 transition-colors">Отредактировал{renderSortIcon('lasteditor')}</span>
                    </th>
                  )}
                  {showExtension && (
                    <th className="px-6 py-4 font-medium text-slate-600 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none group" onClick={() => applySort('fileextension')}>
                      <span className="group-hover:text-indigo-600 transition-colors">Расширение{renderSortIcon('fileextension')}</span>
                    </th>
                  )}
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
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{file.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-xs truncate" title={file.name}>{file.name}</td>
                    {/* {showTemplateName && ( */}
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={file.templateName}>{file.templateName || '—'}</td>
                    {/* )} */}
                    {showCreator && (
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={file.creator}>{file.creator || '—'}</td>
                    )}
                    {showLastEditor && (
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={file.lastEditor}>{file.lastEditor || '—'}</td>
                    )}
                    {showExtension && (
                      <td className="px-6 py-4 text-sm text-slate-500 uppercase">
                        {file.fileExtension || '—'}
                      </td>
                    )}
                    {showUploadDate && (
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {file.dateUpload ? format(new Date(file.dateUpload), 'dd.MM.yyyy HH:mm') : '—'}
                      </td>
                    )}
                    {showUpdateDate && (
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {file.lastUpdated ? format(new Date(file.lastUpdated), 'dd.MM.yyyy HH:mm') : '—'}
                      </td>
                    )}
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex flex-wrap gap-2">
                        {file.tags?.map((t, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10 max-w-full truncate block" title={`${t.key ? `${t.key}: ` : ''}${t.value}`}>
                            {t.key ? <span className="font-semibold text-indigo-900 mr-1 truncate block">{t.key}:</span> : ''}
                            <span className="truncate block">{t.value}</span>
                          </span>
                        ))}
                        {(!file.tags || file.tags.length === 0) && <span className="text-slate-400 text-sm">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a href={filesApi.getFileDownloadUrl(file.id)} download className="inline-flex items-center justify-center p-2 rounded-md transition-colors text-blue-600 hover:text-blue-700 hover:bg-blue-50">
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
                {files.length === 0 && (
                  <tr>
                    <td colSpan={((showTemplateName ? 1 : 0) + (showCreator ? 1 : 0) + (showLastEditor ? 1 : 0) + (showExtension ? 1 : 0) + (showUpdateDate ? 1 : 0) + (showUploadDate ? 1 : 0) + 4)} className="px-6 py-12 text-center text-slate-500">
                      <FileUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p>По вашему запросу файлов не найдено</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && (files.length > 0 || page > 1) && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white">
            <div className="text-sm text-slate-500">
              Страница {page} (Всего: {totalFiles})
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                disabled={page === 1} 
                onClick={() => {
                  const newPage = Math.max(1, page - 1);
                  setPage(newPage);
                  fetchFiles(newPage);
                }}
              >
                Назад
              </Button>
              <Button 
                variant="outline"
                disabled={files.length < pageSize}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  fetchFiles(newPage);
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
              {(() => {
                const ext = getFileExt(selectedFile?.name);
                return ext ? (
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 flex items-center rounded-md shrink-0 h-10">
                    .{ext}
                  </span>
                ) : null;
              })()}
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
                {activeKeyIds.map(keyId => renderTagField(keyId))}
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
              {(() => {
                const ext = selectedFile ? getFileExt(selectedFile.name) : editingFile?.fileExtension;
                return ext ? (
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 flex items-center rounded-md shrink-0 h-10">
                    .{ext}
                  </span>
                ) : null;
              })()}
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
                {activeKeyIds.map(keyId => renderTagField(keyId))}
             </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
