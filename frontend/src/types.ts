export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface FileDto {
  id: number;
  name: string;
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

export interface FileInitDto {
  fileName: string;
  fileExtension?: string;
  valueIds: number[];
}

export interface FileUpdateDto {
  fileName?: string;
  fileExtension?: string;
  updateFile?: boolean;
  valueIds?: number[];
}

export interface KeyMetadataDto {
  id: number;
  name: string;
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
}

export interface CreateTemplateDto {
  name: string;
  keyIds: number[];
}

// For minio debug endpoint (assuming it returns an array of objects)
export interface MinioFileDto {
  key: string;
  size?: number;
  lastModified?: string;
  [key: string]: any;
}
