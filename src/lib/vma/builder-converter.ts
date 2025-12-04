import { TrainingElement, BuilderStep } from './builder-types';
import { TrainingStep } from './types';

/**
 * Convert a BuilderStep to a TrainingStep
 */
export function convertBuilderStepToTrainingStep(
  builderStep: BuilderStep,
  stepNumber: number,
  repetitions: number = 1
): TrainingStep {
  return {
    id: builderStep.id,
    name: builderStep.name || `STEP ${stepNumber}`,
    distance: builderStep.distance,
    vmaMultiplier: builderStep.vmaPercentage / 100, // Convert percentage to multiplier
    rest: builderStep.rest || '0"',
    repetitions,
    group: builderStep.group || 'main',
    description: builderStep.description
  };
}

/**
 * Convert builder elements (RepetitionBlocks) to training steps
 */
export function convertBuilderElementsToSteps(elements: TrainingElement[]): TrainingStep[] {
  const steps: TrainingStep[] = [];
  let stepNumber = 1;

  // All elements are RepetitionBlocks now
  elements.forEach((block) => {
    // For each block, create steps with the block's repetition count
    block.steps.forEach((builderStep) => {
      const step = convertBuilderStepToTrainingStep(builderStep, stepNumber++, block.repetitions);
      steps.push(step);
    });
  });

  return steps;
}
