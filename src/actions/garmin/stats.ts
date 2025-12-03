"use server";

import { ensureAuthenticated } from "./auth";
import { client } from "@/lib/garth";
import { DailySteps, WeeklySteps } from "@/lib/garth/stats/steps";
import { DailyStress, WeeklyStress } from "@/lib/garth/stats/stress";

// Steps Actions

export async function getDailySteps(end?: Date | string, days: number = 7) {
  try {
    await ensureAuthenticated();

    const steps = await DailySteps.list(end || null, days, { client });

    return {
      success: true,
      data: steps.map((step) => ({
        calendar_date: step.calendar_date.toISOString(),
        total_steps: step.total_steps,
        total_distance: step.total_distance,
        step_goal: step.step_goal,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch daily steps",
    };
  }
}

export async function getWeeklySteps(end?: Date | string, weeks: number = 4) {
  try {
    await ensureAuthenticated();

    const steps = await WeeklySteps.list(end || null, weeks, { client });

    return {
      success: true,
      data: steps.map((step) => ({
        calendar_date: step.calendar_date.toISOString(),
        total_steps: step.total_steps,
        average_steps: step.average_steps,
        total_distance: step.total_distance,
        average_distance: step.average_distance,
        wellness_data_days_count: step.wellness_data_days_count,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch weekly steps",
    };
  }
}

// Stress Actions

export async function getDailyStress(end?: Date | string, days: number = 7) {
  try {
    await ensureAuthenticated();

    const stress = await DailyStress.list(end || null, days, { client });

    return {
      success: true,
      data: stress.map((s) => ({
        calendar_date: s.calendar_date.toISOString(),
        overall_stress_level: s.overall_stress_level,
        rest_stress_duration: s.rest_stress_duration,
        low_stress_duration: s.low_stress_duration,
        medium_stress_duration: s.medium_stress_duration,
        high_stress_duration: s.high_stress_duration,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch daily stress",
    };
  }
}

export async function getWeeklyStress(end?: Date | string, weeks: number = 4) {
  try {
    await ensureAuthenticated();

    const stress = await WeeklyStress.list(end || null, weeks, { client });

    return {
      success: true,
      data: stress.map((s) => ({
        calendar_date: s.calendar_date.toISOString(),
        value: s.value,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch weekly stress",
    };
  }
}

// Combined Stats Action

export async function getAllStats(end?: Date | string, days: number = 7) {
  try {
    await ensureAuthenticated();

    const [dailyStepsResult, dailyStressResult] = await Promise.all([
      getDailySteps(end, days),
      getDailyStress(end, days),
    ]);

    return {
      success: true,
      data: {
        steps: dailyStepsResult.success ? dailyStepsResult.data : [],
        stress: dailyStressResult.success ? dailyStressResult.data : [],
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch stats",
    };
  }
}
