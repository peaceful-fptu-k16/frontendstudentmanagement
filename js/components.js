// =====================================================
// UI COMPONENTS AND COMMON FUNCTIONS
// =====================================================
// Module chứa các UI components: Notification, Loading, Modal, Form, Table, Pagination, Filter, Delete Modal

// =====================================================
// NOTIFICATION SYSTEM
// =====================================================

/**
 * NotificationManager Class
 * Quản lý hiển thị notifications (success, error, warning, info)
 * Support queue để show multiple notifications tuần tự
 */
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notification');
        this.queue = [];          // Queue chứa notifications pending
        this.isShowing = false;   // Flag đang show notification
    }

    /**
     * Show notification
     * @param {string} message - Message cần hiển thị
     * @param {string} type - Type: success, error, warning, info
     * @param {number} duration - Duration hiển thị (ms)
     */
    show(message, type = 'info', duration = APP_CONFIG.NOTIFICATION.DURATION) {
        // Add vào queue
        this.queue.push({ message, type, duration });
        
        // Process queue nếu không đang show
        if (!this.isShowing) {
            this.processQueue();
        }
    }

    /**
     * Process notification queue (show từng cái một)
     */
    async processQueue() {
        if (this.queue.length === 0) {
            this.isShowing = false;
            return;
        }

        this.isShowing = true;
        const { message, type, duration } = this.queue.shift();

        // Update notification content
        const icon = this.getIcon(type);
        this.container.className = `notification ${type}`;
        this.container.querySelector('.notification-icon').className = `notification-icon ${icon}`;
        this.container.querySelector('.notification-message').textContent = message;

        // Show notification
        this.container.classList.add('show');

        // Hide sau duration
        setTimeout(() => {
            this.container.classList.remove('show');
            setTimeout(() => this.processQueue(), 300); // Wait animation xong
        }, duration);
    }

    /**
     * Get icon class dựa vào notification type
     * @param {string} type - Notification type
     * @returns {string} FontAwesome icon class
     */
    getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// Loading Manager
class LoadingManager {
    constructor() {
        this.overlay = document.getElementById('loadingOverlay');
        this.activeRequests = 0;
    }

    show() {
        this.activeRequests++;
        this.overlay.classList.remove('hidden');
    }

    hide() {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        if (this.activeRequests === 0) {
            this.overlay.classList.add('hidden');
        }
    }

    reset() {
        this.activeRequests = 0;
        this.overlay.classList.add('hidden');
    }
}

// Modal Manager
class ModalManager {
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        this.closeBtn = this.modal.querySelector('.modal-close');
        this.cancelBtn = this.modal.querySelector('#cancelBtn');
        
        this.bindEvents();
    }

    bindEvents() {
        // Close on close button click
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }

        // Close on cancel button click
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.hide());
        }

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.hide();
            }
        });
    }

    show() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = this.modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    hide() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Table Builder
class TableBuilder {
    constructor(tableBodyId) {
        this.tableBodyId = tableBodyId;
        this.tbody = document.getElementById(tableBodyId);
        this.table = this.tbody ? this.tbody.closest('table') : null;
    }

    clear() {
        if (!this.tbody) {
            console.warn(`Table body not found for ${this.tableBodyId}`);
            return;
        }
        this.tbody.innerHTML = '';
    }

    addRow(data) {
        if (!this.tbody) {
            console.warn(`Table body not found for ${this.tableBodyId}`);
            return null;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = data;
        this.tbody.appendChild(row);
        return row;
    }

    setEmptyState(message = 'Không có dữ liệu') {
        if (!this.table || !this.tbody) {
            console.warn(`Table not found for ${this.tableBodyId}`);
            return;
        }
        
        const thead = this.table.querySelector('thead tr');
        const colCount = thead ? thead.children.length : 1;
        
        this.tbody.innerHTML = `
            <tr>
                <td colspan="${colCount}" class="text-center" style="padding: 2rem; color: #718096;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    ${message}
                </td>
            </tr>
        `;
    }
    
    setLoadingState() {
        if (!this.table || !this.tbody) {
            return;
        }
        
        const thead = this.table.querySelector('thead tr');
        const colCount = thead ? thead.children.length : 1;
        
        this.tbody.innerHTML = `
            <tr>
                <td colspan="${colCount}" class="text-center" style="padding: 2rem; color: #718096;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Đang tải dữ liệu...
                </td>
            </tr>
        `;
    }
}

// Pagination Builder
class PaginationBuilder {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.onPageChange = null;
    }

