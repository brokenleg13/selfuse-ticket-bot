/*
 * 根据 config/config.js 里 platforms.<platform>.fields + commonFields 生成卡片高级字段。
 * 平台由页面里提交按钮的 id 决定（melon / yes24 / interpark）。
 * 新增参数只需改 config.js，不需要改表单 HTML。
 */
(function() {
    function escapeHtml(value) {
        return String(value === undefined || value === null ? "" : value)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function defaultFor(config, platform, field) {
        const source = field.defaultFrom === "runtime" ? config.runtime : config[platform];
        const value = source && source[field.key];
        return value === undefined ? "" : value;
    }

    function renderField(config, platform, field) {
        if (field.section) {
            const title = document.createElement("div");
            title.className = "form-section-title";
            title.textContent = field.section;
            return title;
        }

        const row = document.createElement("div");
        row.className = "form-row";
        const id = escapeHtml(field.key);
        const defaultValue = defaultFor(config, platform, field);
        const placeholder = field.placeholder || (defaultValue !== "" ? `默认 ${defaultValue}` : "");
        let control;
        if (field.type === "select") {
            const options = (field.options || [])
                .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
                .join("");
            control = `<select id="${id}" name="${id}">${options}</select>`;
        } else if (field.type === "text") {
            control = `<input type="text" id="${id}" name="${id}" placeholder="${escapeHtml(placeholder)}">`;
        } else {
            control = `<input type="number" id="${id}" name="${id}" min="${field.min === undefined ? 0 : field.min}" step="${field.step || 1}" placeholder="${escapeHtml(placeholder)}">`;
        }
        row.innerHTML = `<label for="${id}">${escapeHtml(field.label)}</label>${control}`;
        return row;
    }

    function render() {
        const config = window.TicketBotConfig;
        const fieldset = document.querySelector("fieldset");
        const submit = document.querySelector('button[type="submit"]');
        if (!config || !fieldset || !submit || fieldset.dataset.fieldsRendered) {
            return;
        }
        fieldset.dataset.fieldsRendered = "1";
        const platform = submit.id;
        const meta = config.platforms[platform] || {};

        const concertIdInput = document.getElementById("concert-id");
        if (concertIdInput && meta.concertIdPlaceholder) concertIdInput.placeholder = meta.concertIdPlaceholder;
        const sectionInput = document.getElementById("section");
        if (sectionInput && meta.sectionPlaceholder) sectionInput.placeholder = meta.sectionPlaceholder;

        const extra = document.createElement("div");
        extra.className = "interpark-extra-config";
        (meta.fields || []).concat(config.commonFields || []).forEach(field => {
            const element = renderField(config, platform, field);
            const anchor = field.before && document.getElementById(field.before);
            const anchorRow = anchor && anchor.closest(".form-row");
            if (anchorRow) {
                fieldset.insertBefore(element, anchorRow);
            } else {
                extra.appendChild(element);
            }
        });
        fieldset.appendChild(extra);
    }

    document.addEventListener("include-html-loaded", render);
})();
