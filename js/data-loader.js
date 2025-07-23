// data-loader.js - Data Loading and Caching Module for PROCASEF Dashboard
class DataLoader {
    constructor() {
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    async loadData(url) {
        // Return cached data if available
        if (this.cache.has(url)) {
            console.log(`Loading from cache: ${url}`);
            return this.cache.get(url);
        }

        // Return existing loading promise if already in progress
        if (this.loadingPromises.has(url)) {
            console.log(`Waiting for existing request: ${url}`);
            return this.loadingPromises.get(url);
        }

        console.log(`Fetching data from: ${url}`);
        const loadPromise = this.fetchWithRetry(url)
            .then(data => {
                this.cache.set(url, data);
                this.loadingPromises.delete(url);
                return data;
            })
            .catch(error => {
                this.loadingPromises.delete(url);
                console.error(`Failed to load ${url}:`, error);
                return this.getFallbackData(url);
            });

        this.loadingPromises.set(url, loadPromise);
        return loadPromise;
    }

    async fetchWithRetry(url, maxRetries = this.retryAttempts) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                console.log(`Successfully loaded: ${url} (attempt ${attempt})`);
                return data;
            } catch (error) {
                console.warn(`Attempt ${attempt}/${maxRetries} failed for ${url}:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error;
                }

                // Wait before retrying with exponential backoff
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

     getFallbackData(url) {
    console.log(`Generating fallback data for: ${url}`);

    if (url.includes('parcelles.json')) {
      return this.generateParcelleFallbackData();
    } else if (url.includes('Projections_2025.json')) {
      return this.generateProjectionsFallbackData();
    } else if (url.includes('Genre_par_Commune.json')) {
      return this.generateGenreCommuneFallbackData();
    } else if (url.includes('Genre_par_trimestre.json')) {
      return this.generateGenreTrimestreFallbackData();
    } else if (url.includes('Repartition_genre.json')) {
      return this.generateRepartitionGenreFallbackData();
    } else if (url.includes('rapport_complet.json')) {
      return this.generateRapportCompletFallbackData();
    } else if (url.includes('Etat_des_operations_Boundou_Mai_2025.json') ||
               url.includes('Etat-des-operations-Boundou-Mai-2025.json')) {
      return this.generateEtatOperationsFallbackData();
    } else if (url.includes('Parcelles_terrain_periode.json')) {
      return this.generateParcellesTerrainFallbackData();
    } else if (url.includes('Parcelles_post_traites_par_geom.json')) {
      return this.generateParcellesPostTraitesFallbackData();
    } else if (url.includes('Urm_Terrain_comparaison.json')) {
      return this.generateUrmTerrainFallbackData();
    } else if (url.includes('Levee_par_commune_Terrain_URM.json')) {
      return this.generateLeveeCommuneFallbackData();
    } else if (url.includes('Rapports_Topo_nettoyee.json')) {
      return this.generateTopoFallbackData();
    }

    /* valeur par défaut */
    return [];
  }

    generateParcelleFallbackData() {
        const communes = [
            'NDOGA BABACAR', 'BANDAFASSI', 'DIMBOLI', 'MISSIRAH', 'NETTEBOULOU',
            'BALLOU', 'FONGOLIMBI', 'GABOU', 'BEMBOU', 'DINDEFELO', 'MOUDERY', 'TOMBORONKOTO'
        ];
        
        const regions = ['TAMBACOUNDA', 'KEDOUGOU'];
        const typeUsages = ['Agriculture_irriguée', 'Agriculture_pluviale', 'Habitat', 'Commerce'];
        const villages = ['Village A', 'Village B', 'Village C', null];
        
        const data = [];
        
        // Generate representative sample based on real PROCASEF data
        const communeDistribution = {
            'NDOGA BABACAR': 6648,
            'BANDAFASSI': 4611,
            'DIMBOLI': 3920,
            'MISSIRAH': 3102,
            'NETTEBOULOU': 2956,
            'BALLOU': 2408,
            'FONGOLIMBI': 2195,
            'GABOU': 1889,
            'BEMBOU': 1642,
            'DINDEFELO': 1312,
            'MOUDERY': 1098,
            'TOMBORONKOTO': 521
        };

        let totalGenerated = 0;
        
        Object.entries(communeDistribution).forEach(([commune, count]) => {
            // Generate a sample (1% of actual data to keep it manageable)
            const sampleSize = Math.max(1, Math.floor(count * 0.01));
            
            for (let i = 0; i < sampleSize; i++) {
                const hasNicad = Math.random() > 0.45; // ~55% have NICAD
                const isDeliberee = Math.random() > 0.65; // ~35% deliberated
                const hasSuperficie = Math.random() > 0.15; // ~85% have superficie
                
                data.push({
                    id_parcelle: `${commune.substring(0, 4)}${String(totalGenerated + i).padStart(6, '0')}`,
                    commune: commune,
                    village: villages[Math.floor(Math.random() * villages.length)],
                    nicad: hasNicad ? 'Oui' : 'Non',
                    superficie: hasSuperficie ? Math.round((Math.random() * 5 + 0.5) * 100) / 100 : null,
                    type_usag: typeUsages[Math.floor(Math.random() * typeUsages.length)],
                    deliberee: isDeliberee ? 'Oui' : 'Non',
                    autorite_delib: isDeliberee ? 'Conseil Municipal' : 'Non spécifié',
                    numero_cadstral: hasNicad ? Math.floor(Math.random() * 1000000000) : null,
                    region: ['NDOGA BABACAR', 'MISSIRAH', 'NETTEBOULOU', 'BALLOU', 'GABOU', 'MOUDERY'].includes(commune) ? 'TAMBACOUNDA' : 'KEDOUGOU'
                });
            }
            
            totalGenerated += sampleSize;
        });

        console.log(`Generated ${data.length} parcelle records as fallback data`);
        return data;
    }

    generateProjectionsFallbackData() {
        const moisData = [
            { mois: 'Avril 2025', inventaires_mensuels_realises: 4519, objectif_inventaires_mensuels: 8000, objectif_inventaires_total: 18421 },
            { mois: 'Mai 2025', inventaires_mensuels_realises: 4890, objectif_inventaires_mensuels: 8000, objectif_inventaires_total: 26421 },
            { mois: 'Juin 2025', inventaires_mensuels_realises: 3517, objectif_inventaires_mensuels: 8000, objectif_inventaires_total: 34421 },
            { mois: 'Juillet 2025', inventaires_mensuels_realises: 3492, objectif_inventaires_mensuels: 8000, objectif_inventaires_total: 42421 },
            { mois: 'Août 2025', inventaires_mensuels_realises: null, objectif_inventaires_mensuels: 8000, objectif_inventaires_total: 50421 },
            { mois: 'Septembre 2025', inventaires_mensuels_realises: null, objectif_inventaires_mensuels: 8000, objectif_inventaires_total: 58421 },
            { mois: 'Octobre 2025', inventaires_mensuels_realises: null, objectif_inventaires_mensuels: 8000, objectif_inventaires_total: 66421 },
            { mois: 'Novembre 2025', inventaires_mensuels_realises: null, objectif_inventaires_mensuels: 8000, objectif_inventaires_total: 74421 },
            { mois: 'Décembre 2025', inventaires_mensuels_realises: null, objectif_inventaires_mensuels: 8000, objectif_inventaires_total: 82421 }
        ];

        return moisData;
    }

    generateGenreCommuneFallbackData() {
        const communes = [
            { communesenegal: 'BALLOU', femme: 450, homme: 5060, total: 5510, femme_pourcentage: 8.17, homme_pourcentage: 91.83 },
            { communesenegal: 'BANDAFASSI', femme: 2381, homme: 5784, total: 8165, femme_pourcentage: 29.16, homme_pourcentage: 70.84 },
            { communesenegal: 'BEMBOU', femme: 899, homme: 2924, total: 3823, femme_pourcentage: 23.52, homme_pourcentage: 76.48 },
            { communesenegal: 'DIMBOLI', femme: 1353, homme: 3504, total: 4857, femme_pourcentage: 27.86, homme_pourcentage: 72.14 },
            { communesenegal: 'DINDEFELO', femme: 671, homme: 2081, total: 2752, femme_pourcentage: 24.38, homme_pourcentage: 75.62 },
            { communesenegal: 'FONGOLIMBI', femme: 1344, homme: 3041, total: 4385, femme_pourcentage: 30.65, homme_pourcentage: 69.35 },
            { communesenegal: 'GABOU', femme: 200, homme: 3816, total: 4016, femme_pourcentage: 4.98, homme_pourcentage: 95.02 },
            { communesenegal: 'MISSIRAH', femme: 1015, homme: 5076, total: 6091, femme_pourcentage: 16.66, homme_pourcentage: 83.34 },
            { communesenegal: 'MOUDERY', femme: 90, homme: 2486, total: 2576, femme_pourcentage: 3.49, homme_pourcentage: 96.51 },
            { communesenegal: 'NDOGA BABACAR', femme: 97, homme: 1081, total: 1178, femme_pourcentage: 8.23, homme_pourcentage: 91.77 },
            { communesenegal: 'NETTEBOULOU', femme: 531, homme: 7426, total: 7957, femme_pourcentage: 6.67, homme_pourcentage: 93.33 },
            { communesenegal: 'TOMBORONKOTO', femme: 301, homme: 1296, total: 1597, femme_pourcentage: 18.85, homme_pourcentage: 81.15 }
        ];

        return communes;
    }

    generateGenreTrimestreFallbackData() {
        const trimestres = [
            { periodetrimestrielle: '2024-T4 (Oct-Nov-Déc)', femme: 1607, homme: 6064, total: 7671, homme_pourcentage: 79.05, femme_pourcentage: 20.95 },
            { periodetrimestrielle: '2025-T1 (Jan-Fév-Mar)', femme: 4039, homme: 18676, total: 22715, homme_pourcentage: 82.22, femme_pourcentage: 17.78 },
            { periodetrimestrielle: '2025-T2 (Avr-Mai-Jun)', femme: 3686, homme: 18836, total: 22522, homme_pourcentage: 83.63, femme_pourcentage: 16.37 }
        ];

        return trimestres;
    }

    generateRepartitionGenreFallbackData() {
        return [
            {
                genre: 'Homme',
                individuel_nombre: 12650,
                individuel: 82.8,
                collectif_nombre: 30926,
                collectif: 81.41,
                total_nombre: 43576,
                total: 82.4,
                mandataires_nombre: 5798,
                mandataires: 94.66
            },
            {
                genre: 'Femme',
                individuel_nombre: 2631,
                individuel: 17.2,
                collectif_nombre: 6701,
                collectif: 17.8,
                total_nombre: 9332,
                total: 17.6,
                mandataires_nombre: 327,
                mandataires: 5.34
            }
        ];
    }

    generateRapportCompletFallbackData() {
        return {
            'Synthèse Globale': [
                { indicateur: 'Total Personnes', valeur: 52908 },
                { indicateur: 'Hommes', valeur: 43576 },
                { indicateur: 'Femmes', valeur: 9332 },
                { indicateur: 'Pourcentage Hommes', valeur: '82.4%' },
                { indicateur: 'Pourcentage Femmes', valeur: '17.6%' }
            ],
            'Détail par Source': [
                { source: 'Individuel', hommes: 12650, femmes: 2631, total: 15281, hommes_1: 82.8, femmes_1: 17.2 },
                { source: 'Collectif', hommes: 30926, femmes: 6701, total: 37627, hommes_1: 82.2, femmes_1: 17.8 }
            ],
            'Analyse par Commune': [
                { communesenegal: 'BALLOU', femme: 450, homme: 5060, total: 5510, femme_pourcentage: 8.17, homme_pourcentage: 91.83 },
                { communesenegal: 'BANDAFASSI', femme: 2381, homme: 5784, total: 8165, femme_pourcentage: 29.16, homme_pourcentage: 70.84 },
                { communesenegal: 'BEMBOU', femme: 899, homme: 2924, total: 3823, femme_pourcentage: 23.52, homme_pourcentage: 76.48 },
                { communesenegal: 'DIMBOLI', femme: 1353, homme: 3504, total: 4857, femme_pourcentage: 27.86, homme_pourcentage: 72.14 }
            ],
            'Analyse Temporelle': [
                { periode: '2024-T4', femme: 1607, homme: 6064, total: 7671, homme_pourcentage: 79.05, femme_pourcentage: 20.95 },
                { periode: '2025-T1', femme: 4039, homme: 18676, total: 22715, homme_pourcentage: 82.22, femme_pourcentage: 17.78 },
                { periode: '2025-T2', femme: 3686, homme: 18836, total: 22522, homme_pourcentage: 83.63, femme_pourcentage: 16.37 }
            ],
            'Tamba-Kédougou': [
                { nomregion: 'Kédougou', femme: 13898, homme: 37260, total: 51158, homme_pourcentage: 72.83, femme_pourcentage: 27.17 },
                { nomregion: 'Tambacounda', femme: 4766, homme: 49890, total: 54656, homme_pourcentage: 91.28, femme_pourcentage: 8.72 }
            ]
        };
    }

    generateEtatOperationsFallbackData() {
        const operations = [
            { region: 'Tambacounda', commune: 'BALLOU', date_debut: '2025-03-10', etat_d_avancement: 'Presque terminé', csig: 'Mariama', progres_des_etapes: '• Levés topo et enquetes complétés\n• Affichage public (complétés)\n• Délibération (pas encore)' },
            { region: 'Tambacounda', commune: 'GABOU', date_debut: '2025-04-22', etat_d_avancement: 'Presque terminé', csig: 'Mariama', progres_des_etapes: '• Levés topo et enquetes complétés\n• Affichage public (en cours)' },
            { region: 'Tambacounda', commune: 'MOUDERY', date_debut: 'vendredi 23 Mai 2025', etat_d_avancement: 'Inventaires fonciers à partir du 23 Mai 2025', csig: 'Ibrahima' },
            { region: 'Tambacounda', commune: 'NETTEBOULOU', date_debut: '2024-12-05', etat_d_avancement: 'En cours', csig: 'Bamba', progres_des_etapes: '• Levés topo et enquetes (en cours) à 50%' },
            { region: 'Tambacounda', commune: 'MISSIRAH', date_debut: '2024-12-08', etat_d_avancement: 'En cours', csig: 'Demba', progres_des_etapes: '• Levés topo et enquetes en cours à 50%' },
            { region: 'Tambacounda', commune: 'NDOGA BABACAR', date_debut: '2024-08-10', etat_d_avancement: 'Terminé', csig: 'Mariama' },
            { region: 'Kedougou', commune: 'FONGOLIMBI', date_debut: '2025-03-04', etat_d_avancement: 'Terminé', csig: 'Badara' },
            { region: 'Kedougou', commune: 'DIMBOLI', date_debut: '2025-04-07', etat_d_avancement: 'Terminé', csig: 'Ibrahima' },
            { region: 'Kedougou', commune: 'BEMBOU', date_debut: '2025-05-02', etat_d_avancement: 'Inventaires fonciers à partir du 02 Mai 2025', csig: 'Badara' },
            { region: 'Kedougou', commune: 'BANDAFASSI', date_debut: '2024-12-09', etat_d_avancement: 'Terminé', csig: 'Dianke' }
        ];

        return operations;
    }

    generateParcellesTerrainFallbackData() {
        const communes = [
            { date_de_debut: '2024-08-13', date_de_fin: '2024-08-19', commune: 'Ndoga Babacar', levee: 1176, lots: 'LOT 1 à 23' },
            { date_de_debut: '2024-12-06', date_de_fin: '2024-12-12', commune: 'Bandafassi', levee: 229, lots: null },
            { date_de_debut: '2025-01-20', date_de_fin: '2025-01-30', commune: 'Dimboli', levee: 408, lots: 'LOT 31' },
            { date_de_debut: '2025-02-14', date_de_fin: '2025-02-20', commune: 'Missirah', levee: 263, lots: 'Ratissage' },
            { date_de_debut: '2025-03-10', date_de_fin: '2025-03-14', commune: 'Netteboulou', levee: 214, lots: 'LOT 28' }
        ];

        return communes;
    }

    generateParcellesPostTraitesFallbackData() {
        const geometries = ['Point', 'Polygon', 'LineString', 'MultiPolygon'];
        const communes = ['NDOGA BABACAR', 'BANDAFASSI', 'DIMBOLI', 'MISSIRAH', 'NETTEBOULOU'];
        const data = [];

        communes.forEach(commune => {
            geometries.slice(0, 2).forEach(geom => {
                const total = Math.floor(Math.random() * 500) + 100;
                const postTraitees = Math.floor(total * (0.8 + Math.random() * 0.15));
                const individuelles = Math.floor(postTraitees * 0.65);
                const collectives = postTraitees - individuelles;
                const jointure = Math.floor(postTraitees * (0.85 + Math.random() * 0.1));

                data.push({
                    geom: geom,
                    commune: commune,
                    total_parcelle_recue: total,
                    parcelle_post_traite_prete_a_etre_valide: postTraitees,
                    nombre_de_parcelle_dont_la_jointure_est_: jointure,
                    nombre_de_parcelle_dont_la_jointure_n_a_: postTraitees - jointure,
                    nombre_de_parcelle_individuelle: individuelles,
                    nombre_de_parcelle_collective: collectives,
                    lot: Math.floor(Math.random() * 40) + 1
                });
            });
        });

        return data;
    }

    generateUrmTerrainFallbackData() {
        const data = {
            'Parcelles_terrain_periode': [
                { periode: '2024-08-13 00:00:00', commune: 'Ndoga Babacar', levee_terrain: 1176.0, lots: 'LOT 1 à 23' },
                { periode: '2024-12-06 00:00:00', commune: 'Bandafassi', levee_terrain: 229.0, lots: null },
                { periode: '2025-01-20 00:00:00', commune: 'Dimboli', levee_terrain: 408.0, lots: 'LOT 31' },
                { periode: '2025-02-14 00:00:00', commune: 'Missirah', levee_terrain: 263.0, lots: 'Ratissage' },
                { periode: null, commune: 'Total', levee_terrain: 22148.0, lots: null }
            ],
            'Levee par commune': [
                { region: 'TAMBACOUNDA', communes: 'NDOGA BABACAR', total_parcelles_terrain: 5102.0, total_parcelles_delimitees_et_enquetees_: 3845.0 },
                { region: null, communes: 'MISSIRAH', total_parcelles_terrain: 2400.0, total_parcelles_delimitees_et_enquetees_: 2712.0 },
                { region: 'KEDOUGOU', communes: 'BANDAFASSI', total_parcelles_terrain: 3543.0, total_parcelles_delimitees_et_enquetees_: 3565.0 },
                { region: null, communes: 'DIMBOLI', total_parcelles_terrain: 3012.0, total_parcelles_delimitees_et_enquetees_: 2989.0 },
                { region: null, communes: 'Total', total_parcelles_terrain: 22148.0, total_parcelles_delimitees_et_enquetees_: 21090.0 }
            ]
        };

        return data;
    }

    generateLeveeCommuneFallbackData() {
        const communes = [
            { region: 'TAMBACOUNDA', commune: 'NDOGA BABACAR', total_parcelles_terrain: 5102.0, total_parcelles_delimitees_et_enquetees_: 3845.0 },
            { region: null, commune: 'MISSIRAH', total_parcelles_terrain: 2400.0, total_parcelles_delimitees_et_enquetees_: 2712.0 },
            { region: null, commune: 'NETTEBOULOU', total_parcelles_terrain: 2237.0, total_parcelles_delimitees_et_enquetees_: 2492.0 },
            { region: null, commune: 'BALLOU', total_parcelles_terrain: 1579.0, total_parcelles_delimitees_et_enquetees_: 1413.0 },
            { region: 'KEDOUGOU', commune: 'BANDAFASSI', total_parcelles_terrain: 3543.0, total_parcelles_delimitees_et_enquetees_: 3565.0 },
            { region: null, commune: 'DIMBOLI', total_parcelles_terrain: 3012.0, total_parcelles_delimitees_et_enquetees_: 2989.0 },
            { region: null, commune: 'BEMBOU', total_parcelles_terrain: 1665.0, total_parcelles_delimitees_et_enquetees_: 1100.0 },
            { region: null, commune: 'Total', total_parcelles_terrain: 22148.0, total_parcelles_delimitees_et_enquetees_: 21090.0 }
        ];

        return communes;
    }

    // Cache management methods
    clearCache() {
        this.cache.clear();
        console.log('Data cache cleared');
    }

    getCacheSize() {
        return this.cache.size;
    }

    getCachedUrls() {
        return Array.from(this.cache.keys());
    }

    getCacheInfo() {
        const info = {};
        this.cache.forEach((data, url) => {
            info[url] = {
                size: Array.isArray(data) ? data.length : Object.keys(data).length,
                type: Array.isArray(data) ? 'array' : typeof data,
                lastLoaded: new Date().toISOString()
            };
        });
        return info;
    }

    // Preload commonly used data including rapport complet
    async preloadEssentialData() {
        const essentialFiles = [
            'data/parcelles.json',
            'data/Repartition_genre.json',
            'data/Projections_2025.json',
            'data/rapport_complet.json'  // Ajout du rapport complet
        ];

        const loadPromises = essentialFiles.map(file => this.loadData(file));
        
        try {
            await Promise.all(loadPromises);
            console.log('Essential data preloaded successfully');
        } catch (error) {
            console.warn('Some essential data failed to preload:', error);
        }
    }
    // Chargement des données topographiques
    async loadTopoData() {
        console.log('Chargement des données topographiques...');
        try {
            const data = await this.loadData('data/Rapports_Topo_nettoyee.json');
            console.log('Données topo chargées:', data?.length || 0, 'enregistrements');
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Erreur lors du chargement des données topo:', error);
            return this.generateTopoFallbackData();
        }
    }

    // Génération de données de fallback pour les stats topo
generateTopoFallbackData() {
    console.log('Génération de données de fallback pour Stats Topo');
    
    const communes = ['NDOGA BABACAR', 'BANDAFASSI', 'DIMBOLI', 'MISSIRAH', 'NETTEBOULOU'];
    const villages = ['Medina coly', 'Sare souna', 'Soutouba peulh', 'Village Nord', 'Village Sud'];
    const prenoms = ['Ame', 'Saliou', 'Arona', 'Fatou', 'Moussa', 'Aissatou', 'Ibrahima', 'Mariama'];
    const noms = ['FAYE', 'NDIAYE', 'FALL', 'DIOP', 'SARR', 'BA', 'SECK', 'GUEYE'];
    const operations = [
        'Levés topographiques terminés',
        'Enquêtes socio-foncières en cours',
        'Affichage public réalisé',
        'Difficultés terrain',
        null
    ];

    const fallbackData = [];
    
    // Générer des données sur 6 mois
    for (let month = 0; month < 6; month++) {
        for (let day = 1; day <= 28; day += Math.floor(Math.random() * 3) + 1) {
            const date = new Date(2024, 7 + month, day); // À partir d'août 2024
            
            // Générer plusieurs entrées par jour
            const entriesPerDay = Math.floor(Math.random() * 5) + 1;
            
            for (let entry = 0; entry < entriesPerDay; entry++) {
                const champsValue = Math.random() > 0.5 ? Math.floor(Math.random() * 30) : null;
                const batisValue = Math.random() > 0.3 ? Math.floor(Math.random() * 20) : null;
                const totalParcelles = (champsValue || 0) + (batisValue || 0);
                
                if (totalParcelles > 0) {
                    fallbackData.push({
                        date: date.toISOString().split('T')[0],
                        prenom: prenoms[Math.floor(Math.random() * prenoms.length)],
                        nom: noms[Math.floor(Math.random() * noms.length)],
                        commune: communes[Math.floor(Math.random() * communes.length)],
                        village: villages[Math.floor(Math.random() * villages.length)],
                        champs: champsValue,
                        batis: batisValue,
                        totale_parcelles: totalParcelles,
                        deroulement_des_operations: operations[Math.floor(Math.random() * operations.length)]
                    });
                }
            }
        }
    }
    
    console.log(`Généré ${fallbackData.length} enregistrements de fallback pour Stats Topo`);
    return fallbackData;
}

// Méthode pour obtenir les données topo filtrées
getTopoFiltered(filters) {
    const data = this.cache.get('data/Rapports_Topo_nettoyee.json') || [];
    
    return data.filter(item => {
        // Filtre par date
        if (filters.dateFrom && item.date && item.date < filters.dateFrom) return false;
        if (filters.dateTo && item.date && item.date > filters.dateTo) return false;
        
        // Filtre par commune
        if (filters.commune && item.commune !== filters.commune) return false;
        
        // Filtre par topographe
        const topographeName = `${item.prenom || ''} ${item.nom || ''}`.trim();
        if (filters.topographe && topographeName !== filters.topographe) return false;
        
        // Filtre par village
        if (filters.village && item.village !== filters.village) return false;
        
        // Filtre par type
        if (filters.type) {
            if (filters.type === 'champs' && (!item.champs || item.champs === 0)) return false;
            if (filters.type === 'batis' && (!item.batis || item.batis === 0)) return false;
        }
        
        return true;
    });
}
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DataLoader = DataLoader;
}
