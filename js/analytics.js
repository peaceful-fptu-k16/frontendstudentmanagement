// =====================================================
// ANALYTICS MODULE
// =====================================================
// Module hiển thị charts và statistics của student data

/**
 * AnalyticsManager Class
 * Quản lý việc tạo charts và hiển thị analytics
 */
class AnalyticsManager {
    constructor() {
        this.charts = {};        // Object chứa Chart.js instances
        this.data = null;        // Analytics data
        
        this.bindEvents();
    }

    /**
     * Bind events (refresh button)
     */
    bindEvents() {
        // Refresh analytics button
        document.getElementById('refreshAnalytics').addEventListener('click', () => {
            this.loadAnalytics();
        });
    }

    /**
     * Load analytics data và render charts
     */
    async loadAnalytics() {
        try {
            // Chỉ load nếu analytics section đang active
            const analyticsSection = document.getElementById('analytics-section');
            if (!analyticsSection || !analyticsSection.classList.contains('active')) {
                return;
            }

            loading.show();
            
            // Lấy data từ StudentsManager nếu có (client-side analysis)
            if (window.studentsManager && window.studentsManager.allStudents) {
                this.data = this.analyzeLocalData(window.studentsManager.allStudents);
            } else {
                // Fallback: Lấy từ API
                const [summary, scoreComparison, hometownAnalysis] = await Promise.all([
                    api.getAnalyticsSummary(),
                    api.getScoreComparison(),
                    api.getHometownAnalysis()
                ]);

                this.data = {
                    summary,
                    scoreComparison,
                    hometownAnalysis
                };
            }

            // Render UI
            this.renderOverview();
            this.renderCharts();

        } catch (error) {
            console.error('Error loading analytics:', error);
            notifications.error(error.message || 'Không thể tải dữ liệu phân tích');
        } finally {
            loading.hide();
        }
    }

    analyzeLocalData(students) {
        if (!students || students.length === 0) {
            return { summary: { overview: {} }, scoreComparison: {}, hometownAnalysis: {} };
        }

        // Calculate overview stats
        const totalStudents = students.length;
        const studentsWithScores = students.filter(s => 
            s.math_score !== null || s.literature_score !== null || s.english_score !== null
        ).length;

        // Calculate average age
        const currentYear = new Date().getFullYear();
        const ages = students
            .filter(s => s.birth_date)
            .map(s => currentYear - new Date(s.birth_date).getFullYear());
        const averageAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;

        // Calculate grade distribution
        const gradeDistribution = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
        students.forEach(student => {
            if (student.average_score !== null && student.average_score !== undefined) {
                const grade = calculateGrade(student.average_score);
                if (gradeDistribution.hasOwnProperty(grade)) {
                    gradeDistribution[grade]++;
                }
            }
        });

        // Calculate average scores by subject
        const mathScores = students.filter(s => s.math_score !== null && s.math_score !== undefined).map(s => s.math_score);
        const literatureScores = students.filter(s => s.literature_score !== null && s.literature_score !== undefined).map(s => s.literature_score);
        const englishScores = students.filter(s => s.english_score !== null && s.english_score !== undefined).map(s => s.english_score);

        const averageScores = {
            math: mathScores.length > 0 ? mathScores.reduce((sum, score) => sum + score, 0) / mathScores.length : null,
            literature: literatureScores.length > 0 ? literatureScores.reduce((sum, score) => sum + score, 0) / literatureScores.length : null,
            english: englishScores.length > 0 ? englishScores.reduce((sum, score) => sum + score, 0) / englishScores.length : null
        };

        // Calculate hometown distribution
        const hometownCount = {};
        students.forEach(student => {
            if (student.hometown) {
                hometownCount[student.hometown] = (hometownCount[student.hometown] || 0) + 1;
            }
        });

        // Calculate score ranges
        const scoreRanges = { '0-5': 0, '5-6.5': 0, '6.5-8': 0, '8-10': 0 };
        students.forEach(student => {
            if (student.average_score !== null && student.average_score !== undefined) {
                const score = student.average_score;
                if (score < 5) scoreRanges['0-5']++;
                else if (score < 6.5) scoreRanges['5-6.5']++;
                else if (score < 8) scoreRanges['6.5-8']++;
                else scoreRanges['8-10']++;
            }
        });

        return {
            summary: {
                overview: {
                    total_students: totalStudents,
                    average_age: averageAge,
                    students_with_scores: studentsWithScores
                },
                academic_performance: {
                    grade_distribution: gradeDistribution,
                    average_scores: averageScores,
                    score_ranges: scoreRanges
                }
            },
            hometownAnalysis: hometownCount,
            scoreComparison: {
                by_subject: averageScores,
                by_hometown: this.calculateScoresByHometown(students)
            }
        };
    }

