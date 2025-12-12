import jsPDF from 'jspdf';
import { TrainingElement } from '@/lib/vma';
import { convertBuilderElementsToSteps } from '@/lib/vma';

/**
 * Helper: Parse une durée string (ex: "1:30") en secondes
 */
function parseDurationString(input: string): number {
  if (!input) return 0;
  if (input.includes(':')) {
    const [min, sec] = input.split(':').map(Number);
    return (min || 0) * 60 + (sec || 0);
  }
  const val = parseFloat(input);
  if (!isNaN(val)) return val * 60; // Assume minutes par défaut
  return 0;
}

/**
 * Format cohérent : toujours "mm:ss" (ex: "00:45", "01:30", "10:00")
 */
function formatDurationFriendly(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);

  // Toujours retourner le format mm:ss
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format speed to Pace (MM'SS/km)
 */
function formatPace(speedKmh: number): string {
  if (!speedKmh || speedKmh <= 0) return "-";
  const secondsPerKm = 3600 / speedKmh;
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}'${secs.toString().padStart(2, '0')}/km`;
}

/**
 * Calculate target time for a step at a specific VMA
 */
function calculateTimeForVMA(
  distance: number,
  vmaMultiplier: number,
  vma: number
): string {
  const speed = vma * vmaMultiplier;
  if (speed <= 0) return "-";
  const timeInSeconds = (distance / 1000 / speed) * 3600;
  return formatDurationFriendly(timeInSeconds); // Utilisation du nouveau format
}

/**
 * Calculate target PACE for a step at a specific VMA
 */
function calculatePaceForVMA(
  vmaMultiplier: number,
  vma: number
): string {
  const speed = vma * vmaMultiplier;
  return formatPace(speed);
}

/**
 * Generate PDF and return both the doc and buffer
 */
