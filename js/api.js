/**
 * =====================================================
 * API SERVICE LAYER
 * =====================================================
 * Service class handling all HTTP requests to backend API
 * Provides methods for CRUD operations, analytics, import/export
 * 
 * Features:
 * - Automatic timeout handling
 * - Error handling with custom ApiError class
 * - Support for all HTTP methods (GET, POST, PUT, DELETE)
 * - XML and JSON response parsing
 * =====================================================
 */
class ApiService {
    /**
     * Constructor - Initialize API service with config from API_CONFIG
     */
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;    // API base URL (e.g., http://localhost:8000/api/v1)
        this.headers = API_CONFIG.HEADERS;     // Default headers for requests
        this.timeout = API_CONFIG.TIMEOUT;     // Timeout for each request (ms)
    }

    /**
     * Parse XML response to JavaScript object
     * @param {string} xmlText - XML text to parse
     * @returns {Object} Parsed data object
     */
    parseXMLResponse(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('XML parsing error: ' + parserError.textContent);
        }
        
        // Parse student list response
        const studentsEl = xmlDoc.querySelector('students');
        if (studentsEl) {
            return this.parseStudentList(xmlDoc);
        }
        
        // Parse single student response
        const studentEl = xmlDoc.querySelector('student');
        if (studentEl) {
            return this.parseStudent(studentEl);
        }
        
        // Parse analytics response
        const analyticsEl = xmlDoc.querySelector('analytics');
        if (analyticsEl) {
            return this.parseAnalytics(xmlDoc);
        }
        
        // Parse generic response
        return this.parseGenericXML(xmlDoc);
    }

    /**
     * Parse student list XML to object
     * @param {Document} xmlDoc - XML document
     * @returns {Object} Parsed student list with pagination
     */
    parseStudentList(xmlDoc) {
        const students = [];
        const studentElements = xmlDoc.querySelectorAll('student');
        
        studentElements.forEach(el => {
            students.push(this.parseStudent(el));
        });
        
        const studentsEl = xmlDoc.querySelector('students');
        return {
            items: students,
            total: parseInt(studentsEl?.getAttribute('total')) || students.length,
            page: parseInt(studentsEl?.getAttribute('page')) || 1,
            page_size: parseInt(studentsEl?.getAttribute('page_size')) || students.length,
            total_pages: parseInt(studentsEl?.getAttribute('total_pages')) || 1,
            has_next: studentsEl?.getAttribute('has_next') === 'true',
            has_prev: studentsEl?.getAttribute('has_prev') === 'true'
        };
    }

    /**
     * Parse single student XML element to object
     * @param {Element} studentEl - Student XML element
     * @returns {Object} Student object
     */
    parseStudent(studentEl) {
        const getTextContent = (tagName) => {
            const el = studentEl.querySelector(tagName);
            return el ? el.textContent : null;
        };
        
        const getNumberContent = (tagName) => {
            const text = getTextContent(tagName);
            return text ? parseFloat(text) : null;
        };
        
        return {
            id: parseInt(studentEl.getAttribute('id')) || parseInt(getTextContent('id')),
            student_id: getTextContent('student_id'),
            first_name: getTextContent('first_name'),
            last_name: getTextContent('last_name'),
            full_name: getTextContent('full_name'),
            email: getTextContent('email'),
            birth_date: getTextContent('birth_date'),
            hometown: getTextContent('hometown'),
            math_score: getNumberContent('math_score'),
            literature_score: getNumberContent('literature_score'),
            english_score: getNumberContent('english_score'),
            average_score: getNumberContent('average_score'),
            grade: getTextContent('grade')
        };
    }

    /**
     * Parse analytics XML to object
     * @param {Document} xmlDoc - XML document
     * @returns {Object} Analytics data
     */
    parseAnalytics(xmlDoc) {
        // Implementation depends on analytics XML structure
        const result = {};
        
        // Parse summary
        const summaryEl = xmlDoc.querySelector('summary');
        if (summaryEl) {
            result.summary = {
                total_students: parseInt(summaryEl.querySelector('total_students')?.textContent) || 0,
                average_score: parseFloat(summaryEl.querySelector('average_score')?.textContent) || 0,
                highest_score: parseFloat(summaryEl.querySelector('highest_score')?.textContent) || 0,
                lowest_score: parseFloat(summaryEl.querySelector('lowest_score')?.textContent) || 0
            };
        }
        
        return result;
    }

    /**
     * Parse generic XML response
     * @param {Document} xmlDoc - XML document
     * @returns {Object} Parsed object
     */
    parseGenericXML(xmlDoc) {
        const root = xmlDoc.documentElement;
        const result = {};
        
        Array.from(root.children).forEach(child => {
            const tagName = child.tagName;
            const textContent = child.textContent;
            
            // Try to parse as number
            if (!isNaN(textContent) && textContent.trim() !== '') {
                result[tagName] = parseFloat(textContent);
            } else {
                result[tagName] = textContent;
            }
        });
        
        return result;
    }

    /**
     * Generic fetch method with error handling and timeout
     * @param {string} endpoint - API endpoint (starts with /, e.g., /students)
     * @param {Object} options - Fetch options (method, body, headers, etc.)
     * @returns {Promise<Object|null>} Response data or null if 204
     * @throws {ApiError} If request failed
     */
    async fetch(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.headers,
            ...options
        };

        // Create AbortController to handle timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        config.signal = controller.signal;

        try {
            // Send request
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Handle unsuccessful response (status code 4xx, 5xx)
            if (!response.ok) {
                let errorData = {};
                const contentType = response.headers.get('content-type');
                
                if (contentType?.includes('application/json')) {
                    errorData = await response.json().catch(() => ({}));
                } else if (contentType?.includes('xml')) {
                    const xmlText = await response.text();
                    errorData = this.parseXMLResponse(xmlText);
                }
                
                throw new ApiError(
                    errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    errorData
                );
            }

            // Handle 204 No Content (usually from DELETE requests)
            if (response.status === 204) {
                return null;
            }

            // Parse response based on content type
            const contentType = response.headers.get('content-type');
            
            if (contentType?.includes('application/xml') || contentType?.includes('text/xml')) {
                const xmlText = await response.text();
                return this.parseXMLResponse(xmlText);
            } else {
                // Default to JSON parsing
                return await response.json();
            }
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Handle timeout error
            if (error.name === 'AbortError') {
                throw new ApiError('Request timeout', 408);
            }
            
            // Re-throw ApiError
            if (error instanceof ApiError) {
                throw error;
            }
            
            // Handle network errors (lost connection, CORS, etc.)
            throw new ApiError(`Network error: ${error.message}`, 0);
        }
    }

    // =====================================================
    // STUDENT CRUD OPERATIONS
    // =====================================================

    /**
     * Get student list with filtering, sorting, pagination
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (1-indexed)
     * @param {number} params.page_size - Items per page
     * @param {string} params.search - Search by name
     * @param {string} params.hometown - Filter by hometown
     * @param {string} params.grade - Filter by grade (A, B, C, D, F)
     * @param {string} params.sort_by - Field to sort (id, student_id, average_score, etc.)
     * @param {string} params.order - Sort order (asc or desc)
     * @returns {Promise<Object>} Object containing { items: [], total, page, page_size, ... }
     */
    async getStudents(params = {}) {
        const queryParams = new URLSearchParams();
        
        // Only add params with values (skip null, undefined, empty string)
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                queryParams.append(key, value);
            }
        });

        const endpoint = queryParams.toString() ? `/students?${queryParams}` : '/students';
        return await this.fetch(endpoint);
    }

    /**
     * Get detailed information of a single student
     * @param {number} id - Student ID
     * @returns {Promise<Object>} Student object
     */
    async getStudent(id) {
        return await this.fetch(`/students/${id}`);
    }

    /**
     * Create new student
     * @param {Object} studentData - Student data to create
     * @param {string} studentData.student_id - Student code (e.g., SV001)
     * @param {string} studentData.first_name - First name
     * @param {string} studentData.last_name - Last name
     * @param {string} studentData.email - Email
     * @param {string} studentData.birth_date - Birth date (YYYY-MM-DD)
     * @param {string} studentData.hometown - Hometown
     * @param {number} studentData.math_score - Math score (0-10)
     * @param {number} studentData.literature_score - Literature score (0-10)
     * @param {number} studentData.english_score - English score (0-10)
     * @returns {Promise<Object>} Created student object
     */
    async createStudent(studentData) {
        return await this.fetch('/students', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
    }

    /**
     * Update student information
     * @param {number} id - Student ID to update
     * @param {Object} studentData - New data (fields similar to createStudent)
     * @returns {Promise<Object>} Updated student object
     */
    async updateStudent(id, studentData) {
        return await this.fetch(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(studentData)
        });
    }

    /**
     * Delete a student
     * @param {number} id - Student ID to delete
     * @returns {Promise<null>} null if successful
     */
    async deleteStudent(id) {
        return await this.fetch(`/students/${id}`, {
            method: 'DELETE'
        });
    }

    // =====================================================
    // ANALYTICS OPERATIONS
    // =====================================================

    /**
     * Get summary statistics
     * @returns {Promise<Object>} { total_students, avg_math, avg_literature, avg_english }
     */
    async getAnalyticsSummary() {
        return await this.fetch('/analytics/summary');
    }

    /**
     * Get score comparison data for subjects
     * @returns {Promise<Object>} { math, literature, english }
     */
    async getScoreComparison() {
        return await this.fetch('/analytics/score-comparison');
    }

    /**
     * Get analysis by hometown (count and average score per province)
     * @returns {Promise<Array>} Array of { hometown, count, avg_score }
     */
    async getHometownAnalysis() {
        return await this.fetch('/analytics/hometown-analysis');
    }

    // =====================================================
    // IMPORT/EXPORT OPERATIONS
    // =====================================================

    /**
     * Import students from Excel or CSV file
     * @param {File} file - File object from input type="file"
     * @returns {Promise<Object>} Import result { success, created, updated, errors }
     */
    async importStudents(file) {
        const formData = new FormData();
        formData.append('file', file);

        return await this.fetch('/students/import', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
    }

    /**
     * Export student list to Excel or CSV file
     * @param {string} format - File format: 'excel' or 'csv'
     * @returns {Promise<Blob>} File blob for download
     */
    async exportStudents(format = 'excel') {
        const response = await fetch(`${this.baseURL}/students/export?format=${format}`, {
            headers: this.headers
        });

        if (!response.ok) {
            let errorData = {};
            const contentType = response.headers.get('content-type');
            
            if (contentType?.includes('application/json')) {
                errorData = await response.json().catch(() => ({}));
            } else if (contentType?.includes('xml')) {
                const xmlText = await response.text();
                errorData = this.parseXMLResponse(xmlText);
            }
            
            throw new ApiError(
                errorData.detail || errorData.message || 'Export failed',
                response.status,
                errorData
            );
        }

        return response.blob();
    }

    /**
     * Download Excel template for import
     * @returns {Promise<Blob>} Template file blob
     */
    async getTemplate() {
        const response = await fetch(`${this.baseURL}/students/template`, {
            headers: this.headers
        });

        if (!response.ok) {
            throw new ApiError('Failed to download template', response.status);
        }

        return response.blob();
    }

    // =====================================================
    // BULK OPERATIONS
    // =====================================================

    /**
     * Delete ALL students (use with caution!)
     * @returns {Promise<Object>} Deletion result { deleted_count }
     */
    async deleteAllStudents() {
        return await this.fetch('/students/bulk-delete', {
            method: 'DELETE'
        });
    }

    // =====================================================
    // UTILITY OPERATIONS
    // =====================================================

    /**
     * Check if API is operational
     * @returns {Promise<boolean>} true if API is healthy, false otherwise
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api/v1', '')}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }
}

/**
 * =====================================================
 * CUSTOM API ERROR CLASS
 * =====================================================
 * Custom error class to handle API errors with detailed information
 * Extends JavaScript's Error class
 */
class ApiError extends Error {
    /**
     * @param {string} message - Error message
     * @param {number} status - HTTP status code (0 if network error)
     * @param {Object} data - Additional error data from API
     */
    constructor(message, status = 0, data = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }

    /**
     * Check if this is a network error (cannot connect to server)
     * @returns {boolean}
     */
    get isNetworkError() {
        return this.status === 0;
    }

    /**
     * Check if this is a client error (4xx)
     * @returns {boolean}
     */
    get isClientError() {
        return this.status >= 400 && this.status < 500;
    }

    /**
     * Check if this is a server error (5xx)
     * @returns {boolean}
     */
    get isServerError() {
        return this.status >= 500;
    }

    /**
     * Check if this is a validation error (422)
     * @returns {boolean}
     */
    get isValidationError() {
        return this.status === 422;
    }
}

/**
 * =====================================================
 * GLOBAL API INSTANCE
 * =====================================================
 * Create a single instance to use throughout the app
 * Can import and use: api.getStudents(), api.createStudent(), etc.
 */
const api = new ApiService();