// Configuration
const CONFIG = {
    // Google Sheets API configuration
    spreadsheetId: '1rsUWkrkWiDbrCPXwmbFQ6BcQEvXtLbdBs-UWf2EPYzw',
    apiKey: 'AIzaSyBnHa_GmI4y36exdd5G1TMbTFJTG6J3TyE',
    range: '求職者一覧!A:J',
    
    // Alternative: Use CSV file
    csvUrl: 'data.csv',
    useGoogleSheets: true // Set to true to use Google Sheets
};

let interviews = [];
let charts = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    setupNavigation();
});

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            showView(targetView);
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

// Show specific view
function showView(viewName) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));
    document.getElementById(viewName).classList.add('active');
    
    // Initialize charts when analytics view is shown
    if (viewName === 'analytics' && interviews.length > 0) {
        setTimeout(() => {
            initializeDashboardCharts();
            initializeAnalyticsCharts();
        }, 100);
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', filterTable);
    document.getElementById('statusFilter').addEventListener('change', filterTable);
    document.getElementById('attendanceFilter').addEventListener('change', filterTable);
    document.getElementById('startDate').addEventListener('change', filterTable);
    document.getElementById('endDate').addEventListener('change', filterTable);
    
    // Analytics filters
    document.getElementById('applyAnalyticsFilter').addEventListener('click', applyAnalyticsFilter);
    document.getElementById('clearAnalyticsFilter').addEventListener('click', clearAnalyticsFilter);
}

// Load data from source
async function loadData() {
    try {
        console.log('Starting data load...');
        
        if (CONFIG.useGoogleSheets) {
            await loadFromGoogleSheets();
        } else {
            await loadFromCSV();
        }
        
        console.log('Data loaded:', interviews.length, 'records');
        
        renderTable();
        updateLastUpdated();
        updateDashboard();
        if (document.getElementById('analytics').classList.contains('active')) {
            initializeDashboardCharts();
            initializeAnalyticsCharts();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showError('データの読み込みに失敗しました。詳細: ' + error.message);
    }
}

// Load data from Google Sheets
async function loadFromGoogleSheets() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${CONFIG.range}?key=${CONFIG.apiKey}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            console.error('Google Sheets API error:', data.error);
            throw new Error(`API Error: ${data.error.message}`);
        }
        
        if (data.values && data.values.length > 1) {
            const headers = data.values[0];
            interviews = data.values.slice(1)
                .filter(row => row[0] && row[1] && row[1].trim() !== '') // No.と識別子が存在し、識別子が空でない行のみ
                .map(row => ({
                    no: row[0] || '',
                    identifier: row[1] || '',
                    appointmentDate: row[2] || '',
                    interviewDate: row[3] || '',
                    attendance: row[4] || '',
                    result: row[5] || '',
                    rejectReason: row[6] || '',
                    judgmentDate: row[7] || '',
                    age: row[8] || '',
                    gender: row[9] || ''
                }));
        } else {
            console.warn('No data found in spreadsheet');
            interviews = [];
        }
    } catch (error) {
        console.error('Failed to load from Google Sheets:', error);
        // Fallback to CSV
        await loadFromCSV();
    }
}

// Load data from CSV file
async function loadFromCSV() {
    try {
        const response = await fetch(CONFIG.csvUrl);
        const text = await response.text();
        
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim());
            interviews = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                return {
                    no: values[0] || '',
                    identifier: values[1] || '',
                    appointmentDate: values[2] || '',
                    interviewDate: values[3] || '',
                    attendance: values[4] || '',
                    result: values[5] || '',
                    rejectReason: values[6] || '',
                    judgmentDate: values[7] || '',
                    age: values[8] || '',
                    gender: values[9] || ''
                };
            });
        }
    } catch (error) {
        // If CSV doesn't exist, use sample data
        interviews = [
            { 
                no: '1', 
                identifier: '柳田ひまり', 
                appointmentDate: '2025.05.26（月）22:18', 
                interviewDate: '2025.06.06（金）', 
                attendance: '○', 
                result: '有効', 
                rejectReason: '', 
                judgmentDate: '6/6', 
                age: '22歳', 
                gender: '女性' 
            },
            { 
                no: '2', 
                identifier: '木皿璃紅', 
                appointmentDate: '2025.05.29（木）17:37', 
                interviewDate: '2025.06.03（火）', 
                attendance: '×', 
                result: '無効', 
                rejectReason: '未着席のため', 
                judgmentDate: '', 
                age: '26歳', 
                gender: '女性' 
            },
            { 
                no: '3', 
                identifier: '田中太郎', 
                appointmentDate: '2025.05.27（火）10:30', 
                interviewDate: '2025.06.04（水）', 
                attendance: '○', 
                result: '有効', 
                rejectReason: '', 
                judgmentDate: '6/4', 
                age: '28歳', 
                gender: '男性' 
            },
            { 
                no: '4', 
                identifier: '佐藤花子', 
                appointmentDate: '2025.05.28（水）14:15', 
                interviewDate: '2025.06.05（木）', 
                attendance: '○', 
                result: '保留', 
                rejectReason: '', 
                judgmentDate: '', 
                age: '24歳', 
                gender: '女性' 
            }
        ];
    }
}

