// Dashboard JavaScript - Enhanced Interactive Features
const API_BASE_URL = window.location.origin;
let socket = null;
let charts = {};
let currentView = 'table';
let sortConfig = { column: null, direction: 'asc' };
let accessData = [];

// Initialize Socket.IO connection
function initSocket() {
    // Intentar conectar con Socket.IO si está disponible
    if (typeof io !== 'undefined') {
        socket = io(API_BASE_URL);

        socket.on('connect', () => {
            console.log('✅ Conectado al servidor');
            updateConnectionStatus('connected', 'Conectado');
            showToast('Conexión establecida', 'success');
        });

        socket.on('disconnect', () => {
            console.log('❌ Desconectado del servidor');
            updateConnectionStatus('disconnected', 'Desconectado');
            showToast('Conexión perdida', 'error');
        });

        socket.on('real-time-metrics', (data) => {
            updateMetrics(data);
            updateLastUpdate();
        });

        socket.on('new-access', (access) => {
            addRecentAccess(access);
            updateMetricsFromAccess(access);
            showToast(`Nuevo acceso: ${access.nombre || 'Usuario'}`, 'success');
        });

        socket.on('hourly-data', (data) => {
            updateHourlyChart(data);
        });
    } else {
        // Si Socket.IO no está disponible, usar polling
        console.log('⚠️ Socket.IO no disponible, usando polling');
        updateConnectionStatus('disconnected', 'Sin WebSocket');
        setInterval(() => {
            loadInitialData();
        }, 10000); // Poll cada 10 segundos
    }
}

// Update connection status
function updateConnectionStatus(status, text) {
    const statusElement = document.getElementById('connectionStatus');
    const dot = statusElement.querySelector('.status-dot');
    const textElement = statusElement.querySelector('.status-text');
    
    dot.className = 'status-dot ' + status;
    if (textElement) {
        textElement.textContent = text;
    }
}

// Update last update time
function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES');
    document.getElementById('lastUpdate').textContent = timeString;
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `
        <span style="font-weight: bold;">${icon}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Show loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
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
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }, {
                label: 'Salidas',
                data: [],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
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
                backgroundColor: ['#10b981', '#f59e0b'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 13 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000
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
                backgroundColor: 'rgba(102, 126, 234, 0.8)',
                borderRadius: 8,
                borderSkipped: false
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
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
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
                backgroundColor: 'rgba(118, 75, 162, 0.8)',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Update metrics with animation
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
    const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const increment = newValue > currentValue ? 1 : -1;
    const duration = 800;
    const steps = Math.abs(newValue - currentValue);
    const stepDuration = duration / Math.max(steps, 1);

    let current = currentValue;
    const timer = setInterval(() => {
        current += increment;
        element.textContent = current.toLocaleString();
        if ((increment > 0 && current >= newValue) || (increment < 0 && current <= newValue)) {
            element.textContent = newValue.toLocaleString();
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
    charts.hourly.update('active');
}

// Load initial data
async function loadInitialData() {
    showLoading();
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/metrics`);
        const data = await response.json();
        
        if (data.success) {
            updateMetrics(data.metrics);
            updateHourlyChart(data.hourlyData);
            updateEntranceExitChart(data.entranceExitData);
            updateWeeklyChart(data.weeklyData);
            updateFacultiesChart(data.facultiesData);
            await loadRecentAccess();
        }
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        showToast('Error cargando datos', 'error');
    } finally {
        hideLoading();
    }
}

// Update entrance/exit chart
function updateEntranceExitChart(data) {
    if (!charts.entranceExit || !data) return;
    
    charts.entranceExit.data.datasets[0].data = [data.entrances || 0, data.exits || 0];
    charts.entranceExit.update('active');
}

// Update weekly chart
function updateWeeklyChart(data) {
    if (!charts.weekly || !data) return;
    
    charts.weekly.data.datasets[0].data = data.values || [0, 0, 0, 0, 0, 0, 0];
    charts.weekly.update('active');
}

