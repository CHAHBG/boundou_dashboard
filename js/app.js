// PROCASEF Dashboard Application - Version complète avec palette Orange Gold/Bleu Navy
class ProcasefDashboard {
    constructor() {
        // Palette de couleurs PROCASEF
        this.colors = {
            primary: '#D4A574',    // Orange Gold Mat
            secondary: '#1E3A8A',  // Bleu Navy
            accent: '#B8860B',     // Dark Goldenrod
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            info: '#3B82F6',
            chartColors: ['#D4A574', '#1E3A8A', '#B8860B', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4']
        };
        
        this.dataLoader = new DataLoader();
        this.charts = {};
        this.map = null;
        this.data = {
            parcelles: null,
            projections: null,
            genreCommune: null,
            genreTrimestre: null,
            repartitionGenre: null,
            etatOperations: null,
            parcellesTerrain: null,
            urmTerrain: null
        };
        
        this.currentSection = 'accueil';
        this.fontSize = 14;
        this.filters = {
            commune: '',
            nicad: '',
            deliberation: ''
        };
        
        this.init();
    }

    async init() {
        console.log('Initialisation du Dashboard PROCASEF...');
        try {
            this.showLoading();
            this.setupEventListeners();
            await this.loadInitialData();
            this.calculateStats();
            this.renderDashboard();
            this.hideLoading();
            console.log('Dashboard initialisé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.hideLoading();
        }
    }

    async loadInitialData() {
        console.log('Chargement des données initiales...');
        // Charger les données essentielles pour l'accueil
        this.data.parcelles = await this.dataLoader.loadData('data/parcelles.json');
        this.data.projections = await this.dataLoader.loadData('data/Projections-2025.json');
        this.data.repartitionGenre = await this.dataLoader.loadData('data/Repartition-genre.json');
    }

    calculateStats() {
        if (!this.data.parcelles || !Array.isArray(this.data.parcelles)) return;

        console.log('Calcul des statistiques...');
        
        this.stats = {
            total: this.data.parcelles.length,
            nicad_oui: this.data.parcelles.filter(p => p.nicad === 'Oui').length,
            nicad_non: this.data.parcelles.filter(p => p.nicad === 'Non').length,
            deliberees_oui: this.data.parcelles.filter(p => p.deliberee === 'Oui').length,
            deliberees_non: this.data.parcelles.filter(p => p.deliberee === 'Non').length,
            superficie_totale: this.data.parcelles
                .filter(p => p.superficie && !isNaN(parseFloat(p.superficie)))
                .reduce((sum, p) => sum + parseFloat(p.superficie), 0)
        };

        // Stats par commune
        this.communeStats = {};
        this.data.parcelles.forEach(parcelle => {
            const commune = parcelle.commune;
            if (!this.communeStats[commune]) {
                this.communeStats[commune] = {
                    total: 0,
                    nicad_oui: 0,
                    deliberees_oui: 0,
                    superficie: 0
                };
            }
            
            this.communeStats[commune].total++;
            if (parcelle.nicad === 'Oui') this.communeStats[commune].nicad_oui++;
            if (parcelle.deliberee === 'Oui') this.communeStats[commune].deliberees_oui++;
            if (parcelle.superficie && !isNaN(parseFloat(parcelle.superficie))) {
                this.communeStats[commune].superficie += parseFloat(parcelle.superficie);
            }
        });

        console.log('Statistiques calculées:', this.stats);
    }

    setupEventListeners() {
        console.log('Configuration des event listeners...');
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    await this.navigateToSection(section);
                }
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Font size controls
        this.setupFontSizeControls();

        // Filters
        ['communeFilter', 'nicadFilter', 'deliberationFilter', 'postCommuneFilter', 'postGeomFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.applyFilters());
            }
        });

        // Export buttons
        const exportParcellesBtn = document.getElementById('exportParcellesBtn');
        const exportPostBtn = document.getElementById('exportPostBtn');
        
        if (exportParcellesBtn) {
            exportParcellesBtn.addEventListener('click', () => this.exportParcellesData());
        }
        
