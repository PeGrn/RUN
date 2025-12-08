import { TrainingStep, StepResult, VMAProgram } from './types';

/**
 * Helper: Parse une durée (ex: "10:30", "10") en secondes
 */
function parseDuration(input: string | undefined): number {
  if (!input) return 0;
  
  // Format MM:SS
  if (input.includes(':')) {
    const [min, sec] = input.split(':').map(Number);
    return (min || 0) * 60 + (sec || 0);
  }
  
  // Format nombre simple => on considère que ce sont des minutes (convention courante)
  const val = parseFloat(input);
  if (!isNaN(val)) {
     return val * 60;
  }
  
  return 0;
}

/**
 * Convert seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 100);

  if (ms > 0) {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/km`;
}

export function calculateTime(distance: number, speedKmh: number): number {
  if (speedKmh <= 0) return 0;
  const distanceKm = distance / 1000;
  const timeHours = distanceKm / speedKmh;
  return timeHours * 3600;
}

/**
 * Calculate step result based on VMA
 */
export function calculateStepResult(step: TrainingStep, vma: number): StepResult {
  const speed = vma * step.vmaMultiplier; // km/h
  const speedMs = speed / 3.6; // m/s

  let targetTime = 0;
  let targetDistance = 0;

  if (step.type === 'time' && step.duration) {
    // CAS : ÉTAPE AU TEMPS
    targetTime = parseDuration(step.duration);
    // On calcule la distance théorique pour les stats et graphiques
    // Distance = Vitesse (m/s) * Temps (s)
    targetDistance = speedMs * targetTime;
  } else {
    // CAS : ÉTAPE À LA DISTANCE (Défaut)
    targetDistance = step.distance;
    if (speed > 0) {
      targetTime = (targetDistance / 1000 / speed) * 3600;
    }
  }

  const paceSecondsPerKm = speed > 0 ? 3600 / speed : 0;

  return {
    step: {
        ...step,
        // IMPORTANT : On injecte la distance calculée pour que les graphiques fonctionnent
        distance: targetDistance 
    },
    targetTime,
    targetPace: formatPace(paceSecondsPerKm),
    speed: parseFloat(speed.toFixed(2))
  };
}

/**
 * Calculate complete VMA program
 */
export function calculateVMAProgram(steps: TrainingStep[], vma: number): VMAProgram {
  const stepResults = steps.map(step => calculateStepResult(step, vma));

  const totalDistance = stepResults.reduce(
    (sum, res) => sum + (res.step.distance * res.step.repetitions), 
    0
  );

  const totalWorkTime = stepResults.reduce(
    (sum, result) => sum + (result.targetTime * result.step.repetitions),
    0
  );

  // Parse rest times
  const totalRestTime = steps.reduce((sum, step) => {
    if (!step.rest || step.rest === '0"' || step.rest === '-') return sum;
    // On utilise un parseur simple pour la récup (souvent format 1'30" ou 90")
    // Ici on simplifie en réutilisant parseDuration ou une logique spécifique si besoin
    let restSeconds = 0;
    if (step.rest.includes("'") || step.rest.includes('"')) {
        const minMatch = step.rest.match(/(\d+)'/);
        const secMatch = step.rest.match(/(\d+)"/);
        restSeconds = (minMatch ? parseInt(minMatch[1]) * 60 : 0) + (secMatch ? parseInt(secMatch[1]) : 0);
    } else {
        restSeconds = parseDuration(step.rest);
    }
    return sum + (restSeconds * Math.max(0, step.repetitions - 1));
  }, 0);

  const totalTime = totalWorkTime + totalRestTime;

  return {
    vma,
    steps: stepResults,
    totalDistance,
    totalTime,
    estimatedDuration: formatTime(totalTime)
  };
}

// ... (Gardez getVMAColor et getStepGroupColor tels quels)
export function getVMAColor(vma: number): string {
  if (vma < 14) return 'hsl(var(--destructive))';
  if (vma < 16) return 'hsl(var(--warning))';
  if (vma < 18) return 'hsl(var(--primary))';
  return 'hsl(var(--success))';
}

export function getStepGroupColor(group: TrainingStep['group']): string {
  switch (group) {
    case 'warmup':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
    case 'main':
      return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
    case 'cooldown':
      return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
  }
}