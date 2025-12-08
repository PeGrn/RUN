// Types for the training builder interface

// 1. Définition du type manquant
export type TargetType = 'distance' | 'time';

export interface BuilderStep {
  id: string;
  type: TargetType;
  distance: number; // meters (utilisé si type === 'distance')
  duration: string; // e.g., "10:00" (utilisé si type === 'time')
  vmaPercentage: number; // e.g., 88 for 88% VMA
  rest: string; // e.g., "2'", "15"", "0""
  name?: string;
  description?: string;
  group?: 'warmup' | 'main' | 'cooldown';
}

export interface RepetitionBlock {
  id: string;
  type: 'repetition';
  repetitions: number;
  steps: BuilderStep[];
  name?: string;
}

// TrainingElement is now always a RepetitionBlock
export type TrainingElement = RepetitionBlock;

export interface BuilderProgram {
  name: string;
  elements: TrainingElement[];
}

// Helper functions
export function createEmptyStep(): BuilderStep {
  return {
    id: crypto.randomUUID(),
    type: 'distance', // Valeur par défaut
    distance: 100,
    duration: '',     // Correction : Initialisation obligatoire
    vmaPercentage: 100,
    rest: '0"',
    group: 'main'
  };
}

export function createRepetitionBlock(repetitions: number = 1, steps?: BuilderStep[]): RepetitionBlock {
  return {
    id: crypto.randomUUID(),
    type: 'repetition',
    repetitions,
    steps: steps || [createEmptyStep()],
    name: ''
  };
}