// Update dashboard statistics
function updateDashboard(filteredData = null) {
    const data = filteredData || interviews;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let beforeInterview = 0;
    let valid = 0;
    let invalid = 0;
    let pending = 0;
    
    data.forEach(interview => {
        // Parse interview date
        const interviewDateMatch = interview.interviewDate.match(/(\d{4})\.(\d{2})\.(\d{2})/);
        if (interviewDateMatch) {
            const interviewDate = new Date(interviewDateMatch[1], interviewDateMatch[2] - 1, interviewDateMatch[3]);
            interviewDate.setHours(0, 0, 0, 0);
            
            if (interviewDate > today) {
                // Future interview
                beforeInterview++;
            } else {
                // Past or today's interview
                if (interview.result === '有効') {
                    valid++;
                } else if (interview.result === '無効') {
                    invalid++;
                } else {
                    // No result yet but interview date has passed
                    pending++;
                }
            }
        }
    });
    
    const total = data.length;
    const attended = data.filter(i => i.attendance === '○').length;
    const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;
    
    // Update both dashboard and analytics stats
    const elements = ['totalInterviews', 'beforeInterviews', 'validInterviews', 'invalidInterviews', 'pendingInterviews', 'attendanceRate'];
    const values = [total, beforeInterview, valid, invalid, pending, attendanceRate + '%'];
    
    elements.forEach((id, index) => {
        const el1 = document.getElementById(id);
        const el2 = document.getElementById(id + '2');
        if (el1) el1.textContent = values[index];
        if (el2) el2.textContent = values[index];
    });
}

// Parse appointment date to extract day and time
function parseAppointmentDate(dateStr) {
    // Extract day of week from format like "2025.05.26（月）22:18"
    const dayMatch = dateStr.match(/（([月火水木金土日])）/);
    const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
    
    return {
        dayOfWeek: dayMatch ? dayMatch[1] : null,
        hour: timeMatch ? parseInt(timeMatch[1]) : null,
        minute: timeMatch ? parseInt(timeMatch[2]) : null
    };
}

