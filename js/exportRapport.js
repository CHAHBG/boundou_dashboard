// Constantes globales pour une meilleure maintenabilité
const COLORS = {
  PRIMARY: [30, 58, 138], // Bleu principal
  SECONDARY: [212, 165, 116], // Orange doux
  SUCCESS: [5, 150, 105], // Vert
  WARNING: [245, 158, 11], // Jaune
  DANGER: [220, 38, 38], // Rouge
  NEUTRAL: [100, 100, 100], // Gris
  BACKGROUND: [248, 250, 252], // Fond clair
};

const MARGINS = {
  DEFAULT: 30,
  TABLE: 20,
  TEXT: 15,
};

const FONT_SIZES = {
  TITLE: 18,
  SUBTITLE: 14,
  BODY: 10,
  SMALL: 8,
};

/**
 * Version optimisée de l'exportation PDF du rapport genre
 * @returns {Promise<void>}
 */
async function exportGenreReport() {
  try {
    // Vérification des dépendances
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('Bibliothèque jsPDF non chargée');
    }

    // Charger les données si nécessaire
    if (!this.data?.rapportComplet || !Object.keys(this.data.rapportComplet).length) {
      try {
        await this.loadDataSafely('data/rapport_complet.json', 'rapportComplet');
      } catch (error) {
        console.warn('Impossible de charger rapport_complet.json, utilisation des données existantes');
      }
    }

    const reportData = this.data?.rapportComplet || {};
    console.log('Données du rapport:', reportData);

    // Configurations des graphiques
    const chartConfigs = [
      { id: 'rapportSourceChart', title: 'Détail par Source', section: 'Détail par Source' },
      { id: 'rapportCommuneMixedChart', title: 'Analyse par Commune', section: 'Analyse par Commune' },
      { id: 'rapportTemporalChart', title: 'Évolution Temporelle', section: 'Analyse Temporelle' },
      { id: 'rapportRegionPolarChart', title: 'Répartition par Région', section: 'Tamba-Kédougou' },
    ];

    // Capture des graphiques
    const chartImages = [];
    for (const config of chartConfigs) {
      const canvas = document.getElementById(config.id);
      if (canvas?.tagName === 'CANVAS') {
        await new Promise(resolve => setTimeout(resolve, 800)); // Attendre le rendu
        const scale = 3;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width * scale;
        tempCanvas.height = canvas.height * scale;
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
            originalWidth: canvas.width,
            originalHeight: canvas.height,
          });
          console.log(`✅ Graphique capturé: ${config.id}`);
        } else {
          console.warn(`⚠️ Échec capture: ${config.id}`);
        }
      } else {
        console.warn(`⚠️ Canvas non trouvé: ${config.id}`);
      }
    }

    // Création du PDF
    const doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = MARGINS.DEFAULT;
    const contentWidth = pageWidth - 2 * margin;

    // Fonction de formatage des nombres
    const formatNumber = (value) => {
      if (value == null) return '0';
      const strValue = String(value)
        .replace(/\s*\/\s*/g, '') // Supprimer les /
        .replace(/[^\d\s,-]/g, '') // Garder chiffres, espaces, virgules, tirets
        .replace(/\s+/g, ' ') // Normaliser espaces
        .trim();
      const numValue = parseFloat(strValue.replace(/\s/g, '').replace(',', '.'));
      return isNaN(numValue) ? strValue : numValue.toLocaleString('fr-FR');
    };

    // Nettoyage des données
    const cleanDataObject = (obj) => {
      if (Array.isArray(obj)) return obj.map(cleanDataObject);
      if (obj && typeof obj === 'object') {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          cleaned[key] = typeof value === 'string'
            ? value
                .replace(/\s*\/\s*/g, '') // Supprimer les /
                .replace(/[Ø=ÜÉ]/g, '') // Supprimer caractères bizarres
                .replace(/\s+/g, ' ')
                .trim()
            : typeof value === 'object'
            ? cleanDataObject(value)
            : value;
        }
        return cleaned;
      }
      return obj;
    };

    const cleanedReportData = cleanDataObject(reportData);

    // Page de couverture
    this.createCoverPage(doc, pageWidth, pageHeight, margin);

    // Page de synthèse
    doc.addPage();
    let currentY = this.createSynthesisPage(doc, cleanedReportData, pageWidth, pageHeight, margin, formatNumber);

    // Ajout des graphiques
    for (const chartData of chartImages) {
      doc.addPage();
      currentY = 50;

      doc.setFillColor(...COLORS.PRIMARY);
      doc.rect(margin, currentY - 10, contentWidth, 35, 'F');
      doc.setFontSize(FONT_SIZES.TITLE);
      doc.setTextColor(255, 255, 255);
      doc.text(chartData.title, margin + MARGINS.TEXT, currentY + 15);
      currentY += 50;

      const maxGraphWidth = contentWidth * 0.85;
      const maxGraphHeight = 280;
      let graphWidth = Math.min(maxGraphWidth, chartData.originalWidth * 0.8);
      let graphHeight = (graphWidth / chartData.originalWidth) * chartData.originalHeight;
      if (graphHeight > maxGraphHeight) {
        graphHeight = maxGraphHeight;
        graphWidth = (graphHeight / chartData.originalHeight) * chartData.originalWidth;
      }

      const graphX = (pageWidth - graphWidth) / 2;
      doc.setDrawColor(...COLORS.NEUTRAL);
      doc.setLineWidth(1);
      doc.rect(graphX - 5, currentY - 5, graphWidth + 10, graphHeight + 10);
      doc.addImage(chartData.image, 'PNG', graphX, currentY, graphWidth, graphHeight);
      currentY += graphHeight + 25;

      const tableData = this.getEnhancedTableDataForChart(chartData.section, cleanedReportData, formatNumber);
      if (tableData.length > 1) {
        doc.autoTable({
          head: [tableData[0]],
          body: tableData.slice(1),
          startY: currentY,
          margin: { left: margin, right: margin },
          headStyles: {
            fillColor: COLORS.SECONDARY,
            textColor: [255, 255, 255],
            fontSize: FONT_SIZES.BODY,
            halign: 'center',
            fontStyle: 'bold',
          },
          styles: {
            fontSize: FONT_SIZES.BODY,
            cellPadding: 8,
            lineColor: COLORS.NEUTRAL,
            lineWidth: 0.5,
            overflow: 'linebreak',
          },
          alternateRowStyles: { fillColor: COLORS.BACKGROUND },
          columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
        });
        currentY = doc.lastAutoTable.finalY + 30;
      }

      this.addSectionAnalysis(doc, chartData.section, cleanedReportData, currentY, margin, contentWidth, formatNumber);
    }

    // Page de recommandations
    doc.addPage();
    this.createRecommendationsPage(doc, cleanedReportData, pageWidth, pageHeight, margin, formatNumber);

    // Pieds de page
    this.addAdvancedFooters(doc, pageWidth, pageHeight, margin);

    // Sauvegarde
    const fileName = `Rapport_Genre_PROCASEF_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    alert(`🎉 Rapport généré avec succès !\n\n📈 ${chartImages.length} graphiques inclus\n💾 Fichier: ${fileName}`);

  } catch (err) {
    console.error('❌ Erreur export PDF:', err);
    let errorMsg = 'Échec de la génération du rapport PDF.\n\n';
    if (err.message.includes('jsPDF')) {
      errorMsg += '❌ Bibliothèque jsPDF non trouvée.\nAssurez-vous que jsPDF est chargé.';
    } else if (err.message.includes('Canvas')) {
      errorMsg += '❌ Impossible de capturer les graphiques.\nVérifiez que les graphiques sont affichés.';
    } else {
      errorMsg += `Erreur: ${err.message}\nVérifiez la console pour plus de détails.`;
    }
    alert(errorMsg);
  }
}

/**
 * Version optimisée de l'exportation Word
 * @returns {Promise<void>}
 */
async function exportGenreWordReport() {
  try {
    if (!window.docx) {
      throw new Error('Bibliothèque docx non chargée');
    }

    await this.ensureGenreDataLoaded();
    const reportData = this.data?.rapportComplet || {};

    const formatNumber = (value) => {
      if (value == null) return '0';
      const strValue = String(value)
        .replace(/\s*\/\s*/g, '')
        .replace(/[^\d\s,-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const numValue = parseFloat(strValue.replace(/\s/g, '').replace(',', '.'));
      return isNaN(numValue) ? strValue : numValue.toLocaleString('fr-FR');
    };

    const cleanDataObject = (obj) => {
      if (Array.isArray(obj)) return obj.map(cleanDataObject);
      if (obj && typeof obj === 'object') {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          cleaned[key] = typeof value === 'string'
            ? value.replace(/\s*\/\s*/g, '').replace(/[Ø=ÜÉ]/g, '').replace(/\s+/g, ' ').trim()
            : typeof value === 'object'
            ? cleanDataObject(value)
            : value;
        }
        return cleaned;
      }
      return obj;
    };

    const cleanedReportData = cleanDataObject(reportData);

    const doc = new window.docx.Document({
      creator: 'PROCASEF Dashboard',
      title: 'Rapport Genre - PROCASEF Boundou',
      description: 'Analyse de la répartition genre dans le programme PROCASEF',
      styles: {
        paragraphStyles: [
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 28, bold: true, color: COLORS.PRIMARY.map(c => c.toString(16).padStart(2, '0')).join('') },
            paragraph: { spacing: { after: 300 } },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 20, bold: true, color: COLORS.SECONDARY.map(c => c.toString(16).padStart(2, '0')).join('') },
            paragraph: { spacing: { before: 240, after: 120 } },
          },
        ],
      },
      sections: [{
        properties: {},
        children: [
          new window.docx.Paragraph({
            alignment: window.docx.AlignmentType.CENTER,
            children: [new window.docx.TextRun({ text: 'RAPPORT GENRE', bold: true, size: 32, color: COLORS.PRIMARY.map(c => c.toString(16).padStart(2, '0')).join('') })],
          }),
          new window.docx.Paragraph({
            alignment: window.docx.AlignmentType.CENTER,
            children: [new window.docx.TextRun({ text: 'PROCASEF Boundou', size: 24, color: COLORS.SECONDARY.map(c => c.toString(16).padStart(2, '0')).join('') })],
          }),
          new window.docx.Paragraph({
            alignment: window.docx.AlignmentType.CENTER,
            children: [new window.docx.TextRun({ text: `Généré le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, size: 16, italics: true })],
          }),
          new window.docx.Paragraph({ children: [new window.docx.PageBreak()] }),
          new window.docx.Paragraph({ style: 'Heading1', children: [new window.docx.TextRun({ text: '📊 SYNTHÈSE EXÉCUTIVE' })] }),
          ...this.createWordStatsTable(cleanedReportData, formatNumber),
          new window.docx.Paragraph({ style: 'Heading2', children: [new window.docx.TextRun({ text: '🔍 ANALYSE AUTOMATIQUE' })] }),
          new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: this.generateWordAnalysis(cleanedReportData) })] }),
          ...this.createWordSectionContent(cleanedReportData, formatNumber),
          new window.docx.Paragraph({ children: [new window.docx.PageBreak()] }),
          new window.docx.Paragraph({ style: 'Heading1', children: [new window.docx.TextRun({ text: '🎯 RECOMMANDATIONS STRATÉGIQUES' })] }),
          ...this.createWordRecommendations(cleanedReportData),
        ],
      }],
    });

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
    console.error('❌ Erreur export Word:', err);
    let errorMsg = 'Erreur lors de la génération du rapport Word.\n\n';
    if (err.message.includes('docx')) {
      errorMsg += '❌ Bibliothèque docx non trouvée.\nAssurez-vous que la bibliothèque docx est chargée.';
    } else {
      errorMsg += `Erreur: ${err.message}\nVérifiez la console pour plus de détails.`;
    }
    alert(errorMsg);
  }
}