    render(currentPage, totalPages, totalItems, pageSize = 10) {
        if (!this.container) return;
        
        if (totalPages <= 1) {
            this.container.innerHTML = totalItems > 0 ? `
                <div class="pagination-info">
                    Hiển thị ${totalItems} sinh viên
                </div>
            ` : '';
            return;
        }

        let html = '<div class="pagination-controls">';

        // First and Previous buttons
        html += `
            <button ${currentPage <= 1 ? 'disabled' : ''} data-page="1" title="Trang đầu">
                <i class="fas fa-angle-double-left"></i>
            </button>
            <button ${currentPage <= 1 ? 'disabled' : ''} data-page="${currentPage - 1}" title="Trang trước">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            html += `<button data-page="1">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next and Last buttons
        html += `
            <button ${currentPage >= totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" title="Trang sau">
                <i class="fas fa-chevron-right"></i>
            </button>
            <button ${currentPage >= totalPages ? 'disabled' : ''} data-page="${totalPages}" title="Trang cuối">
                <i class="fas fa-angle-double-right"></i>
            </button>
        `;

        html += '</div>';

        // Page info
        const startItem = (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(currentPage * pageSize, totalItems);
        
        html += `
            <div class="pagination-info">
                Hiển thị ${startItem}-${endItem} trong ${totalItems} sinh viên
            </div>
        `;

        this.container.innerHTML = html;

        // Bind events
        this.container.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (this.onPageChange && page !== currentPage && !btn.disabled) {
                    this.onPageChange(page);
                }
            });
        });
    }
}

// Form Handler
class FormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.fields = {};
        this.validators = {};
        this.onSubmit = null;
        
        this.bindEvents();
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Real-time validation
        this.form.addEventListener('input', (e) => {
            if (e.target.name && this.validators[e.target.name]) {
                this.validateField(e.target.name, e.target.value);
            }
        });
    }

    setValidator(fieldName, validator) {
        this.validators[fieldName] = validator;
    }

    validateField(fieldName, value) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        const errorElement = field.parentNode.querySelector('.form-error');
        
        const error = this.validators[fieldName](value);
        
        if (error) {
            field.classList.add('error');
            if (errorElement) {
                errorElement.textContent = error;
            } else {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'form-error';
                errorDiv.textContent = error;
                field.parentNode.appendChild(errorDiv);
            }
            return false;
        } else {
            field.classList.remove('error');
            if (errorElement) {
                errorElement.remove();
            }
            return true;
        }
    }

    validateAll() {
        let isValid = true;
        const formData = this.getFormData();
        
        Object.keys(this.validators).forEach(fieldName => {
            if (!this.validateField(fieldName, formData[fieldName] || '')) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    setFormData(data) {
        Object.entries(data).forEach(([key, value]) => {
            const field = this.form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'date' && value) {
                    field.value = formatDateForInput(value);
                } else if (value !== null && value !== undefined) {
                    field.value = value;
                }
            }
        });
    }

    clearForm() {
        this.form.reset();
        this.clearErrors();
    }

    clearErrors() {
        this.form.querySelectorAll('.form-error').forEach(error => error.remove());
        this.form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
    }

    async handleSubmit() {
        if (!this.validateAll()) {
            notifications.error('Vui lòng kiểm tra lại thông tin đã nhập');
            return;
        }

        if (this.onSubmit) {
            const formData = this.getFormData();
            await this.onSubmit(cleanFormData(formData));
        }
    }
}

// Filter Manager
class FilterManager {
    constructor() {
        this.filters = {};
        this.onFilterChange = null;
    }

    setFilter(key, value) {
        const oldValue = this.filters[key];
        
        if (value === null || value === undefined || value === '') {
            delete this.filters[key];
        } else {
            this.filters[key] = value;
        }
        
        // Only trigger change if value actually changed
        if (oldValue !== this.filters[key] || (oldValue && !this.filters[key])) {
            if (this.onFilterChange) {
                this.onFilterChange(this.filters);
            }
        }
    }

