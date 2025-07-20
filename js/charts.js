// charts.js - Chart Management with PROCASEF Color Palette
class ChartManager {
    constructor() {
        this.charts = {};
        
        // Palette de couleurs PROCASEF
        this.colors = {
            primary: '#D4A574',    // Orange Gold Mat
            secondary: '#1E3A8A',  // Bleu Navy
            accent: '#B8860B',     // Dark Goldenrod
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            info: '#3B82F6',
            
            // Palette étendue pour les graphiques
            chartColors: [
                '#D4A574', // Orange Gold Mat
                '#1E3A8A', // Bleu Navy
                '#B8860B', // Dark Goldenrod
                '#10B981', // Success Green
                '#F59E0B', // Warning Orange
                '#EF4444', // Error Red
                '#3B82F6', // Info Blue
                '#8B5CF6', // Purple
                '#EC4899', // Pink
                '#06B6D4', // Cyan
                '#84CC16', // Lime
                '#F97316'  // Orange
            ]
        };
        
        // Configuration par défaut pour tous les graphiques
        this.defaultConfig = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: 'Inter, sans-serif'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 58, 138, 0.9)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    cornerRadius: 8,
                    padding: 12
                }
            },
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            }
        };
    }
    
    // Destruction propre de tous les graphiques
    destroyAll() {
        Object.keys(this.charts).forEach(chartId => {
            if (this.charts[chartId]) {
                this.charts[chartId].destroy();
                delete this.charts[chartId];
            }
        });
        console.log('All charts destroyed');
    }
    
    // Destruction d'un graphique spécifique
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
            console.log(`Chart ${chartId} destroyed`);
        }
    }
    
    // Wrapper pour créer un graphique en barres
    createBar(canvasId, data, options = {}) {
        this.destroyChart(canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas not found: ${canvasId}`);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Application des couleurs PROCASEF
        if (data.datasets) {
            data.datasets.forEach((dataset, index) => {
                if (!dataset.backgroundColor) {
                    dataset.backgroundColor = this.colors.chartColors[index % this.colors.chartColors.length];
                }
                if (!dataset.borderColor) {
                    dataset.borderColor = dataset.backgroundColor;
                }
                dataset.borderWidth = dataset.borderWidth || 0;
                dataset.borderRadius = dataset.borderRadius || 4;
                dataset.borderSkipped = false;
            });
        }
        
        const config = {
            type: 'bar',
            data: data,
            options: {
                ...this.defaultConfig,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(212, 165, 116, 0.1)'
                        },
                        ticks: {
                            color: '#6B7280'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280',
                            maxRotation: 45
                        }
                    }
                },
                ...options
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }
    
    // Wrapper pour créer un graphique en doughnut
    createDoughnut(canvasId, data, options = {}) {
        this.destroyChart(canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas not found: ${canvasId}`);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Application des couleurs PROCASEF
        if (data.datasets) {
            data.datasets.forEach((dataset, index) => {
                if (!dataset.backgroundColor) {
                    dataset.backgroundColor = this.colors.chartColors.slice(0, data.labels.length);
                }
                dataset.borderWidth = dataset.borderWidth || 2;
                dataset.borderColor = '#FFFFFF';
                dataset.hoverBorderWidth = 4;
            });
        }
        
        const config = {
            type: 'doughnut',
            data: data,
            options: {
                ...this.defaultConfig,
                cutout: '60%',
                plugins: {
                    ...this.defaultConfig.plugins,
                    legend: {
                        ...this.defaultConfig.plugins.legend,
                        position: 'bottom'
                    }
                },
                ...options
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }
    
    // Wrapper pour créer un graphique en ligne
    createLine(canvasId, data, options = {}) {
        this.destroyChart(canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas not found: ${canvasId}`);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Application des couleurs PROCASEF
        if (data.datasets) {
            data.datasets.forEach((dataset, index) => {
                const color = this.colors.chartColors[index % this.colors.chartColors.length];
                if (!dataset.borderColor) {
                    dataset.borderColor = color;
                }
                if (!dataset.backgroundColor) {
                    dataset.backgroundColor = color + '20'; // 20% opacity
                }
                dataset.borderWidth = dataset.borderWidth || 3;
                dataset.tension = dataset.tension || 0.4;
                dataset.fill = dataset.fill !== undefined ? dataset.fill : true;
                dataset.pointBackgroundColor = color;
                dataset.pointBorderColor = '#FFFFFF';
                dataset.pointBorderWidth = 2;
                dataset.pointRadius = 5;
                dataset.pointHoverRadius = 7;
            });
        }
        
        const config = {
            type: 'line',
            data: data,
            options: {
                ...this.defaultConfig,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(212, 165, 116, 0.1)'
                        },
                        ticks: {
                            color: '#6B7280'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(212, 165, 116, 0.05)'
                        },
                        ticks: {
                            color: '#6B7280'
                        }
                    }
                },
                ...options
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }
    
    // Wrapper pour créer un graphique en barres horizontales
    createHorizontalBar(canvasId, data, options = {}) {
        const horizontalOptions = {
            ...options,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(212, 165, 116, 0.1)'
                    },
                    ticks: {
                        color: '#6B7280'
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6B7280'
                    }
                }
            }
        };
        
        return this.createBar(canvasId, data, horizontalOptions);
    }
    
    // Wrapper pour créer un graphique en barres empilées
    createStackedBar(canvasId, data, options = {}) {
        const stackedOptions = {
            ...options,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6B7280'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(212, 165, 116, 0.1)'
                    },
                    ticks: {
                        color: '#6B7280'
                    }
                }
            }
        };
        
        return this.createBar(canvasId, data, stackedOptions);
    }

    /**
     * Bar chart horizontal - état d'avancement par commune (avec couleurs par état)
     */
    createEtatCommuneBarChart(canvasId, communes, etats) {
        const colorMap = {
            "Terminé": this.colors.success,
            "En cours ": this.colors.warning,
            "En cours": this.colors.warning,
            "Presque terminé": this.colors.info,
            "pas encore débuté": this.colors.error,
            "Inventaires fonciers à partir du 23 Mai 2025": this.colors.accent,
            "Inventaires fonciers à partir du 02 Mai 2025": this.colors.accent
        };
        const colors = etats.map(e => colorMap[e.trim()] || "#6B7280");

        this.destroyChart(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas not found: ${canvasId}`);
            return null;
        }
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'bar',
            data: {
                labels: communes,
                datasets: [{
                    label: "État d'avancement",
                    data: etats.map(() => 1), // chaque barre a la même valeur, couleur dépend de l'état
                    backgroundColor: colors,
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                ...this.defaultConfig,
                indexAxis: 'y',
                plugins: {
                    ...this.defaultConfig.plugins,
                    legend: { display: false },
                    tooltip: {
                        ...this.defaultConfig.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                // Affiche l'état d'avancement au survol
                                return etats[context.dataIndex];
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        display: false,
                        beginAtZero: true
                    },
                    y: { 
                        beginAtZero: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#6B7280'
                        }
                    }
                }
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    /**
     * Donut chart - répartition des états d'avancement
     * Enhanced version with better error handling, consistent styling, and color mapping
     */
    createEtatDonutChart(canvasId, labels, data, options = {}) {
        // Color mapping for different progress states
        const stateColorMap = {
            "Terminé": this.colors.success,
            "En cours": this.colors.warning,
            "En cours ": this.colors.warning,
            "Presque terminé": this.colors.info,
            "pas encore débuté": this.colors.error,
            "Inventaires fonciers à partir du 23 Mai 2025": this.colors.accent,
            "Inventaires fonciers à partir du 02 Mai 2025": this.colors.accent
        };
        
        // Generate colors based on labels, with fallback to default chart colors
        const colors = labels.map((label, index) => {
            return stateColorMap[label.trim()] || this.colors.chartColors[index % this.colors.chartColors.length];
        });
        
        this.destroyChart(canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas not found: ${canvasId}`);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: '#FFFFFF',
                    borderWidth: 2,
                    hoverBorderWidth: 4
                }]
            },
            options: {
                ...this.defaultConfig,
                cutout: '60%',
                plugins: {
                    ...this.defaultConfig.plugins,
                    legend: {
                        ...this.defaultConfig.plugins.legend,
                        position: 'bottom',
                        labels: {
                            ...this.defaultConfig.plugins.legend.labels,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const dataset = data.datasets[0];
                                        const value = dataset.data[i];
                                        const total = dataset.data.reduce((sum, val) => sum + val, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        
                                        return {
                                            text: `${label} (${percentage}%)`,
                                            fillStyle: dataset.backgroundColor[i],
                                            strokeStyle: dataset.borderColor,
                                            lineWidth: dataset.borderWidth,
                                            hidden: isNaN(value) || value === 0,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        ...this.defaultConfig.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                ...options
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }
    
    // Wrapper pour créer un graphique en aires
    createArea(canvasId, data, options = {}) {
        // Forcer le fill pour les aires
        if (data.datasets) {
            data.datasets.forEach(dataset => {
                dataset.fill = true;
            });
        }
        
        return this.createLine(canvasId, data, options);
    }
    
    // Utilitaire pour obtenir une couleur de la palette
    getColor(index) {
        return this.colors.chartColors[index % this.colors.chartColors.length];
    }
    
    // Utilitaire pour obtenir plusieurs couleurs
    getColors(count) {
        return Array.from({length: count}, (_, i) => this.getColor(i));
    }
    
    // Redimensionnement pour responsive
    resize() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
}

// Export pour utilisation globale
window.ChartManager = ChartManager;

// Gestion du redimensionnement automatique
window.addEventListener('resize', () => {
    if (window.chartManager) {
        window.chartManager.resize();
    }
});
