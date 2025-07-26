// PROCASEF Dashboard Application - Version optimisée et corrigée avec export rapport genre
class ProcasefDashboard {
    constructor() {
        // Palette de couleurs PROCASEF
        this.colors = {
            primary: '#D4A574',
            secondary: '#1E3A8A',
            accent: '#B8860B',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            info: '#3B82F6',
            chartColors: ['#D4A574', '#1E3A8A', '#B8860B', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4']
        };

        this.dataLoader = new DataLoader();
        this.charts = {};
        this.mapManager = null;
        this.data = {
            parcelles: null,
            projections: null,
            genreCommune: null,
            genreTrimestre: null,
            repartitionGenre: null,
            etatOperations: null,
            parcellesTerrain: null,
            urmTerrain: null,
            rapportComplet: null,
            topoData: null
        };

        this.currentSection = 'accueil';
        this.fontSize = 14;
        this.filteredParcelles = null;
        this.filteredTopoData = [];
        this.filters = {
            commune: '',
            nicad: '',
            deliberation: ''
        };

        this.init();
    }

    showLoading() {
        const loadingEl = document.getElementById('loadingSpinner');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        } else {
            const spinner = document.createElement('div');
            spinner.id = 'loadingSpinner';
            spinner.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                     background: rgba(0,0,0,0.5); display: flex; justify-content: center; 
                     align-items: center; z-index: 9999;">
                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Chargement...</span>
                        </div>
                        <div class="mt-2">Chargement des données...</div>
                    </div>
                </div>
            `;
            document.body.appendChild(spinner);
        }
    }

    hideLoading() {
        const loadingEl = document.getElementById('loadingSpinner');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    getRegionForCommune(commune) {
        if (!this.data.parcelles || !Array.isArray(this.data.parcelles)) return 'N/A';
        const parcelle = this.data.parcelles.find(p => p.commune === commune);
        return parcelle ? parcelle.region || 'N/A' : 'N/A';
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
            this.showError('Erreur lors de l\'initialisation de l\'application');
        }
        this.hideLoading();
    }

    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'alert alert-danger alert-dismissible fade show';
        errorEl.style.position = 'fixed';
        errorEl.style.top = '20px';
        errorEl.style.right = '20px';
        errorEl.style.zIndex = '10000';
        errorEl.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(errorEl);
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.remove();
            }
        }, 5000);
    }

    async loadInitialData() {
        console.log('Chargement des données initiales...');
        const loadPromises = [
            this.loadDataSafely('data/parcelles.json', 'parcelles'),
            this.loadDataSafely('data/Projections_2025.json', 'projections'),
            this.loadDataSafely('data/Repartition_genre.json', 'repartitionGenre')
        ];
        await Promise.allSettled(loadPromises);
    }

    async loadDataSafely(path, key) {
        try {
            this.data[key] = await this.dataLoader.loadData(path);
            console.log(`✅ ${key} chargé avec succès:`, this.data[key]?.length || 'N/A', 'éléments');
        } catch (error) {
            console.error(`❌ Échec chargement ${key}:`, error);
            this.data[key] = [];
        }
    }

    calculateStats() {
        if (!this.data.parcelles || !Array.isArray(this.data.parcelles)) {
            console.warn('Pas de données parcelles disponibles pour le calcul des stats');
            this.stats = {
                total: 0,
                nicad_oui: 0,
                nicad_non: 0,
                deliberees_oui: 0,
                deliberees_non: 0,
                superficie_totale: 0
            };
            this.communeStats = {};
            return;
        }

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

    validateDateRange() {
        const dateDebut = document.getElementById('topoDateDebut')?.value;
        const dateFin = document.getElementById('topoDateFin')?.value;
        if (dateDebut && dateFin && dateDebut > dateFin) {
            this.showError('La date de début doit être antérieure à la date de fin');
            document.getElementById('topoDateFin').value = '';
            return false;
        }
        return true;
    }

    setupEventListeners() {
        console.log('Configuration des event listeners...');
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    await this.navigateToSection(section);
                }
            });
        });

        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        this.setupFontSizeControls();

        ['communeFilter', 'nicadFilter', 'deliberationFilter', 'postCommuneFilter', 'postGeomFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.applyFilters());
            }
        });

        ['topoCommuneFilter', 'topoTopographeFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.applyTopoFilters());
            }
        });

        ['topoDateDebut', 'topoDateFin'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    if (this.validateDateRange()) {
                        this.applyTopoFilters();
                    }
                });
            }
        });

        const clearDateBtn = document.getElementById('clearDateRange');
        if (clearDateBtn) {
            clearDateBtn.addEventListener('click', () => this.clearDateRange());
        }

        const exportParcellesBtn = document.getElementById('exportParcellesBtn');
        const exportPostBtn = document.getElementById('exportPostBtn');
        const exportTopoBtn = document.getElementById('exportTopoBtn');

        if (exportParcellesBtn) {
            exportParcellesBtn.addEventListener('click', () => this.exportParcellesData());
        }
        if (exportPostBtn) {
            exportPostBtn.addEventListener('click', () => this.exportPostData());
        }
        if (exportTopoBtn) {
            exportTopoBtn.addEventListener('click', () => this.exportTopoData());
        }

        // =================== AJOUT #1 – BIND EVENT LISTENER ===================
        // Nouveau bouton d'export genre
        const exportGenreBtn = document.getElementById('exportGenreBtn');
        if (exportGenreBtn) {
            exportGenreBtn.addEventListener('click', () => this.exportGenreReport());
        }

        window.addEventListener('resize', () => this.handleResize());
    }

    setupFontSizeControls() {
        try {
            const saved = localStorage.getItem('procasef-font-size');
            if (saved) {
                this.fontSize = parseInt(saved);
            }
        } catch (error) {
            console.log('localStorage non disponible');
        }

        const fontSlider = document.getElementById('fontSizeSlider');
        const fontDecrease = document.getElementById('fontDecrease');
        const fontIncrease = document.getElementById('fontIncrease');

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

        this.updateFontSize();
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
        if (this.currentSection === sectionId) {
            console.log(`Déjà sur la section ${sectionId}, ignorer navigation`);
            return;
        }

        console.log('Navigation vers la section:', sectionId);

        if (this.mapManager && this.mapManager.map && sectionId !== 'parcelles') {
            console.log('Destruction de la carte avant changement de section');
            try {
                this.mapManager.destroyMap();
            } catch (error) {
                console.warn('Erreur lors de la destruction de la carte:', error);
                this.mapManager.map = null;
                if (this.mapManager.markers) this.mapManager.markers = [];
                if (this.mapManager.markerCluster) this.mapManager.markerCluster = null;
            }
        }

        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const activeNavItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeNavItem) activeNavItem.classList.add('active');

        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) targetSection.classList.add('active');

        const titles = {
            'accueil': 'Dashboard PROCASEF',
            'parcelles': 'Répartition des Parcelles',
            'etat-avancement': 'État d\'Avancement',
            'projections-2025': 'Projections 2025',
            'genre': 'Répartition par Genre',
            'rapport': 'Rapport Complet',
            'stats-topo': 'Statistiques Topographiques',
            'post-traitement': 'Post-Traitement'
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = titles[sectionId] || titles.accueil;

        await this.loadDataForSection(sectionId);
        this.currentSection = sectionId;
        this.renderSection(sectionId);
    }

    async loadDataForSection(sec) {
        const dataConfigs = {
            'parcelles': { path: 'data/parcelles.json', key: 'parcelles' },
            'etat-avancement': { path: 'data/Etat_des_operations_Boundou_Mai_2025.json', key: 'etatOperations' },
            'projections-2025': { path: 'data/Projections_2025.json', key: 'projections' },
            'genre': [
                { path: 'data/Genre_par_Commune.json', key: 'genreCommune' },
                { path: 'data/Genre_par_trimestre.json', key: 'genreTrimestre' },
                { path: 'data/Repartition_genre.json', key: 'repartitionGenre' }
            ],
            'rapport': { path: 'data/rapport_complet.json', key: 'rapportComplet' },
            'stats-topo': { path: 'data/Rapports_Topo_nettoyee.json', key: 'topoData' }
        };

        const config = dataConfigs[sec];
        if (!config) return;

        try {
            this.showLoading();
            if (Array.isArray(config)) {
                const promises = config.map(c => this.loadDataSafely(c.path, c.key));
                await Promise.allSettled(promises);
            } else {
                if (!this.data[config.key] || this.data[config.key].length === 0) {
                    await this.loadDataSafely(config.path, config.key);
                }
            }

            if (sec === 'stats-topo') {
                this.filteredTopoData = this.data.topoData || [];
                this.populateTopoFilters();
            }
        } catch (error) {
            console.error(`Erreur lors du chargement des données pour ${sec}:`, error);
            this.showError(`Impossible de charger les données pour ${sec}`);
        } finally {
            this.hideLoading();
        }
    }

    renderDashboard() {
        this.renderAccueil();
        this.populateFilters();
    }

    renderSection(sec) {
        this.destroyAllCharts();
        try {
            const renderMethods = {
                'accueil': () => this.renderAccueil(),
                'parcelles': () => this.renderParcelles(),
                'etat-avancement': () => this.renderEtatAvancement(),
                'projections-2025': () => this.renderProjections(),
                'genre': () => this.renderGenre(),
                'rapport': () => this.renderRapport(),
                'stats-topo': () => this.renderStatsTopo(),
                'post-traitement': () => this.renderPostTraitement()
            };

            const renderMethod = renderMethods[sec];
            if (renderMethod) {
                renderMethod();
            } else {
                console.warn(`Section inconnue: ${sec}`);
                this.renderAccueil();
            }
        } catch (error) {
            console.error(`Erreur lors du rendu de la section ${sec}:`, error);
            this.showError(`Erreur lors de l'affichage de la section ${sec}`);
            this.renderAccueil();
        }
    }

    renderAccueil() {
        console.log('Rendu de la section Accueil');
        this.updateKPIs();
        this.createTopCommunesChart();
        this.createProjectionsChart();
        this.createGenreGlobalChart();
    }

    renderParcelles() {
        console.log('Rendu de la section Parcelles');
        this.populateFilters();
        this.initializeMap();
        this.createRegionChart();
        this.createNicadChart();
        this.renderParcellesTable();
    }

