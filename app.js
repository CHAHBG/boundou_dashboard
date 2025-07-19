// PROCASEF Dashboard Application - Version avec palette Orange Gold/Bleu Navy
class ProcasefDashboard {
    constructor() {
        // Données du projet PROCASEF
        this.data = {
            kpis: {
                total_parcelles: 31302,
                parcelles_terrain: 22148,
                parcelles_delimitees: 21090,
                taux_realisation: 67.4,
                total_beneficiaires: 52908,
                beneficiaires_hommes: 43576,
                beneficiaires_femmes: 9332,
                pourcentage_hommes: 82.4,
                pourcentage_femmes: 17.6,
                inventaires_realises_2025: 16418,
                objectif_inventaires_2025: 82421,
                taux_projection_2025: 19.9,
                communes_actives: 11,
                communes_totales: 17,
                derniere_maj: "2025-07-19"
            },
            communes: [
                {"commune": "NDOGA BABACAR", "parcelles": 6648, "nicad_oui": 3668, "nicad_pct": 55.2, "deliberees": 2332, "delib_pct": 35.1, "superficie": 14513.00, "region": "TAMBACOUNDA"},
                {"commune": "BANDAFASSI", "parcelles": 4611, "nicad_oui": 3016, "nicad_pct": 65.4, "deliberees": 2119, "delib_pct": 46.0, "superficie": 9926.75, "region": "KEDOUGOU"},
                {"commune": "DIMBOLI", "parcelles": 3920, "nicad_oui": 2544, "nicad_pct": 64.9, "deliberees": 1823, "delib_pct": 46.5, "superficie": 8615.74, "region": "KEDOUGOU"},
                {"commune": "MISSIRAH", "parcelles": 3102, "nicad_oui": 1701, "nicad_pct": 54.8, "deliberees": 1094, "delib_pct": 35.3, "superficie": 6892.33, "region": "TAMBACOUNDA"},
                {"commune": "NETTEBOULOU", "parcelles": 2956, "nicad_oui": 1620, "nicad_pct": 54.8, "deliberees": 1043, "delib_pct": 35.3, "superficie": 6428.91, "region": "TAMBACOUNDA"},
                {"commune": "BALLOU", "parcelles": 2408, "nicad_oui": 1319, "nicad_pct": 54.8, "deliberees": 850, "delib_pct": 35.3, "superficie": 5235.12, "region": "TAMBACOUNDA"},
                {"commune": "FONGOLIMBI", "parcelles": 2195, "nicad_oui": 1202, "nicad_pct": 54.8, "deliberees": 775, "delib_pct": 35.3, "superficie": 4773.89, "region": "KEDOUGOU"},
                {"commune": "GABOU", "parcelles": 1889, "nicad_oui": 1035, "nicad_pct": 54.8, "deliberees": 667, "delib_pct": 35.3, "superficie": 4108.23, "region": "TAMBACOUNDA"},
                {"commune": "BEMBOU", "parcelles": 1642, "nicad_oui": 900, "nicad_pct": 54.8, "deliberees": 580, "delib_pct": 35.3, "superficie": 3570.77, "region": "KEDOUGOU"},
                {"commune": "DINDEFELO", "parcelles": 1312, "nicad_oui": 719, "nicad_pct": 54.8, "deliberees": 463, "delib_pct": 35.3, "superficie": 2854.12, "region": "KEDOUGOU"},
                {"commune": "MOUDERY", "parcelles": 1098, "nicad_oui": 602, "nicad_pct": 54.8, "deliberees": 388, "delib_pct": 35.3, "superficie": 2389.66, "region": "TAMBACOUNDA"},
                {"commune": "TOMBORONKOTO", "parcelles": 521, "nicad_oui": 286, "nicad_pct": 54.8, "deliberees": 184, "delib_pct": 35.3, "superficie": 1133.48, "region": "KEDOUGOU"}
            ],
            genre_evolution: [
                {"periode": "2024-T4", "femme": 1607, "homme": 6064, "total": 7671, "femme_pct": 20.9, "homme_pct": 79.1},
                {"periode": "2025-T1", "femme": 4039, "homme": 18676, "total": 22715, "femme_pct": 17.8, "homme_pct": 82.2},
                {"periode": "2025-T2", "femme": 3686, "homme": 18836, "total": 22522, "femme_pct": 16.4, "homme_pct": 83.6}
            ],
            projections_mensuelles: [
                {"mois": "Avril 2025", "realise": 4519, "objectif": 8000, "cumul_objectif": 18421, "taux": 56.5},
                {"mois": "Mai 2025", "realise": 4890, "objectif": 8000, "cumul_objectif": 26421, "taux": 61.1},
                {"mois": "Juin 2025", "realise": 3517, "objectif": 8000, "cumul_objectif": 34421, "taux": 44.0},
                {"mois": "Juillet 2025", "realise": 3492, "objectif": 8000, "cumul_objectif": 42421, "taux": 43.7},
                {"mois": "Août 2025", "realise": null, "objectif": 8000, "cumul_objectif": 50421, "taux": 0},
                {"mois": "Septembre 2025", "realise": null, "objectif": 8000, "cumul_objectif": 58421, "taux": 0}
            ],
            etat_avancement: [
                {"commune": "NDOGA BABACAR", "etat": "Terminé", "progression": 100, "date_debut": "2024-08-10"},
                {"commune": "BANDAFASSI", "etat": "Terminé", "progression": 100, "date_debut": "2024-12-09"},
                {"commune": "FONGOLIMBI", "etat": "Terminé", "progression": 100, "date_debut": "2025-03-04"},
                {"commune": "DIMBOLI", "etat": "Terminé", "progression": 100, "date_debut": "2025-04-07"},
                {"commune": "NETTEBOULOU", "etat": "En cours", "progression": 50, "date_debut": "2024-12-05"},
                {"commune": "MISSIRAH", "etat": "En cours", "progression": 50, "date_debut": "2024-12-08"},
                {"commune": "BALLOU", "etat": "Presque terminé", "progression": 85, "date_debut": "2025-03-10"},
                {"commune": "GABOU", "etat": "Presque terminé", "progression": 85, "date_debut": "2025-04-22"},
                {"commune": "BEMBOU", "etat": "En cours", "progression": 30, "date_debut": "2025-05-02"},
                {"commune": "MOUDERY", "etat": "En cours", "progression": 20, "date_debut": "2025-05-23"}
            ],
            post_traitement: {
                total_parcelles_recues: 8420,
                parcelles_post_traitees: 7890,
                taux_post_traitement: 93.7,
                parcelles_individuelles: 5234,
                parcelles_collectives: 2656,
                jointure_reussie: 7456,
                jointure_echec: 434
            }
        };
        
        // Palette de couleurs PROCASEF
        this.colors = {
            primary: '#D4A574',    // Orange Gold Mat
            secondary: '#1E3A8A',  // Bleu Navy
            accent: '#B8860B',     // Dark Goldenrod
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            chartColors: ['#D4A574', '#1E3A8A', '#B8860B', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4']
        };
        
        this.charts = {};
        this.currentSection = 'accueil';
        this.fontSize = 14; // Taille de police par défaut
        
        this.init();
    }

    async init() {
        console.log('Initialisation du Dashboard PROCASEF...');
        try {
            this.showLoading();
            this.setupEventListeners();
            this.loadFontSizePreference();
            this.renderDashboard();
            this.hideLoading();
            console.log('Dashboard initialisé avec succès');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            this.hideLoading();
        }
    }

    setupEventListeners() {
        console.log('Configuration des event listeners...');
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSidebar();
            });
        }

        // Font size controls
        this.setupFontSizeControls();

        // Filters
        const filterIds = ['communeFilter', 'regionFilter', 'communePostFilter', 'geometrieFilter'];
        filterIds.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.applyFilters());
            }
        });

        // Export button
        const exportButton = document.getElementById('exportButton');
        if (exportButton) {
            exportButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportData();
            });
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

    loadFontSizePreference() {
        try {
            const saved = localStorage.getItem('procasef-font-size');
            if (saved) {
                this.fontSize = parseInt(saved);
                this.updateFontSize();
                const slider = document.getElementById('fontSizeSlider');
                if (slider) slider.value = this.fontSize;
                this.updateFontTooltip();
            }
        } catch (error) {
            console.log('localStorage non disponible, utilisation des valeurs par défaut');
        }
    }

    saveFontSizePreference() {
        try {
            localStorage.setItem('procasef-font-size', this.fontSize.toString());
        } catch (error) {
            console.log('localStorage non disponible pour sauvegarder la préférence');
        }
    }

    navigateToSection(sectionId) {
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

        this.currentSection = sectionId;
        this.renderSection(sectionId);
    }

    renderSection(sectionId) {
        console.log('Rendu de la section:', sectionId);
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

    renderDashboard() {
        this.renderAccueil();
        this.populateAllFilters();
    }

    renderAccueil() {
        console.log('Rendu de la section Accueil');
        
        // Update KPI values
        this.updateElement('totalParcelles', this.data.kpis.total_parcelles.toLocaleString());
        this.updateElement('tauxRealisation', this.data.kpis.taux_realisation + '%');
        this.updateElement('totalBeneficiaires', this.data.kpis.total_beneficiaires.toLocaleString());
        this.updateElement('projections2025', this.data.kpis.taux_projection_2025 + '%');
        this.updateElement('communesActives', `${this.data.kpis.communes_actives}/${this.data.kpis.communes_totales}`);
        this.updateElement('parcellesDelimitees', this.data.kpis.parcelles_delimitees.toLocaleString());

        // Render charts
        setTimeout(() => {
            this.renderCommuneChart();
            this.renderMonthlyChart();
            this.renderGenderChart();
        }, 100);
    }

    renderParcelles() {
        console.log('Rendu de la section Parcelles');
        this.populateParcellesFilters();
        setTimeout(() => {
            this.renderRegionChart();
            this.renderNicadChart();
            this.renderParcellesTable();
        }, 100);
    }

    renderEtatAvancement() {
        console.log('Rendu de la section État d\'avancement');
        
        const progressFill = document.getElementById('globalProgressFill');
        const progressText = document.getElementById('globalProgressText');
        
        if (progressFill) {
            progressFill.style.width = this.data.kpis.taux_realisation + '%';
        }
        if (progressText) {
            progressText.textContent = this.data.kpis.taux_realisation + '%';
        }

        setTimeout(() => {
            this.renderStatusChart();
            this.renderOperationsTimeline();
        }, 100);
    }

    renderProjections() {
        console.log('Rendu de la section Projections 2025');
        
        this.updateElement('inventairesRealises', this.data.kpis.inventaires_realises_2025.toLocaleString());
        this.updateElement('objectifTotal', this.data.kpis.objectif_inventaires_2025.toLocaleString());
        this.updateElement('tauxProjections', this.data.kpis.taux_projection_2025 + '%');
        
        setTimeout(() => {
            this.renderProjectionsChart();
            this.renderPerformanceList();
        }, 100);
    }

    renderGenre() {
        console.log('Rendu de la section Genre');
        setTimeout(() => {
            this.renderGenreGlobalChart();
            this.renderGenreTrimestreChart();
            this.renderGenreCommuneChart();
        }, 100);
    }

    renderPostTraitement() {
        console.log('Rendu de la section Post-traitement');
        
        this.updateElement('totalRecues', this.data.post_traitement.total_parcelles_recues.toLocaleString());
        this.updateElement('postTraitees', this.data.post_traitement.parcelles_post_traitees.toLocaleString());
        this.updateElement('tauxTraitement', this.data.post_traitement.taux_post_traitement + '%');
        
        this.populatePostFilters();
        setTimeout(() => {
            this.renderPostProcessingTable();
        }, 100);
    }

    // Chart rendering methods
    renderCommuneChart() {
        const ctx = document.getElementById('communeChart');
        if (!ctx) return;

        if (this.charts.communeChart) {
            this.charts.communeChart.destroy();
        }

        const data = this.data.communes.slice(0, 8);

        this.charts.communeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.commune.substring(0, 12)),
                datasets: [{
                    label: 'Parcelles',
                    data: data.map(item => item.parcelles),
                    backgroundColor: this.colors.primary,
                    borderRadius: 4,
                    borderSkipped: false
                }, {
                    label: 'NICAD',
                    data: data.map(item => item.nicad_oui),
                    backgroundColor: this.colors.secondary,
                    borderRadius: 4,
                    borderSkipped: false
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

    renderMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        if (this.charts.monthlyChart) {
            this.charts.monthlyChart.destroy();
        }

        this.charts.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.projections_mensuelles.slice(0, 4).map(item => item.mois.split(' ')[0]),
                datasets: [{
                    label: 'Objectif',
                    data: this.data.projections_mensuelles.slice(0, 4).map(item => item.objectif),
                    borderColor: this.colors.secondary,
                    backgroundColor: this.colors.secondary + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }, {
                    label: 'Réalisé',
                    data: this.data.projections_mensuelles.slice(0, 4).map(item => item.realise),
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.primary + '20',
                    borderWidth: 2,
                    fill: false,
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

    renderGenderChart() {
        const ctx = document.getElementById('genderChart');
        if (!ctx) return;

        if (this.charts.genderChart) {
            this.charts.genderChart.destroy();
        }

        this.charts.genderChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.data.genre_evolution.map(item => item.periode),
                datasets: [{
                    label: 'Hommes',
                    data: this.data.genre_evolution.map(item => item.homme),
                    backgroundColor: this.colors.secondary,
                    borderRadius: 4
                }, {
                    label: 'Femmes',
                    data: this.data.genre_evolution.map(item => item.femme),
                    backgroundColor: this.colors.primary,
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

    renderRegionChart() {
        const ctx = document.getElementById('regionChart');
        if (!ctx) return;

        if (this.charts.regionChart) {
            this.charts.regionChart.destroy();
        }

        // Aggregate by region
        const regionData = this.data.communes.reduce((acc, item) => {
            acc[item.region] = (acc[item.region] || 0) + item.parcelles;
            return acc;
        }, {});

        this.charts.regionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(regionData),
                datasets: [{
                    data: Object.values(regionData),
                    backgroundColor: [this.colors.primary, this.colors.secondary],
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

    renderNicadChart() {
        const ctx = document.getElementById('nicadChart');
        if (!ctx) return;

        if (this.charts.nicadChart) {
            this.charts.nicadChart.destroy();
        }

        const data = this.data.communes.slice(0, 6);

        this.charts.nicadChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.commune.substring(0, 10)),
                datasets: [{
                    label: 'Taux NICAD (%)',
                    data: data.map(item => item.nicad_pct),
                    backgroundColor: data.map(item => {
                        if (item.nicad_pct >= 60) return this.colors.success;
                        if (item.nicad_pct >= 50) return this.colors.warning;
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

    renderStatusChart() {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        if (this.charts.statusChart) {
            this.charts.statusChart.destroy();
        }

        // Count status
        const statusCounts = this.data.etat_avancement.reduce((acc, item) => {
            acc[item.etat] = (acc[item.etat] || 0) + 1;
            return acc;
        }, {});

        this.charts.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        this.colors.success,
                        this.colors.primary,
                        this.colors.warning
                    ],
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

    renderProjectionsChart() {
        const ctx = document.getElementById('projectionsChart');
        if (!ctx) return;

        if (this.charts.projectionsChart) {
            this.charts.projectionsChart.destroy();
        }

        this.charts.projectionsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.data.projections_mensuelles.map(item => item.mois.split(' ')[0]),
                datasets: [{
                    label: 'Objectif',
                    data: this.data.projections_mensuelles.map(item => item.objectif),
                    borderColor: this.colors.secondary,
                    backgroundColor: this.colors.secondary + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Réalisé',
                    data: this.data.projections_mensuelles.map(item => item.realise || 0),
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

    renderGenreGlobalChart() {
        const ctx = document.getElementById('genreGlobalChart');
        if (!ctx) return;

        if (this.charts.genreGlobalChart) {
            this.charts.genreGlobalChart.destroy();
        }

        this.charts.genreGlobalChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Hommes', 'Femmes'],
                datasets: [{
                    data: [this.data.kpis.beneficiaires_hommes, this.data.kpis.beneficiaires_femmes],
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

    renderGenreTrimestreChart() {
        const ctx = document.getElementById('genreTrimestreChart');
        if (!ctx) return;

        if (this.charts.genreTrimestreChart) {
            this.charts.genreTrimestreChart.destroy();
        }

        this.charts.genreTrimestreChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.data.genre_evolution.map(item => item.periode),
                datasets: [{
                    label: 'Hommes',
                    data: this.data.genre_evolution.map(item => item.homme),
                    backgroundColor: this.colors.secondary
                }, {
                    label: 'Femmes',
                    data: this.data.genre_evolution.map(item => item.femme),
                    backgroundColor: this.colors.primary
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

    renderGenreCommuneChart() {
        const ctx = document.getElementById('genreCommuneChart');
        if (!ctx) return;

        if (this.charts.genreCommuneChart) {
            this.charts.genreCommuneChart.destroy();
        }

        const data = this.data.communes.slice(0, 8);
        const communeGenreData = data.map(item => ({
            commune: item.commune,
            hommes: Math.round(item.parcelles * 0.82),
            femmes: Math.round(item.parcelles * 0.18)
        }));

        this.charts.genreCommuneChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: communeGenreData.map(item => item.commune.substring(0, 10)),
                datasets: [{
                    label: 'Hommes',
                    data: communeGenreData.map(item => item.hommes),
                    backgroundColor: this.colors.secondary
                }, {
                    label: 'Femmes',
                    data: communeGenreData.map(item => item.femmes),
                    backgroundColor: this.colors.primary
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

    // Table rendering methods
    renderParcellesTable() {
        const tbody = document.getElementById('parcellesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.data.communes.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.region}</td>
                <td>${item.commune}</td>
                <td>${item.parcelles.toLocaleString()}</td>
                <td>${item.nicad_oui.toLocaleString()}</td>
                <td><span class="kpi-percentage ${item.nicad_pct >= 60 ? 'success' : item.nicad_pct >= 50 ? 'warning' : 'error'}">${item.nicad_pct}%</span></td>
                <td>${item.deliberees.toLocaleString()}</td>
                <td><span class="kpi-percentage ${item.delib_pct >= 40 ? 'success' : item.delib_pct >= 30 ? 'warning' : 'error'}">${item.delib_pct}%</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    renderOperationsTimeline() {
        const container = document.getElementById('operationsTimeline');
        if (!container) return;

        let html = '';
        
        this.data.etat_avancement.forEach(item => {
            const statusClass = item.etat === 'Terminé' ? 'completed' : 
                              item.etat === 'Presque terminé' ? 'in-progress' : 'pending';
            
            html += `
                <div class="timeline-item ${statusClass}">
                    <div class="timeline-content">
                        <div class="timeline-commune">${item.commune}</div>
                        <div class="timeline-status">${item.etat} (${item.progression}%) - Début: ${new Date(item.date_debut).toLocaleDateString('fr-FR')}</div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderPerformanceList() {
        const container = document.getElementById('performanceList');
        if (!container) return;

        let html = '';
        
        this.data.projections_mensuelles.slice(0, 4).forEach(item => {
            const statusClass = item.taux >= 60 ? 'success' : item.taux >= 40 ? 'warning' : 'error';
            
            html += `
                <div class="performance-item">
                    <div class="performance-month">${item.mois}</div>
                    <div class="performance-value ${statusClass}">${item.taux}%</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderPostProcessingTable() {
        const tbody = document.getElementById('postProcessingTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        this.data.communes.slice(0, 8).forEach(item => {
            const row = document.createElement('tr');
            const individual = Math.round(item.parcelles * 0.62);
            const collective = Math.round(item.parcelles * 0.31);
            const jointure = Math.round(item.parcelles * 0.88);
            const taux = ((jointure / item.parcelles) * 100).toFixed(1);
            
            row.innerHTML = `
                <td>${item.commune}</td>
                <td>${item.parcelles.toLocaleString()}</td>
                <td>${jointure.toLocaleString()}</td>
                <td>${individual.toLocaleString()}</td>
                <td>${collective.toLocaleString()}</td>
                <td>${jointure.toLocaleString()}</td>
                <td><span class="kpi-percentage ${parseFloat(taux) >= 80 ? 'success' : 'warning'}">${taux}%</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    // Filter methods
    populateAllFilters() {
        this.populateParcellesFilters();
        this.populatePostFilters();
    }

    populateParcellesFilters() {
        const communeFilter = document.getElementById('communeFilter');
        
        if (communeFilter) {
            communeFilter.innerHTML = '<option value="">Toutes les communes</option>';
            this.data.communes.forEach(item => {
                const option = document.createElement('option');
                option.value = item.commune;
                option.textContent = item.commune;
                communeFilter.appendChild(option);
            });
        }
    }

    populatePostFilters() {
        const communePostFilter = document.getElementById('communePostFilter');
        
        if (communePostFilter) {
            communePostFilter.innerHTML = '<option value="">Toutes les communes</option>';
            this.data.communes.forEach(item => {
                const option = document.createElement('option');
                option.value = item.commune;
                option.textContent = item.commune;
                communePostFilter.appendChild(option);
            });
        }
    }

    applyFilters() {
        console.log('Application des filtres');
        this.renderSection(this.currentSection);
    }

    exportData() {
        console.log('Export des données CSV');
        
        const csvData = this.data.communes.map(item => ({
            'Région': item.region,
            'Commune': item.commune,
            'Total Parcelles': item.parcelles,
            'NICAD': item.nicad_oui,
            '% NICAD': item.nicad_pct,
            'Délibérées': item.deliberees,
            '% Délibérées': item.delib_pct
        }));

        const csvContent = this.convertToCSV(csvData);
        this.downloadCSV(csvContent, `procasef_data_${new Date().getFullYear()}.csv`);
        
        // Show success feedback
        const btn = document.getElementById('exportButton');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>✅</span> Exporté !';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        }
    }

    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM chargé, initialisation du Dashboard PROCASEF...');
    window.dashboard = new ProcasefDashboard();
});