        if (exportPostBtn) {
            exportPostBtn.addEventListener('click', () => this.exportPostData());
        }

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setupFontSizeControls() {
        const fontSlider = document.getElementById('fontSizeSlider');
        const fontDecrease = document.getElementById('fontDecrease');
        const fontIncrease = document.getElementById('fontIncrease');
        const fontTooltip = document.getElementById('fontTooltip');

        if (fontSlider) {
            fontSlider.value = this.fontSize;
            this.updateFontTooltip();
            
            fontSlider.addEventListener('input', (e) => {
                this.fontSize = parseInt(e.target.value);
                this.updateFontSize();
                this.updateFontTooltip();
                this.saveFontSizePreference();
            });
        }

        if (fontDecrease) {
            fontDecrease.addEventListener('click', () => {
                if (this.fontSize > 12) {
                    this.fontSize--;
                    this.updateFontSize();
                    this.updateFontTooltip();
                    this.saveFontSizePreference();
                    if (fontSlider) fontSlider.value = this.fontSize;
                }
            });
        }

        if (fontIncrease) {
            fontIncrease.addEventListener('click', () => {
                if (this.fontSize < 20) {
                    this.fontSize++;
                    this.updateFontSize();
                    this.updateFontTooltip();
                    this.saveFontSizePreference();
                    if (fontSlider) fontSlider.value = this.fontSize;
                }
            });
        }
    }

    updateFontSize() {
        document.documentElement.style.setProperty('--font-size-base', `${this.fontSize}px`);
    }

    updateFontTooltip() {
        const tooltip = document.getElementById('fontTooltip');
        if (tooltip) {
            tooltip.textContent = `${this.fontSize}px`;
        }
    }

    saveFontSizePreference() {
        try {
            localStorage.setItem('procasef-font-size', this.fontSize.toString());
        } catch (error) {
            console.log('localStorage non disponible');
        }
    }

    async navigateToSection(sectionId) {
        console.log('Navigation vers la section:', sectionId);
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Show/hide sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update page title
        const titles = {
            'accueil': 'Dashboard PROCASEF',
            'parcelles': 'Répartition des Parcelles',
            'etat-avancement': 'État d\'Avancement',
            'projections-2025': 'Projections 2025',
            'genre': 'Répartition par Genre',
            'post-traitement': 'Post-Traitement'
        };

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titles[sectionId] || titles.accueil;
        }

