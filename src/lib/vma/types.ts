export interface TrainingStep {
  id: string;
  name: string;
  type?: 'distance' | 'time'; // Nouveau champ optionnel (pour compatibilité)
  distance: number; // meters
  duration?: string; // Nouveau champ (ex: "10:00")
  vmaMultiplier: number; 
  rest: string; 
  repetitions: number;
  group: 'warmup' | 'main' | 'cooldown';
  description?: string;
  blockId?: string;
}

export interface StepResult {
  step: TrainingStep;
  targetTime: number; // seconds
  targetPace: string; // "mm:ss/km" format
  speed: number; // km/h
}

export interface VMAProgram {
  vma: number; // km/h
  steps: StepResult[];
  totalDistance: number; // meters
  totalTime: number; // seconds
  estimatedDuration: string; // formatted duration
}

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  steps: TrainingStep[];
}