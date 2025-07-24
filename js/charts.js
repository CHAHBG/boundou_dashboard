// charts.js - Chart Management avec nettoyage optimisé
class ChartManager {
    constructor() {
        this.charts = new Map(); // Utilisation de Map pour une meilleure gestion
        
        // Palette de couleurs PROCASEF étendue et optimisée
        this.colors = {
            primary: '#D4A574',    // Orange Gold Mat
            secondary: '#1E3A8A',  // Bleu Navy
            accent: '#B8860B',     // Dark Goldenrod
            success: '#10B981',    // Vert succès
            warning: '#F59E0B',    // Orange avertissement
            error: '#EF4444',      // Rouge erreur
            info: '#3B82F6',       // Bleu information
            
            // Palette étendue pour graphiques avec nuances
            chartColors: [
                '#D4A574', '#1E3A8A', '#B8860B', '#10B981', '#F59E0B', '#EF4444', 
                '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', 
                '#6366F1', '#14B8A6', '#F472B6', '#A855F7'
            ],
            
            // Couleurs spécifiques pour les états d'avancement
            stateColors: {
                "Terminé": '#10B981',
                "En cours": '#F59E0B',
                "En cours ": '#F59E0B',
                "Presque terminé": '#3B82F6',
                "pas encore débuté": '#EF4444',
                "Inventaires fonciers à partir du 23 Mai 2025": '#B8860B',
                "Inventaires fonciers à partir du 02 Mai 2025": '#B8860B',
                "Non débuté": '#EF4444',
                "Planifié": '#8B5CF6'
            }
        };
        
        // Configuration par défaut améliorée
        this.defaultConfig = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12,
                            family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                            weight: '500'
                        },
                        color: '#374151'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 58, 138, 0.95)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    cornerRadius: 12,
                    padding: 16,
                    displayColors: true,
                    borderColor: '#D4A574',
                    borderWidth: 1,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 13,
                        weight: '500'
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutCubic'
            }
        };
    }
    
    // Méthode critique - Destruction sécurisée d'un graphique
    destroyChart(chartId) {
        try {
            if (this.charts.has(chartId)) {
                const chart = this.charts.get(chartId);
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                    console.log(`✅ Graphique ${chartId} détruit avec succès`);
                }
                this.charts.delete(chartId);
            }
            
            // Nettoyage supplémentaire du canvas
            const canvas = document.getElementById(chartId);
            if (canvas) {
                // Supprimer les attributs Chart.js du canvas
                canvas.removeAttribute('width');
                canvas.removeAttribute('height');
                canvas.removeAttribute('style');
                
                // Réinitialiser le contexte
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                
                // Supprimer les données Chart.js cachées
                if (canvas.chartjs) {
                    delete canvas.chartjs;
                }
            }
        } catch (error) {
            console.warn(`⚠️ Erreur lors de la destruction du graphique ${chartId}:`, error);
            // Forcer la suppression de la référence même en cas d'erreur
            this.charts.delete(chartId);
        }
    }
    
    // Destruction propre de tous les graphiques
    destroyAll() {
        const chartIds = Array.from(this.charts.keys());
        chartIds.forEach(chartId => {
            this.destroyChart(chartId);
        });
        this.charts.clear();
        console.log('🧹 Tous les graphiques ont été détruits');
    }
    
    // Vérification et préparation du canvas avant création
    prepareCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`❌ Canvas non trouvé: ${canvasId}`);
            return null;
        }
        
        // S'assurer que le canvas est propre
        this.destroyChart(canvasId);
        
        // Attendre un tick pour s'assurer que la destruction est complète
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(canvas);
            }, 10);
        });
    }
    
    // Méthode utilitaire pour préparer les datasets avec couleurs
    prepareDatasets(datasets, type = 'bar') {
        return datasets.map((dataset, index) => {
            const baseColor = this.colors.chartColors[index % this.colors.chartColors.length];
            const preparedDataset = { ...dataset };
            
            switch (type) {
                case 'bar':
                    preparedDataset.backgroundColor = dataset.backgroundColor || baseColor;
                    preparedDataset.borderColor = dataset.borderColor || baseColor;
                    preparedDataset.borderWidth = dataset.borderWidth || 0;
                    preparedDataset.borderRadius = dataset.borderRadius || 6;
                    preparedDataset.borderSkipped = false;
                    break;
                    
                case 'line':
                    preparedDataset.borderColor = dataset.borderColor || baseColor;
                    preparedDataset.backgroundColor = dataset.backgroundColor || (baseColor + '15');
                    preparedDataset.borderWidth = dataset.borderWidth || 3;
                    preparedDataset.tension = dataset.tension || 0.4;
                    preparedDataset.fill = dataset.fill !== undefined ? dataset.fill : true;
                    preparedDataset.pointBackgroundColor = baseColor;
                    preparedDataset.pointBorderColor = '#FFFFFF';
                    preparedDataset.pointBorderWidth = 2;
                    preparedDataset.pointRadius = 6;
                    preparedDataset.pointHoverRadius = 8;
                    break;
                    
                case 'doughnut':
                    preparedDataset.backgroundColor = dataset.backgroundColor || this.colors.chartColors.slice(0, dataset.data?.length || 6);
                    preparedDataset.borderColor = '#FFFFFF';
                    preparedDataset.borderWidth = 3;
                    preparedDataset.hoverBorderWidth = 5;
                    break;
            }
            
            return preparedDataset;
        });
    }
    
    // Wrapper amélioré pour créer un graphique en barres avec gestion d'erreur
    async createBar(canvasId, data, options = {}) {
        try {
            const canvas = await this.prepareCanvas(canvasId);
            if (!canvas) return null;
            
            const ctx = canvas.getContext('2d');
            
            // Préparation des datasets
            const preparedData = {
                ...data,
                datasets: this.prepareDatasets(data.datasets, 'bar')
            };
            
            const config = {
                type: 'bar',
                data: preparedData,
                options: {
                    ...this.defaultConfig,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(212, 165, 116, 0.1)',
                                lineWidth: 1
                            },
                            ticks: {
                                color: '#6B7280',
                                font: {
                                    size: 11,
                                    weight: '500'
                                }
                            },
                            border: {
                                display: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#6B7280',
                                maxRotation: 45,
                                font: {
                                    size: 11,
                                    weight: '500'
                                }
                            },
                            border: {
                                display: false
                            }
                        }
                    },
                    ...options
                }
            };
            
            const chart = new Chart(ctx, config);
            this.charts.set(canvasId, chart);
            console.log(`📊 Graphique en barres ${canvasId} créé avec succès`);
            return chart;
            
        } catch (error) {
            console.error(`❌ Erreur lors de la création du graphique en barres ${canvasId}:`, error);
            return null;
        }
    }
    
    // Wrapper amélioré pour créer un graphique en doughnut
    async createDoughnut(canvasId, data, options = {}) {
        try {
            const canvas = await this.prepareCanvas(canvasId);
            if (!canvas) return null;
            
            const ctx = canvas.getContext('2d');
            
            // Préparation des datasets
            const preparedData = {
                ...data,
                datasets: this.prepareDatasets(data.datasets, 'doughnut')
            };
            
            const config = {
                type: 'doughnut',
                data: preparedData,
                options: {
                    ...this.defaultConfig,
                    cutout: '65%',
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
                                                fillStyle: Array.isArray(dataset.backgroundColor) 
                                                    ? dataset.backgroundColor[i] 
                                                    : dataset.backgroundColor,
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
                        }
                    },
                    ...options
                }
            };
            
            const chart = new Chart(ctx, config);
            this.charts.set(canvasId, chart);
            console.log(`🍩 Graphique en doughnut ${canvasId} créé avec succès`);
            return chart;
            
        } catch (error) {
            console.error(`❌ Erreur lors de la création du graphique en doughnut ${canvasId}:`, error);
            return null;
        }
    }
    
    // Wrapper amélioré pour créer un graphique en ligne
    async createLine(canvasId, data, options = {}) {
        try {
            const canvas = await this.prepareCanvas(canvasId);
            if (!canvas) return null;
            
            const ctx = canvas.getContext('2d');
            
            // Préparation des datasets
            const preparedData = {
                ...data,
                datasets: this.prepareDatasets(data.datasets, 'line')
            };
            
            const config = {
                type: 'line',
                data: preparedData,
                options: {
                    ...this.defaultConfig,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(212, 165, 116, 0.1)',
                                lineWidth: 1
                            },
                            ticks: {
                                color: '#6B7280',
                                font: {
                                    size: 11,
                                    weight: '500'
                                }
                            },
                            border: {
                                display: false
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(212, 165, 116, 0.05)',
                                lineWidth: 1
                            },
                            ticks: {
                                color: '#6B7280',
                                font: {
                                    size: 11,
                                    weight: '500'
                                }
                            },
                            border: {
                                display: false
                            }
                        }
                    },
                    ...options
                }
            };
            
            const chart = new Chart(ctx, config);
            this.charts.set(canvasId, chart);
            console.log(`📈 Graphique en ligne ${canvasId} créé avec succès`);
            return chart;
            
        } catch (error) {
            console.error(`❌ Erreur lors de la création du graphique en ligne ${canvasId}:`, error);
            return null;
        }
    }
    
    // Wrapper pour créer un graphique en barres empilées
    async createStackedBar(canvasId, data, options = {}) {
        const stackedOptions = {
            ...options,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    },
                    border: {
                        display: false
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(212, 165, 116, 0.1)',
                        lineWidth: 1
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    },
                    border: {
                        display: false
                    }
                }
            }
        };
        
        return this.createBar(canvasId, data, stackedOptions);
    }

    // Graphique en barres horizontal optimisé - état d'avancement par commune
    async createEtatCommuneBarChart(canvasId, communes, etats) {
        if (!communes || !etats || communes.length !== etats.length) {
            console.error('Données invalides pour createEtatCommuneBarChart');
            return null;
        }

        // Mapping des couleurs par état avec fallback
        const colors = etats.map(etat => {
            const etatClean = etat?.toString().trim();
            return this.colors.stateColors[etatClean] || '#6B7280';
        });

        try {
            const canvas = await this.prepareCanvas(canvasId);
            if (!canvas) return null;
            
            const ctx = canvas.getContext('2d');
            
            const config = {
                type: 'bar',
                data: {
                    labels: communes,
                    datasets: [{
                        label: "État d'avancement",
                        data: etats.map(() => 1), // Valeur uniforme, la couleur indique l'état
                        backgroundColor: colors,
                        borderWidth: 0,
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    ...this.defaultConfig,
                    indexAxis: 'y',
                    plugins: {
                        ...this.defaultConfig.plugins,
                        legend: { 
                            display: false 
                        },
                        tooltip: {
                            ...this.defaultConfig.plugins.tooltip,
                            callbacks: {
                                title: function(context) {
                                    return context[0].label;
                                },
                                label: function(context) {
                                    return `État: ${etats[context.dataIndex]}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { 
                            display: false,
                            beginAtZero: true,
                            max: 1.2
                        },
                        y: { 
                            beginAtZero: true,
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#374151',
                                font: {
                                    size: 12,
                                    weight: '500'
                                },
                                padding: 10
                            },
                            border: {
                                display: false
                            }
                        }
                    },
                    layout: {
                        padding: {
                            left: 10,
                            right: 20,
                            top: 10,
                            bottom: 10
                        }
                    }
                }
            };
            
            const chart = new Chart(ctx, config);
            this.charts.set(canvasId, chart);
            console.log(`📊 Graphique état commune ${canvasId} créé avec succès`);
            return chart;
            
        } catch (error) {
            console.error(`❌ Erreur lors de la création du graphique état commune ${canvasId}:`, error);
            return null;
        }
    }

    // Graphique en donut optimisé - répartition des états d'avancement
    async createEtatDonutChart(canvasId, labels, data, options = {}) {
        if (!labels || !data || labels.length !== data.length) {
            console.error('Données invalides pour createEtatDonutChart');
            return null;
        }

        // Génération des couleurs basées sur le mapping des états
        const colors = labels.map((label, index) => {
            const labelClean = label?.toString().trim();
            return this.colors.stateColors[labelClean] || 
                   this.colors.chartColors[index % this.colors.chartColors.length];
        });
        
        try {
            const canvas = await this.prepareCanvas(canvasId);
            if (!canvas) return null;
            
            const ctx = canvas.getContext('2d');
            
            const config = {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderColor: '#FFFFFF',
                        borderWidth: 3,
                        hoverBorderWidth: 5,
                        hoverBackgroundColor: colors.map(color => color + 'DD')
                    }]
                },
                options: {
                    ...this.defaultConfig,
                    cutout: '70%',
                    plugins: {
                        ...this.defaultConfig.plugins,
                        legend: {
                            ...this.defaultConfig.plugins.legend,
                            position: 'bottom',
                            labels: {
                                ...this.defaultConfig.plugins.legend.labels,
                                padding: 25,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        const dataset = data.datasets[0];
                                        const total = dataset.data.reduce((sum, val) => sum + val, 0);
                                        
                                        return data.labels.map((label, i) => {
                                            const value = dataset.data[i];
                                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                            
                                            return {
                                                text: `${label}: ${value} (${percentage}%)`,
                                                fillStyle: Array.isArray(dataset.backgroundColor) 
                                                    ? dataset.backgroundColor[i] 
                                                    : dataset.backgroundColor,
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
                                title: function(context) {
                                    return context[0].label;
                                },
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw;
                                    const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                    return `${label}: ${value} communes (${percentage}%)`;
                                }
                            }
                        }
                    },
                    layout: {
                        padding: 20
                    },
                    ...options
                }
            };
            
            const chart = new Chart(ctx, config);
            this.charts.set(canvasId, chart);
            console.log(`🍩 Graphique état donut ${canvasId} créé avec succès`);
            return chart;
            
        } catch (error) {
            console.error(`❌ Erreur lors de la création du graphique état donut ${canvasId}:`, error);
            return null;
        }
    }

    // Méthode de nettoyage pour navigation entre sections
    cleanupForNavigation() {
        console.log('🧹 Nettoyage des graphiques pour navigation...');
        this.destroyAll();
    }
    
    // Redimensionnement pour responsive
    resize() {
        this.charts.forEach((chart, chartId) => {
            try {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            } catch (error) {
                console.warn(`⚠️ Erreur lors du redimensionnement du graphique ${chartId}:`, error);
            }
        });
    }
    
    // Méthodes utilitaires inchangées
    getColor(index) {
        return this.colors.chartColors[index % this.colors.chartColors.length];
    }
    
    getColors(count) {
        return Array.from({length: count}, (_, i) => this.getColor(i));
    }
    
    getStateColor(state) {
        const stateClean = state?.toString().trim();
        return this.colors.stateColors[stateClean] || '#6B7280';
    }
}

// Export pour utilisation globale
window.ChartManager = ChartManager;

// Création d'une instance globale pour utilisation immédiate
if (window.chartManager) {
    window.chartManager.destroyAll();
}
window.chartManager = new ChartManager();

console.log('🚀 ChartManager version corrigée créé et disponible globalement');

// Gestion du redimensionnement automatique optimisée
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.chartManager) {
            window.chartManager.resize();
        }
    }, 150);
});

// Gestion de la destruction automatique lors du changement de page
window.addEventListener('beforeunload', () => {
    if (window.chartManager) {
        window.chartManager.destroyAll();
    }
});

// Gestion de la visibilité de la page
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page cachée - possibilité de nettoyer
        console.log('📱 Page cachée - conservation des graphiques');
    } else {
        // Page visible - redimensionner si nécessaire
        setTimeout(() => {
            if (window.chartManager) {
                window.chartManager.resize();
            }
        }, 100);
    }
});
