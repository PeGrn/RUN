"use server";

import { ensureAuthenticated } from "./auth";
import { client } from "@/lib/garth";
import { Activity } from "@/lib/garth/activities/activities";

// Get list of activities

export async function getActivities(start: number = 0, limit: number = 20) {
  try {
    await ensureAuthenticated();

    const activities = await Activity.list(start, limit, { client });

    return {
      success: true,
      data: activities,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch activities",
    };
  }
}

// Get activities by date range

export async function getActivitiesByDateRange(
  startDate: string | Date,
  endDate: string | Date,
  activityType?: string
) {
  try {
    await ensureAuthenticated();

    const activities = await Activity.getByDateRange(startDate, endDate, {
      client,
      activityType,
    });

    return {
      success: true,
      data: activities,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch activities by date range",
    };
  }
}

// Get activity details (includes laps)

export async function getActivityDetails(activityId: number) {
  try {
    await ensureAuthenticated();

    const details = await Activity.getDetails(activityId, { client });

    return {
      success: true,
      data: details,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch activity details",
    };
  }
}

// Get activity splits

export async function getActivitySplits(activityId: number) {
  try {
    await ensureAuthenticated();

    const splits = await Activity.getSplits(activityId, { client });

    return {
      success: true,
      data: splits,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch activity splits",
    };
  }
}

// Get activity metrics (heart rate, cadence, power, etc.)

export async function getActivityMetrics(activityId: number, metricKeys?: string[]) {
  try {
    await ensureAuthenticated();

    const metrics = await Activity.getMetrics(activityId, { client, metricKeys });

    return {
      success: true,
      data: metrics,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch activity metrics",
    };
  }
}

// Get activity weather

export async function getActivityWeather(activityId: number) {
  try {
    await ensureAuthenticated();

    const weather = await Activity.getWeather(activityId, { client });

    return {
      success: true,
      data: weather,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch activity weather",
    };
  }
}

// Get activity gear

export async function getActivityGear(activityId: number) {
  try {
    await ensureAuthenticated();

    const gear = await Activity.getGear(activityId, { client });

    return {
      success: true,
      data: gear,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch activity gear",
    };
  }
}

// Get full activity with all details

export async function getFullActivity(activityId: number) {
  try {
    await ensureAuthenticated();

    const fullActivity = await Activity.getFull(activityId, { client });

    return {
      success: true,
      data: fullActivity,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch full activity",
    };
  }
}

// Download activity in different formats

export async function downloadActivityGPX(activityId: number) {
  try {
    await ensureAuthenticated();

    const gpxData = await Activity.downloadGPX(activityId, { client });

    return {
      success: true,
      data: gpxData.toString("utf-8"),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to download GPX",
    };
  }
}

export async function downloadActivityTCX(activityId: number) {
  try {
    await ensureAuthenticated();

    const tcxData = await Activity.downloadTCX(activityId, { client });

    return {
      success: true,
      data: tcxData.toString("utf-8"),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to download TCX",
    };
  }
}

export async function downloadActivityFIT(activityId: number) {
  try {
    await ensureAuthenticated();

    const fitData = await Activity.downloadFIT(activityId, { client });

    // Return as base64 since FIT is binary
    return {
      success: true,
      data: fitData.toString("base64"),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to download FIT",
    };
  }
}

// Get recent activities with quick stats

export async function getRecentActivities(limit: number = 10) {
  try {
    await ensureAuthenticated();

    const activities = await Activity.list(0, limit, { client });

    // Return simplified version
    return {
      success: true,
      data: activities.map((activity) => ({
        activity_id: activity.activity_id,
        activity_name: activity.activity_name,
        start_time_local: activity.start_time_local,
        activity_type: activity.activity_type,
        distance: activity.distance,
        duration: activity.duration,
        average_speed: activity.average_speed,
        average_hr: activity.average_hr,
        average_running_cadence_in_steps_per_minute: activity.average_running_cadence_in_steps_per_minute,
        calories: activity.calories,
        elevation_gain: activity.elevation_gain,
      })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch recent activities",
    };
  }
}