    calculateScoresByHometown(students) {
        const hometownScores = {};
        
        students.forEach(student => {
            if (student.hometown && student.average_score !== null && student.average_score !== undefined) {
                if (!hometownScores[student.hometown]) {
                    hometownScores[student.hometown] = [];
                }
                hometownScores[student.hometown].push(student.average_score);
            }
        });

        // Calculate average for each hometown
        const result = {};
        Object.keys(hometownScores).forEach(hometown => {
            const scores = hometownScores[hometown];
            result[hometown] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        });

        return result;
    }

    renderOverview() {
        if (!this.data?.summary?.overview) return;

        const overview = this.data.summary.overview;
        
        const overviewHtml = `
            <div class="overview-item">
                <div class="overview-label">Tổng số sinh viên</div>
                <div class="overview-value">${overview.total_students || 0}</div>
            </div>
            <div class="overview-item">
                <div class="overview-label">Tuổi trung bình</div>
                <div class="overview-value">${overview.average_age ? overview.average_age.toFixed(1) : 'N/A'}</div>
            </div>
            <div class="overview-item">
                <div class="overview-label">Có điểm số</div>
                <div class="overview-value">${overview.students_with_scores || 0}</div>
            </div>
        `;

        const overviewElement = document.getElementById('overviewStats');
        if (overviewElement) {
            overviewElement.innerHTML = overviewHtml;
        }
        
        // Render additional components
        this.renderQuickStats();
        this.renderTopPerformers();
        this.renderInsights();
    }

    renderQuickStats() {
        if (!this.data?.summary?.academic_performance) return;

        const performance = this.data.summary.academic_performance;
        const avgScores = performance.average_scores;
        
        let highestSubject = 'N/A';
        let highestScore = 0;
        let lowestSubject = 'N/A';
        let lowestScore = 10;

        if (avgScores) {
            Object.entries(avgScores).forEach(([subject, score]) => {
                if (score !== null && score !== undefined) {
                    if (score > highestScore) {
                        highestScore = score;
                        highestSubject = subject === 'math' ? 'Toán' : subject === 'literature' ? 'Văn' : 'Tiếng Anh';
                    }
                    if (score < lowestScore) {
                        lowestScore = score;
                        lowestSubject = subject === 'math' ? 'Toán' : subject === 'literature' ? 'Văn' : 'Tiếng Anh';
                    }
                }
            });
        }

        // Count excellent students (>= 8.0)
        const excellentCount = Object.values(performance.grade_distribution || {}).reduce((sum, count, index) => {
            return index === 0 ? sum + count : sum; // Grade A
        }, 0);

        const quickStatsHtml = `
            <div class="quick-stat-item">
                <div class="quick-stat-label">Môn điểm cao nhất</div>
                <div class="quick-stat-value">${highestSubject} (${highestScore.toFixed(1)})</div>
            </div>
            <div class="quick-stat-item">
                <div class="quick-stat-label">Môn cần cải thiện</div>
                <div class="quick-stat-value">${lowestSubject} (${lowestScore.toFixed(1)})</div>
            </div>
            <div class="quick-stat-item">
                <div class="quick-stat-label">Sinh viên xuất sắc</div>
                <div class="quick-stat-value">${excellentCount} sinh viên</div>
            </div>
        `;

        const quickStatsElement = document.getElementById('quickStats');
        if (quickStatsElement) {
            quickStatsElement.innerHTML = quickStatsHtml;
        }
    }

    renderTopPerformers() {
        if (!window.studentsManager?.allStudents) return;

        const students = window.studentsManager.allStudents
            .filter(s => s.average_score !== null && s.average_score !== undefined)
            .sort((a, b) => b.average_score - a.average_score)
            .slice(0, 5);

        const topPerformersElement = document.getElementById('topPerformers');
        if (!topPerformersElement) {
            console.warn('Top performers element not found');
            return;
        }

        if (students.length === 0) {
            topPerformersElement.innerHTML = '<p style="text-align: center; color: #718096;">Chưa có dữ liệu điểm số</p>';
            return;
        }

        const topPerformersHtml = students.map((student, index) => `
            <div class="performer-item">
                <div class="performer-rank">${index + 1}</div>
                <div class="performer-info">
                    <div class="performer-name">${student.full_name || student.student_id}</div>
                    <div class="performer-id">${student.student_id}</div>
                </div>
                <div class="performer-score">${student.average_score.toFixed(1)}</div>
            </div>
        `).join('');

        topPerformersElement.innerHTML = topPerformersHtml;
    }

