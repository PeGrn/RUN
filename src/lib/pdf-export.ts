import jsPDF from 'jspdf';
import { TrainingElement } from '@/lib/vma';
import { convertBuilderElementsToSteps } from '@/lib/vma';

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  const timeInSeconds = (distance / 1000 / speed) * 3600;
  return formatTime(timeInSeconds);
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  
  // --- CONFIGURATION DES TAILLES FIXES ---
  const vmaColWidth = 12;
  const blockIndicatorWidth = 6; 
  const rowHeight = 6; // Hauteur fixe demandée

  // Convert builder elements to steps to get step info
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
    distance?: string;
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
      columns.push({
        type: 'step',
        stepName: step.name || 'STEP',
        distance: step.distance >= 1000
          ? `${(step.distance / 1000).toFixed(1)}km`
          : `${step.distance}m`,
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
  let dynamicStepWidth = remainingWidthForSteps / (numStepColumns || 1);
  
  // Limites pour la largeur
  const MIN_STEP_WIDTH = 10;
  const MAX_STEP_WIDTH = 45; // Augmenté pour permettre un gros zoom si peu de colonnes

  let finalStepColWidth = Math.min(Math.max(dynamicStepWidth, MIN_STEP_WIDTH), MAX_STEP_WIDTH);

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
  let startX = (pageWidth - totalTableWidth) / 2;


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

      const line1 = `${col.distance}`;
      const line2 = `r = ${col.rest}`;

      // Distance (taille dynamique)
      doc.setFont(undefined, 'bold');
      doc.setFontSize(dynamicHeaderFontSize + 1);
      doc.text(line1, currentX + colWidth / 2, yPos + 4, {
        align: 'center',
        baseline: 'middle',
        maxWidth: colWidth - 2
      });

      // Récupération (taille dynamique)
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
    // ALTERNANCE COULEURS : Gris plus foncé (230) vs Blanc (255)
    if (rowIndex % 2 === 0) {
      doc.setFillColor(230, 230, 230); // C'était 250, mis à 230 pour plus de contraste
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
          const time = calculateTimeForVMA(step.distance, step.vmaMultiplier, vma);

          doc.text(time, currentX + colWidth / 2, yPos + rowHeight / 2, {
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

/**
 * Generate PDF and download it
 */
export function generatePDF(
  builderElements: TrainingElement[],
  programName: string = 'Programme VMA'
): void {
  const { doc } = createPDFDocument(builderElements, programName);
  const fileName = `${programName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
}

/**
 * Generate PDF and return buffer for server-side operations
 */
export function generatePDFBuffer(
  builderElements: TrainingElement[],
  programName: string = 'Programme VMA'
): Buffer {
  const { buffer } = createPDFDocument(builderElements, programName);
  return Buffer.from(buffer);
}