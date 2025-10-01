// API Service Layer
class ApiService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.headers = API_CONFIG.HEADERS;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    // Generic fetch method with error handling
    async fetch(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.headers,
            ...options
        };

        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ApiError(
                    errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
                    response.status,
                    errorData
                );
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new ApiError('Request timeout', 408);
            }
            
            if (error instanceof ApiError) {
                throw error;
            }
            
            throw new ApiError(`Network error: ${error.message}`, 0);
        }
    }

    // Student CRUD operations
    async getStudents(params = {}) {
        const queryParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                queryParams.append(key, value);
            }
        });

        const endpoint = queryParams.toString() ? `/students?${queryParams}` : '/students';
        return await this.fetch(endpoint);
    }

    async getStudent(id) {
        return await this.fetch(`/students/${id}`);
    }

    async createStudent(studentData) {
        return await this.fetch('/students', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
    }

    async updateStudent(id, studentData) {
        return await this.fetch(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(studentData)
        });
    }

    async deleteStudent(id) {
        return await this.fetch(`/students/${id}`, {
            method: 'DELETE'
        });
    }

    // Analytics operations
    async getAnalyticsSummary() {
        return await this.fetch('/analytics/summary');
    }

    async getScoreComparison() {
        return await this.fetch('/analytics/score-comparison');
    }

    async getHometownAnalysis() {
        return await this.fetch('/analytics/hometown-analysis');
    }

    // Import/Export operations
    async importStudents(file) {
        const formData = new FormData();
        formData.append('file', file);

        return await this.fetch('/students/import', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
    }

    async exportStudents(format = 'excel') {
        const response = await fetch(`${this.baseURL}/students/export?format=${format}`, {
            headers: this.headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                errorData.detail || 'Export failed',
                response.status,
                errorData
            );
        }

        return response.blob();
    }

    async getTemplate() {
        const response = await fetch(`${this.baseURL}/students/template`, {
            headers: this.headers
        });

        if (!response.ok) {
            throw new ApiError('Failed to download template', response.status);
        }

        return response.blob();
    }

    // Bulk operations
    async deleteAllStudents() {
        return await this.fetch('/students/bulk-delete', {
            method: 'DELETE'
        });
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL.replace('/api/v1', '')}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Custom API Error class
class ApiError extends Error {
    constructor(message, status = 0, data = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }

    get isNetworkError() {
        return this.status === 0;
    }

    get isClientError() {
        return this.status >= 400 && this.status < 500;
    }

    get isServerError() {
        return this.status >= 500;
    }

    get isValidationError() {
        return this.status === 422;
    }
}

// Create global API instance
const api = new ApiService();