    getFilters() {
        return { ...this.filters };
    }

    clearFilters() {
        const hasFilters = Object.keys(this.filters).length > 0;
        this.filters = {};
        
        if (hasFilters && this.onFilterChange) {
            this.onFilterChange(this.filters);
        }
    }

    // Get filter value
    getFilter(key) {
        return this.filters[key] || '';
    }

    // Check if any filters are active
    hasActiveFilters() {
        return Object.keys(this.filters).length > 0;
    }

    bindToElement(element, filterKey) {
        if (!element) return;
        
        element.addEventListener('change', (e) => {
            this.setFilter(filterKey, e.target.value);
        });

        element.addEventListener('input', debounce((e) => {
            this.setFilter(filterKey, e.target.value);
        }, 300));
    }
}

// Chart Helper
class ChartHelper {
    static createPieChart(canvas, data, options = {}) {
        return new Chart(canvas, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: CHART_CONFIG.COLORS.PRIMARY.slice(0, data.labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                ...CHART_CONFIG.DEFAULT_OPTIONS,
                ...options
            }
        });
    }

    static createBarChart(canvas, data, options = {}) {
        return new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: data.label || 'Giá trị',
                    data: data.values,
                    backgroundColor: CHART_CONFIG.COLORS.PRIMARY[0],
                    borderColor: CHART_CONFIG.COLORS.PRIMARY[1],
                    borderWidth: 1
                }]
            },
            options: {
                ...CHART_CONFIG.DEFAULT_OPTIONS,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                ...options
            }
        });
    }

    static createLineChart(canvas, data, options = {}) {
        return new Chart(canvas, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: data.datasets.map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.values,
                    borderColor: CHART_CONFIG.COLORS.PRIMARY[index % CHART_CONFIG.COLORS.PRIMARY.length],
                    backgroundColor: CHART_CONFIG.COLORS.PRIMARY[index % CHART_CONFIG.COLORS.PRIMARY.length] + '20',
                    fill: false,
                    tension: 0.1
                }))
            },
            options: {
                ...CHART_CONFIG.DEFAULT_OPTIONS,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                ...options
            }
        });
    }
}

// Delete Modal Manager
class DeleteModalManager {
    constructor() {
        this.modal = document.getElementById('deleteModal');
        this.confirmBtn = document.getElementById('confirmDeleteBtn');
        this.cancelBtn = document.getElementById('cancelDeleteBtn');
        this.closeBtn = this.modal.querySelector('.modal-close');
        this.studentNameEl = document.getElementById('deleteStudentName');
        this.studentIdEl = document.getElementById('deleteStudentId');
        
        this.currentStudent = null;
        this.onConfirm = null;
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Cancel button
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.hide());
        }
        
        // Close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Confirm button
        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', async () => {
                if (this.onConfirm && this.currentStudent) {
                    setButtonLoading(this.confirmBtn, true);
                    try {
                        await this.onConfirm(this.currentStudent);
                        this.hide();
                    } catch (error) {
                        console.error('Delete error:', error);
                    } finally {
                        setButtonLoading(this.confirmBtn, false);
                    }
                }
            });
        }
        
        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal || e.target.classList.contains('delete-modal-backdrop')) {
                this.hide();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.hide();
            }
        });
    }
    
    show(student, onConfirm) {
        this.currentStudent = student;
        this.onConfirm = onConfirm;
        
        // Update student info
        if (this.studentNameEl) {
            this.studentNameEl.textContent = student.full_name || `${student.first_name} ${student.last_name}`;
        }
        if (this.studentIdEl) {
            this.studentIdEl.textContent = `Mã SV: ${student.student_id}`;
        }
        
        // Show modal with animation
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Trigger animation on next frame
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });
        
        // Focus cancel button by default
        setTimeout(() => {
            if (this.cancelBtn) {
                this.cancelBtn.focus();
            }
        }, 100);
    }
    
    hide() {
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Hide modal after animation
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
        
        this.currentStudent = null;
        this.onConfirm = null;
    }
}

// Initialize global instances
const notifications = new NotificationManager();
const loading = new LoadingManager();
const deleteModal = new DeleteModalManager();

// Export for global access
window.notifications = notifications;
window.loading = loading;
window.deleteModal = deleteModal;