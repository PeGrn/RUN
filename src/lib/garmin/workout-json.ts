/**
 * Garmin Workout JSON Format Converter
 *
 * Converts TrainingElement structures to Garmin Connect's JSON workout format
 * This format is used by the workout-service API
 */

import type { TrainingElement } from "@/lib/vma/builder-types";

export interface GarminWorkoutStep {
  type: string; // "ExecutableStepDTO" or "RepeatGroupDTO"
  stepId: number | null;
  stepOrder: number;
  childStepId: number | null;
  description: string | null;
  stepType?: {
    stepTypeId: number;
    stepTypeKey: string; // "interval", "recovery", "warmup", "cooldown", "rest"
  };
  endCondition?: {
    conditionTypeId: number;
    conditionTypeKey: string; // "time", "distance", "lap.button"
  };
  endConditionValue?: number; // Duration in seconds or distance in meters
  targetType?: {
    workoutTargetTypeId: number;
    workoutTargetTypeKey: string; // "no.target", "speed.zone", "pace.zone", etc.
  };
  targetValueOne?: number; // Lower bound for speed/pace (m/s)
  targetValueTwo?: number; // Upper bound for speed/pace (m/s)
  numberOfIterations?: number; // For repeat groups
  smartRepeat?: boolean;
  childSteps?: GarminWorkoutStep[];
}

export interface GarminWorkout {
  workoutName: string;
  description: string | null;
  sportType: {
    sportTypeId: number;
    sportTypeKey: string; // "running", "cycling", etc.
  };
  workoutProvider: null;
  workoutSourceId: null;
  consumer: null;
  workoutSegments: Array<{
    segmentOrder: number;
    sportType: {
      sportTypeId: number;
      sportTypeKey: string;
    };
    workoutSteps: GarminWorkoutStep[];
  }>;
  estimatedDurationInSeconds?: number;
  estimatedDistanceInMeters?: number;
}

/**
 * Parse duration string (e.g., "10:00" or "10") to seconds
 */
function parseDuration(input: string | undefined): number {
  if (!input) return 0;

  if (input.includes(':')) {
    const [min, sec] = input.split(':').map(Number);
    return (min || 0) * 60 + (sec || 0);
  }

  const val = parseFloat(input);
  if (!isNaN(val)) {
    return val * 60; // Assume minutes
  }

  return 0;
}

/**
 * Parse rest string (e.g., "2'", "30\"", "90") to seconds
 */
