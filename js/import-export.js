// =====================================================
// IMPORT/EXPORT MODULE
// =====================================================
// Module xử lý import/export students data (Excel, CSV, XML)
// Support: File upload, Drag & drop, Export selected, Template download

/**
 * ImportExportManager Class
 * Quản lý tất cả import/export operations
 */
class ImportExportManager {
    constructor() {
        this.selectedFile = null;  // File được chọn để import
        
        this.bindEvents();
    }

    /**
     * Bind tất cả events (file upload, drag & drop, export, etc.)
     */
    bindEvents() {
        // File selection button
        document.getElementById('selectFileBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        // File input change
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files[0]);
        });

        // Drag and drop support
        this.setupDragAndDrop();

        // Import button
        document.getElementById('importBtn').addEventListener('click', () => {
            this.handleImport();
        });

        // Export buttons (Excel, CSV)
        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            this.handleExport('excel');
        });

        document.getElementById('exportCsvBtn').addEventListener('click', () => {
            this.handleExport('csv');
        });

        // Template download button
        document.getElementById('downloadTemplateBtn').addEventListener('click', () => {
            this.downloadTemplate();
        });

        // Bulk operations
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.handleClearAll();
        });

        document.getElementById('exportSelectedBtn').addEventListener('click', () => {
            this.handleExportSelected();
        });

        // Instructions download
        document.getElementById('downloadInstructionsBtn')?.addEventListener('click', () => {
            this.showImportInstructions();
        });
    }

    handleFileSelect(file) {
        if (!file) {
            this.selectedFile = null;
            this.updateFileDisplay();
            return;
        }

        // Validate file type
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];

        const fileExtension = getFileExtension(file.name);
        const validExtensions = ['xlsx', 'xls', 'csv'];

        if (!allowedTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            notifications.error('Chỉ hỗ trợ file Excel (.xlsx, .xls) và CSV (.csv)');
            document.getElementById('importFile').value = '';
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            notifications.error('File không được vượt quá 10MB');
            document.getElementById('importFile').value = '';
            return;
        }

        this.selectedFile = file;
        this.updateFileDisplay();
        
        // Show file preview for CSV files
        if (getFileExtension(file.name) === 'csv') {
            this.previewFile(file);
        } else {
            this.clearFilePreview();
        }
    }

    updateFileDisplay() {
        const fileNameElement = document.getElementById('fileName');
        const importBtn = document.getElementById('importBtn');

        if (this.selectedFile) {
            fileNameElement.textContent = `${this.selectedFile.name} (${formatFileSize(this.selectedFile.size)})`;
            importBtn.disabled = false;
        } else {
            fileNameElement.textContent = '';
            importBtn.disabled = true;
            this.clearFilePreview();
        }
    }

    async handleImport() {
        if (!this.selectedFile) {
            notifications.error('Vui lòng chọn file để import');
            return;
        }

        try {
            const importBtn = document.getElementById('importBtn');
            setButtonLoading(importBtn, true);

            // Try API first, fallback to local processing
            let result;
            try {
                result = await api.importStudents(this.selectedFile);
            } catch (error) {
                console.warn('API import failed, falling back to local processing:', error);
                result = await this.processFileLocally(this.selectedFile);
            }
            
            this.displayImportResults(result);
            
            // Clear file selection
            this.selectedFile = null;
            document.getElementById('importFile').value = '';
            this.updateFileDisplay();

            // Refresh students list from API
            if (window.studentsManager) {
                console.log('Reloading students from API after import...');
                await studentsManager.loadAllStudents();
                studentsManager.refreshDisplay();
            }
            
            // Dispatch custom event for any other listeners
            window.dispatchEvent(new CustomEvent('studentsUpdated', { 
                detail: { 
                    action: 'import', 
                    imported: result.imported,
                    updated: result.updated,
                    skipped: result.skipped
                } 
            }));

            const successMsg = result.updated !== undefined ? 
                `Import: ${result.imported} mới, ${result.updated} cập nhật` :
                `Import thành công ${result.imported} sinh viên`;
            notifications.success(successMsg);

        } catch (error) {
            console.error('Import error:', error);
            notifications.error(error.message || 'Import thất bại');
            
            if (error.data && error.data.errors) {
                this.displayImportErrors(error.data.errors);
            }
        } finally {
            const importBtn = document.getElementById('importBtn');
            setButtonLoading(importBtn, false);
        }
    }

    displayImportResults(result) {
        const resultsContainer = document.getElementById('importResults');
        const resultsContent = document.getElementById('importResultsContent');

        let html = `
            <div class="import-summary">
                <div class="import-stat success">
                    <i class="fas fa-check-circle"></i>
                    <span>Thành công: <strong>${result.imported || 0}</strong> sinh viên</span>
                </div>
        `;

        if (result.errors && result.errors.length > 0) {
            html += `
                <div class="import-stat error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Lỗi: <strong>${result.errors.length}</strong> dòng</span>
                </div>
            `;
        }

        html += '</div>';

        if (result.errors && result.errors.length > 0) {
            html += '<div class="import-errors"><h4>Chi tiết lỗi:</h4><ul>';
            result.errors.forEach(error => {
                html += `<li>Dòng ${error.row}: ${escapeHtml(error.message)}</li>`;
            });
            html += '</ul></div>';
        }

        resultsContent.innerHTML = html;
        resultsContainer.classList.remove('hidden');
    }

    displayImportErrors(errors) {
        const resultsContainer = document.getElementById('importResults');
        const resultsContent = document.getElementById('importResultsContent');

        let html = `
            <div class="import-summary">
                <div class="import-stat error">
                    <i class="fas fa-times-circle"></i>
                    <span>Import thất bại</span>
                </div>
            </div>
            <div class="import-errors">
                <h4>Chi tiết lỗi:</h4>
                <ul>
        `;

        errors.forEach(error => {
            html += `<li>${escapeHtml(error.message || error)}</li>`;
        });

        html += '</ul></div>';

        resultsContent.innerHTML = html;
        resultsContainer.classList.remove('hidden');
    }

    async handleExport(format) {
        try {
            const button = format === 'excel' ? 
                document.getElementById('exportExcelBtn') : 
                document.getElementById('exportCsvBtn');
            
            setButtonLoading(button, true);

            let blob;
            try {
                // Try API first
                blob = await api.exportStudents(format);
            } catch (error) {
                console.warn('API export failed, falling back to local export:', error);
                // Fallback to local export
                blob = await this.exportLocally(format);
            }
            
            const filename = `students_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
            downloadFile(blob, filename);

            notifications.success(`Export ${format.toUpperCase()} thành công`);

        } catch (error) {
            console.error('Export error:', error);
            notifications.error(error.message || `Export ${format.toUpperCase()} thất bại`);
        } finally {
            const button = format === 'excel' ? 
                document.getElementById('exportExcelBtn') : 
                document.getElementById('exportCsvBtn');
            
            setButtonLoading(button, false);
        }
    }

    async downloadTemplate() {
        try {
            const button = document.getElementById('downloadTemplateBtn');
            if (!button) {
                console.error('Download template button not found');
                return;
            }
            
            setButtonLoading(button, true);

            let blob;
            let isFromAPI = false;
            
            try {
                // Try API first
                blob = await api.getTemplate();
                isFromAPI = true;
            } catch (error) {
                console.warn('API template download failed, generating local template:', error);
                // Fallback to local template generation
                blob = this.generateLocalTemplate();
                isFromAPI = false;
            }
            
            // Validate blob
            if (!blob || blob.size === 0) {
                throw new Error('Template file is empty or invalid');
            }
            
            const filename = (isFromAPI && !blob.type.includes('csv')) ? 
                'student_template.xlsx' : 'student_template.csv';
                
            downloadFile(blob, filename);
            
            const templateType = filename.endsWith('.csv') ? 'CSV' : 'Excel';
            notifications.success(`Tải template ${templateType} thành công`);

        } catch (error) {
            console.error('Template download error:', error);
            notifications.error(error.message || 'Không thể tải template');
        } finally {
            const button = document.getElementById('downloadTemplateBtn');
            if (button) {
                setButtonLoading(button, false);
            }
        }
    }

    // Process file and use API to add students
    async processFileLocally(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    const fileExtension = getFileExtension(file.name);
                    
                    let students = [];
                    let errors = [];
                    
                    if (fileExtension === 'csv') {
                        const result = this.parseCSV(content);
                        students = result.students;
                        errors = result.errors;
                    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                        // For Excel files, we need a library like SheetJS
                        // For now, show error message
                        reject(new Error('Excel import chỉ hỗ trợ qua server. Vui lòng sử dụng file CSV hoặc kết nối server.'));
                        return;
                    }

                    // Process valid students through API
                    if (students.length > 0) {
                        const result = await this.processStudentsThroughAPI(students);
                        resolve(result);
                    } else {
                        resolve({
                            imported: 0,
                            updated: 0,
                            skipped: 0,
                            errors: errors,
                            message: 'Không có dữ liệu hợp lệ để import'
                        });
                    }
                    
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Không thể đọc file'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    async processStudentsThroughAPI(students) {
        const options = this.getImportOptions();
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        let apiErrors = [];

        console.log(`Processing ${students.length} students through API...`);

        for (const [index, student] of students.entries()) {
            try {
                // Check if student already exists by student_id
                let existingStudent = null;
                try {
                    // Try to find existing student by student_id
                    const searchResult = await api.getStudents({ 
                        search: student.student_id,
                        page: 1
                        // Use server default page_size, don't specify
                    });
                    
                    existingStudent = searchResult.items?.find(s => 
                        s.student_id === student.student_id
                    );
                } catch (searchError) {
                    // If search fails, assume student doesn't exist
                    console.warn('Search failed for student:', student.student_id, searchError);
                }

                if (existingStudent) {
                    if (options.updateExisting) {
                        // Update existing student
                        try {
                            await api.updateStudent(existingStudent.id, student);
                            updated++;
                            console.log(`Updated student: ${student.student_id}`);
                        } catch (updateError) {
                            const errorMsg = this.formatApiError(updateError, `cập nhật ${student.student_id}`);
                            apiErrors.push({
                                row: index + 2, // +2 because of header and 0-index
                                message: errorMsg
                            });
                            console.error(`Update error for ${student.student_id}:`, updateError);
                        }
                    } else {
                        // Skip existing student
                        skipped++;
                        console.log(`Skipped existing student: ${student.student_id}`);
                    }
                } else {
                    // Create new student
                    try {
                        console.log(`Creating student:`, student);
                        await api.createStudent(student);
                        imported++;
                        console.log(`Created new student: ${student.student_id}`);
                    } catch (createError) {
                        const errorMsg = this.formatApiError(createError, `tạo mới ${student.student_id}`);
                        apiErrors.push({
                            row: index + 2,
                            message: errorMsg
                        });
                        console.error(`Create error for ${student.student_id}:`, createError);
                    }
                }

                // Add small delay to avoid overwhelming the API
                if (index % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

            } catch (error) {
                const errorMsg = this.formatApiError(error, `xử lý ${student.student_id}`);
                apiErrors.push({
                    row: index + 2,
                    message: errorMsg
                });
                console.error(`Processing error for ${student.student_id}:`, error);
            }
        }

        console.log('API processing completed:', { imported, updated, skipped, errors: apiErrors.length });

        return {
            imported,
            updated,
            skipped,
            errors: apiErrors,
            message: `Import qua API hoàn tất: ${imported} mới, ${updated} cập nhật, ${skipped} bỏ qua`
        };
    }

    parseCSV(content) {
        if (!content || typeof content !== 'string') {
            return { students: [], errors: [{ row: 1, message: 'File content is empty or invalid' }] };
        }

        // Remove BOM if present
        content = content.replace(/^\uFEFF/, '');
        
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        const students = [];
        const errors = [];

        if (lines.length < 2) {
            errors.push({ row: 1, message: 'File CSV phải có ít nhất 2 dòng (header + data)' });
            return { students, errors };
        }

        // Expected headers (Vietnamese)
        const expectedHeaders = [
            'Mã số sinh viên', 'Họ tên', 'Email', 'Ngày sinh', 
            'Quê quán', 'Điểm Toán', 'Điểm Văn', 'Điểm Anh'
        ];

        const headers = this.parseCSVRow(lines[0]).map(h => h.trim());
        
        // Validate headers - check if at least required headers exist
        const requiredHeaders = ['Mã số sinh viên', 'Họ tên', 'Email'];
        const missingRequiredHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingRequiredHeaders.length > 0) {
            errors.push({ 
                row: 1, 
                message: `Thiếu các cột bắt buộc: ${missingRequiredHeaders.join(', ')}` 
            });
            return { students, errors };
        }

        // Process data rows
        for (let i = 1; i < lines.length; i++) {
            const rowNum = i + 1;
            const values = this.parseCSVRow(lines[i]);
            
            // Skip instruction row (contains parentheses)
            if (values.some(val => val.includes('(') && val.includes(')'))) {
                continue;
            }
            
            // Skip completely empty rows
            if (values.every(val => !val.trim())) {
                continue;
            }
            
            if (values.length !== headers.length) {
                errors.push({ 
                    row: rowNum, 
                    message: `Số cột không khớp. Cần ${headers.length} cột, có ${values.length} cột` 
                });
                continue;
            }

            try {
                const student = {};
                headers.forEach((header, index) => {
                    const value = values[index].trim();
                    
                    switch (header) {
                        case 'Mã số sinh viên':
                            student.student_id = value;
                            break;
                        case 'Họ tên':
                            // Parse full name into first_name and last_name
                            const nameParts = value.trim().split(' ');
                            if (nameParts.length >= 2) {
                                student.first_name = nameParts.slice(0, -1).join(' '); // All except last word
                                student.last_name = nameParts[nameParts.length - 1]; // Last word
                            } else {
                                student.first_name = value;
                                student.last_name = '';
                            }
                            student.full_name = value; // Keep full name for reference
                            break;
                        case 'Email':
                            student.email = value;
                            break;
                        case 'Ngày sinh':
                            if (value && !this.isValidDate(value)) {
                                throw new Error(`Ngày sinh không hợp lệ: ${value}. Định dạng: YYYY-MM-DD`);
                            }
                            student.birth_date = value;
                            break;
                        case 'Quê quán':
                            student.hometown = value;
                            break;
                        case 'Điểm Toán':
                            const mathScore = parseFloat(value);
                            if (isNaN(mathScore) || mathScore < 0 || mathScore > 10) {
                                throw new Error(`Điểm Toán không hợp lệ: ${value}`);
                            }
                            student.math_score = mathScore;
                            break;
                        case 'Điểm Văn':
                            const litScore = parseFloat(value);
                            if (isNaN(litScore) || litScore < 0 || litScore > 10) {
                                throw new Error(`Điểm Văn không hợp lệ: ${value}`);
                            }
                            student.literature_score = litScore;
                            break;
                        case 'Điểm Anh':
                            const engScore = parseFloat(value);
                            if (isNaN(engScore) || engScore < 0 || engScore > 10) {
                                throw new Error(`Điểm Anh không hợp lệ: ${value}`);
                            }
                            student.english_score = engScore;
                            break;
                    }
                });

                // Validate required fields
                if (!student.student_id) {
                    errors.push({ row: rowNum, message: 'Mã số sinh viên không được để trống' });
                    continue;
                }
                if (!student.first_name) {
                    errors.push({ row: rowNum, message: 'Họ tên không được để trống' });
                    continue;
                }
                if (!student.email || !student.email.includes('@')) {
                    errors.push({ row: rowNum, message: 'Email không hợp lệ' });
                    continue;
                }

                // Set default values for optional numeric fields
                student.math_score = student.math_score || 0;
                student.literature_score = student.literature_score || 0;
                student.english_score = student.english_score || 0;

                // Calculate average score
                student.average_score = (
                    (student.math_score + student.literature_score + student.english_score) / 3
                ).toFixed(2);

                students.push(student);
                
            } catch (error) {
                errors.push({ row: rowNum, message: `Lỗi xử lý dữ liệu: ${error.message}` });
            }
        }

        return { students, errors };
    }

    parseCSVRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < row.length) {
            const char = row[i];
            
            if (char === '"') {
                if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
                    // Double quote escape
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    formatApiError(error, operation) {
        let errorMessage = `Lỗi ${operation}`;
        
        if (error && typeof error === 'object') {
            if (error.message && typeof error.message === 'string') {
                errorMessage += `: ${error.message}`;
            } else if (error.data && error.data.detail) {
                errorMessage += `: ${error.data.detail}`;
            } else if (error.data && Array.isArray(error.data.errors)) {
                // Handle validation errors
                const validationErrors = error.data.errors.map(err => {
                    if (typeof err === 'object' && err.field && err.message) {
                        return `${err.field}: ${err.message}`;
                    }
                    return String(err);
                }).join(', ');
                errorMessage += `: ${validationErrors}`;
            } else if (error.status) {
                errorMessage += `: HTTP ${error.status}`;
                if (error.status === 400) {
                    errorMessage += ' (Dữ liệu không hợp lệ)';
                } else if (error.status === 422) {
                    errorMessage += ' (Lỗi validation)';
                } else if (error.status === 500) {
                    errorMessage += ' (Lỗi server)';
                }
            } else {
                // Try to extract any meaningful info
                try {
                    const errorStr = JSON.stringify(error);
                    if (errorStr !== '{}') {
                        errorMessage += `: ${errorStr}`;
                    }
                } catch {
                    errorMessage += ': Lỗi không xác định';
                }
            }
        } else if (error) {
            errorMessage += `: ${String(error)}`;
        }
        
        return errorMessage;
    }

    isValidDate(dateString) {
        if (!dateString) return true; // Allow empty dates
        
        // Check format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return false;
        }
        
        const date = new Date(dateString);
        const [year, month, day] = dateString.split('-').map(Number);
        
        return date.getFullYear() === year &&
               date.getMonth() === month - 1 &&
               date.getDate() === day;
    }

    async exportLocally(format) {
        // Get data from current students manager (loaded from API)
        let students = [];
        
        if (window.studentsManager && studentsManager.allStudents) {
            students = studentsManager.allStudents;
        } else {
            // If no students manager, try to load from API directly
            try {
                // Load all students with pagination
                let allStudents = [];
                let currentPage = 1;
                let hasMorePages = true;
                const pageSize = 50;
                
                while (hasMorePages) {
                    const response = await api.getStudents({ page: currentPage });
                    
                    const items = response.items || [];
                    allStudents = allStudents.concat(items);
                    
                    hasMorePages = response.has_next === true;
                    currentPage++;
                    
                    // Prevent infinite loop
                    if (currentPage > 100) break;
                }
                
                students = allStudents;
            } catch (error) {
                console.error('Failed to load students for export:', error);
                throw new Error('Không thể tải dữ liệu từ server để export');
            }
        }

        if (students.length === 0) {
            throw new Error('Không có dữ liệu để export');
        }

        if (format === 'csv') {
            return this.generateCSV(students);
        } else {
            throw new Error('Excel export chỉ hỗ trợ qua server. Vui lòng sử dụng CSV hoặc kết nối server.');
        }
    }

    generateCSV(students) {
        const headers = [
            'Mã số sinh viên', 'Họ tên', 'Email', 'Ngày sinh', 
            'Quê quán', 'Điểm Toán', 'Điểm Văn', 'Điểm Anh', 'Điểm trung bình'
        ];
        
        // Add BOM for proper UTF-8 CSV encoding
        let csv = '\uFEFF';
        
        // Add headers
        csv += headers.map(header => `"${header}"`).join(',') + '\n';
        
        // Add data rows
        students.forEach(student => {
            const row = [
                student.student_id || '',
                student.full_name || '',
                student.email || '',
                student.birth_date || '',
                student.hometown || '',
                student.math_score || 0,
                student.literature_score || 0,
                student.english_score || 0,
                student.average_score || 0
            ];
            
            csv += row.map(cell => {
                // Escape quotes in cell content
                const escapedCell = String(cell).replace(/"/g, '""');
                return `"${escapedCell}"`;
            }).join(',') + '\n';
        });

        return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    }

    generateLocalTemplate() {
        const templateData = [
            // Header row
            ['Mã số sinh viên', 'Họ tên', 'Email', 'Ngày sinh', 'Quê quán', 'Điểm Toán', 'Điểm Văn', 'Điểm Anh'],
            
            // Instruction row (will be treated as comment)
            ['(Bắt buộc)', '(Bắt buộc)', '(Bắt buộc)', '(YYYY-MM-DD)', '(Tùy chọn)', '(0-10)', '(0-10)', '(0-10)'],
            
            // Sample data rows
            ['SV001', 'Nguyễn Văn A', 'nva@example.com', '2000-01-15', 'Hà Nội', '8.5', '7.5', '9.0'],
            ['SV002', 'Trần Thị B', 'ttb@example.com', '2000-03-22', 'Hồ Chí Minh', '9.0', '8.0', '8.5'],
            ['SV003', 'Lê Văn C', 'lvc@example.com', '2000-07-10', 'Đà Nẵng', '7.5', '8.5', '8.0'],
            
            // Empty rows for user input
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '']
        ];

        // Add BOM for proper UTF-8 CSV encoding
        let csv = '\uFEFF';
        
        templateData.forEach(row => {
            csv += row.map(cell => {
                // Escape quotes in cell content
                const escapedCell = String(cell).replace(/"/g, '""');
                return `"${escapedCell}"`;
            }).join(',') + '\n';
        });

        return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    }

    setupDragAndDrop() {
        const importCard = document.querySelector('.import-export-card');
        if (!importCard) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            importCard.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            importCard.addEventListener(eventName, () => this.highlight(importCard), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            importCard.addEventListener(eventName, () => this.unhighlight(importCard), false);
        });

        // Handle dropped files
        importCard.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(element) {
        element.classList.add('drag-over');
    }

    unhighlight(element) {
        element.classList.remove('drag-over');
    }

    // Add file preview functionality
    async previewFile(file) {
        if (!file) return;

        const fileExtension = getFileExtension(file.name);
        if (fileExtension !== 'csv') {
            return; // Only preview CSV files
        }

        try {
            const content = await this.readFileContent(file);
            const lines = content.split('\n').slice(0, 6); // First 5 rows + header
            
            this.displayFilePreview(lines);
        } catch (error) {
            console.error('Preview error:', error);
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Không thể đọc file'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    displayFilePreview(lines) {
        let previewContainer = document.getElementById('filePreview');
        
        if (!previewContainer) {
            // Create preview container if it doesn't exist
            previewContainer = document.createElement('div');
            previewContainer.id = 'filePreview';
            previewContainer.className = 'file-preview';
            
            const importCard = document.querySelector('.import-export-card .card-content');
            if (importCard) {
                importCard.appendChild(previewContainer);
            }
        }

        if (lines.length === 0) {
            previewContainer.innerHTML = '<p class="preview-empty">File trống</p>';
            return;
        }

        let html = '<h4>Xem trước dữ liệu:</h4><div class="preview-table-container"><table class="preview-table">';
        
        lines.forEach((line, index) => {
            if (!line.trim()) return;
            
            const cells = line.split(',').map(cell => cell.trim().replace(/"/g, ''));
            const rowClass = index === 0 ? 'header-row' : 'data-row';
            
            html += `<tr class="${rowClass}">`;
            cells.forEach(cell => {
                const tag = index === 0 ? 'th' : 'td';
                html += `<${tag}>${escapeHtml(cell)}</${tag}>`;
            });
            html += '</tr>';
        });
        
        html += '</table></div>';
        
        if (lines.length > 6) {
            html += '<p class="preview-note">... và nhiều dòng khác</p>';
        }
        
        previewContainer.innerHTML = html;
        previewContainer.classList.remove('hidden');
    }

    clearFilePreview() {
        const previewContainer = document.getElementById('filePreview');
        if (previewContainer) {
            previewContainer.classList.add('hidden');
            previewContainer.innerHTML = '';
        }
    }

    // Bulk operations
    async handleClearAll() {
        const confirmed = await this.showConfirmDialog(
            'Xóa tất cả dữ liệu', 
            'Bạn có chắc chắn muốn xóa tất cả dữ liệu sinh viên? Thao tác này không thể hoàn tác.'
        );

        if (!confirmed) return;

        try {
            // Clear from API
            await api.deleteAllStudents();

            // Refresh students list from API
            if (window.studentsManager) {
                await studentsManager.loadAllStudents();
                studentsManager.refreshDisplay();
            }

            // Dispatch bulk delete event
            window.dispatchEvent(new CustomEvent('studentsUpdated', {
                detail: { action: 'bulk_delete' }
            }));

            notifications.success('Đã xóa tất cả dữ liệu sinh viên');

        } catch (error) {
            console.error('Clear all error:', error);
            notifications.error('Không thể xóa dữ liệu từ server: ' + error.message);
        }
    }

    async handleExportSelected() {
        if (!window.studentsManager || !studentsManager.selectedStudents?.size) {
            notifications.error('Vui lòng chọn ít nhất một sinh viên để export');
            return;
        }

        try {
            const selectedIds = Array.from(studentsManager.selectedStudents);
            const selectedStudents = studentsManager.allStudents.filter(s => 
                selectedIds.includes(s.id)
            );

            if (selectedStudents.length === 0) {
                notifications.error('Không tìm thấy sinh viên đã chọn');
                return;
            }

            // Generate CSV for selected students
            const blob = this.generateCSV(selectedStudents);
            const filename = `selected_students_${new Date().toISOString().split('T')[0]}.csv`;
            downloadFile(blob, filename);

            notifications.success(`Export thành công ${selectedStudents.length} sinh viên đã chọn`);

        } catch (error) {
            console.error('Export selected error:', error);
            notifications.error('Export thất bại: ' + error.message);
        }
    }

    showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const confirmed = confirm(`${title}\n\n${message}`);
            resolve(confirmed);
        });
    }

    // Enhanced import with options
    getImportOptions() {
        return {
            updateExisting: document.getElementById('updateExisting')?.checked ?? true,
            skipErrors: document.getElementById('skipErrors')?.checked ?? true
        };
    }

    // Update selected students count for export button
    updateExportSelectedButton() {
        const exportBtn = document.getElementById('exportSelectedBtn');
        if (!exportBtn) return;

        const selectedCount = window.studentsManager?.selectedStudents?.size || 0;
        
        if (selectedCount > 0) {
            exportBtn.disabled = false;
            exportBtn.innerHTML = `
                <i class="fas fa-file-export"></i>
                Export đã chọn (${selectedCount})
            `;
        } else {
            exportBtn.disabled = true;
            exportBtn.innerHTML = `
                <i class="fas fa-file-export"></i>
                Export đã chọn
            `;
        }
    }

    showImportInstructions() {
        const instructions = `
HƯỚNG DẪN IMPORT DỮ LIỆU SINH VIÊN

📋 ĐỊNH DẠNG FILE:
• Hỗ trợ: CSV (.csv) và Excel (.xlsx, .xls)
• Encoding: UTF-8 (khuyến nghị)
• Kích thước tối đa: 10MB

📊 CỘT DỮ LIỆU BẮT BUỘC:
1. Mã số sinh viên - Mã duy nhất của sinh viên
2. Họ tên - Họ và tên đầy đủ
3. Email - Địa chỉ email hợp lệ

📊 CỘT DỮ LIỆU TÙY CHỌN:
4. Ngày sinh - Định dạng: YYYY-MM-DD (VD: 2000-01-15)
5. Quê quán - Nơi sinh hoặc quê quán
6. Điểm Toán - Từ 0 đến 10
7. Điểm Văn - Từ 0 đến 10  
8. Điểm Anh - Từ 0 đến 10

⚙️ TÙY CHỌN IMPORT:
☑️ Cập nhật sinh viên đã tồn tại - Ghi đè dữ liệu cũ
☑️ Bỏ qua dòng lỗi - Tiếp tục import các dòng hợp lệ

💡 LƯU Ý:
• Dòng đầu tiên phải là tiêu đề cột
• Mã sinh viên không được trùng lặp
• Email phải có định dạng hợp lệ (@)
• Điểm số phải từ 0-10
• Ngày sinh theo định dạng ISO (YYYY-MM-DD)

🔧 XỬ LÝ LỖI:
• Hệ thống sẽ hiển thị chi tiết lỗi từng dòng
• Có thể bỏ qua dòng lỗi và import dòng hợp lệ
• Kiểm tra kết quả import sau khi hoàn thành

📁 VÍ DỤ DÒNG DỮ LIỆU:
SV001,Nguyễn Văn A,nva@example.com,2000-01-15,Hà Nội,8.5,7.5,9.0
        `;

        // Create a modal or alert with instructions
        const modal = document.createElement('div');
        modal.className = 'instructions-modal';
        modal.innerHTML = `
            <div class="instructions-content">
                <div class="instructions-header">
                    <h3><i class="fas fa-question-circle"></i> Hướng dẫn Import</h3>
                    <button class="close-instructions" onclick="this.closest('.instructions-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="instructions-body">
                    <pre>${instructions}</pre>
                </div>
                <div class="instructions-footer">
                    <button class="btn btn-info" onclick="importExportManager.downloadTemplate(); this.closest('.instructions-modal').remove();">
                        <i class="fas fa-download"></i>
                        Tải Template
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.instructions-modal').remove()">
                        Đóng
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Add styles for modal
        if (!document.querySelector('#instructions-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'instructions-modal-styles';
            style.textContent = `
                .instructions-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                
                .instructions-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                }
                
                .instructions-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    background: #4299e1;
                    color: white;
                }
                
                .instructions-header h3 {
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .close-instructions {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                
                .close-instructions:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .instructions-body {
                    padding: 1.5rem;
                    max-height: 50vh;
                    overflow-y: auto;
                }
                
                .instructions-body pre {
                    font-family: 'Inter', monospace;
                    font-size: 0.9rem;
                    line-height: 1.6;
                    margin: 0;
                    white-space: pre-wrap;
                    color: #2d3748;
                }
                
                .instructions-footer {
                    padding: 1rem 1.5rem;
                    background: #f7fafc;
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }
                
                @media (max-width: 768px) {
                    .instructions-content {
                        margin: 1rem;
                        max-width: none;
                    }
                    
                    .instructions-footer {
                        flex-direction: column;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// CSS for import results
const importExportStyles = `
.import-summary {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.import-stat {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-weight: 500;
}

.import-stat.success {
    background: #c6f6d5;
    color: #22543d;
}

.import-stat.error {
    background: #fed7d7;
    color: #742a2a;
}

.import-errors {
    background: #fed7d7;
    padding: 1rem;
    border-radius: 6px;
    border-left: 4px solid #f56565;
}

.import-errors h4 {
    margin: 0 0 0.75rem 0;
    color: #742a2a;
    font-size: 1rem;
}

.import-errors ul {
    margin: 0;
    padding-left: 1.25rem;
    color: #742a2a;
}

.import-errors li {
    margin-bottom: 0.5rem;
}

.import-errors li:last-child {
    margin-bottom: 0;
}

.file-upload {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.file-name {
    color: #4a5568;
    font-weight: 500;
    font-size: 0.9rem;
    padding: 0.5rem;
    background: #f7fafc;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    min-height: 2.5rem;
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 200px;
}

.export-options {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

/* Drag and drop styles */
.import-export-card.drag-over {
    border: 2px dashed #4299e1;
    background-color: #ebf8ff;
    transform: scale(1.02);
    transition: all 0.2s ease;
}

/* File preview styles */
.file-preview {
    margin-top: 1rem;
    padding: 1rem;
    background: #f7fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.file-preview h4 {
    margin: 0 0 0.75rem 0;
    color: #2d3748;
    font-size: 0.9rem;
    font-weight: 600;
}

.preview-table-container {
    overflow-x: auto;
    margin-bottom: 0.5rem;
}

.preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
    background: white;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-table th,
.preview-table td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.preview-table .header-row th {
    background: #4299e1;
    color: white;
    font-weight: 600;
}

.preview-table .data-row:nth-child(even) {
    background: #f8f9fa;
}

.preview-note {
    margin: 0.5rem 0 0 0;
    color: #718096;
    font-size: 0.8rem;
    font-style: italic;
}

.preview-empty {
    color: #a0aec0;
    font-style: italic;
    text-align: center;
    margin: 1rem 0;
}

/* Import options */
.import-options {
    margin: 1rem 0;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: #495057;
}

.checkbox-label:last-child {
    margin-bottom: 0;
}

.checkbox-label input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #4299e1;
    cursor: pointer;
}

.checkmark {
    font-weight: 500;
}

/* Template options */
.template-options {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.template-options .btn {
    flex: 1;
    min-width: 120px;
}

/* Bulk operations */
.bulk-options {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.bulk-options .btn {
    flex: 1;
    min-width: 120px;
}

/* Enhanced import results */
.import-results {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background: white;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.import-results h3 {
    margin: 0 0 1rem 0;
    color: #2d3748;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.import-results h3::before {
    content: "📊";
    font-size: 1.2em;
}

/* Progress bar for imports */
.import-progress {
    margin: 1rem 0;
}

.progress-bar {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #48bb78, #38a169);
    border-radius: 3px;
    transition: width 0.3s ease;
}

@media (max-width: 768px) {
    .import-summary {
        flex-direction: column;
    }
    
    .file-upload {
        flex-direction: column;
        align-items: stretch;
    }
    
    .file-name {
        min-width: auto;
    }
    
    .export-options {
        flex-direction: column;
    }
    
    .preview-table th,
    .preview-table td {
        max-width: 100px;
        font-size: 0.7rem;
        padding: 0.4rem;
    }
    
    .file-preview {
        padding: 0.75rem;
    }
    
    .import-export-card.drag-over {
        transform: none;
    }
}
`;

// Add styles to document
if (!document.querySelector('#import-export-styles')) {
    const style = document.createElement('style');
    style.id = 'import-export-styles';
    style.textContent = importExportStyles;
    document.head.appendChild(style);
}

// Initialize import/export manager
let importExportManager;

document.addEventListener('DOMContentLoaded', () => {
    importExportManager = new ImportExportManager();
});