    renderEtatAvancement() {
        this.updateProgressBar();
        this.populateEtatAvancementFilters();
        const dataArr = this.getFilteredEtatOperations();
        const communes = dataArr.map(x => x.commune);
        const etats = dataArr.map(x => x.etat_d_avancement || "Non défini");

        if (window.chartManager) {
            window.chartManager.createEtatCommuneBarChart('etatCommuneBarChart', communes, etats);
            const etatCounts = dataArr.reduce((acc, op) => {
                const key = op.etat_d_avancement?.trim() || "Non défini";
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            window.chartManager.createEtatDonutChart(
                'etatDonutChart',
                Object.keys(etatCounts),
                Object.values(etatCounts)
            );
        }

        this.renderEtatTimeline();
    }

    renderProjections() {
        console.log('Rendu de la section Projections');
        this.updateProjectionsKPIs();
        this.createObjectifsChart();
        this.renderPerformanceList();
    }

    renderGenre() {
        console.log('Rendu de la section Genre');
        this.updateGenreKPIs();
        this.createGenreGlobalChart();
        this.createGenreTrimestreChart();
        this.createGenreCommuneChart();
    }

    renderRapport() {
        console.log('Rendu de la section Rapport');
        const data = this.data.rapportComplet || {};
        const wrap = document.getElementById("rapportKpiGrid");
        if (wrap) {
            wrap.innerHTML = "";
            (data["Synthèse Globale"] || []).forEach(kpi => {
                const card = document.createElement("div");
                card.className = "kpi-card";
                card.innerHTML = `
                    <div class="kpi-header">
                        <h3>${kpi.indicateur}</h3>
                        <span class="kpi-icon">📊</span>
                    </div>
                    <div class="kpi-value">${kpi.valeur.toLocaleString?.() ?? kpi.valeur}</div>
                    <div class="kpi-subtitle">Données complètes</div>
                `;
                wrap.appendChild(card);
            });
        }

        this.renderRapportCharts(data);
    }

    renderRapportCharts(data) {
        if (!window.chartManager) {
            console.error('ChartManager non disponible');
            return;
        }

        try {
            // Graphique sources
            const src = data["Détail par Source"] || [];
            if (src.length > 0) {
                window.chartManager.createStackedBar("rapportSourceChart", {
                    labels: src.map(s => s.source || 'Source inconnue'),
                    datasets: [
                        {
                            label: "Hommes",
                            data: src.map(s => s.hommes || 0),
                            backgroundColor: this.colors.secondary
                        },
                        {
                            label: "Femmes",
                            data: src.map(s => s.femmes || 0),
                            backgroundColor: this.colors.primary
                        }
                    ]
                });
            }

            // Mixed Top 10 Communes
            const communesData = (data["Analyse par Commune"] || [])
                .sort((a, b) => (b.total || 0) - (a.total || 0))
                .slice(0, 10);
            if (communesData.length > 0) {
                window.chartManager.createMixedChart("rapportCommuneMixedChart", communesData);
            }

            // Évolution temporelle
            const temporal = data["Analyse Temporelle"] || [];
            if (temporal.length > 0) {
                window.chartManager.createTemporalChart("rapportTemporalChart", temporal);
            }

            // Graphique polaire par région
            const regions = (data["Tamba-Kédougou"] || []).filter(r => r.nom || r.region);
            if (regions.length > 0) {
                window.chartManager.createPolarChart("rapportRegionPolarChart", {
                    labels: regions.map(r => r.nom || r.region || 'Région inconnue'),
                    datasets: [{
                        data: regions.map(r => r.total || r.valeur || 0),
                        backgroundColor: this.colors.chartColors.map(color => color + '80'),
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                }, {
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                font: { size: 12 },
                                color: '#374151',
                                generateLabels: chart => chart.data.labels.map((label, i) => ({
                                    text: label,
                                    fillStyle: chart.data.datasets[0].backgroundColor[i],
                                    strokeStyle: chart.data.datasets[0].borderColor,
                                    lineWidth: 2
                                }))
                            }
                        }
                    },
                    scales: {
                        r: {
                            grid: {
                                color: '#374151',
                                lineWidth: 1,
                                z: 1
                            },
                            ticks: {
                                color: '#374151',
                                backdropColor: 'transparent',
                                z: 2
                            },
                            pointLabels: {
                                color: '#374151',
                                font: { size: 12 },
                                z: 3
                            }
                        }
                    }
                });
            } else {
                console.warn('Aucune donnée régionale valide, utilisation d\'un graphique donut');
                window.chartManager.createDoughnut("rapportRegionPolarChart", {
                    labels: ['Aucune donnée'],
                    datasets: [{
                        data: [1],
                        backgroundColor: [this.colors.error],
                        borderWidth: 0
                    }]
                });
            }
        } catch (error) {
            console.error('Erreur lors du rendu des graphiques de rapport:', error);
            this.showError('Erreur lors de l\'affichage des graphiques du rapport');
        }
    }

    renderStatsTopo() {
        console.log('Rendu de la section Stats Topo');
        this.applyTopoFilters();
        this.updateTopoKPIs();
        this.createTopoCharts();
        this.renderTopoTable();
        this.renderTopoTimeline();
    }

    renderPostTraitement() {
        console.log('Rendu de la section Post-Traitement');
        this.populatePostFilters();
        this.renderPostTraitementTable();
        this.createPostCharts();
    }

/**
 * Version améliorée de la fonction exportGenreReport avec :
 * - Graphiques plus grands et mieux proportionnés
 * - Correction des nombres (suppression des "/")
 * - Design moderne et attrayant
 * - Analyse dynamique et recommandations
 */
async exportGenreReport() {
    try {
        await this.ensureGenreDataLoaded();

        // Charger rapport_complet.json si pas déjà fait
        if (!this.data.rapportComplet || Object.keys(this.data.rapportComplet).length === 0) {
            await this.loadDataSafely('data/rapport_complet.json', 'rapportComplet');
        }

        const reportData = this.data.rapportComplet || {};
        console.log('Données du rapport:', reportData);

        // IDs des graphiques de la section rapport
        const chartConfigs = [
            { id: 'rapportSourceChart', title: 'Détail par Source', section: 'Détail par Source' },
            { id: 'rapportCommuneMixedChart', title: 'Analyse par Commune', section: 'Analyse par Commune' },
            { id: 'rapportTemporalChart', title: 'Évolution Temporelle', section: 'Analyse Temporelle' },
            { id: 'rapportRegionPolarChart', title: 'Répartition par Région', section: 'Tamba-Kédougou' }
        ];

        // Capture des graphiques avec haute résolution et taille optimisée
        const chartImages = [];
        for (const config of chartConfigs) {
            const canvas = document.getElementById(config.id);
            
            if (canvas && canvas.tagName === 'CANVAS') {
                // Attendre que le graphique soit complètement rendu
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Créer un canvas temporaire avec meilleure résolution
                const originalWidth = canvas.width;
                const originalHeight = canvas.height;
                
                // Créer un canvas haute résolution
                const tempCanvas = document.createElement('canvas');
                const scale = 3; // Facteur d'échelle pour la qualité
                tempCanvas.width = originalWidth * scale;
                tempCanvas.height = originalHeight * scale;
                
                const tempContext = tempCanvas.getContext('2d');
                tempContext.scale(scale, scale);
                tempContext.imageSmoothingEnabled = true;
                tempContext.imageSmoothingQuality = 'high';
                tempContext.drawImage(canvas, 0, 0);
                
                const chartImg = tempCanvas.toDataURL('image/png', 1.0);
                
                if (chartImg && chartImg.length > 100 && !chartImg.includes('data:,')) {
                    chartImages.push({
                        image: chartImg,
                        title: config.title,
                        section: config.section,
                        originalWidth: originalWidth,
                        originalHeight: originalHeight
                    });
                    console.log(`✅ Graphique capturé: ${config.id}`);
                } else {
                    console.warn(`⚠️ Échec capture: ${config.id}`);
                }
            } else {
                console.warn(`⚠️ Canvas non trouvé: ${config.id}`);
            }
        }

        console.log(`📊 ${chartImages.length} graphiques capturés sur ${chartConfigs.length}`);

        // Génération PDF avec design moderne
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ 
            orientation: 'portrait', 
            unit: 'pt', 
            format: 'a4' 
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 30;
        const contentWidth = pageWidth - (2 * margin);

        // Fonction utilitaire pour corriger les nombres
        const formatNumber = (value) => {
            if (value === null || value === undefined) return '0';
            
            if (typeof value === 'string') {
                // Nettoyer les chaînes avec des / et espaces
                return value
                    .replace(/\s*\/\s*/g, ' ') // Remplacer / par espace
                    .replace(/\s+/g, ' ')      // Normaliser les espaces multiples
                    .trim();
            }
            
            if (typeof value === 'number') {
                return value.toLocaleString('fr-FR');
            }
            
            return String(value).replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
        };

        // Fonction pour nettoyer récursivement toutes les valeurs d'un objet
        const cleanDataObject = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(item => cleanDataObject(item));
            }
            
            if (obj && typeof obj === 'object') {
                const cleaned = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'string' && value.includes('/')) {
                        cleaned[key] = formatNumber(value);
                    } else if (typeof value === 'object') {
                        cleaned[key] = cleanDataObject(value);
                    } else {
                        cleaned[key] = value;
                    }
                }
                return cleaned;
            }
            
            return obj;
        };

        // Nettoyer toutes les données du rapport
        const cleanedReportData = cleanDataObject(reportData);

        // Page de couverture moderne
        this.createCoverPage(doc, pageWidth, pageHeight, margin);

        // Page de synthèse avec analyse
        doc.addPage();
        let currentY = this.createSynthesisPage(doc, cleanedReportData, pageWidth, pageHeight, margin, formatNumber);

        // Ajout des graphiques avec analyse
        for (let index = 0; index < chartImages.length; index++) {
            const chartData = chartImages[index];
            
            // Nouvelle page pour chaque graphique
            doc.addPage();
            currentY = 50;

            // Titre de section avec style moderne
            doc.setFillColor(30, 58, 138);
            doc.rect(margin, currentY - 10, contentWidth, 35, 'F');
            
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text(chartData.title, margin + 15, currentY + 15);
            currentY += 50;

            // Graphique plus grand (80% de la largeur de page)
            const maxGraphWidth = contentWidth * 0.85;
            const maxGraphHeight = 280; // Augmenté
            
            let graphWidth = Math.min(maxGraphWidth, chartData.originalWidth * 0.8);
            let graphHeight = (graphWidth / chartData.originalWidth) * chartData.originalHeight;
            
            if (graphHeight > maxGraphHeight) {
                graphHeight = maxGraphHeight;
                graphWidth = (graphHeight / chartData.originalHeight) * chartData.originalWidth;
            }

            const graphX = (pageWidth - graphWidth) / 2;

            // Ajout d'un cadre subtil autour du graphique
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(1);
            doc.rect(graphX - 5, currentY - 5, graphWidth + 10, graphHeight + 10);

            // Ajouter le graphique centré et plus grand
            doc.addImage(chartData.image, 'PNG', graphX, currentY, graphWidth, graphHeight);
            currentY += graphHeight + 25;

            // Tableau de données avec style amélioré
            let tableData = this.getEnhancedTableDataForChart(chartData.section, cleanedReportData, formatNumber);
            
            if (tableData.length > 1) {
                doc.autoTable({
                    head: [tableData[0]],
                    body: tableData.slice(1),
                    startY: currentY,
                    margin: { left: margin, right: margin },
                    headStyles: { 
                        fillColor: [212, 165, 116],
                        textColor: [255, 255, 255],
                        fontSize: 12,
                        halign: 'center',
                        fontStyle: 'bold'
                    },
                    styles: { 
                        fontSize: 10,
                        cellPadding: 8,
                        lineColor: [220, 220, 220],
                        lineWidth: 0.5,
                        overflow: 'linebreak'
                    },
                    alternateRowStyles: { 
                        fillColor: [248, 250, 252] 
                    },
                    columnStyles: {
                        1: { halign: 'right' },
                        2: { halign: 'center' }
                    }
                });
                currentY = doc.lastAutoTable.finalY + 30;
            }

            // Ajouter l'analyse et recommandations pour cette section
            this.addSectionAnalysis(doc, chartData.section, cleanedReportData, currentY, margin, contentWidth, formatNumber);
        }

        // Page de recommandations générales
        doc.addPage();
        this.createRecommendationsPage(doc, cleanedReportData, pageWidth, pageHeight, margin, formatNumber);

        // Pied de page moderne pour toutes les pages
        this.addAdvancedFooters(doc, pageWidth, pageHeight, margin);

        // Sauvegarder le PDF
        const fileName = `Rapport_Genre_PROCASEF_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);

        // Message de succès amélioré
        const successMsg = `🎉 Rapport genre généré avec succès !
        
📈 Fonctionnalités incluses :
• ${chartImages.length} graphiques haute résolution
• Analyse dynamique des données
• Recommandations personnalisées
• Design moderne et professionnel

📊 Graphiques inclus :
${chartImages.map(c => `  ✓ ${c.title}`).join('\n')}

