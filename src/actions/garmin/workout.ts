"use server";

import { getUserGarminClient } from "./user-auth";
import type { GarminWorkout } from "@/lib/garmin/workout-json";

/**
 * Create a workout in Garmin Connect using the workout service API
 * @param workoutData - The workout data in Garmin's JSON format
 * @returns Success status and the created workout data
 */
export async function createGarminWorkout(workoutData: GarminWorkout) {
  try {
    // Get user-specific Garmin client
    const client = await getUserGarminClient();

    if (!client) {
      return {
        success: false,
        error: "Not connected to Garmin. Please connect your Garmin account in your profile.",
      };
    }

    console.log("Creating workout in Garmin Connect...");
    console.log("Workout data:", JSON.stringify(workoutData, null, 2));

    // Use the workout service API to create the workout
    const result = await client.connectapi(
      "/workout-service/workout",
      "POST",
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: workoutData,
      }
    );

    console.log("Workout created successfully:", result);

    return {
      success: true,
      data: result,
      message: "Workout created successfully in Garmin Connect",
    };
  } catch (error: any) {
    console.error("Failed to create workout in Garmin Connect:", error);
    console.error("Error response status:", error.response?.status);
    console.error("Error response data:", JSON.stringify(error.response?.data, null, 2));
    console.error("Error message:", error.message);

    // Try to extract a meaningful error message
    let errorMsg = "Failed to create workout";
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMsg = error.response.data;
      } else if (error.response.data.message) {
        errorMsg = error.response.data.message;
      } else if (error.response.data.error) {
        errorMsg = error.response.data.error;
      } else {
        errorMsg = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      errorMsg = error.message;
    }

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Schedule a workout to a specific date
 * @param workoutId - The ID of the workout to schedule
 * @param date - The date to schedule the workout (ISO string or Date)
 * @returns Success status
 */
export async function scheduleGarminWorkout(workoutId: number, date: string | Date) {
  try {
    // Get user-specific Garmin client
    const client = await getUserGarminClient();

    if (!client) {
      return {
        success: false,
        error: "Not connected to Garmin. Please connect your Garmin account in your profile.",
      };
    }

    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    console.log(`Scheduling workout ${workoutId} for ${dateStr}...`);

    const result = await client.connectapi(
      "/workout-service/schedule",
      "POST",
      {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          workoutId,
          date: dateStr,
        },
      }
    );

    console.log("Workout scheduled successfully:", result);

    return {
      success: true,
      data: result,
      message: "Workout scheduled successfully",
    };
  } catch (error: any) {
    console.error("Failed to schedule workout:", error);

    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to schedule workout",
    };
  }
}
