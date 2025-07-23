// PROCASEF Dashboard Application - Version complète avec section Stats Topo
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
            topoData: null // Nouvelles données topo
        };

        this.currentSection = 'accueil';
        this.fontSize = 14;
        this.filteredParcelles = null;
        this.filteredTopoData = null; // Données topo filtrées
        
        // Filtres existants
        this.filters = {
            commune: '',
            nicad: '',
            deliberation: ''
        };

        // Nouveaux filtres topo
        this.topoFilters = {
            dateFrom: '',
            dateTo: '',
            commune: '',
            topographe: '',
            village: '',
            type: ''
        };

        // État des tableaux
        this.topoTableState = {
            currentPage: 1,
            pageSize: 10,
            searchTerm: '',
            sortField: 'date',
            sortDirection: 'desc',
            data: []
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

        // Chargement des données topographiques
        try {
            this.data.topoData = await this.dataLoader.loadData('data/Rapports_Topo_nettoyee.json');
            console.log('Données topo chargées:', this.data.topoData?.length || 0, 'enregistrements');
        } catch (e) {
            console.error('Échec chargement données topo:', e);
            this.data.topoData = [];
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

        // Filters existants
        ['communeFilter', 'nicadFilter', 'deliberationFilter', 'postCommuneFilter', 'postGeomFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.applyFilters());
            }
        });

        // Nouveaux filtres topo
        ['dateFromFilter', 'dateToFilter', 'communeTopoFilter', 'topographeFilter', 'villageTopoFilter', 'typeTopoFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.applyTopoFilters());
            }
        });

        // Boutons topo
        const resetTopoBtn = document.getElementById('resetTopoFiltersBtn');
        const exportTopoBtn = document.getElementById('exportTopoBtn');
        
        if (resetTopoBtn) {
            resetTopoBtn.addEventListener('click', () => this.resetTopoFilters());
        }
        
        if (exportTopoBtn) {
            exportTopoBtn.addEventListener('click', () => this.exportTopoData());
        }

        // Table topo controls
        const searchTopoInput = document.getElementById('tableTopoSearch');
        const pageSizeTopoSelect = document.getElementById('tableTopoPageSize');
        const prevTopoBtnbton = document.getElementById('prevTopoPageBtn');
        const nextTopoBtn = document.getElementById('nextTopoPageBtn');

        if (searchTopoInput) {
            searchTopoInput.addEventListener('input', (e) => {
                this.topoTableState.searchTerm = e.target.value.toLowerCase();
                this.topoTableState.currentPage = 1;
                this.renderTopoTable();
            });
        }

        if (pageSizeTopoSelect) {
            pageSizeTopoSelect.addEventListener('change', (e) => {
                this.topoTableState.pageSize = parseInt(e.target.value);
                this.topoTableState.currentPage = 1;
                this.renderTopoTable();
            });
        }

        if (prevTopoBtnbton) {
            prevTopoBtnbton.addEventListener('click', () => {
                if (this.topoTableState.currentPage > 1) {
                    this.topoTableState.currentPage--;
                    this.renderTopoTable();
                }
            });
        }

        if (nextTopoBtn) {
            nextTopoBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.topoTableState.data.length / this.topoTableState.pageSize);
                if (this.topoTableState.currentPage < totalPages) {
                    this.topoTableState.currentPage++;
                    this.renderTopoTable();
                }
            });
        }

        // Sortable headers topo
        document.querySelectorAll('#topoTable th[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                if (this.topoTableState.sortField === field) {
                    this.topoTableState.sortDirection = this.topoTableState.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.topoTableState.sortField = field;
                    this.topoTableState.sortDirection = 'asc';
                }
                this.renderTopoTable();
            });
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

        // Détruire la carte si on quitte la section parcelles
        if (this.mapManager && this.mapManager.map && sectionId !== 'parcelles') {
            console.log('Destruction de la carte avant changement de section');
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
            'rapport': 'Rapport Complet',
            'stats-topo': 'Statistiques Topographiques'
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
                    this.populateEtatAvancementFilters();
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

            case 'rapport':
                if (!this.data.rapportComplet) {
                    this.data.rapportComplet = await this.dataLoader.loadData('data/rapport_complet.json');
                }
                break;

            case 'stats-topo':
                if (!this.data.topoData) {
                    this.data.topoData = await this.dataLoader.loadData('data/Rapports_Topo_nettoyee.json');
                }
                this.populateTopoFilters();
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
            case 'rapport':
                this.renderRapport();
                break;
            case 'stats-topo':
                this.renderStatsTopo();
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
        this.updateProgressBar();
        setTimeout(() => {
            const dataArr = this.getFilteredEtatOperations();
            const communes = dataArr.map(x => x.commune);
            const etats = dataArr.map(x => x.etat_d_avancement || "Non défini");

            // Bar chart horizontal
            window.chartManager.createEtatCommuneBarChart('etatCommuneBarChart', communes, etats);

            // Donut chart
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

            this.renderEtatTimeline();
        }, 200);
    }

    // NOUVELLE MÉTHODE: Rendu de la section Stats Topo
    renderStatsTopo() {
        console.log('Rendu de la section Stats Topo');
        
        if (!this.data.topoData || this.data.topoData.length === 0) {
            console.warn('Aucunes données topographiques disponibles');
            return;
        }

        // Appliquer les filtres initiaux
        this.applyTopoFilters();

        setTimeout(() => {
            this.updateTopoKPIs();
            this.createTopoCharts();
            this.renderTopoTable();
            this.renderTopoTimeline();
        }, 200);
    }

    // NOUVELLE MÉTHODE: Population des filtres topo
    populateTopoFilters() {
        if (!this.data.topoData || this.data.topoData.length === 0) return;

        // Extraire les valeurs uniques
        const communes = [...new Set(this.data.topoData.map(d => d.commune).filter(Boolean))].sort();
        const topographes = [...new Set(this.data.topoData.map(d => `${d.prenom || ''} ${d.nom || ''}`.trim()).filter(Boolean))].sort();
        const villages = [...new Set(this.data.topoData.map(d => d.village).filter(Boolean))].sort();

        // Populer les selects
        this.populateSelect('communeTopoFilter', communes);
        this.populateSelect('topographeFilter', topographes);
        this.populateSelect('villageTopoFilter', villages);
    }

    // NOUVELLE MÉTHODE: Population d'un select
    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        const firstOption = select.querySelector('option[value=""]');
        
        select.innerHTML = '';
        if (firstOption) {
            select.appendChild(firstOption);
        }

        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });

        select.value = currentValue;
    }

    // NOUVELLE MÉTHODE: Application des filtres topo
    applyTopoFilters() {
        if (!this.data.topoData) {
            this.filteredTopoData = [];
            return;
        }

        // Récupérer les valeurs des filtres
        this.topoFilters = {
            dateFrom: document.getElementById('dateFromFilter')?.value || '',
            dateTo: document.getElementById('dateToFilter')?.value || '',
            commune: document.getElementById('communeTopoFilter')?.value || '',
            topographe: document.getElementById('topographeFilter')?.value || '',
            village: document.getElementById('villageTopoFilter')?.value || '',
            type: document.getElementById('typeTopoFilter')?.value || ''
        };

        // Appliquer les filtres
        this.filteredTopoData = this.data.topoData.filter(item => {
            // Filtre par date
            if (this.topoFilters.dateFrom && item.date && item.date < this.topoFilters.dateFrom) return false;
            if (this.topoFilters.dateTo && item.date && item.date > this.topoFilters.dateTo) return false;

            // Filtre par commune
            if (this.topoFilters.commune && item.commune !== this.topoFilters.commune) return false;

            // Filtre par topographe
            const topographeFullName = `${item.prenom || ''} ${item.nom || ''}`.trim();
            if (this.topoFilters.topographe && topographeFullName !== this.topoFilters.topographe) return false;

            // Filtre par village
            if (this.topoFilters.village && item.village !== this.topoFilters.village) return false;

            // Filtre par type
            if (this.topoFilters.type) {
                if (this.topoFilters.type === 'champs' && (!item.champs || item.champs === 0)) return false;
                if (this.topoFilters.type === 'batis' && (!item.batis || item.batis === 0)) return false;
            }

            return true;
        });

        console.log('Données filtrées:', this.filteredTopoData.length, 'sur', this.data.topoData.length);

        // Mettre à jour l'état du tableau
        this.topoTableState.data = this.filteredTopoData;
        this.topoTableState.currentPage = 1;

        // Refaire le rendu si on est sur la section stats-topo
        if (this.currentSection === 'stats-topo') {
            this.updateTopoKPIs();
            this.createTopoCharts();
            this.renderTopoTable();
            this.renderTopoTimeline();
        }
    }

    // NOUVELLE MÉTHODE: Reset des filtres topo
    resetTopoFilters() {
        document.getElementById('dateFromFilter').value = '';
        document.getElementById('dateToFilter').value = '';
        document.getElementById('communeTopoFilter').value = '';
        document.getElementById('topographeFilter').value = '';
        document.getElementById('villageTopoFilter').value = '';
        document.getElementById('typeTopoFilter').value = '';
        
        this.applyTopoFilters();
    }

    // NOUVELLE MÉTHODE: Mise à jour des KPIs topo
    updateTopoKPIs() {
        const data = this.filteredTopoData || [];

        const totalChamps = data.reduce((sum, d) => sum + (parseFloat(d.champs) || 0), 0);
        const totalBatis = data.reduce((sum, d) => sum + (parseFloat(d.batis) || 0), 0);
        const totalParcelles = data.reduce((sum, d) => sum + (parseFloat(d.totale_parcelles) || 0), 0);

        // Calculer la moyenne par jour
        const dateGroups = this.groupByDate(data);
        const avgParJour = Object.keys(dateGroups).length > 0 ? 
            Math.round(totalParcelles / Object.keys(dateGroups).length) : 0;

        // Statistiques par topographe
        const topoStats = this.getTopographerStats(data);
        const topTopo = topoStats.length > 0 ? topoStats[0] : null;
        const activeTopos = topoStats.length;

        // Mettre à jour les KPIs
        this.updateKPIElement('totalChampsKPI', totalChamps);
        this.updateKPIElement('totalBatisKPI', totalBatis);
        this.updateKPIElement('totalParcellestopoKPI', totalParcelles);
        this.updateKPIElement('avgParJourKPI', avgParJour);
        this.updateKPIElement('topTopoKPI', topTopo ? `${topTopo.name} (${topTopo.total})` : '-');
        this.updateKPIElement('activeTopoKPI', activeTopos);
    }

    // NOUVELLE MÉTHODE: Création des graphiques topo
    createTopoCharts() {
        if (!this.filteredTopoData || this.filteredTopoData.length === 0) return;

        // Top 10 Topographes
        const topoStats = this.getTopographerStats(this.filteredTopoData).slice(0, 10);
        this.createTopTopographesChart(topoStats);

        // Totaux par commune
        const communeStats = this.getCommuneStats(this.filteredTopoData);
        this.createTopoCommunesChart(communeStats);

        // Évolution mensuelle
        const monthlyStats = this.getMonthlyStats(this.filteredTopoData);
        this.createTopoEvolutionChart(monthlyStats);
    }

    // NOUVELLE MÉTHODE: Graphique top topographes
    createTopTopographesChart(data) {
        const canvas = document.getElementById('topTopographesChart');
        if (!canvas) return;

        if (this.charts.topTopographesChart) {
            this.charts.topTopographesChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        this.charts.topTopographesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.name),
                datasets: [{
                    label: 'Total Parcelles',
                    data: data.map(d => d.total),
                    backgroundColor: this.colors.primary,
                    borderColor: this.colors.primary,
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: this.colors.secondary,
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF'
                    }
                },
                scales: {
                    x: { beginAtZero: true },
                    y: { ticks: { maxTicksLimit: 10 } }
                }
            }
        });
    }

    // NOUVELLE MÉTHODE: Graphique communes topo
    createTopoCommunesChart(data) {
        const canvas = document.getElementById('topoCommunesChart');
        if (!canvas) return;

        if (this.charts.topoCommunesChart) {
            this.charts.topoCommunesChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        this.charts.topoCommunesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.name),
                datasets: [
                    {
                        label: 'Champs',
                        data: data.map(d => d.champs),
                        backgroundColor: this.colors.success,
                        borderRadius: 6
                    },
                    {
                        label: 'Bâtis',
                        data: data.map(d => d.batis),
                        backgroundColor: this.colors.primary,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        backgroundColor: this.colors.secondary,
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF'
                    }
                }
            }
        });
    }

    // NOUVELLE MÉTHODE: Graphique évolution mensuelle
    createTopoEvolutionChart(data) {
        const canvas = document.getElementById('topoEvolutionChart');
        if (!canvas) return;

        if (this.charts.topoEvolutionChart) {
            this.charts.topoEvolutionChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        this.charts.topoEvolutionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.month),
                datasets: [
                    {
                        label: 'Champs',
                        data: data.map(d => d.champs),
                        borderColor: this.colors.success,
                        backgroundColor: this.colors.success + '20',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Bâtis',
                        data: data.map(d => d.batis),
                        borderColor: this.colors.primary,
                        backgroundColor: this.colors.primary + '20',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        backgroundColor: this.colors.secondary,
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF'
                    }
                }
            }
        });
    }

    // NOUVELLE MÉTHODE: Rendu du tableau topo
    renderTopoTable() {
        const tableBody = document.querySelector('#topoTable tbody');
        if (!tableBody) return;

        let data = [...(this.topoTableState.data || [])];

        // Appliquer la recherche
        if (this.topoTableState.searchTerm) {
            data = data.filter(item => {
                const searchText = this.topoTableState.searchTerm;
                return (
                    (item.date && item.date.includes(searchText)) ||
                    (item.prenom && item.prenom.toLowerCase().includes(searchText)) ||
                    (item.nom && item.nom.toLowerCase().includes(searchText)) ||
                    (item.commune && item.commune.toLowerCase().includes(searchText)) ||
                    (item.village && item.village.toLowerCase().includes(searchText)) ||
                    (item.deroulement_des_operations && item.deroulement_des_operations.toLowerCase().includes(searchText))
                );
            });
        }

        // Appliquer le tri
        data.sort((a, b) => {
            let aVal = a[this.topoTableState.sortField];
            let bVal = b[this.topoTableState.sortField];

            // Gestion des valeurs spéciales
            if (this.topoTableState.sortField === 'topographe') {
                aVal = `${a.prenom} ${a.nom}`;
                bVal = `${b.prenom} ${b.nom}`;
            }

            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (this.topoTableState.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        // Pagination
        const totalItems = data.length;
        const totalPages = Math.ceil(totalItems / this.topoTableState.pageSize);
        const startIndex = (this.topoTableState.currentPage - 1) * this.topoTableState.pageSize;
        const endIndex = startIndex + this.topoTableState.pageSize;
        const paginatedData = data.slice(startIndex, endIndex);

        // Nettoyer le tableau
        tableBody.innerHTML = '';

        // Remplir le tableau
        paginatedData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.date || '-'}</td>
                <td>${item.prenom || ''} ${item.nom || ''}</td>
                <td>${item.commune || '-'}</td>
                <td>${item.village || '-'}</td>
                <td>${item.champs || 0}</td>
                <td>${item.batis || 0}</td>
                <td><strong>${item.totale_parcelles || 0}</strong></td>
                <td><span class="status ${this.getOperationStatusClass(item.deroulement_des_operations)}">${item.deroulement_des_operations || '-'}</span></td>
            `;
            tableBody.appendChild(row);
        });

        // Mettre à jour les contrôles de pagination
        this.updateTopoTableControls(totalItems, totalPages);
    }

    // NOUVELLE MÉTHODE: Mise à jour des contrôles du tableau
    updateTopoTableControls(totalItems, totalPages) {
        const infoElement = document.getElementById('topoTableInfo');
        const pageElement = document.getElementById('currentTopoPage');
        const prevBtn = document.getElementById('prevTopoPageBtn');
        const nextBtn = document.getElementById('nextTopoPageBtn');

        if (infoElement) {
            const start = (this.topoTableState.currentPage - 1) * this.topoTableState.pageSize + 1;
            const end = Math.min(start + this.topoTableState.pageSize - 1, totalItems);
            infoElement.textContent = `Affichage de ${start} à ${end} sur ${totalItems} entrées`;
        }

        if (pageElement) {
            pageElement.textContent = `Page ${this.topoTableState.currentPage} sur ${totalPages}`;
        }

        if (prevBtn) {
            prevBtn.disabled = this.topoTableState.currentPage <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = this.topoTableState.currentPage >= totalPages;
        }
    }

    // NOUVELLE MÉTHODE: Timeline des opérations topo
    renderTopoTimeline() {
        const container = document.getElementById('topoTimeline');
        if (!container) return;

        const timelineData = (this.filteredTopoData || [])
            .filter(d => d.date && d.deroulement_des_operations)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20); // Limiter pour les performances

        container.innerHTML = '';

        if (timelineData.length === 0) {
            container.innerHTML = '<p class="text-center">Aucune donnée de déroulement disponible</p>';
            return;
        }

        timelineData.forEach(item => {
            const timelineItem = document.createElement('div');
            timelineItem.className = `timeline-item ${this.getTimelineItemClass(item.deroulement_des_operations)}`;

            const date = new Date(item.date).toLocaleDateString('fr-FR');
            const topographe = `${item.prenom || ''} ${item.nom || ''}`.trim();

            timelineItem.innerHTML = `
                <div class="timeline-content">
                    <div class="timeline-commune">${item.commune} - ${item.village}</div>
                    <div class="timeline-status">${date} • ${topographe} • ${item.totale_parcelles || 0} parcelles</div>
                    <div class="timeline-details">${item.deroulement_des_operations}</div>
                </div>
            `;

            container.appendChild(timelineItem);
        });
    }

    // NOUVELLE MÉTHODE: Export des données topo
    exportTopoData() {
        if (!this.filteredTopoData || this.filteredTopoData.length === 0) {
            alert('Aucune donnée à exporter');
            return;
        }

        const headers = [
            'Date', 'Prénom', 'Nom', 'Topographe', 'Commune', 'Village', 
            'Champs', 'Bâtis', 'Total Parcelles', 'Déroulement des Opérations'
        ];

        const csvData = this.filteredTopoData.map(item => [
            item.date || '',
            item.prenom || '',
            item.nom || '',
            `${item.prenom || ''} ${item.nom || ''}`.trim(),
            item.commune || '',
            item.village || '',
            item.champs || 0,
            item.batis || 0,
            item.totale_parcelles || 0,
            item.deroulement_des_operations || ''
        ]);

        this.downloadCSV(headers, csvData, 'stats_topo_procasef');
    }

    // MÉTHODES UTILITAIRES POUR STATS TOPO

    groupByDate(data) {
        return data.reduce((groups, item) => {
            const date = item.date;
            if (date) {
                groups[date] = groups[date] || [];
                groups[date].push(item);
            }
            return groups;
        }, {});
    }

    getTopographerStats(data) {
        const stats = data.reduce((acc, item) => {
            const name = `${item.prenom || ''} ${item.nom || ''}`.trim();
            if (!name) return acc;

            if (!acc[name]) {
                acc[name] = { name, total: 0, champs: 0, batis: 0 };
            }
            acc[name].total += parseFloat(item.totale_parcelles) || 0;
            acc[name].champs += parseFloat(item.champs) || 0;
            acc[name].batis += parseFloat(item.batis) || 0;
            return acc;
        }, {});

        return Object.values(stats).sort((a, b) => b.total - a.total);
    }

    getCommuneStats(data) {
        const stats = data.reduce((acc, item) => {
            const commune = item.commune;
            if (!commune) return acc;

            if (!acc[commune]) {
                acc[commune] = { name: commune, champs: 0, batis: 0 };
            }
            acc[commune].champs += parseFloat(item.champs) || 0;
            acc[commune].batis += parseFloat(item.batis) || 0;
            return acc;
        }, {});

        return Object.values(stats)
            .sort((a, b) => (b.champs + b.batis) - (a.champs + a.batis))
            .slice(0, 10); // Top 10
    }

    getMonthlyStats(data) {
        const stats = data.reduce((acc, item) => {
            if (!item.date) return acc;

            const date = new Date(item.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!acc[monthKey]) {
                acc[monthKey] = { month: monthKey, champs: 0, batis: 0 };
            }
            acc[monthKey].champs += parseFloat(item.champs) || 0;
            acc[monthKey].batis += parseFloat(item.batis) || 0;
            return acc;
        }, {});

        return Object.values(stats).sort((a, b) => a.month.localeCompare(b.month));
    }

    getOperationStatusClass(status) {
        if (!status) return '';
        const statusLower = status.toLowerCase();
        if (statusLower.includes('terminé') || statusLower.includes('complét')) return 'status--success';
        if (statusLower.includes('en cours') || statusLower.includes('difficile')) return 'status--warning';
        if (statusLower.includes('problème') || statusLower.includes('échec')) return 'status--error';
        return '';
    }

    getTimelineItemClass(status) {
        if (!status) return 'pending';
        const statusLower = status.toLowerCase();
        if (statusLower.includes('terminé') || statusLower.includes('complét')) return 'completed';
        if (statusLower.includes('en cours') || statusLower.includes('difficile')) return 'in-progress';
        return 'pending';
    }

    updateKPIElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            if (typeof value === 'number') {
                element.textContent = value.toLocaleString('fr-FR');
            } else {
                element.textContent = value;
            }
        }
    }

    // MÉTHODES EXISTANTES (conservées)...

    populateEtatAvancementFilters() {
        const arr = this.data.etatOperations || [];
        const regions = [...new Set(arr.map(e => e.region).filter(Boolean))].sort();
        const etats = [...new Set(arr.map(e => e.etat_d_avancement).filter(Boolean))].sort();
        const csigs = [...new Set(arr.map(e => e.csig).filter(Boolean))].sort();
        const communes = [...new Set(arr.map(e => e.commune).filter(Boolean))].sort();

        function updateSelect(selectId, options, allLabel) {
            const sel = document.getElementById(selectId);
            if (!sel) return;
            const prevValue = sel.value;
            sel.innerHTML = `<option value="">${allLabel}</option>` + 
                options.map(o => `<option value="${o}">${o}</option>`).join('');
            sel.value = prevValue;
            sel.onchange = () => window.procasefApp.renderEtatAvancement();
        }

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
            <div class="timeline-item ${this.getStatusClass(x.etat_d_avancement)}">
                <div class="timeline-content">
                    <div class="timeline-commune">${x.commune}</div>
                    <div class="timeline-status">${x.etat_d_avancement} • ${x.csig || 'N/A'}</div>
                </div>
            </div>
        `).join('');
    }

    getStatusClass(status) {
        if (!status) return 'pending';
        const statusLower = status.toLowerCase();
        if (statusLower.includes('terminé')) return 'completed';
        if (statusLower.includes('en cours') || statusLower.includes('presque')) return 'in-progress';
        return 'pending';
    }

    renderProjections() {
        // Implémentation des projections
        setTimeout(() => {
            this.createObjectifsChart();
            this.renderPerformanceList();
        }, 200);
    }

    renderGenre() {
        // Implémentation de la section genre
        setTimeout(() => {
            this.createGenreGlobalRepart();
            this.createGenreTrimestreChart();
            this.createGenreCommuneChart();
        }, 200);
    }

    renderRapport() {
        // Implémentation du rapport complet
        setTimeout(() => {
            this.createRapportCharts();
        }, 200);
    }

    createRapportCharts() {
        // Création des graphiques du rapport
        console.log('Création des graphiques du rapport...');
    }

    updateKPIs() {
        // Mise à jour des KPIs généraux
        if (!this.stats) return;

        const elements = {
            'totalParcellesKPI': this.stats.total.toLocaleString(),
            'nicadParcellesKPI': this.stats.nicad_oui.toLocaleString(),
            'delibereesParcellesKPI': this.stats.deliberees_oui.toLocaleString(),
            'superficieTotaleKPI': Math.round(this.stats.superficie_totale).toLocaleString()
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
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
        const OBJECTIF = 70000;
        const realise = this.stats?.total ?? 0;
        const performance = OBJECTIF > 0 ? ((realise / OBJECTIF) * 100).toFixed(1) : 0;
    
        this.updateElement('objectif2025', OBJECTIF.toLocaleString());
        this.updateElement('realise2025', realise.toLocaleString());
        this.updateElement('performance2025', `${performance}%`);
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

    // Chart creation methods simplifiés pour économiser l'espace
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
        this.create(); // Reuse the same chart
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

    handleResize() {
        // Redimensionner les graphiques
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
        
        // Redimensionner la carte via MapManager
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
        const postData = [
            { commune: 'NDOGA BABACAR', recues: 1250, traitees: 1180, taux: 94.4 },
            { commune: 'BANDAFASSI', recues: 980, traitees: 920, taux: 93.9 }
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

     downloadCSV(headers, data, filename) {
        const csvContent = [headers, ...data]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    }

    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};

        // Également détruire les charts du ChartManager global
        if (window.chartManager) {
            window.chartManager.destroyAll();
        }
    }

    handleResize() {
        // Gestion du redimensionnement
        setTimeout(() => {
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
        }, 100);
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }
}

// Export pour utilisation globale
if (typeof window !== 'undefined') {
    window.ProcasefDashboard = ProcasefDashboard;
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