💾 Fichier sauvegardé : ${fileName}`;
        
        alert(successMsg);

    } catch (err) {
        console.error('❌ Erreur export genre :', err);
        this.showError('Échec de la génération du rapport genre. Vérifiez la console pour plus de détails.');
    }
}

/**
 * Version améliorée de la fonction exportGenreReport avec :
 * - Graphiques plus grands et mieux proportionnés
 * - Correction des nombres (suppression des "/")
 * - Design moderne et attrayant
 * - Analyse dynamique et recommandations
 */
async exportGenreReport() {
    try {
        // Vérifier ou charger les données nécessaires
        if (!this.data.rapportComplet || Object.keys(this.data.rapportComplet).length === 0) {
            console.log('Chargement des données du rapport...');
            try {
                await this.loadDataSafely('data/rapport_complet.json', 'rapportComplet');
            } catch (error) {
                console.warn('Impossible de charger rapport_complet.json, utilisation des données existantes');
            }
        }

        const reportData = this.data.rapportComplet || {};
        console.log('Données du rapport:', reportData);

        // IDs des graphiques de la section rapport
        const chartConfigs = [
            { id: 'rapportSourceChart', title: 'Détail par Source', section: 'Détail par Source' },
            { id: 'rapportCommuneMixedChart', title: 'Analyse par Commune', section: 'Analyse par Commune' },
            { id: 'rapportTemporalChart', title: 'Évolution Temporelle', section: 'Analyse Temporelle' },
            { id: 'rapportRegionPolarChart', title: 'Répartition par Région', section: 'Tamba-Kédougou' }
        ];

        // Capture des graphiques avec haute résolution et taille optimisée
        const chartImages = [];
        for (const config of chartConfigs) {
            const canvas = document.getElementById(config.id);
            
            if (canvas && canvas.tagName === 'CANVAS') {
                // Attendre que le graphique soit complètement rendu
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Créer un canvas temporaire avec meilleure résolution
                const originalWidth = canvas.width;
                const originalHeight = canvas.height;
                
                // Créer un canvas haute résolution
                const tempCanvas = document.createElement('canvas');
                const scale = 3; // Facteur d'échelle pour la qualité
                tempCanvas.width = originalWidth * scale;
                tempCanvas.height = originalHeight * scale;
                
                const tempContext = tempCanvas.getContext('2d');
                tempContext.scale(scale, scale);
                tempContext.imageSmoothingEnabled = true;
                tempContext.imageSmoothingQuality = 'high';
                tempContext.drawImage(canvas, 0, 0);
                
                const chartImg = tempCanvas.toDataURL('image/png', 1.0);
                
                if (chartImg && chartImg.length > 100 && !chartImg.includes('data:,')) {
                    chartImages.push({
                        image: chartImg,
                        title: config.title,
                        section: config.section,
                        originalWidth: originalWidth,
                        originalHeight: originalHeight
                    });
                    console.log(`✅ Graphique capturé: ${config.id}`);
                } else {
                    console.warn(`⚠️ Échec capture: ${config.id}`);
                }
            } else {
                console.warn(`⚠️ Canvas non trouvé: ${config.id}`);
            }
        }

        console.log(`📊 ${chartImages.length} graphiques capturés sur ${chartConfigs.length}`);

        // Génération PDF avec design moderne
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ 
            orientation: 'portrait', 
            unit: 'pt', 
            format: 'a4' 
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 30;
        const contentWidth = pageWidth - (2 * margin);

        // Fonction utilitaire pour corriger les nombres
        const formatNumber = (value) => {
            if (value === null || value === undefined) return '0';
            
            if (typeof value === 'string') {
                // Nettoyer les chaînes avec des / et espaces
                return value
                    .replace(/\s*\/\s*/g, ' ') // Remplacer / par espace
                    .replace(/\s+/g, ' ')      // Normaliser les espaces multiples
                    .trim();
            }
            
            if (typeof value === 'number') {
                return value.toLocaleString('fr-FR');
            }
            
            return String(value).replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
        };

        // Fonction pour nettoyer récursivement toutes les valeurs d'un objet
        const cleanDataObject = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(item => cleanDataObject(item));
            }
            
            if (obj && typeof obj === 'object') {
                const cleaned = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'string' && value.includes('/')) {
                        cleaned[key] = formatNumber(value);
                    } else if (typeof value === 'object') {
                        cleaned[key] = cleanDataObject(value);
                    } else {
                        cleaned[key] = value;
                    }
                }
                return cleaned;
            }
            
            return obj;
        };

        // Nettoyer toutes les données du rapport
        const cleanedReportData = cleanDataObject(reportData);

        // Page de couverture moderne
        this.createCoverPage(doc, pageWidth, pageHeight, margin);

        // Page de synthèse avec analyse
        doc.addPage();
        let currentY = this.createSynthesisPage(doc, cleanedReportData, pageWidth, pageHeight, margin, formatNumber);

        // Ajout des graphiques avec analyse
        for (let index = 0; index < chartImages.length; index++) {
            const chartData = chartImages[index];
            
            // Nouvelle page pour chaque graphique
            doc.addPage();
            currentY = 50;

            // Titre de section avec style moderne
            doc.setFillColor(30, 58, 138);
            doc.rect(margin, currentY - 10, contentWidth, 35, 'F');
            
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text(chartData.title, margin + 15, currentY + 15);
            currentY += 50;

            // Graphique plus grand (80% de la largeur de page)
            const maxGraphWidth = contentWidth * 0.85;
            const maxGraphHeight = 280; // Augmenté
            
            let graphWidth = Math.min(maxGraphWidth, chartData.originalWidth * 0.8);
            let graphHeight = (graphWidth / chartData.originalWidth) * chartData.originalHeight;
            
            if (graphHeight > maxGraphHeight) {
                graphHeight = maxGraphHeight;
                graphWidth = (graphHeight / chartData.originalHeight) * chartData.originalWidth;
            }

            const graphX = (pageWidth - graphWidth) / 2;

            // Ajout d'un cadre subtil autour du graphique
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(1);
            doc.rect(graphX - 5, currentY - 5, graphWidth + 10, graphHeight + 10);

            // Ajouter le graphique centré et plus grand
            doc.addImage(chartData.image, 'PNG', graphX, currentY, graphWidth, graphHeight);
            currentY += graphHeight + 25;

            // Tableau de données avec style amélioré
            let tableData = this.getEnhancedTableDataForChart(chartData.section, cleanedReportData, formatNumber);
            
            if (tableData.length > 1) {
                doc.autoTable({
                    head: [tableData[0]],
                    body: tableData.slice(1),
                    startY: currentY,
                    margin: { left: margin, right: margin },
                    headStyles: { 
                        fillColor: [212, 165, 116],
                        textColor: [255, 255, 255],
                        fontSize: 12,
                        halign: 'center',
                        fontStyle: 'bold'
                    },
                    styles: { 
                        fontSize: 10,
                        cellPadding: 8,
                        lineColor: [220, 220, 220],
                        lineWidth: 0.5,
                        overflow: 'linebreak'
                    },
                    alternateRowStyles: { 
                        fillColor: [248, 250, 252] 
                    },
                    columnStyles: {
                        1: { halign: 'right' },
                        2: { halign: 'center' }
                    }
                });
                currentY = doc.lastAutoTable.finalY + 30;
            }

            // Ajouter l'analyse et recommandations pour cette section
            this.addSectionAnalysis(doc, chartData.section, cleanedReportData, currentY, margin, contentWidth, formatNumber);
        }

        // Page de recommandations générales
        doc.addPage();
        this.createRecommendationsPage(doc, cleanedReportData, pageWidth, pageHeight, margin, formatNumber);

        // Pied de page moderne pour toutes les pages
        this.addAdvancedFooters(doc, pageWidth, pageHeight, margin);

        // Sauvegarder le PDF
        const fileName = `Rapport_Genre_PROCASEF_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);

        // Message de succès amélioré
        const successMsg = `🎉 Rapport genre généré avec succès !
        
📈 Fonctionnalités incluses :
• ${chartImages.length} graphiques haute résolution
• Analyse dynamique des données
• Recommandations personnalisées
• Design moderne et professionnel

📊 Graphiques inclus :
${chartImages.map(c => `  ✓ ${c.title}`).join('\n')}

💾 Fichier sauvegardé : ${fileName}`;
        
        alert(successMsg);

    } catch (err) {
        console.error('❌ Erreur export genre :', err);
        
        // Message d'erreur plus informatif
        let errorMsg = 'Échec de la génération du rapport genre.\n\n';
        
        if (err.message && err.message.includes('jsPDF')) {
            errorMsg += '❌ Bibliothèque jsPDF non trouvée.\n';
            errorMsg += 'Assurez-vous que jsPDF est chargée dans votre page.';
        } else if (err.message && err.message.includes('Canvas')) {
            errorMsg += '❌ Impossible de capturer les graphiques.\n';
            errorMsg += 'Vérifiez que les graphiques sont affichés sur la page.';
        } else {
            errorMsg += `Erreur: ${err.message}\n`;
            errorMsg += 'Vérifiez la console pour plus de détails.';
        }
        
        alert(errorMsg);
    }
}

/**
 * Version améliorée pour l'export Word avec données nettoyées
 */
async exportGenreWordReport() {
    try {
        await this.ensureGenreDataLoaded();

        if (!this.data.rapportComplet || Object.keys(this.data.rapportComplet).length === 0) {
            await this.loadDataSafely('data/rapport_complet.json', 'rapportComplet');
        }

        const reportData = this.data.rapportComplet || {};
        
        // Fonction pour nettoyer les données
        const formatNumber = (value) => {
            if (value === null || value === undefined) return '0';
            
            if (typeof value === 'string') {
                return value
                    .replace(/\s*\/\s*/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
            
            if (typeof value === 'number') {
                return value.toLocaleString('fr-FR');
            }
            
            return String(value).replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
        };

        // Nettoyer les données
        const cleanDataObject = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(item => cleanDataObject(item));
            }
            
            if (obj && typeof obj === 'object') {
                const cleaned = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (typeof value === 'string' && value.includes('/')) {
                        cleaned[key] = formatNumber(value);
                    } else if (typeof value === 'object') {
                        cleaned[key] = cleanDataObject(value);
                    } else {
                        cleaned[key] = value;
                    }
                }
                return cleaned;
            }
            
            return obj;
        };

        const cleanedReportData = cleanDataObject(reportData);

        // Créer le document Word
        const doc = new window.docx.Document({
            creator: "PROCASEF Dashboard",
            title: "Rapport Genre - PROCASEF Boundou",
            description: "Analyse de la répartition genre dans le programme PROCASEF",
            styles: {
                paragraphStyles: [{
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 28,
                        bold: true,
                        color: "1e3a8a"
                    },
                    paragraph: {
                        spacing: { after: 300 }
                    }
                }, {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        size: 20,
                        bold: true,
                        color: "d4a574"
                    },
                    paragraph: {
                        spacing: { before: 240, after: 120 }
                    }
                }]
            },
            sections: [{
                properties: {},
                children: [
                    // Titre principal
                    new window.docx.Paragraph({
                        alignment: window.docx.AlignmentType.CENTER,
                        children: [
                            new window.docx.TextRun({
                                text: "RAPPORT GENRE",
                                bold: true,
                                size: 32,
                                color: "1e3a8a"
                            })
                        ]
                    }),
                    new window.docx.Paragraph({
                        alignment: window.docx.AlignmentType.CENTER,
                        children: [
                            new window.docx.TextRun({
                                text: "PROCASEF Boundou",
                                size: 24,
                                color: "d4a574"
                            })
                        ]
                    }),
                    new window.docx.Paragraph({
                        alignment: window.docx.AlignmentType.CENTER,
                        children: [
                            new window.docx.TextRun({
                                text: `Généré le ${new Date().toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}`,
                                size: 16,
                                italics: true
                            })
                        ]
                    }),
                    
                    // Saut de page
                    new window.docx.Paragraph({
                        children: [
                            new window.docx.PageBreak()
                        ]
                    }),

                    // Synthèse exécutive
                    new window.docx.Paragraph({
                        style: "Heading1",
                        children: [
                            new window.docx.TextRun({
                                text: "📊 SYNTHÈSE EXÉCUTIVE"
                            })
                        ]
                    }),

                    // Statistiques globales
                    ...this.createWordStatsTable(cleanedReportData, formatNumber),

                    // Analyse automatique
                    new window.docx.Paragraph({
                        style: "Heading2",
                        children: [
                            new window.docx.TextRun({
                                text: "🔍 ANALYSE AUTOMATIQUE"
                            })
                        ]
                    }),

                    new window.docx.Paragraph({
                        children: [
                            new window.docx.TextRun({
                                text: this.generateWordAnalysis(cleanedReportData)
                            })
                        ]
                    }),

                    // Détail par section
                    ...this.createWordSectionContent(cleanedReportData, formatNumber),

                    // Recommandations
                    new window.docx.Paragraph({
                        children: [
                            new window.docx.PageBreak()
                        ]
                    }),

                    new window.docx.Paragraph({
                        style: "Heading1",
                        children: [
                            new window.docx.TextRun({
                                text: "🎯 RECOMMANDATIONS STRATÉGIQUES"
                            })
                        ]
                    }),

                    ...this.createWordRecommendations(cleanedReportData)
                ]
            }]
        });

        // Générer et télécharger le fichier Word
        const blob = await window.docx.Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rapport_Genre_PROCASEF_${new Date().toISOString().slice(0, 10)}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('✅ Rapport Word généré avec succès !');

    } catch (err) {
        console.error('❌ Erreur export Word :', err);
        
        let errorMsg = 'Erreur lors de la génération du rapport Word.\n\n';
        
        if (err.message && err.message.includes('docx')) {
            errorMsg += '❌ Bibliothèque docx non trouvée.\n';
            errorMsg += 'Assurez-vous que la bibliothèque docx est chargée dans votre page.';
        } else {
            errorMsg += `Erreur: ${err.message}\n`;
            errorMsg += 'Vérifiez la console pour plus de détails.';
        }
        
        alert(errorMsg);
    }
}

/**
 * Crée une page de couverture moderne
 */
