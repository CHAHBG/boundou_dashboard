// charts.js - Chart Management with error fixes and optimizations
class ChartManager {
    constructor() {
        this.charts = {};
        
        // PROCASEF color palette (optimized for dark/light themes)
        this.colors = {
            primary: '#D4A574',    // Orange Gold Mat
            secondary: '#1E3A8A',  // Bleu Navy
            accent: '#B8860B',     // Dark Goldenrod
            success: '#10B981',    // Green success
            warning: '#F59E0B',    // Orange warning
            error: '#EF4444',      // Red error
            info: '#3B82F6',       // Blue info
            
            // Extended chart colors
            chartColors: [
                '#D4A574', '#1E3A8A', '#B8860B', '#10B981', '#F59E0B', '#EF4444', 
                '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', 
                '#6366F1', '#14B8A6', '#F472B6', '#A855F7'
            ],
            
            // State-specific colors
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
        
        // Default chart configuration
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
    
    /**
     * Prepares a canvas element for chart rendering
     * @param {string} canvasId - ID of the canvas element
     * @returns {HTMLCanvasElement|null} Canvas element or null if not found
     */
    prepareCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`❌ Canvas '${canvasId}' not found in DOM`);
            return null;
        }

        if (canvas.tagName.toLowerCase() !== 'canvas') {
            console.error(`❌ Element '${canvasId}' is not a canvas`);
            return null;
        }

        if (this.charts[canvasId]) {
            this.destroyChart(canvasId);
        }