// Initialize dashboard charts
function initializeDashboardCharts(inputData = null) {
    const chartData = inputData || interviews;
    // Combined day and time chart
    const dayTimeData = analyzeDayTimeDistribution(chartData);
    const dayTimeCtx = document.getElementById('dayTimeChart').getContext('2d');
    
    if (charts.dayTimeChart) charts.dayTimeChart.destroy();
    charts.dayTimeChart = new Chart(dayTimeCtx, {
        type: 'bar',
        data: {
            labels: dayTimeData.labels,
            datasets: [{
                label: '予約数',
                data: dayTimeData.data,
                backgroundColor: dayTimeData.colors,
                borderColor: dayTimeData.borderColors,
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 0,
                        font: {
                            size: 10
                        },
                        callback: function(value, index) {
                            // Skip empty labels
                            if (this.getLabelForValue(index) === '') return '';
                            return this.getLabelForValue(index).split('\n');
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Analyze day of week distribution
function analyzeDayOfWeek() {
    const days = ['月', '火', '水', '木', '金', '土', '日'];
    const counts = days.map(() => 0);
    
    interviews.forEach(interview => {
        const parsed = parseAppointmentDate(interview.appointmentDate);
        if (parsed.dayOfWeek) {
            const index = days.indexOf(parsed.dayOfWeek);
            if (index !== -1) counts[index]++;
        }
    });
    
    return counts;
}

// Analyze time distribution
function analyzeTimeDistribution() {
    const hours = Array.from({length: 24}, () => 0);
    
    interviews.forEach(interview => {
        const parsed = parseAppointmentDate(interview.appointmentDate);
        if (parsed.hour !== null) {
            hours[parsed.hour]++;
        }
    });
    
    return hours;
}

// Analyze combined day and time distribution
function analyzeDayTimeDistribution(inputData = null) {
    const chartData = inputData || interviews;
    const days = ['月', '火', '水', '木', '金', '土', '日'];
    const timeSlots = [
        { label: '深夜早朝', range: '0-8時', color: 'rgba(147, 197, 253, 0.8)', borderColor: 'rgba(147, 197, 253, 1)' },
        { label: '日中', range: '8-18時', color: 'rgba(59, 130, 246, 0.8)', borderColor: 'rgba(59, 130, 246, 1)' },
        { label: '夜間', range: '18-24時', color: 'rgba(29, 78, 216, 0.8)', borderColor: 'rgba(29, 78, 216, 1)' }
    ];
    const labels = [];
    const data = [];
    const colors = [];
    const borderColors = [];
    
    // Initialize data structure
    const distribution = {};
    days.forEach(day => {
        distribution[day] = {
            morning: 0,    // 0:00-7:59
            daytime: 0,    // 8:00-17:59
            evening: 0     // 18:00-23:59
        };
    });
    
    // Count appointments by day and time slot
    chartData.forEach(interview => {
        const parsed = parseAppointmentDate(interview.appointmentDate);
        if (parsed.dayOfWeek && parsed.hour !== null) {
            if (parsed.hour >= 0 && parsed.hour < 8) {
                distribution[parsed.dayOfWeek].morning++;
            } else if (parsed.hour >= 8 && parsed.hour < 18) {
                distribution[parsed.dayOfWeek].daytime++;
            } else {
                distribution[parsed.dayOfWeek].evening++;
            }
        }
    });
    
    // Create chart data with improved labels
    days.forEach((day, dayIndex) => {
        // Add separator between days
        if (dayIndex > 0) {
            labels.push('');
            data.push(0);
            colors.push('transparent');
            borderColors.push('transparent');
        }
        
        // Morning
        labels.push(`${day}曜日\n${timeSlots[0].range}`);
        data.push(distribution[day].morning);
        colors.push(timeSlots[0].color);
        borderColors.push(timeSlots[0].borderColor);
        
        // Daytime
        labels.push(`${day}曜日\n${timeSlots[1].range}`);
        data.push(distribution[day].daytime);
        colors.push(timeSlots[1].color);
        borderColors.push(timeSlots[1].borderColor);
        
        // Evening
        labels.push(`${day}曜日\n${timeSlots[2].range}`);
        data.push(distribution[day].evening);
        colors.push(timeSlots[2].color);
        borderColors.push(timeSlots[2].borderColor);
    });
    
    return { labels, data, colors, borderColors };
}

// Initialize analytics charts
function initializeAnalyticsCharts(inputData = null) {
    const chartData = inputData || interviews;
    
    // Result distribution with updated categories
    const resultCtx = document.getElementById('resultChart').getContext('2d');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let beforeInterview = 0;
    let valid = 0;
    let invalid = 0;
    let pending = 0;
    
    chartData.forEach(interview => {
        const interviewDateMatch = interview.interviewDate.match(/(\d{4})\.(\d{2})\.(\d{2})/);
        if (interviewDateMatch) {
            const interviewDate = new Date(interviewDateMatch[1], interviewDateMatch[2] - 1, interviewDateMatch[3]);
            interviewDate.setHours(0, 0, 0, 0);
            
            if (interviewDate > today) {
                beforeInterview++;
            } else {
                if (interview.result === '有効') {
                    valid++;
                } else if (interview.result === '無効') {
                    invalid++;
                } else {
                    pending++;
                }
            }
        }
    });
    
    const resultCounts = {
        '有効': valid,
        '無効': invalid,
        '面談前': beforeInterview,
        '保留': pending
    };
    
    if (charts.resultChart) charts.resultChart.destroy();
    charts.resultChart = new Chart(resultCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(resultCounts),
            datasets: [{
                data: Object.values(resultCounts),
                backgroundColor: [
                    'rgba(52, 199, 89, 0.8)',
                    'rgba(255, 59, 48, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(255, 149, 0, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Age distribution
    const ageCtx = document.getElementById('ageChart').getContext('2d');
    const ageGroups = analyzeAgeDistribution(chartData);
    
    if (charts.ageChart) charts.ageChart.destroy();
    charts.ageChart = new Chart(ageCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                label: '人数',
                data: Object.values(ageGroups),
                backgroundColor: 'rgba(0, 122, 255, 0.8)',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Gender distribution
    const genderCtx = document.getElementById('genderChart').getContext('2d');
    const genderCounts = {
        '男性': chartData.filter(i => i.gender === '男性').length,
        '女性': chartData.filter(i => i.gender === '女性').length
    };
    
    if (charts.genderChart) charts.genderChart.destroy();
    charts.genderChart = new Chart(genderCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(genderCounts),
            datasets: [{
                data: Object.values(genderCounts),
                backgroundColor: [
                    'rgba(0, 122, 255, 0.8)',
                    'rgba(255, 59, 48, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Analyze age distribution
function analyzeAgeDistribution(inputData = null) {
    const chartData = inputData || interviews;
    const groups = {
        '16-18': 0,
        '19-21': 0,
        '22-24': 0,
        '25-27': 0,
        '28-30': 0,
        '31-33': 0,
        '34-36': 0,
        '35+': 0
    };
    
    chartData.forEach(interview => {
        const ageMatch = interview.age.match(/(\d+)/);
        if (ageMatch) {
            const age = parseInt(ageMatch[1]);
            if (age >= 16 && age <= 18) groups['16-18']++;
            else if (age >= 19 && age <= 21) groups['19-21']++;
            else if (age >= 22 && age <= 24) groups['22-24']++;
            else if (age >= 25 && age <= 27) groups['25-27']++;
            else if (age >= 28 && age <= 30) groups['28-30']++;
            else if (age >= 31 && age <= 33) groups['31-33']++;
            else if (age >= 34 && age <= 36) groups['34-36']++;
            else if (age >= 37) groups['35+']++;
        }
    });
    
    return groups;
}

// Analyze monthly trends
function analyzeMonthlyTrends() {
    const monthCounts = {};
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    interviews.forEach(interview => {
        const dateMatch = interview.interviewDate.match(/(\d{4})\.(\d{2})\.(\d{2})/);
        if (dateMatch) {
            const year = dateMatch[1];
            const month = parseInt(dateMatch[2]);
            const key = `${year}年${month}月`;
            monthCounts[key] = (monthCounts[key] || 0) + 1;
        }
    });
    
    // Sort by year and month
    const sortedKeys = Object.keys(monthCounts).sort((a, b) => {
        const [yearA, monthA] = a.match(/(\d+)年(\d+)月/).slice(1).map(Number);
        const [yearB, monthB] = b.match(/(\d+)年(\d+)月/).slice(1).map(Number);
        return yearA === yearB ? monthA - monthB : yearA - yearB;
    });
    
    return {
        labels: sortedKeys,
        data: sortedKeys.map(key => monthCounts[key])
    };
}

// Render table
function renderTable(filteredInterviews = interviews) {
    const tbody = document.getElementById('tableBody');
    
    if (filteredInterviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="loading">データがありません</td></tr>';
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    tbody.innerHTML = filteredInterviews.map(interview => {
        // Determine status display
        let statusDisplay = interview.result || '';
        let statusClass = interview.result || '';
        
        const interviewDateMatch = interview.interviewDate.match(/(\d{4})\.(\d{2})\.(\d{2})/);
        if (interviewDateMatch) {
            const interviewDate = new Date(interviewDateMatch[1], interviewDateMatch[2] - 1, interviewDateMatch[3]);
            interviewDate.setHours(0, 0, 0, 0);
            
            if (interviewDate > today && !interview.result) {
                statusDisplay = '面談前';
                statusClass = '面談前';
            } else if (interviewDate <= today && !interview.result) {
                statusDisplay = '保留';
                statusClass = '保留';
            }
        }
        
        return `
        <tr>
            <td>${interview.no}</td>
            <td>${interview.identifier}</td>
            <td>${interview.appointmentDate}</td>
            <td>${interview.interviewDate}</td>
            <td><span class="attendance ${interview.attendance === '○' ? '出席' : '欠席'}">${interview.attendance}</span></td>
            <td><span class="status ${statusClass}">${statusDisplay}</span></td>
            <td>${interview.rejectReason}</td>
            <td>${interview.judgmentDate}</td>
            <td>${interview.age}</td>
            <td>${interview.gender}</td>
        </tr>
        `;
    }).join('');
}

// Filter table based on search and status
function filterTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const attendanceFilter = document.getElementById('attendanceFilter').value;
    const startDateValue = document.getElementById('startDate').value;
    const endDateValue = document.getElementById('endDate').value;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const filtered = interviews.filter(interview => {
        const matchesSearch = Object.values(interview).some(value => 
            value.toLowerCase().includes(searchTerm)
        );
        
        // Check status with date logic
        let matchesStatus = true;
        if (statusFilter) {
            const interviewDateMatch = interview.interviewDate.match(/(\d{4})\.(\d{2})\.(\d{2})/);
            if (interviewDateMatch) {
                const interviewDate = new Date(interviewDateMatch[1], interviewDateMatch[2] - 1, interviewDateMatch[3]);
                interviewDate.setHours(0, 0, 0, 0);
                
                if (statusFilter === '面談前') {
                    matchesStatus = interviewDate > today;
                } else if (statusFilter === '保留') {
                    matchesStatus = interviewDate <= today && !interview.result;
                } else {
                    matchesStatus = interview.result === statusFilter;
                }
            } else {
                matchesStatus = interview.result === statusFilter;
            }
        }
        
        const matchesAttendance = !attendanceFilter || interview.attendance === attendanceFilter;
        
        // Check date range
        let matchesDateRange = true;
        const interviewDateMatch = interview.interviewDate.match(/(\d{4})\.(\d{2})\.(\d{2})/);
        if (interviewDateMatch) {
            const interviewDate = new Date(interviewDateMatch[1], interviewDateMatch[2] - 1, interviewDateMatch[3]);
            
            if (startDateValue) {
                const startDate = new Date(startDateValue);
                startDate.setHours(0, 0, 0, 0);
                if (interviewDate < startDate) matchesDateRange = false;
            }
            
            if (endDateValue) {
                const endDate = new Date(endDateValue);
                endDate.setHours(23, 59, 59, 999);
                if (interviewDate > endDate) matchesDateRange = false;
            }
        }
        
        return matchesSearch && matchesStatus && matchesAttendance && matchesDateRange;
    });
    
    renderTable(filtered);
}

// Update last updated time
function updateLastUpdated() {
    const now = new Date();
    const formatted = now.toLocaleString('ja-JP');
    document.getElementById('lastUpdated').textContent = formatted;
}

// Show error message
function showError(message) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `<tr><td colspan="10" class="loading">${message}</td></tr>`;
}

// Apply analytics filter
function applyAnalyticsFilter() {
    const startDate = document.getElementById('analyticsStartDate').value;
    const endDate = document.getElementById('analyticsEndDate').value;
    
    let filteredData = interviews;
    
    if (startDate || endDate) {
        filteredData = interviews.filter(interview => {
            const dateMatch = interview.interviewDate.match(/(\d{4})\.(\d{2})\.(\d{2})/);
            if (!dateMatch) return true;
            
            const interviewDate = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
            
            if (startDate) {
                const start = new Date(startDate);
                if (interviewDate < start) return false;
            }
            
            if (endDate) {
                const end = new Date(endDate);
                if (interviewDate > end) return false;
            }
            
            return true;
        });
    }
    
    // Update statistics with filtered data
    updateDashboard(filteredData);
    
    // Reinitialize charts with filtered data
    initializeDashboardCharts(filteredData);
    initializeAnalyticsCharts(filteredData);
}

// Clear analytics filter
function clearAnalyticsFilter() {
    document.getElementById('analyticsStartDate').value = '';
    document.getElementById('analyticsEndDate').value = '';
    
    // Reset to all data
    updateDashboard();
    initializeDashboardCharts();
    initializeAnalyticsCharts();
}