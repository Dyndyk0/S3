import axios from 'axios';
import type {
  FileDto,
  FileInitDto,
  FileUpdateDto,
  KeyMetadataDto,
  ValueMetadataDto,
  TemplateDto,
  TemplateDetailDto,
  CreateTemplateDto,
  MinioFileDto,
  PaginatedResponse
} from '../types';

const api = axios.create({
  baseURL: '/api', // Points to the relative root URL, now prefixed with /api
  paramsSerializer: {
    indexes: null 
  }
});

export const filesApi = {
  getFiles: async (params?: any) => {
    const res = await api.get<PaginatedResponse<FileDto>>('/file', { params });
    return res.data;
  },
  initFile: async (data: FileInitDto) => {
    const res = await api.post<{id: number, uploadUrl: string}>('/file', data);
    return res.data;
  },
  updateFile: async (id: number, data: FileUpdateDto) => {
    const res = await api.put<{id: number, uploadUrl?: string}>(`/file/${id}`, data);
    return res.data;
  },
  deleteFile: async (id: number) => {
    const res = await api.delete(`/file/${id}`);
    return res.data;
  },
  getFileDownloadUrl: (id: number) => {
    // Return relative URL for downloads so browser can start navigation/download
    return `/api/file/${id}`;
  }
};

export const authApi = {
  login: async (data: any) => {
    const res = await api.post('/login', data);
    return res.data;
  },
  logout: async () => {
    const res = await api.post('/logout');
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/user/me');
    return res.data;
  }
};

export const keysApi = {
  getKeys: async (params?: any) => {
    const res = await api.get<PaginatedResponse<KeyMetadataDto>>('/keymetadata', { params });
    return res.data;
  },
  getKeyTypes: async () => {
    const res = await api.get<string[]>('/keymetadata/types');
    return res.data;
  },
  createKey: async (name: string, dataType: any) => {
    const res = await api.post('/keymetadata', null, { params: { name, dataType } });
    return res.data;
  },
  updateKey: async (id: number, name: string) => {
    const res = await api.put('/keymetadata', { id, name });
    return res.data;
  },
  deleteKey: async (id: number) => {
    const res = await api.delete('/keymetadata', { params: { id } });
    return res.data;
  }
};

export const valuesApi = {
  getValues: async (params?: any) => {
    const res = await api.get<PaginatedResponse<ValueMetadataDto>>('/valuemetadata', { params });
    return res.data;
  },
  createValue: async (keyMetadataId: number, name: string) => {
    const res = await api.post('/valuemetadata', null, { params: { keyMetadataId, name } });
    return res.data;
  },
  updateValue: async (id: number, name: string) => {
    const res = await api.patch('/valuemetadata', { id, name });
    return res.data;
  },
  deleteValue: async (id: number) => {
    const res = await api.delete('/valuemetadata', { params: { id } });
    return res.data;
  }
};

export const templatesApi = {
  getTemplates: async (params?: any) => {
    const res = await api.get<PaginatedResponse<TemplateDto>>('/templates', { params });
    return res.data;
  },
  getTemplate: async (id: number) => {
    const res = await api.get<TemplateDetailDto>(`/templates/${id}`);
    return res.data;
  },
  createTemplate: async (data: CreateTemplateDto) => {
    const res = await api.post<{id: number}>('/templates', data);
    return res.data;
  },
  updateTemplate: async (id: number, data: CreateTemplateDto) => {
    const res = await api.put(`/templates/${id}`, data);
    return res.data;
  },
  deleteTemplate: async (id: number) => {
    const res = await api.delete(`/templates/${id}`);
    return res.data;
  }
};

export const minioApi = {
  getFiles: async () => {
    const res = await api.get<MinioFileDto[]>('/filesMinio');
    return res.data;
  }
};