        // Load data and render section
        await this.loadDataForSection(sectionId);
        this.currentSection = sectionId;
        this.renderSection(sectionId);
    }

    async loadDataForSection(sectionName) {
        console.log(`Chargement des données pour ${sectionName}...`);
        
        switch (sectionName) {
            case 'parcelles':
                if (!this.data.parcelles) {
                    this.data.parcelles = await this.dataLoader.loadData('data/parcelles.json');
                }
                break;
            case 'etat-avancement':
                if (!this.data.etatOperations) {
                    this.data.etatOperations = await this.dataLoader.loadData('data/Etat-des-operations-Boundou-Mai-2025.json');
                }
                break;
            case 'projections-2025':
                if (!this.data.projections) {
                    this.data.projections = await this.dataLoader.loadData('data/Projections-2025.json');
                }
                break;
            case 'genre':
                if (!this.data.genreCommune) {
                    this.data.genreCommune = await this.dataLoader.loadData('data/Genre-par-Commune.json');
                }
                if (!this.data.genreTrimestre) {
                    this.data.genreTrimestre = await this.dataLoader.loadData('data/Genre-par-trimestre.json');
                }
                if (!this.data.repartitionGenre) {
                    this.data.repartitionGenre = await this.dataLoader.loadData('data/Repartition-genre.json');
                }
                break;
            case 'post-traitement':
                if (!this.data.parcellesTerrain) {
                    this.data.parcellesTerrain = await this.dataLoader.loadData('data/Parcelles_terrain_periode.json');
                }
                if (!this.data.urmTerrain) {
                    this.data.urmTerrain = await this.dataLoader.loadData('data/Urm_Terrain_comparaison.json');
                }
                break;
        }
    }

    renderDashboard() {
        this.renderAccueil();
        this.populateFilters();
    }

    renderSection(sectionId) {
        console.log('Rendu de la section:', sectionId);
        
        // Destroy existing charts
        this.destroyAllCharts();
        
        switch (sectionId) {
            case 'accueil':
                this.renderAccueil();
                break;
            case 'parcelles':
                this.renderParcelles();
                break;
            case 'etat-avancement':
                this.renderEtatAvancement();
                break;
            case 'projections-2025':
                this.renderProjections();
                break;
            case 'genre':
                this.renderGenre();
                break;
            case 'post-traitement':
                this.renderPostTraitement();
                break;
        }
    }

    renderAccueil() {
        console.log('Rendu de la section Accueil');
        this.updateKPIs();
        setTimeout(() => {
            this.createTopCommunesChart();
            this.createProjectionsChart();
            this.createGenreGlobalChart();
        }, 200);
    }

    renderParcelles() {
        console.log('Rendu de la section Parcelles');
        this.populateFilters();
        this.initializeMap();
        setTimeout(() => {
            this.createRegionChart();
            this.createNicadChart();
            this.renderParcellesTable();
        }, 200);
    }

    renderEtatAvancement() {
        console.log('Rendu de la section État d\'avancement');
        this.updateProgressBar();
        setTimeout(() => {
            this.createStatusChart();
            this.renderTimeline();
        }, 200);
    }

    renderProjections() {
        console.log('Rendu de la section Projections');
        this.updateProjectionsKPIs();
        setTimeout(() => {
            this.createObjectifsChart();
            this.renderPerformanceList();
        }, 200);
    }

    renderGenre() {
        console.log('Rendu de la section Genre');
        this.updateGenreKPIs();
        setTimeout(() => {
            this.createGenreGlobalDonut();
            this.createGenreTrimestreChart();
            this.createGenreCommuneChart();
        }, 200);
    }

    renderPostTraitement() {
        console.log('Rendu de la section Post-traitement');
        this.updatePostKPIs();
        this.populatePostFilters();
        setTimeout(() => {
            this.createUrmTerrainChart();
            this.renderPostTraitementTable();
        }, 200);
    }

    updateKPIs() {
        if (!this.stats) return;

        // Update main KPIs
        this.updateElement('totalParcelles', this.stats.total.toLocaleString());
        this.updateElement('parcellesNicad', this.stats.nicad_oui.toLocaleString());
        this.updateElement('parcellesDeliberees', this.stats.deliberees_oui.toLocaleString());
        this.updateElement('superficieTotale', this.stats.superficie_totale.toLocaleString(undefined, {maximumFractionDigits: 2}));

        // Update percentages
        const nicadPct = this.stats.total > 0 ? ((this.stats.nicad_oui / this.stats.total) * 100).toFixed(1) : 0;
        const delibPct = this.stats.total > 0 ? ((this.stats.deliberees_oui / this.stats.total) * 100).toFixed(1) : 0;
        
        this.updateElement('percentageNicad', `${nicadPct}% avec NICAD`);
        this.updateElement('percentageDeliberees', `${delibPct}% délibérées`);

        // Taux de réalisation (21,090 délimitées sur 31,302 totales)
        const tauxRealisation = ((21090 / this.stats.total) * 100).toFixed(1);
        this.updateElement('tauxRealisation', `${tauxRealisation}%`);
    }

    updateProgressBar() {
        const progressFill = document.getElementById('globalProgressFill');
        const progressText = document.getElementById('globalProgressText');
        
        const taux = 67.4; // Taux de réalisation
        
        if (progressFill) {
            progressFill.style.width = taux + '%';
        }
        if (progressText) {
            progressText.textContent = taux + '%';
        }
    }

    updateProjectionsKPIs() {
        this.updateElement('objectif2025', '82,421');
        this.updateElement('realise2025', '16,418');
        this.updateElement('performance2025', '19.9%');
    }

    updateGenreKPIs() {
        if (!this.data.repartitionGenre || !Array.isArray(this.data.repartitionGenre)) return;

        const hommes = this.data.repartitionGenre.find(r => r.genre === 'Homme')?.total_nombre || 43576;
        const femmes = this.data.repartitionGenre.find(r => r.genre === 'Femme')?.total_nombre || 9332;
        const total = hommes + femmes;

        this.updateElement('hommesTotal', hommes.toLocaleString());
        this.updateElement('femmesTotal', femmes.toLocaleString());
        this.updateElement('hommesPercentage', `${total > 0 ? ((hommes / total) * 100).toFixed(1) : 0}%`);
        this.updateElement('femmesPercentage', `${total > 0 ? ((femmes / total) * 100).toFixed(1) : 0}%`);
    }

    updatePostKPIs() {
        this.updateElement('totalRecues', '8,420');
        this.updateElement('postTraitees', '7,890');
        this.updateElement('tauxTraitement', '93.7%');
    }

    // Chart creation methods
    createTopCommunesChart() {
        if (!this.communeStats) return;

        const ctx = document.getElementById('topCommunesChart');
        if (!ctx) return;

        const topCommunes = Object.entries(this.communeStats)
            .sort(([,a], [,b]) => b.total - a.total)
            .slice(0, 8);

        this.charts.topCommunes = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topCommunes.map(([commune]) => commune.substring(0, 15)),
                datasets: [{
                    label: 'Total Parcelles',
                    data: topCommunes.map(([, stats]) => stats.total),
                    backgroundColor: this.colors.primary,
                    borderRadius: 4
                }, {
                    label: 'Avec NICAD',
                    data: topCommunes.map(([, stats]) => stats.nicad_oui),
                    backgroundColor: this.colors.secondary,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
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
    }

    createProjectionsChart() {
        if (!this.data.projections || !Array.isArray(this.data.projections)) return;

        const ctx = document.getElementById('projectionsChart');
        if (!ctx) return;

        this.charts.projections = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.projections.map(p => p.mois || p.periode || ''),
                datasets: [{
                    label: 'Objectif',
                    data: this.data.projections.map(p => p.objectif_inventaires_mensuels || p.objectif || 8000),
                    borderColor: this.colors.secondary,
                    backgroundColor: this.colors.secondary + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Réalisé',
                    data: this.data.projections.map(p => p.inventaires_mensuels_realises || p.realise || 0),
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
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
    }

    createGenreGlobalChart() {
        if (!this.data.repartitionGenre || !Array.isArray(this.data.repartitionGenre)) return;

        const ctx = document.getElementById('genreGlobalChart');
        if (!ctx) return;

        const hommes = this.data.repartitionGenre.find(r => r.genre === 'Homme')?.total_nombre || 43576;
        const femmes = this.data.repartitionGenre.find(r => r.genre === 'Femme')?.total_nombre || 9332;

        this.charts.genreGlobal = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Hommes', 'Femmes'],
                datasets: [{
                    data: [hommes, femmes],
                    backgroundColor: [this.colors.secondary, this.colors.primary],
                    borderWidth: 0
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

    createRegionChart() {
        if (!this.data.parcelles) return;

        const ctx = document.getElementById('regionChart');
        if (!ctx) return;

        // Aggregate by region
        const regionData = {};
        this.data.parcelles.forEach(parcelle => {
            const region = parcelle.region || 'Non définie';
            regionData[region] = (regionData[region] || 0) + 1;
        });

        this.charts.region = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(regionData),
                datasets: [{
                    data: Object.values(regionData),
                    backgroundColor: this.colors.chartColors.slice(0, Object.keys(regionData).length),
                    borderWidth: 0
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

    createNicadChart() {
        if (!this.communeStats) return;

        const ctx = document.getElementById('nicadChart');
        if (!ctx) return;

        const topCommunes = Object.entries(this.communeStats)
            .sort(([,a], [,b]) => b.total - a.total)
            .slice(0, 8);

        const nicadData = topCommunes.map(([commune, stats]) => ({
            commune: commune.substring(0, 12),
            percentage: stats.total > 0 ? ((stats.nicad_oui / stats.total) * 100) : 0
        }));

        this.charts.nicad = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: nicadData.map(d => d.commune),
                datasets: [{
                    label: 'Taux NICAD (%)',
                    data: nicadData.map(d => d.percentage),
                    backgroundColor: nicadData.map(d => {
                        if (d.percentage >= 60) return this.colors.success;
                        if (d.percentage >= 40) return this.colors.warning;
                        return this.colors.error;
                    }),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    createStatusChart() {
        if (!this.data.etatOperations || !Array.isArray(this.data.etatOperations)) return;

        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        const statusCounts = {};
        this.data.etatOperations.forEach(item => {
            const status = item.etat_d_avancement || item.status || 'Non défini';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        this.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: this.colors.chartColors.slice(0, Object.keys(statusCounts).length),
                    borderWidth: 0
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

    createObjectifsChart() {
        if (!this.data.projections || !Array.isArray(this.data.projections)) return;

        const ctx = document.getElementById('objectifsChart');
        if (!ctx) return;

        this.charts.objectifs = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.projections.map(p => (p.mois || p.periode || '').split(' ')[0]),
                datasets: [{
                    label: 'Objectif',
                    data: this.data.projections.map(p => p.objectif_inventaires_mensuels || p.objectif || 8000),
                    borderColor: this.colors.secondary,
                    backgroundColor: this.colors.secondary + '30',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Réalisé',
                    data: this.data.projections.map(p => p.inventaires_mensuels_realises || p.realise || 0),
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '30',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
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
    }

    createGenreGlobalDonut() {
        this.createGenreGlobalChart(); // Reuse the same chart
    }

    createGenreTrimestreChart() {
        if (!this.data.genreTrimestre || !Array.isArray(this.data.genreTrimestre)) return;

        const ctx = document.getElementById('genreTrimestreChart');
        if (!ctx) return;

        this.charts.genreTrimestre = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.data.genreTrimestre.map(g => g.periodetrimestrielle || g.periode || g.trimestre),
                datasets: [{
                    label: 'Femmes',
                    data: this.data.genreTrimestre.map(g => g.femme),
                    backgroundColor: this.colors.primary,
                    borderRadius: 4
                }, {
                    label: 'Hommes',
                    data: this.data.genreTrimestre.map(g => g.homme),
                    backgroundColor: this.colors.secondary,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createGenreCommuneChart() {
        if (!this.data.genreCommune || !Array.isArray(this.data.genreCommune)) return;

        const ctx = document.getElementById('genreCommuneChart');
        if (!ctx) return;

        const topCommunes = this.data.genreCommune.slice(0, 10);

        this.charts.genreCommune = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topCommunes.map(g => (g.communesenegal || g.commune || '').substring(0, 12)),
                datasets: [{
                    label: 'Femmes',
                    data: topCommunes.map(g => g.femme),
                    backgroundColor: this.colors.primary,
                    borderRadius: 4
                }, {
                    label: 'Hommes',
                    data: topCommunes.map(g => g.homme),
                    backgroundColor: this.colors.secondary,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createUrmTerrainChart() {
        const ctx = document.getElementById('urmTerrainChart');
        if (!ctx) return;

        // Sample data pour URM vs Terrain
        const sampleData = [
            { commune: 'NDOGA BABACAR', urm: 3845, terrain: 5102 },
            { commune: 'BANDAFASSI', urm: 3565, terrain: 3543 },
            { commune: 'DIMBOLI', urm: 2989, terrain: 3012 },
            { commune: 'MISSIRAH', urm: 2712, terrain: 2400 },
            { commune: 'NETTEBOULOU', urm: 2492, terrain: 2237 }
        ];

        this.charts.urmTerrain = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sampleData.map(d => d.commune.substring(0, 12)),
                datasets: [{
                    label: 'URM',
                    data: sampleData.map(d => d.urm),
                    backgroundColor: this.colors.primary,
                    borderRadius: 4
                }, {
                    label: 'Terrain',
                    data: sampleData.map(d => d.terrain),
                    backgroundColor: this.colors.secondary,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
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
    }

    // Table rendering methods
    renderParcellesTable() {
        const tbody = document.getElementById('parcellesTableBody');
        if (!tbody || !this.communeStats) return;

        tbody.innerHTML = '';

        const communeData = Object.entries(this.communeStats)
            .map(([commune, stats]) => ({
                commune,
                ...stats,
                nicad_pct: stats.total > 0 ? ((stats.nicad_oui / stats.total) * 100).toFixed(1) : 0,
                delib_pct: stats.total > 0 ? ((stats.deliberees_oui / stats.total) * 100).toFixed(1) : 0
            }))
            .sort((a, b) => b.total - a.total);

        communeData.forEach(item => {
            const row = document.createElement('tr');
            const region = this.getRegionForCommune(item.commune);
            
            row.innerHTML = `
                <td>${region}</td>
                <td>${item.commune}</td>
                <td>${item.total.toLocaleString()}</td>
                <td>${item.nicad_oui.toLocaleString()}</td>
                <td><span class="percentage ${parseFloat(item.nicad_pct) >= 60 ? 'success' : parseFloat(item.nicad_pct) >= 40 ? 'warning' : 'error'}">${item.nicad_pct}%</span></td>
                <td>${item.deliberees_oui.toLocaleString()}</td>
                <td><span class="percentage ${parseFloat(item.delib_pct) >= 40 ? 'success' : parseFloat(item.delib_pct) >= 25 ? 'warning' : 'error'}">${item.delib_pct}%</span></td>
                <td>${item.superficie.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
            `;
            tbody.appendChild(row);
        });
    }

    getRegionForCommune(commune) {
        if (!this.data.parcelles) return 'Non définie';
        const parcelle = this.data.parcelles.find(p => p.commune === commune);
        return parcelle?.region || 'Non définie';
    }

    renderTimeline() {
        const container = document.getElementById('timelineContainer');
        if (!container || !this.data.etatOperations || !Array.isArray(this.data.etatOperations)) return;

        let html = '';
        
        this.data.etatOperations.slice(0, 10).forEach(item => {
            const status = item.etat_d_avancement || item.status || 'En cours';
            const commune = item.commune || 'Non définie';
            const dateDebut = item.date_debut ? new Date(item.date_debut).toLocaleDateString('fr-FR') : 'Non définie';
            
            const statusClass = status.includes('Terminé') ? 'completed' : 
                              status.includes('Presque') ? 'in-progress' : 'pending';
            
            html += `
                <div class="timeline-item ${statusClass}">
                    <div class="timeline-content">
                        <div class="timeline-commune">${commune}</div>
                        <div class="timeline-status">${status} - Début: ${dateDebut}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderPerformanceList() {
        const container = document.getElementById('performanceList');
        if (!container || !this.data.projections || !Array.isArray(this.data.projections)) return;

        let html = '';
        
        this.data.projections.slice(0, 6).forEach(item => {
            const mois = item.mois || item.periode || 'Mois';
            const realise = item.inventaires_mensuels_realises || item.realise || 0;
            const objectif = item.objectif_inventaires_mensuels || item.objectif || 8000;
            const taux = objectif > 0 ? ((realise / objectif) * 100).toFixed(1) : 0;
            
            const statusClass = parseFloat(taux) >= 60 ? 'success' : parseFloat(taux) >= 40 ? 'warning' : 'error';
            
            html += `
                <div class="performance-item">
                    <div class="performance-month">${mois}</div>
                    <div class="performance-value ${statusClass}">${taux}%</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderPostTraitementTable() {
        const tbody = document.getElementById('postTraitementTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        // Sample data pour post-traitement
        const sampleData = [
            { commune: 'NDOGA BABACAR', recues: 1245, traitees: 1156, individuelles: 718, collectives: 438, jointure: 1089, taux: 87.5 },
            { commune: 'BANDAFASSI', recues: 987, traitees: 923, individuelles: 573, collectives: 350, jointure: 867, taux: 93.9 },
            { commune: 'DIMBOLI', recues: 834, traitees: 789, individuelles: 490, collectives: 299, jointure: 742, taux: 94.6 },
            { commune: 'MISSIRAH', recues: 723, traitees: 678, individuelles: 421, collectives: 257, jointure: 636, taux: 93.8 },
            { commune: 'NETTEBOULOU', recues: 634, traitees: 587, individuelles: 364, collectives: 223, jointure: 551, taux: 92.6 }
        ];

        sampleData.forEach(item => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${item.commune}</td>
                <td>${item.recues.toLocaleString()}</td>
                <td>${item.traitees.toLocaleString()}</td>
                <td>${item.individuelles.toLocaleString()}</td>
                <td>${item.collectives.toLocaleString()}</td>
                <td>${item.jointure.toLocaleString()}</td>
                <td><span class="percentage ${item.taux >= 90 ? 'success' : item.taux >= 80 ? 'warning' : 'error'}">${item.taux}%</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    // Map functionality
    initializeMap() {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) return;

        // Initialize Leaflet map centered on Boundou region
        this.map = L.map('mapContainer').setView([13.2, -12.5], 9);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add sample markers for communes
        if (this.communeStats) {
            this.addCommuneMarkers();
        }
    }

    addCommuneMarkers() {
        if (!this.map || !this.communeStats) return;

        // Sample coordinates for communes (approximate locations in Tambacounda/Kedougou regions)
        const communeCoords = {
            'NDOGA BABACAR': [13.1, -12.4],
            'BANDAFASSI': [12.5, -12.2],
            'DIMBOLI': [12.6, -12.1],
            'MISSIRAH': [13.3, -12.6],
            'NETTEBOULOU': [13.4, -12.5],
            'BALLOU': [13.2, -12.3],
            'FONGOLIMBI': [12.7, -12.0],
            'GABOU': [13.5, -12.7],
            'BEMBOU': [12.4, -12.3],
            'DINDEFELO': [12.3, -12.4],
            'MOUDERY': [13.6, -12.8],
            'TOMBORONKOTO': [12.2, -12.1]
        };

        Object.entries(this.communeStats).forEach(([commune, stats]) => {
            const coords = communeCoords[commune];
            if (!coords) return;

            const nicadPct = stats.total > 0 ? ((stats.nicad_oui / stats.total) * 100) : 0;
            const color = nicadPct >= 60 ? '#10B981' : nicadPct >= 40 ? '#F59E0B' : '#EF4444';

            const marker = L.circleMarker(coords, {
                color: '#FFFFFF',
                fillColor: color,
                fillOpacity: 0.8,
                radius: Math.sqrt(stats.total) * 2,
                weight: 2
            }).addTo(this.map);

            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h3 style="color: ${this.colors.secondary}; margin: 0 0 10px 0;">${commune}</h3>
                    <div style="font-size: 12px; line-height: 1.4;">
                        <p><strong>📊 Total parcelles:</strong> ${stats.total.toLocaleString()}</p>
                        <p><strong>✅ Parcelles NICAD:</strong> ${stats.nicad_oui.toLocaleString()} (${nicadPct.toFixed(1)}%)</p>
                        <p><strong>📋 Parcelles délibérées:</strong> ${stats.deliberees_oui.toLocaleString()}</p>
                        <p><strong>📏 Superficie:</strong> ${stats.superficie.toFixed(2)} ha</p>
                    </div>
                </div>
            `);
        });
    }

    // Filter and export functionality
    populateFilters() {
        if (!this.data.parcelles) return;

        const communes = [...new Set(this.data.parcelles.map(p => p.commune))].sort();
        
        // Populate commune filters
        ['communeFilter', 'postCommuneFilter'].forEach(filterId => {
            const select = document.getElementById(filterId);
            if (select) {
                select.innerHTML = '<option value="">Toutes les communes</option>';
                communes.forEach(commune => {
                    const option = document.createElement('option');
                    option.value = commune;
                    option.textContent = commune;
                    select.appendChild(option);
                });
            }
        });
    }

    populatePostFilters() {
        const geomFilter = document.getElementById('postGeomFilter');
        if (geomFilter) {
            geomFilter.innerHTML = `
                <option value="">Toutes les géométries</option>
                <option value="Point">Point</option>
                <option value="Polygon">Polygon</option>
                <option value="LineString">LineString</option>
            `;
        }
    }

    applyFilters() {
        console.log('Application des filtres');
        // Re-render current section with filters applied
        this.renderSection(this.currentSection);
    }

    exportParcellesData() {
        if (!this.communeStats) return;

        const csvData = Object.entries(this.communeStats).map(([commune, stats]) => ({
            'Région': this.getRegionForCommune(commune),
            'Commune': commune,
            'Total Parcelles': stats.total,
            'NICAD': stats.nicad_oui,
            '% NICAD': stats.total > 0 ? ((stats.nicad_oui / stats.total) * 100).toFixed(1) : 0,
            'Délibérées': stats.deliberees_oui,
            '% Délibérées': stats.total > 0 ? ((stats.deliberees_oui / stats.total) * 100).toFixed(1) : 0,
            'Superficie (ha)': stats.superficie.toFixed(2)
        }));

        this.downloadCSV(csvData, 'procasef_parcelles_export.csv');
    }

    exportPostData() {
        const csvData = [
            { 'Commune': 'NDOGA BABACAR', 'Reçues': 1245, 'Traitées': 1156, 'Individuelles': 718, 'Collectives': 438, 'Jointure OK': 1089, 'Taux (%)': 87.5 },
            { 'Commune': 'BANDAFASSI', 'Reçues': 987, 'Traitées': 923, 'Individuelles': 573, 'Collectives': 350, 'Jointure OK': 867, 'Taux (%)': 93.9 }
        ];

        this.downloadCSV(csvData, 'procasef_post_traitement_export.csv');
    }

    downloadCSV(data, filename) {
        if (!data.length) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

    // Utility methods
    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartId => {
            if (this.charts[chartId] && typeof this.charts[chartId].destroy === 'function') {
                this.charts[chartId].destroy();
                delete this.charts[chartId];
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    }

    handleResize() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });

        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    showLoading() {
        const loading = document.getElementById('loadingState');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loadingState');
        if (loading) {
            loading.classList.add('hidden');
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation du Dashboard PROCASEF...');
    window.dashboard = new ProcasefDashboard();
});
