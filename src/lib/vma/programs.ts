import { ProgramTemplate, TrainingStep } from './types';

// Default VMA training program based on the Excel file
const defaultProgramSteps: TrainingStep[] = [
  {
    id: 'step-1',
    name: 'STEP 1',
    distance: 800,
    vmaMultiplier: 0.88,
    rest: '0"',
    repetitions: 2,
    group: 'warmup',
    description: 'Échauffement progressif'
  },
  {
    id: 'step-1bis',
    name: 'STEP 1bis',
    distance: 200,
    vmaMultiplier: 0.96,
    rest: "2'",
    repetitions: 2,
    group: 'warmup',
    description: 'Montée en puissance'
  },
  {
    id: 'step-2',
    name: 'STEP 2',
    distance: 100,
    vmaMultiplier: 1.1,
    rest: '0"',
    repetitions: 12,
    group: 'main',
    description: 'Travail haute intensité'
  },
  {
    id: 'step-2bis',
    name: 'STEP 2bis',
    distance: 100,
    vmaMultiplier: 0.76,
    rest: "3'",
    repetitions: 12,
    group: 'main',
    description: 'Récupération active'
  },
  {
    id: 'step-3',
    name: 'STEP 3',
    distance: 200,
    vmaMultiplier: 1.04,
    rest: '15"',
    repetitions: 1,
    group: 'cooldown',
    description: 'Retour au calme progressif'
  },
  {
    id: 'step-4',
    name: 'STEP 4',
    distance: 200,
    vmaMultiplier: 1.07,
    rest: '30"',
    repetitions: 1,
    group: 'cooldown',
    description: 'Récupération'
  },
  {
    id: 'step-5',
    name: 'STEP 5',
    distance: 200,
    vmaMultiplier: 1.1,
    rest: '45"',
    repetitions: 1,
    group: 'cooldown',
    description: 'Dernière phase'
  },
  {
    id: 'step-6',
    name: 'STEP 6',
    distance: 200,
    vmaMultiplier: 1.14,
    rest: '',
    repetitions: 1,
    group: 'cooldown',
    description: 'Fin de séance'
  }
];

export const defaultProgram: ProgramTemplate = {
  id: 'default-vma',
  name: 'Programme VMA Standard',
  description: 'Programme fractionné complet avec échauffement, travail haute intensité et retour au calme',
  steps: defaultProgramSteps
};

export const programTemplates: ProgramTemplate[] = [
  defaultProgram,
  // Add more templates here in the future
];

export function getProgramById(id: string): ProgramTemplate | undefined {
  return programTemplates.find(p => p.id === id);
}
