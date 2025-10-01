// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api/v1',
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    TIMEOUT: 10000, // 10 seconds
    USE_MOCK_DATA: false // Set to true for development without backend
};

// Application Configuration
const APP_CONFIG = {
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100
    },
    VALIDATION: {
        STUDENT_ID: {
            MIN_LENGTH: 6,
            MAX_LENGTH: 12,
            PATTERN: /^[a-zA-Z0-9]{6,12}$/
        },
        NAME: {
            MIN_LENGTH: 1,
            MAX_LENGTH: 50
        },
        SCORE: {
            MIN: 0,
            MAX: 10
        }
    },
    NOTIFICATION: {
        DURATION: 5000 // 5 seconds
    }
};

// Grade Configuration
const GRADE_CONFIG = {
    A: { min: 8.5, color: '#22543d', bg: '#c6f6d5' },
    B: { min: 7.0, color: '#2a4365', bg: '#bee3f8' },
    C: { min: 5.5, color: '#744210', bg: '#fef5e7' },
    D: { min: 4.0, color: '#742a2a', bg: '#fed7d7' },
    F: { min: 0, color: '#702459', bg: '#fed7e2' }
};

// Chart Configuration
const CHART_CONFIG = {
    DEFAULT_OPTIONS: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true
                }
            }
        }
    },
    COLORS: {
        PRIMARY: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'],
        SUCCESS: '#48bb78',
        WARNING: '#ed8936',
        DANGER: '#f56565',
        INFO: '#4299e1'
    }
};