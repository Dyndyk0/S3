const Layout = {
    async loadShell() {
        await this.loadSidebar();
        await this.loadContentTabs();
    },

    async loadSidebar() {
        const html = await this.fetchPartial('partials/sidebar.html');
        const root = document.getElementById('sidebarRoot');
        if (root) root.innerHTML = html;
    },

    async loadContentTabs() {
        const tabNames = ['templates', 'keys', 'values', 'files', 'upload', 'minio'];
        const fragments = await Promise.all(tabNames.map(name => this.fetchPartial(`partials/${name}.html`)));

        const root = document.getElementById('mainRoot');
        if (!root) return;

        root.innerHTML = `
            <div class="main-content">
                <div class="content">
                    ${fragments.join('\n')}
                </div>
            </div>
        `;
    },

    async fetchPartial(path) {
        const res = await fetch(path);
        if (!res.ok) {
            console.error(`Не удалось загрузить шаблон: ${path}`, res.statusText);
            return `<div class="card">Ошибка загрузки шаблона: ${path}</div>`;
        }
        return await res.text();
    }
};