    renderInsights() {
        if (!this.data?.summary) return;

        const insights = this.generateInsights();
        const insightsHtml = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <div class="insight-title">
                    <i class="fas ${insight.icon}"></i>
                    ${insight.title}
                </div>
                <div class="insight-description">${insight.description}</div>
            </div>
        `).join('');

        const insightsElement = document.getElementById('performanceInsights');
        if (insightsElement) {
            insightsElement.innerHTML = insightsHtml;
        }
    }

    generateInsights() {
        const insights = [];
        const performance = this.data.summary.academic_performance;
        const overview = this.data.summary.overview;

        if (!performance || !overview) return insights;

        // Insight about grade distribution
        const gradeA = performance.grade_distribution?.A || 0;
        const total = overview.total_students || 1;
        const excellentRate = (gradeA / total) * 100;

        if (excellentRate > 20) {
            insights.push({
                type: 'positive',
                icon: 'fa-thumbs-up',
                title: 'Chất lượng học tập tốt',
                description: `${excellentRate.toFixed(1)}% sinh viên đạt loại xuất sắc. Đây là tỷ lệ rất tích cực!`
            });
        } else if (excellentRate < 10) {
            insights.push({
                type: 'warning',
                icon: 'fa-exclamation-triangle',
                title: 'Cần nâng cap chất lượng',
                description: `Chỉ ${excellentRate.toFixed(1)}% sinh viên đạt loại xuất sắc. Cần có biện pháp hỗ trợ học tập.`
            });
        }

        // Insight about subject performance
        const avgScores = performance.average_scores;
        if (avgScores) {
            const subjects = Object.entries(avgScores).filter(([_, score]) => score !== null);
            if (subjects.length > 0) {
                const [bestSubject, bestScore] = subjects.reduce((best, current) => 
                    current[1] > best[1] ? current : best
                );
                const [worstSubject, worstScore] = subjects.reduce((worst, current) => 
                    current[1] < worst[1] ? current : worst
                );

                const subjectNames = {
                    math: 'Toán',
                    literature: 'Văn',
                    english: 'Tiếng Anh'
                };

                if (bestScore - worstScore > 1) {
                    insights.push({
                        type: 'info',
                        icon: 'fa-chart-line',
                        title: 'Chênh lệch điểm môn học',
                        description: `${subjectNames[bestSubject]} (${bestScore.toFixed(1)}) cao hơn ${subjectNames[worstSubject]} (${worstScore.toFixed(1)}) ${(bestScore - worstScore).toFixed(1)} điểm.`
                    });
                }
            }
        }

        // Insight about data completeness
        const completenessRate = (overview.students_with_scores / total) * 100;
        if (completenessRate < 80) {
            insights.push({
                type: 'warning',
                icon: 'fa-database',
                title: 'Dữ liệu chưa đầy đủ',
                description: `${(100 - completenessRate).toFixed(1)}% sinh viên chưa có điểm số. Cần cập nhật dữ liệu.`
            });
        }

        return insights;
    }

    renderCharts() {
        this.renderGradeChart();
        this.renderScoreChart();
        this.renderScoreRangeChart();
        this.renderHometownChart();
    }

    renderGradeChart() {
        if (!this.data?.summary?.academic_performance?.grade_distribution) return;

        const gradeData = this.data.summary.academic_performance.grade_distribution;
        const canvas = document.getElementById('gradeChart');
        
        if (!canvas) {
            console.warn('Grade chart canvas not found');
            return;
        }
        
        // Destroy existing chart
        if (this.charts.gradeChart) {
            this.charts.gradeChart.destroy();
        }

        // Prepare data for chart
        const labels = Object.keys(gradeData).filter(grade => gradeData[grade] > 0);
        const values = labels.map(grade => gradeData[grade]);
        const colors = labels.map(grade => GRADE_CONFIG[grade]?.bg || '#f0f0f0');

        if (labels.length === 0) {
            canvas.parentNode.innerHTML = '<p style="text-align: center; color: #718096; padding: 2rem;">Chưa có dữ liệu xếp loại</p>';
            return;
        }

        this.charts.gradeChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: labels.map(grade => `Loại ${grade}`),
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                ...CHART_CONFIG.DEFAULT_OPTIONS,
                plugins: {
                    ...CHART_CONFIG.DEFAULT_OPTIONS.plugins,
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} sinh viên (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderScoreChart() {
        if (!this.data?.summary?.academic_performance?.average_scores) return;

        const avgScores = this.data.summary.academic_performance.average_scores;
        const canvas = document.getElementById('scoreChart');
        
        if (!canvas) {
            console.warn('Score chart canvas not found');
            return;
        }
        
        // Destroy existing chart
        if (this.charts.scoreChart) {
            this.charts.scoreChart.destroy();
        }

        // Prepare data for chart
        const subjects = [];
        const scores = [];

        if (avgScores.math !== undefined && avgScores.math !== null) {
            subjects.push('Toán');
            scores.push(avgScores.math);
        }
        if (avgScores.literature !== undefined && avgScores.literature !== null) {
            subjects.push('Văn');
            scores.push(avgScores.literature);
        }
        if (avgScores.english !== undefined && avgScores.english !== null) {
            subjects.push('Tiếng Anh');
            scores.push(avgScores.english);
        }

        if (subjects.length === 0) {
            canvas.parentNode.innerHTML = '<p style="text-align: center; color: #718096; padding: 2rem;">Chưa có dữ liệu điểm số</p>';
            return;
        }

        this.charts.scoreChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: subjects,
                datasets: [{
                    label: 'Điểm trung bình',
                    data: scores,
                    backgroundColor: CHART_CONFIG.COLORS.PRIMARY.slice(0, subjects.length),
                    borderColor: CHART_CONFIG.COLORS.PRIMARY.slice(0, subjects.length).map(color => color.replace('0.8', '1')),
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                ...CHART_CONFIG.DEFAULT_OPTIONS,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Điểm'
                        }
                    }
                },
                plugins: {
                    ...CHART_CONFIG.DEFAULT_OPTIONS.plugins,
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderScoreRangeChart() {
        if (!this.data?.summary?.academic_performance?.score_ranges) return;

        const scoreRanges = this.data.summary.academic_performance.score_ranges;
        const canvas = document.getElementById('scoreRangeChart');
        
        if (!canvas) {
            console.warn('Score range chart canvas not found');
            return;
        }
        
        // Destroy existing chart
        if (this.charts.scoreRangeChart) {
            this.charts.scoreRangeChart.destroy();
        }

        const labels = ['Dưới 5.0', '5.0 - 6.5', '6.5 - 8.0', '8.0 - 10'];
        const values = [
            scoreRanges['0-5'] || 0,
            scoreRanges['5-6.5'] || 0,
            scoreRanges['6.5-8'] || 0,
            scoreRanges['8-10'] || 0
        ];
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

        if (values.every(v => v === 0)) {
            canvas.parentNode.innerHTML = '<p style="text-align: center; color: #718096; padding: 2rem;">Chưa có dữ liệu điểm số</p>';
            return;
        }

        this.charts.scoreRangeChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số lượng sinh viên',
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors.map(color => color),
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Số lượng sinh viên'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Khoảng điểm'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} sinh viên`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderHometownChart() {
        // Use hometownAnalysis from local data or API data
        const hometownData = this.data?.hometownAnalysis || this.data?.summary?.demographics?.hometown_distribution;
        if (!hometownData) return;
        
        const canvas = document.getElementById('hometownChart');
        
        if (!canvas) {
            console.warn('Hometown chart canvas not found');
            return;
        }
        
        // Destroy existing chart
        if (this.charts.hometownChart) {
            this.charts.hometownChart.destroy();
        }

        // Prepare data for chart - show top 10 hometowns
        const sortedHometowns = Object.entries(hometownData)
            .filter(([hometown, count]) => hometown && hometown.trim() && count > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (sortedHometowns.length === 0) {
            canvas.parentNode.innerHTML = '<p style="text-align: center; color: #718096; padding: 2rem;">Chưa có dữ liệu quê quán</p>';
            return;
        }

        const labels = sortedHometowns.map(([hometown]) => hometown);
        const values = sortedHometowns.map(([, count]) => count);

        this.charts.hometownChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số sinh viên',
                    data: values,
                    backgroundColor: CHART_CONFIG.COLORS.PRIMARY[0],
                    borderColor: CHART_CONFIG.COLORS.PRIMARY[1],
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y', // This makes it horizontal
                ...CHART_CONFIG.DEFAULT_OPTIONS,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Số sinh viên'
                        }
                    }
                },
                plugins: {
                    ...CHART_CONFIG.DEFAULT_OPTIONS.plugins,
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.x} sinh viên`;
                            }
                        }
                    }
                }
            }
        });
    }

    destroy() {
        // Destroy all charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// CSS for overview stats
const overviewStyles = `
.overview-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.overview-item {
    background: #f7fafc;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    border: 2px solid #e2e8f0;
}

.overview-label {
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.overview-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a202c;
}
`;

// Add styles to document
if (!document.querySelector('#analytics-styles')) {
    const style = document.createElement('style');
    style.id = 'analytics-styles';
    style.textContent = overviewStyles;
    document.head.appendChild(style);
}

// Initialize analytics manager
let analyticsManager;

document.addEventListener('DOMContentLoaded', () => {
    analyticsManager = new AnalyticsManager();
    // Export globally
    window.analyticsManager = analyticsManager;
});