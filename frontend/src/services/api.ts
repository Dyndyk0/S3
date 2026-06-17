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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
  patchFileStatus: async (id: number, isDeleted: boolean) => {
    const res = await api.patch(`/file/${id}`, { isDeleted: isDeleted });
    return res.data;
  },
  getFileDownloadUrl: (id: number) => {
    // Return relative URL for downloads so browser can start navigation/download
    return `/api/file/${id}`;
  }
};

export const authApi = {
  login: async (data: any) => {
    const url = process.env.AUTH_URL || "";
    const res = await api.post(url, data);
    
    // Save token
    const token = res.data?.jwtToken;
    if (token) {
      localStorage.setItem('access_token', token);
    }
    return res.data;
  },
  logout: async () => {
    localStorage.removeItem('access_token');
    return { success: true };
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

export const usersApi = {
  getUsers: async (params?: any) => {
    // We assume backend returns PaginatedResponse<UserDto> or similar. We'll type it correctly.
    const res = await api.get('/user', { params });
    return res.data;
  },
  updateUserRoles: async (name: string, data: any) => {
    // data should be RolePatchDto according to swagger
    const res = await api.patch(`/user/${name}`, data);
    return res.data;
  }
};

export const rolesApi = {
  getRoles: async (params?: any) => {
    const res = await api.get('/role', { params });
    return res.data;
  },
  createRole: async (name: string) => {
    const res = await api.post('/role', { name }); 
    return res.data; 
  }
};

export const minioApi = {
  getFiles: async () => {
    const res = await api.get<MinioFileDto[]>('/filesMinio');
    return res.data;
  }
};
