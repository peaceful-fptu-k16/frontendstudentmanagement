// Utility Functions

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN');
}

// Format date for input
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

// Format score for display
function formatScore(score) {
    if (score === null || score === undefined || score === '') return '';
    return Number(score).toFixed(1);
}

// Calculate grade based on average score
function calculateGrade(averageScore) {
    if (averageScore === null || averageScore === undefined) return '';
    
    for (const [grade, config] of Object.entries(GRADE_CONFIG)) {
        if (averageScore >= config.min) {
            return grade;
        }
    }
    return 'F';
}

// Get grade styling
function getGradeStyle(grade) {
    const config = GRADE_CONFIG[grade];
    if (!config) return { color: '#718096', bg: '#f7fafc' };
    return { color: config.color, bg: config.bg };
}

// Validate student ID
function validateStudentId(studentId) {
    if (!studentId) return 'Mã sinh viên là bắt buộc';
    if (!APP_CONFIG.VALIDATION.STUDENT_ID.PATTERN.test(studentId)) {
        return `Mã sinh viên phải có ${APP_CONFIG.VALIDATION.STUDENT_ID.MIN_LENGTH}-${APP_CONFIG.VALIDATION.STUDENT_ID.MAX_LENGTH} ký tự alphanumeric`;
    }
    return null;
}

// Validate name
function validateName(name, fieldName) {
    if (!name) return `${fieldName} là bắt buộc`;
    if (name.length < APP_CONFIG.VALIDATION.NAME.MIN_LENGTH || 
        name.length > APP_CONFIG.VALIDATION.NAME.MAX_LENGTH) {
        return `${fieldName} phải có từ ${APP_CONFIG.VALIDATION.NAME.MIN_LENGTH} đến ${APP_CONFIG.VALIDATION.NAME.MAX_LENGTH} ký tự`;
    }
    return null;
}

// Validate email
function validateEmail(email) {
    if (!email) return null; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Email không hợp lệ';
    }
    return null;
}

// Validate score
function validateScore(score, fieldName) {
    if (!score) return null; // Score is optional
    const numScore = Number(score);
    if (isNaN(numScore) || 
        numScore < APP_CONFIG.VALIDATION.SCORE.MIN || 
        numScore > APP_CONFIG.VALIDATION.SCORE.MAX) {
        return `${fieldName} phải từ ${APP_CONFIG.VALIDATION.SCORE.MIN} đến ${APP_CONFIG.VALIDATION.SCORE.MAX}`;
    }
    return null;
}

// Validate birth date
function validateBirthDate(birthDate) {
    if (!birthDate) return null; // Birth date is optional
    const date = new Date(birthDate);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
    
    if (isNaN(date.getTime())) {
        return 'Ngày sinh không hợp lệ';
    }
    if (date < minDate || date > maxDate) {
        return 'Ngày sinh phải trong khoảng 100 năm trước đến 15 năm trước';
    }
    return null;
}

// Validate entire student form
function validateStudentForm(formData) {
    const errors = {};
    
    const studentIdError = validateStudentId(formData.student_id);
    if (studentIdError) errors.student_id = studentIdError;
    
    const firstNameError = validateName(formData.first_name, 'Họ');
    if (firstNameError) errors.first_name = firstNameError;
    
    const lastNameError = validateName(formData.last_name, 'Tên');
    if (lastNameError) errors.last_name = lastNameError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    const birthDateError = validateBirthDate(formData.birth_date);
    if (birthDateError) errors.birth_date = birthDateError;
    
    const mathScoreError = validateScore(formData.math_score, 'Điểm Toán');
    if (mathScoreError) errors.math_score = mathScoreError;
    
    const literatureScoreError = validateScore(formData.literature_score, 'Điểm Văn');
    if (literatureScoreError) errors.literature_score = literatureScoreError;
    
    const englishScoreError = validateScore(formData.english_score, 'Điểm Tiếng Anh');
    if (englishScoreError) errors.english_score = englishScoreError;
    
    return errors;
}

// Clean form data (remove empty strings, convert numbers)
function cleanFormData(formData) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(formData)) {
        if (value === '' || value === null || value === undefined) {
            continue; // Skip empty values
        }
        
        // Convert score fields to numbers
        if (key.includes('score') && value !== '') {
            cleaned[key] = Number(value);
        } else {
            cleaned[key] = value;
        }
    }
    
    return cleaned;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Download file from blob
function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Get file extension
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Capitalize first letter
function capitalize(text) {
    if (typeof text !== 'string') return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Create loading state for buttons
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.disabled = true;
        const originalText = button.textContent;
        button.setAttribute('data-original-text', originalText);
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    } else {
        button.disabled = false;
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.textContent = originalText;
            button.removeAttribute('data-original-text');
        }
    }
}

// Parse query parameters from URL
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// Update URL with query parameters
function updateQueryParams(params) {
    const url = new URL(window.location);
    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    });
    window.history.replaceState({}, '', url);
}

// Deep clone object
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// Check if object is empty
function isEmpty(obj) {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === 'string') return obj.trim() === '';
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
}

// Retry function with exponential backoff
async function retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let attempt = 1;
    
    while (attempt <= maxAttempts) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
        }
    }
}