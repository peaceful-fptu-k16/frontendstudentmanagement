// =====================================================
// MAIN APPLICATION CONTROLLER
// =====================================================
// App class - Entry point của application, handle navigation & initialization

/**
 * App Class
 * Main controller quản lý navigation, API connection, và initialization
 */
class App {
    constructor() {
        this.currentSection = 'students';  // Section hiện tại
        this.isApiConnected = false;       // API connection status
        
        this.initialize();
    }

    /**
     * Initialize application
     */
    async initialize() {
        this.bindEvents();
        await this.checkApiConnection();
        this.showSection('students');
    }

    /**
     * Bind tất cả navigation events
     */
    bindEvents() {
        // Navigation buttons (Students, Analytics)
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Crawl button
        const crawlBtn = document.getElementById('crawlBtn');
        if (crawlBtn) {
            crawlBtn.addEventListener('click', () => this.handleCrawl());
        }

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const section = e.state?.section || 'students';
            this.showSection(section, false);
        });

        // Handle API connection errors globally
        window.addEventListener('unhandledrejection', (e) => {
            if (e.reason instanceof ApiError && e.reason.isNetworkError) {
                this.handleApiDisconnection();
            }
        });
    }

    /**
     * Handle Crawl action
     */
    async handleCrawl() {
        try {
            loading.show();
            
            // Prepare request data with current URL
            const requestData = {
                current_url: window.location.href,
                frontend_base_url: window.location.origin,
                timestamp: new Date().toISOString()
            };
            
            // Call crawl API endpoint with extended timeout
            const response = await api.fetch('/crawler/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData),
                timeout: 60000  // 60 seconds timeout
            });

            notifications.success('Crawl thành công! Dữ liệu đã được cập nhật.');
            
            // Refresh student list if on students section
            if (this.currentSection === 'students' && window.studentsManager) {
                await studentsManager.loadStudents();
            }
        } catch (error) {
            console.error('Crawl error:', error);
            
            // Check if it's a timeout error but crawl might have succeeded
            if (error.message.includes('timeout') || error.message.includes('Request timeout')) {
                notifications.warning('Crawl có thể đã hoàn thành nhưng mất nhiều thời gian. Hãy kiểm tra dữ liệu mới.');
            } else {
                notifications.error(error.message || 'Không thể thực hiện crawl');
            }
        } finally {
            loading.hide();
        }
    }

    /**
     * Check API connection với health check endpoint
     */
    async checkApiConnection() {
        try {
            this.isApiConnected = await api.healthCheck();
            
            if (!this.isApiConnected) {
                notifications.warning('Không thể kết nối đến server. Vui lòng kiểm tra lại.');
            }
        } catch (error) {
            console.error('API health check failed:', error);
            this.isApiConnected = false;
            notifications.error('Server không phản hồi. Vui lòng khởi động backend server.');
        }
    }

    /**
     * Handle API disconnection
     */
    handleApiDisconnection() {
        if (this.isApiConnected) {
            this.isApiConnected = false;
            notifications.error('Mất kết nối với server. Vui lòng kiểm tra lại.');
        }
    }

    /**
     * Show/hide sections dựa vào navigation
     * @param {string} sectionName - Tên section (students/analytics/import-export)
     * @param {boolean} updateHistory - Update browser history
     */
    showSection(sectionName, updateHistory = true) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        const targetNavBtn = document.querySelector(`[data-section="${sectionName}"]`);

        if (targetSection && targetNavBtn) {
            targetSection.classList.add('active');
            targetNavBtn.classList.add('active');
            this.currentSection = sectionName;

            // Update URL
            if (updateHistory) {
                const newUrl = sectionName === 'students' ? '/' : `/?section=${sectionName}`;
                window.history.pushState({ section: sectionName }, '', newUrl);
            }

            // Load section data
            this.loadSectionData(sectionName);
        }
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'students':
                if (window.studentsManager) {
                    studentsManager.loadStudents();
                }
                break;
            
            case 'analytics':
                if (window.analyticsManager) {
                    analyticsManager.loadAnalytics();
                }
                break;
            
            case 'import-export':
                // Import/Export section doesn't need to load data
                // Hide any previous import results
                const importResults = document.getElementById('importResults');
                if (importResults) {
                    importResults.classList.add('hidden');
                }
                break;
        }
    }

    // Utility method to get current section from URL
    getCurrentSectionFromUrl() {
        const params = getQueryParams();
        return params.section || 'students';
    }
}

// Initialize app when DOM is loaded
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    
    // Set initial section from URL
    const initialSection = app.getCurrentSectionFromUrl();
    app.showSection(initialSection, false);
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    
    // Don't show error notifications for network errors in development
    if (e.error?.message?.includes('Failed to fetch') || 
        e.error?.message?.includes('NetworkError')) {
        return;
    }
    
    notifications.error('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
});

// Handle online/offline status
window.addEventListener('online', () => {
    notifications.success('Đã kết nối lại internet');
    if (app) {
        app.checkApiConnection();
    }
});

window.addEventListener('offline', () => {
    notifications.warning('Mất kết nối internet');
});

// Performance monitoring (optional)
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation && navigation.loadEventEnd > 5000) {
                console.warn('Page load time is slow:', navigation.loadEventEnd, 'ms');
            }
        }, 0);
    });
}

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker registration can be added here in the future
        console.log('Service Worker support detected');
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput && app.currentSection === 'students') {
            searchInput.focus();
        }
    }
    
    // Ctrl/Cmd + N: Add new student (only on students section)
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && app.currentSection === 'students') {
        e.preventDefault();
        if (window.studentsManager) {
            studentsManager.openAddModal();
        }
    }
    
    // Number keys 1-2: Switch sections
    if (e.key >= '1' && e.key <= '2' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only if not typing in an input
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
            e.preventDefault();
            const sections = ['students', 'analytics'];
            const sectionIndex = parseInt(e.key) - 1;
            if (sections[sectionIndex]) {
                app.showSection(sections[sectionIndex]);
            }
        }
    }
});

// Export app instance for global access
window.app = app;