function parseRest(rest: string | undefined): number {
  if (!rest || rest === '0"' || rest === '-' || rest === '0') return 0;

  let restSeconds = 0;

  // Handle formats like "2'30\"" or "2'" or "30\""
  if (rest.includes("'") || rest.includes('"')) {
    const minMatch = rest.match(/(\d+)'/);
    const secMatch = rest.match(/(\d+)"/);
    restSeconds = (minMatch ? parseInt(minMatch[1]) * 60 : 0) + (secMatch ? parseInt(secMatch[1]) : 0);
  } else {
    // Plain number, assume seconds
    restSeconds = parseInt(rest) || 0;
  }

  return restSeconds;
}

/**
 * Determine step type based on whether it's a rest period
 * All workout steps are marked as "interval" (course à pied/running)
 * Only explicit rest periods (R = ...) are marked as "rest"
 */
function getStepType(
  vmaPercentage: number | undefined,
  isRest: boolean = false,
  isInRepeatBlock: boolean = false
): {
  stepTypeId: number;
  stepTypeKey: string;
} {
  // Only explicit rest periods are marked as "rest"
  if (isRest) {
    return { stepTypeId: 4, stepTypeKey: "rest" };
  }

  // All other steps are running/interval, regardless of pace
  return { stepTypeId: 3, stepTypeKey: "interval" };
}

/**
 * Convert training elements to Garmin workout JSON format
 */
export function convertToGarminWorkout(
  elements: TrainingElement[],
  workoutName: string,
  vma?: number
): GarminWorkout {
  let stepOrder = 1;
  let totalDuration = 0;
  let totalDistance = 0;
  const workoutSteps: GarminWorkoutStep[] = [];

  elements.forEach((block) => {
    const repetitions = block.repetitions || 1;

    if (repetitions > 1) {
      // Create a repeat group
      const childSteps: GarminWorkoutStep[] = [];
      let childStepOrder = 1;

      block.steps.forEach((step) => {
        const isTimeBased = step.type === 'time';
        const vmaPercentage = step.vmaPercentage;

        // Main step
        const duration = isTimeBased ? parseDuration(step.duration) : 0;
        const distance = !isTimeBased ? step.distance : 0;

        if (isTimeBased) {
          totalDuration += duration * repetitions;
        } else {
          totalDistance += distance * repetitions;
        }

        // Determine end condition
        let endCondition: { conditionTypeId: number; conditionTypeKey: string };
        let endConditionValue: number;

        if (isTimeBased) {
          endCondition = { conditionTypeId: 2, conditionTypeKey: "time" };
          endConditionValue = duration;
        } else {
          endCondition = { conditionTypeId: 3, conditionTypeKey: "distance" };
          endConditionValue = distance;
        }

        // Calculate target speed if VMA is provided
        let targetType = { workoutTargetTypeId: 1, workoutTargetTypeKey: "no.target" };
        let targetValueOne: number | undefined;
        let targetValueTwo: number | undefined;

        if (vma && vmaPercentage) {
          const speedKmh = vma * (vmaPercentage / 100);
          const speedMps = speedKmh / 3.6; // Convert km/h to m/s

          targetType = { workoutTargetTypeId: 6, workoutTargetTypeKey: "speed.zone" };
          // Create a range: ±5% around target speed
          targetValueOne = speedMps * 0.95;
          targetValueTwo = speedMps * 1.05;
        }

        const mainStep: any = {
          type: "ExecutableStepDTO",
          stepOrder: childStepOrder++,
          stepType: getStepType(vmaPercentage, false, true), // In repeat block
          endCondition,
          endConditionValue,
          targetType,
          ...(targetValueOne && { targetValueOne }),
          ...(targetValueTwo && { targetValueTwo }),
        };

        // Add description only if present
        if (step.name) {
          mainStep.description = step.name;
        }

        childSteps.push(mainStep);

        // Add rest step if specified
        const restSeconds = parseRest(step.rest);
        if (restSeconds > 0) {
          totalDuration += restSeconds * repetitions;

          const restStep: any = {
            type: "ExecutableStepDTO",
            stepOrder: childStepOrder++,
            stepType: getStepType(0, true, true), // Rest step in repeat block
            endCondition: { conditionTypeId: 2, conditionTypeKey: "time" },
            endConditionValue: restSeconds,
            targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: "no.target" },
          };

          childSteps.push(restStep);
        }
      });

      // Create the repeat group
      const repeatGroup: any = {
        type: "RepeatGroupDTO",
        stepOrder: stepOrder++,
        numberOfIterations: repetitions,
        smartRepeat: false,
        workoutSteps: childSteps, // Garmin uses workoutSteps for child steps in repeat groups
      };

      workoutSteps.push(repeatGroup);
    } else {
      // Single execution (no repeat)
      block.steps.forEach((step) => {
        const isTimeBased = step.type === 'time';
        const vmaPercentage = step.vmaPercentage;

        const duration = isTimeBased ? parseDuration(step.duration) : 0;
        const distance = !isTimeBased ? step.distance : 0;

        if (isTimeBased) {
          totalDuration += duration;
        } else {
          totalDistance += distance;
        }

        let endCondition: { conditionTypeId: number; conditionTypeKey: string };
        let endConditionValue: number;

        if (isTimeBased) {
          endCondition = { conditionTypeId: 2, conditionTypeKey: "time" };
          endConditionValue = duration;
        } else {
          endCondition = { conditionTypeId: 3, conditionTypeKey: "distance" };
          endConditionValue = distance;
        }

        let targetType = { workoutTargetTypeId: 1, workoutTargetTypeKey: "no.target" };
        let targetValueOne: number | undefined;
        let targetValueTwo: number | undefined;

        if (vma && vmaPercentage) {
          const speedKmh = vma * (vmaPercentage / 100);
          const speedMps = speedKmh / 3.6;

          targetType = { workoutTargetTypeId: 6, workoutTargetTypeKey: "speed.zone" };
          targetValueOne = speedMps * 0.95;
          targetValueTwo = speedMps * 1.05;
        }

        const mainStep: any = {
          type: "ExecutableStepDTO",
          stepOrder: stepOrder++,
          stepType: getStepType(vmaPercentage, false, false), // Not in repeat block
          endCondition,
          endConditionValue,
          targetType,
          ...(targetValueOne && { targetValueOne }),
          ...(targetValueTwo && { targetValueTwo }),
        };

        // Add description only if present
        if (step.name) {
          mainStep.description = step.name;
        }

        workoutSteps.push(mainStep);

        // Add rest step
        const restSeconds = parseRest(step.rest);
        if (restSeconds > 0) {
          totalDuration += restSeconds;

          const restStep: any = {
            type: "ExecutableStepDTO",
            stepOrder: stepOrder++,
            stepType: getStepType(0, true, false), // Rest step, not in repeat block
            endCondition: { conditionTypeId: 2, conditionTypeKey: "time" },
            endConditionValue: restSeconds,
            targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: "no.target" },
          };

          workoutSteps.push(restStep);
        }
      });
    }
  });

  const workout: any = {
    workoutName,
    sportType: {
      sportTypeId: 1,
      sportTypeKey: "running",
    },
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType: {
          sportTypeId: 1,
          sportTypeKey: "running",
        },
        workoutSteps,
      },
    ],
  };

  // Add optional fields only if they have values
  if (totalDuration > 0) {
    workout.estimatedDurationInSeconds = totalDuration;
  }
  if (totalDistance > 0) {
    workout.estimatedDistanceInMeters = totalDistance;
  }

  return workout;
}
