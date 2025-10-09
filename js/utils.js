/**
 * =====================================================
 * UTILITY FUNCTIONS
 * =====================================================
 * Helper functions used throughout the application
 * Includes: formatting, validation, DOM helpers, file handling
 * =====================================================
 */

// =====================================================
// PERFORMANCE UTILITIES
// =====================================================

/**
 * Debounce function - Delays function execution
 * Used for search input to avoid excessive API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time (ms)
 * @returns {Function} Debounced function
 */
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

// =====================================================
// DATE FORMATTING
// =====================================================

/**
 * Format date for display (dd/mm/yyyy)
 * @param {string} dateString - Date string from server
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN');
}

/**
 * Format date for input type="date" (yyyy-mm-dd)
 * @param {string} dateString - Date string
 * @returns {string} Formatted date for input
 */
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

// =====================================================
// SCORE & GRADE UTILITIES
// =====================================================

/**
 * Format score for display (1 decimal place)
 * @param {number} score - Score value
 * @returns {string} Formatted score
 */
function formatScore(score) {
    if (score === null || score === undefined || score === '') return '';
    return Number(score).toFixed(1);
}

/**
 * Calculate grade based on average score
 * @param {number} averageScore - Average score
 * @returns {string} Grade (A, B, C, D, F)
 */
function calculateGrade(averageScore) {
    if (averageScore === null || averageScore === undefined) return '';
    
    // Iterate through grade config from high to low
    for (const [grade, config] of Object.entries(GRADE_CONFIG)) {
        if (averageScore >= config.min) {
            return grade;
        }
    }
    return 'F';
}

/**
 * Get style for grade badge (text color and background color)
 * @param {string} grade - Grade (A, B, C, D, F)
 * @returns {Object} { color, bg }
 */
function getGradeStyle(grade) {
    const config = GRADE_CONFIG[grade];
    if (!config) return { color: '#718096', bg: '#f7fafc' };
    return { color: config.color, bg: config.bg };
}

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validate student ID
 * @param {string} studentId - Student code
 * @returns {string|null} Error message or null if valid
 */
function validateStudentId(studentId) {
    if (!studentId) return 'Student ID is required';
    if (!APP_CONFIG.VALIDATION.STUDENT_ID.PATTERN.test(studentId)) {
        return `Student ID must be ${APP_CONFIG.VALIDATION.STUDENT_ID.MIN_LENGTH}-${APP_CONFIG.VALIDATION.STUDENT_ID.MAX_LENGTH} alphanumeric characters`;
    }
    return null;
}

/**
 * Validate name (first name, last name, etc.)
 * @param {string} name - Name to validate
 * @param {string} fieldName - Field name for error message
 * @returns {string|null} Error message or null if valid
 */
function validateName(name, fieldName) {
    if (!name) return `${fieldName} is required`;
    if (name.length < APP_CONFIG.VALIDATION.NAME.MIN_LENGTH || 
        name.length > APP_CONFIG.VALIDATION.NAME.MAX_LENGTH) {
        return `${fieldName} must be between ${APP_CONFIG.VALIDATION.NAME.MIN_LENGTH} and ${APP_CONFIG.VALIDATION.NAME.MAX_LENGTH} characters`;
    }
    return null;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {string|null} Error message or null if valid
 */
function validateEmail(email) {
    if (!email) return null; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Invalid email format';
    }
    return null;
}

/**
 * Validate score (math, literature, english)
 * @param {number} score - Score value
 * @param {string} fieldName - Subject name
 * @returns {string|null} Error message or null if valid
 */
function validateScore(score, fieldName) {
    if (!score) return null; // Score is optional
    const numScore = Number(score);
    if (isNaN(numScore) || 
        numScore < APP_CONFIG.VALIDATION.SCORE.MIN || 
        numScore > APP_CONFIG.VALIDATION.SCORE.MAX) {
        return `${fieldName} must be between ${APP_CONFIG.VALIDATION.SCORE.MIN} and ${APP_CONFIG.VALIDATION.SCORE.MAX}`;
    }
    return null;
}

