/**
 * UI Functions Module
 * Функции для обновления интерфейса
 */

const UI = {
    // === ВКЛАДКИ ===
    switchTab(tabName) {
        // Скрыть все вкладки
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Снять активный класс со всех кнопок вкладок
        document.querySelectorAll('.tab').forEach(btn => {
            btn.classList.remove('active');
        });

        // Показать выбранную вкладку
        const tabContent = document.getElementById(`tab-${tabName}`);
        if (tabContent) {
            tabContent.classList.add('active');
        }

        // Активировать кнопку вкладки
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn) {
            tabBtn.classList.add('active');
        }
    },

    // === МЕТАДАННЫЕ В СЕЛЕКТАХ ===
    populateTypeSelects(metadata) {
        const typeOptions = metadata.map(t => 
            `<option value="${t.id}">${t.name}</option>`
        ).join('');

        const keySelectForValue = document.getElementById('keySelectForValue');
        if (keySelectForValue) {
            keySelectForValue.innerHTML = typeOptions;
        }

        const searchTagType = document.getElementById('searchTagType');
        if (searchTagType) {
            searchTagType.innerHTML = typeOptions;
        }
    },

    escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    renderKeyMetadataList(metadata, searchQuery = '') {
        const container = document.getElementById('keyMetadataList');
        if (!container) return;

        if (!metadata || metadata.length === 0) {
            container.innerHTML = '<div class="empty-state">Ключи метаданных отсутствуют</div>';
            return;
        }

        const query = (searchQuery || '').toLowerCase();
        const filtered = metadata.filter(key =>
            !query || (key.name || '').toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state">Ключи не найдены</div>';
            return;
        }

        container.innerHTML = filtered.map(key => {
            if (APP.state.editingKeyId === key.id) {
                return `
                    <div class="metadata-row">
                        <input id="key-edit-input-${key.id}" class="inline-edit-input" value="${this.escapeHtml(key.name || '')}">
                        <div class="metadata-row-actions">
                            <button class="btn-small" onclick="APP.saveKeyEdit(${key.id})">Сохранить</button>
                            <button class="btn-small btn-danger" onclick="APP.cancelKeyEdit()">Отмена</button>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="metadata-row">
                    <div class="metadata-row-name">${this.escapeHtml(key.name || 'Без имени')}</div>
                    <div class="metadata-row-actions">
                        <button class="btn-small" onclick="APP.startKeyEdit(${key.id})">Изменить</button>
                        <button class="btn-small btn-danger" onclick="APP.deleteKeyMetadataWithConfirm(${key.id})">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderValueMetadataList(selectedKeyId, metadata, searchQuery = '') {
        const container = document.getElementById('valueMetadataList');
        if (!container) return;

        if (!selectedKeyId) {
            container.innerHTML = '<div class="empty-state">Выберите ключ, чтобы увидеть значения</div>';
            return;
        }

        const key = metadata.find(item => item.id === parseInt(selectedKeyId));
        if (!key) {
            container.innerHTML = '<div class="empty-state">Ключ не найден</div>';
            return;
        }

        if (!key.values || key.values.length === 0) {
            container.innerHTML = '<div class="empty-state">Значения для выбранного ключа отсутствуют</div>';
            return;
        }

        const query = (searchQuery || '').toLowerCase();
        const filtered = key.values.filter(value =>
            !query || (value.name || '').toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state">Значения не найдены</div>';
            return;
        }

        container.innerHTML = filtered.map(value => {
            if (APP.state.editingValueId === value.id) {
                return `
                    <div class="metadata-row">
                        <input id="value-edit-input-${value.id}" class="inline-edit-input" value="${this.escapeHtml(value.name || '')}">
                        <div class="metadata-row-actions">
                            <button class="btn-small" onclick="APP.saveValueEdit(${value.id})">Сохранить</button>
                            <button class="btn-small btn-danger" onclick="APP.cancelValueEdit()">Отмена</button>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="metadata-row">
                    <div class="metadata-row-name">${this.escapeHtml(value.name || 'Без имени')}</div>
                    <div class="metadata-row-actions">
                        <button class="btn-small" onclick="APP.startValueEdit(${value.id})">Изменить</button>
                        <button class="btn-small btn-danger" onclick="APP.deleteValueMetadataWithConfirm(${value.id})">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderTemplateTypesSelector(metadata) {
        const container = document.getElementById('templateTypesSelector');
        if (!metadata || metadata.length === 0) {
            container.innerHTML = '<span style="color:var(--text-muted);">Нет доступных типов</span>';
            return;
        }

        container.innerHTML = '<strong style="display:block; margin-bottom:8px; color:#374151;">Выберите ключи для шаблона:</strong>' +
            metadata.map(type => `
                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; cursor: pointer;">
                    <input type="checkbox" class="template-type-checkbox" value="${type.id}">
                    <span>${type.name}</span>
                </label>
            `).join('');
    },

    // === ШАБЛОНЫ ===
    populateTemplateSelect(templates) {
        const select = document.getElementById('templateSelect');
        select.innerHTML = '<option value="">-- Выберите шаблон --</option>' + 
            templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    },

    renderTemplateFields(template) {
        const container = document.getElementById('templateFieldsContainer');
        const fieldsContent = document.getElementById('templateFieldsContent');

        if (!template) {
            container.style.display = 'none';
            return;
        }

        let html = '';
        template.fields.forEach(field => {
            const options = field.values.map(v => 
                `<option value="${v.id}">${v.name}</option>`
            ).join('');
            
            html += `
                <div class="input-group">
                    <label><strong>${field.keyName}:</strong></label>
                    <select class="template-field" data-key-id="${field.keyId}">
                        <option value="">-- Выберите --</option>
                        ${options}
                    </select>
                </div>
            `;
        });
        
        fieldsContent.innerHTML = html;
        container.style.display = 'block';
    },

    // === ФИЛЬТРЫ И ТЕГИ ПОИСКА ===
    renderSearchTags(tags) {
        const container = document.getElementById('activeSearchTags');
        if (tags.length === 0) {
            container.innerHTML = '<span style="color:var(--text-muted); font-size:13px; font-style:italic;">Теги не выбраны</span>';
            return;
        }

        container.innerHTML = tags.map((t, index) => `
            <div class="tag-badge">
                [${t.typeName}] содержит "${t.value}"
                <button onclick="APP.removeSearchTag(${index})" title="Удалить фильтр">×</button>
            </div>
        `).join('');
    },

    // === ТАБЛИЦА ФАЙЛОВ БД ===
    renderDbTable(files) {
        const tbody = document.querySelector('#dbFilesTable tbody');
        
        if (files.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Файлы не найдены</td></tr>';
            return;
        }

        tbody.innerHTML = files.map(f => {
            const dateStr = f.lastUpdated ? new Date(f.lastUpdated).toLocaleString('ru-RU') : '—';
            const tagsHtml = (f.tags || []).map(t => 
                `<span class="tag-badge db-tag">[${t.key}] ${t.value}</span>`
            ).join(' ');
            
            return `
                <tr>
                    <td style="color: var(--text-muted); font-size: 12px;">${f.id}</td>
                    <td style="font-weight: 500;">${f.name}</td>
                    <td style="font-size: 13px;">${dateStr}</td>
                    <td>${tagsHtml}</td>
                    <td>
                        <button class="btn-small" onclick="API.downloadFile('${f.id}')">Скачать</button>
                        <button class="btn-small btn-danger" onclick="APP.deleteFileWithConfirm('${f.id}')">Удалить</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // === СПИСОК ФАЙЛОВ MINIO ===
    renderMinioFilesList(files) {
        const list = document.getElementById('minioFilesList');
        
        if (files.length === 0) {
            list.innerHTML = '<li class="empty-state">Файлы не загружены</li>';
            return;
        }

        list.innerHTML = files.map(f => `
            <li>
                <span class="file-item-name">📄 ${f.key}</span>
                <span class="file-item-size">${(f.size/1024).toFixed(1)} KB</span>
            </li>
        `).join('');
    },

    // === ПАГИНАЦИЯ ===
    renderPagination(currentOffset, limit, total) {
        const container = document.getElementById('paginationContainer');
        if (!container) return;

        const currentPage = Math.floor(currentOffset / limit) + 1;
        const totalPages = Math.ceil(total / limit);

        let html = '';
        
        if (currentOffset > 0) {
            html += `<button onclick="APP.goToPage(${currentOffset - limit})">← Назад</button>`;
        }

        html += `<span class="page-info">Страница <span class="current-page">${currentPage}</span> из ${totalPages}</span>`;

        if (currentOffset + limit < total) {
            html += `<button onclick="APP.goToPage(${currentOffset + limit})">Вперед →</button>`;
        }

        container.innerHTML = html;
    },

    // === ЛОАДЕР ===
    setButtonLoading(btnId, isLoading, text = 'Загрузка...') {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = isLoading;
            btn.innerText = isLoading ? text : 'Загрузить в Облако и БД';
        }
    },

    // === УВЕДОМЛЕНИЯ ===
    showNotification(message, type = 'info') {
        // Простая реализация - можно расширить
        if (type === 'success') {
            alert('✅ ' + message);
        } else if (type === 'error') {
            alert('❌ ' + message);
        } else {
            alert('ℹ️ ' + message);
        }
    }
};
