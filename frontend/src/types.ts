export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface FileDto {
  id: number;
  name: string;
  templateId?: number;
  templateName?: string;
  creator?: string;
  lastEditor?: string;
  fileExtension?: string;
  lastUpdated?: string;
  dateUpload?: string;
  tags?: TagDto[];
}

export interface TagDto {
  keyId?: number;
  key?: string;
  valueId: number;
  value: string;
}

export interface FileTagInitDto {
  keyId: number;
  value: string;
}

export interface FileInitDto {
  templateId?: number;
  fileName: string;
  fileExtension?: string;
  tags: FileTagInitDto[];
}

export interface FileUpdateDto {
  templateId?: number;
  fileName?: string;
  fileExtension?: string;
  updateFile?: boolean;
  tags?: FileTagInitDto[];
}

export interface KeyMetadataDto {
  id: number;
  name: string;
  dataType?: number | string;
}

export interface ValueMetadataDto {
  id: number;
  name: string;
  keyId?: number;
}

export interface TemplateDto {
  id: number;
  name: string;
}

export interface TemplateDetailDto {
  id: number;
  name: string;
  fields: TemplateFieldDto[];
}

export interface TemplateFieldDto {
  keyId: number;
  keyName: string;
  values: ValueMetadataDto[];
  isRequired?: boolean;
  isMultiple?: boolean;
}

export interface TemplateKeyDto {
  keyId: number;
  isRequired: boolean;
  isMultiple: boolean;
}

export interface CreateTemplateDto {
  name: string;
  keys: TemplateKeyDto[];
}

export interface RoleDto {
  id: number;
  name: string;
}

export interface UserDto {
  name: string;
  roles?: RoleDto[];
}

export interface RolePatchDto {
  roleIds: number[];
  delete: boolean;
}

// For minio debug endpoint (assuming it returns an array of objects)
export interface MinioFileDto {
  key: string;
  size?: number;
  lastModified?: string;
  [key: string]: any;
}
