/**
 * =====================================================
 * CONFIGURATION FILE
 * =====================================================
 * Contains all configuration constants for the application
 * - API configuration
 * - Application settings
 * - Grade system
 * - Chart styling
 * =====================================================
 */

/**
 * API Configuration
 * Configuration for backend API connection
 */
const API_CONFIG = {
    // Backend API base URL
    BASE_URL: 'http://localhost:8000/api/v1',
    
    // Default headers for all requests
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/xml, text/xml, application/json, */*'  // Accept both XML and JSON
    },
    
    // Request timeout (milliseconds)
    TIMEOUT: 30000, // 30 seconds
    
    // Flag to use mock data (for development without backend)
    USE_MOCK_DATA: false,
    
    // Response format from backend ('xml' or 'json')
    RESPONSE_FORMAT: 'xml'
};

/**
 * Application Configuration
 * Configuration for application features
 */
const APP_CONFIG = {
    // Pagination settings
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,    // Default items per page
        MAX_PAGE_SIZE: 100        // Maximum items per page
    },
    
    // Validation rules
    VALIDATION: {
        // Student ID validation
        STUDENT_ID: {
            MIN_LENGTH: 6,
            MAX_LENGTH: 12,
            PATTERN: /^[a-zA-Z0-9]{6,12}$/  // Only letters and numbers, 6-12 characters
        },
        // Name validation
        NAME: {
            MIN_LENGTH: 1,
            MAX_LENGTH: 50
        },
        // Score validation
        SCORE: {
            MIN: 0,     // Minimum score
            MAX: 10     // Maximum score
        }
    },
    
    // Notification settings
    NOTIFICATION: {
        DURATION: 5000  // Notification display duration (ms)
    }
};

/**
 * Grade Configuration
 * Academic performance grading system configuration
 * Format: { grade: { min: minimum score, color: text color, bg: background color } }
 */
const GRADE_CONFIG = {
    A: { min: 8.5, color: '#22543d', bg: '#c6f6d5' },  // Excellent: >= 8.5
    B: { min: 7.0, color: '#2a4365', bg: '#bee3f8' },  // Good: 7.0 - 8.4
    C: { min: 5.5, color: '#744210', bg: '#fef5e7' },  // Average: 5.5 - 6.9
    D: { min: 4.0, color: '#742a2a', bg: '#fed7d7' },  // Below Average: 4.0 - 5.4
    F: { min: 0,   color: '#702459', bg: '#fed7e2' }   // Fail: < 4.0
};

/**
 * Chart Configuration
 * Configuration for Chart.js (analytics charts)
 */
const CHART_CONFIG = {
    // Default options for all charts
    DEFAULT_OPTIONS: {
        responsive: true,              // Auto resize to container
        maintainAspectRatio: false,    // Don't maintain aspect ratio
        plugins: {
            legend: {
                position: 'bottom',    // Legend position
                labels: {
                    padding: 20,        // Spacing between labels
                    usePointStyle: true // Use point style instead of box
                }
            }
        }
    },
    
    // Color palette for charts
    COLORS: {
        PRIMARY: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
        SUCCESS: '#48bb78',  // Green
        WARNING: '#ed8936',  // Orange
        DANGER: '#f56565',   // Red
        INFO: '#4299e1'      // Blue
    }
};