        console.log(`✅ Canvas prepared: ${canvasId}`);
        return canvas;
    }
    
    /**
     * Destroys a single chart
     * @param {string} chartId - ID of the chart to destroy
     */
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            try {
                console.log(`🧹 Destroying chart: ${chartId}`);
                this.charts[chartId].destroy();
                delete this.charts[chartId];
                console.log(`✅ Chart ${chartId} destroyed successfully`);
            } catch (error) {
                console.warn(`⚠️ Error destroying chart ${chartId}:`, error);
                delete this.charts[chartId];
            }
        }
    }
    
    /**
     * Destroys all charts
     */
    destroyAll() {
        console.log('🗑️ Destroying all charts...');
        Object.keys(this.charts).forEach(chartId => this.destroyChart(chartId));
        this.charts = {};
        console.log('✅ All charts destroyed');
    }
    
    /**
     * Resizes all charts (fixes resizeAll warning)
     */
    resizeAll() {
        console.log('📏 Resizing all charts...');
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                try {
                    chart.resize();
                } catch (error) {
                    console.warn('⚠️ Error resizing chart:', error);
                }
            }
        });
        console.log('✅ All charts resized');
    }
    
    /**
     * Prepares datasets with appropriate styling based on chart type
     * @param {Array} datasets - Chart datasets
     * @param {string} type - Chart type (bar, line, doughnut, polarArea)
     * @returns {Array} Prepared datasets
     */
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
                case 'polarArea':
                    preparedDataset.backgroundColor = dataset.backgroundColor || this.colors.chartColors.slice(0, dataset.data?.length || 6);
                    preparedDataset.borderColor = dataset.borderColor || '#FFFFFF';
                    preparedDataset.borderWidth = dataset.borderWidth || 3;
                    preparedDataset.hoverBorderWidth = dataset.hoverBorderWidth || 5;
                    break;
            }
            
            return preparedDataset;
        });
    }
    
    /**
     * Creates a bar chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} data - Chart data { labels, datasets }
     * @param {Object} options - Chart options
     * @returns {Chart|null} Created chart instance
     */
    createBar(canvasId, data, options = {}) {
        const canvas = this.prepareCanvas(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
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
                            font: { size: 11, weight: '500' }
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#6B7280',
                            maxRotation: 45,
                            font: { size: 11, weight: '500' }
                        },
                        border: { display: false }
                    }
                },
                ...options
            }
        };
        
        try {
            this.charts[canvasId] = new Chart(ctx, config);
            console.log(`📊 Bar chart ${canvasId} created successfully`);
            return this.charts[canvasId];
        } catch (error) {
            console.error(`❌ Error creating bar chart ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Creates a doughnut chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} data - Chart data { labels, datasets }
     * @param {Object} options - Chart options
     * @returns {Chart|null} Created chart instance
     */
    createDoughnut(canvasId, data, options = {}) {
        const canvas = this.prepareCanvas(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
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
                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                        
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
        
        try {
            this.charts[canvasId] = new Chart(ctx, config);
            console.log(`🍩 Doughnut chart ${canvasId} created successfully`);
            return this.charts[canvasId];
        } catch (error) {
            console.error(`❌ Error creating doughnut chart ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Creates a line chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} data - Chart data { labels, datasets }
     * @param {Object} options - Chart options
     * @returns {Chart|null} Created chart instance
     */
    createLine(canvasId, data, options = {}) {
        const canvas = this.prepareCanvas(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
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
                            font: { size: 11, weight: '500' }
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: {
                            color: 'rgba(212, 165, 116, 0.05)',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#6B7280',
                            font: { size: 11, weight: '500' }
                        },
                        border: { display: false }
                    }
                },
                ...options
            }
        };
        
        try {
            this.charts[canvasId] = new Chart(ctx, config);
            console.log(`📈 Line chart ${canvasId} created successfully`);
            return this.charts[canvasId];
        } catch (error) {
            console.error(`❌ Error creating line chart ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Creates a stacked bar chart
     * @param {string} canvasId - Canvas ID
     * @param {Object} data - Chart data { labels, datasets }
     * @param {Object} options - Chart options
     * @returns {Chart|null} Created chart instance
     */
    createStackedBar(canvasId, data, options = {}) {
        const stackedOptions = {
            ...options,
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: {
                        color: '#6B7280',
                        font: { size: 11, weight: '500' }
                    },
                    border: { display: false }
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
                        font: { size: 11, weight: '500' }
                    },
                    border: { display: false }
                }
            }
        };
        
        return this.createBar(canvasId, data, stackedOptions);
    }

    /**
     * Creates a polar area chart (fixed to handle chart config object)
     * @param {string} canvasId - Canvas ID
     * @param {Object} data - Chart data { labels, datasets }
     * @param {Object} options - Chart options
     * @returns {Chart|null} Created chart instance
     */
    createPolarChart(canvasId, data, options = {}) {
        if (!data || !data.labels || !data.datasets) {
            console.error(`❌ Invalid data for polar chart ${canvasId}:`, data);
            return null;
        }

        const canvas = this.prepareCanvas(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
        const preparedData = {
            ...data,
            datasets: this.prepareDatasets(data.datasets, 'polarArea')
        };
        
        const config = {
            type: 'polarArea',
            data: preparedData,
            options: {
                ...this.defaultConfig,
                plugins: {
                    ...this.defaultConfig.plugins,
                    title: {
                        display: true,
                        text: 'Répartition par Région',
                        font: { size: 14, weight: 'bold' },
                        color: '#374151'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(212, 165, 116, 0.2)',
                            lineWidth: 1
                        },
                        pointLabels: {
                            color: '#6B7280',
                            font: { size: 11 }
                        },
                        ticks: {
                            color: '#6B7280',
                            backdropColor: 'transparent'
                        }
                    }
                },
                ...options
            }
        };
        
        try {
            this.charts[canvasId] = new Chart(ctx, config);
            console.log(`🌟 Polar chart ${canvasId} created successfully`);
            return this.charts[canvasId];
        } catch (error) {
            console.error(`❌ Error creating polar chart ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Creates a mixed bar/line chart for commune analysis
     * @param {string} canvasId - Canvas ID
     * @param {Array} communesData - Array of commune data objects
     * @param {number} showTop - Number of top communes to display
     * @returns {Chart|null} Created chart instance
     */
    createMixedChart(canvasId, communesData, showTop = 8) {
        if (!communesData || !Array.isArray(communesData)) {
            console.error(`❌ Invalid communes data for mixed chart ${canvasId}`);
            return null;
        }

        const sortedCommunes = communesData
            .sort((a, b) => (b.total || 0) - (a.total || 0))
            .slice(0, showTop);

        const labels = sortedCommunes.map(item => item.communesenegal || 'Unknown');
        const totals = sortedCommunes.map(item => item.total || 0);
        const femmePercentages = sortedCommunes.map(item => item.femme_pourcentage || 0);

        const canvas = this.prepareCanvas(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'bar',
            data: {
                labels,
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
                        grid: { drawOnChartArea: false },
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
                        grid: { display: false }
                    }
                }
            }
        };
        
        try {
            this.charts[canvasId] = new Chart(ctx, config);
            console.log(`📊 Mixed chart ${canvasId} created successfully`);
            return this.charts[canvasId];
        } catch (error) {
            console.error(`❌ Error creating mixed chart ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Creates a temporal line chart
     * @param {string} canvasId - Canvas ID
     * @param {Array} temporalData - Array of temporal data objects
     * @returns {Chart|null} Created chart instance
     */
    createTemporalChart(canvasId, temporalData) {
        if (!temporalData || !Array.isArray(temporalData)) {
            console.error(`❌ Invalid temporal data for chart ${canvasId}`);
            return null;
        }
    
        const canvas = this.prepareCanvas(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'line',
            data: {
                labels: temporalData.map(d => d.periode || d.date || 'Unknown'),
                datasets: [{
                    label: 'Évolution',
                    data: temporalData.map(d => d.valeur || d.total || 0),
                    borderColor: '#D4A574',
                    backgroundColor: 'rgba(212, 165, 116, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                ...this.defaultConfig,
                plugins: {
                    ...this.defaultConfig.plugins,
                    title: {
                        display: true,
                        text: 'Évolution Temporelle',
                        font: { size: 14, weight: 'bold' },
                        color: '#374151'
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        };
        
        try {
            this.charts[canvasId] = new Chart(ctx, config);
            console.log(`📈 Temporal chart ${canvasId} created successfully`);
            return this.charts[canvasId];
        } catch (error) {
            console.error(`❌ Error creating temporal chart ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Creates a horizontal bar chart for commune state
     * @param {string} canvasId - Canvas ID
     * @param {Array} communes - Array of commune names
     * @param {Array} etats - Array of state values
     * @returns {Chart|null} Created chart instance
     */
    createEtatCommuneBarChart(canvasId, communes, etats) {
        if (!communes || !etats || !Array.isArray(communes) || !Array.isArray(etats) || communes.length !== etats.length) {
            console.error(`❌ Invalid data for commune bar chart ${canvasId}`);
            return null;
        }

        const colors = etats.map(etat => this.colors.stateColors[etat?.toString().trim()] || '#6B7280');

        const canvas = this.prepareCanvas(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'bar',
            data: {
                labels: communes,
                datasets: [{
                    label: "État d'avancement",
                    data: etats.map(() => 1),
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
                    legend: { display: false },
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
                        grid: { display: false },
                        ticks: {
                            color: '#374151',
                            font: { size: 12, weight: '500' },
                            padding: 10
                        },
                        border: { display: false }
                    }
                },
                layout: {
                    padding: { left: 10, right: 20, top: 10, bottom: 10 }
                }
            }
        };
        
        try {
            this.charts[canvasId] = new Chart(ctx, config);
            console.log(`📊 Commune state bar chart ${canvasId} created successfully`);
            return this.charts[canvasId];
        } catch (error) {
            console.error(`❌ Error creating commune state bar chart ${canvasId}:`, error);
            return null;
        }
    }

    /**
     * Creates a doughnut chart for state distribution
     * @param {string} canvasId - Canvas ID
     * @param {Array} labels - Array of state labels
     * @param {Array} data - Array of state values
     * @param {Object} options - Chart options
     * @returns {Chart|null} Created chart instance
     */
    createEtatDonutChart(canvasId, labels, data, options = {}) {
        if (!labels || !data || !Array.isArray(labels) || !Array.isArray(data) || labels.length !== data.length) {
            console.error(`❌ Invalid data for state donut chart ${canvasId}`);
            return null;
        }

        const colors = labels.map((label, index) => 
            this.colors.stateColors[label?.toString().trim()] || 
            this.colors.chartColors[index % this.colors.chartColors.length]
        );
        
        const canvas = this.prepareCanvas(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
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
                layout: { padding: 20 },
                ...options
            }
        };
        
        try {
            this.charts[canvasId] = new Chart(ctx, config);
            console.log(`🍩 State donut chart ${canvasId} created successfully`);
            return this.charts[canvasId];
        } catch (error) {
            console.error(`❌ Error creating state donut chart ${canvasId}:`, error);
            return null;
        }
    }

    /**
     * Creates a doughnut chart for topo types (Champs/Bâtis)
     * @param {string} canvasId - Canvas ID
     * @param {Object} stats - Stats object { champs, batis }
     * @returns {Chart|null} Created chart instance
     */
    createTopoTypeDonutChart(canvasId, stats) {
        if (!stats || (!stats.champs && !stats.batis)) {
            console.warn(`⚠️ No data for topo donut chart ${canvasId}`);
            return null;
        }

        const canvas = this.prepareCanvas(canvasId);
        if (!canvas) return null;

        const ctx = canvas.getContext('2d');
        const data = {
            labels: ['Champs', 'Bâtis'],
            datasets: [{
                data: [stats.champs || 0, stats.batis || 0],
                backgroundColor: [this.colors.success, this.colors.primary],
                borderColor: '#FFFFFF',
                borderWidth: 3,
                hoverBorderWidth: 5
            }]
        };

        const config = {
            type: 'doughnut',
            data,
            options: { 
                ...this.defaultConfig, 
                cutout: '65%',
                plugins: {
                    ...this.defaultConfig.plugins,
                    title: {
                        display: true,
                        text: 'Répartition Champs/Bâtis',
                        font: { size: 14, weight: 'bold' },
                        color: '#374151'
                    }
                }
            }
        };

        try {
            this.charts[canvasId] = new Chart(ctx, config);
            console.log(`🍩 Topo donut chart ${canvasId} created successfully`);
            return this.charts[canvasId];
        } catch (error) {
            console.error(`❌ Error creating topo donut chart ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Gets a single color from the chart palette
     * @param {number} index - Color index
     * @returns {string} Color
     */
    getColor(index) {
        return this.colors.chartColors[index % this.colors.chartColors.length];
    }
    
    /**
     * Gets multiple colors from the chart palette
     * @param {number} count - Number of colors
     * @returns {Array} Array of colors
     */
    getColors(count) {
        return Array.from({ length: count }, (_, i) => this.getColor(i));
    }
    
    /**
     * Gets a state-specific color
     * @param {string} state - State name
     * @returns {string} Color
     */
    getStateColor(state) {
        const stateClean = state?.toString().trim();
        return this.colors.stateColors[stateClean] || '#6B7280';
    }
    
    /**
     * Resizes a single chart (for backward compatibility)
     */
    resize() {
        this.resizeAll();
    }
}

// Export for global use
window.ChartManager = ChartManager;

// Create global instance
if (window.chartManager) {
    window.chartManager.destroyAll();
}
window.chartManager = new ChartManager();

console.log('🚀 Optimized ChartManager created and available globally');

// Automatic resize handling
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.chartManager) {
            window.chartManager.resizeAll();
        }
    }, 150);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.chartManager) {
        window.chartManager.destroyAll();
    }
});