createCoverPage(doc, pageWidth, pageHeight, margin) {
    // Gradient de fond (simulé avec des rectangles)
    const gradientSteps = 50;
    for (let i = 0; i < gradientSteps; i++) {
        const alpha = i / gradientSteps;
        const blue = Math.round(30 + (200 - 30) * alpha);
        doc.setFillColor(blue, blue + 20, 138 + alpha * 100);
        doc.rect(0, i * (pageHeight / gradientSteps), pageWidth, pageHeight / gradientSteps, 'F');
    }

    // Titre principal
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    const mainTitle = 'RAPPORT GENRE';
    const mainTitleWidth = doc.getTextWidth(mainTitle);
    doc.text(mainTitle, (pageWidth - mainTitleWidth) / 2, 200);

    // Sous-titre
    doc.setFontSize(20);
    const subTitle = 'PROCASEF Boundou';
    const subTitleWidth = doc.getTextWidth(subTitle);
    doc.text(subTitle, (pageWidth - subTitleWidth) / 2, 240);

    // Date et informations
    doc.setFontSize(14);
    const dateText = `Généré le ${new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, (pageWidth - dateWidth) / 2, 400);

    // Version et footer
    doc.setFontSize(12);
    doc.setTextColor(220, 220, 220);
    const versionText = 'Version 2.0 - Analyse Avancée';
    const versionWidth = doc.getTextWidth(versionText);
    doc.text(versionText, (pageWidth - versionWidth) / 2, pageHeight - 60);
}

/**
 * Crée la page de synthèse avec KPIs
 */
createSynthesisPage(doc, reportData, pageWidth, pageHeight, margin, formatNumber) {
    let currentY = 50;

    // Titre de section
    doc.setFillColor(212, 165, 116);
    doc.rect(margin, currentY - 10, pageWidth - 2 * margin, 35, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('📊 SYNTHÈSE EXÉCUTIVE', margin + 15, currentY + 15);
    currentY += 60;

    // Statistiques globales avec design KPI
    const globalStats = reportData['Synthèse Globale'] || [];
    const hommes = globalStats.find(item => item.indicateur === 'Hommes')?.valeur || 43576;
    const femmes = globalStats.find(item => item.indicateur === 'Femmes')?.valeur || 9332;
    const total = hommes + femmes;
    const femmesPourcentage = ((femmes / total) * 100).toFixed(1);

    // KPI Cards
    this.createKPICard(doc, margin, currentY, 'TOTAL BÉNÉFICIAIRES', formatNumber(total), '#1e40af');
    this.createKPICard(doc, margin + 180, currentY, 'FEMMES', formatNumber(femmes), '#dc2626');
    this.createKPICard(doc, margin + 360, currentY, '% FEMMES', femmesPourcentage + '%', '#059669');
    
    currentY += 100;

    // Analyse automatique des données
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    doc.text('🔍 ANALYSE AUTOMATIQUE', margin, currentY);
    currentY += 25;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    // Analyse du ratio genre
    let analysis = this.generateGenderAnalysis(hommes, femmes, femmesPourcentage);
    const analysisLines = doc.splitTextToSize(analysis, pageWidth - 2 * margin);
    doc.text(analysisLines, margin, currentY);
    currentY += analysisLines.length * 15 + 20;

    return currentY;
}

/**
 * Crée les statistiques globales pour Word
 */
createWordStatsTable(reportData, formatNumber) {
    const globalStats = reportData['Synthèse Globale'] || [];
    const hommes = globalStats.find(item => item.indicateur === 'Hommes')?.valeur || 43576;
    const femmes = globalStats.find(item => item.indicateur === 'Femmes')?.valeur || 9332;
    const total = hommes + femmes;
    const femmesPourcentage = ((femmes / total) * 100).toFixed(1);

    return [
        new window.docx.Table({
            rows: [
                new window.docx.TableRow({
                    children: [
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: "Indicateur", bold: true })]
                            })]
                        }),
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: "Valeur", bold: true })]
                            })]
                        }),
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: "Pourcentage", bold: true })]
                            })]
                        })
                    ]
                }),
                new window.docx.TableRow({
                    children: [
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: "Hommes" })]
                            })]
                        }),
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: formatNumber(hommes) })]
                            })]
                        }),
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: (100 - parseFloat(femmesPourcentage)).toFixed(1) + "%" })]
                            })]
                        })
                    ]
                }),
                new window.docx.TableRow({
                    children: [
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: "Femmes" })]
                            })]
                        }),
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: formatNumber(femmes) })]
                            })]
                        }),
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: femmesPourcentage + "%" })]
                            })]
                        })
                    ]
                }),
                new window.docx.TableRow({
                    children: [
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: "Total", bold: true })]
                            })]
                        }),
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: formatNumber(total), bold: true })]
                            })]
                        }),
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: "100%", bold: true })]
                            })]
                        })
                    ]
                })
            ]
        }),
        new window.docx.Paragraph({ text: "" }) // Espacement
    ];
}

/**
 * Génère l'analyse pour le document Word
 */
generateWordAnalysis(reportData) {
    const globalStats = reportData['Synthèse Globale'] || [];
    const femmes = globalStats.find(item => item.indicateur === 'Femmes')?.valeur || 9332;
    const total = globalStats.find(item => item.indicateur === 'Total Personnes')?.valeur || 52908;
    const femmesPourcentage = ((femmes / total) * 100).toFixed(1);

    let analysis = "";
    
    if (femmesPourcentage < 20) {
        analysis = `⚠️ ALERTE : La représentation féminine est critiquement faible (${femmesPourcentage}%). Cette situation indique une inégalité genre majeure nécessitant des actions correctives urgentes.`;
    } else if (femmesPourcentage < 30) {
        analysis = `📉 La représentation féminine (${femmesPourcentage}%) reste en dessous des standards internationaux. Des efforts supplémentaires sont nécessaires pour atteindre un équilibre genre acceptable.`;
    } else if (femmesPourcentage < 40) {
        analysis = `📈 La participation féminine (${femmesPourcentage}%) montre des progrès encourageants. Continuez les efforts pour atteindre la parité recommandée de 40-60%.`;
    } else if (femmesPourcentage <= 60) {
        analysis = `✅ Excellent ! La représentation féminine (${femmesPourcentage}%) respecte les standards de parité genre. Maintenez ces bonnes pratiques.`;
    }

    return analysis;
}

/**
 * Crée le contenu des sections pour Word
 */
createWordSectionContent(reportData, formatNumber) {
    const content = [];
    
    // Détail par Source
    content.push(
        new window.docx.Paragraph({
            children: [new window.docx.PageBreak()]
        }),
        new window.docx.Paragraph({
            style: "Heading1",
            children: [new window.docx.TextRun({ text: "📊 DÉTAIL PAR SOURCE" })]
        })
    );

    const sourceData = reportData['Détail par Source'] || [];
    if (sourceData.length > 0) {
        const sourceTable = new window.docx.Table({
            rows: [
                new window.docx.TableRow({
                    children: [
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: "Source/Genre", bold: true })]
                            })]
                        }),
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: "Bénéficiaires", bold: true })]
                            })]
                        }),
                        new window.docx.TableCell({
                            children: [new window.docx.Paragraph({
                                children: [new window.docx.TextRun({ text: "Pourcentage", bold: true })]
                            })]
                        })
                    ]
                }),
                ...sourceData.flatMap(item => [
                    new window.docx.TableRow({
                        children: [
                            new window.docx.TableCell({
                                children: [new window.docx.Paragraph({
                                    children: [new window.docx.TextRun({ text: `${item.source} - Hommes` })]
                                })]
                            }),
                            new window.docx.TableCell({
                                children: [new window.docx.Paragraph({
                                    children: [new window.docx.TextRun({ text: formatNumber(item.hommes) })]
                                })]
                            }),
                            new window.docx.TableCell({
                                children: [new window.docx.Paragraph({
                                    children: [new window.docx.TextRun({ text: `${(item.hommes_1 || 0).toFixed(1)}%` })]
                                })]
                            })
                        ]
                    }),
                    new window.docx.TableRow({
                        children: [
                            new window.docx.TableCell({
                                children: [new window.docx.Paragraph({
                                    children: [new window.docx.TextRun({ text: `${item.source} - Femmes` })]
                                })]
                            }),
                            new window.docx.TableCell({
                                children: [new window.docx.Paragraph({
                                    children: [new window.docx.TextRun({ text: formatNumber(item.femmes) })]
                                })]
                            }),
                            new window.docx.TableCell({
                                children: [new window.docx.Paragraph({
                                    children: [new window.docx.TextRun({ text: `${(item.femmes_1 || 0).toFixed(1)}%` })]
                                })]
                            })
                        ]
                    })
                ])
            ]
        });
        content.push(sourceTable);
    }

    return content;
}

/**
 * Crée les recommandations pour Word
 */
createWordRecommendations(reportData) {
    const recommendations = this.generateStrategicRecommendations(reportData);
    const content = [];

    recommendations.forEach((rec, index) => {
        content.push(
            new window.docx.Paragraph({
                style: "Heading2",
                children: [
                    new window.docx.TextRun({ text: `${index + 1}. ${rec.title}` })
                ]
            }),
            new window.docx.Paragraph({
                children: [
                    new window.docx.TextRun({ text: rec.description })
                ]
            }),
            new window.docx.Paragraph({ text: "" }) // Espacement
        );
    });

    return content;
}

/**
 * Crée une carte KPI moderne
 */
createKPICard(doc, x, y, title, value, color) {
    // Fond de la carte
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, 160, 80, 5, 5, 'F');
    
    // Bordure colorée
    doc.setDrawColor(color);
    doc.setLineWidth(3);
    doc.line(x, y, x + 160, y);
    
    // Titre
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(title, x + 10, y + 20);
    
    // Valeur
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(value, x + 10, y + 50);
}

/**
 * Génère une analyse automatique du ratio genre
 */
generateGenderAnalysis(hommes, femmes, femmesPourcentage) {
    let analysis = "";
    
    if (femmesPourcentage < 20) {
        analysis = `⚠️ ALERTE : La représentation féminine est critiquement faible (${femmesPourcentage}%). `;
        analysis += "Cette situation indique une inégalité genre majeure nécessitant des actions correctives urgentes.";
    } else if (femmesPourcentage < 30) {
        analysis = `📉 La représentation féminine (${femmesPourcentage}%) reste en dessous des standards internationaux. `;
        analysis += "Des efforts supplémentaires sont nécessaires pour atteindre un équilibre genre acceptable.";
    } else if (femmesPourcentage < 40) {
        analysis = `📈 La participation féminine (${femmesPourcentage}%) montre des progrès encourageants. `;
        analysis += "Continuez les efforts pour atteindre la parité recommandée de 40-60%.";
    } else if (femmesPourcentage <= 60) {
        analysis = `✅ Excellent ! La représentation féminine (${femmesPourcentage}%) respecte les standards de parité genre. `;
        analysis += "Maintenez ces bonnes pratiques.";
    } else {
        analysis = `📊 La représentation féminine (${femmesPourcentage}%) est élevée. `;
        analysis += "Assurez-vous que cette situation reflète un choix équitable et non une discrimination inverse.";
    }

    return analysis;
}

/**
 * Ajoute une analyse spécifique à chaque section
 */
addSectionAnalysis(doc, section, reportData, startY, margin, contentWidth, formatNumber) {
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, startY, contentWidth, 2, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('💡 ANALYSE & INSIGHTS', margin, startY + 25);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    let analysis = this.generateSectionAnalysis(section, reportData);
    const analysisLines = doc.splitTextToSize(analysis, contentWidth - 20);
    doc.text(analysisLines, margin + 10, startY + 45);
}

/**
 * Génère une analyse spécifique par section
 */
generateSectionAnalysis(section, reportData) {
    switch (section) {
        case 'Détail par Source':
            const sourceData = reportData['Détail par Source'] || [];
            if (sourceData.length > 0) {
                const individuels = sourceData.find(s => s.source === 'Individuel');
                const collectifs = sourceData.find(s => s.source === 'Collectif');
                
                if (individuels && collectifs) {
                    const indivFemmes = individuels.femmes_1 || 0;
                    const collFemmes = collectifs.femmes_1 || 0;
                    
                    if (indivFemmes > collFemmes) {
                        return `Les projets individuels montrent une meilleure participation féminine (${indivFemmes}%) comparés aux projets collectifs (${collFemmes}%). Recommandation : Promouvoir davantage les approches individuelles pour améliorer l'inclusion des femmes.`;
                    } else {
                        return `Les projets collectifs favorisent mieux la participation féminine (${collFemmes}%) que les projets individuels (${indivFemmes}%). Recommandation : Renforcer les initiatives collectives tout en améliorant l'accès individuel pour les femmes.`;
                    }
                }
            }
            return "Analyse des sources de financement pour identifier les mécanismes les plus inclusifs.";

        case 'Analyse par Commune':
            const communeData = reportData['Analyse par Commune'] || [];
            if (communeData.length > 0) {
                const sorted = communeData.sort((a, b) => (b.femme_pourcentage || 0) - (a.femme_pourcentage || 0));
                const meilleure = sorted[0];
                const moins_bonne = sorted[sorted.length - 1];
                
                return `La commune de ${meilleure.communesenegal || meilleure.commune} présente la meilleure inclusion féminine (${(meilleure.femme_pourcentage || 0).toFixed(1)}%), tandis que ${moins_bonne.communesenegal || moins_bonne.commune} montre des résultats plus faibles (${(moins_bonne.femme_pourcentage || 0).toFixed(1)}%). Recommandation : Étudier les bonnes pratiques de ${meilleure.communesenegal || meilleure.commune} pour les répliquer ailleurs.`;
            }
            return "Analyse comparative des performances genre entre les différentes communes du projet.";

        case 'Analyse Temporelle':
            const temporalData = reportData['Analyse Temporelle'] || [];
            if (temporalData.length >= 2) {
                const recent = temporalData[temporalData.length - 1];
                const precedent = temporalData[temporalData.length - 2];
                
                const evolution = (recent.femme_pourcentage || 0) - (precedent.femme_pourcentage || 0);
                
                if (evolution > 0) {
                    return `Tendance positive : La participation féminine s'améliore (+${evolution.toFixed(1)}% entre ${precedent.periode} et ${recent.periode}). Continuez les efforts actuels pour maintenir cette progression.`;
                } else if (evolution < 0) {
                    return `Tendance préoccupante : La participation féminine diminue (${evolution.toFixed(1)}% entre ${precedent.periode} et ${recent.periode}). Des actions correctives urgentes sont nécessaires.`;
                } else {
                    return `Stabilité observée dans la participation féminine entre ${precedent.periode} et ${recent.periode}. Explorez de nouvelles stratégies pour stimuler l'inclusion.`;
                }
            }
            return "Suivi de l'évolution temporelle de la participation genre dans le projet.";

        case 'Tamba-Kédougou':
            const regionData = reportData['Tamba-Kédougou'] || [];
            if (regionData.length >= 2) {
                const sorted = regionData.sort((a, b) => (b.femme_pourcentage || 0) - (a.femme_pourcentage || 0));
                const meilleure = sorted[0];
                const autre = sorted[1];
                
                return `La région de ${meilleure.region || meilleure.nom} surperforme avec ${(meilleure.femme_pourcentage || 0).toFixed(1)}% de participation féminine, comparée à ${autre.region || autre.nom} (${(autre.femme_pourcentage || 0).toFixed(1)}%). Recommandation : Analyser les facteurs de succès régionaux pour optimiser les interventions.`;
            }
            return "Comparaison des performances genre entre les régions du projet PROCASEF.";

        default:
            return "Analyse des données pour identifier les opportunités d'amélioration de l'inclusion genre.";
    }
}

