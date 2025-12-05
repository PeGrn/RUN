export interface TrainingStep {
  id: string;
  name: string;
  distance: number; // meters
  vmaMultiplier: number; // 0.88, 1.1, etc.
  rest: string; // "2'", "15"", etc.
  repetitions: number;
  group: 'warmup' | 'main' | 'cooldown';
  description?: string;
  blockId?: string; // ID of the repetition block this step belongs to
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
