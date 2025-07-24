// PROCASEF Dashboard Application - Version complète corrigée
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

    // 🔴 AJOUT: Méthodes de loading manquantes
    showLoading() {
        const loadingEl = document.getElementById('loadingSpinner');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        } else {
            // Créer un spinner si n'existe pas
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

    // 🔴 AJOUT: Méthode toggleSidebar manquante
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar && mainContent) {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    }

    // 🔴 AJOUT: Méthode updateElement manquante
    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    // 🔴 AJOUT: Méthode getRegionForCommune manquante
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

    // 🔴 AJOUT: Méthode showError
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
        
        // Auto-remove after 5 seconds
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

    // 🔴 AJOUT: Méthode de chargement sécurisée
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

        // Event listeners pour les filtres topo
        ['topoCommuneFilter', 'topoTopographeFilter', 'topoDateFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.applyTopoFilters());
            }
        });

        // Export buttons
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

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setupFontSizeControls() {
        // Charger la préférence sauvegardée
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

        // Appliquer la taille de police initiale
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
        console.log('Navigation vers la section:', sectionId);
    
        // Destruction sécurisée de la carte
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
    
        // Met à jour les éléments de navigation active
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const activeNavItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeNavItem) activeNavItem.classList.add('active');
    
        // Affiche la bonne section et cache les autres
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) targetSection.classList.add('active');
    
        // Changer le titre
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
    
        // Chargement données avant rendu
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
            if (Array.isArray(config)) {
                // Charger plusieurs fichiers
                await Promise.allSettled(
                    config.map(c => this.loadDataSafely(c.path, c.key))
                );
            } else {
                // Charger un seul fichier
                if (!this.data[config.key] || this.data[config.key].length === 0) {
                    await this.loadDataSafely(config.path, config.key);
                }
            }

            // Actions spécifiques après chargement
            if (sec === 'stats-topo') {
                this.filteredTopoData = this.data.topoData || [];
                this.populateTopoFilters();
            }
        } catch (error) {
            console.error(`Erreur lors du chargement des données pour ${sec}:`, error);
        }
    }

    renderDashboard() {
        this.renderAccueil();
        this.populateFilters();
    }

    renderSection(sec) {
        // IMPORTANT: Détruire tous les charts AVANT de rendre une nouvelle section
        this.destroyAllCharts();
        
        // Petit délai pour s'assurer que la destruction est complète
        setTimeout(() => {
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
        }, 100); // Délai de 100ms pour la destruction
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
        this.populateEtatAvancementFilters();
        
        setTimeout(() => {
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
            this.createGenreGlobalChart();
            this.createGenreTrimestreChart();
            this.createGenreCommuneChart();
        }, 200);
    }

    renderRapport() {
        console.log('Rendu de la section Rapport');
        const data = this.data.rapportComplet || {};

        // KPIs synthèse globale
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

        setTimeout(() => this.renderRapportCharts(data), 200);
    }

    renderRapportCharts(data) {
        if (!window.chartManager) return;

        // Graphique sources
        const src = data["Détail par Source"] || [];
        if (src.length > 0) {
            window.chartManager.createStackedBar("rapportSourceChart", {
                labels: src.map(s => s.source),
                datasets: [
                    {
                        label: "Hommes",
                        data: src.map(s => s.hommes),
                        backgroundColor: this.colors.secondary
                    },
                    {
                        label: "Femmes",
                        data: src.map(s => s.femmes),
                        backgroundColor: this.colors.primary
                    }
                ]
            }, { 
                plugins: { 
                    title: { 
                        display: true, 
                        text: "Participants par source" 
                    } 
                }, 
                indexAxis: "y" 
            });
        }

        // Mixed Top 10 Communes
        const communesData = data["Analyse par Commune"]?.sort((a, b) => b.total - a.total).slice(0, 10) || [];
        if (communesData.length > 0) {
            window.chartManager.createMixedChart("rapportCommuneMixedChart", communesData);
        }

        // Évolution temporelle
        const temporal = data["Analyse Temporelle"] || [];
        if (temporal.length > 0) {
            window.chartManager.createTemporalChart("rapportTemporalChart", temporal);
        }

        // Polar par région
        const regions = data["Tamba-Kédougou"] || [];
        if (regions.length > 0) {
            window.chartManager.createPolarChart("rapportRegionPolarChart", regions);
        }
    }

    renderStatsTopo() {
        console.log('Rendu de la section Stats Topo');
        this.applyTopoFilters();
        setTimeout(() => {
            this.updateTopoKPIs();
            this.createTopoCharts();
            this.renderTopoTable();
            this.renderTopoTimeline();
        }, 200);
    }

    // 🔴 AJOUT: Méthode renderPostTraitement manquante
    renderPostTraitement() {
        console.log('Rendu de la section Post-Traitement');
        this.populatePostFilters();
        setTimeout(() => {
            this.renderPostTraitementTable();
            this.createPostCharts();
        }, 200);
    }

    // 🔴 AJOUT: Méthodes pour Post-Traitement
    populatePostFilters() {
        // Populate filters for post-traitement section
        const communes = ['NDOGA BABACAR', 'BANDAFASSI', 'DIMBOLI', 'MISSIRAH', 'NETTEBOULOU'];
        const geometres = ['FALL Mamadou', 'DIALLO Aissatou', 'NDIAYE Ousmane'];

        const communeSelect = document.getElementById('postCommuneFilter');
        if (communeSelect) {
            communeSelect.innerHTML = '<option value="">Toutes les communes</option>';
            communes.forEach(commune => {
                communeSelect.insertAdjacentHTML('beforeend', 
                    `<option value="${commune}">${commune}</option>`);
            });
        }

        const geomSelect = document.getElementById('postGeomFilter');
        if (geomSelect) {
            geomSelect.innerHTML = '<option value="">Tous les géomètres</option>';
            geometres.forEach(geom => {
                geomSelect.insertAdjacentHTML('beforeend', 
                    `<option value="${geom}">${geom}</option>`);
            });
        }
    }

    createPostCharts() {
        if (!window.chartManager) return;

        // Sample data for demonstration
        const postData = [
            { commune: 'NDOGA BABACAR', recues: 1250, traitees: 1180, taux: 94.4 },
            { commune: 'BANDAFASSI', recues: 980, traitees: 920, taux: 93.9 },
            { commune: 'DIMBOLI', recues: 845, traitees: 790, taux: 93.5 },
            { commune: 'MISSIRAH', recues: 720, traitees: 650, taux: 90.3 },
            { commune: 'NETTEBOULOU', recues: 650, traitees: 580, taux: 89.2 }
        ];

        // Chart des taux de traitement
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

    // Méthodes pour les filtres et stats topo
    populateTopoFilters() {
        if (!this.data.topoData || !Array.isArray(this.data.topoData)) return;
        
        const communes = [...new Set(this.data.topoData.map(t => t.commune).filter(Boolean))].sort();
        const topographes = [...new Set(this.data.topoData.map(t => `${t.prenom || ''} ${t.nom || ''}`).filter(name => name.trim()))].sort();
        
        // Populate commune filter
        const communeSelect = document.getElementById('topoCommuneFilter');
        if (communeSelect) {
            communeSelect.innerHTML = '<option value="">Toutes les communes</option>';
            communes.forEach(commune => {
                communeSelect.insertAdjacentHTML('beforeend', 
                    `<option value="${commune}">${commune}</option>`);
            });
        }
        
        // Populate topographe filter
        const topoSelect = document.getElementById('topoTopographeFilter');
        if (topoSelect) {
            topoSelect.innerHTML = '<option value="">Tous les topographes</option>';
            topographes.forEach(topo => {
                topoSelect.insertAdjacentHTML('beforeend', 
                    `<option value="${topo}">${topo}</option>`);
            });
        }
    }

    applyTopoFilters() {
        const communeFilter = document.getElementById('topoCommuneFilter')?.value;
        const topoFilter = document.getElementById('topoTopographeFilter')?.value;
        const dateFilter = document.getElementById('topoDateFilter')?.value;
        
        let filtered = this.data.topoData || [];
        
        if (communeFilter) {
            filtered = filtered.filter(t => t.commune === communeFilter);
        }
        
        if (topoFilter) {
            filtered = filtered.filter(t => `${t.prenom} ${t.nom}` === topoFilter);
        }
        
        if (dateFilter) {
            filtered = filtered.filter(t => t.date?.startsWith(dateFilter));
        }
        
        this.filteredTopoData = filtered;
        
        if (this.currentSection === 'stats-topo') {
            this.updateTopoKPIs();
            this.renderTopoTable();
            this.renderTopoTimeline();
        }
    }

    updateTopoKPIs() {
        const d = this.filteredTopoData || [];
        const totalChamps = d.reduce((s, x) => s + (x.champs || 0), 0);
        const totalBatis = d.reduce((s, x) => s + (x.batis || 0), 0);
        const total = d.reduce((s, x) => s + (x.totale_parcelles || 0), 0);
        const dates = [...new Set(d.map(x => x.date))];
        const avg = dates.length ? Math.round(total / dates.length) : 0;
        
        this.updateKPI('totalChampsKPI', totalChamps);
        this.updateKPI('totalBatisKPI', totalBatis);
        this.updateKPI('totalTopoParcellesKPI', total);
        this.updateKPI('avgParJourKPI', avg);
        
        // Topographe le plus actif
        const counts = {};
        d.forEach(x => {
            const name = `${x.prenom} ${x.nom}`;
            counts[name] = (counts[name] || 0) + (x.totale_parcelles || 0);
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
        
        const stats = [...Object.entries(this.filteredTopoData.reduce((acc, x) => {
            acc[x.prenom + ' ' + x.nom] = (acc[x.prenom + ' ' + x.nom] || 0) + (x.totale_parcelles || 0);
            return acc;
        }, {}))].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 10);
        
        window.chartManager.createBar('topToposChart', {
            labels: stats.map(x => x.name),
            datasets: [{ data: stats.map(x => x.total) }]
        });
        
        const communeStats = [...Object.entries(this.filteredTopoData.reduce((g, x) => {
            (g[x.commune] || (g[x.commune] = { champs: 0, batis: 0 }));
            g[x.commune].champs += x.champs || 0;
            g[x.commune].batis += x.batis || 0;
            return g;
        }, {}))].map(([name, s]) => ({ name, champs: s.champs, batis: s.batis }));
        
        window.chartManager.createStackedBar('topoCommuneChart', {
            labels: communeStats.map(x => x.name),
            datasets: [
                { data: communeStats.map(x => x.champs) },
                { data: communeStats.map(x => x.batis) }
            ]
        });
        
        const monthly = [...Object.entries(this.filteredTopoData.reduce((m, x) => {
            const mKey = x.date?.slice(0, 7) || 'Inconnu';
            (m[mKey] || (m[mKey] = { champs: 0, batis: 0 }));
            m[mKey].champs += x.champs || 0;
            m[mKey].batis += x.batis || 0;
            return m;
        }, {}))].map(([month, s]) => ({ month, champs: s.champs, batis: s.batis }))
          .sort((a, b) => a.month.localeCompare(b.month));
        
        window.chartManager.createLine('topoEvolutionChart', {
            labels: monthly.map(x => x.month),
            datasets: [
                { label: 'Champs', data: monthly.map(x => x.champs) },
                { label: 'Bâtis', data: monthly.map(x => x.batis) }
            ]
        });
        
        window.chartManager.createTopoTypeDonutChart('topoTypeDonut', {
            champs: monthly.reduce((s, x) => s + x.champs, 0),
            batis: monthly.reduce((s, x) => s + x.batis, 0)
        });
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

    // Gestion de la carte
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
            
            setTimeout(() => {
                this.mapManager.fitToMarkers();
            }, 500);
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

    // Mise à jour des KPIs
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

    // Méthodes de création de graphiques
    createTopCommunesChart() {
        if (!this.communeStats) return;
    
        // CORRECTION: Utiliser ChartManager au lieu de Chart.js directement
        if (!window.chartManager) {
            console.error('ChartManager non disponible');
            return;
        }
    
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
    
        // Utiliser le ChartManager
        window.chartManager.createBar('topCommunesChart', chartData, options);
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
        if (!this.communeStats) return;

        const ctx = document.getElementById('nicadChart');
        if (!ctx) return;

        const topCommunes = Object.entries(this.communeStats)
            .sort(([, a], [, b]) => b.total - a.total)
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

    createTemporalChart(canvasId, temporalData) {
    if (!temporalData || !Array.isArray(temporalData)) {
        console.warn('Données temporelles invalides');
        return null;
    }

    const canvas = this.prepareCanvas(canvasId);
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    
    const config = {
        type: 'line',
        data: {
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
        }
    };
    
    try {
        this.charts[canvasId] = new Chart(ctx, config);
        console.log(`📈 Graphique temporel ${canvasId} créé avec succès`);
        return this.charts[canvasId];
    } catch (error) {
        console.error(`❌ Erreur lors de la création du graphique temporel ${canvasId}:`, error);
        return null;
    }
}

    // Méthodes pour les filtres d'état d'avancement
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

    // Méthodes de rendu des tableaux
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
    

    // Utility methods
       populateFilters() {
        if (!this.communeStats) return;

        // Populate commune filter
        const commSelect = document.getElementById('communeFilter');
        if (commSelect) {
            commSelect.innerHTML = '<option value="">Toutes les communes</option>';
            Object.keys(this.communeStats).sort().forEach(commune => {
                commSelect.insertAdjacentHTML('beforeend',
                    `<option value="${commune}">${commune}</option>`);
            });
        }

        // Populate NICAD filter
        const nicadSelect = document.getElementById('nicadFilter');
        if (nicadSelect) {
            nicadSelect.innerHTML = `
                <option value="">Tous</option>
                <option value="Oui">Avec NICAD</option>
                <option value="Non">Sans NICAD</option>
            `;
        }

        // Populate délibération filter
        const delibSelect = document.getElementById('deliberationFilter');
        if (delibSelect) {
            delibSelect.innerHTML = `
                <option value="">Tous</option>
                <option value="Oui">Délibérées</option>
                <option value="Non">Non délibérées</option>
            `;
        }
    }

    exportParcellesData() {
        const data = this.filteredParcelles || this.data.parcelles || [];
        const csvContent = this.convertToCSV(
            data.map(p => ({
                Commune: p.commune,
                Région: p.region,
                NICAD: p.nicad,
                Délibérée: p.deliberee,
                Superficie: p.superficie
            }))
        );
        this.downloadCSV(csvContent, 'parcelles_export.csv');
    }

    exportPostData() {
        // Assuming post data is stored similarly
        const postData = this.data.postTraitement || [];
        const csvContent = this.convertToCSV(postData);
        this.downloadCSV(csvContent, 'post_traitement_export.csv');
    }

    exportTopoData() {
        const data = this.filteredTopoData || this.data.topoData || [];
        const csvContent = this.convertToCSV(
            data.map(t => ({
                Date: t.date,
                Topographe: `${t.prenom} ${t.nom}`,
                Commune: t.commune,
                Champs: t.champs,
                Bâtis: t.batis,
                Total: t.totale_parcelles
            }))
        );
        this.downloadCSV(csvContent, 'topo_export.csv');
    }

    convertToCSV(objArray) {
        const array = Array.isArray(objArray) ? objArray : JSON.parse(objArray);
        if (array.length === 0) return '';
        const keys = Object.keys(array[0]);
        const header = keys.join(',') + '\n';
        const rows = array.map(item =>
            keys.map(k => `"${(item[k] !== undefined ? item[k] : '').toString().replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        return header + rows;
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    handleResize() {
        // Re-render charts on resize for responsiveness
        if (this.currentSection) {
            this.renderSection(this.currentSection);
        }
    }

  destroyAllCharts() {
    // Utiliser le ChartManager pour la destruction
    if (window.chartManager) {
        window.chartManager.destroyAll();
    }
    
    // Nettoyer notre registre local aussi
    Object.values(this.charts).forEach(chart => {
        try {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        } catch (e) {
            console.warn('Erreur destruction chart local:', e);
        }
    });
    this.charts = {};
}
