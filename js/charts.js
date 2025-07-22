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
                '#F97316', // Orange
                '#6366F1', // Indigo
                '#14B8A6', // Teal
                '#F472B6', // Hot Pink
                '#A855F7'  // Violet
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
    
    // Wrapper pour créer un graphique en barres horizontales
    createHorizontalBar(canvasId, data, options = {}) {
        const horizontalOptions = {
            ...options,
            indexAxis: 'y',
            scales: {
                x: {
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
                y: {
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

    /**
     * Graphique en barres horizontal optimisé - état d'avancement par commune
     * Version améliorée avec gestion d'erreurs et meilleur rendu visuel
     */
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

    /**
     * Graphique en donut optimisé - répartition des états d'avancement
     * Version améliorée avec légendes personnalisées et couleurs mappées
     */
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
                    hoverBackgroundColor: colors.map(color => color + 'DD') // Légère transparence au survol
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
    
    // Wrapper pour créer un graphique en aires
    createArea(canvasId, data, options = {}) {
        // Forcer le fill pour les aires
        const areaData = {
            ...data,
            datasets: data.datasets.map(dataset => ({
                ...dataset,
                fill: true
            }))
        };
        
        return this.createLine(canvasId, areaData, options);
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
    
    // Méthode pour mettre à jour les données d'un graphique existant
    updateChartData(chartId, newData) {
        if (this.charts[chartId]) {
            this.charts[chartId].data = newData;
            this.charts[chartId].update('active');
        }
    }
    
    // Méthode pour ajouter des données à un graphique existant
    addDataPoint(chartId, label, data) {
        if (this.charts[chartId]) {
            this.charts[chartId].data.labels.push(label);
            this.charts[chartId].data.datasets.forEach((dataset, index) => {
                dataset.data.push(data[index] || 0);
            });
            this.charts[chartId].update();
        }
    }
    
    // Méthode pour supprimer des données d'un graphique
    removeDataPoint(chartId, index) {
        if (this.charts[chartId] && this.charts[chartId].data.labels[index] !== undefined) {
            this.charts[chartId].data.labels.splice(index, 1);
            this.charts[chartId].data.datasets.forEach(dataset => {
                dataset.data.splice(index, 1);
            });
            this.charts[chartId].update();
        }
    }
    
    // Méthode pour exporter un graphique en image
    exportChart(chartId, format = 'png') {
        if (this.charts[chartId]) {
            const canvas = this.charts[chartId].canvas;
            return canvas.toDataURL(`image/${format}`);
        }
        return null;
    }


 // Méthode pour obtenir les statistiques d'un graphique
    getChartStats(chartId) {
        if (!this.charts[chartId]) return null;
        
        const chart = this.charts[chartId];
        const datasets = chart.data.datasets;
        
        const stats = {
            totalDatasets: datasets.length,
            totalDataPoints: datasets.reduce((sum, dataset) => sum + dataset.data.length, 0),
            labels: chart.data.labels,
            datasets: datasets.map(dataset => ({
                label: dataset.label,
                dataCount: dataset.data.length,
                sum: dataset.data.reduce((a, b) => a + (b || 0), 0),
                average: dataset.data.reduce((a, b) => a + (b || 0), 0) / dataset.data.length,
                min: Math.min(...dataset.data.filter(v => v !== null && v !== undefined)),
                max: Math.max(...dataset.data.filter(v => v !== null && v !== undefined))
            }))
        };
        
        return stats;
    }

    /**
     * NOUVEAUX GRAPHIQUES SPÉCIALISÉS POUR LES DONNÉES DÉMOGRAPHIQUES
     */

    /**
     * Graphique en barres groupées - Comparaison Hommes/Femmes par commune
     */
    createGenderComparisonChart(canvasId, communesData) {
        if (!communesData || !Array.isArray(communesData)) {
            console.error('Données communes invalides');
            return null;
        }

        const labels = communesData.map(item => item.communesenegal);
        const hommesData = communesData.map(item => item.homme);
        const femmesData = communesData.map(item => item.femme);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Hommes',
                    data: hommesData,
                    backgroundColor: '#1E3A8A', // Bleu navy
                    borderColor: '#1E3A8A',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Femmes',
                    data: femmesData,
                    backgroundColor: '#D4A574', // Orange gold
                    borderColor: '#D4A574',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: 'Répartition Hommes/Femmes par Commune',
                    font: { size: 16, weight: 'bold' },
                    color: '#374151',
                    padding: { bottom: 30 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const commune = communesData[context.dataIndex];
                            const percentage = context.datasetIndex === 0 
                                ? commune.homme_pourcentage.toFixed(1) 
                                : commune.femme_pourcentage.toFixed(1);
                            return `${context.dataset.label}: ${context.raw.toLocaleString()} (${percentage}%)`;
                        }
                    }
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

        return this.createBar(canvasId, data, options);
    }

    /**
     * Graphique en barres empilées 100% - Pourcentages Hommes/Femmes
     */
    createGenderPercentageChart(canvasId, communesData) {
        if (!communesData || !Array.isArray(communesData)) {
            console.error('Données communes invalides');
            return null;
        }

        const labels = communesData.map(item => item.communesenegal);
        const hommesPercentage = communesData.map(item => item.homme_pourcentage);
        const femmesPercentage = communesData.map(item => item.femme_pourcentage);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Hommes (%)',
                    data: hommesPercentage,
                    backgroundColor: '#1E3A8A',
                    borderWidth: 0
                },
                {
                    label: 'Femmes (%)',
                    data: femmesPercentage,
                    backgroundColor: '#D4A574',
                    borderWidth: 0
                }
            ]
        };

        const options = {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Pourcentage de Répartition par Genre',
                    font: { size: 16, weight: 'bold' },
                    color: '#374151'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: { stacked: true },
                y: { 
                    stacked: true,
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        };

        return this.createBar(canvasId, data, options);
    }

    /**
     * Graphique temporel - Évolution par trimestre
     */
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

    /**
     * Graphique radar - Profil démographique par commune
     */
    createRadarChart(canvasId, communesData, maxCommunes = 6) {
        if (!communesData || !Array.isArray(communesData)) {
            console.error('Données communes invalides');
            return null;
        }

        // Limiter à maxCommunes pour lisibilité
        const selectedCommunes = communesData.slice(0, maxCommunes);
        const labels = selectedCommunes.map(item => item.communesenegal);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Population Totale (normalisée)',
                    data: selectedCommunes.map(item => {
                        const max = Math.max(...communesData.map(c => c.total));
                        return (item.total / max) * 100;
                    }),
                    backgroundColor: 'rgba(212, 165, 116, 0.2)',
                    borderColor: '#D4A574',
                    pointBackgroundColor: '#D4A574',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#D4A574'
                },
                {
                    label: '% Femmes',
                    data: selectedCommunes.map(item => item.femme_pourcentage),
                    backgroundColor: 'rgba(30, 58, 138, 0.2)',
                    borderColor: '#1E3A8A',
                    pointBackgroundColor: '#1E3A8A',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#1E3A8A'
                }
            ]
        };

        this.destroyChart(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas non trouvé: ${canvasId}`);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'radar',
            data: data,
            options: {
                ...this.defaultConfig,
                elements: {
                    line: {
                        borderWidth: 3
                    }
                },
                plugins: {
                    ...this.defaultConfig.plugins,
                    title: {
                        display: true,
                        text: 'Profil Démographique - Top Communes',
                        font: { size: 16, weight: 'bold' },
                        color: '#374151'
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            display: true,
                            color: 'rgba(212, 165, 116, 0.2)'
                        },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: {
                            display: false
                        },
                        grid: {
                            color: 'rgba(212, 165, 116, 0.3)'
                        }
                    }
                }
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
    }

    /**
     * Graphique en aires empilées - Sources Individuel vs Collectif
     */
    createSourcesAreaChart(canvasId, sourcesData, temporalData) {
        if (!sourcesData || !temporalData) {
            console.error('Données sources ou temporelles manquantes');
            return null;
        }

        // Simulation de données temporelles par source (adaptable selon vos données réelles)
        const labels = temporalData.map(item => item.periode);
        
        // Calcul proportionnel basé sur les ratios sources
        const individualRatio = sourcesData[0].total / (sourcesData[0].total + sourcesData[1].total);
        const collectiveRatio = sourcesData[1].total / (sourcesData[0].total + sourcesData[1].total);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Source Individuelle',
                    data: temporalData.map(item => Math.round(item.total * individualRatio)),
                    backgroundColor: '#D4A574',
                    borderColor: '#B8860B',
                    borderWidth: 2,
                    fill: true
                },
                {
                    label: 'Source Collective',
                    data: temporalData.map(item => Math.round(item.total * collectiveRatio)),
                    backgroundColor: '#1E3A8A',
                    borderColor: '#1E40AF',
                    borderWidth: 2,
                    fill: true
                }
            ]
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: 'Évolution des Sources de Données',
                    font: { size: 16, weight: 'bold' },
                    color: '#374151'
                }
            },
            scales: {
                x: { stacked: true },
                y: { 
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        };

        return this.createArea(canvasId, data, options);
    }

    /**
     * Graphique en barres polaires - Répartition régionale
     */
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

    /**
     * Graphique mixte - Barres + Ligne pour analyse complexe
     */
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
     * Graphique en gauge/doughnut amélioré avec indicateurs
     */
    createGaugeChart(canvasId, percentage, title, target = null) {
        const data = {
            labels: ['Complété', 'Restant'],
            datasets: [{
                data: [percentage, 100 - percentage],
                backgroundColor: [
                    percentage >= 80 ? '#10B981' : 
                    percentage >= 60 ? '#F59E0B' : 
                    percentage >= 40 ? '#3B82F6' : '#EF4444',
                    '#E5E7EB'
                ],
                borderWidth: 0,
                cutout: '80%'
            }]
        };

        const centerTextPlugin = {
            id: 'centerText',
            beforeDatasetsDraw(chart) {
                const { ctx, chartArea: { top, width, height } } = chart;
                ctx.save();
                
                const centerX = width / 2;
                const centerY = top + height / 2;
                
                // Percentage principal
                ctx.font = 'bold 32px Inter';
                ctx.fillStyle = '#374151';
                ctx.textAlign = 'center';
                ctx.fillText(`${percentage}%`, centerX, centerY - 10);
                
                // Titre
                ctx.font = '14px Inter';
                ctx.fillStyle = '#6B7280';
                ctx.fillText(title || 'Progression', centerX, centerY + 20);
                
                // Target si fourni
                if (target) {
                    ctx.font = '12px Inter';
                    ctx.fillStyle = '#9CA3AF';
                    ctx.fillText(`Objectif: ${target}%`, centerX, centerY + 40);
                }
                
                ctx.restore();
            }
        };

        this.destroyChart(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas non trouvé: ${canvasId}`);
            return null;
        }
        
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'doughnut',
            data: data,
            options: {
                ...this.defaultConfig,
                plugins: {
                    ...this.defaultConfig.plugins,
                    legend: { display: false }
                },
                rotation: -90,
                circumference: 180
            },
            plugins: [centerTextPlugin]
        };
        
        this.charts[canvasId] = new Chart(ctx, config);
        return this.charts[canvasId];
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
    }, 150); // Debounce pour éviter trop d'appels
});

// Gestion de la destruction automatique lors du changement de page
window.addEventListener('beforeunload', () => {
    if (window.chartManager) {
        window.chartManager.destroyAll();
    }
});