/**
 * Crée la page de recommandations
 */
createRecommendationsPage(doc, reportData, pageWidth, pageHeight, margin, formatNumber) {
    let currentY = 50;

    // Titre
    doc.setFillColor(30, 58, 138);
    doc.rect(margin, currentY - 10, pageWidth - 2 * margin, 35, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('🎯 RECOMMANDATIONS STRATÉGIQUES', margin + 15, currentY + 15);
    currentY += 60;

    const recommendations = this.generateStrategicRecommendations(reportData);
    
    recommendations.forEach((rec, index) => {
        // Vérifier si on a besoin d'une nouvelle page
        if (currentY > pageHeight - 150) {
            doc.addPage();
            currentY = 50;
        }

        // Numéro et titre
        doc.setFillColor(212, 165, 116);
        doc.circle(margin + 10, currentY + 5, 8, 'F');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text((index + 1).toString(), margin + 7, currentY + 8);

        doc.setFontSize(12);
        doc.setTextColor(30, 58, 138);
        doc.text(rec.title, margin + 30, currentY + 8);
        currentY += 20;

        // Description
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const descLines = doc.splitTextToSize(rec.description, pageWidth - 2 * margin - 40);
        doc.text(descLines, margin + 30, currentY);
        currentY += descLines.length * 12 + 20;
    });
}

/**
 * Génère des recommandations stratégiques basées sur les données
 */
generateStrategicRecommendations(reportData) {
    const recommendations = [];
    
    // Analyse globale
    const globalStats = reportData['Synthèse Globale'] || [];
    const femmes = globalStats.find(item => item.indicateur === 'Femmes')?.valeur || 9332;
    const total = globalStats.find(item => item.indicateur === 'Total Personnes')?.valeur || 52908;
    const femmesPourcentage = ((femmes / total) * 100);

    if (femmesPourcentage < 25) {
        recommendations.push({
            title: "URGENCE : Renforcement massif de l'inclusion féminine",
            description: "Mettre en place un programme d'action positive avec quotas temporaires de 30% minimum pour les femmes. Créer des mécanismes de financement dédiés aux femmes et renforcer la sensibilisation communautaire."
        });
    }

    // Recommandations par source
    const sourceData = reportData['Détail par Source'] || [];
    if (sourceData.length > 0) {
        recommendations.push({
            title: "Optimisation des mécanismes de financement",
            description: "Développer des produits financiers adaptés aux besoins spécifiques des femmes (microcrédit, tontines améliorées, épargne progressive). Former les agents de terrain sur l'approche genre."
        });
    }

    // Recommandations temporelles
    const temporalData = reportData['Analyse Temporelle'] || [];
    if (temporalData.length >= 2) {
        recommendations.push({
            title: "Suivi et monitoring renforcé",
            description: "Installer un système de suivi mensuel des indicateurs genre avec alertes automatiques. Organiser des revues trimestrielles avec les parties prenantes pour ajuster les stratégies."
        });
    }

    // Recommandations communales
    recommendations.push({
        title: "Approche différenciée par commune",
        description: "Adapter les stratégies d'intervention selon les spécificités culturelles et économiques de chaque commune. Identifier et former des ambassadrices genre dans chaque localité."
    });

    recommendations.push({
        title: "Renforcement des capacités institutionnelles",
        description: "Former tous les acteurs du projet sur l'approche genre. Intégrer systématiquement l'analyse genre dans tous les processus de décision et développer des partenariats avec les organisations de femmes."
    });

    return recommendations;
}

/**
 * Améliore les données de tableau avec formatage
 */
getEnhancedTableDataForChart(section, reportData, formatNumber) {
    switch (section) {
        case 'Détail par Source':
            const sourceData = reportData['Détail par Source'] || [];
            if (sourceData.length === 0) return [['Source/Genre', 'Nombre', 'Pourcentage'], ['Aucune donnée', '0', '0%']];
            
            let sourceTable = [['Source/Genre', 'Bénéficiaires', 'Pourcentage']];
            sourceData.forEach(item => {
                sourceTable.push([
                    `${item.source} - Hommes`,
                    formatNumber(item.hommes),
                    `${(item.hommes_1 || 0).toFixed(1)}%`
                ]);
                sourceTable.push([
                    `${item.source} - Femmes`,
                    formatNumber(item.femmes),
                    `${(item.femmes_1 || 0).toFixed(1)}%`
                ]);
            });
            return sourceTable;

        case 'Analyse par Commune':
            const communeData = reportData['Analyse par Commune'] || [];
            if (communeData.length === 0) return [['Commune', 'Population', '% Femmes'], ['Aucune donnée', '0', '0%']];
            
            let communeTable = [['Commune', 'Population Totale', '% Femmes', 'Rang Genre']];
            const sortedCommunes = communeData
                .sort((a, b) => (b.femme_pourcentage || 0) - (a.femme_pourcentage || 0))
                .slice(0, 10);
                
            sortedCommunes.forEach((item, index) => {
                const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`;
                communeTable.push([
                    item.communesenegal || item.commune || 'N/A',
                    formatNumber(item.total),
                    `${(item.femme_pourcentage || 0).toFixed(1)}%`,
                    emoji
                ]);
            });
            return communeTable;

        case 'Analyse Temporelle':
            const temporalData = reportData['Analyse Temporelle'] || [];
            if (temporalData.length === 0) return [['Période', 'Hommes', 'Femmes', 'Évolution'], ['Aucune donnée', '0', '0', '-']];
            
            let temporalTable = [['Période', 'Hommes', 'Femmes', '% Femmes', 'Tendance']];
            temporalData.forEach((item, index) => {
                let tendance = '-';
                if (index > 0) {
                    const prev = temporalData[index - 1].femme_pourcentage || 0;
                    const curr = item.femme_pourcentage || 0;
                    tendance = curr > prev ? '📈 +' + (curr - prev).toFixed(1) : 
                              curr < prev ? '📉 ' + (curr - prev).toFixed(1) : '➡️ =';
                }
                
                temporalTable.push([
                    item.periode || 'N/A',
                    formatNumber(item.homme),
                    formatNumber(item.femme),
                    `${(item.femme_pourcentage || 0).toFixed(1)}%`,
                    tendance
                ]);
            });
            return temporalTable;

        case 'Tamba-Kédougou':
            const regionData = reportData['Tamba-Kédougou'] || [];
            if (regionData.length === 0) return [['Région', 'Population', '% Femmes'], ['Aucune donnée', '0', '0%']];
            
            let regionTable = [['Région', 'Population Totale', '% Femmes', 'Évaluation']];
            regionData.forEach(item => {
                const pourcentage = item.femme_pourcentage || 0;
                let evaluation = '';
                if (pourcentage >= 40) evaluation = '🟢 Excellent';
                else if (pourcentage >= 25) evaluation = '🟡 Moyen';
                else if (pourcentage >= 15) evaluation = '🟠 Faible';
                else evaluation = '🔴 Critique';
                
                regionTable.push([
                    item.region || item.nom || 'N/A',
                    formatNumber(item.total),
                    `${pourcentage.toFixed(1)}%`,
                    evaluation
                ]);
            });
            return regionTable;

        default:
            return [['Indicateur', 'Valeur'], ['Aucune donnée disponible', '-']];
    }
}

/**
 * Ajoute des pieds de page modernes avec navigation
 */
addAdvancedFooters(doc, pageWidth, pageHeight, margin) {
    const totalPages = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Ligne de séparation
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
        
        // Informations du pied de page
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        
        // Nom de l'application (gauche)
        doc.text('PROCASEF Dashboard - Rapport Genre Automatisé', margin, pageHeight - 25);
        
        // Date de génération (centre)
        const dateText = `Généré le ${new Date().toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, (pageWidth - dateWidth) / 2, pageHeight - 25);
        
        // Numéro de page (droite)
        const pageText = `${i}/${totalPages}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 25);
        
        // URL ou contact (très petit en bas)
        doc.setFontSize(7);
        const contactText = 'Contact: procasef@example.com | www.procasef-dashboard.sn';
        const contactWidth = doc.getTextWidth(contactText);
        doc.text(contactText, (pageWidth - contactWidth) / 2, pageHeight - 10);
    }
}

/**
 * Fonction utilitaire pour créer des graphiques en camembert pour les KPIs
 */
createPieChartKPI(doc, x, y, size, percentage, color, label) {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 3;
    
    // Cercle de fond
    doc.setFillColor(240, 240, 240);
    doc.circle(centerX, centerY, radius, 'F');
    
    // Arc pour le pourcentage
    if (percentage > 0) {
        doc.setFillColor(color);
        const angle = (percentage / 100) * 360;
        // Note: jsPDF ne supporte pas nativement les arcs, mais on peut simuler avec des lignes
        doc.circle(centerX, centerY, radius * (percentage / 100), 'F');
    }
    
    // Texte du pourcentage
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const percentText = percentage.toFixed(1) + '%';
    const textWidth = doc.getTextWidth(percentText);
    doc.text(percentText, centerX - textWidth / 2, centerY + 3);
    
    // Label
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const labelWidth = doc.getTextWidth(label);
    doc.text(label, centerX - labelWidth / 2, y + size + 10);
}

/**
 * Ajoute des statistiques de performance du rapport
 */
addPerformanceStats(doc, reportData, y, margin, contentWidth) {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 60, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(30, 58, 138);
    doc.text('📈 INDICATEURS DE PERFORMANCE', margin + 10, y + 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Calculer quelques métriques intéressantes
    const globalStats = reportData['Synthèse Globale'] || [];
    const total = globalStats.find(item => item.indicateur === 'Total Personnes')?.valeur || 0;
    const femmes = globalStats.find(item => item.indicateur === 'Femmes')?.valeur || 0;
    
    const metrics = [
        `Taux d'inclusion féminine: ${((femmes / total) * 100).toFixed(1)}%`,
        `Objectif ODD 5 (50%): ${((femmes / total) * 100) >= 50 ? '✅ Atteint' : '❌ Non atteint'}`,
        `Écart à la parité: ${Math.abs(50 - ((femmes / total) * 100)).toFixed(1)} points`,
        `Niveau de priorité: ${((femmes / total) * 100) < 20 ? '🔴 Urgence' : ((femmes / total) * 100) < 30 ? '🟡 Attention' : '🟢 Satisfaisant'}`
    ];
    
    metrics.forEach((metric, index) => {
        doc.text(metric, margin + 20 + (index % 2) * 250, y + 35 + Math.floor(index / 2) * 15);
    });
    
    return y + 80;
}

/**
 * Génère des alertes basées sur les seuils critiques
 */
generateAlerts(reportData) {
    const alerts = [];
    const globalStats = reportData['Synthèse Globale'] || [];
    const femmes = globalStats.find(item => item.indicateur === 'Femmes')?.valeur || 0;
    const total = globalStats.find(item => item.indicateur === 'Total Personnes')?.valeur || 1;
    const femmesPourcentage = (femmes / total) * 100;
    
    // Alertes critiques
    if (femmesPourcentage < 15) {
        alerts.push({
            level: 'CRITIQUE',
            icon: '🚨',
            message: 'Représentation féminine extrêmement faible - Action immédiate requise',
            color: [220, 38, 38]
        });
    } else if (femmesPourcentage < 25) {
        alerts.push({
            level: 'ATTENTION',
            icon: '⚠️',
            message: 'Représentation féminine insuffisante - Renforcement nécessaire',
            color: [245, 158, 11]
        });
    }
    
    // Vérifier les tendances temporelles
    const temporalData = reportData['Analyse Temporelle'] || [];
    if (temporalData.length >= 2) {
        const dernier = temporalData[temporalData.length - 1];
        const precedent = temporalData[temporalData.length - 2];
        
        if ((dernier.femme_pourcentage || 0) < (precedent.femme_pourcentage || 0)) {
            alerts.push({
                level: 'TENDANCE',
                icon: '📉',
                message: 'Régression de la participation féminine détectée',
                color: [239, 68, 68]
            });
        }
    }
    
    return alerts;
}

/**
 * Ajoute une section d'alertes au rapport
 */
addAlertsSection(doc, reportData, startY, margin, contentWidth) {
    const alerts = this.generateAlerts(reportData);
    
    if (alerts.length === 0) {
        // Pas d'alertes = message positif
        doc.setFillColor(220, 252, 231);
        doc.rect(margin, startY, contentWidth, 40, 'F');
        
        doc.setFontSize(12);
        doc.setTextColor(22, 163, 74);
        doc.text('✅ AUCUNE ALERTE CRITIQUE DÉTECTÉE', margin + 15, startY + 25);
        
        return startY + 50;
    }
    
    let currentY = startY;
    
    alerts.forEach(alert => {
        // Boîte d'alerte colorée
        doc.setFillColor(alert.color[0], alert.color[1], alert.color[2], 0.1);
        doc.rect(margin, currentY, contentWidth, 35, 'F');
        
        // Bordure gauche colorée
        doc.setFillColor(alert.color[0], alert.color[1], alert.color[2]);
        doc.rect(margin, currentY, 4, 35, 'F');
        
        // Texte de l'alerte
        doc.setFontSize(11);
        doc.setTextColor(alert.color[0], alert.color[1], alert.color[2]);
        doc.text(`${alert.icon} ${alert.level}: ${alert.message}`, margin + 15, currentY + 22);
        
        currentY += 45;
    });
    
    return currentY;
}

    // ================= FIN DES AJOUTS ====================================

    populatePostFilters() {
        const communes = ['NDOGA BABACAR', 'BANDAFASSI', 'DIMBOLI', 'MISSIRAH', 'NETTEBOULOU'];
        const geometres = ['FALL Mamadou', 'DIALLO Aissatou', 'NDIAYE Ousmane'];

        const communeSelect = document.getElementById('postCommuneFilter');
        if (communeSelect) {
            communeSelect.innerHTML = '<option value="">Toutes les communes</option>' +
                communes.map(commune => `<option value="${commune}">${commune}</option>`).join('');
        }

        const geomSelect = document.getElementById('postGeomFilter');
        if (geomSelect) {
            geomSelect.innerHTML = '<option value="">Tous les géomètres</option>' +
                geometres.map(geom => `<option value="${geom}">${geom}</option>`).join('');
        }
    }

    createPostCharts() {
        if (!window.chartManager) return;

        const postData = [
            { commune: 'NDOGA BABACAR', recues: 1250, traitees: 1180, taux: 94.4 },
            { commune: 'BANDAFASSI', recues: 980, traitees: 920, taux: 93.9 },
            { commune: 'DIMBOLI', recues: 845, traitees: 790, taux: 93.5 },
            { commune: 'MISSIRAH', recues: 720, traitees: 650, taux: 90.3 },
            { commune: 'NETTEBOULOU', recues: 650, traitees: 580, taux: 89.2 }
        ];

        window.chartManager.createBar('postTauxChart', {
            labels: postData.map(d => d.commune.substring(0, 12)),
            datasets: [{
                label: 'Taux de traitement (%)',
                data: postData.map(d => d.taux),
                backgroundColor: postData.map(d => {
                    if (d.taux >= 95) return this.colors.success;
                    if (d.taux >= 90) return this.colors.warning;
                    return this.colors.error;
                })
            }]
        });
    }

    populateTopoFilters() {
        if (!this.data.topoData || !Array.isArray(this.data.topoData)) return;

        const communes = [...new Set(
            this.data.topoData
                .map(t => (t.commune || '').trim())
                .filter(commune => commune !== '')
        )].sort();

        const topographes = [...new Set(
            this.data.topoData
                .map(t => {
                    const prenom = (t.prenom || '').trim();
                    const nom = (t.nom || '').trim();
                    const fullName = `${prenom} ${nom}`.trim();
                    return fullName;
                })
                .filter(name => name !== '' && name.length > 1)
        )].sort();

        console.log('Communes uniques trouvées:', communes.length);
        console.log('Topographes uniques trouvés:', topographes.length);

        const communeSelect = document.getElementById('topoCommuneFilter');
        if (communeSelect) {
            communeSelect.innerHTML = '<option value="">Toutes les communes</option>' +
                communes.map(commune => `<option value="${commune}">${commune}</option>`).join('');
        }

        const topoSelect = document.getElementById('topoTopographeFilter');
        if (topoSelect) {
            topoSelect.innerHTML = '<option value="">Tous les topographes</option>' +
                topographes.map(topo => `<option value="${topo}">${topo}</option>`).join('');
        }
    }

    applyTopoFilters() {
        const communeFilter = document.getElementById('topoCommuneFilter')?.value;
        const topoFilter = document.getElementById('topoTopographeFilter')?.value;
        const dateDebut = document.getElementById('topoDateDebut')?.value;
        const dateFin = document.getElementById('topoDateFin')?.value;

        let filtered = this.data.topoData || [];

        if (communeFilter) {
            filtered = filtered.filter(t => (t.commune || '').trim() === communeFilter);
        }

        if (topoFilter) {
            filtered = filtered.filter(t => {
                const prenom = (t.prenom || '').trim();
                const nom = (t.nom || '').trim();
                const fullName = `${prenom} ${nom}`.trim();
                return fullName === topoFilter;
            });
        }

        if (dateDebut || dateFin) {
            filtered = filtered.filter(t => {
                const itemDate = t.date;
                if (!itemDate) return false;
                let isInRange = true;
                if (dateDebut) {
                    isInRange = isInRange && (itemDate >= dateDebut);
                }
                if (dateFin) {
                    isInRange = isInRange && (itemDate <= dateFin);
                }
                return isInRange;
            });
        }

        this.filteredTopoData = filtered;

        if (this.currentSection === 'stats-topo') {
            this.updateTopoKPIs();
            this.renderTopoTable();
            this.renderTopoTimeline();
            this.createTopoCharts();
        }
    }

    clearDateRange() {
        const dateDebut = document.getElementById('topoDateDebut');
        const dateFin = document.getElementById('topoDateFin');
        if (dateDebut) dateDebut.value = '';
        if (dateFin) dateFin.value = '';
        this.applyTopoFilters();
    }

    updateTopoKPIs() {
        const d = this.filteredTopoData || [];
        const totalChamps = d.reduce((s, x) => s + (x.champs || 0), 0);
        const totalBatis = d.reduce((s, x) => s + (x.batis || 0), 0);
        const total = d.reduce((s, x) => s + (x.totale_parcelles || 0), 0);
        const dates = [...new Set(d.map(x => x.date).filter(Boolean))];
        const avg = dates.length ? Math.round(total / dates.length) : 0;

        this.updateKPI('totalChampsKPI', totalChamps);
        this.updateKPI('totalBatisKPI', totalBatis);
        this.updateKPI('totalTopoParcellesKPI', total);
        this.updateKPI('avgParJourKPI', avg);

        const dateDebut = document.getElementById('topoDateDebut')?.value;
        const dateFin = document.getElementById('topoDateFin')?.value;
        let periode = '';
        if (dateDebut && dateFin) {
            periode = `Du ${new Date(dateDebut).toLocaleDateString('fr-FR')} au ${new Date(dateFin).toLocaleDateString('fr-FR')}`;
        } else if (dateDebut) {
            periode = `Depuis le ${new Date(dateDebut).toLocaleDateString('fr-FR')}`;
        } else if (dateFin) {
            periode = `Jusqu'au ${new Date(dateFin).toLocaleDateString('fr-FR')}`;
        } else {
            periode = 'Toute la période';
        }

        const sectionHeader = document.querySelector('#stats-topo-section .section-description');
        if (sectionHeader) {
            sectionHeader.textContent = `Analyse détaillée des levés topographiques - ${periode}`;
        }

        const counts = {};
        d.forEach(x => {
            const prenom = (x.prenom || '').trim();
            const nom = (x.nom || '').trim();
            const name = `${prenom} ${nom}`.trim();
            if (name && name.length > 1) {
                counts[name] = (counts[name] || 0) + (x.totale_parcelles || 0);
            }
        });

        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        this.updateKPI('topTopoKPI', top ? `${top[0]} (${top[1]})` : '-');
        this.updateKPI('activeTopoKPI', Object.keys(counts).length);
    }

    updateKPI(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = typeof value === 'number' ? value.toLocaleString() : value;
        }
    }

    createTopoCharts() {
        if (!window.chartManager) return;

        console.log('📊 Création des graphiques topo avec données:', this.filteredTopoData.length, 'éléments');

        const cleanTopoStats = this.filteredTopoData.reduce((acc, x) => {
            const prenom = (x.prenom || '').trim();
            const nom = (x.nom || '').trim();
            const cleanName = `${prenom} ${nom}`.trim();
            if (cleanName && cleanName.length > 1) {
                if (!acc[cleanName]) {
                    acc[cleanName] = { champs: 0, batis: 0, total: 0 };
                }
                acc[cleanName].champs += x.champs || 0;
                acc[cleanName].batis += x.batis || 0;
                acc[cleanName].total += (x.champs || 0) + (x.batis || 0);
            }
            return acc;
        }, {});

        const topoStats = Object.entries(cleanTopoStats)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        if (topoStats.length > 0) {
            window.chartManager.createStackedBar('topToposChart', {
                labels: topoStats.map(x => x.name.length > 15 ? x.name.substring(0, 12) + '...' : x.name),
                datasets: [
                    {
                        label: 'Champs',
                        data: topoStats.map(x => x.champs),
                        backgroundColor: this.colors.success
                    },
                    {
                        label: 'Bâtis',
                        data: topoStats.map(x => x.batis),
                        backgroundColor: this.colors.secondary
                    }
                ]
            });
        }

        const cleanCommuneStats = this.filteredTopoData.reduce((g, x) => {
            const commune = (x.commune || '').trim();
            if (commune && commune !== '') {
                if (!g[commune]) g[commune] = { champs: 0, batis: 0 };
                g[commune].champs += x.champs || 0;
                g[commune].batis += x.batis || 0;
            }
            return g;
        }, {});

        const communeStats = Object.entries(cleanCommuneStats)
            .map(([name, s]) => ({ name, champs: s.champs, batis: s.batis }))
            .filter(item => item.name !== '')
            .sort((a, b) => (b.champs + b.batis) - (a.champs + a.batis));

        if (communeStats.length > 0) {
            window.chartManager.createStackedBar('topoCommuneChart', {
                labels: communeStats.map(x => x.name.length > 12 ? x.name.substring(0, 12) + '...' : x.name),
                datasets: [
                    {
                        label: 'Champs',
                        data: communeStats.map(x => x.champs),
                        backgroundColor: this.colors.success
                    },
                    {
                        label: 'Bâtis',
                        data: communeStats.map(x => x.batis),
                        backgroundColor: this.colors.secondary
                    }
                ]
            });
        }

        const monthly = [...Object.entries(this.filteredTopoData.reduce((m, x) => {
            const dateStr = x.date || '';
            const mKey = dateStr.length >= 7 ? dateStr.slice(0, 7) : 'Inconnu';
            if (!m[mKey]) m[mKey] = { champs: 0, batis: 0 };
            m[mKey].champs += x.champs || 0;
            m[mKey].batis += x.batis || 0;
            return m;
        }, {}))].map(([month, s]) => ({ month, champs: s.champs, batis: s.batis }))
            .filter(item => item.month !== 'Inconnu')
            .sort((a, b) => a.month.localeCompare(b.month));

        if (monthly.length > 0) {
            window.chartManager.createLine('topoEvolutionChart', {
                labels: monthly.map(x => {
                    const [year, month] = x.month.split('-');
                    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                }),
                datasets: [
                    {
                        label: 'Champs',
                        data: monthly.map(x => x.champs),
                        borderColor: this.colors.success,
                        backgroundColor: this.colors.success + '20',
                        tension: 0.4
                    },
                    {
                        label: 'Bâtis',
                        data: monthly.map(x => x.batis),
                        borderColor: this.colors.secondary,
                        backgroundColor: this.colors.secondary + '20',
                        tension: 0.4
                    }
                ]
            });

            const totalChamps = this.filteredTopoData.reduce((s, x) => s + (x.champs || 0), 0);
            const totalBatis = this.filteredTopoData.reduce((s, x) => s + (x.batis || 0), 0);

            if (totalChamps > 0 || totalBatis > 0) {
                if (window.chartManager.createTopoTypeDonutChart) {
                    window.chartManager.createTopoTypeDonutChart('topoTypeDonut', {
                        champs: totalChamps,
                        batis: totalBatis
                    });
                } else {
                    window.chartManager.createDoughnut('topoTypeDonut', {
                        labels: ['Champs', 'Bâtis'],
                        datasets: [{
                            data: [totalChamps, totalBatis],
                            backgroundColor: [this.colors.success, this.colors.secondary],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    });
                }
            }
        }
    }

    renderTopoTable() {
        const tbody = document.getElementById('topoTableBody');
        if (!tbody || !this.filteredTopoData) return;

        tbody.innerHTML = '';
        this.filteredTopoData.slice(0, 50).forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.date || '-'}</td>
                <td>${item.prenom} ${item.nom}</td>
                <td>${item.commune || '-'}</td>
                <td class="text-end">${(item.champs || 0).toLocaleString()}</td>
                <td class="text-end">${(item.batis || 0).toLocaleString()}</td>
                <td class="text-end">${(item.totale_parcelles || 0).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    }

    renderTopoTimeline() {
        const container = document.getElementById('topoTimeline');
        if (!container || !this.filteredTopoData) return;

        const groupedByDate = this.filteredTopoData.reduce((acc, item) => {
            const date = item.date || 'Date inconnue';
            if (!acc[date]) acc[date] = [];
            acc[date].push(item);
            return acc;
        }, {});

        const timelineHTML = Object.entries(groupedByDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 10)
            .map(([date, items]) => {
                const totalParcelles = items.reduce((sum, item) => sum + (item.totale_parcelles || 0), 0);
                const topographes = [...new Set(items.map(item => `${item.prenom} ${item.nom}`))];
                return `
                    <div class="timeline-item">
                        <div class="timeline-date">${date}</div>
                        <div class="timeline-content">
                            <div class="timeline-stats">
                                <strong>${totalParcelles} parcelles</strong> levées par ${topographes.length} topographe(s)
                            </div>
                            <div class="timeline-details">
                                ${topographes.slice(0, 3).join(', ')}${topographes.length > 3 ? '...' : ''}
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');

        container.innerHTML = timelineHTML;
    }

    createPolarChart(canvasId, data) {
        if (!window.chartManager || !data) return;

        window.chartManager.createPolar(canvasId, {
            labels: data.labels,
            datasets: [{
                data: data.datasets[0].data,
                backgroundColor: data.datasets[0].backgroundColor,
                borderColor: data.datasets[0].borderColor,
                borderWidth: data.datasets[0].borderWidth
            }]
        }, {
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { size: 12 },
                        color: '#374151'
                    }
                }
            },
            scales: {
                r: {
                    grid: {
                        color: '#374151',
                        lineWidth: 1,
                        z: 1
                    },
                    ticks: {
                        color: '#374151',
                        backdropColor: 'transparent',
                        z: 2
                    },
                    pointLabels: {
                        color: '#374151',
                        font: { size: 12 },
                        z: 3
                    }
                }
            }
        });
    }

    createMixedChart(canvasId, communesData) {
        if (!window.chartManager || !communesData) return;

        window.chartManager.createMixed(canvasId, {
            labels: communesData.map(c => c.commune || c.nom),
            datasets: [
                {
                    type: 'bar',
                    label: 'Hommes',
                    data: communesData.map(c => c.hommes || 0),
                    backgroundColor: this.colors.secondary
                },
                {
                    type: 'line',
                    label: 'Femmes',
                    data: communesData.map(c => c.femmes || 0),
                    borderColor: this.colors.primary,
                    fill: false
                }
            ]
        });
    }

    initializeMap() {
        console.log('Initialisation de la carte...');
        if (!this.mapManager) {
            this.mapManager = new MapManager();
        }

        if (this.mapManager.map) {
            console.log('Carte déjà initialisée, mise à jour des marqueurs seulement');
            this.updateMapMarkersFromStats();
            return this.mapManager.map;
        }

        const mapInstance = this.mapManager.initMap('mapContainer');
        if (mapInstance && this.communeStats) {
            console.log('Ajout des marqueurs des communes...');
            this.updateMapMarkersFromStats();
            this.mapManager.fitToMarkers();
        }

        return mapInstance;
    }

    updateMapMarkersFromStats() {
        if (!this.mapManager || !this.mapManager.map || !this.communeStats) return;
        this.mapManager.clearMarkers();
        Object.entries(this.communeStats).forEach(([commune, stats]) => {
            this.mapManager.addCommuneMarker(commune, stats);
        });
    }

    applyFilters() {
        console.log('Application des filtres');
        if (this.currentSection !== 'parcelles') {
            this.renderSection(this.currentSection);
            return;
        }

        let data = this.data.parcelles || [];
        const fComm = document.getElementById('communeFilter')?.value;
        const fNic = document.getElementById('nicadFilter')?.value;
        const fDel = document.getElementById('deliberationFilter')?.value;

        if (fComm) data = data.filter(p => p.commune === fComm);
        if (fNic) data = data.filter(p => p.nicad === fNic);
        if (fDel) data = data.filter(p => p.deliberee === fDel);

        this.filteredParcelles = data.length ? data : null;
        this.updateMapWithFilteredData();
        this.renderParcellesTable();
    }

    updateMapWithFilteredData() {
        if (!this.mapManager?.map) return;

        this.mapManager.clearMarkers();
        const stats = {};
        (this.filteredParcelles || this.data.parcelles || []).forEach(p => {
            const c = p.commune;
            if (!stats[c]) stats[c] = { total: 0, nicad_oui: 0, deliberees_oui: 0, superficie: 0 };
            stats[c].total++;
            if (p.nicad === 'Oui') stats[c].nicad_oui++;
            if (p.deliberee === 'Oui') stats[c].deliberees_oui++;
            if (p.superficie) stats[c].superficie += parseFloat(p.superficie);
        });

        Object.entries(stats).forEach(([c, s]) => this.mapManager.addCommuneMarker(c, s));
    }

    updateKPIs() {
        if (!this.stats) return;

        this.updateElement('totalParcelles', (this.stats.total || 0).toLocaleString());
        this.updateElement('parcellesNicad', (this.stats.nicad_oui || 0).toLocaleString());
        this.updateElement('parcellesDeliberees', (this.stats.deliberees_oui || 0).toLocaleString());
        this.updateElement('superficieTotale', (this.stats.superficie_totale || 0).toLocaleString(undefined, { maximumFractionDigits: 2 }));

        const nicadPct = this.stats.total > 0 ? ((this.stats.nicad_oui / this.stats.total) * 100).toFixed(1) : 0;
        const delibPct = this.stats.total > 0 ? ((this.stats.deliberees_oui / this.stats.total) * 100).toFixed(1) : 0;

        this.updateElement('percentageNicad', `${nicadPct}% avec NICAD`);
        this.updateElement('percentageDeliberees', `${delibPct}% délibérées`);

        const OBJECTIF = 70000;
        const tauxRealisation = ((this.stats.total / OBJECTIF) * 100).toFixed(1);
        this.updateElement('tauxRealisation', `${tauxRealisation}%`);
    }

    updateProgressBar() {
        const progressFill = document.getElementById('globalProgressFill');
        const progressText = document.getElementById('globalProgressText');
        const taux = 47.80;

        if (progressFill) {
            progressFill.style.width = taux + '%';
        }
        if (progressText) {
            progressText.textContent = taux + '%';
        }
    }

    updateProjectionsKPIs() {
        const OBJECTIF = 70000;
        const realise = (this.stats && this.stats.total) ? this.stats.total : 0;
        const performance = OBJECTIF > 0 ? ((realise / OBJECTIF) * 100).toFixed(1) : 0;

        this.updateElement('objectif2025', OBJECTIF.toLocaleString());
        this.updateElement('realise2025', realise.toLocaleString());
        this.updateElement('performance2025', `${performance}%`);
    }

    updateGenreKPIs() {
        if (!this.data.repartitionGenre || !Array.isArray(this.data.repartitionGenre)) return;

        const hommes = this.data.repartitionGenre.find(r => r.genre === 'Homme');
        const femmes = this.data.repartitionGenre.find(r => r.genre === 'Femme');

        const hommesTotal = hommes ? hommes.total_nombre : 43576;
        const femmesTotal = femmes ? femmes.total_nombre : 9332;
        const total = hommesTotal + femmesTotal;

        this.updateElement('hommesTotal', hommesTotal.toLocaleString());
        this.updateElement('femmesTotal', femmesTotal.toLocaleString());
        this.updateElement('hommesPercentage', `${total > 0 ? ((hommesTotal / total) * 100).toFixed(1) : 0}%`);
        this.updateElement('femmesPercentage', `${total > 0 ? ((femmesTotal / total) * 100).toFixed(1) : 0}%`);
    }

    createTopCommunesChart() {
        if (!this.communeStats || !window.chartManager) return;

        const topCommunes = Object.entries(this.communeStats)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 8);

        const chartData = {
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
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: 'Top 8 des Communes par Nombre de Parcelles'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };

        window.chartManager.createBar('topCommunesChart', chartData, options);
    }

    createProjectionsChart() {
        if (!this.data.projections || !Array.isArray(this.data.projections) || !window.chartManager) return;

        const chartData = {
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
        };

        const options = {
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
        };

        window.chartManager.createLine('projectionsChart', chartData, options);
    }

    createGenreGlobalChart() {
        if (!this.data.repartitionGenre || !Array.isArray(this.data.repartitionGenre) || !window.chartManager) return;

        const hommes = this.data.repartitionGenre.find(r => r.genre === 'Homme')?.total_nombre || 43576;
        const femmes = this.data.repartitionGenre.find(r => r.genre === 'Femme')?.total_nombre || 9332;

        const chartData = {
            labels: ['Hommes', 'Femmes'],
            datasets: [{
                data: [hommes, femmes],
                backgroundColor: [this.colors.secondary, this.colors.primary],
                borderWidth: 0
            }]
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: 'Répartition Globale par Genre'
                },
                legend: {
                    position: 'bottom'
                }
            }
        };

        window.chartManager.createDoughnut('genreGlobalChart', chartData, options);
    }

    createRegionChart() {
        if (!this.data.parcelles || !window.chartManager) return;

        const regionData = {};
        this.data.parcelles.forEach(parcelle => {
            const region = parcelle.region || 'Non définie';
            regionData[region] = (regionData[region] || 0) + 1;
        });

        const chartData = {
            labels: Object.keys(regionData),
            datasets: [{
                data: Object.values(regionData),
                backgroundColor: this.colors.chartColors.slice(0, Object.keys(regionData).length),
                borderWidth: 0
            }]
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: 'Répartition par Région'
                },
                legend: {
                    position: 'bottom'
                }
            }
        };

        window.chartManager.createDoughnut('regionChart', chartData, options);
    }

    createNicadChart() {
        if (!this.communeStats || !window.chartManager) return;

        const topCommunes = Object.entries(this.communeStats)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 8);

        const nicadData = topCommunes.map(([commune, stats]) => ({
            commune: commune.substring(0, 12),
            percentage: stats.total > 0 ? ((stats.nicad_oui / stats.total) * 100) : 0
        }));

        const chartData = {
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
        };

        const options = {
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
        };

        window.chartManager.createBar('nicadChart', chartData, options);
    }

    createObjectifsChart() {
        if (!this.data.projections || !Array.isArray(this.data.projections) || !window.chartManager) return;

        const chartData = {
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
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: 'Évolution Objectifs vs Réalisations'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };

        window.chartManager.createLine('objectifsChart', chartData, options);
    }

    createGenreTrimestreChart() {
        if (!this.data.genreTrimestre || !Array.isArray(this.data.genreTrimestre) || !window.chartManager) return;

        const chartData = {
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
        };

        const options = {
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
        };

        window.chartManager.createBar('genreTrimestreChart', chartData, options);
    }

    createGenreCommuneChart() {
        if (!this.data.genreCommune || !Array.isArray(this.data.genreCommune) || !window.chartManager) return;

        const topCommunes = this.data.genreCommune.slice(0, 10);

        const chartData = {
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
        };

        const options = {
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
        };

        window.chartManager.createBar('genreCommuneChart', chartData, options);
    }

    createTemporalChart(canvasId, temporalData) {
        if (!temporalData || !Array.isArray(temporalData) || !window.chartManager) {
            console.warn('Données temporelles invalides');
            return;
        }

        const chartData = {
            labels: temporalData.map(d => d.periode || d.date || ''),
            datasets: [{
                label: 'Évolution',
                data: temporalData.map(d => d.valeur || d.total || 0),
                borderColor: this.colors.primary,
                backgroundColor: this.colors.primary + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: this.colors.primary,
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        };

        const options = {
            plugins: {
                title: {
                    display: true,
                    text: 'Évolution Temporelle',
                    font: { size: 14, weight: 'bold' },
                    color: '#374151'
                }
            },
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
            }
        };

        window.chartManager.createLine(canvasId, chartData, options);
    }

    populateEtatAvancementFilters() {
        const arr = this.data.etatOperations || [];
        const regions = [...new Set(arr.map(e => e.region).filter(Boolean))].sort();
        const etats = [...new Set(arr.map(e => e.etat_d_avancement).filter(Boolean))].sort();
        const csigs = [...new Set(arr.map(e => e.csig).filter(Boolean))].sort();
        const communes = [...new Set(arr.map(e => e.commune).filter(Boolean))].sort();

        const updateSelect = (selectId, options, allLabel) => {
            const sel = document.getElementById(selectId);
            if (!sel) return;
            const prevValue = sel.value;
            sel.innerHTML = `<option value="">${allLabel}</option>` +
                options.map(o => `<option value="${o}">${o}</option>`).join('');
            sel.value = prevValue;
            sel.onchange = () => this.renderEtatAvancement();
        };

        updateSelect('regionFilterEtat', regions, 'Toutes les régions');
        updateSelect('etatFilterEtat', etats, 'Tous les états');
        updateSelect('csigFilterEtat', csigs, 'Tous les CSIG');
        updateSelect('communeFilterEtat', communes, 'Toutes les communes');
    }

    getFilteredEtatOperations() {
        const r = document.getElementById('regionFilterEtat')?.value;
        const e = document.getElementById('etatFilterEtat')?.value;
        const c = document.getElementById('communeFilterEtat')?.value;
        const csig = document.getElementById('csigFilterEtat')?.value;

        let arr = this.data.etatOperations || [];
        if (r) arr = arr.filter(x => x.region === r);
        if (e) arr = arr.filter(x => x.etat_d_avancement === e);
        if (c) arr = arr.filter(x => x.commune === c);
        if (csig) arr = arr.filter(x => x.csig === csig);

        return arr;
    }

    renderEtatTimeline() {
        const container = document.getElementById('etatTimeline');
        if (!container) return;

        const dataArr = this.getFilteredEtatOperations();
        container.innerHTML = dataArr.map(x => `
            <div class="timeline-item ${x.etat_d_avancement?.toLowerCase().includes('terminé') ? 'completed' : 
                                        x.etat_d_avancement?.toLowerCase().includes('cours') ? 'in-progress' : 'pending'}">
                <div class="timeline-content">
                    <div class="timeline-commune">${x.commune} 
                        <span style="color:#888;">(${x.region})</span>  
                        <span style="font-size:12px; color:#B8860B;">CSIG: ${x.csig || '-'}</span>
                    </div>
                    <div class="timeline-status">${x.etat_d_avancement || "Non défini"}</div>
                    <div class="timeline-steps">${(x.progres_des_etapes || '').replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        `).join('');
    }

    renderParcellesTable() {
        const tbody = document.getElementById('parcellesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
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

    buildAgg(arr) {
        const o = {};
        arr.forEach(p => {
            const c = p.commune;
            if (!o[c]) o[c] = { total: 0, nicad_oui: 0, deliberees_oui: 0, superficie: 0 };
            o[c].total++;
            if (p.nicad === 'Oui') o[c].nicad_oui++;
            if (p.deliberee === 'Oui') o[c].deliberees_oui++;
            if (p.superficie) o[c].superficie += parseFloat(p.superficie);
        });
        return o;
    }

    renderPostTraitementTable() {
        const tbody = document.getElementById('postTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
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

    renderPerformanceList() {
        const container = document.getElementById('performanceList');
        if (!container || !this.data.projections) return;

        container.innerHTML = '';
        this.data.projections.forEach((item, index) => {
            const objectif = item.objectif_inventaires_mensuels || item.objectif || 8000;
            const realise = item.inventaires_mensuels_realises || item.realise || 0;
            const performance = objectif > 0 ? ((realise / objectif) * 100).toFixed(1) : 0;
            const periode = item.mois || item.periode || `Période ${index + 1}`;

            const performanceClass = performance >= 100 ? 'success' :
                                    performance >= 80 ? 'warning' : 'danger';

            const listItem = document.createElement('div');
            listItem.className = 'performance-item list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                <div>
                    <strong>${periode}</strong>
                    <br>
                    <small class="text-muted">
                        Réalisé: ${realise.toLocaleString()} / Objectif: ${objectif.toLocaleString()}
                    </small>
                </div>
                <span class="badge bg-${performanceClass} rounded-pill">${performance}%</span>
            `;
            container.appendChild(listItem);
        });
    }

    populateFilters() {
        if (!this.communeStats) return;

        const commSelect = document.getElementById('communeFilter');
        if (commSelect) {
            commSelect.innerHTML = '<option value="">Toutes les communes</option>' +
                Object.keys(this.communeStats).sort().map(commune =>
                    `<option value="${commune}">${commune}</option>`).join('');
        }

        const nicadSelect = document.getElementById('nicadFilter');
        if (nicadSelect) {
            nicadSelect.innerHTML = `
                <option value="">Tous</option>
                <option value="Oui">Avec NICAD</option>
                <option value="Non">Sans NICAD</option>
            `;
        }

        const delibSelect = document.getElementById('deliberationFilter');
        if (delibSelect) {
            delibSelect.innerHTML = `
                <option value="">Tous</option>
                <option value="Oui">Délibérées</option>
                <option value="Non">Non délibérées</option>
            `;
        }
    }

    generateTableHTML(data, columns, title) {
        const currentDate = new Date().toLocaleString('fr-FR');
        return `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .table-container { max-width: 100%; overflow-x: auto; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 10px; text-align: left; border: 1px solid #dee2e6; }
                    th { background-color: ${this.colors.primary}; color: white; }
                    tr:nth-child(even) { background-color: #f9fafb; }
                    .footer { margin-top: 20px; text-align: center; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                    <p>Généré le : ${currentDate}</p>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                ${columns.map(col => `<th>${col}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map(row => `
                                <tr>
                                    ${columns.map(col => `<td>${row[col] || '-'}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="footer">
                    <p>Rapport généré par l'application PROCASEF Dashboard</p>
                </div>
            </body>
            </html>
        `;
    }

    exportParcellesData() {
        const data = this.filteredParcelles || this.data.parcelles || [];
        if (!data.length) {
            this.showError('Aucune donnée à exporter');
            return;
        }

        const formattedData = data.map(p => ({
            Commune: p.commune || '-',
            Région: p.region || '-',
            NICAD: p.nicad || '-',
            Délibérée: p.deliberee || '-',
            Superficie: p.superficie ? `${parseFloat(p.superficie).toFixed(2)} ha` : '-'
        }));

        const columns = ['Commune', 'Région', 'NICAD', 'Délibérée', 'Superficie'];
        const title = 'Rapport des Parcelles PROCASEF';
        const htmlContent = this.generateTableHTML(formattedData, columns, title);

        // Téléchargement HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Rapport_Parcelles_PROCASEF.html';
        a.click();
        URL.revokeObjectURL(url);

        // Téléchargement PDF
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(title, 20, 20);
            doc.setFontSize(12);
            doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 20, 30);

            doc.autoTable({
                head: [columns],
                body: formattedData.map(row => columns.map(col => row[col])),
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: this.colors.primary },
                styles: { fontSize: 10, cellPadding: 2 },
                alternateRowStyles: { fillColor: '#f9fafb' }
            });

                        doc.text('Rapport généré par l\'application PROCASEF Dashboard', 20, doc.lastAutoTable.finalY + 10);
            doc.save('Rapport_Parcelles_PROCASEF.pdf');
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            this.showError('Erreur lors de la génération du PDF. Le fichier HTML a été téléchargé.');
        }
    }

    exportPostData() {
        const data = [
            { commune: 'NDOGA BABACAR', recues: 1250, traitees: 1180, taux: 94.4, statut: 'Conforme' },
            { commune: 'BANDAFASSI', recues: 980, traitees: 920, taux: 93.9, statut: 'Conforme' },
            { commune: 'DIMBOLI', recues: 845, traitees: 790, taux: 93.5, statut: 'Conforme' },
            { commune: 'MISSIRAH', recues: 720, traitees: 650, taux: 90.3, statut: 'Attention' },
            { commune: 'NETTEBOULOU', recues: 650, traitees: 580, taux: 89.2, statut: 'Attention' }
        ];

        const formattedData = data.map(p => ({
            Commune: p.commune,
            'Parcelles Reçues': p.recues.toLocaleString(),
            'Parcelles Traitées': p.traitees.toLocaleString(),
            'Taux (%)': p.taux.toFixed(1),
            Statut: p.statut
        }));

        const columns = ['Commune', 'Parcelles Reçues', 'Parcelles Traitées', 'Taux (%)', 'Statut'];
        const title = 'Rapport de Post-Traitement PROCASEF';
        const htmlContent = this.generateTableHTML(formattedData, columns, title);

        // Téléchargement HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Rapport_PostTraitement_PROCASEF.html';
        a.click();
        URL.revokeObjectURL(url);

        // Téléchargement PDF
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(title, 20, 20);
            doc.setFontSize(12);
            doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 20, 30);

            doc.autoTable({
                head: [columns],
                body: formattedData.map(row => columns.map(col => row[col])),
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: this.colors.primary },
                styles: { fontSize: 10, cellPadding: 2 },
                alternateRowStyles: { fillColor: '#f9fafb' }
            });

            doc.text('Rapport généré par l\'application PROCASEF Dashboard', 20, doc.lastAutoTable.finalY + 10);
            doc.save('Rapport_PostTraitement_PROCASEF.pdf');
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            this.showError('Erreur lors de la génération du PDF. Le fichier HTML a été téléchargé.');
        }
    }

    exportTopoData() {
        const data = this.filteredTopoData || this.data.topoData || [];
        if (!data.length) {
            this.showError('Aucune donnée à exporter');
            return;
        }

        const formattedData = data.map(t => ({
            Date: t.date || '-',
            Topographe: `${t.prenom || ''} ${t.nom || ''}`.trim() || '-',
            Commune: t.commune || '-',
            Champs: (t.champs || 0).toLocaleString(),
            Bâtis: (t.batis || 0).toLocaleString(),
            Total: (t.totale_parcelles || 0).toLocaleString()
        }));

        const columns = ['Date', 'Topographe', 'Commune', 'Champs', 'Bâtis', 'Total'];
        const title = 'Rapport Topographique PROCASEF';
        const htmlContent = this.generateTableHTML(formattedData, columns, title);

        // Téléchargement HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Rapport_Topographique_PROCASEF.html';
        a.click();
        URL.revokeObjectURL(url);

        // Téléchargement PDF
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text(title, 20, 20);
            doc.setFontSize(12);
            doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 20, 30);

            doc.autoTable({
                head: [columns],
                body: formattedData.map(row => columns.map(col => row[col])),
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: this.colors.primary },
                styles: { fontSize: 10, cellPadding: 2 },
                alternateRowStyles: { fillColor: '#f9fafb' }
            });

            doc.text('Rapport généré par l\'application PROCASEF Dashboard', 20, doc.lastAutoTable.finalY + 10);
            doc.save('Rapport_Topographique_PROCASEF.pdf');
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            this.showError('Erreur lors de la génération du PDF. Le fichier HTML a été téléchargé.');
        }
    }

    destroyAllCharts() {
        if (window.chartManager) {
            window.chartManager.destroyAll();
        }
        Object.keys(this.charts).forEach(chartId => {
            const chart = this.charts[chartId];
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
                // Nettoyer le DOM
            if (hiddenCanvas.parentNode) {
                hiddenCanvas.parentNode.removeChild(hiddenCanvas);
            }
            }
        });
        this.charts = {};
    }

    handleResize() {
        // Resize charts if chartManager and resizeAll are available
        if (window.chartManager && typeof window.chartManager.resizeAll === 'function') {
            window.chartManager.resizeAll();
        } else {
            console.warn('chartManager.resizeAll is not available');
        }
        // Resize map if mapManager and map are initialized
        if (this.mapManager && this.mapManager.map) {
            this.mapManager.map.invalidateSize();
        }
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    window.procasefDashboard = new ProcasefDashboard();
});