function createPDFDocument(
  builderElements: TrainingElement[],
  programName: string = 'Programme VMA'
): { doc: jsPDF; buffer: ArrayBuffer } {
  // Create landscape PDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  
  // --- CONFIGURATION DES TAILLES FIXES ---
  const vmaColWidth = 12;
  const blockIndicatorWidth = 6; 
  const rowHeight = 6; 

  // Convert builder elements to steps
  const trainingSteps = convertBuilderElementsToSteps(builderElements);

  // VMA range: 12.0 to 23.0
  const vmaRange = [
    12.0, 13.0, 14.0, 15.0, 15.5, 16.0, 16.5, 17.0, 17.5,
    18.0, 18.5, 19.0, 19.5, 20.0, 20.5, 21.0, 21.5, 22.0, 22.5, 23.0
  ];

  let yPos = 20;

  // Build column structure
  interface ColumnInfo {
    type: 'vma' | 'block-indicator' | 'step';
    stepName?: string;
    headerLabel?: string; 
    rest?: string;
    blockReps?: number;
    stepIndex?: number;
  }

  const columns: ColumnInfo[] = [{ type: 'vma' }];

  builderElements.forEach((block) => {
    columns.push({
      type: 'block-indicator',
      blockReps: block.repetitions
    });

    block.steps.forEach((step) => {
      // Déterminer le label de l'entête (Distance ou Durée)
      let headerLabel = "";
      
      if (step.type === 'time') {
         // Si c'est une durée, on la formate joliment (ex: "10:00" -> "10min")
         const secs = parseDurationString(step.duration || "0");
         headerLabel = formatDurationFriendly(secs);
      } else {
         // Si distance
         headerLabel = step.distance >= 1000
          ? `${(step.distance / 1000).toFixed(1)}km`
          : `${step.distance}m`;
      }

      columns.push({
        type: 'step',
        stepName: step.name || 'STEP',
        headerLabel: headerLabel,
        rest: step.rest
      });
    });
  });

  // --- LOGIQUE DE "ZOOM" / REMPLISSAGE AUTOMATIQUE ---

  const numBlockIndicators = columns.filter(c => c.type === 'block-indicator').length;
  const numStepColumns = columns.filter(c => c.type === 'step').length;

  const availableWidth = pageWidth - (margin * 2);
  const fixedUsedWidth = vmaColWidth + (numBlockIndicators * blockIndicatorWidth);
  const remainingWidthForSteps = availableWidth - fixedUsedWidth;

  // Calcul de la largeur dynamique
  const dynamicStepWidth = remainingWidthForSteps / (numStepColumns || 1);
  
  // Limites pour la largeur
  const MIN_STEP_WIDTH = 10;
  const MAX_STEP_WIDTH = 45;

  const finalStepColWidth = Math.min(Math.max(dynamicStepWidth, MIN_STEP_WIDTH), MAX_STEP_WIDTH);

  // --- CALCUL DU ZOOM DE LA POLICE ---
  const widthRatio = finalStepColWidth / MIN_STEP_WIDTH;
  
  const BASE_FONT_SIZE_DATA = 7;
  const MAX_FONT_SIZE_DATA = 14; 
  
  const BASE_FONT_SIZE_HEADER = 6;
  const MAX_FONT_SIZE_HEADER = 10;

  const dynamicDataFontSize = Math.min(BASE_FONT_SIZE_DATA * (1 + (widthRatio - 1) * 0.6), MAX_FONT_SIZE_DATA);
  const dynamicHeaderFontSize = Math.min(BASE_FONT_SIZE_HEADER * (1 + (widthRatio - 1) * 0.5), MAX_FONT_SIZE_HEADER);

  // Recalcul de la largeur réelle finale du tableau pour le centrage
  const totalTableWidth = fixedUsedWidth + (numStepColumns * finalStepColWidth);
  const startX = (pageWidth - totalTableWidth) / 2;


  // --- DESSIN DU TABLEAU ---

  doc.setTextColor(0, 0, 0);

  // 1. HEADER
  let currentX = startX;

  columns.forEach((col) => {
    let colWidth = 0;

    if (col.type === 'vma') {
      colWidth = vmaColWidth;
      doc.setFillColor(240, 240, 240);
      doc.rect(currentX, yPos, colWidth, 12, 'FD');
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text('VMA', currentX + colWidth / 2, yPos + 6, { align: 'center', baseline: 'middle' });

    } else if (col.type === 'block-indicator') {
      colWidth = blockIndicatorWidth;
      doc.setFillColor(220, 220, 220);
      doc.rect(currentX, yPos, colWidth, 12, 'FD');
      
      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.text(`${col.blockReps}x`, currentX + colWidth / 2, yPos + 4, { align: 'center', baseline: 'middle' });
      doc.text('==>', currentX + colWidth / 2, yPos + 8, { align: 'center', baseline: 'middle' });

    } else if (col.type === 'step') {
      colWidth = finalStepColWidth;
      doc.setFillColor(240, 240, 240);
      doc.rect(currentX, yPos, colWidth, 12, 'FD');

      const line1 = col.headerLabel || "";
      const line2 = `r = ${col.rest}`;

      // Distance ou Durée (Ligne 1)
      doc.setFont(undefined, 'bold');
      doc.setFontSize(dynamicHeaderFontSize + 1);
      doc.text(line1, currentX + colWidth / 2, yPos + 4, {
        align: 'center',
        baseline: 'middle',
        maxWidth: colWidth - 2
      });

      // Récupération (Ligne 2)
      doc.setFont(undefined, 'bold'); 
      doc.setFontSize(dynamicHeaderFontSize);
      doc.text(line2, currentX + colWidth / 2, yPos + 8.5, {
        align: 'center',
        baseline: 'middle'
      });
    }

    currentX += colWidth;
  });

  yPos += 12;

  // 2. DATA ROWS
  doc.setFont(undefined, 'normal');
  
  vmaRange.forEach((vma, rowIndex) => {
    // ALTERNANCE COULEURS
    if (rowIndex % 2 === 0) {
      doc.setFillColor(230, 230, 230);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    
    doc.rect(startX, yPos, totalTableWidth, rowHeight, 'F');

    let stepIndex = 0;
    currentX = startX;

    columns.forEach((col) => {
      let colWidth = 0;

      if (col.type === 'vma') {
        colWidth = vmaColWidth;
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text(`${vma}`, currentX + colWidth / 2, yPos + rowHeight / 2, {
          align: 'center',
          baseline: 'middle'
        });
      } else if (col.type === 'block-indicator') {
        colWidth = blockIndicatorWidth;
        // Vide
      } else if (col.type === 'step') {
        colWidth = finalStepColWidth;
        
        doc.setFont(undefined, 'bold');
        doc.setFontSize(dynamicDataFontSize); 

        if (stepIndex < trainingSteps.length) {
          const step = trainingSteps[stepIndex];
          let cellText = "";

          // CALCUL DYNAMIQUE SELON LE TYPE D'ÉTAPE
          if (step.type === 'time') {
             // Si c'est une durée -> on affiche l'allure cible (min/km)
             cellText = calculatePaceForVMA(step.vmaMultiplier, vma);
          } else {
             // Si c'est une distance -> on affiche le temps cible (MM:SS ou min/sec)
             cellText = calculateTimeForVMA(step.distance, step.vmaMultiplier, vma);
          }

          doc.text(cellText, currentX + colWidth / 2, yPos + rowHeight / 2, {
            align: 'center',
            baseline: 'middle'
          });

          stepIndex++;
        }
      }

      currentX += colWidth;
    });

    yPos += rowHeight;
  });

  // 3. BORDURES
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);

  currentX = startX;
  const tableBottomY = 20 + 12 + vmaRange.length * rowHeight;

  columns.forEach((col) => {
    const colWidth = col.type === 'vma' ? vmaColWidth :
                     col.type === 'block-indicator' ? blockIndicatorWidth :
                     finalStepColWidth;

    doc.line(currentX, 20, currentX, tableBottomY);
    currentX += colWidth;
  });
  doc.line(currentX, 20, currentX, tableBottomY);

  // Lignes horizontales
  doc.line(startX, 20, startX + totalTableWidth, 20); 
  doc.line(startX, 20 + 12, startX + totalTableWidth, 20 + 12); 
  
  for (let i = 0; i <= vmaRange.length; i++) {
    const y = 20 + 12 + i * rowHeight;
    doc.line(startX, y, startX + totalTableWidth, y);
  }

  // Return doc and buffer
  const buffer = doc.output('arraybuffer');
  return { doc, buffer };
}

export function generatePDF(
  builderElements: TrainingElement[],
  programName: string = 'Programme VMA'
): void {
  const { doc } = createPDFDocument(builderElements, programName);
  const fileName = `${programName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
}

export function generatePDFBuffer(
  builderElements: TrainingElement[],
  programName: string = 'Programme VMA'
): Buffer {
  const { buffer } = createPDFDocument(builderElements, programName);
  return Buffer.from(buffer);
}