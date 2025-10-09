// =====================================================
// STUDENTS MANAGEMENT MODULE
// =====================================================
// Module manages all CRUD operations for students
// Includes: Display, Filter, Sort, Pagination, Edit, Delete

/**
 * StudentsManager Class
 * Main class managing students - handles all operations
 */
class StudentsManager {
    constructor() {
        // Pagination state
        this.currentPage = 1;              // Current page number
        this.totalPages = 1;               // Total number of pages
        this.totalItems = 0;               // Total number of students
        this.pageSize = 10;                // Students per page
        
        // Data storage
        this.students = [];                // Current students (after filter & sort)
        this.allStudents = [];             // All students from API
        this.filteredStudents = [];        // Students after filtering
        
        // UI state
        this.editingStudent = null;        // Student being edited
        this.currentSort = { sortBy: 'student_id', order: 'asc' }; // Current sort
        this.searchTimeout = null;         // Debounce timeout for search
        this.selectedStudents = new Set(); // Set containing IDs of selected students
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeComponents();
                this.bindEvents();
                this.loadAllStudents();
                this.setupStorageListener();
            });
        } else {
            this.initializeComponents();
            this.bindEvents();
            this.loadAllStudents();
            this.setupStorageListener();
        }
    }

    /**
     * Initialize tất cả components (Modal, Form, Table, Pagination, Filters)
     */
    initializeComponents() {
        // Initialize components
        this.modal = new ModalManager('studentModal');
        this.form = new FormHandler('studentForm');
        this.table = new TableBuilder('studentsTableBody');
        this.pagination = new PaginationBuilder('pagination');
        this.filters = new FilterManager();
        
        // Check if required elements exist
        if (!document.getElementById('studentsTableBody')) {
            console.error('Students table body not found');
            return;
        }

        // Set up form validators cho từng field
        this.form.setValidator('student_id', (value) => validateStudentId(value));
        this.form.setValidator('first_name', (value) => validateName(value, 'Họ'));
        this.form.setValidator('last_name', (value) => validateName(value, 'Tên'));
        this.form.setValidator('email', (value) => validateEmail(value));
        this.form.setValidator('birth_date', (value) => validateBirthDate(value));
        this.form.setValidator('math_score', (value) => validateScore(value, 'Điểm Toán'));
        this.form.setValidator('literature_score', (value) => validateScore(value, 'Điểm Văn'));
        this.form.setValidator('english_score', (value) => validateScore(value, 'Điểm Tiếng Anh'));

        // Set up form submit handler
        this.form.onSubmit = (data) => this.handleFormSubmit(data);

        // Set up pagination handler
        this.pagination.onPageChange = (page) => this.changePage(page);

        // Set up filter handlers
        this.filters.onFilterChange = (filters) => this.applyFilters(filters);
    }

    /**
     * Bind tất cả event handlers (buttons, inputs, filters)
     */
    bindEvents() {
        // Add student button - Mở modal thêm student mới
        document.getElementById('addStudentBtn').addEventListener('click', () => {
            this.openAddModal();
        });

        // Search input with debounce - Tìm kiếm realtime
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                // Clear previous timeout để debounce
                if (this.searchTimeout) {
                    clearTimeout(this.searchTimeout);
                }
                
                // Set new timeout for local search (150ms delay)
                this.searchTimeout = setTimeout(() => {
                    this.currentPage = 1; // Reset về trang 1 khi search
                    this.filters.setFilter('search', e.target.value);
                }, 150);
            });
        }

        // Hometown filter dropdown
        const hometownFilter = document.getElementById('hometownFilter');
        if (hometownFilter) {
            hometownFilter.addEventListener('change', (e) => {
                this.currentPage = 1;
                this.filters.setFilter('hometown', e.target.value);
            });
        }
        
        // Grade filter dropdown
        const gradeFilter = document.getElementById('gradeFilter');
        if (gradeFilter) {
            gradeFilter.addEventListener('change', (e) => {
                this.currentPage = 1;
                this.filters.setFilter('grade', e.target.value);
            });
        }
        
        // Clear all filters button
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
        
        // Table sorting
        this.bindSortingEvents();
        
        // Pagination events
        this.bindPaginationEvents();
        
        // Page size selector - Change số students mỗi trang
        const pageSizeSelect = document.getElementById('pageSizeSelect');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.pageSize = parseInt(e.target.value);
                this.currentPage = 1; // Reset về trang 1
                this.applyLocalFilters();
            });
        }
    }
    
    /**
     * Clear tất cả filters (search, hometown, grade)
     */
    clearAllFilters() {
        // Clear filter inputs
        const searchInput = document.getElementById('searchInput');
        const hometownFilter = document.getElementById('hometownFilter');
        const gradeFilter = document.getElementById('gradeFilter');
        
        if (searchInput) searchInput.value = '';
        if (hometownFilter) hometownFilter.value = '';
        if (gradeFilter) gradeFilter.value = '';
        
        // Clear filters and reset về trang 1
        this.currentPage = 1;
        this.filters.clearFilters();
    }
    
    /**
     * Bind sorting events cho table headers
     */
    bindSortingEvents() {
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const sortBy = header.dataset.sort;
                let order = 'asc';
                
                // Toggle order nếu click vào cùng column
                if (this.currentSort.sortBy === sortBy) {
                    order = this.currentSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    // Column mới, bắt đầu với ascending
                    order = 'asc';
                }
                
                this.applySorting(sortBy, order);
                this.updateSortHeaders(sortBy, order);
            });
        });
        
        // Initialize sort headers với sort mặc định
        this.updateSortHeaders(this.currentSort.sortBy, this.currentSort.order);
    }

    /**
     * Bind pagination events (previous, next, page numbers)
     */
    bindPaginationEvents() {
        // Delegate pagination events to the pagination container
        const paginationContainer = document.getElementById('pagination');
        if (paginationContainer) {
            paginationContainer.addEventListener('click', (e) => {
                // Page buttons với data-page attribute
                if (e.target.hasAttribute('data-page') && !e.target.disabled) {
                    e.preventDefault();
                    const page = parseInt(e.target.dataset.page);
                    if (page && page !== this.currentPage) {
                        this.currentPage = page;
                        this.applyLocalFilters();
                    }
                }
            });
        }
    }
    
    /**
     * Update sort indicators trên table headers
     * @param {string} activeSortBy - Column đang sort
     * @param {string} activeOrder - Order (asc/desc)
     */
    updateSortHeaders(activeSortBy, activeOrder) {
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            // Remove tất cả classes
            header.classList.remove('active', 'sort-asc', 'sort-desc');
            
            // Add class cho column đang sort
            if (header.dataset.sort === activeSortBy) {
                header.classList.add('active', `sort-${activeOrder}`);
            }
        });
    }

    // =====================================================
    // DATA LOADING
    // =====================================================
    
    /**
     * Load tất cả students từ API
     * Hàm này handle nhiều scenarios: load with/without pagination, fallback strategies
     */
    async loadAllStudents() {
        try {
            this.table.setLoadingState();
            this.allStudents = [];
            
            // First check API health
            const isHealthy = await api.healthCheck();
            if (!isHealthy) {
                throw new Error('Server không phản hồi. Vui lòng kiểm tra kết nối.');
            }
            
            try {
                // Try different parameter combinations to find what works
                console.log('Trying to load students with minimal parameters...');
                
                let response;
                try {
                    // Try with just page parameter
                    response = await api.getStudents({ page: 1 });
                    console.log('Success with page=1');
                } catch (pageError) {
                    console.warn('Failed with page=1, trying without parameters:', pageError);
                    // Try with no parameters at all
                    response = await api.getStudents();
                    console.log('Success with no parameters');
                }
                
                this.allStudents = response.items || [];
                console.log(`Loaded ${this.allStudents.length} students from API`);
            } catch (defaultError) {
                console.warn('Failed with specific parameters, trying pagination:', defaultError);
                
                // Fallback: Load with pagination using server default page_size
                let allStudents = [];
                let currentPage = 1;
                let hasMorePages = true;
                
                while (hasMorePages) {
                    try {
                        // Use server's default page_size, just specify page number
                        const response = await api.getStudents({ page: currentPage });
                        
                        const items = response.items || [];
                        allStudents = allStudents.concat(items);
                        
                        // Use response pagination info
                        hasMorePages = response.has_next === true;
                        currentPage++;
                        
                        console.log(`Loaded page ${currentPage - 1}: ${items.length} students (has_next: ${response.has_next})`);
                        
                        // Prevent infinite loop
                        if (currentPage > 100) {
                            console.warn('Stopped loading after 100 pages to prevent infinite loop');
                            break;
                        }
                        
                    } catch (pageError) {
                        console.error(`Error loading page ${currentPage}:`, pageError);
                        break;
                    }
                }
                
                this.allStudents = allStudents;
                console.log(`Loaded total ${this.allStudents.length} students from API (paginated)`);
            }
            
            this.applyLocalFilters();
            this.updateHometownFilter();

        } catch (error) {
            console.error('Error loading students from API:', error);
            
            let errorMessage = 'Không thể tải danh sách sinh viên từ server';
            if (error.status === 422) {
                errorMessage = 'Lỗi tham số API. Vui lòng kiểm tra cấu hình server.';
            } else if (error.status === 404) {
                errorMessage = 'API endpoint không tồn tại.';
            } else if (error.status === 500) {
                errorMessage = 'Lỗi server nội bộ.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            notifications.error(errorMessage);
            this.table.setEmptyState('Lỗi khi tải dữ liệu từ server');
            
            // Reset to empty state
            this.allStudents = [];
            this.applyLocalFilters();
        }
    }

    /**
     * Refresh toàn bộ display sau khi data thay đổi
     */
    refreshDisplay() {
        this.applyLocalFilters();
        this.renderStudentsTable();
        this.renderPagination();
        this.updateStats();
        console.log('Display refreshed with', this.allStudents.length, 'total students');
    }

    /**
     * Setup listener cho API changes (cross-tab synchronization)
     */
    setupStorageListener() {
        // Listen for custom events when data changes
        window.addEventListener('studentsUpdated', () => {
            console.log('Students updated event received, reloading from API...');
            this.loadAllStudents();
        });
        
        // Listen for individual student operations
        window.addEventListener('studentCreated', () => {
            console.log('Student created, reloading from API...');
            this.loadAllStudents();
        });
        
        window.addEventListener('studentUpdated', () => {
            console.log('Student updated, reloading from API...');
            this.loadAllStudents();
        });
        
        window.addEventListener('studentDeleted', () => {
            console.log('Student deleted, reloading from API...');
            this.loadAllStudents();
        });
    }

    // =====================================================
    // FILTERING & SORTING
    // =====================================================
    
    /**
     * Apply filters và sorting locally (client-side)
     * Hàm này filter -> sort -> paginate data từ allStudents
     */
    applyLocalFilters() {
        // Start với toàn bộ students
        let filteredStudents = [...this.allStudents];
        const filters = this.filters.getFilters();
        
        // Filter theo search term (tìm trong nhiều fields)
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredStudents = filteredStudents.filter(student => {
                return (
                    student.student_id?.toLowerCase().includes(searchTerm) ||
                    student.first_name?.toLowerCase().includes(searchTerm) ||
                    student.last_name?.toLowerCase().includes(searchTerm) ||
                    student.full_name?.toLowerCase().includes(searchTerm) ||
                    student.email?.toLowerCase().includes(searchTerm) ||
                    student.hometown?.toLowerCase().includes(searchTerm)
                );
            });
        }
        
        // Filter theo hometown
        if (filters.hometown) {
            filteredStudents = filteredStudents.filter(student => 
                student.hometown === filters.hometown
            );
        }
        
        // Filter theo grade (A, B, C, D, F)
        if (filters.grade) {
            filteredStudents = filteredStudents.filter(student => {
                const grade = calculateGrade(student.average_score);
                return grade === filters.grade;
            });
        }
        
        // Apply sorting
        this.sortStudents(filteredStudents);
        
        // Lưu filtered students
        this.filteredStudents = filteredStudents;
        
        // Calculate pagination
        this.totalItems = filteredStudents.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        
        // Ensure current page is valid
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        } else if (this.currentPage < 1) {
            this.currentPage = 1;
        }
        
        // Slice data cho current page
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.students = filteredStudents.slice(startIndex, endIndex);
        
        // Render UI
        this.renderStudentsTable();
        this.renderPagination();
        this.updateStats();
        
        // Update analytics nếu analytics section đang active
        if (window.analyticsManager && document.getElementById('analytics-section')?.classList.contains('active')) {
            window.analyticsManager.loadAnalytics();
        }
    }
    
    /**
     * Sort students array in-place
     * @param {Array} students - Array students cần sort
     */
    sortStudents(students) {
        const { sortBy, order } = this.currentSort;
        
        students.sort((a, b) => {
            let aVal, bVal;
            
            // Special handling cho grade sorting
            if (sortBy === 'grade') {
                aVal = calculateGrade(a.average_score);
                bVal = calculateGrade(b.average_score);
                
                // Grade order: A > B > C > D > F
                const gradeOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'F': 5 };
                aVal = gradeOrder[aVal] || 6;
                bVal = gradeOrder[bVal] || 6;
            } else {
                aVal = a[sortBy];
                bVal = b[sortBy];
                
                // Handle null/undefined values
                if (aVal == null) aVal = '';
                if (bVal == null) bVal = '';
                
                // Convert sang lowercase nếu là string
                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            }
            
            // Compare values
            let comparison = 0;
            if (aVal < bVal) comparison = -1;
            else if (aVal > bVal) comparison = 1;
            
            // Reverse nếu order là desc
            return order === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Load students cho specific page (compatibility method)
     * @param {number} page - Page number
     */
    async loadStudents(page = 1) {
        this.currentPage = page;
        this.applyLocalFilters();
    }

    // =====================================================
    // RENDERING
    // =====================================================
    
    /**
     * Render students table với current students data
     */
    renderStudentsTable() {
        this.table.clear();

        if (this.students.length === 0) {
            const hasFilters = this.filters.hasActiveFilters();
            const emptyMessage = hasFilters ? 
                'Không tìm thấy sinh viên phù hợp với bộ lọc' : 
                'Chưa có sinh viên nào trong hệ thống';
            this.table.setEmptyState(emptyMessage);
            return;
        }

        this.students.forEach(student => {
            const grade = calculateGrade(student.average_score);
            const gradeStyle = getGradeStyle(grade);
            const isSelected = this.selectedStudents.has(student.id);
            
            const row = this.table.addRow(`
                <td>
                    <input type="checkbox" class="student-checkbox" 
                           value="${student.id}" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="studentsManager.toggleStudentSelection(${student.id}, this.checked)">
                </td>
                <td><strong>${escapeHtml(student.student_id)}</strong></td>
                <td>${escapeHtml(student.full_name || `${student.first_name} ${student.last_name}`)}</td>
                <td title="${escapeHtml(student.email || '')}">${escapeHtml(student.email || '')}</td>
                <td>${formatDate(student.birth_date)}</td>
                <td>${escapeHtml(student.hometown || '')}</td>
                <td>${formatScore(student.math_score)}</td>
                <td>${formatScore(student.literature_score)}</td>
                <td>${formatScore(student.english_score)}</td>
                <td><strong>${formatScore(student.average_score)}</strong></td>
                <td>
                    <span class="grade-badge grade-${grade}" style="background-color: ${gradeStyle.bg}; color: ${gradeStyle.color};">
                        ${grade}
                    </span>
                </td>
                <td>
                    <div class="actions">
                        <button class="btn btn-sm btn-warning" onclick="studentsManager.editStudent(${student.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="studentsManager.deleteStudent(${student.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `);
        });

        // Update select all checkbox state
        this.updateSelectAllCheckbox();
    }

    renderPagination() {
        this.pagination.render(this.currentPage, this.totalPages, this.totalItems, this.pageSize);
    }

    // Selection methods
    toggleStudentSelection(studentId, isSelected) {
        if (isSelected) {
            this.selectedStudents.add(studentId);
        } else {
            this.selectedStudents.delete(studentId);
        }
        
        this.updateSelectAllCheckbox();
        this.updateExportSelectedButton();
    }

    toggleSelectAll(selectAll) {
        const checkboxes = document.querySelectorAll('.student-checkbox');
        
        if (selectAll) {
            // Select all current page students
            this.students.forEach(student => {
                this.selectedStudents.add(student.id);
            });
        } else {
            // Deselect all current page students
            this.students.forEach(student => {
                this.selectedStudents.delete(student.id);
            });
        }
        
        // Update individual checkboxes
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
        });
        
        this.updateExportSelectedButton();
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllStudents');
        if (!selectAllCheckbox) return;

        const currentPageIds = this.students.map(s => s.id);
        const selectedOnCurrentPage = currentPageIds.filter(id => this.selectedStudents.has(id));
        
        if (selectedOnCurrentPage.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedOnCurrentPage.length === currentPageIds.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    updateExportSelectedButton() {
        // Update import/export manager's export selected button
        if (window.importExportManager) {
            importExportManager.updateExportSelectedButton();
        }
    }

    clearSelection() {
        this.selectedStudents.clear();
        this.updateSelectAllCheckbox();
        this.updateExportSelectedButton();
        
        // Update checkboxes
        const checkboxes = document.querySelectorAll('.student-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    async updateStats() {
        try {
            const stats = {
                totalStudents: this.allStudents.length,
                avgMath: 0,
                avgLiterature: 0,
                avgEnglish: 0
            };

            if (this.allStudents.length > 0) {
                const mathScores = this.allStudents.filter(s => s.math_score !== null && s.math_score !== undefined).map(s => s.math_score);
                const literatureScores = this.allStudents.filter(s => s.literature_score !== null && s.literature_score !== undefined).map(s => s.literature_score);
                const englishScores = this.allStudents.filter(s => s.english_score !== null && s.english_score !== undefined).map(s => s.english_score);

                if (mathScores.length > 0) {
                    stats.avgMath = mathScores.reduce((sum, score) => sum + score, 0) / mathScores.length;
                }
                if (literatureScores.length > 0) {
                    stats.avgLiterature = literatureScores.reduce((sum, score) => sum + score, 0) / literatureScores.length;
                }
                if (englishScores.length > 0) {
                    stats.avgEnglish = englishScores.reduce((sum, score) => sum + score, 0) / englishScores.length;
                }
            }

            document.getElementById('totalStudents').textContent = stats.totalStudents;
            document.getElementById('avgMath').textContent = stats.avgMath.toFixed(1);
            document.getElementById('avgLiterature').textContent = stats.avgLiterature.toFixed(1);
            document.getElementById('avgEnglish').textContent = stats.avgEnglish.toFixed(1);

        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    updateHometownFilter() {
        const hometownFilter = document.getElementById('hometownFilter');
        if (!hometownFilter) return;
        
        const currentValue = hometownFilter.value;
        
        const hometowns = [...new Set(this.allStudents
            .map(s => s.hometown)
            .filter(h => h && h.trim())
        )].sort();

        hometownFilter.innerHTML = '<option value="">Tất cả quê quán</option>';
        hometowns.forEach(hometown => {
            const option = document.createElement('option');
            option.value = hometown;
            option.textContent = hometown;
            if (hometown === currentValue) {
                option.selected = true;
            }
            hometownFilter.appendChild(option);
        });
    }

    /**
     * Change page (pagination)
     * @param {number} page - Page number
     */
    changePage(page) {
        this.currentPage = page;
        this.loadStudents(page);
    }

    /**
     * Apply filters (callback từ FilterManager)
     * @param {Object} filters - Filter object
     */
    applyFilters(filters) {
        this.currentPage = 1;
        this.applyLocalFilters();
    }
    
    /**
     * Apply sorting (callback từ sort headers)
     * @param {string} sortBy - Column cần sort
     * @param {string} order - asc hoặc desc
     */
    applySorting(sortBy, order = 'asc') {
        this.currentSort = { sortBy, order };
        this.applyLocalFilters();
    }

    // =====================================================
    // CRUD OPERATIONS
    // =====================================================
    
    /**
     * Mở modal để thêm student mới
     */
    openAddModal() {
        this.editingStudent = null;
        document.getElementById('modalTitle').textContent = 'Thêm sinh viên mới';
        this.form.clearForm();
        this.modal.show();
    }

    /**
     * Mở modal để edit student
     * @param {string|number} studentId - ID của student cần edit
     */
    async editStudent(studentId) {
        try {
            loading.show();
            // Load student data từ API
            const student = await api.getStudent(studentId);
            
            this.editingStudent = student;
            document.getElementById('modalTitle').textContent = 'Chỉnh sửa sinh viên';
            this.form.setFormData(student);
            this.modal.show();

        } catch (error) {
            console.error('Error loading student:', error);
            notifications.error(error.message || 'Không thể tải thông tin sinh viên');
        } finally {
            loading.hide();
        }
    }

    /**
     * Delete student (show confirmation trước)
     * @param {string|number} studentId - ID của student cần delete
     */
    async deleteStudent(studentId) {
        const student = this.allStudents.find(s => s.id === studentId);
        if (!student) {
            notifications.error('Không tìm thấy sinh viên');
            return;
        }

        // Show delete confirmation popup
        deleteModal.show(student, async (studentToDelete) => {
            try {
                await api.deleteStudent(studentToDelete.id);
                notifications.success('Xóa sinh viên thành công');
                
                // Dispatch delete event cho cross-tab sync
                window.dispatchEvent(new CustomEvent('studentDeleted', {
                    detail: { id: studentToDelete.id, student: studentToDelete }
                }));
                
                this.loadAllStudents(); // Refresh data từ API
            } catch (error) {
                console.error('Error deleting student:', error);
                notifications.error(error.message || 'Không thể xóa sinh viên');
            }
        });
    }

    /**
     * Handle form submit (Create hoặc Update student)
     * @param {Object} formData - Form data từ user
     */
    async handleFormSubmit(formData) {
        try {
            const saveBtn = document.getElementById('saveBtn');
            setButtonLoading(saveBtn, true);

            if (this.editingStudent) {
                // Update existing student
                await api.updateStudent(this.editingStudent.id, formData);
                notifications.success('Cập nhật sinh viên thành công');
                
                // Dispatch update event
                window.dispatchEvent(new CustomEvent('studentUpdated', {
                    detail: { id: this.editingStudent.id, data: formData }
                }));
            } else {
                // Create new student
                const newStudent = await api.createStudent(formData);
                notifications.success('Thêm sinh viên thành công');
                
                // Dispatch create event
                window.dispatchEvent(new CustomEvent('studentCreated', {
                    detail: { student: newStudent }
                }));
            }

            this.modal.hide();
            this.loadAllStudents(); // Refresh data từ API

        } catch (error) {
            console.error('Error saving student:', error);
            
            if (error.isValidationError && error.data.errors) {
                // Handle validation errors
                error.data.errors.forEach(err => {
                    const field = this.form.form.querySelector(`[name="${err.field}"]`);
                    if (field) {
                        field.classList.add('error');
                        
                        let errorElement = field.parentNode.querySelector('.form-error');
                        if (!errorElement) {
                            errorElement = document.createElement('div');
                            errorElement.className = 'form-error';
                            field.parentNode.appendChild(errorElement);
                        }
                        errorElement.textContent = err.message;
                    }
                });
                notifications.error('Vui lòng kiểm tra lại thông tin đã nhập');
            } else {
                notifications.error(error.message || 'Không thể lưu thông tin sinh viên');
            }
        } finally {
            const saveBtn = document.getElementById('saveBtn');
            setButtonLoading(saveBtn, false);
        }
    }
}

// Initialize students manager
let studentsManager;

// Initialize immediately - the constructor will handle DOM readiness
studentsManager = new StudentsManager();

// Export globally
window.studentsManager = studentsManager;