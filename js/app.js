// js/app.js — PROCASEF Dashboard Application — Version complète corrigée

class ProcasefDashboard {
  constructor() {
    // Palette de couleurs PROCASEF
    this = {
      primary: '#D4A574',
      secondary: '#1E3A8A',
      accent: '#B8860B',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6'
    };

    this.dataLoader = new DataLoader();
    this.charts = {};
    this.mapManager = null;

    this.data = {
      parcelles: [],
      projections: [],
      genreCommune: [],
      genreTrimestre: [],
      repartitionGenre: [],
      etatOperations: [],
      rapportComplet: [],
      topoData: []
    };

    this.currentSection = 'accueil';
    this.fontSize = 14;
    this.filteredParcelles = [];
    this.filteredTopoData = [];

    this.filters = { commune: '', nicad: '', deliberation: '' };
    this.topoFilters = {
      dateFrom: '', dateTo: '',
      commune: '', topographe: '',
      village: '', type: ''
    };

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

  // Initialisation
  async init() {
    this.showLoading();
    this.setupEventListeners();
    await this.loadInitialData();
    this.calculateStats();
    this.renderDashboard();
    this.hideLoading();
  }

  // Chargement initial des données
  async loadInitialData() {
    const urls = {
      parcelles: 'data/parcelles.json',
      projections: 'data/Projections_2025.json',
      genreCommune: 'data/Genre_par_Commune.json',
      genreTrimestre: 'data/Genre_par_trimestre.json',
      repartitionGenre: 'data/Repartition_genre.json',
      etatOperations: 'data/Etat_des_operations_Boundou_Mai_2025.json',
      rapportComplet: 'data/rapport_complet.json',
      topoData: 'data/Rapports_Topo_nettoyee.json'
    };
    for (const key in urls) {
      try {
        this.data[key] = await this.dataLoader.loadData(urls[key]);
      } catch {
        this.data[key] = [];
      }
    }
  }

  // Calcul des statistiques globales
  calculateStats() {
    const p = this.data.parcelles || [];
    this.stats = {
      total: p.length,
      nicad_oui: p.filter(x => x.nicad === 'Oui').length,
      deliberees_oui: p.filter(x => x.deliberee === 'Oui').length,
      superficie_totale: p.reduce((sum, x) => sum + (parseFloat(x.superficie)||0), 0)
    };
    this.communeStats = {};
    p.forEach(x => {
      const c = x.commune || 'N/A';
      if (!this.communeStats[c]) this.communeStats[c] = { total:0, nicad_oui:0, deliberees_oui:0, superficie:0 };
      this.communeStats[c].total++;
      if (x.nicad === 'Oui') this.communeStats[c].nicad_oui++;
      if (x.deliberee === 'Oui') this.communeStats[c].deliberees_oui++;
      this.communeStats[c].superficie += parseFloat(x.superficie)||0;
    });
  }

  // Écouteurs d'événements UI
  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', async e => {
        e.preventDefault();
        const sec = item.dataset.section;
        if (sec) await this.navigateToSection(sec);
      });
    });
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => this.toggleSidebar());
    // Font controls
    this.setupFontSizeControls();
    // Filtres Parcelles
    ['communeFilter','nicadFilter','deliberationFilter'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => this.applyFilters());
    });
    // Filtres Topo
    ['dateFromFilter','dateToFilter','communeTopoFilter','topographeFilter','villageTopoFilter','typeTopoFilter']
      .forEach(id => document.getElementById(id)?.addEventListener('change', () => this.applyTopoFilters()));
    // Reset/Export Topo
    document.getElementById('resetTopoFiltersBtn')?.addEventListener('click', () => this.resetTopoFilters());
    document.getElementById('exportTopoBtn')?.addEventListener('click', () => this.exportTopoData());
    // Export Parcelles
    document.getElementById('exportParcellesBtn')?.addEventListener('click', () => this.exportParcellesData());
    document.getElementById('exportPostBtn')?.addEventListener('click', () => this.exportPostData());
    // Resize handler
    window.addEventListener('resize', () => this.handleResize());
  }

  setupFontSizeControls() {
    const slider = document.getElementById('fontSizeSlider');
    const dec = document.getElementById('fontDecrease');
    const inc = document.getElementById('fontIncrease');
    const tooltip = document.getElementById('fontTooltip');
    if (!slider) return;
    slider.value = this.fontSize;
    const update = () => {
      this.fontSize = +slider.value;
      document.documentElement.style.setProperty('--font-size-base', this.fontSize+'px');
      tooltip.textContent = `${this.fontSize}px`;
    };
    slider.addEventListener('input', update);
    dec?.addEventListener('click', () => { if (this.fontSize>12){ slider.value=--this.fontSize; update(); } });
    inc?.addEventListener('click', () => { if (this.fontSize<20){ slider.value=++this.fontSize; update(); } });
  }

  // Navigation
  async navigateToSection(sectionId) {
    // destroy map if leaving
    if (this.mapManager?._map && sectionId !== 'parcelles') this.mapManager.destroyMap();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.nav-item[data-section="${sectionId}"]`)?.classList.add('active');
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionId}-section`)?.classList.add('active');
    const titles = {
      accueil:'Dashboard PROCASEF',
      parcelles:'Répartition des Parcelles',
      'etat-avancement':'État d\'Avancement',
      'projections-2025':'Projections 2025',
      genre:'Répartition par Genre',
      rapport:'Rapport Complet',
      'stats-topo':'Statistiques Topographiques'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId]||titles.accueil;
    await this.loadDataForSection(sectionId);
    this.currentSection = sectionId;
    this.renderSection(sectionId);
  }

  async loadDataForSection(sec) {
    switch(sec) {
      case 'parcelles':
        if (!this.data.parcelles.length) this.data.parcelles = await this.dataLoader.loadData('data/parcelles.json');
        break;
      case 'etat-avancement':
        if (!this.data.etatOperations.length) this.data.etatOperations = await this.dataLoader.loadData('data/Etat_des_operations_Boundou_Mai_2025.json');
        break;
      case 'projections-2025':
        if (!this.data.projections.length) this.data.projections = await this.dataLoader.loadData('data/Projections_2025.json');
        break;
      case 'genre':
        if (!this.data.genreCommune.length) this.data.genreCommune = await this.dataLoader.loadData('data/Genre_par_Commune.json');
        if (!this.data.genreTrimestre.length) this.data.genreTrimestre = await this.dataLoader.loadData('data/Genre_par_trimestre.json');
        if (!this.data.repartitionGenre.length) this.data.repartitionGenre = await this.dataLoader.loadData('data/Repartition_genre.json');
        break;
      case 'rapport':
        if (!this.data.rapportComplet.length) this.data.rapportComplet = await this.dataLoader.loadData('data/rapport_complet.json');
        break;
      case 'stats-topo':
        if (!this.data.topoData.length) this.data.topoData = await this.dataLoader.loadData('data/Rapports_Topo_nettoyee.json');
        this.populateTopoFilters();
        break;
    }
  }

  // Rendu sections
  renderDashboard() {
    this.renderAccueil();
  }

  renderSection(sec) {
    this.destroyAllCharts();
    switch(sec) {
      case 'accueil': this.renderAccueil(); break;
      case 'parcelles': this.renderParcelles(); break;
      case 'etat-avancement': this.renderEtatAvancement(); break;
      case 'projections-2025': this.renderProjections(); break;
      case 'genre': this.renderGenre(); break;
      case 'rapport': this.renderRapport(); break;
      case 'stats-topo': this.renderStatsTopo(); break;
    }
  }

  renderAccueil() {
    this.updateKPIs();
    setTimeout(() => {
      window.chartManager.createBar('topCommunesChart', {
        labels: Object.keys(this.communeStats),
        datasets: [{ data: Object.values(this.communeStats).map(s=>s.total) }]
      });
      window.chartManager.createLine('projectionsChart', {
        labels: this.data.projections.map(x=>x.mois),
        datasets: [{ data: this.data.projections.map(x=>x.inventaires_mensuels_realises||0) }]
      });
      window.chartManager.createDoughnut('genreGlobalChart', {
        labels: ['Hommes','Femmes'],
        datasets: [{ data: this.data.repartitionGenre.map(x=> x.genre==='Homme'? x.total_nombre:0)
                   .concat(this.data.repartitionGenre.map(x=> x.genre==='Femme'? x.total_nombre:0)) }]
      });
    },200);
  }

  renderParcelles() {
    this.populateFilters();
    if (!this.mapManager) this.mapManager = new MapManager();
    this.mapManager.initMap();
    setTimeout(()=>{
      window.chartManager.createBar('regionChart', {
        labels: Object.keys(this.communeStats),
        datasets:[{ data:Object.values(this.communeStats).map(s=>s.total) }]
      });
      window.chartManager.createDoughnut('nicadChart', {
        labels:['NICAD Oui','NICAD Non'],
        datasets:[{ data:[this.stats.nicad_oui, this.stats.total - this.stats.nicad_oui] }]
      });
      this.renderParcellesTable();
    },200);
  }

  renderEtatAvancement() {
    setTimeout(()=>{
      const arr = this.data.etatOperations;
      const labels = arr.map(x=>x.commune);
      const states = arr.map(x=>x.etat_d_avancement);
      window.chartManager.createEtatCommuneBarChart('etatCommuneChart', labels, states);
      const counts = {};
      arr.forEach(x=> counts[x.etat_d_avancement] = (counts[x.etat_d_avancement]||0)+1);
      window.chartManager.createEtatDonutChart('etatDonutChart',
        Object.keys(counts), Object.values(counts));
      this.renderEtatTimeline();
    },200);
  }

  renderProjections() {
    setTimeout(()=> {
      window.chartManager.createLine('projectionsDetailChart', {
        labels: this.data.projections.map(x=>x.mois),
        datasets: [{ data: this.data.projections.map(x=>x.objectif_inventaires_total) }]
      });
    },200);
  }

  renderGenre() {
    setTimeout(()=>{
      window.chartManager.createPolarChart('genreCommuneChart', this.data.genreCommune);
      window.chartManager.createLine('genreTrimestreChart', {
        labels: this.data.genreTrimestre.map(x=>x.periodetrimestrielle),
        datasets: [
          { label:'Hommes', data:this.data.genreTrimestre.map(x=>x.homme) },
          { label:'Femmes', data:this.data.genreTrimestre.map(x=>x.femme) }
        ]
      });
    },200);
  }

  renderRapport() {
    setTimeout(()=>{
      window.chartManager.createMixedChart('rapportChart', this.data.rapportComplet);
    },200);
  }

  renderStatsTopo() {
    this.applyTopoFilters();
    setTimeout(()=>{
      this.updateTopoKPIs();
      this.createTopoCharts();
      this.renderTopoTable();
      this.renderTopoTimeline();
    },200);
  }

  // Filtres Parcelles
  applyFilters() {
    const c=document.getElementById('communeFilter')?.value||'';
    const n=document.getElementById('nicadFilter')?.value||'';
    const d=document.getElementById('deliberationFilter')?.value||'';
    this.filteredParcelles = this.data.parcelles.filter(p=>{
      if(c&&p.commune!==c) return false;
      if(n&&p.nicad!==n) return false;
      if(d&&p.deliberee!==d) return false;
      return true;
    });
    this.renderParcellesTable();
  }

  populateFilters() {
    const communes = [...new Set(this.data.parcelles.map(x=>x.commune))].sort();
    this.populateSelect('communeFilter', communes);
  }

  populateSelect(id, opts) {
    const sel=document.getElementById(id);
    if(!sel) return;
    const cur=sel.value;
    sel.innerHTML='<option value="">Tous</option>'+opts.map(o=>
      `<option${o===cur?' selected':''} value="${o}">${o}</option>`).join('');
    sel.value=cur;
  }

  renderParcellesTable() {
    const body=document.querySelector('#parcellesTable tbody');
    if(!body) return;
    const data=this.filteredParcelles.length? this.filteredParcelles:this.data.parcelles;
    body.innerHTML='';
    data.forEach(x=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${x.commune||''}</td>
        <td>${x.nicad||''}</td>
        <td>${x.deliberee||''}</td>
        <td>${parseFloat(x.superficie)||0}</td>`;
      body.appendChild(tr);
    });
  }

  // Filtres Topo
  populateTopoFilters() {
    const d=this.data.topoData;
    this.populateSelect('communeTopoFilter', [...new Set(d.map(x=>x.commune))].sort());
    this.populateSelect('topographeFilter', [...new Set(d.map(x=>`${x.prenom} ${x.nom}`))].sort());
    this.populateSelect('villageTopoFilter', [...new Set(d.map(x=>x.village))].sort());
  }

  applyTopoFilters() {
    const f=this.topoFilters;
    f.dateFrom=document.getElementById('dateFromFilter')?.value||'';
    f.dateTo=document.getElementById('dateToFilter')?.value||'';
    f.commune=document.getElementById('communeTopoFilter')?.value||'';
    f.topographe=document.getElementById('topographeFilter')?.value||'';
    f.village=document.getElementById('villageTopoFilter')?.value||'';
    f.type=document.getElementById('typeTopoFilter')?.value||'';
    this.filteredTopoData = this.data.topoData.filter(x=>{
      if(f.dateFrom&&x.date<f.dateFrom) return false;
      if(f.dateTo&&x.date>f.dateTo) return false;
      if(f.commune&&x.commune!==f.commune) return false;
      const full=`${x.prenom} ${x.nom}`.trim();
      if(f.topographe&&full!==f.topographe) return false;
      if(f.village&&x.village!==f.village) return false;
      if(f.type==='champs'&&!(x.champs>0)) return false;
      if(f.type==='batis'&&!(x.batis>0)) return false;
      return true;
    });
    this.topoTableState.data=this.filteredTopoData;
    this.topoTableState.currentPage=1;
  }

  resetTopoFilters() {
    ['dateFromFilter','dateToFilter','communeTopoFilter','topographeFilter','villageTopoFilter','typeTopoFilter']
      .forEach(id=>document.getElementById(id).value='');
    this.applyTopoFilters();
  }

  // Render tableau topo
  renderTopoTable() {
    const body=document.querySelector('#topoTable tbody');
    if(!body) return;
    let data=[...this.topoTableState.data];
    // search
    const s=this.topoTableState.searchTerm.toLowerCase();
    if(s) data=data.filter(x=>
      (x.date||'').includes(s)||
      (x.prenom||'').toLowerCase().includes(s)||
      (x.nom||'').toLowerCase().includes(s)||
      (x.commune||'').toLowerCase().includes(s)||
      (x.village||'').toLowerCase().includes(s)||
      (x.deroulement_des_operations||'').toLowerCase().includes(s)
    );
    // sort
    data.sort((a,b)=>{
      let av=a[this.topoTableState.sortField]||'';
      let bv=b[this.topoTableState.sortField]||'';
      if(this.topoTableState.sortField==='topographe'){
        av=`${a.prenom} ${a.nom}`; bv=`${b.prenom} ${b.nom}`;
      }
      av=av.toString().toLowerCase(); bv=bv.toString().toLowerCase();
      return this.topoTableState.sortDirection==='asc'? av>bv?1:-1 : av<bv?1:-1;
    });
    // paginate
    const start=(this.topoTableState.currentPage-1)*this.topoTableState.pageSize;
    const page=data.slice(start, start+this.topoTableState.pageSize);
    body.innerHTML='';
    page.forEach(x=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td>${x.date||''}</td>
        <td>${x.prenom||''} ${x.nom||''}</td>
        <td>${x.commune||''}</td>
        <td>${x.village||''}</td>
        <td>${x.champs||0}</td>
        <td>${x.batis||0}</td>
        <td>${x.totale_parcelles||0}</td>
        <td>${x.deroulement_des_operations||''}</td>`;
      body.appendChild(tr);
    });
  }

  // Timeline topo
  renderTopoTimeline() {
    const cont=document.querySelector('.timeline-container');
    if(!cont) return;
    cont.innerHTML='';
    this.filteredTopoData.forEach(x=>{
      const div=document.createElement('div');
      div.className='timeline-item';
      div.innerHTML=`
        <div class="timeline-content">
          <strong>${new Date(x.date).toLocaleDateString('fr-FR')}</strong>
          <p>${x.deroulement_des_operations||''}</p>
          <small>${x.prenom} ${x.nom} — ${x.commune}</small>
        </div>`;
      cont.appendChild(div);
    });
  }

  // KPIs Accueil
  updateKPIs() {
    this.updateKPI('totalParcellesKPI', this.stats.total);
    this.updateKPI('nicadKPI', this.stats.nicad_oui);
    this.updateKPI('delibereeKPI', this.stats.deliberees_oui);
    this.updateKPI('superficieKPI', this.stats.superficie_totale.toFixed(2));
  }

  updateKPI(id, val) {
    const el=document.getElementById(id);
    if(el) el.textContent = val;
  }

  // KPIs Topo
  updateTopoKPIs() {
    const d=this.filteredTopoData;
    const totalChamps=d.reduce((s,x)=>s+(x.champs||0),0);
    const totalBatis=d.reduce((s,x)=>s+(x.batis||0),0);
    const total=d.reduce((s,x)=>s+(x.totale_parcelles||0),0);
    const dates=[...new Set(d.map(x=>x.date))];
    const avg=dates.length?Math.round(total/dates.length):0;
    this.updateKPI('totalChampsKPI', totalChamps);
    this.updateKPI('totalBatisKPI', totalBatis);
    this.updateKPI('totalTopoParcellesKPI', total);
    this.updateKPI('avgParJourKPI', avg);
    // topographe most active
    const counts = {};
    d.forEach(x=>{
      const name=`${x.prenom} ${x.nom}`;
      counts[name]=(counts[name]||0)+(x.totale_parcelles||0);
    });
    const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    this.updateKPI('topTopoKPI', top?`${top[0]} (${top[1]})`:'-');
    this.updateKPI('activeTopoKPI', Object.keys(counts).length);
  }

  // Création graphiques Topo
  createTopoCharts() {
    const stats=[...Object.entries(this.filteredTopoData.reduce((acc,x)=>{
      acc[x.prenom+' '+x.nom]=(acc[x.prenom+' '+x.nom]||0)+(x.totale_parcelles||0);
      return acc;
    },{}))].map(([name,total])=>({name,total})).sort((a,b)=>b.total-a.total).slice(0,10);
    window.chartManager.createBar('topToposChart', {
      labels: stats.map(x=>x.name),
      datasets:[{ data: stats.map(x=>x.total) }]
    });
    const communeStats=[...Object.entries(this.filteredTopoData.reduce((g,x)=>{
      (g[x.commune]||(g[x.commune]={champs:0,batis:0}))[x.champs? 'champs':'']+=x.champs||0;
      g[x.commune].batis+=x.batis||0;
      return g;
    },{}))].map(([name,s])=>({name, champs:s.champs, batis:s.batis}));
    window.chartManager.createStackedBar('topoCommuneChart', {
      labels: communeStats.map(x=>x.name),
      datasets:[
        { data: communeStats.map(x=>x.champs) },
        { data: communeStats.map(x=>x.batis) }
      ]
    });
    const monthly=[...Object.entries(this.filteredTopoData.reduce((m,x)=>{
      const mKey=x.date.slice(0,7);
      (m[mKey]||(m[mKey]={champs:0,batis:0})).champs+=x.champs||0;
      m[mKey].batis+=x.batis||0;
      return m;
    },{}))].map(([month,s])=>({month, champs:s.champs, batis:s.batis}))
      .sort((a,b)=>a.month.localeCompare(b.month));
    window.chartManager.createLine('topoEvolutionChart', {
      labels: monthly.map(x=>x.month),
      datasets:[
        { label:'Champs', data:monthly.map(x=>x.champs) },
        { label:'Bâtis', data:monthly.map(x=>x.batis) }
      ]
    });
    window.chartManager.createTopoTypeDonutChart('topoTypeDonut', {
      champs: monthly.reduce((s,x)=>s+x.champs,0),
      batis: monthly.reduce((s,x)=>s+x.batis,0)
    });
  }

  // Utilitaires
  showLoading() { document.getElementById('loading')?.classList.remove('hidden'); }
  hideLoading() { document.getElementById('loading')?.classList.add('hidden'); }
  handleResize() {
    this.mapManager?.resize();
    window.chartManager?.resize();
  }
  destroyAllCharts() {
    window.chartManager?.destroyAll();
  }

  // Sidebar toggle (exemple basique)
  toggleSidebar() {
    document.querySelector('.sidebar')?.classList.toggle('collapsed');
  }

  // Exports (PapaParse)
  exportTopoData() {
    const csv = Papa.unparse(this.filteredTopoData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'topo_data.csv'; a.click();
    URL.revokeObjectURL(url);
  }
  exportParcellesData() {
    const csv = Papa.unparse(this.data.parcelles);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'parcelles.csv'; a.click();
    URL.revokeObjectURL(url);
  }
  exportPostData() {
    // idem pour post-traitées
    const data = this.dataLoader.getFallbackData('data/Parcelles_post_traites_par_geom.json');
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'post_traitees.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialisation à DOM ready
document.addEventListener('DOMContentLoaded', () => new ProcasefDashboard());
