// Dashboard JavaScript - Real-time Updates
const API_BASE_URL = window.location.origin;
let socket = null;
let charts = {};

// Initialize Socket.IO connection
function initSocket() {
    socket = io(API_BASE_URL);

    socket.on('connect', () => {
        console.log('✅ Conectado al servidor');
        updateConnectionStatus('connected', 'Conectado');
    });

    socket.on('disconnect', () => {
        console.log('❌ Desconectado del servidor');
        updateConnectionStatus('disconnected', 'Desconectado');
    });

    socket.on('real-time-metrics', (data) => {
        updateMetrics(data);
        updateLastUpdate();
    });

    socket.on('new-access', (access) => {
        addRecentAccess(access);
        updateMetricsFromAccess(access);
    });

    socket.on('hourly-data', (data) => {
        updateHourlyChart(data);
    });
}

// Update connection status
function updateConnectionStatus(status, text) {
    const statusElement = document.getElementById('connectionStatus');
    const dot = statusElement.querySelector('.status-dot');
    
    dot.className = 'status-dot ' + status;
    statusElement.childNodes[1].textContent = text;
}

// Update last update time
function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES');
    document.getElementById('lastUpdate').textContent = timeString;
}

// Initialize Charts
function initCharts() {
    // Hourly Chart
    const hourlyCtx = document.getElementById('hourlyChart').getContext('2d');
    charts.hourly = new Chart(hourlyCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Entradas',
                data: [],
                borderColor: '#4caf50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4
            }, {
                label: 'Salidas',
                data: [],
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Entrance/Exit Chart
    const entranceExitCtx = document.getElementById('entranceExitChart').getContext('2d');
    charts.entranceExit = new Chart(entranceExitCtx, {
        type: 'doughnut',
        data: {
            labels: ['Entradas', 'Salidas'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#4caf50', '#ff9800']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Weekly Chart
    const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
    charts.weekly = new Chart(weeklyCtx, {
        type: 'bar',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Accesos',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Faculties Chart
    const facultiesCtx = document.getElementById('facultiesChart').getContext('2d');
    charts.faculties = new Chart(facultiesCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Accesos',
                data: [],
                backgroundColor: '#764ba2'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update metrics
function updateMetrics(data) {
    if (data.todayAccess !== undefined) {
        animateValue('todayAccess', data.todayAccess);
    }
    if (data.currentInside !== undefined) {
        animateValue('currentInside', data.currentInside);
    }
    if (data.lastHourEntrances !== undefined) {
        animateValue('lastHourEntrances', data.lastHourEntrances);
    }
    if (data.lastHourExits !== undefined) {
        animateValue('lastHourExits', data.lastHourExits);
    }
}

// Animate value change
function animateValue(elementId, newValue) {
    const element = document.getElementById(elementId);
    const currentValue = parseInt(element.textContent) || 0;
    const increment = newValue > currentValue ? 1 : -1;
    const duration = 500;
    const steps = Math.abs(newValue - currentValue);
    const stepDuration = duration / steps;

    let current = currentValue;
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        if (current === newValue) {
            clearInterval(timer);
        }
    }, stepDuration);
}

// Update hourly chart
function updateHourlyChart(data) {
    if (!charts.hourly || !data) return;

    charts.hourly.data.labels = data.labels || [];
    charts.hourly.data.datasets[0].data = data.entrances || [];
    charts.hourly.data.datasets[1].data = data.exits || [];
    charts.hourly.update();
}

// Load initial data
async function loadInitialData() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/metrics`);
        const data = await response.json();
        
        if (data.success) {
            updateMetrics(data.metrics);
            updateHourlyChart(data.hourlyData);
            updateEntranceExitChart(data.entranceExitData);
            updateWeeklyChart(data.weeklyData);
            updateFacultiesChart(data.facultiesData);
            loadRecentAccess();
        }
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
    }
}

// Update entrance/exit chart
function updateEntranceExitChart(data) {
    if (!charts.entranceExit || !data) return;
    
    charts.entranceExit.data.datasets[0].data = [data.entrances || 0, data.exits || 0];
    charts.entranceExit.update();
}

// Update weekly chart
function updateWeeklyChart(data) {
    if (!charts.weekly || !data) return;
    
    charts.weekly.data.datasets[0].data = data.values || [0, 0, 0, 0, 0, 0, 0];
    charts.weekly.update();
}

// Update faculties chart
function updateFacultiesChart(data) {
    if (!charts.faculties || !data) return;
    
    charts.faculties.data.labels = data.labels || [];
    charts.faculties.data.datasets[0].data = data.values || [];
    charts.faculties.update();
}

// Load recent access
async function loadRecentAccess() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/recent-access`);
        const data = await response.json();
        
        if (data.success) {
            updateRecentAccessTable(data.access);
        }
    } catch (error) {
        console.error('Error cargando accesos recientes:', error);
    }
}

// Update recent access table
function updateRecentAccessTable(accessList) {
    const tbody = document.getElementById('recentAccessTable');
    
    if (!accessList || accessList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No hay accesos recientes</td></tr>';
        return;
    }

    tbody.innerHTML = accessList.map(access => {
        const fecha = new Date(access.fecha_hora);
        const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const tipo = access.tipo || 'entrada';
        
        return `
            <tr>
                <td>${hora}</td>
                <td>${access.nombre || ''} ${access.apellido || ''}</td>
                <td><span class="status-badge ${tipo}">${tipo.toUpperCase()}</span></td>
                <td>${access.siglas_facultad || 'N/A'}</td>
                <td>${access.puerta || 'N/A'}</td>
                <td>${access.autorizacion_manual ? 'Manual' : 'Automático'}</td>
            </tr>
        `;
    }).join('');
}

// Add recent access (for real-time updates)
function addRecentAccess(access) {
    const tbody = document.getElementById('recentAccessTable');
    const fecha = new Date(access.fecha_hora);
    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const tipo = access.tipo || 'entrada';
    
    const newRow = `
        <tr style="animation: fadeIn 0.5s;">
            <td>${hora}</td>
            <td>${access.nombre || ''} ${access.apellido || ''}</td>
            <td><span class="status-badge ${tipo}">${tipo.toUpperCase()}</span></td>
            <td>${access.siglas_facultad || 'N/A'}</td>
            <td>${access.puerta || 'N/A'}</td>
            <td>${access.autorizacion_manual ? 'Manual' : 'Automático'}</td>
        </tr>
    `;
    
    tbody.insertAdjacentHTML('afterbegin', newRow);
    
    // Keep only last 20 rows
    const rows = tbody.querySelectorAll('tr');
    if (rows.length > 20) {
        rows[rows.length - 1].remove();
    }
}

// Update metrics from new access
function updateMetricsFromAccess(access) {
    // This would be handled by the server via socket events
    // But we can do quick client-side updates here
    const todayAccess = document.getElementById('todayAccess');
    const currentValue = parseInt(todayAccess.textContent) || 0;
    todayAccess.textContent = currentValue + 1;
}

// Filter buttons
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.btn-filter');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const period = btn.dataset.period;
            loadDataForPeriod(period);
        });
    });

    // Refresh button
    document.getElementById('refreshRecent').addEventListener('click', () => {
        loadRecentAccess();
    });
});

// Load data for period
async function loadDataForPeriod(period) {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/metrics?period=${period}`);
        const data = await response.json();
        
        if (data.success && data.hourlyData) {
            updateHourlyChart(data.hourlyData);
        }
    } catch (error) {
        console.error('Error cargando datos del período:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    initSocket();
    loadInitialData();
    
    // Update every 30 seconds as fallback
    setInterval(() => {
        loadInitialData();
    }, 30000);
});

