/**
 * API Functions Module
 * Все запросы к серверу
 */

const API = {
    // === МЕТАДАННЫЕ ===
    async loadKeyMetadata() {
        const res = await fetch('/keymetadata');
        if (!res.ok) throw new Error('Ошибка загрузки ключей метаданных');
        return await res.json();
    },

    async loadValueMetadata() {
        const res = await fetch('/valuemetadata');
        if (!res.ok) throw new Error('Ошибка загрузки значений метаданных');
        return await res.json();
    },

    async loadMetadata() {
        const keys = await this.loadKeyMetadata();
        const values = await this.loadValueMetadata();

        const valuesMap = (values || []).reduce((acc, item) => {
            const keyId = item.keyId ?? item.KeyId ?? 0;
            if (!acc[keyId]) acc[keyId] = [];
            acc[keyId].push(item);
            return acc;
        }, {});

        return (keys || []).map(key => ({
            ...key,
            values: valuesMap[key.id] || []
        }));
    },

    async createKeyMetadata(name) {
        const res = await fetch(`/keymetadata?name=${encodeURIComponent(name)}`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error('Ошибка создания ключа метаданных');
        return;
    },

    async updateKeyMetadata(id, name) {
        const res = await fetch('/keymetadata', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name })
        });
        if (!res.ok) {
            const error = await res.json().catch(() => null);
            throw new Error(error?.message || 'Ошибка обновления ключа метаданных');
        }
        return;
    },

    async deleteKeyMetadata(id) {
        const res = await fetch(`/keymetadata?id=${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Ошибка удаления ключа метаданных');
        return res;
    },

    async createValueMetadata(keyId, name) {
        const res = await fetch(`/valuemetadata?keyMetadataId=${encodeURIComponent(keyId)}&name=${encodeURIComponent(name)}`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error('Ошибка создания значения метаданных');
        return;
    },

    async updateValueMetadata(dto) {
        const res = await fetch('/valuemetadata', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => null);
            throw new Error(error?.message || 'Ошибка обновления значения метаданных');
        }
        return;
    },

    async deleteValueMetadata(id) {
        const res = await fetch(`/valuemetadata?id=${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Ошибка удаления значения метаданных');
        return res;
    },

    // === ШАБЛОНЫ ===
    async loadTemplates() {
        const res = await fetch('/templates');
        return await res.json();
    },

    async getTemplateById(templateId) {
        const res = await fetch(`/templates/${templateId}`);
        if (!res.ok) throw new Error('Ошибка загрузки шаблона');
        return await res.json();
    },

    async createTemplate(name, keyIds) {
        const res = await fetch('/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                keyIds: keyIds
            })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Ошибка создания шаблона');
        }
        return await res.json();
    },

    // === ЗАГРУЗКА ФАЙЛОВ ===
    async getUploadUrl(fileName, valueIds) {
        const res = await fetch('/uploadUrl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                FileName: fileName, 
                ValueIds: valueIds 
            })
        });
        if (!res.ok) throw new Error('Ошибка при получении URL загрузки');
        return await res.json();
    },

    async uploadFileToMinio(uploadUrl, file) {
        const res = await fetch(uploadUrl, { 
            method: 'PUT', 
            body: file 
        });
        if (!res.ok) throw new Error('MinIO отклонил файл');
        return res;
    },

    // === ПОИСК И ФИЛЬТРАЦИЯ ===
    async searchFiles(offset, limit, dateFrom, dateTo, tags) {
        const params = new URLSearchParams();
        params.append('offset', offset);
        params.append('limit', limit);

        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);

        if (tags && tags.length > 0) {
            params.append('tagsJson', JSON.stringify(tags));
        }

        const res = await fetch(`/files?${params.toString()}`);
        if (!res.ok) throw new Error('Ошибка поиска файлов');
        return await res.json();
    },

    // === MINIO ===
    async loadMinioFiles() {
        const res = await fetch('/filesMinio');
        return await res.json();
    },

    // === УПРАВЛЕНИЕ ФАЙЛАМИ ===
    async deleteFile(fileId) {
        const res = await fetch(`/delete?fileId=${encodeURIComponent(fileId)}`, { 
            method: 'DELETE' 
        });
        if (!res.ok) throw new Error('Ошибка удаления файла');
        return res;
    },

    async downloadFile(fileId) {
        window.location.href = `/download?fileId=${encodeURIComponent(fileId)}`;
    }
};
