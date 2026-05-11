/**
 * Application Main Module
 * Управление состоянием приложения
 */

const APP = {
    // === СОСТОЯНИЕ ===
    state: {
        metadata: [],
        activeSearchTags: [],
        currentTemplate: null,
        selectedValueKeyId: null,
        keySearchQuery: '',
        valueSearchQuery: '',
        editingKeyId: null,
        editingValueId: null,
        currentPage: 0,
        pageSize: 20,
        totalFiles: 0,
        lastSearchParams: {}
    },

    // === ИНИЦИАЛИЗАЦИЯ ===
    async init() {
        try {
            await Layout.loadShell();
            await this.loadInitialData();
            this.attachEventListeners();
            //UI.switchTab('files');
        } catch (e) {
            console.error('Ошибка инициализации:', e);
            UI.showNotification('Ошибка инициализации приложения', 'error');
        }
    },

    async loadInitialData() {
        await this.refreshMetadata();

        const templates = await API.loadTemplates();
        UI.populateTemplateSelect(templates);
        
        await this.loadFiles();
        await this.loadMinioFiles();
    },

    attachEventListeners() {
        // Обработчики для вкладок
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                if (tabName) {
                    UI.switchTab(tabName);
                }
            });
        });

        // Выбор шаблона
        const templateSelect = document.getElementById('templateSelect');
        if (templateSelect) {
            templateSelect.addEventListener('change', () => this.loadTemplateFields());
        }

        const keySelectForValue = document.getElementById('keySelectForValue');
        if (keySelectForValue) {
            keySelectForValue.addEventListener('change', () => this.selectValueKey());
        }

        // Загрузка файла
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.uploadFile());
        }
    },

    // === УПРАВЛЕНИЕ КЛЮЧАМИ И ЗНАЧЕНИЯМИ МЕТАДАННЫХ ===
    async createKeyMetadata() {
        const input = document.getElementById('newKeyName');
        const name = input.value.trim();
        
        if (!name) {
            UI.showNotification('Введите имя ключа', 'error');
            return;
        }

        try {
            await API.createKeyMetadata(name);
            input.value = '';
            await this.refreshMetadata();
            UI.showNotification('Ключ метаданных создан', 'success');
        } catch (e) {
            UI.showNotification('Ошибка: ' + e.message, 'error');
        }
    },

    async createValueMetadata() {
        const typeSelect = document.getElementById('keySelectForValue');
        const input = document.getElementById('newValueName');
        const keyId = typeSelect.value;
        const name = input.value.trim();

        if (!keyId || !name) {
            UI.showNotification('Выберите ключ и введите имя значения', 'error');
            return;
        }

        try {
            await API.createValueMetadata(keyId, name);
            input.value = '';
            this.state.selectedValueKeyId = keyId;
            await this.refreshMetadata();
            UI.showNotification('Значение метаданных создано', 'success');
        } catch (e) {
            UI.showNotification('Ошибка: ' + e.message, 'error');
        }
    },

    startKeyEdit(keyId) {
        this.state.editingKeyId = keyId;
        UI.renderKeyMetadataList(this.state.metadata, this.state.keySearchQuery);
    },

    cancelKeyEdit() {
        this.state.editingKeyId = null;
        UI.renderKeyMetadataList(this.state.metadata, this.state.keySearchQuery);
    },

    async saveKeyEdit(keyId) {
        const input = document.getElementById(`key-edit-input-${keyId}`);
        if (!input) return;
        const newName = input.value.trim();
        if (!newName) {
            UI.showNotification('Введите имя ключа', 'error');
            return;
        }

        try {
            await API.updateKeyMetadata(keyId, newName);
            this.state.editingKeyId = null;
            await this.refreshMetadata();
            UI.showNotification('Ключ метаданных обновлён', 'success');
        } catch (e) {
            UI.showNotification('Ошибка: ' + e.message, 'error');
        }
    },

    async deleteKeyMetadataWithConfirm(keyId) {
        if (!confirm('Удалить ключ метаданных и все связанные значения?')) {
            return;
        }

        try {
            await API.deleteKeyMetadata(keyId);
            if (this.state.selectedValueKeyId === String(keyId)) {
                this.state.selectedValueKeyId = null;
            }
            await this.refreshMetadata();
            UI.showNotification('Ключ метаданных удалён', 'success');
        } catch (e) {
            UI.showNotification('Ошибка: ' + e.message, 'error');
        }
    },

    startValueEdit(valueId) {
        this.state.editingValueId = valueId;
        UI.renderValueMetadataList(this.state.selectedValueKeyId, this.state.metadata, this.state.valueSearchQuery);
    },

    cancelValueEdit() {
        this.state.editingValueId = null;
        UI.renderValueMetadataList(this.state.selectedValueKeyId, this.state.metadata, this.state.valueSearchQuery);
    },

    async saveValueEdit(valueId) {
        const input = document.getElementById(`value-edit-input-${valueId}`);
        if (!input) return;
        const newName = input.value.trim();
        if (!newName) {
            UI.showNotification('Введите имя значения', 'error');
            return;
        }

        try {
            await API.updateValueMetadata({ id: valueId, name: newName });
            this.state.editingValueId = null;
            await this.refreshMetadata();
            UI.showNotification('Значение метаданных обновлено', 'success');
        } catch (e) {
            UI.showNotification('Ошибка: ' + e.message, 'error');
        }
    },

    async deleteValueMetadataWithConfirm(valueId) {
        if (!confirm('Удалить значение метаданных?')) {
            return;
        }

        try {
            await API.deleteValueMetadata(valueId);
            await this.refreshMetadata();
            UI.showNotification('Значение метаданных удалено', 'success');
        } catch (e) {
            UI.showNotification('Ошибка: ' + e.message, 'error');
        }
    },

    async refreshMetadata() {
        this.state.metadata = await API.loadMetadata();
        UI.populateTypeSelects(this.state.metadata);
        UI.renderTemplateTypesSelector(this.state.metadata);

        const keySelect = document.getElementById('keySelectForValue');
        if (keySelect && !this.state.selectedValueKeyId && this.state.metadata.length > 0) {
            this.state.selectedValueKeyId = String(this.state.metadata[0].id);
            keySelect.value = this.state.selectedValueKeyId;
        }

        UI.renderKeyMetadataList(this.state.metadata, this.state.keySearchQuery);
        UI.renderValueMetadataList(this.state.selectedValueKeyId, this.state.metadata, this.state.valueSearchQuery);
    },

    async searchKeys(query) {
        this.state.keySearchQuery = query.trim().toLowerCase();
        UI.renderKeyMetadataList(this.state.metadata, this.state.keySearchQuery);
    },

    async searchValues(query) {
        this.state.valueSearchQuery = query.trim().toLowerCase();
        UI.renderValueMetadataList(this.state.selectedValueKeyId, this.state.metadata, this.state.valueSearchQuery);
    },

    async selectValueKey() {
        const keySelect = document.getElementById('keySelectForValue');
        if (!keySelect) return;

        this.state.selectedValueKeyId = keySelect.value || null;
        UI.renderValueMetadataList(this.state.selectedValueKeyId, this.state.metadata, this.state.valueSearchQuery);
    },

    async createTemplate() {
        const nameInput = document.getElementById('templateNameInput');
        const name = nameInput.value.trim();

        if (!name) {
            UI.showNotification('Введите имя шаблона', 'error');
            return;
        }

        const selectedKeyIds = Array.from(
            document.querySelectorAll('.template-type-checkbox:checked')
        ).map(cb => parseInt(cb.value));

        if (selectedKeyIds.length === 0) {
            UI.showNotification('Выберите хотя бы один тип для шаблона', 'error');
            return;
        }

        try {
            await API.createTemplate(name, selectedKeyIds);
            nameInput.value = '';
            document.querySelectorAll('.template-type-checkbox').forEach(cb => cb.checked = false);
            
            const templates = await API.loadTemplates();
            UI.populateTemplateSelect(templates);
            UI.showNotification('Шаблон успешно создан', 'success');
        } catch (e) {
            UI.showNotification('Ошибка: ' + e.message, 'error');
        }
    },

    async loadTemplateFields() {
        const templateId = document.getElementById('templateSelect').value;

        if (!templateId) {
            this.state.currentTemplate = null;
            UI.renderTemplateFields(null);
            return;
        }

        try {
            this.state.currentTemplate = await API.getTemplateById(templateId);
            UI.renderTemplateFields(this.state.currentTemplate);
        } catch (e) {
            UI.showNotification('Ошибка загрузки шаблона: ' + e.message, 'error');
        }
    },

    // === ЗАГРУЗКА ФАЙЛОВ ===
    async uploadFile() {
        const fileInput = document.getElementById('fileInput');
        const templateId = document.getElementById('templateSelect').value;

        if (fileInput.files.length === 0) {
            UI.showNotification('Выберите файл', 'error');
            return;
        }

        if (!templateId) {
            UI.showNotification('Выберите шаблон', 'error');
            return;
        }

        if (!this.state.currentTemplate) {
            UI.showNotification('Шаблон не загружен', 'error');
            return;
        }

        // Собираем выбранные значения
        const selectedValues = {};
        const fields = document.querySelectorAll('.template-field');
        
        for (let field of fields) {
            const valueId = parseInt(field.value);
            if (!valueId) {
                const fieldName = field.parentElement.querySelector('label').textContent;
                UI.showNotification(`Выберите значение для поля "${fieldName}"`, 'error');
                return;
            }
            selectedValues[field.dataset.keyId] = valueId;
        }

        const file = fileInput.files[0];
        const valueIds = Object.values(selectedValues);

        try {
            UI.setButtonLoading('uploadBtn', true);

            // Получаем URL загрузки
            const { id, uploadUrl } = await API.getUploadUrl(file.name, valueIds);

            // Загружаем в MinIO
            await API.uploadFileToMinio(uploadUrl, file);

            UI.showNotification('Файл успешно загружен!', 'success');
            fileInput.value = '';
            document.getElementById('templateSelect').value = '';
            document.getElementById('templateFieldsContainer').style.display = 'none';

            // Обновляем списки
            await this.loadFiles();
            await this.loadMinioFiles();
        } catch (e) {
            UI.showNotification('Ошибка: ' + e.message, 'error');
        } finally {
            UI.setButtonLoading('uploadBtn', false);
        }
    },

    // === ПОИСК И ФИЛЬТРАЦИЯ ===
    addSearchTag() {
        const select = document.getElementById('searchTagType');
        const keyId = parseInt(select.value);
        const typeName = select.options[select.selectedIndex].text;
        const value = document.getElementById('searchTagCat').value.trim();

        if (!value) {
            UI.showNotification('Введите часть названия категории для поиска', 'error');
            return;
        }

        this.state.activeSearchTags.push({ keyId, typeName, value });
        document.getElementById('searchTagCat').value = '';
        UI.renderSearchTags(this.state.activeSearchTags);
    },

    removeSearchTag(index) {
        this.state.activeSearchTags.splice(index, 1);
        UI.renderSearchTags(this.state.activeSearchTags);
    },

    async loadFiles() {
        const offset = this.state.currentPage || 0;
        const limit = this.state.pageSize;
        const dateFromRaw = document.getElementById('searchDateFrom')?.value || '';
        const dateToRaw = document.getElementById('searchDateTo')?.value || '';

        const dateFrom = dateFromRaw ? new Date(dateFromRaw).toISOString() : '';
        const dateTo = dateToRaw ? new Date(dateToRaw).toISOString() : '';

        const tags = this.state.activeSearchTags.map(t => ({ 
            keyId: t.keyId, 
            value: t.value 
        }));

        try {
            const files = await API.searchFiles(offset, limit, dateFrom, dateTo, tags);
            UI.renderDbTable(files);
            
            // Сохраняем параметры для пагинации
            this.state.lastSearchParams = { offset, limit, dateFrom, dateTo, tags };
            
            // Показываем информацию о пагинации
            const pageInfo = document.getElementById('pageInfo');
            if (pageInfo) {
                const currentPage = Math.floor(offset / limit) + 1;
                pageInfo.innerHTML = `Страница ${currentPage} (записей: ${files.length})`;
            }
        } catch (e) {
            console.error('Ошибка поиска:', e);
            UI.showNotification('Ошибка поиска файлов', 'error');
        }
    },

    searchFiles() {
        this.state.currentPage = 0;
        this.loadFiles();
    },

    goToPage(newOffset) {
        if (newOffset >= 0) {
            this.state.currentPage = newOffset;
            this.loadFiles();
        }
    },

    nextPage() {
        this.state.currentPage += this.state.pageSize;
        this.loadFiles();
    },

    prevPage() {
        if (this.state.currentPage > 0) {
            this.state.currentPage -= this.state.pageSize;
            this.loadFiles();
        }
    },

    // === УПРАВЛЕНИЕ ФАЙЛАМИ ===
    async deleteFileWithConfirm(fileId) {
        if (!confirm('Вы уверены, что хотите безвозвратно удалить файл?')) {
            return;
        }

        try {
            await API.deleteFile(fileId);
            UI.showNotification('Файл удален', 'success');
            await this.loadFiles();
            await this.loadMinioFiles();
        } catch (e) {
            UI.showNotification('Ошибка удаления: ' + e.message, 'error');
        }
    },

    async loadMinioFiles() {
        try {
            const files = await API.loadMinioFiles();
            UI.renderMinioFilesList(files);
        } catch (e) {
            console.error('Ошибка загрузки MinIO:', e);
        }
    },

    refreshMinioFiles() {
        this.loadMinioFiles();
    },

    // === ПОИСК В SIDEBAR ===
    searchInTags(query) {
        const container = document.getElementById('tagsSearchResults');
        if (!container) return;

        query = query.toLowerCase().trim();
        if (!query) {
            container.innerHTML = '';
            return;
        }

        const results = this.state.metadata.filter(type =>
            type.name.toLowerCase().includes(query) ||
            (type.values && type.values.some(value => 
                value.name.toLowerCase().includes(query)
            ))
        );

        container.innerHTML = results.map(type => `
            <div class="card">
                <h4>${type.name}</h4>
                <div style="font-size: 12px; color: var(--text-muted);">
                    ${type.values ? type.values.length + ' значений' : 'Нет значений'}
                </div>
            </div>
        `).join('');
    },

    searchInTemplates(query) {
        // Функция для будущей реализации поиска по шаблонам
        console.log('Search templates:', query);
    }
};

// === ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ===
document.addEventListener('DOMContentLoaded', () => {
    APP.init();
});
