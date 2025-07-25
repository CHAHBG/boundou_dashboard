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
        const exportRapportGenreBtn = document.getElementById('exportRapportGenreBtn');

        if (exportParcellesBtn) {
            exportParcellesBtn.addEventListener('click', () => this.exportParcellesData());
        }
        if (exportPostBtn) {
            exportPostBtn.addEventListener('click', () => this.exportPostData());
        }
        if (exportTopoBtn) {
            exportTopoBtn.addEventListener('click', () => this.exportTopoData());
        }
        if (exportRapportGenreBtn) {
            exportRapportGenreBtn.addEventListener('click', () => this.exportRapportGenre());
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
        if (!window.chartManager || !this.communeStats) return;

        const sortedCommunes = Object.entries(this.communeStats)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 5);

        window.chartManager.createBar('topCommunesChart', {
            labels: sortedCommunes.map(([commune]) => commune),
            datasets: [{
                label: 'Nombre de parcelles',
                data: sortedCommunes.map(([, stats]) => stats.total),
                backgroundColor: this.colors.primary
            }]
        });
    }

    createProjectionsChart() {
        if (!window.chartManager || !this.data.projections) return;

        window.chartManager.createLine('projectionsChart', {
            labels: this.data.projections.map(p => p.mois),
            datasets: [{
                label: 'Parcelles prévues',
                data: this.data.projections.map(p => p.valeur),
                borderColor: this.colors.accent,
                backgroundColor: this.colors.accent + '20',
                tension: 0.4
            }]
        });
    }

    createGenreGlobalChart() {
        if (!window.chartManager || !this.data.repartitionGenre) return;

        const hommes = this.data.repartitionGenre.find(r => r.genre === 'Homme')?.total_nombre || 0;
        const femmes = this.data.repartitionGenre.find(r => r.genre === 'Femme')?.total_nombre || 0;

        window.chartManager.createDoughnut('genreGlobalChart', {
            labels: ['Hommes', 'Femmes'],
            datasets: [{
                data: [hommes, femmes],
                backgroundColor: [this.colors.secondary, this.colors.primary],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        });
    }

    createGenreTrimestreChart() {
        if (!window.chartManager || !this.data.genreTrimestre) return;

        const trimestres = [...new Set(this.data.genreTrimestre.map(g => g.trimestre))];
        const hommesData = trimestres.map(t => {
            const item = this.data.genreTrimestre.find(g => g.trimestre === t && g.genre === 'Homme');
            return item ? item.nombre : 0;
        });
        const femmesData = trimestres.map(t => {
            const item = this.data.genreTrimestre.find(g => g.trimestre === t && g.genre === 'Femme');
            return item ? item.nombre : 0;
        });

        window.chartManager.createBar('genreTrimestreChart', {
            labels: trimestres,
            datasets: [
                {
                    label: 'Hommes',
                    data: hommesData,
                    backgroundColor: this.colors.secondary
                },
                {
                    label: 'Femmes',
                    data: femmesData,
                    backgroundColor: this.colors.primary
                }
            ]
        });
    }

    createGenreCommuneChart() {
        if (!window.chartManager || !this.data.genreCommune) return;

        const communes = [...new Set(this.data.genreCommune.map(g => g.commune))].slice(0, 10);
        const hommesData = communes.map(c => {
            const item = this.data.genreCommune.find(g => g.commune === c && g.genre === 'Homme');
            return item ? item.nombre : 0;
        });
        const femmesData = communes.map(c => {
            const item = this.data.genreCommune.find(g => g.commune === c && g.genre === 'Femme');
            return item ? item.nombre : 0;
        });

        window.chartManager.createBar('genreCommuneChart', {
            labels: communes,
            datasets: [
                {
                    label: 'Hommes',
                    data: hommesData,
                    backgroundColor: this.colors.secondary
                },
                {
                    label: 'Femmes',
                    data: femmesData,
                    backgroundColor: this.colors.primary
                }
            ]
        });
    }

    createRegionChart() {
        if (!window.chartManager || !this.communeStats) return;

        const regionStats = {};
        this.data.parcelles.forEach(p => {
            const region = p.region || 'Inconnu';
            if (!regionStats[region]) regionStats[region] = 0;
            regionStats[region]++;
        });

        window.chartManager.createDoughnut('regionChart', {
            labels: Object.keys(regionStats),
            datasets: [{
                data: Object.values(regionStats),
                backgroundColor: this.colors.chartColors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        });
    }

    createNicadChart() {
        if (!window.chartManager || !this.communeStats) return;

        const communes = Object.keys(this.communeStats).slice(0, 10);
        const data = communes.map(c => this.communeStats[c].nicad_oui);

        window.chartManager.createBar('nicadChart', {
            labels: communes,
            datasets: [{
                label: 'Parcelles avec NICAD',
                data: data,
                backgroundColor: this.colors.success
            }]
        });
    }

    createObjectifsChart() {
        if (!window.chartManager || !this.data.projections) return;

        const mois = this.data.projections.map(p => p.mois);
        const objectifs = this.data.projections.map(p => p.valeur);
        const realises = this.data.projections.map(p => p.realise || 0);

        window.chartManager.createBar('objectifsChart', {
            labels: mois,
            datasets: [
                {
                    label: 'Objectif',
                    data: objectifs,
                    backgroundColor: this.colors.primary
                },
                {
                    label: 'Réalisé',
                    data: realises,
                    backgroundColor: this.colors.success
                }
            ]
        });
    }

    populateFilters() {
        if (!this.data.parcelles) return;

        const communes = [...new Set(this.data.parcelles.map(p => p.commune))].sort();
        const communeFilter = document.getElementById('communeFilter');
        if (communeFilter) {
            communeFilter.innerHTML = '<option value="">Toutes les communes</option>' +
                communes.map(c => `<option value="${c}">${c}</option>`).join('');
        }
    }

    populateEtatAvancementFilters() {
        if (!this.data.etatOperations) return;

        const regions = [...new Set(this.data.etatOperations.map(o => o.region))].sort();
        const etats = [...new Set(this.data.etatOperations.map(o => o.etat_d_avancement))].sort();
        const communes = [...new Set(this.data.etatOperations.map(o => o.commune))].sort();
        const csigs = [...new Set(this.data.etatOperations.map(o => o.csig))].sort();

        const regionFilter = document.getElementById('regionFilterEtat');
        const etatFilter = document.getElementById('etatFilterEtat');
        const communeFilter = document.getElementById('communeFilterEtat');
        const csigFilter = document.getElementById('csigFilterEtat');

        if (regionFilter) {
            regionFilter.innerHTML = '<option value="">Toutes les régions</option>' +
                regions.map(r => `<option value="${r}">${r}</option>`).join('');
        }
        if (etatFilter) {
            etatFilter.innerHTML = '<option value="">Tous les états</option>' +
                etats.map(e => `<option value="${e}">${e}</option>`).join('');
        }
        if (communeFilter) {
            communeFilter.innerHTML = '<option value="">Toutes les communes</option>' +
                communes.map(c => `<option value="${c}">${c}</option>`).join('');
        }
        if (csigFilter) {
            csigFilter.innerHTML = '<option value="">Tous les CSIG</option>' +
                csigs.map(c => `<option value="${c}">${c}</option>`).join('');
        }
    }

    getFilteredEtatOperations() {
        let data = this.data.etatOperations || [];
        const regionFilter = document.getElementById('regionFilterEtat')?.value;
        const etatFilter = document.getElementById('etatFilterEtat')?.value;
        const communeFilter = document.getElementById('communeFilterEtat')?.value;
        const csigFilter = document.getElementById('csigFilterEtat')?.value;

        if (regionFilter) data = data.filter(o => o.region === regionFilter);
        if (etatFilter) data = data.filter(o => o.etat_d_avancement === etatFilter);
        if (communeFilter) data = data.filter(o => o.commune === communeFilter);
        if (csigFilter) data = data.filter(o => o.csig === csigFilter);

        return data;
    }

    renderEtatTimeline() {
        const timelineContainer = document.getElementById('etatTimeline');
        if (!timelineContainer || !this.data.etatOperations) return;

        const groupedByDate = this.getFilteredEtatOperations().reduce((acc, op) => {
            const date = op.date || 'Date inconnue';
            if (!acc[date]) acc[date] = [];
            acc[date].push(op);
            return acc;
        }, {});

        const timelineHTML = Object.entries(groupedByDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 10)
            .map(([date, ops]) => {
                const communes = [...new Set(ops.map(o => o.commune))];
                return `
                    <div class="timeline-item">
                        <div class="timeline-date">${date}</div>
                        <div class="timeline-content">
                            <div class="timeline-stats">
                                <strong>${ops.length} opérations</strong> dans ${communes.length} commune(s)
                            </div>
                            <div class="timeline-details">
                                ${communes.slice(0, 3).join(', ')}${communes.length > 3 ? '...' : ''}
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');

        timelineContainer.innerHTML = timelineHTML;
    }

    renderPerformanceList() {
        const listContainer = document.getElementById('performanceList');
        if (!listContainer || !this.data.projections) return;

        const performanceHTML = this.data.projections
            .map(p => {
                const taux = p.realise ? ((p.realise / p.valeur) * 100).toFixed(1) : 0;
                const statusClass = taux >= 90 ? 'bg-success' : taux >= 70 ? 'bg-warning' : 'bg-danger';
                return `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${p.mois}</strong><br>
                            Réalisé: ${p.realise?.toLocaleString() || 0} / ${p.valeur.toLocaleString()}
                        </div>
                        <span class="badge ${statusClass} rounded-pill">${taux}%</span>
                    </div>
                `;
            })
            .join('');

        listContainer.innerHTML = performanceHTML;
    }

    renderParcellesTable() {
        const tbody = document.getElementById('parcellesTableBody');
        if (!tbody || !this.communeStats) return;

        tbody.innerHTML = '';
        Object.entries(this.communeStats).forEach(([commune, stats]) => {
            const region = this.getRegionForCommune(commune);
            const nicadPct = stats.total > 0 ? ((stats.nicad_oui / stats.total) * 100).toFixed(1) : 0;
            const delibPct = stats.total > 0 ? ((stats.deliberees_oui / stats.total) * 100).toFixed(1) : 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${commune}</td>
                <td>${region}</td>
                <td class="text-end">${stats.total.toLocaleString()}</td>
                <td class="text-end">${stats.nicad_oui.toLocaleString()}</td>
                <td class="text-end">${nicadPct}%</td>
                <td class="text-end">${stats.deliberees_oui.toLocaleString()}</td>
                <td class="text-end">${delibPct}%</td>
                <td class="text-end">${stats.superficie.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
            `;
            tbody.appendChild(row);
        });
    }

    renderPostTraitementTable() {
        const tbody = document.getElementById('postTableBody');
        if (!tbody) return;

        const postData = [
            { commune: 'NDOGA BABACAR', geom: 'FALL Mamadou', recues: 1250, traitees: 1180, date: '2025-01-15' },
            { commune: 'BANDAFASSI', geom: 'DIALLO Aissatou', recues: 980, traitees: 920, date: '2025-02-10' },
            { commune: 'DIMBOLI', geom: 'NDIAYE Ousmane', recues: 845, traitees: 790, date: '2025-03-05' },
            { commune: 'MISSIRAH', geom: 'FALL Mamadou', recues: 720, traitees: 650, date: '2025-04-12' },
            { commune: 'NETTEBOULOU', geom: 'DIALLO Aissatou', recues: 650, traitees: 580, date: '2025-05-20' }
        ];

        const communeFilter = document.getElementById('postCommuneFilter')?.value;
        const geomFilter = document.getElementById('postGeomFilter')?.value;

        const filteredData = postData.filter(item => {
            return (!communeFilter || item.commune === communeFilter) &&
                   (!geomFilter || item.geom === geomFilter);
        });

        tbody.innerHTML = filteredData.map(item => `
            <tr>
                <td>${item.commune}</td>
                <td>${item.geom}</td>
                <td class="text-end">${item.recues.toLocaleString()}</td>
                <td class="text-end">${item.traitees.toLocaleString()}</td>
                <td class="text-end">${((item.traitees / item.recues) * 100).toFixed(1)}%</td>
                <td>${item.date}</td>
            </tr>
        `).join('');
    }

    exportParcellesData() {
        if (!this.filteredParcelles && !this.data.parcelles) {
            this.showError('Aucune donnée à exporter');
            return;
        }

        const data = this.filteredParcelles || this.data.parcelles;
        const csv = [
            ['Commune', 'Région', 'NICAD', 'Délibérée', 'Superficie'].join(','),
            ...data.map(p => [
                `"${p.commune}"`,
                `"${p.region || 'N/A'}"`,
                p.nicad,
                p.deliberee,
                p.superficie || 'N/A'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'parcelles_export.csv';
        link.click();
    }

    exportPostData() {
        const postData = [
            { commune: 'NDOGA BABACAR', geom: 'FALL Mamadou', recues: 1250, traitees: 1180, date: '2025-01-15' },
            { commune: 'BANDAFASSI', geom: 'DIALLO Aissatou', recues: 980, traitees: 920, date: '2025-02-10' },
            { commune: 'DIMBOLI', geom: 'NDIAYE Ousmane', recues: 845, traitees: 790, date: '2025-03-05' },
            { commune: 'MISSIRAH', geom: 'FALL Mamadou', recues: 720, traitees: 650, date: '2025-04-12' },
            { commune: 'NETTEBOULOU', geom: 'DIALLO Aissatou', recues: 650, traitees: 580, date: '2025-05-20' }
        ];

        const communeFilter = document.getElementById('postCommuneFilter')?.value;
        const geomFilter = document.getElementById('postGeomFilter')?.value;

        const filteredData = postData.filter(item => {
            return (!communeFilter || item.commune === communeFilter) &&
                   (!geomFilter || item.geom === geomFilter);
        });

        const csv = [
            ['Commune', 'Géomètre', 'Parcelles reçues', 'Parcelles traitées', 'Taux', 'Date'].join(','),
            ...filteredData.map(item => [
                `"${item.commune}"`,
                `"${item.geom}"`,
                item.recues,
                item.traitees,
                ((item.traitees / item.recues) * 100).toFixed(1),
                item.date
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'post_traitement_export.csv';
        link.click();
    }

    exportTopoData() {
        if (!this.filteredTopoData || this.filteredTopoData.length === 0) {
            this.showError('Aucune donnée topographique à exporter');
            return;
        }

        const csv = [
            ['Date', 'Topographe', 'Commune', 'Champs', 'Bâtis', 'Total'].join(','),
            ...this.filteredTopoData.map(item => [
                item.date || '-',
                `"${item.prenom} ${item.nom}"`,
                `"${item.commune || '-'}"`,
                item.champs || 0,
                item.batis || 0,
                item.totale_parcelles || 0
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'topo_export.csv';
        link.click();
    }

    async exportRapportGenre() {
        if (!this.data.repartitionGenre || !this.data.genreCommune || !this.data.genreTrimestre) {
            this.showError('Données de genre indisponibles pour l\'exportation');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let yOffset = 20;

        // Titre
        doc.setFontSize(18);
        doc.text('Rapport de Répartition par Genre - PROCASEF Boundou', 20, yOffset);
        yOffset += 10;

        // Date de génération
        doc.setFontSize(12);
        const today = new Date().toLocaleDateString('fr-FR');
        doc.text(`Généré le : ${today}`, 20, yOffset);
        yOffset += 15;

        // Statistiques globales
        doc.setFontSize(14);
        doc.text('1. Statistiques Globales', 20, yOffset);
        yOffset += 10;

        doc.setFontSize(12);
        const hommes = this.data.repartitionGenre.find(r => r.genre === 'Homme')?.total_nombre || 0;
        const femmes = this.data.repartitionGenre.find(r => r.genre === 'Femme')?.total_nombre || 0;
        const total = hommes + femmes;
        const hommesPct = total > 0 ? ((hommes / total) * 100).toFixed(1) : 0;
        const femmesPct = total > 0 ? ((femmes / total) * 100).toFixed(1) : 0;

        doc.text(`Total Hommes : ${hommes.toLocaleString()} (${hommesPct}%)`, 20, yOffset);
        yOffset += 7;
        doc.text(`Total Femmes : ${femmes.toLocaleString()} (${femmesPct}%)`, 20, yOffset);
        yOffset += 7;
        doc.text(`Total Général : ${total.toLocaleString()}`, 20, yOffset);
        yOffset += 10;

        doc.text('Explication : Ce graphique montre la répartition globale des bénéficiaires par genre, mettant en évidence la proportion d\'hommes et de femmes dans le projet.', 20, yOffset, { maxWidth: 170 });
        yOffset += 20;

        // Graphique global
        const globalChartCanvas = document.getElementById('genreGlobalChart');
        if (globalChartCanvas) {
            try {
                const globalChartImg = await html2canvas(globalChartCanvas);
                const imgData = globalChartImg.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 20, yOffset, 170, 80);
                yOffset += 90;
            } catch (error) {
                console.error('Erreur lors de la capture du graphique global:', error);
                doc.text('Graphique global indisponible', 20, yOffset);
                yOffset += 10;
            }
        }

        // Répartition par commune
        if (yOffset > 250) {
            doc.addPage();
            yOffset = 20;
        }

        doc.setFontSize(14);
        doc.text('2. Répartition par Commune', 20, yOffset);
        yOffset += 10;

        doc.setFontSize(12);
        const communes = [...new Set(this.data.genreCommune.map(g => g.commune))].slice(0, 10);
        communes.forEach(c => {
            const hommesC = this.data.genreCommune.find(g => g.commune === c && g.genre === 'Homme')?.nombre || 0;
            const femmesC = this.data.genreCommune.find(g => g.commune === c && g.genre === 'Femme')?.nombre || 0;
            doc.text(`${c} : Hommes ${hommesC.toLocaleString()}, Femmes ${femmesC.toLocaleString()}`, 20, yOffset);
            yOffset += 7;
        });
        yOffset += 10;

        doc.text('Explication : Cette section détaille la répartition des bénéficiaires par genre dans les principales communes, permettant d\'identifier les disparités régionales.', 20, yOffset, { maxWidth: 170 });
        yOffset += 20;

        const communeChartCanvas = document.getElementById('genreCommuneChart');
        if (communeChartCanvas) {
            try {
                const communeChartImg = await html2canvas(communeChartCanvas);
                const imgData = communeChartImg.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 20, yOffset, 170, 80);
                yOffset += 90;
            } catch (error) {
                console.error('Erreur lors de la capture du graphique par commune:', error);
                doc.text('Graphique par commune indisponible', 20, yOffset);
                yOffset += 10;
            }
        }

        // Répartition par trimestre
        if (yOffset > 250) {
            doc.addPage();
            yOffset = 20;
        }

        doc.setFontSize(14);
        doc.text('3. Répartition par Trimestre', 20, yOffset);
        yOffset += 10;

        doc.setFontSize(12);
        const trimestres = [...new Set(this.data.genreTrimestre.map(g => g.trimestre))];
        trimestres.forEach(t => {
            const hommesT = this.data.genreTrimestre.find(g => g.trimestre === t && g.genre === 'Homme')?.nombre || 0;
            const femmesT = this.data.genreTrimestre.find(g => g.trimestre === t && g.genre === 'Femme')?.nombre || 0;
            doc.text(`${t} : Hommes ${hommesT.toLocaleString()}, Femmes ${femmesT.toLocaleString()}`, 20, yOffset);
            yOffset += 7;
        });
        yOffset += 10;

        doc.text('Explication : Cette section montre l\'évolution temporelle de la répartition par genre, soulignant les tendances au fil des trimestres.', 20, yOffset, { maxWidth: 170 });
        yOffset += 20;

        const trimestreChartCanvas = document.getElementById('genreTrimestreChart');
        if (trimestreChartCanvas) {
            try {
                const trimestreChartImg = await html2canvas(trimestreChartCanvas);
                const imgData = trimestreChartImg.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 20, yOffset, 170, 80);
                yOffset += 90;
            } catch (error) {
                console.error('Erreur lors de la capture du graphique par trimestre:', error);
                doc.text('Graphique par trimestre indisponible', 20, yOffset);
                yOffset += 10;
            }
        }

        // Sauvegarde du PDF
        doc.save('Rapport_Genre_PROCASEF.pdf');
    }

    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    handleResize() {
        Object.entries(this.charts).forEach(([id, chart]) => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
}

// MapManager est défini dans map.js

// ChartManager est défini dans charts.js

// Initialisation au chargement du DOM
window.addEventListener('DOMContentLoaded', () => {
    // ChartManager est déjà créé dans charts.js
    const dashboard = new ProcasefDashboard();
});
