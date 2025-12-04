import jsPDF from 'jspdf';
import { VMAProgram, TrainingElement } from '@/lib/vma';
import { calculateVMAProgram, convertBuilderElementsToSteps } from '@/lib/vma';

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
 * Generate PDF table with VMA rows (12-23) and steps columns
 */
export function generatePDF(
  builderElements: TrainingElement[],
  programName: string = 'Programme VMA'
): void {
  // Create landscape PDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Convert builder elements to steps to get step info
  const trainingSteps = convertBuilderElementsToSteps(builderElements);

  // VMA range: 12.0 to 23.0 with half points
  const vmaRange = [
    12.0, 13.0, 14.0, 15.0, 15.5, 16.0, 16.5, 17.0, 17.5,
    18.0, 18.5, 19.0, 19.5, 20.0, 20.5, 21.0, 21.5, 22.0, 22.5, 23.0
  ];

  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(programName, margin, 12);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(new Date().toLocaleDateString('fr-FR'), margin, 19);

  // Start table at yPos
  let yPos = 32;

  // Build column structure with separate columns for block indicators
  interface ColumnInfo {
    type: 'vma' | 'block-indicator' | 'step';
    stepName?: string;
    distance?: string;
    rest?: string;
    blockReps?: number;
    stepIndex?: number;
  }

  const columns: ColumnInfo[] = [{ type: 'vma' }];

  // All elements are now RepetitionBlocks
  builderElements.forEach((block) => {
    // Add block indicator column
    columns.push({
      type: 'block-indicator',
      blockReps: block.repetitions
    });

    // Add steps in the block
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

  // Calculate column widths
  const vmaColWidth = 20;
  const blockIndicatorWidth = 12;
  const numBlockIndicators = columns.filter(c => c.type === 'block-indicator').length;
  const numStepColumns = columns.filter(c => c.type === 'step').length;

  const availableWidth = pageWidth - margin * 2 - vmaColWidth - (numBlockIndicators * blockIndicatorWidth);
  const stepColWidth = availableWidth / numStepColumns;

  // Reset text color
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);

  // Draw table headers
  let currentX = margin;

  columns.forEach((col, index) => {
    let colWidth = 0;

    if (col.type === 'vma') {
      colWidth = vmaColWidth;
      doc.setFillColor(240, 240, 240);
      doc.rect(currentX, yPos, colWidth, 12, 'FD');
      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.text('VMA', currentX + colWidth / 2, yPos + 7, { align: 'center' });
    } else if (col.type === 'block-indicator') {
      colWidth = blockIndicatorWidth;
      doc.setFillColor(220, 220, 220);
      doc.rect(currentX, yPos, colWidth, 12, 'FD');
      doc.setFont(undefined, 'bold');
      doc.setFontSize(7);
      doc.text(`${col.blockReps}x`, currentX + colWidth / 2, yPos + 5, { align: 'center' });
      doc.text('==>', currentX + colWidth / 2, yPos + 9, { align: 'center' });
    } else if (col.type === 'step') {
      colWidth = stepColWidth;
      doc.setFillColor(240, 240, 240);
      doc.rect(currentX, yPos, colWidth, 12, 'FD');

      // Format: "STEP NAME : Distance\nr = Rest"
      const line1 = `${col.stepName} : ${col.distance}`;
      const line2 = `r = ${col.rest}`;

      doc.setFont(undefined, 'bold');
      doc.setFontSize(6);
      doc.text(line1, currentX + colWidth / 2, yPos + 5, {
        align: 'center',
        maxWidth: colWidth - 2
      });

      doc.setFont(undefined, 'normal');
      doc.setFontSize(5.5);
      doc.text(line2, currentX + colWidth / 2, yPos + 9.5, {
        align: 'center'
      });
    }

    currentX += colWidth;
  });

  yPos += 12;

  // Row height
  const rowHeight = 8;

  // Draw data rows
  doc.setFont(undefined, 'normal');
  vmaRange.forEach((vma, rowIndex) => {
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(250, 250, 250);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, yPos, pageWidth - margin * 2, rowHeight, 'F');

    // Draw cells
    let stepIndex = 0;
    currentX = margin;

    columns.forEach((col) => {
      let colWidth = 0;

      if (col.type === 'vma') {
        colWidth = vmaColWidth;
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text(`${vma}`, currentX + colWidth / 2, yPos + rowHeight / 2 + 1.5, {
          align: 'center'
        });
      } else if (col.type === 'block-indicator') {
        colWidth = blockIndicatorWidth;
        // Empty cell for block indicator in data rows
      } else if (col.type === 'step') {
        colWidth = stepColWidth;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(7);

        if (stepIndex < trainingSteps.length) {
          const step = trainingSteps[stepIndex];
          const time = calculateTimeForVMA(step.distance, step.vmaMultiplier, vma);

          doc.text(time, currentX + colWidth / 2, yPos + rowHeight / 2 + 1.5, {
            align: 'center'
          });

          stepIndex++;
        }
      }

      currentX += colWidth;
    });

    yPos += rowHeight;
  });

  // Draw borders
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);

  // Vertical lines
  currentX = margin;
  columns.forEach((col, index) => {
    const colWidth = col.type === 'vma' ? vmaColWidth :
                     col.type === 'block-indicator' ? blockIndicatorWidth :
                     stepColWidth;

    doc.line(currentX, 32, currentX, 32 + 12 + vmaRange.length * rowHeight);
    currentX += colWidth;
  });
  // Last vertical line
  doc.line(currentX, 32, currentX, 32 + 12 + vmaRange.length * rowHeight);

  // Horizontal lines
  doc.line(margin, 32, currentX, 32); // Top
  doc.line(margin, 32 + 12, currentX, 32 + 12); // After header
  for (let i = 0; i <= vmaRange.length; i++) {
    const y = 32 + 12 + i * rowHeight;
    doc.line(margin, y, currentX, y);
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );

  // Save PDF
  const fileName = `${programName.toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
}
