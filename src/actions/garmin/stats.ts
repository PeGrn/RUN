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
        // Casting to any to bypass the missing type definitions
        total_steps: (step as any).total_steps,
        total_distance: (step as any).total_distance,
        step_goal: (step as any).step_goal,
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
        // Casting to any to bypass missing type definitions here as well
        total_steps: (step as any).total_steps,
        average_steps: (step as any).average_steps,
        total_distance: (step as any).total_distance,
        average_distance: (step as any).average_distance,
        wellness_data_days_count: (step as any).wellness_data_days_count,
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
        // Casting to any to bypass missing type definitions for stress metrics
        overall_stress_level: (s as any).overall_stress_level,
        rest_stress_duration: (s as any).rest_stress_duration,
        low_stress_duration: (s as any).low_stress_duration,
        medium_stress_duration: (s as any).medium_stress_duration,
        high_stress_duration: (s as any).high_stress_duration,
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
        // Casting to any just in case 'value' is missing from the type def
        value: (s as any).value,
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