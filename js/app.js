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
        this.mapManager = null; // 🔴 CORRECTION: Remplacé this.map par this.mapManager
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
        this.filteredParcelles = null; // 🔴 AJOUT: Pour stocker les données filtrées
        this.filters = {
            commune: '',
            nicad: '',
            deliberation: ''
        };
        
        this.init();
    }

    async init() {
        this.showLoading();
        try {
            this.setupEventListeners();
            await this.loadInitialData();
            this.calculateStats();
            this.renderDashboard();
        } catch (error) {
            console.error('Erreur durant l\'init:', error);
        }
        this.hideLoading();
    }


    async loadInitialData() {
        console.log('Chargement des données initiales...');
        try {
            this.data.parcelles = await this.dataLoader.loadData('data/parcelles.json');
        } catch (e) {
            console.error('Échec chargement parcelles:', e);
            this.data.parcelles = [];
        }
        try {
            this.data.projections = await this.dataLoader.loadData('data/Projections_2025.json');
        } catch (e) {
            console.error('Échec chargement projections:', e);
            this.data.projections = [];
        }
        try {
            this.data.repartitionGenre = await this.dataLoader.loadData('data/Repartition_genre.json');
        } catch (e) {
            console.error('Échec chargement repartitionGenre:', e);
            this.data.repartitionGenre = [];
        }
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

    // 🔴 CORRECTION CRITIQUE: Navigation avec destruction conditionnelle de la carte
    async navigateToSection(sectionId) {
        console.log('Navigation vers la section:', sectionId);
        
        // 🔴 CORRECTION CRITIQUE: Détruire la carte si on quitte la section parcelles
        if (this.mapManager && this.mapManager.map && sectionId !== 'parcelles') {
            console.log('🗺️ Destruction de la carte avant changement de section');
            this.mapManager.destroyMap();
        }

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
                    this.data.etatOperations = await this.dataLoader.loadData('data/Etat_des_operations_Boundou_Mai_2025.json');
                }
                break;
            case 'projections-2025':
                if (!this.data.projections) {
                    this.data.projections = await this.dataLoader.loadData('data/Projections_2025.json');
                }
                break;
            case 'genre':
                if (!this.data.genreCommune) {
                    this.data.genreCommune = await this.dataLoader.loadData('data/Genre_par_Commune.json');
                }
                if (!this.data.genreTrimestre) {
                    this.data.genreTrimestre = await this.dataLoader.loadData('data/Genre_par_trimestre.json');
                }
                if (!this.data.repartitionGenre) {
                    this.data.repartitionGenre = await this.dataLoader.loadData('data/Repartition_genre.json');
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

    // 🔴 CORRECTION CRITIQUE: Initialisation sécurisée de la carte
    initializeMap() {
        console.log('🗺️ Initialisation de la carte...');
        
        // Créer le MapManager s'il n'existe pas
        if (!this.mapManager) {
            this.mapManager = new MapManager();
        }
        
        // 🔴 CORRECTION CRITIQUE: Vérifier si la carte existe déjà
        if (this.mapManager.map) {
            console.log('⚠️ Carte déjà initialisée, mise à jour des marqueurs seulement');
            // Si la carte existe, on met juste à jour les marqueurs
            this.updateMapMarkersFromStats();
            return this.mapManager.map;
        }
        
        // 🔴 CORRECTION: Initialisation seulement si pas de carte existante
        const mapInstance = this.mapManager.initMap('mapContainer');
        
        if (mapInstance && this.communeStats) {
            console.log('📍 Ajout des marqueurs des communes...');
            this.updateMapMarkersFromStats();
            
            // Ajuster la vue pour inclure tous les marqueurs
            setTimeout(() => {
                this.mapManager.fitToMarkers();
            }, 500);
        }
        
        return mapInstance;
    }

    // 🔴 NOUVELLE MÉTHODE: Mise à jour des marqueurs depuis les stats
    updateMapMarkersFromStats() {
        if (!this.mapManager || !this.mapManager.map || !this.communeStats) return;
        
        // Nettoyer les marqueurs existants
        this.mapManager.clearMarkers();
        
        // Ajouter les marqueurs des communes
        Object.entries(this.communeStats).forEach(([commune, stats]) => {
            this.mapManager.addCommuneMarker(commune, stats);
        });
    }

    // 🔴 CORRECTION CRITIQUE: Application des filtres sans recréer la carte
    applyFilters() {
        console.log('Application des filtres');
        
        if (this.currentSection !== 'parcelles') {
            this.renderSection(this.currentSection);
            return;
        }

        // Récupération des filtres
        let data = this.data.parcelles || [];
        const fComm = document.getElementById('communeFilter')?.value;
        const fNic = document.getElementById('nicadFilter')?.value;
        const fDel = document.getElementById('deliberationFilter')?.value;
        
        // Application des filtres
        if(fComm) data = data.filter(p => p.commune === fComm);
        if(fNic) data = data.filter(p => p.nicad === fNic);
        if(fDel) data = data.filter(p => p.deliberee === fDel);
        
        this.filteredParcelles = data.length ? data : null;
        
        // Mise à jour carte sans recréer
        this.updateMapWithFilteredData();
        this.renderParcellesTable();
    }

    // 🔴 NOUVELLE MÉTHODE: Mise à jour des marqueurs selon filteredParcelles
    updateMapWithFilteredData() {
        if (!this.mapManager?.map) return;
        
        this.mapManager.clearMarkers();
        const stats = {};
        (this.filteredParcelles || this.data.parcelles || []).forEach(p => {
            const c = p.commune;
            if (!stats[c]) stats[c] = {total:0, nicad_oui:0, deliberees_oui:0, superficie:0};
            stats[c].total++;
            if (p.nicad === 'Oui') stats[c].nicad_oui++;
            if (p.deliberee === 'Oui') stats[c].deliberees_oui++;
            if (p.superficie) stats[c].superficie += parseFloat(p.superficie);
        });
        
        Object.entries(stats).forEach(([c,s]) => this.mapManager.addCommuneMarker(c,s));
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

        // Taux de réalisation (33457 délimitées sur 70000 totales)
        const tauxRealisation = ((33457 / this.stats.total) * 100).toFixed(1);
        this.updateElement('tauxRealisation', `${tauxRealisation}%`);
    }

    updateProgressBar() {
        const progressFill = document.getElementById('globalProgressFill');
        const progressText = document.getElementById('globalProgressText');
        
        const taux = 47.80; // Taux de réalisation
        
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
        if (!tbody) return;

        tbody.innerHTML = '';

        // 🔴 CORRECTION: Utiliser les données filtrées si disponibles
        const src = this.filteredParcelles ? this.buildAgg(this.filteredParcelles) : this.communeStats;
        
        if (!src) return;

        const communeData = Object.entries(src)
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
                <td>${item.commune}</td>
                <td>${region}</td>
                <td class="text-end">${item.total.toLocaleString()}</td>
                <td class="text-end">${item.nicad_oui.toLocaleString()}</td>
                <td class="text-end">
                    <span class="badge ${parseFloat(item.nicad_pct) >= 60 ? 'bg-success' : 
                                        parseFloat(item.nicad_pct) >= 40 ? 'bg-warning' : 'bg-danger'}">
                        ${item.nicad_pct}%
                    </span>
                </td>
                <td class="text-end">${item.deliberees_oui.toLocaleString()}</td>
                <td class="text-end">
                    <span class="badge ${parseFloat(item.delib_pct) >= 30 ? 'bg-success' : 
                                        parseFloat(item.delib_pct) >= 15 ? 'bg-warning' : 'bg-danger'}">
                        ${item.delib_pct}%
                    </span>
                </td>
                <td class="text-end">${item.superficie.toFixed(2)} ha</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // 🔴 NOUVELLE MÉTHODE: Agrégation pour filteredParcelles
    buildAgg(arr) {
        const o = {};
        arr.forEach(p => {
            const c = p.commune;
            if (!o[c]) o[c] = { total:0, nicad_oui:0, deliberees_oui:0, superficie:0 };
            o[c].total++;
            if (p.nicad === 'Oui') o[c].nicad_oui++;
            if (p.deliberee === 'Oui') o[c].deliberees_oui++;
            if (p.superficie) o[c].superficie += parseFloat(p.superficie);
        });
        return o;
    }

    renderTimeline() {
        const timelineContainer = document.getElementById('timelineContainer');
        if (!timelineContainer) return;

        const timelineItems = [
            { date: '2024-01', title: 'Démarrage Projet', status: 'completed', description: 'Lancement officiel du projet PROCASEF' },
            { date: '2024-06', title: 'Phase Pilote', status: 'completed', description: 'Mise en œuvre phase pilote dans 3 communes' },
            { date: '2024-12', title: 'Extension', status: 'current', description: 'Extension à l\'ensemble des communes' },
            { date: '2025-06', title: 'Finalisation', status: 'pending', description: 'Finalisation et évaluation du projet' }
        ];

        timelineContainer.innerHTML = timelineItems.map(item => `
            <div class="timeline-item ${item.status}">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h6>${item.title}</h6>
                    <small class="text-muted">${item.date}</small>
                    <p>${item.description}</p>
                </div>
            </div>
        `).join('');
    }

    renderPerformanceList() {
        const performanceContainer = document.getElementById('performanceList');
        if (!performanceContainer || !this.data.projections) return;

        const performanceData = this.data.projections.map(p => ({
            periode: p.mois || p.periode,
            objectif: p.objectif_inventaires_mensuels || p.objectif || 8000,
            realise: p.inventaires_mensuels_realises || p.realise || 0,
            performance: p.objectif ? ((p.realise / p.objectif) * 100).toFixed(1) : 0
        }));

        performanceContainer.innerHTML = performanceData.map(item => `
            <div class="performance-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${item.periode}</h6>
                        <small class="text-muted">${item.realise.toLocaleString()} / ${item.objectif.toLocaleString()}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge ${parseFloat(item.performance) >= 80 ? 'bg-success' : 
                                           parseFloat(item.performance) >= 60 ? 'bg-warning' : 'bg-danger'}">
                            ${item.performance}%
                        </span>
                    </div>
                </div>
                <div class="progress mt-2" style="height: 4px;">
                    <div class="progress-bar bg-primary" style="width: ${Math.min(item.performance, 100)}%"></div>
                </div>
            </div>
        `).join('');
    }

    renderPostTraitementTable() {
        const tbody = document.getElementById('postTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Sample data pour post-traitement
        const postData = [
            { commune: 'NDOGA BABACAR', recues: 1250, traitees: 1180, taux: 94.4, statut: 'Conforme' },
            { commune: 'BANDAFASSI', recues: 980, traitees: 920, taux: 93.9, statut: 'Conforme' },
            { commune: 'DIMBOLI', recues: 845, traitees: 790, taux: 93.5, statut: 'Conforme' },
            { commune: 'MISSIRAH', recues: 720, traitees: 650, taux: 90.3, statut: 'Attention' },
            { commune: 'NETTEBOULOU', recues: 650, traitees: 580, taux: 89.2, statut: 'Attention' }
        ];

        postData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.commune}</td>
                <td class="text-end">${item.recues.toLocaleString()}</td>
                <td class="text-end">${item.traitees.toLocaleString()}</td>
                <td class="text-end">
                    <span class="badge ${item.taux >= 95 ? 'bg-success' : 
                                        item.taux >= 90 ? 'bg-warning' : 'bg-danger'}">
                        ${item.taux}%
                    </span>
                </td>
                <td>
                    <span class="badge ${item.statut === 'Conforme' ? 'bg-success' : 'bg-warning'}">
                        ${item.statut}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Utility methods
    populateFilters() {
        if (!this.communeStats) return;

        // Populate commune filter
        const communeSelect = document.getElementById('communeFilter');
        if (communeSelect) {
            communeSelect.innerHTML = '<option value="">Toutes les communes</option>';
            Object.keys(this.communeStats).sort().forEach(commune => {
                communeSelect.insertAdjacentHTML('beforeend', 
                    `<option value="${commune}">${commune}</option>`);
            });
        }

        // Populate NICAD filter
        const nicadSelect = document.getElementById('nicadFilter');
        if (nicadSelect) {
            nicadSelect.innerHTML = '<option value="">Tous</option>';
            ['Oui', 'Non'].forEach(value => {
                nicadSelect.insertAdjacentHTML('beforeend', 
                    `<option value="${value}">${value}</option>`);
            });
        }

        // Populate deliberation filter
        const deliberationSelect = document.getElementById('deliberationFilter');
        if (deliberationSelect) {
            deliberationSelect.innerHTML = '<option value="">Toutes</option>';
            ['Oui', 'Non'].forEach(value => {
                deliberationSelect.insertAdjacentHTML('beforeend', 
                    `<option value="${value}">${value}</option>`);
            });
        }
    }

    populatePostFilters() {
        // Sample implementation for post-treatment filters
        const postCommuneSelect = document.getElementById('postCommuneFilter');
        if (postCommuneSelect && this.communeStats) {
            postCommuneSelect.innerHTML = '<option value="">Toutes les communes</option>';
            Object.keys(this.communeStats).sort().forEach(commune => {
                postCommuneSelect.insertAdjacentHTML('beforeend', 
                    `<option value="${commune}">${commune}</option>`);
            });
        }
    }

    getRegionForCommune(commune) {
        // Simple mapping - you can expand this based on your data
        const regionMapping = {
            'NDOGA BABACAR': 'Kédougou',
            'BANDAFASSI': 'Kédougou', 
            'DIMBOLI': 'Kédougou',
            'MISSIRAH': 'Kédougou',
            'NETTEBOULOU': 'Tambacounda',
            'BALLOU': 'Tambacounda',
            'FONGOLIMBI': 'Tambacounda',
            'GABOU': 'Tambacounda',
            'BEMBOU': 'Kédougou',
            'DINDEFELO': 'Kédougou',
            'MOUDERY': 'Tambacounda',
            'TOMBORONKOTO': 'Tambacounda'
        };
        return regionMapping[commune] || 'Non définie';
    }

    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const content = document.querySelector('.main-content');
        if (sidebar && content) {
            sidebar.classList.toggle('collapsed');
            content.classList.toggle('expanded');
        }
    }

    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    // 🔴 CORRECTION: Méthode handleResize corrigée
    handleResize() {
        // Redimensionner les graphiques
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
        
        // 🔴 CORRECTION: Redimensionner la carte via MapManager
        if (this.mapManager && this.mapManager.map) {
            this.mapManager.resize();
        }
    }

    // Export methods
    exportParcellesData() {
        if (!this.data.parcelles) {
            alert('Aucune donnée à exporter');
            return;
        }

        const csvContent = this.convertToCSV(this.data.parcelles);
        this.downloadCSV(csvContent, 'parcelles_procasef.csv');
    }

    exportPostData() {
        // Implementation for post-treatment data export
        const postData = [
            { commune: 'NDOGA BABACAR', recues: 1250, traitees: 1180, taux: 94.4 },
            { commune: 'BANDAFASSI', recues: 980, traitees: 920, taux: 93.9 }
            // Add more data as needed
        ];

        const csvContent = this.convertToCSV(postData);
        this.downloadCSV(csvContent, 'post_traitement_procasef.csv');
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(';');
        
        const csvRows = data.map(row => {
            return headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(';') ? `"${value}"` : value;
            }).join(';');
        });

        return [csvHeaders, ...csvRows].join('\n');
    }

    downloadCSV(csvContent, filename) {
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
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('d-none');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('d-none');
        }
    }
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation du Dashboard PROCASEF...');
    window.procasefApp = new ProcasefDashboard();
    
    // Gestion de la fermeture de page
    window.addEventListener('beforeunload', () => {
        if (window.procasefApp && window.procasefApp.mapManager) {
            window.procasefApp.mapManager.cleanup();
        }
    });
});
