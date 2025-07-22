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

    /**
     * MÉTHODES SUPPLÉMENTAIRES POUR AMÉLIORER L'INTÉGRATION
     */

    // Graphique en barres horizontales pour les sources (optimisé pour le rapport)
    createSourceChart(canvasId, sourceData, options = {}) {
        if (!sourceData || !Array.isArray(sourceData)) {
            console.error('Données sources invalides');
            return null;
        }

        const labels = sourceData.map(item => item.source);
        const hommesData = sourceData.map(item => item.hommes);
        const femmesData = sourceData.map(item => item.femmes);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Hommes',
                    data: hommesData,
                    backgroundColor: this.colors.secondary,
                    borderColor: this.colors.secondary,
                    borderWidth: 0,
                    borderRadius: 4
                },
                {
                    label: 'Femmes',
                    data: femmesData,
                    backgroundColor: this.colors.primary,
                    borderColor: this.colors.primary,
                    borderWidth: 0,
                    borderRadius: 4
                }
            ]
        };

        const finalOptions = {
            ...options,
            indexAxis: 'y',
            plugins: {
                ...options.plugins,
                title: {
                    display: true,
                    text: options.plugins?.title?.text || 'Participants par source',
                    font: { size: 14, weight: 'bold' },
                    color: '#374151'
                }
            }
        };

        return this.createStackedBar(canvasId, data, finalOptions);
    }

