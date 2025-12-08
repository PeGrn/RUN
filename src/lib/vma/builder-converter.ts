import { TrainingElement, BuilderStep } from './builder-types';
import { TrainingStep } from './types';

/**
 * Convert a BuilderStep to a TrainingStep
 */
export function convertBuilderStepToTrainingStep(
  builderStep: BuilderStep,
  stepNumber: number,
  repetitions: number = 1,
  blockId?: string
): TrainingStep {
  return {
    id: builderStep.id,
    name: builderStep.name || `STEP ${stepNumber}`,
    type: builderStep.type, // Transfert du type
    distance: builderStep.distance,
    duration: builderStep.duration, // Transfert de la durée
    vmaMultiplier: builderStep.vmaPercentage / 100,
    rest: builderStep.rest || '0"',
    repetitions,
    group: builderStep.group || 'main',
    description: builderStep.description,
    blockId
  };
}

/**
 * Convert builder elements (RepetitionBlocks) to training steps
 */
export function convertBuilderElementsToSteps(elements: TrainingElement[]): TrainingStep[] {
  const steps: TrainingStep[] = [];
  let stepNumber = 1;

  elements.forEach((block) => {
    if (!block.steps || !Array.isArray(block.steps)) {
      return;
    }

    block.steps.forEach((builderStep) => {
      const step = convertBuilderStepToTrainingStep(builderStep, stepNumber++, block.repetitions, block.id);
      steps.push(step);
    });
  });

  return steps;
}