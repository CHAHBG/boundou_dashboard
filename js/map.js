// map.js - Leaflet Map Management for PROCASEF Dashboard
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
    }
    
    // Initialisation de la carte
    initMap(containerId = 'map') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Map container not found: ${containerId}`);
            return null;
        }
        
        // Destruction de la carte existante si elle existe
        if (this.map) {
            this.map.remove();
        }
        
        // Création de la carte centrée sur Boundou
        this.map = L.map(containerId).setView(this.mapConfig.center, this.mapConfig.zoom);
        
        // Ajout de la couche de tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            minZoom: this.mapConfig.minZoom,
            maxZoom: this.mapConfig.maxZoom
        }).addTo(this.map);
        
        // Initialisation du cluster de marqueurs
        this.markerClusterGroup = L.markerClusterGroup({
            maxClusterRadius: 50,
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
        
        this.map.addLayer(this.markerClusterGroup);
        
        // Ajout du marqueur central pour Boundou
        const boundouMarker = L.marker(this.boundouCoords, {
            icon: this.createCustomIcon(this.colors.primary, 'large')
        }).addTo(this.map);
        
        boundouMarker.bindPopup(`
            <div class="map-popup">
                <h3>Boundou - Centre du Projet PROCASEF</h3>
                <p>Coordonnées: ${this.boundouCoords[0]}, ${this.boundouCoords[1]}</p>
            </div>
        `);
        
        console.log('Map initialized successfully');
        return this.map;
    }
    
    // Création d'icônes personnalisées avec les couleurs PROCASEF
    createCustomIcon(color, size = 'medium') {
        const sizes = {
            small: [20, 20],
            medium: [30, 30],
            large: [40, 40]
        };
        
        const iconSize = sizes[size] || sizes.medium;
        
        return L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background-color: ${color};
                    border: 3px solid white;
                    border-radius: 50%;
                    width: ${iconSize[0]}px;
                    height: ${iconSize[1]}px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>
            `,
            iconSize: iconSize,
            iconAnchor: [iconSize[0]/2, iconSize[1]/2]
        });
    }
    
    // Ajout de marqueurs pour les communes
    addCommuneMarkers(parcellesData) {
        if (!this.map || !parcellesData) {
            console.warn('Map or data not available');
            return;
        }
        
        // Agrégation des données par commune
        const communeStats = {};
        
        parcellesData.forEach(parcelle => {
            const commune = parcelle.commune;
            if (!communeStats[commune]) {
                communeStats[commune] = {
                    nom: commune,
                    totalParcelles: 0,
                    parcellesNicad: 0,
                    parcellesDeliberees: 0,
                    superficie: 0,
                    coordonnees: this.communeCoords[commune] || null
                };
            }
            
            communeStats[commune].totalParcelles++;
            if (parcelle.nicad === 'Oui') communeStats[commune].parcellesNicad++;
            if (parcelle.deliberee === 'Oui') communeStats[commune].parcellesDeliberees++;
            if (parcelle.superficie && !isNaN(parcelle.superficie)) {
                communeStats[commune].superficie += parseFloat(parcelle.superficie);
            }
        });
        
        // Création des marqueurs pour chaque commune
        Object.values(communeStats).forEach(commune => {
            if (!commune.coordonnees) return;
            
            // Détermination de la couleur basée sur le taux de NICAD
            const tauxNicad = commune.totalParcelles > 0 ? 
                (commune.parcellesNicad / commune.totalParcelles) * 100 : 0;
            
            let markerColor;
            if (tauxNicad >= 70) {
                markerColor = this.colors.success;
            } else if (tauxNicad >= 50) {
                markerColor = this.colors.warning;
            } else {
                markerColor = this.colors.error;
            }
            
            const marker = L.marker(commune.coordonnees, {
                icon: this.createCustomIcon(markerColor, 'medium')
            });
            
            // Popup avec informations détaillées
            const popupContent = `
                <div class="commune-popup" style="min-width: 200px;">
                    <h3 style="color: ${this.colors.secondary}; margin: 0 0 10px 0;">
                        ${commune.nom}
                    </h3>
                    <div style="font-size: 12px; line-height: 1.4;">
                        <p><strong>📊 Total parcelles:</strong> ${commune.totalParcelles.toLocaleString()}</p>
                        <p><strong>✅ Parcelles NICAD:</strong> ${commune.parcellesNicad.toLocaleString()} (${tauxNicad.toFixed(1)}%)</p>
                        <p><strong>📋 Parcelles délibérées:</strong> ${commune.parcellesDeliberees.toLocaleString()}</p>
                        <p><strong>📏 Superficie totale:</strong> ${commune.superficie.toFixed(2)} ha</p>
                        <p><strong>📍 Coordonnées:</strong> ${commune.coordonnees[0].toFixed(3)}, ${commune.coordonnees[1].toFixed(3)}</p>
                    </div>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            
            // Ajout de propriétés personnalisées pour le filtrage
            marker.communeData = commune;
            
            this.markers.push(marker);
            this.markerClusterGroup.addLayer(marker);
        });
        
        console.log(`Added ${this.markers.length} commune markers`);
    }
    
    // Fonction de mise à jour des marqueurs selon le filtre
    updateMarkers(filterCommune = '') {
        if (!this.markerClusterGroup) return;
        
        this.currentFilter = filterCommune;
        
        // Suppression de tous les marqueurs du cluster
        this.markerClusterGroup.clearLayers();
        
        // Ajout sélectif des marqueurs selon le filtre
        this.markers.forEach(marker => {
            if (!filterCommune || marker.communeData.nom === filterCommune) {
                this.markerClusterGroup.addLayer(marker);
            }
        });
        
        // Ajustement de la vue si un filtre spécifique est appliqué
        if (filterCommune && this.communeCoords[filterCommune]) {
            this.map.setView(this.communeCoords[filterCommune], 11);
        } else {
            // Retour à la vue d'ensemble
            this.map.setView(this.mapConfig.center, this.mapConfig.zoom);
        }
        
        console.log(`Updated markers for filter: ${filterCommune || 'all'}`);
    }
    
    // Ajout de contrôles personnalisés
    addCustomControls() {
        if (!this.map) return;
        
        // Contrôle de réinitialisation de la vue
        const resetControl = L.control({position: 'topleft'});
        resetControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-control-custom');
            div.innerHTML = `
                <button class="reset-view-btn" title="Centrer sur Boundou" style="
                    background: ${this.colors.primary};
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">🏠 Centrer</button>
            `;
            
            div.onclick = (e) => {
                e.stopPropagation();
                this.map.setView(this.mapConfig.center, this.mapConfig.zoom);
                this.updateMarkers(''); // Reset filter
            };
            
            return div;
        };
        resetControl.addTo(this.map);
        
        // Légende des couleurs
        const legendControl = L.control({position: 'bottomright'});
        legendControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-control-custom legend-control');
            div.innerHTML = `
                <div style="background: white; padding: 10px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    <h4 style="margin: 0 0 8px 0; font-size: 12px;">Taux NICAD</h4>
                    <div style="font-size: 11px;">
                        <div><span style="display: inline-block; width: 12px; height: 12px; background: ${this.colors.success}; border-radius: 50%; margin-right: 5px;"></span> ≥ 70%</div>
                        <div><span style="display: inline-block; width: 12px; height: 12px; background: ${this.colors.warning}; border-radius: 50%; margin-right: 5px;"></span> 50-70%</div>
                        <div><span style="display: inline-block; width: 12px; height: 12px; background: ${this.colors.error}; border-radius: 50%; margin-right: 5px;"></span> < 50%</div>
                    </div>
                </div>
            `;
            return div;
        };
        legendControl.addTo(this.map);
    }
    
    // Destruction propre de la carte
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.markers = [];
        this.markerClusterGroup = null;
        console.log('Map destroyed');
    }
    
    // Redimensionnement de la carte
    resize() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }
    
    // Export des données de la carte
    exportMapData() {
        const mapData = {
            center: this.map ? this.map.getCenter() : this.mapConfig.center,
            zoom: this.map ? this.map.getZoom() : this.mapConfig.zoom,
            markers: this.markers.length,
            currentFilter: this.currentFilter
        };
        return mapData;
    }
}

// Export pour utilisation globale
window.MapManager = MapManager;

// CSS pour les clusters et popups (injecté dynamiquement)
const mapStyles = `
    .marker-cluster-small {
        background-color: rgba(212, 165, 116, 0.6);
    }
    .marker-cluster-small div {
        background-color: rgba(212, 165, 116, 0.8);
    }
    .marker-cluster-medium {
        background-color: rgba(30, 58, 138, 0.6);
    }
    .marker-cluster-medium div {
        background-color: rgba(30, 58, 138, 0.8);
    }
    .marker-cluster-large {
        background-color: rgba(184, 134, 11, 0.6);
    }
    .marker-cluster-large div {
        background-color: rgba(184, 134, 11, 0.8);
    }
    .marker-cluster {
        background-clip: padding-box;
        border-radius: 20px;
    }
    .marker-cluster div {
        width: 30px;
        height: 30px;
        margin-left: 5px;
        margin-top: 5px;
        text-align: center;
        border-radius: 15px;
        font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
    }
    .marker-cluster span {
        line-height: 30px;
        color: white;
        font-weight: bold;
    }
    .commune-popup h3 {
        border-bottom: 2px solid #D4A574;
        padding-bottom: 5px;
    }
    .leaflet-popup-content-wrapper {
        border-radius: 8px;
    }
    .reset-view-btn:hover {
        opacity: 0.8;
    }
`;

// Injection des styles CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = mapStyles;
document.head.appendChild(styleSheet);
