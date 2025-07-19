// map.js - Leaflet Map Management for PROCASEF Dashboard - VERSION FINALE
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
            warning: '#F59E0B',
            error: '#EF4444'
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

    // Ajout de marqueurs pour les communes
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
