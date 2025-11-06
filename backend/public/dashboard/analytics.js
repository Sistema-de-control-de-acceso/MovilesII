/**
 * Analytics Dashboard JavaScript
 * Carga y visualiza datos de análisis de patrones de flujo
 */

// Charts instances
let timeSeriesChart = null;
let hourlyChart = null;
let dailyChart = null;
let flowDistributionChart = null;
let heatmapChart = null;
let anomaliesChart = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    initializeControls();
    await loadAnalyticsData();
});

/**
 * Initialize control handlers
 */
function initializeControls() {
    const refreshBtn = document.getElementById('refreshBtn');
    const granularitySelect = document.getElementById('granularitySelect');
    const monthsSelect = document.getElementById('monthsSelect');

    refreshBtn.addEventListener('click', async () => {
        await loadAnalyticsData();
    });

    granularitySelect.addEventListener('change', async () => {
        await loadAnalyticsData();
    });

    monthsSelect.addEventListener('change', async () => {
        await loadAnalyticsData();
    });
}

/**
 * Load analytics data from API
 */
async function loadAnalyticsData() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.add('active');

    try {
        const granularity = document.getElementById('granularitySelect').value;
        const months = parseInt(document.getElementById('monthsSelect').value);

        const response = await fetch(`/api/ml/trends/visualize?months=${months}&granularity=${granularity}`);
        
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Update summary cards
        updateSummaryCards(data.summary);
        
        // Render charts
        renderCharts(data.chartData);
        
        // Update recommendations
        updateRecommendations(data.summary.recommendations || []);

    } catch (error) {
        console.error('Error loading analytics data:', error);
        showError('Error cargando datos analíticos: ' + error.message);
    } finally {
        loadingIndicator.classList.remove('active');
    }
}

/**
 * Update summary cards
 */
function updateSummaryCards(summary) {
    if (!summary) return;

    document.getElementById('totalFlow').textContent = 
        summary.overview?.totalFlow?.toLocaleString() || '-';
    
    document.getElementById('trendDirection').textContent = 
        summary.trends?.direction === 'increasing' ? '↗ Creciente' :
        summary.trends?.direction === 'decreasing' ? '↘ Decreciente' : '→ Estable';
    
    document.getElementById('trendStrength').textContent = 
        summary.trends ? `${(summary.trends.strength * 100).toFixed(1)}%` : '-';
    
    document.getElementById('averageFlow').textContent = 
        summary.overview?.averagePerPeriod?.toFixed(0) || '-';
    
    document.getElementById('anomaliesCount').textContent = 
        summary.anomalies?.count || 0;
}

/**
 * Render all charts
 */
function renderCharts(chartData) {
    if (!chartData) return;

    if (chartData.timeSeriesLine) {
        renderTimeSeriesChart(chartData.timeSeriesLine);
    }
    
    if (chartData.hourlyBar) {
        renderHourlyChart(chartData.hourlyBar);
    }
    
    if (chartData.dailyBar) {
        renderDailyChart(chartData.dailyBar);
    }
    
    if (chartData.flowDistribution) {
        renderFlowDistributionChart(chartData.flowDistribution);
    }
    
    if (chartData.anomalies) {
        renderAnomaliesChart(chartData.anomalies);
    }
}

/**
 * Render time series line chart
 */
function renderTimeSeriesChart(data) {
    const ctx = document.getElementById('timeSeriesChart').getContext('2d');
    
    if (timeSeriesChart) {
        timeSeriesChart.destroy();
    }

    timeSeriesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.data.map(d => new Date(d.timestamp).toLocaleString()),
            datasets: [{
                label: 'Flujo de Estudiantes',
                data: data.data.map(d => d.y),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: data.title
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Estudiantes'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Tiempo'
                    }
                }
            }
        }
    });
}

/**
 * Render hourly bar chart
 */
function renderHourlyChart(data) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    
    if (hourlyChart) {
        hourlyChart.destroy();
    }

    hourlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.data.map(d => d.label),
            datasets: [{
                label: 'Promedio',
                data: data.data.map(d => d.average),
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: data.title
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Estudiantes'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Hora del Día'
                    }
                }
            }
        }
    });
}

/**
 * Render daily bar chart
 */
function renderDailyChart(data) {
    const ctx = document.getElementById('dailyChart').getContext('2d');
    
    if (dailyChart) {
        dailyChart.destroy();
    }

    dailyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.data.map(d => d.day),
            datasets: [{
                label: 'Promedio',
                data: data.data.map(d => d.average),
                backgroundColor: '#2ecc71',
                borderColor: '#27ae60',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: data.title
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Estudiantes'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Día de la Semana'
                    }
                }
            }
        }
    });
}

/**
 * Render flow distribution pie chart
 */
function renderFlowDistributionChart(data) {
    const ctx = document.getElementById('flowDistributionChart').getContext('2d');
    
    if (flowDistributionChart) {
        flowDistributionChart.destroy();
    }

    flowDistributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.data.map(d => `${d.label} (${d.percentage}%)`),
            datasets: [{
                data: data.data.map(d => d.value),
                backgroundColor: ['#3498db', '#e74c3c'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: data.title
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Render anomalies scatter chart
 */
function renderAnomaliesChart(data) {
    const ctx = document.getElementById('anomaliesChart').getContext('2d');
    
    if (anomaliesChart) {
        anomaliesChart.destroy();
    }

    if (!data || !data.data || data.data.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillText('No se detectaron anomalías', 10, 10);
        return;
    }

    anomaliesChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Anomalías',
                data: data.data.map(d => ({
                    x: new Date(d.timestamp).getTime(),
                    y: d.y
                })),
                backgroundColor: d => {
                    return d.type === 'high' ? '#e74c3c' : '#f39c12';
                },
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: data.title
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Número de Estudiantes'
                    }
                }
            }
        }
    });
}

/**
 * Update recommendations list
 */
function updateRecommendations(recommendations) {
    const container = document.getElementById('recommendationsList');
    container.innerHTML = '';

    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = '<p>No hay recomendaciones disponibles.</p>';
        return;
    }

    recommendations.forEach(rec => {
        const item = document.createElement('div');
        item.className = `recommendation-item ${rec.priority}-priority`;
        
        item.innerHTML = `
            <div class="recommendation-header">
                <span class="recommendation-type">${rec.type}</span>
                <span class="recommendation-priority ${rec.priority}">${rec.priority}</span>
            </div>
            <p class="recommendation-message">${rec.message}</p>
            <p class="recommendation-action">${rec.action}</p>
        `;
        
        container.appendChild(item);
    });
}

/**
 * Show error message
 */
function showError(message) {
    // Simple error display - could be improved with a toast notification
    alert(message);
}
