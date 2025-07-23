// map.js - Leaflet Map Management for PROCASEF Dashboard - VERSION FINALE CORRIGÉE
class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.markerClusterGroup = null;
        this.currentFilter = '';
        
        // Coordonnées de Boundou
        this.boundouCoords = [13.2, -12.5];
        
        // Configuration de la carte
        this.mapConfig = {
            center: this.boundouCoords,
            zoom: 9,
            minZoom: 6,
            maxZoom: 18
        };
        
        // Couleurs PROCASEF pour les marqueurs
        this.colors = {
            primary: '#D4A574',    // Orange Gold Mat
            secondary: '#1E3A8A',  // Bleu Navy
            accent: '#B8860B',     // Dark Goldenrod
            success: '#10B981',
            warning: '#F59 '#EF4444'
        };
        
        // Données des communes (coordonnées approximatives de la région de Boundou)
        this.communeCoords = {
            'NDOGA BABACAR': [13.730966, -13.966889],
            'BANDAFASSI': [12.538069, -12.311436],
            'DIMBOLI': [12.466460, -11.995183],
            'MISSIRAH': [13.524222, -13.513120],
            'NETTEBOULOU': [13.599513, -13.759329],
            'BALLOU': [14.735395, -12.236302],
            'FONGOLIMBI': [12.423414, -12.008104],
            'GABOU': [14.713768, -12.414165],
            'BEMBOU': [12.826605, -11.875561],
            'DINDEFELO': [12.385165, -12.326742],
            'MOUDERY': [15.057468, -12.594212],
            'TOMBORONKOTO': [12.795540, -12.299054]
        };
    }

    // 🔴 CORRECTION CRITIQUE: Méthode de destruction complète
    destroyMap() {
        console.log('🗑️ Destruction complète de la carte...');
        
        try {
            // Nettoyer les marqueurs individuels
            if (this.markers && this.markers.length > 0) {
                console.log(`Suppression de ${this.markers.length} marqueurs`);
                this.markers.forEach(marker => {
                    if (marker && typeof marker.remove === 'function') {
                        marker.remove();
                    }
                });
                this.markers = [];
            }

            // Nettoyer le cluster de marqueurs
            if (this.markerClusterGroup) {
                console.log('Nettoyage du cluster de marqueurs');
                try {
                    this.markerClusterGroup.clearLayers();
                    if (this.map && this.map.hasLayer(this.markerClusterGroup)) {
                        this.map.removeLayer(this.markerClusterGroup);
                    }
                } catch (error) {
                    console.warn('Erreur lors du nettoyage du cluster:', error);
                }
                this.markerClusterGroup = null;
            }

            // Détruire la carte principale
            if (this.map) {
                console.log('Destruction de l\'instance de carte Leaflet');
                try {
                    // Supprimer tous les event listeners
                    this.map.off();
                    
                    // Détruire la carte
                    this.map.remove();
                } catch (error) {
                    console.warn('Erreur lors de la destruction de la carte:', error);
                }
                this.map = null;
            }

            console.log('✅ Carte détruite avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de la destruction de la carte:', error);
        }
    }

    // 🔴 CORRECTION CRITIQUE: Initialisation sécurisée de la carte
    initMap(containerId = 'mapContainer') {
        console.log(`🗺️ Initialisation de la carte sur: ${containerId}`);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Conteneur de carte non trouvé: ${containerId}`);
            return null;
        }

        // 🔴 CORRECTION: Détruire l'instance existante en premier
        if (this.map) {
            console.log('🧹 Nettoyage de l\'instance existante...');
            this.destroyMap();
        }

        // 🔴 CORRECTION: Nettoyer l'ID Leaflet du conteneur DOM
        const domContainer = L.DomUtil.get(containerId);
        if (domContainer && domContainer._leaflet_id != null) {
            console.log('🧹 Nettoyage de l\'ID Leaflet du conteneur DOM');
            domContainer._leaflet_id = null;
        }

        // 🔴 CORRECTION: Nettoyer le contenu HTML si nécessaire
        if (container.hasChildNodes()) {
            console.log('🧹 Nettoyage du contenu HTML du conteneur');
            container.innerHTML = '';
        }

        try {
            // Création sécurisée de la nouvelle carte
            console.log('📍 Création de la nouvelle instance de carte...');
            this.map = L.map(containerId, {
                center: this.mapConfig.center,
                zoom: this.mapConfig.zoom,
                zoomControl: true,
                attributionControl: true
            });

            // 🔴 CORRECTION CRITIQUE: Ajout correct de la couche de tuiles
            const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
                minZoom: this.mapConfig.minZoom,
                maxZoom: this.mapConfig.maxZoom,
                detectRetina: true
            });

            tileLayer.addTo(this.map); // 🔴 CORRECTION: this.map au lieu de this.mapManager.map

            // Initialisation du cluster de marqueurs
            this.initializeMarkerCluster();

            // Ajout d'un marqueur pour Boundou (centre)
            this.addBoundouMarker();

            console.log('✅ Carte initialisée avec succès');
            return this.map;

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation de la carte:', error);
            return null;
        }
    }

    // Initialisation du cluster de marqueurs
    initializeMarkerCluster() {
        if (this.markerClusterGroup) {
            this.markerClusterGroup.clearLayers();
        }

        this.markerClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: (cluster) => {
                const childCount = cluster.getChildCount();
                let c = ' marker-cluster-';
                
                if (childCount < 10) {
                    c += 'small';
                } else if (childCount < 100) {
                    c += 'medium';
                } else {
                    c += 'large';
                }
                
                return new L.DivIcon({
                    html: `<div><span>${childCount}</span></div>`,
                    className: 'marker-cluster' + c,
                    iconSize: new L.Point(40, 40)
                });
            }
        });

        if (this.map) {
            this.map.addLayer(this.markerClusterGroup);
        }
    }

    // Ajout du marqueur central pour Boundou
    addBoundouMarker() {
        if (!this.map) return;

        const boundouIcon = L.divIcon({
            className: 'boundou-marker',
            html: `<div style="
                background-color: ${this.colors.primary};
                border: 3px solid ${this.colors.secondary};
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">B</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const boundouMarker = L.marker(this.boundouCoords, { 
            icon: boundouIcon 
        }).addTo(this.map);

        boundouMarker.bindPopup(`
            <div style="font-family: Inter, sans-serif; min-width: 200px;">
                <h4 style="color: ${this.colors.secondary}; margin: 0 0 10px 0;">
                    🏛️ Région de Boundou
                </h4>
                <p style="margin: 5px 0; color: #666;">
                    <strong>📍 Coordonnées:</strong><br>
                    ${this.boundouCoords[0]}, ${this.boundouCoords[1]}
                </p>
                <p style="margin: 5px 0; color: #666;">
                    <strong>🗺️ Zone:</strong> Centre administratif
                </p>
                <p style="margin: 5px 0; color: #666;">
                    <strong>📊 Projet:</strong> PROCASEF
                </p>
            </div>
        `);

        this.markers.push(boundouMarker);
    }

    // 🔴 CORRECTION: Ajout de marqueurs pour les communes - méthode complètement réécrite
    addCommuneMarker(communeName, stats) {
        if (!this.map || !this.communeCoords[communeName]) {
            console.warn(`Coordonnées non trouvées pour la commune: ${communeName}`);
            return;
        }

        const coords = this.communeCoords[communeName];
        const totalParcelles = stats.total || 0;
        const parcellesNicad = stats.nicad_oui || 0;
        const parcellesDeliberees = stats.deliberees_oui || 0;
        const superficie = stats.superficie || 0;

        // Calcul du taux NICAD pour déterminer la couleur
        const tauxNicad = totalParcelles > 0 ? (parcellesNicad / totalParcelles) * 100 : 0;
        let markerColor = this.colors.error; // Rouge par défaut
        
        if (tauxNicad >= 60) {
            markerColor = this.colors.success; // Vert
        } else if (tauxNicad >= 40) {
            markerColor = this.colors.warning; // Orange
        }

        // Taille du marqueur basée sur le nombre total de parcelles
        const markerSize = Math.max(15, Math.min(30, totalParcelles / 200));

        const communeIcon = L.divIcon({
            className: 'commune-marker',
            html: `<div style="
                background-color: ${markerColor};
                border: 2px solid ${this.colors.secondary};
                border-radius: 50%;
                width: ${markerSize}px;
                height: ${markerSize}px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: ${Math.max(8, markerSize/3)}px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                cursor: pointer;
            ">${communeName.substring(0, 2)}</div>`,
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize/2, markerSize/2]
        });

        const marker = L.marker(coords, { icon: communeIcon });

        // Popup avec les informations détaillées
        marker.bindPopup(`
            <div style="font-family: Inter, sans-serif; min-width: 250px;">
                <h4 style="color: ${this.colors.secondary}; margin: 0 0 10px 0; border-bottom: 2px solid ${this.colors.primary}; padding-bottom: 5px;">
                    🏘️ ${communeName}
                </h4>
                
                <div style="margin: 10px 0;">
                    <p style="margin: 5px 0; color: #333;">
                        <strong>📊 Total parcelles:</strong> ${totalParcelles.toLocaleString()}
                    </p>
                    <p style="margin: 5px 0; color: #333;">
                        <strong>✅ Parcelles NICAD:</strong> ${parcellesNicad.toLocaleString()} 
                        <span style="color: ${markerColor}; font-weight: bold;">(${tauxNicad.toFixed(1)}%)</span>
                    </p>
                    <p style="margin: 5px 0; color: #333;">
                        <strong>📋 Parcelles délibérées:</strong> ${parcellesDeliberees.toLocaleString()}
                    </p>
                    <p style="margin: 5px 0; color: #333;">
                        <strong>📏 Superficie totale:</strong> ${superficie.toFixed(2)} ha
                    </p>
                </div>
                
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                    <p style="margin: 0; color: #666; font-size: 12px;">
                        <strong>📍 Coordonnées:</strong> ${coords[0].toFixed(3)}, ${coords[1].toFixed(3)}
                    </p>
                </div>
            </div>
        `);

        // Ajout du marqueur au cluster
        if (this.markerClusterGroup) {
            this.markerClusterGroup.addLayer(marker);
        } else {
            marker.addTo(this.map);
        }

        this.markers.push(marker);
    }

    // 🔴 CORRECTION: Ajout des marqueurs topographiques - méthode au niveau racine
    addTopoMarkers(topoData) {
        if (!this.map || !Array.isArray(topoData) || topoData.length === 0) {
            console.warn('Impossible d\'ajouter les marqueurs topo');
            return;
        }

        console.log('Ajout des marqueurs topographiques:', topoData.length, 'points');

        // Grouper les données par commune
        const communeGroups = this.groupTopoDataByCommune(topoData);

        Object.entries(communeGroups).forEach(([commune, data]) => {
            const coords = this.communeCoords[commune];
            if (!coords) {
                console.warn(`Coordonnées non trouvées pour la commune: ${commune}`);
                return;
            }

            const totalParcelles = data.reduce((sum, item) => sum + (item.totale_parcelles || 0), 0);
            const totalChamps = data.reduce((sum, item) => sum + (item.champs || 0), 0);
            const totalBatis = data.reduce((sum, item) => sum + (item.batis || 0), 0);
            const uniqueTopographes = [...new Set(data.map(item => `${item.prenom} ${item.nom}`))];

            // Créer l'icône avec taille basée sur le volume
            const iconSize = this.calculateTopoIconSize(totalParcelles);
            const icon = L.divIcon({
                className: 'topo-marker',
                html: `
                    <div class="topo-marker-content" style="
                        background: linear-gradient(135deg, #D4A574, #B8860B);
                        width: ${iconSize}px;
                        height: ${iconSize}px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: ${Math.max(10, iconSize * 0.3)}px;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">
                        <i class="fas fa-ruler-combined"></i>
                    </div>
                `,
                iconSize: [iconSize, iconSize],
                iconAnchor: [iconSize / 2, iconSize / 2]
            });

            const marker = L.marker(coords, { icon });

            // Popup avec informations détaillées
            const popupContent = this.createTopoPopupContent(commune, {
                totalParcelles,
                totalChamps,
                totalBatis,
                uniqueTopographes: uniqueTopographes.length,
                recentActivities: data.slice(-5),
                coords
            });

            marker.bindPopup(popupContent, {
                maxWidth: 350,
                className: 'topo-popup'
            });

            // Ajouter au cluster
            if (this.markerClusterGroup) {
                this.markerClusterGroup.addLayer(marker);
            } else {
                marker.addTo(this.map);
            }

            this.markers.push(marker);
        });

        // Ajuster la vue si des marqueurs ont été ajoutés
        if (this.markers.length > 0 && this.markerClusterGroup) {
            this.map.fitBounds(this.markerClusterGroup.getBounds(), { padding: [20, 20] });
        }

        console.log(`${this.markers.length} marqueurs topographiques ajoutés`);
    }

    // 🔴 CORRECTION: Grouper les données topo par commune - méthode au niveau racine
    groupTopoDataByCommune(topoData) {
        return topoData.reduce((groups, item) => {
            const commune = item.commune;
            if (commune) {
                if (!groups[commune]) {
                    groups[commune] = [];
                }
                groups[commune].push(item);
            }
            return groups;
        }, {});
    }

    // 🔴 CORRECTION: Calculer la taille de l'icône basée sur le volume - méthode au niveau racine
    calculateTopoIconSize(totalParcelles) {
        const baseSize = 25;
        const maxSize = 45;
        const minSize = 20;
        
        if (totalParcelles === 0) return minSize;
        
        // Échelle logarithmique pour une meilleure répartition visuelle
        const scaleFactor = Math.log(totalParcelles + 1) * 3;
        const size = Math.min(maxSize, Math.max(minSize, baseSize + scaleFactor));
        
        return Math.round(size);
    }

    // 🔴 CORRECTION: Créer le contenu du popup pour les marqueurs topo - méthode au niveau racine
    createTopoPopupContent(commune, stats) {
        const recentActivitiesHtml = stats.recentActivities
            .map(activity => {
                const date = activity.date ? new Date(activity.date).toLocaleDateString('fr-FR') : 'N/A';
                const topographe = `${activity.prenom || ''} ${activity.nom || ''}`.trim();
                return `
                    <div style="padding: 4px 0; border-bottom: 1px solid #eee; font-size: 12px;">
                        <strong>${date}</strong> - ${topographe}<br>
                        <span style="color: #666;">${activity.village || 'N/A'} • ${activity.totale_parcelles || 0} parcelles</span>
                    </div>
                `;
            })
            .join('');

        return `
            <div style="font-family: Inter, sans-serif;">
                <h3 style="color: #1E3A8A; border-bottom: 2px solid #D4A574; padding-bottom: 8px; margin-bottom: 12px; font-size: 16px;">
                    📏 ${commune}
                </h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold; color: #10B981;">${stats.totalChamps.toLocaleString()}</div>
                        <div style="font-size: 12px; color: #666;">Champs</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold; color: #D4A574;">${stats.totalBatis.toLocaleString()}</div>
                        <div style="font-size: 12px; color: #666;">Bâtis</div>
                    </div>
                </div>

                <div style="background: #1E3A8A; color: white; padding: 8px; border-radius: 6px; text-align: center; margin-bottom: 12px;">
                    <div style="font-size: 20px; font-weight: bold;">${stats.totalParcelles.toLocaleString()}</div>
                    <div style="font-size: 12px;">Total Parcelles Levées</div>
                </div>

                <div style="margin-bottom: 12px;">
                    <strong style="color: #1E3A8A;">👥 Topographes actifs:</strong> ${stats.uniqueTopographes}
                </div>

                <div style="margin-bottom: 12px;">
                    <strong style="color: #1E3A8A;">📍 Coordonnées:</strong><br>
                    <span style="font-size: 12px; color: #666;">${stats.coords[0].toFixed(4)}, ${stats.coords[1].toFixed(4)}</span>
                </div>

                ${stats.recentActivities.length > 0 ? `
                    <div>
                        <strong style="color: #1E3A8A;">🕒 Activités récentes:</strong>
                        <div style="max-height: 120px; overflow-y: auto; margin-top: 8px;">
                            ${recentActivitiesHtml}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 🔴 CORRECTION: Nettoyer les marqueurs topo - méthode au niveau racine
    clearTopoMarkers() {
        if (this.markerClusterGroup) {
            this.markerClusterGroup.clearLayers();
        }
        
        this.markers.forEach(marker => {
            if (marker && typeof marker.remove === 'function') {
                marker.remove();
            }
        });
        
        this.markers = [];
        console.log('Marqueurs topographiques nettoyés');
    }

    // 🔴 CORRECTION: Mise à jour des marqueurs topo avec nouvelles données - méthode au niveau racine
    updateTopoMarkers(topoData) {
        this.clearTopoMarkers();
        this.addTopoMarkers(topoData);
    }

    // 🔴 NOUVELLE MÉTHODE: Nettoyage des marqueurs sans détruire la carte
    clearMarkers() {
        if (this.markerClusterGroup) {
            this.markerClusterGroup.clearLayers();
        }
        // Garder seulement le marqueur Boundou (premier marqueur)
        this.markers = this.markers.slice(0, 1);
    }

    // Centrage automatique sur tous les marqueurs
    fitToMarkers() {
        if (!this.map || this.markers.length === 0) return;

        const group = new L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1));
    }

    // Filtrage des marqueurs
    filterMarkers(filterValue) {
        this.currentFilter = filterValue.toLowerCase();
        
        if (this.markerClusterGroup) {
            this.markerClusterGroup.clearLayers();
            
            this.markers.forEach(marker => {
                const popup = marker.getPopup();
                if (!popup) return;

                const content = popup.getContent().toLowerCase();
                if (!filterValue || content.includes(this.currentFilter)) {
                    this.markerClusterGroup.addLayer(marker);
                }
            });
        }
    }

    // Méthode de redimensionnement
    resize() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    // Nettoyage complet lors de la destruction
    cleanup() {
        this.destroyMap();
        this.markers = [];
        this.markerClusterGroup = null;
        this.currentFilter = '';
        console.log('✅ MapManager nettoyé complètement');
    }
}

// Export pour utilisation globale
if (typeof window !== 'undefined') {
    window.MapManager = MapManager;
}