// Update faculties chart
function updateFacultiesChart(data) {
    if (!charts.faculties || !data) return;
    
    charts.faculties.data.labels = data.labels || [];
    charts.faculties.data.datasets[0].data = data.values || [];
    charts.faculties.update('active');
}

// Load recent access
async function loadRecentAccess() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/recent-access`);
        const data = await response.json();
        
        if (data.success) {
            accessData = data.access || [];
            updateRecentAccessTable(accessData);
            updateAccessCards(accessData);
        }
    } catch (error) {
        console.error('Error cargando accesos recientes:', error);
        showToast('Error cargando accesos', 'error');
    }
}

// Update recent access table
function updateRecentAccessTable(accessList) {
    const tbody = document.getElementById('recentAccessTable');
    
    if (!accessList || accessList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-state"><span>No hay accesos recientes</span></td></tr>';
        return;
    }

    tbody.innerHTML = accessList.map((access, index) => {
        const fecha = new Date(access.fecha_hora);
        const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const tipo = access.tipo || 'entrada';
        
        return `
            <tr style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
                <td>${hora}</td>
                <td>${access.nombre || ''} ${access.apellido || ''}</td>
                <td><span class="status-badge ${tipo}">${tipo.toUpperCase()}</span></td>
                <td>${access.siglas_facultad || 'N/A'}</td>
                <td>${access.puerta || 'N/A'}</td>
                <td>${access.autorizacion_manual ? '<span class="status-badge">Manual</span>' : 'Automático'}</td>
                <td>
                    <button class="btn-icon-small" onclick="viewDetails('${access._id || index}')" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update access cards
