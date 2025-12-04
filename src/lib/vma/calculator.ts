import { TrainingStep, StepResult, VMAProgram } from './types';

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

/**
 * Convert seconds to pace format (MM:SS/km)
 */
export function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/km`;
}

/**
 * Calculate target time for a specific distance at a given speed
 * @param distance Distance in meters
 * @param speedKmh Speed in km/h
 * @returns Time in seconds
 */
export function calculateTime(distance: number, speedKmh: number): number {
  // Convert distance to km
  const distanceKm = distance / 1000;
  // Calculate time in hours
  const timeHours = distanceKm / speedKmh;
  // Convert to seconds
  return timeHours * 3600;
}

/**
 * Calculate step result based on VMA
 */
export function calculateStepResult(step: TrainingStep, vma: number): StepResult {
  // Calculate target speed: VMA * multiplier
  const speed = vma * step.vmaMultiplier;

  // Calculate target time in seconds
  const targetTime = calculateTime(step.distance, speed);

  // Calculate pace (seconds per km)
  const paceSecondsPerKm = 3600 / speed;
  const targetPace = formatPace(paceSecondsPerKm);

  return {
    step,
    targetTime,
    targetPace,
    speed: parseFloat(speed.toFixed(2))
  };
}

/**
 * Calculate complete VMA program
 */
export function calculateVMAProgram(steps: TrainingStep[], vma: number): VMAProgram {
  const stepResults = steps.map(step => calculateStepResult(step, vma));

  // Calculate total distance (accounting for repetitions)
  const totalDistance = steps.reduce((sum, step) => sum + (step.distance * step.repetitions), 0);

  // Calculate total work time (not including rest)
  const totalWorkTime = stepResults.reduce(
    (sum, result) => sum + (result.targetTime * result.step.repetitions),
    0
  );

  // Parse rest times and add them
  const totalRestTime = steps.reduce((sum, step) => {
    if (!step.rest || step.rest === '0"') return sum;

    // Parse rest time (e.g., "2'" = 120s, "15"" = 15s)
    const restMatch = step.rest.match(/(\d+)(['"])/);
    if (!restMatch) return sum;

    const value = parseInt(restMatch[1]);
    const unit = restMatch[2];
    const restSeconds = unit === "'" ? value * 60 : value;

    // Multiply by repetitions (rest happens after each rep except the last)
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

/**
 * Get VMA color based on level
 */
export function getVMAColor(vma: number): string {
  if (vma < 14) return 'hsl(var(--destructive))';
  if (vma < 16) return 'hsl(var(--warning))';
  if (vma < 18) return 'hsl(var(--primary))';
  return 'hsl(var(--success))';
}

/**
 * Get step group color
 */
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
