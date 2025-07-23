// charts.js - Chart Management avec palette PROCASEF améliorée
class ChartManager {
    constructor() {
        this.charts = {};
        
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
    
    // Destruction propre de tous les graphiques
    destroyAll() {
        Object.keys(this.charts).forEach(chartId => {
            if (this.charts[chartId]) {
                this.charts[chartId].destroy();
                delete this.charts[chartId];
            }
        });
        console.log('Tous les graphiques ont été détruits');
    }
    
    // Destruction d'un graphique spécifique
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
            console.log(`Graphique ${chartId} détruit`);
        }
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
    
    // Wrapper amélioré pour créer un graphique en barres
    createBar(canvasId, data, options = {}) {
        this.destroyChart(canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas non trouvé: ${canvasId}`);
            return null;
        }
        
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
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }
    
    // Wrapper amélioré pour créer un graphique en doughnut
    createDoughnut(canvasId, data, options = {}) {
        this.destroyChart(canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas non trouvé: ${canvasId}`);
            return null;
        }
        
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
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }
    
    // Wrapper amélioré pour créer un graphique en ligne
    createLine(canvasId, data, options = {}) {
        this.destroyChart(canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas non trouvé: ${canvasId}`);
            return null;
        }
        
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
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
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
    createEtatCommuneBarChart(canvasId, communes, etats) {
        if (!communes || !etats || communes.length !== etats.length) {
            console.error('Données invalides pour createEtatCommuneBarChart');
            return null;
        }

        // Mapping des couleurs par état avec fallback
        const colors = etats.map(etat => {
            const etatClean = etat?.toString().trim();
            return this.colors.stateColors[etatClean] || '#6B7280';
        });

        this.destroyChart(canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas non trouvé: ${canvasId}`);
            return null;
        }
        
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
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    // Graphique en donut optimisé - répartition des états d'avancement
    createEtatDonutChart(canvasId, labels, data, options = {}) {
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
        
        this.destroyChart(canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas non trouvé: ${canvasId}`);
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
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    /**
     * NOUVELLES MÉTHODES POUR LE RAPPORT COMPLET
     */

    // Graphique temporel - Évolution par trimestre
    createTemporalChart(canvasId, temporalData) {
        if (!temporalData || !Array.isArray(temporalData)) {
            console.error('Données temporelles invalides');
            return null;
        }

        const labels = temporalData.map(item => item.periode);
        const hommesData = temporalData.map(item => item.homme);
        const femmesData = temporalData.map(item => item.femme);
        const totalData = temporalData.map(item => item.total);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Hommes',
                    data: hommesData,
                    borderColor: '#1E3A8A',
                    backgroundColor: '#1E3A8A15',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Femmes',
                    data: femmesData,
                    borderColor: '#D4A574',
                    backgroundColor: '#D4A57415',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Total',
                    data: totalData,
                    borderColor: '#10B981',
                    backgroundColor: '#10B98115',
                    tension: 0.4,
                    fill: false
                }
            ]
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: 'Évolution Temporelle par Trimestre',
                    font: { size: 16, weight: 'bold' },
                    color: '#374151'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        };

        return this.createLine(canvasId, data, options);
    }

    // Graphique en barres polaires - Répartition régionale
    createPolarChart(canvasId, regionData) {
        if (!regionData || !Array.isArray(regionData)) {
            console.error('Données régionales invalides');
            return null;
        }

        const data = {
            labels: regionData.map(item => item.nomregion),
            datasets: [{
                label: 'Population Totale',
                data: regionData.map(item => item.total),
                backgroundColor: [
                    'rgba(212, 165, 116, 0.8)',
                    'rgba(30, 58, 138, 0.8)',
                    'rgba(184, 134, 11, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderColor: [
                    '#D4A574',
                    '#1E3A8A',
                    '#B8860B',
                    '#10B981'
                ],
                borderWidth: 2
            }]
        };

        this.destroyChart(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas non trouvé: ${canvasId}`);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'polarArea',
            data: data,
            options: {
                ...this.defaultConfig,
                plugins: {
                    ...this.defaultConfig.plugins,
                    title: {
                        display: true,
                        text: 'Répartition par Région',
                        font: { size: 16, weight: 'bold' },
                        color: '#374151'
                    },
                    tooltip: {
                        ...this.defaultConfig.plugins.tooltip,
                        callbacks: {
                            label: function(context) {
                                const region = regionData[context.dataIndex];
                                return [
                                    `${context.label}: ${context.raw.toLocaleString()}`,
                                    `Hommes: ${region.homme.toLocaleString()} (${region.homme_pourcentage.toFixed(1)}%)`,
                                    `Femmes: ${region.femme.toLocaleString()} (${region.femme_pourcentage.toFixed(1)}%)`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    // Graphique mixte - Barres + Ligne pour analyse complexe
    createMixedChart(canvasId, communesData, showTop = 8) {
        if (!communesData || !Array.isArray(communesData)) {
            console.error('Données communes invalides');
            return null;
        }

        // Trier par population totale et prendre le top
        const sortedCommunes = communesData
            .sort((a, b) => b.total - a.total)
            .slice(0, showTop);

        const labels = sortedCommunes.map(item => item.communesenegal);
        const totals = sortedCommunes.map(item => item.total);
        const femmePercentages = sortedCommunes.map(item => item.femme_pourcentage);

        this.destroyChart(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas non trouvé: ${canvasId}`);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Population Totale',
                        data: totals,
                        backgroundColor: 'rgba(212, 165, 116, 0.7)',
                        borderColor: '#D4A574',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: '% Femmes',
                        data: femmePercentages,
                        borderColor: '#1E3A8A',
                        backgroundColor: 'rgba(30, 58, 138, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        yAxisID: 'y1',
                        pointBackgroundColor: '#1E3A8A',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    }
                ]
            },
            options: {
                ...this.defaultConfig,
                plugins: {
                    ...this.defaultConfig.plugins,
                    title: {
                        display: true,
                        text: 'Population vs % Femmes - Top Communes',
                        font: { size: 16, weight: 'bold' },
                        color: '#374151'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(212, 165, 116, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        },
                        title: {
                            display: true,
                            text: 'Population Totale',
                            color: '#D4A574',
                            font: { weight: 'bold' }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: 35,
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Pourcentage Femmes',
                            color: '#1E3A8A',
                            font: { weight: 'bold' }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    // Graphique Top Topographes (barres horizontales)
createTopoTopographesChart(canvasId, data) {
    if (!data || data.length === 0) {
        console.warn('Aucune donnée pour le graphique des topographes');
        return null;
    }

    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas non trouvé: ${canvasId}`);
        return null;
    }

    const ctx = canvas.getContext('2d');
    const config = {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'Total Parcelles Levées',
                data: data.map(d => d.total),
                backgroundColor: this.colors.primary,
                borderColor: this.colors.primary,
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
                legend: { display: false },
                tooltip: {
                    ...this.defaultConfig.plugins.tooltip,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const dataPoint = data[context.dataIndex];
                            return [
                                `Total: ${context.raw.toLocaleString()} parcelles`,
                                `Champs: ${dataPoint.champs.toLocaleString()}`,
                                `Bâtis: ${dataPoint.batis.toLocaleString()}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(212, 165, 116, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        maxTicksLimit: 10,
                        font: { size: 11 }
                    }
                }
            }
        }
    };

    this.charts[canvasId] = new Chart(ctx, config);
    return this.charts[canvasId];
}

// Graphique Communes Topo (barres empilées)
createTopoCommuneChart(canvasId, data) {
    if (!data || data.length === 0) {
        console.warn('Aucune donnée pour le graphique des communes');
        return null;
    }

    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas non trouvé: ${canvasId}`);
        return null;
    }

    const ctx = canvas.getContext('2d');
    const config = {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [
                {
                    label: 'Champs',
                    data: data.map(d => d.champs),
                    backgroundColor: this.colors.success,
                    borderRadius: 6,
                    borderSkipped: false
                },
                {
                    label: 'Bâtis',
                    data: data.map(d => d.batis),
                    backgroundColor: this.colors.primary,
                    borderRadius: 6,
                    borderSkipped: false
                }
            ]
        },
        options: {
            ...this.defaultConfig,
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: {
                        maxRotation: 45,
                        font: { size: 10 }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(212, 165, 116, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                ...this.defaultConfig.plugins,
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    ...this.defaultConfig.plugins.tooltip,
                    callbacks: {
                        footer: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const commune = data[dataIndex];
                            const total = commune.champs + commune.batis;
                            return `Total: ${total.toLocaleString()} parcelles`;
                        }
                    }
                }
            }
        }
    };

    this.charts[canvasId] = new Chart(ctx, config);
    return this.charts[canvasId];
}

// Graphique Évolution Mensuelle (ligne)
createTopoEvolutionChart(canvasId, data) {
    if (!data || data.length === 0) {
        console.warn('Aucune donnée pour le graphique d\'évolution');
        return null;
    }

    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas non trouvé: ${canvasId}`);
        return null;
    }

    const ctx = canvas.getContext('2d');
    
    // Formater les labels des mois
    const labels = data.map(d => {
        const [year, month] = d.month.split('-');
        const monthNames = [
            'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
            'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    });

    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Champs',
                    data: data.map(d => d.champs),
                    borderColor: this.colors.success,
                    backgroundColor: this.colors.success + '15',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: this.colors.success,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 6
                },
                {
                    label: 'Bâtis',
                    data: data.map(d => d.batis),
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '15',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }
            ]
        },
        options: {
            ...this.defaultConfig,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(212, 165, 116, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(212, 165, 116, 0.05)'
                    }
                }
            },
            plugins: {
                ...this.defaultConfig.plugins,
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    ...this.defaultConfig.plugins.tooltip,
                    callbacks: {
                        footer: function(context) {
                            let total = 0;
                            context.forEach(function(tooltipItem) {
                                total += tooltipItem.raw;
                            });
                            return `Total mensuel: ${total.toLocaleString()} parcelles`;
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    };

    this.charts[canvasId] = new Chart(ctx, config);
    return this.charts[canvasId];
}

// Timeline graphique pour le déroulement des opérations
createTopoTimelineChart(canvasId, timelineData) {
    if (!timelineData || timelineData.length === 0) {
        console.warn('Aucune donnée pour la timeline');
        return null;
    }

    // Pour la timeline, on utilise un graphique en barres avec axe temporel
    this.destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas non trouvé: ${canvasId}`);
        return null;
    }

    const ctx = canvas.getContext('2d');
    
    // Regrouper par date et compter les opérations
    const dateGroups = timelineData.reduce((groups, item) => {
        const date = item.date;
        if (date) {
            if (!groups[date]) {
                groups[date] = { date, count: 0, operations: [] };
            }
            groups[date].count++;
            groups[date].operations.push(item);
        }
        return groups;
    }, {});

    const sortedData = Object.values(dateGroups)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const config = {
        type: 'bar',
        data: {
            labels: sortedData.map(d => new Date(d.date).toLocaleDateString('fr-FR')),
            datasets: [{
                label: 'Nombre d\'opérations',
                data: sortedData.map(d => d.count),
                backgroundColor: this.colors.accent,
                borderColor: this.colors.accent,
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            ...this.defaultConfig,
            plugins: {
                ...this.defaultConfig.plugins,
                legend: { display: false },
                tooltip: {
                    ...this.defaultConfig.plugins.tooltip,
                    callbacks: {
                        title: function(context) {
                            return `Date: ${context[0].label}`;
                        },
                        label: function(context) {
                            const dataPoint = sortedData[context.dataIndex];
                            return `${context.raw} opération(s) enregistrée(s)`;
                        },
                        afterLabel: function(context) {
                            const dataPoint = sortedData[context.dataIndex];
                            return dataPoint.operations
                                .slice(0, 3)
                                .map(op => `• ${op.commune} - ${op.prenom} ${op.nom}`)
                                .concat(dataPoint.operations.length > 3 ? [`... et ${dataPoint.operations.length - 3} autre(s)`] : []);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return Number.isInteger(value) ? value : '';
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45
                    }
                }
            }
        }
    };

    this.charts[canvasId] = new Chart(ctx, config);
    return this.charts[canvasId];
}

createTopoTypeDonutChart(canvasId, stats) {
  // stats = { champs: Number, batis: Number }
  if (!stats || (!stats.champs && !stats.batis)) {
    console.warn('Aucune donnée pour le donut Champs/Bâtis');
    return null;
  }

  this.destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) { console.error(`Canvas non trouvé : ${canvasId}`); return null; }

  const ctx = canvas.getContext('2d');
  const data = {
    labels: ['Champs', 'Bâtis'],
    datasets: [{
      data: [stats.champs, stats.batis],
      backgroundColor: [this.colors.success, this.colors.primary],
      borderColor: '#FFFFFF',
      borderWidth: 3,
      hoverBorderWidth: 5
    }]
  };

  const config = {
    type: 'doughnut',
    data,
    options: { ...this.defaultConfig, cutout: '65%' }
  };

  this.charts[canvasId] = new Chart(ctx, config);
  return this.charts[canvasId];
}
    
    // Utilitaire pour obtenir une couleur de la palette
    getColor(index) {
        return this.colors.chartColors[index % this.colors.chartColors.length];
    }
    
    // Utilitaire pour obtenir plusieurs couleurs
    getColors(count) {
        return Array.from({length: count}, (_, i) => this.getColor(i));
    }
    
    // Utilitaire pour obtenir les couleurs d'états
    getStateColor(state) {
        const stateClean = state?.toString().trim();
        return this.colors.stateColors[stateClean] || '#6B7280';
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

// Création d'une instance globale pour utilisation immédiate
window.chartManager = new ChartManager();

console.log('ChartManager version améliorée créé et disponible globalement');

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