function updateAccessCards(accessList) {
    const container = document.getElementById('accessCardsGrid');
    
    if (!accessList || accessList.length === 0) {
        container.innerHTML = '<div class="loading-state"><span>No hay accesos recientes</span></div>';
        return;
    }

    container.innerHTML = accessList.map((access, index) => {
        const fecha = new Date(access.fecha_hora);
        const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const tipo = access.tipo || 'entrada';
        
        return `
            <div class="access-card" style="animation: fadeIn 0.3s ease ${index * 0.05}s both;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <span class="status-badge ${tipo}">${tipo.toUpperCase()}</span>
                    <span style="color: #6b7280; font-size: 0.85rem;">${hora}</span>
                </div>
                <h3 style="margin-bottom: 10px; font-size: 1.1rem;">${access.nombre || ''} ${access.apellido || ''}</h3>
                <div style="display: flex; flex-direction: column; gap: 8px; color: #6b7280; font-size: 0.9rem;">
                    <div><i class="fas fa-university"></i> ${access.siglas_facultad || 'N/A'}</div>
                    <div><i class="fas fa-door-open"></i> ${access.puerta || 'N/A'}</div>
                    <div><i class="fas fa-info-circle"></i> ${access.autorizacion_manual ? 'Manual' : 'Automático'}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Add recent access (for real-time updates)
function addRecentAccess(access) {
    accessData.unshift(access);
    if (accessData.length > 20) {
        accessData.pop();
    }
    
    if (currentView === 'table') {
        updateRecentAccessTable(accessData);
    } else {
        updateAccessCards(accessData);
    }
}

// Update metrics from new access
function updateMetricsFromAccess(access) {
    const todayAccess = document.getElementById('todayAccess');
    const currentValue = parseInt(todayAccess.textContent.replace(/,/g, '')) || 0;
    todayAccess.textContent = (currentValue + 1).toLocaleString();
}

// View details function
function viewDetails(id) {
    showToast(`Detalles del acceso ${id}`, 'info');
    // Implementar modal de detalles aquí
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = accessData.filter(access => {
            const nombre = `${access.nombre || ''} ${access.apellido || ''}`.toLowerCase();
            const facultad = (access.siglas_facultad || '').toLowerCase();
            const tipo = (access.tipo || '').toLowerCase();
            return nombre.includes(query) || facultad.includes(query) || tipo.includes(query);
        });
        
        if (currentView === 'table') {
            updateRecentAccessTable(filtered);
        } else {
            updateAccessCards(filtered);
        }
    });
}

// Sort functionality
function setupSort() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const column = e.currentTarget.dataset.sort;
            const tbody = document.getElementById('recentAccessTable');
            
            if (sortConfig.column === column) {
                sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
            } else {
                sortConfig.column = column;
                sortConfig.direction = 'asc';
            }
            
            const sorted = [...accessData].sort((a, b) => {
                let aVal, bVal;
                
                switch(column) {
                    case 'hora':
                        aVal = new Date(a.fecha_hora);
                        bVal = new Date(b.fecha_hora);
                        break;
                    case 'nombre':
                        aVal = `${a.nombre || ''} ${a.apellido || ''}`;
                        bVal = `${b.nombre || ''} ${b.apellido || ''}`;
                        break;
                    case 'tipo':
                        aVal = a.tipo || '';
                        bVal = b.tipo || '';
                        break;
                    case 'facultad':
                        aVal = a.siglas_facultad || '';
                        bVal = b.siglas_facultad || '';
                        break;
                    case 'puerta':
                        aVal = a.puerta || '';
                        bVal = b.puerta || '';
                        break;
                    default:
                        return 0;
                }
                
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
            
            updateRecentAccessTable(sorted);
            
            // Update sort icons
            document.querySelectorAll('.sort-btn i').forEach(icon => {
                icon.className = 'fas fa-sort';
            });
            e.currentTarget.querySelector('i').className = 
                sortConfig.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        });
    });
}

// View toggle
function setupViewToggle() {
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-view').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            currentView = e.currentTarget.dataset.view;
            const tableContainer = document.getElementById('tableContainer');
            const cardsContainer = document.getElementById('cardsContainer');
            
            if (currentView === 'table') {
                tableContainer.style.display = 'block';
                cardsContainer.style.display = 'none';
                updateRecentAccessTable(accessData);
            } else {
                tableContainer.style.display = 'none';
                cardsContainer.style.display = 'block';
                updateAccessCards(accessData);
            }
        });
    });
}

// Filter buttons
function setupFilters() {
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const period = btn.dataset.period;
            await loadDataForPeriod(period);
        });
    });
}

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
        showToast('Error cargando datos', 'error');
    }
}

// Sidebar toggle
function setupSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}

// Refresh button
function setupRefresh() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.addEventListener('click', async () => {
        refreshBtn.querySelector('i').classList.add('spinning');
        await loadInitialData();
        setTimeout(() => {
            refreshBtn.querySelector('i').classList.remove('spinning');
        }, 1000);
        showToast('Datos actualizados', 'success');
    });
}

// Fullscreen toggle
function setupFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            fullscreenBtn.querySelector('i').className = 'fas fa-compress';
        } else {
            document.exitFullscreen();
            fullscreenBtn.querySelector('i').className = 'fas fa-expand';
        }
    });
}

// Export chart functions
function setupExportButtons() {
    document.getElementById('exportHourlyChart').addEventListener('click', () => {
        exportChart(charts.hourly, 'accesos-por-hora');
    });
    document.getElementById('exportDonutChart').addEventListener('click', () => {
        exportChart(charts.entranceExit, 'distribucion-entradas-salidas');
    });
    document.getElementById('exportWeeklyChart').addEventListener('click', () => {
        exportChart(charts.weekly, 'accesos-por-semana');
    });
    document.getElementById('exportFacultiesChart').addEventListener('click', () => {
        exportChart(charts.faculties, 'top-facultades');
    });
}

function exportChart(chart, filename) {
    const url = chart.toBase64Image();
    const link = document.createElement('a');
    link.download = `${filename}-${Date.now()}.png`;
    link.href = url;
    link.click();
    showToast('Gráfico exportado', 'success');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    initSocket();
    loadInitialData();
    setupSearch();
    setupSort();
    setupViewToggle();
    setupFilters();
    setupSidebar();
    setupRefresh();
    setupFullscreen();
    setupExportButtons();
    
    // Update every 30 seconds as fallback
    setInterval(() => {
        loadInitialData();
    }, 30000);
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        loadInitialData();
    }
});