// Méthode pour créer les KPIs visuels (cartes avec graphiques miniatures)
    createKPIChart(canvasId, value, label, type = 'simple') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas non trouvé: ${canvasId}`);
            return null;
        }

        // Redimensionner le canvas pour les KPIs
        canvas.width = 120;
        canvas.height = 60;
        
        this.destroyChart(canvasId);
        const ctx = canvas.getContext('2d');

        let config;
        
        switch (type) {
            case 'gauge':
                // Graphique en forme de jauge pour les pourcentages
                config = {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: [value, 100 - value],
                            backgroundColor: [this.colors.primary, '#E5E7EB'],
                            borderWidth: 0,
                            cutout: '80%'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }
                        },
                        rotation: -90,
                        circumference: 180
                    }
                };
                break;
                
            case 'trend':
                // Mini graphique de tendance (ligne)
                const trendData = Array.isArray(value) ? value : [value * 0.8, value * 0.9, value];
                config = {
                    type: 'line',
                    data: {
                        labels: ['', '', ''],
                        datasets: [{
                            data: trendData,
                            borderColor: this.colors.success,
                            backgroundColor: this.colors.success + '20',
                            borderWidth: 2,
                            pointRadius: 0,
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }
                        },
                        scales: {
                            x: { display: false },
                            y: { display: false }
                        },
                        elements: {
                            point: { radius: 0 }
                        }
                    }
                };
                break;
                
            default:
                // Graphique simple (barre unique)
                config = {
                    type: 'bar',
                    data: {
                        labels: [''],
                        datasets: [{
                            data: [value],
                            backgroundColor: this.colors.primary,
                            borderRadius: 4,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }
                        },
                        scales: {
                            x: { display: false },
                            y: { display: false }
                        }
                    }
                };
        }
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    // Graphique radar pour les comparaisons multidimensionnelles
    createRadarChart(canvasId, labels, datasets, options = {}) {
        if (!labels || !datasets) {
            console.error('Données radar invalides');
            return null;
        }

        this.destroyChart(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas non trouvé: ${canvasId}`);
            return null;
        }
        
        const ctx = canvas.getContext('2d');

        const preparedDatasets = datasets.map((dataset, index) => ({
            ...dataset,
            borderColor: this.colors.chartColors[index % this.colors.chartColors.length],
            backgroundColor: (this.colors.chartColors[index % this.colors.chartColors.length] + '20'),
            borderWidth: 2,
            pointBackgroundColor: this.colors.chartColors[index % this.colors.chartColors.length],
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2,
            pointRadius: 4
        }));
        
        const config = {
            type: 'radar',
            data: {
                labels: labels,
                datasets: preparedDatasets
            },
            options: {
                ...this.defaultConfig,
                scales: {
                    r: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(212, 165, 116, 0.2)'
                        },
                        angleLines: {
                            color: 'rgba(212, 165, 116, 0.3)'
                        },
                        pointLabels: {
                            color: '#374151',
                            font: {
                                size: 11,
                                weight: '500'
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

    // Graphique en aires empilées pour l'évolution temporelle
    createStackedAreaChart(canvasId, data, options = {}) {
        const preparedData = {
            ...data,
            datasets: data.datasets.map((dataset, index) => ({
                ...dataset,
                backgroundColor: this.colors.chartColors[index % this.colors.chartColors.length] + '60',
                borderColor: this.colors.chartColors[index % this.colors.chartColors.length],
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }))
        };

        const stackedOptions = {
            ...options,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        color: 'rgba(212, 165, 116, 0.1)'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(212, 165, 116, 0.1)'
                    }
                }
            },
            plugins: {
                ...this.defaultConfig.plugins,
                ...options.plugins
            }
        };

        return this.createLine(canvasId, preparedData, stackedOptions);
    }

    // Méthode utilitaire pour créer des graphiques à partir de données CSV/Excel
    createFromTableData(canvasId, tableData, config) {
        if (!tableData || !config) {
            console.error('Données ou configuration manquantes');
            return null;
        }

        const { type, labelColumn, dataColumns, options = {} } = config;
        
        // Extraction des labels
        const labels = tableData.map(row => row[labelColumn]);
        
        // Création des datasets
        const datasets = dataColumns.map((column, index) => ({
            label: column.label || column.key,
            data: tableData.map(row => parseFloat(row[column.key]) || 0),
            backgroundColor: column.color || this.colors.chartColors[index % this.colors.chartColors.length],
            ...column.options
        }));

        const data = { labels, datasets };

        // Sélection du type de graphique
        switch (type) {
            case 'bar':
                return this.createBar(canvasId, data, options);
            case 'line':
                return this.createLine(canvasId, data, options);
            case 'doughnut':
                return this.createDoughnut(canvasId, data, options);
            case 'stackedBar':
                return this.createStackedBar(canvasId, data, options);
            case 'radar':
                return this.createRadarChart(canvasId, labels, datasets, options);
            case 'mixed':
                return this.createMixedChart(canvasId, tableData, options.showTop || 10);
            default:
                console.error(`Type de graphique non supporté: ${type}`);
                return null;
        }
    }

    // Méthode pour créer des graphiques avec animations personnalisées
    createAnimatedChart(canvasId, type, data, animationType = 'default') {
        const animations = {
            default: {
                duration: 1000,
                easing: 'easeInOutCubic'
            },
            bounce: {
                duration: 1500,
                easing: 'easeOutBounce'
            },
            elastic: {
                duration: 2000,
                easing: 'easeOutElastic'
            },
            slide: {
                duration: 1200,
                easing: 'easeInOutQuart',
                onProgress: function(animation) {
                    const progress = animation.currentStep / animation.numSteps;
                    this.chart.data.datasets.forEach((dataset, i) => {
                        dataset.data = dataset.data.map((value, index) => value * progress);
                    });
                }
            }
        };

        const options = {
            animation: animations[animationType] || animations.default,
            plugins: {
                ...this.defaultConfig.plugins,
                tooltip: {
                    ...this.defaultConfig.plugins.tooltip,
                    animation: {
                        duration: 200
                    }
                }
            }
        };

        switch (type) {
            case 'bar':
                return this.createBar(canvasId, data, options);
            case 'line':
                return this.createLine(canvasId, data, options);
            case 'doughnut':
                return this.createDoughnut(canvasId, data, options);
            default:
                return this.createBar(canvasId, data, options);
        }
    }

    // Méthode pour exporter un graphique en image
    exportChart(chartId, format = 'png', quality = 0.9) {
        const chart = this.charts[chartId];
        if (!chart) {
            console.error(`Graphique non trouvé: ${chartId}`);
            return null;
        }

        try {
            const url = chart.toBase64Image(format, quality);
            
            // Créer un lien de téléchargement
            const link = document.createElement('a');
            link.download = `chart-${chartId}-${Date.now()}.${format}`;
            link.href = url;
            
            // Déclencher le téléchargement
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return url;
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            return null;
        }
    }

    // Méthode pour redimensionner tous les graphiques
    resizeAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    // Méthode pour mettre à jour les données d'un graphique existant
    updateChartData(chartId, newData, animate = true) {
        const chart = this.charts[chartId];
        if (!chart) {
            console.error(`Graphique non trouvé: ${chartId}`);
            return false;
        }

        try {
            // Mise à jour des labels si fournis
            if (newData.labels) {
                chart.data.labels = newData.labels;
            }

            // Mise à jour des datasets
            if (newData.datasets) {
                chart.data.datasets = newData.datasets;
            }

            // Actualiser le graphique
            if (animate) {
                chart.update('active');
            } else {
                chart.update('none');
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            return false;
        }
    }

    // Méthode pour obtenir des statistiques sur les graphiques actifs
    getChartsInfo() {
        const info = {
            total: Object.keys(this.charts).length,
            types: {},
            canvasIds: Object.keys(this.charts)
        };

        Object.values(this.charts).forEach(chart => {
            const type = chart.config.type;
            info.types[type] = (info.types[type] || 0) + 1;
        });

        return info;
    }

    // Méthode de débogage pour afficher l'état de tous les graphiques
    debugCharts() {
        console.group('État des graphiques ChartManager');
        console.log('Nombre total de graphiques:', Object.keys(this.charts).length);
        
        Object.entries(this.charts).forEach(([id, chart]) => {
            console.log(`${id}:`, {
                type: chart.config.type,
                datasets: chart.data.datasets.length,
                labels: chart.data.labels?.length || 0,
                canvas: chart.canvas.id,
                visible: chart.canvas.style.display !== 'none'
            });
        });
        
        console.groupEnd();
    }
}

// Instance globale du gestionnaire de graphiques
const chartManager = new ChartManager();

// Fonction utilitaire pour initialiser Chart.js avec des configurations globales
function initializeChartJS() {
    // Configuration globale de Chart.js
    Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#374151';
    
    // Enregistrement des composants Chart.js nécessaires
    Chart.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        BarElement,
        Title,
        Tooltip,
        Legend,
        ArcElement,
        RadialLinearScale
    );
    
    console.log('Chart.js initialisé avec la configuration PROCASEF');
}

// Auto-initialisation si Chart.js est disponible
if (typeof Chart !== 'undefined') {
    initializeChartJS();
}

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChartManager, chartManager };
}

// Export pour utilisation en ES6 modules
if (typeof window !== 'undefined') {
    window.ChartManager = ChartManager;
    window.chartManager = chartManager;
}