/**
 * Validate birth date (must be between 15-100 years ago)
 * @param {string} birthDate - Birth date
 * @returns {string|null} Error message or null if valid
 */
function validateBirthDate(birthDate) {
    if (!birthDate) return null; // Birth date is optional
    const date = new Date(birthDate);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
    
    if (isNaN(date.getTime())) {
        return 'Invalid birth date';
    }
    if (date < minDate || date > maxDate) {
        return 'Birth date must be between 100 years ago and 15 years ago';
    }
    return null;
}

/**
 * Validate entire student form data
 * @param {Object} formData - Form data to validate
 * @returns {Object} Object containing errors { field: errorMessage }
 */
function validateStudentForm(formData) {
    const errors = {};
    
    // Validate each field
    const studentIdError = validateStudentId(formData.student_id);
    if (studentIdError) errors.student_id = studentIdError;
    
    const firstNameError = validateName(formData.first_name, 'First name');
    if (firstNameError) errors.first_name = firstNameError;
    
    const lastNameError = validateName(formData.last_name, 'Last name');
    if (lastNameError) errors.last_name = lastNameError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    const birthDateError = validateBirthDate(formData.birth_date);
    if (birthDateError) errors.birth_date = birthDateError;
    
    const mathScoreError = validateScore(formData.math_score, 'Math score');
    if (mathScoreError) errors.math_score = mathScoreError;
    
    const literatureScoreError = validateScore(formData.literature_score, 'Literature score');
    if (literatureScoreError) errors.literature_score = literatureScoreError;
    
    const englishScoreError = validateScore(formData.english_score, 'English score');
    if (englishScoreError) errors.english_score = englishScoreError;
    
    return errors;
}

// =====================================================
// DATA PROCESSING
// =====================================================

/**
 * Clean form data (remove empty values, convert numbers)
 * @param {Object} formData - Form data to clean
 * @returns {Object} Cleaned form data
 */
function cleanFormData(formData) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(formData)) {
        // Skip empty values
        if (value === '' || value === null || value === undefined) {
            continue;
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

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Deep clone object (deep copy, no reference)
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
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

/**
 * Check if object/array/string is empty
 * @param {any} obj - Value to check
 * @returns {boolean} true if empty
 */
function isEmpty(obj) {
    if (obj === null || obj === undefined) return true;
    if (typeof obj === 'string') return obj.trim() === '';
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
}

// =====================================================
// ID & STRING UTILITIES
// =====================================================

/**
 * Generate unique ID (using timestamp + random)
 * @returns {string} Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Capitalize first letter of string
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
function capitalize(text) {
    if (typeof text !== 'string') return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// =====================================================
// FILE UTILITIES
// =====================================================

/**
 * Download file from blob object
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename for download
 */
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

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension (lowercase)
 */
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

/**
 * Format file size from bytes to KB/MB/GB
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// =====================================================
// DOM UTILITIES
// =====================================================

/**
 * Set loading state for button
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} loading - true to show loading, false to hide
 */
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.disabled = true;
        const originalText = button.textContent;
        button.setAttribute('data-original-text', originalText);
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    } else {
        button.disabled = false;
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
            button.textContent = originalText;
            button.removeAttribute('data-original-text');
        }
    }
}

// =====================================================
// URL UTILITIES
// =====================================================

/**
 * Parse query parameters from URL
 * @returns {Object} Object containing query params
 */
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

/**
 * Update URL query parameters (without page reload)
 * @param {Object} params - Object containing params to update
 */
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

// =====================================================
// ASYNC UTILITIES
// =====================================================

/**
 * Retry function with exponential backoff
 * Automatically retries if failed, with increasing delay
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay (ms)
 * @returns {Promise} Result from function
 */
async function retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let attempt = 1;
    
    while (attempt <= maxAttempts) {
        try {
            return await fn(); // Return immediately if successful
        } catch (error) {
            // Throw error if no more attempts left
            if (attempt === maxAttempts) {
                throw error;
            }
            
            // Calculate delay with exponential backoff (1s, 2s, 4s, ...)
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
        }
    }
}