/**
 * Crée une page de couverture moderne
 * @param {Object} doc - Instance jsPDF
 * @param {number} pageWidth - Largeur de la page
 * @param {number} pageHeight - Hauteur de la page
 * @param {number} margin - Marge
 */
function createCoverPage(doc, pageWidth, pageHeight, margin) {
  const gradientSteps = 50;
  for (let i = 0; i < gradientSteps; i++) {
    const alpha = i / gradientSteps;
    const blue = Math.round(30 + (200 - 30) * alpha);
    doc.setFillColor(blue, blue + 20, 138 + alpha * 100);
    doc.rect(0, i * (pageHeight / gradientSteps), pageWidth, pageHeight / gradientSteps, 'F');
  }

  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  const mainTitle = 'RAPPORT GENRE';
  const mainTitleWidth = doc.getTextWidth(mainTitle);
  doc.text(mainTitle, (pageWidth - mainTitleWidth) / 2, 200);

  doc.setFontSize(20);
  const subTitle = 'PROCASEF Boundou';
  const subTitleWidth = doc.getTextWidth(subTitle);
  doc.text(subTitle, (pageWidth - subTitleWidth) / 2, 240);

  doc.setFontSize(14);
  const dateText = `Généré le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, (pageWidth - dateWidth) / 2, 400);

  doc.setFontSize(12);
  doc.setTextColor(220, 220, 220);
  const versionText = 'Version 2.0 - Analyse Avancée';
  const versionWidth = doc.getTextWidth(versionText);
  doc.text(versionText, (pageWidth - versionWidth) / 2, pageHeight - 60);
}

/**
 * Crée la page de synthèse avec KPIs
 * @param {Object} doc - Instance jsPDF
 * @param {Object} reportData - Données nettoyées
 * @param {number} pageWidth - Largeur de la page
 * @param {number} pageHeight - Hauteur de la page
 * @param {number} margin - Marge
 * @param {Function} formatNumber - Fonction de formatage
 * @returns {number} Position Y finale
 */
function createSynthesisPage(doc, reportData, pageWidth, pageHeight, margin, formatNumber) {
  let currentY = 50;

  doc.setFillColor(...COLORS.SECONDARY);
  doc.rect(margin, currentY - 10, pageWidth - 2 * margin, 35, 'F');
  doc.setFontSize(FONT_SIZES.TITLE);
  doc.setTextColor(255, 255, 255);
  doc.text('📊 SYNTHÈSE EXÉCUTIVE', margin + MARGINS.TEXT, currentY + 15);
  currentY += 60;

  const globalStats = reportData['Synthèse Globale'] || [];
  const hommes = Number(globalStats.find(item => item.indicateur === 'Hommes')?.valeur) || 43576;
  const femmes = Number(globalStats.find(item => item.indicateur === 'Femmes')?.valeur) || 9332;
  const total = hommes + femmes;
  const femmesPourcentage = ((femmes / total) * 100).toFixed(1);

  this.createKPICard(doc, margin, currentY, 'TOTAL BÉNÉFICIAIRES', formatNumber(total), COLORS.PRIMARY);
  this.createKPICard(doc, margin + 180, currentY, 'FEMMES', formatNumber(femmes), COLORS.DANGER);
  this.createKPICard(doc, margin + 360, currentY, '% FEMMES', `${femmesPourcentage}%`, COLORS.SUCCESS);
  currentY += 100;

  doc.setFontSize(FONT_SIZES.SUBTITLE);
  doc.setTextColor(...COLORS.PRIMARY);
  doc.text('🔍 ANALYSE AUTOMATIQUE', margin, currentY);
  currentY += 25;

  doc.setFontSize(FONT_SIZES.BODY);
  doc.setTextColor(0, 0, 0);
  const analysis = this.generateGenderAnalysis(hommes, femmes, femmesPourcentage);
  const analysisLines = doc.splitTextToSize(analysis, pageWidth - 2 * margin);
  doc.text(analysisLines, margin, currentY);
  currentY += analysisLines.length * 15 + 20;

  return currentY;
}

/**
 * Crée une carte KPI
 * @param {Object} doc - Instance jsPDF
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {string} title - Titre de la carte
 * @param {string} value - Valeur à afficher
 * @param {number[]} color - Couleur RGB
 */
function createKPICard(doc, x, y, title, value, color) {
  doc.setFillColor(...COLORS.BACKGROUND);
  doc.roundedRect(x, y, 160, 80, 5, 5, 'F');
  doc.setDrawColor(...color);
  doc.setLineWidth(3);
  doc.line(x, y, x + 160, y);
  doc.setFontSize(FONT_SIZES.BODY);
  doc.setTextColor(...COLORS.NEUTRAL);
  doc.text(title, x + 10, y + 20);
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(value, x + 10, y + 50);
}

/**
 * Génère l'analyse pour le document Word
 * @param {Object} reportData - Données nettoyées
 * @returns {string} Analyse textuelle
 */
function generateWordAnalysis(reportData) {
  const globalStats = reportData['Synthèse Globale'] || [];
  const femmes = Number(globalStats.find(item => item.indicateur === 'Femmes')?.valeur) || 9332;
  const total = Number(globalStats.find(item => item.indicateur === 'Total Personnes')?.valeur) || 52908;
  const femmesPourcentage = ((femmes / total) * 100).toFixed(1);

  if (femmesPourcentage < 20) {
    return `⚠️ ALERTE : Représentation féminine critiquement faible (${femmesPourcentage}%). Action corrective urgente requise.`;
  } else if (femmesPourcentage < 30) {
    return `📉 Représentation féminine insuffisante (${femmesPourcentage}%). Efforts supplémentaires nécessaires.`;
  } else if (femmesPourcentage < 40) {
    return `📈 Progrès encourageants (${femmesPourcentage}%). Continuez vers la parité 40-60%.`;
  }
  return `✅ Excellent : Représentation féminine (${femmesPourcentage}%) conforme aux standards de parité.`;
}

/**
 * Crée les statistiques globales pour Word
 * @param {Object} reportData - Données nettoyées
 * @param {Function} formatNumber - Fonction de formatage
 * @returns {Object[]} Éléments du document
 */
function createWordStatsTable(reportData, formatNumber) {
  const globalStats = reportData['Synthèse Globale'] || [];
  const hommes = Number(globalStats.find(item => item.indicateur === 'Hommes')?.valeur) || 43576;
  const femmes = Number(globalStats.find(item => item.indicateur === 'Femmes')?.valeur) || 9332;
  const total = hommes + femmes;
  const femmesPourcentage = ((femmes / total) * 100).toFixed(1);

  return [
    new window.docx.Table({
      rows: [
        new window.docx.TableRow({
          children: [
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: 'Indicateur', bold: true })] })] }),
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: 'Valeur', bold: true })] })] }),
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: 'Pourcentage', bold: true })] })] }),
          ],
        }),
        new window.docx.TableRow({
          children: [
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: 'Hommes' })] })] }),
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: formatNumber(hommes) })] })] }),
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: `${(100 - parseFloat(femmesPourcentage)).toFixed(1)}%` })] })] }),
          ],
        }),
        new window.docx.TableRow({
          children: [
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: 'Femmes' })] })] }),
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: formatNumber(femmes) })] })] }),
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: `${femmesPourcentage}%` })] })] }),
          ],
        }),
        new window.docx.TableRow({
          children: [
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: 'Total', bold: true })] })] }),
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: formatNumber(total), bold: true })] })] }),
            new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: '100%', bold: true })] })] }),
          ],
        }),
      ],
    }),
    new window.docx.Paragraph({ text: '' }),
  ];
}

/**
 * Crée le contenu des sections pour Word
 * @param {Object} reportData - Données nettoyées
 * @param {Function} formatNumber - Fonction de formatage
 * @returns {Object[]} Éléments du document
 */
function createWordSectionContent(reportData, formatNumber) {
  const content = [
    new window.docx.Paragraph({ children: [new window.docx.PageBreak()] }),
    new window.docx.Paragraph({ style: 'Heading1', children: [new window.docx.TextRun({ text: '📊 DÉTAIL PAR SOURCE' })] }),
  ];

  const sourceData = reportData['Détail par Source'] || [];
  if (sourceData.length) {
    content.push(
      new window.docx.Table({
        rows: [
          new window.docx.TableRow({
            children: [
              new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: 'Source/Genre', bold: true })] })] }),
              new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: 'Bénéficiaires', bold: true })] })] }),
              new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: 'Pourcentage', bold: true })] })] }),
            ],
          }),
          ...sourceData.flatMap(item => [
            new window.docx.TableRow({
              children: [
                new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: `${item.source} - Hommes` })] })] }),
                new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: formatNumber(item.hommes) })] })] }),
                new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: `${(item.hommes_1 || 0).toFixed(1)}%` })] })] }),
              ],
            }),
            new window.docx.TableRow({
              children: [
                new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: `${item.source} - Femmes` })] })] }),
                new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: formatNumber(item.femmes) })] })] }),
                new window.docx.TableCell({ children: [new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: `${(item.femmes_1 || 0).toFixed(1)}%` })] })] }),
              ],
            }),
          ]),
        ],
      })
    );
  }

  return content;
}

/**
 * Crée les recommandations pour Word
 * @param {Object} reportData - Données nettoyées
 * @returns {Object[]} Éléments du document
 */
function createWordRecommendations(reportData) {
  const recommendations = this.generateStrategicRecommendations(reportData);
  return recommendations.flatMap((rec, index) => [
    new window.docx.Paragraph({
      style: 'Heading2',
      children: [new window.docx.TextRun({ text: `${index + 1}. ${rec.title}` })],
    }),
    new window.docx.Paragraph({ children: [new window.docx.TextRun({ text: rec.description })] }),
    new window.docx.Paragraph({ text: '' }),
  ]);
}

/**
 * Génère une analyse automatique du ratio genre
 * @param {number} hommes - Nombre d'hommes
 * @param {number} femmes - Nombre de femmes
 * @param {string} femmesPourcentage - Pourcentage de femmes
 * @returns {string} Analyse textuelle
 */
function generateGenderAnalysis(hommes, femmes, femmesPourcentage) {
  const pourcentage = parseFloat(femmesPourcentage) || 0;
  if (pourcentage < 20) {
    return `⚠️ ALERTE : Représentation féminine critiquement faible (${pourcentage.toFixed(1)}%). Action corrective urgente requise.`;
  } else if (pourcentage < 30) {
    return `📉 Représentation féminine insuffisante (${pourcentage.toFixed(1)}%). Efforts supplémentaires nécessaires.`;
  } else if (pourcentage < 40) {
    return `📈 Progrès encourageants (${pourcentage.toFixed(1)}%). Continuez vers la parité 40-60%.`;
  }
  return `✅ Excellent : Représentation féminine (${pourcentage.toFixed(1)}%) conforme aux standards de parité.`;
}

/**
 * Ajoute une analyse spécifique à chaque section
 * @param {Object} doc - Instance jsPDF
 * @param {string} section - Nom de la section
 * @param {Object} reportData - Données nettoyées
 * @param {number} startY - Position Y de départ
 * @param {number} margin - Marge
 * @param {number} contentWidth - Largeur du contenu
 * @param {Function} formatNumber - Fonction de formatage
 */
function addSectionAnalysis(doc, section, reportData, startY, margin, contentWidth, formatNumber) {
  doc.setFillColor(...COLORS.BACKGROUND);
  doc.rect(margin, startY, contentWidth, 2, 'F');
  doc.setFontSize(FONT_SIZES.SUBTITLE);
  doc.setTextColor(...COLORS.PRIMARY);
  doc.text('💡 ANALYSE & INSIGHTS', margin, startY + 25);
  doc.setFontSize(FONT_SIZES.BODY);
  doc.setTextColor(0, 0, 0);
  const analysis = this.generateSectionAnalysis(section, reportData);
  const analysisLines = doc.splitTextToSize(analysis, contentWidth - 20);
  doc.text(analysisLines, margin + 10, startY + 45);
}

/**
 * Génère une analyse spécifique par section
 * @param {string} section - Nom de la section
 * @param {Object} reportData - Données nettoyées
 * @returns {string} Analyse textuelle
 */
function generateSectionAnalysis(section, reportData) {
  switch (section) {
    case 'Détail par Source': {
      const sourceData = reportData['Détail par Source'] || [];
      if (sourceData.length) {
        const individuels = sourceData.find(s => s.source === 'Individuel');
        const collectifs = sourceData.find(s => s.source === 'Collectif');
        if (individuels && collectifs) {
          const indivFemmes = individuels.femmes_1 || 0;
          const collFemmes = collectifs.femmes_1 || 0;
          return indivemploi > collFemmes
            ? `Projets individuels plus inclusifs (${indivFemmes.toFixed(1)}%) que collectifs (${collFemmes.toFixed(1)}%). Promouvoir les approches individuelles.`
            : `Projets collectifs plus inclusifs (${collFemmes.toFixed(1)}%) que individuels (${indivFemmes.toFixed(1)}%). Renforcer les initiatives collectives.`;
        }
      }
      return 'Analyse des sources pour identifier les mécanismes inclusifs.';
    }
    case 'Analyse par Commune': {
      const communeData = reportData['Analyse par Commune'] || [];
      if (communeData.length) {
        const sorted = communeData.sort((a, b) => (b.femme_pourcentage || 0) - (a.femme_pourcentage || 0));
        const meilleure = sorted[0];
        const moins_bonne = sorted[sorted.length - 1];
        return `Meilleure inclusion à ${meilleure.communesenegal || meilleure.commune} (${(meilleure.femme_pourcentage || 0).toFixed(1)}%), faible à ${moins_bonne.communesenegal || moins_bonne.commune} (${(moins_bonne.femme_pourcentage || 0).toFixed(1)}%). Répliquer les bonnes pratiques.`;
      }
      return 'Analyse comparative des performances genre par commune.';
    }
    case 'Analyse Temporelle': {
      const temporalData = reportData['Analyse Temporelle'] || [];
      if (temporalData.length >= 2) {
        const recent = temporalData[temporalData.length - 1];
        const precedent = temporalData[temporalData.length - 2];
        const evolution = (recent.femme_pourcentage || 0) - (precedent.femme_pourcentage || 0);
        if (evolution > 0) {
          return `Tendance positive : +${evolution.toFixed(1)}% entre ${precedent.periode} et ${recent.periode}. Maintenir la progression.`;
        } else if (evolution < 0) {
          return `Tendance préoccupante : ${evolution.toFixed(1)}% entre ${precedent.periode} et ${recent.periode}. Actions correctives nécessaires.`;
        }
        return `Stabilité entre ${precedent.periode} et ${recent.periode}. Explorer de nouvelles stratégies.`;
      }
      return 'Suivi de l\'évolution temporelle de la participation genre.';
    }
    case 'Tamba-Kédougou': {
      const regionData = reportData['Tamba-Kédougou'] || [];
      if (regionData.length >= 2) {
        const sorted = regionData.sort((a, b) => (b.femme_pourcentage || 0) - (a.femme_pourcentage || 0));
        const meilleure = sorted[0];
        const autre = sorted[1];
        return `${meilleure.region || meilleure.nom} surperforme (${(meilleure.femme_pourcentage || 0).toFixed(1)}%) vs ${autre.region || autre.nom} (${(autre.femme_pourcentage || 0).toFixed(1)}%). Analyser les facteurs de succès.`;
      }
      return 'Comparaison des performances genre par région.';
    }
    default:
      return 'Analyse des données pour améliorer l\'inclusion genre.';
  }
}

/**
 * Crée la page de recommandations
 * @param {Object} doc - Instance jsPDF
 * @param {Object} reportData - Données nettoyées
 * @param {number} pageWidth - Largeur de la page
 * @param {number} pageHeight - Hauteur de la page
 * @param {number} margin - Marge
 * @param {Function} formatNumber - Fonction de formatage
 */
function createRecommendationsPage(doc, reportData, pageWidth, pageHeight, margin, formatNumber) {
  let currentY = 50;

  doc.setFillColor(...COLORS.PRIMARY);
  doc.rect(margin, currentY - 10, pageWidth - 2 * margin, 35, 'F');
  doc.setFontSize(FONT_SIZES.TITLE);
  doc.setTextColor(255, 255, 255);
  doc.text('🎯 RECOMMANDATIONS STRATÉGIQUES', margin + MARGINS_TEXT, currentY + 15);
  currentY += 60;

  const recommendations = this.generateStrategicRecommendations(reportData);
  recommendations.forEach((rec, index) => {
    if (currentY > pageHeight - 150) {
      doc.addPage();
      currentY = 50;
    }

    doc.setFillColor(...COLORS.SECONDARY);
    doc.circle(margin + 10, currentY + 5, 8, 'F');
    doc.setFontSize(FONT_SIZES.BODY);
    doc.setTextColor(255, 255, 255);
    doc.text((index + 1).toString(), margin + 7, currentY + 8);
    doc.setFontSize(FONT_SIZES.SUBTITLE);
    doc.setTextColor(...COLORS.PRIMARY);
    doc.text(rec.title, margin + 30, currentY + 8);
    currentY += 20;

    doc.setFontSize(FONT_SIZES.BODY);
    doc.setTextColor(0, 0, 0);
    const descLines = doc.splitTextToSize(rec.description, pageWidth - 2 * margin - 40);
    doc.text(descLines, margin + 30, currentY);
    currentY += descLines.length * 12 + 20;
  });
}

/**
 * Génère des recommandations stratégiques
 * @param {Object} reportData - Données nettoyées
 * @returns {Object[]} Liste des recommandations
 */
function generateStrategicRecommendations(reportData) {
  const recommendations = [];
  const globalStats = reportData['Synthèse Globale'] || [];
  const femmes = Number(globalStats.find(item => item.indicateur === 'Femmes')?.valeur) || 9332;
  const total = Number(globalStats.find(item => item.indicateur === 'Total Personnes')?.valeur) || 52908;
  const femmesPourcentage = (femmes / total) * 100;

  if (femmesPourcentage < 25) {
    recommendations.push({
      title: 'Renforcement massif de l\'inclusion féminine',
      description: 'Mettre en place des quotas temporaires de 30% minimum pour les femmes, créer des mécanismes de financement dédiés, et renforcer la sensibilisation communautaire.',
    });
  }

  if (reportData['Détail par Source']?.length) {
    recommendations.push({
      title: 'Optimisation des mécanismes de financement',
      description: 'Développer des produits financiers adaptés aux femmes (microcrédit, tontines améliorées). Former les agents de terrain sur l\'approche genre.',
    });
  }

  if (reportData['Analyse Temporelle']?.length >= 2) {
    recommendations.push({
      title: 'Suivi et monitoring renforcé',
      description: 'Installer un suivi mensuel des indicateurs genre avec alertes automatiques. Organiser des revues trimestrielles pour ajuster les stratégies.',
    });
  }

  recommendations.push({
    title: 'Approche différenciée par commune',
    description: 'Adapter les interventions aux spécificités culturelles et économiques des communes. Former des ambassadrices genre locales.',
  });

  recommendations.push({
    title: 'Renforcement des capacités institutionnelles',
    description: 'Former les acteurs du projet sur l\'approche genre. Intégrer l\'analyse genre dans les processus de décision et développer des partenariats avec les organisations de femmes.',
  });

  return recommendations;
}

/**
 * Améliore les données de tableau
 * @param {string} section - Nom de la section
 * @param {Object} reportData - Données nettoyées
 * @param {Function} formatNumber - Fonction de formatage
 * @returns {string[][]} Données du tableau
 */
function getEnhancedTableDataForChart(section, reportData, formatNumber) {
  switch (section) {
    case 'Détail par Source': {
      const sourceData = reportData['Détail par Source'] || [];
      if (!sourceData.length) {
        return [['Source/Genre', 'Nombre', 'Pourcentage'], ['Aucune donnée', '0', '0%']];
      }
      let table = [['Source/Genre', 'Bénéficiaires', 'Pourcentage']];
      sourceData.forEach(item => {
        table.push([
          `${item.source} - Hommes`,
          formatNumber(item.hommes),
          `${(item.hommes_1 || 0).toFixed(1)}%`
        ]);
        table.push([
          `${item.source} - Femmes`,
          formatNumber(item.femmes),
          `${(item.femmes_1 || 0).toFixed(1)}%` // Corrigé de toFixed(2) à toFixed(1) pour cohérence
        ]);
      });
      return table;
    }
    case 'Analyse par Commune': {
      const communeData = reportData['Analyse par Commune'] || [];
      if (!communeData.length) {
        return [['Commune', 'Population', '% Femmes'], ['Aucune donnée', '0', '0%']];
      }
      let table = [['Commune', 'Population Totale', '% Femmes', 'Rang Genre']];
      const sortedCommunes = communeData
        .sort((a, b) => (b.femme_pourcentage || 0) - (a.femme_pourcentage || 0))
        .slice(0, 10); // Corrigé de slice(1, 10) à slice(0, 10) pour inclure le premier élément
      sortedCommunes.forEach((item, index) => {
        const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`;
        table.push([
          item.communesenegal || item.commune || 'N/A',
          formatNumber(item.total),
          `${(item.femme_pourcentage || 0).toFixed(1)}%`,
          emoji
        ]);
      });
      return table;
    }
    case 'Analyse Temporelle': {
      const temporalData = reportData['Analyse Temporelle'] || [];
      if (!temporalData.length) {
        return [['Période', 'Hommes', 'Femmes', 'Évolution'], ['Aucune donnée', '0', '0', '-']];
      }
      let table = [['Période', 'Hommes', 'Femmes', '% Femmes', 'Tendance']];
      temporalData.forEach((item, index) => {
        let tendance = '-';
        if (index > 0) {
          const prev = temporalData[index - 1].femme_pourcentage || 0;
          const curr = item.femme_pourcentage || 0;
          tendance = curr > prev
            ? `📈 +${(curr - prev).toFixed(1)}`
            : curr < prev
            ? `📉 ${(curr - prev).toFixed(1)}`
            : '➡️ =';
        }
        table.push([
          item.periode || 'N/A',
          formatNumber(item.homme),
          formatNumber(item.femme),
          `${(item.femme_pourcentage || 0).toFixed(1)}%`,
          tendance
        ]);
      });
      return table;
    }
    case 'Tamba-Kédougou': {
      const regionData = reportData['Tamba-Kédougou'] || [];
      if (!regionData.length) {
        return [['Région', 'Population', '% Femmes'], ['Aucune donnée', '0', '0%']];
      }
      let table = [['Région', 'Population Totale', '% Femmes', 'Évaluation']];
      regionData.forEach(item => {
        const pourcentage = item.femme_pourcentage || 0;
        const evaluation = pourcentage >= 40
          ? '🟢 Excellent'
          : pourcentage >= 25
          ? '🟡 Moyen'
          : pourcentage >= 15
          ? '🟠 Faible'
          : '🔴 Critique';
        table.push([
          item.region || item.nom || 'N/A',
          formatNumber(item.total),
          `${pourcentage.toFixed(1)}%`,
          evaluation
        ]);
      });
      return table;
    }
    default: {
      return [['Indicateur', 'Valeur'], ['Aucune donnée disponible', '-']];
    }
  }
}

  /**
   * Ajoute des pieds de page modernes
   * @param {Object} doc - Instance jsPDF
   * @param {number} pageWidth - Largeur de la page
   * @param {number} pageHeight - Hauteur de la page
   * @param {number} margin - Marge
   */
  function addAdvancedFooters(doc, pageWidth, pageHeight, margin) {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(...COLORS.NEUTRAL);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
      doc.setFontSize(FONT_SIZES.SMALL);
      doc.setTextColor(...COLORS.NEUTRAL);
      doc.text('PROCASEF Dashboard - Rapport Genre Automatisé', margin, pageHeight - 25);
      const dateText = `Généré le ${new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
      const dateWidth = doc.getTextWidth(dateText);
      doc.text(dateText, (pageWidth - dateWidth) / 2, pageHeight - 25);
      const pageText = `${i}/${totalPages}`;
      const pageTextWidth = doc.getTextWidth(pageText);
      doc.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 25);
      doc.setFontSize(FONT_SIZES.SMALL - 1);
      const contactText = 'Contact : procasef@example.com | www.procasef.com';
      const contactWidth = doc.getTextWidth(contactText);
      doc.text(contactText, (pageWidth - contactWidth) / 2, pageHeight - 10);
    }
  }

  /**
   * Génère des alertes basées sur les seuils
   * @param {Object} reportData - Données nettoyées
   * @returns {Object[]} Liste des alertes
   */
  function generateAlerts(reportData) {
    const alerts = [];
    const globalStats = reportData['Synthèse Globale'] || [];
    const femmes = Number(globalStats.find(item => item.indicateur === 'Femmes')?.valeur) || 0;
    const total = Number(globalStats.find(item => item.indicateur === 'Total Personnes')?.valeur) || 1;
    const femmesPourcentage = (femmes / total) * 100;

    if (femmesPourcentage < 15) {
      alerts.push({
        level: 'CRITIQUE',
        icon: '🚨',
        message: 'Représentation féminine extrêmement faible - Action immédiate requise',
        color: COLORS.DANGER,
      });
    } else if (femmesPourcentage < 25) {
      alerts.push({
        level: 'ATTENTION',
        icon: '⚠️',
        message: 'Représentation féminine insuffisante - Renforcement nécessaire',
        color: COLORS.WARNING,
      });
    }

    const temporalData = reportData['Analyse Temporelle'] || [];
    if (temporalData.length >= 2) {
      const dernier = temporalData[temporalData.length - 1];
      const precedent = temporalData[temporalData.length - 2];
      if ((dernier.femme_pourcentage || 0) < (precedent.femme_pourcentage || 0)) {
        alerts.push({
          level: 'TENDANCE',
          icon: '📉',
          message: 'Régression de la participation féminine détectée',
          color: COLORS.DANGER,
        });
      }
    }

    return alerts;
  }

  /**
   * Ajoute une section d'alertes au rapport
   * @param {Object} doc - Instance jsPDF
   * @param {Object} reportData - Données nettoyées
   * @param {number} startY - Position Y
   * @param {number} margin - Marge
   * @param {number} contentWidth - Largeur du contenu
   * @returns {number} Nouvelle position Y
   */
  function addAlertsSection(doc, reportData, startY, margin, contentWidth) {
    const alerts = this.generateAlerts(reportData);

    if (!alerts.length) {
      doc.setFillColor(220, 252, 180);
      doc.rect(margin, startY, contentWidth, 40, 'F');
      doc.setFontSize(FONT_SIZES.BODY);
      doc.setTextColor(...COLORS.SUCCESS);
      doc.text('✅ AUCUNE ALERTE CRITIQUE DÉTÉCTÉE', margin + 10, startY + 25);
      return startY + 50;
    }

    let currentY = startY;
    for (const alert of alerts) {
      doc.setFillColor(alert.color[0], alert.color[1], alert.color[2], 0.2);
      doc.rect(margin, currentY, contentWidth, 35, 'F');
      doc.setFillColor(...alert.color);
      doc.rect(margin, currentY, 5, 35, 'F');
      doc.setFontSize(FONT_SIZES.BODY);
      doc.setTextColor(...alert.color);
      doc.text(`${alert.icon} ${alert.level}: ${alert.message}`, margin + 10, currentY + 22);
      currentY += 45;
    }

    return currentY + 10;
  }
