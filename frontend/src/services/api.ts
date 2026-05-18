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

// Add a request interceptor to handle headers if we needed, 
// wait, the API reference says the API returns X-User-Id and X-File-Name, we don't need to send auth for now based on the spec.

export const filesApi = {
  getFiles: async (params?: any) => {
    const res = await api.get<FileDto[]>('/file', { params });
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
    const res = await api.delete('/delete', { params: { fileId: id } });
    return res.data;
  },
  getFileDownloadUrl: (id: number) => {
    // Return relative URL for downloads so browser can start navigation/download
    return `/api/file/${id}`;
  }
};

export const keysApi = {
  getKeys: async (params?: any) => {
    const res = await api.get<KeyMetadataDto[]>('/keymetadata', { params });
    return res.data;
  },
  createKey: async (name: string) => {
    const res = await api.post('/keymetadata', null, { params: { name } });
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
    const res = await api.get<ValueMetadataDto[]>('/valuemetadata', { params });
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
