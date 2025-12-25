"use server";

import { ensureAuthenticated } from "./auth";
import { client } from "@/lib/garth";
import { Readable } from "stream";

/**
 * Upload a workout FIT file to Garmin Connect
 * @param fitData - The FIT file data as a Uint8Array or Buffer
 * @param filename - Optional filename (will default to workout.fit)
 * @returns Success status and upload result
 */
export async function uploadWorkoutToGarmin(
  fitData: Uint8Array | Buffer,
  filename: string = "workout.fit"
) {
  try {
    await ensureAuthenticated();

    // Convert Uint8Array to Buffer if needed
    const buffer = Buffer.isBuffer(fitData) ? fitData : Buffer.from(fitData);

    // Create a readable stream from the buffer
    // The upload method expects a fs.ReadStream, but we can create a compatible stream
    const stream = Readable.from(buffer) as any;

    // Add the path property that the upload method expects
    stream.path = filename;

    // Upload to Garmin Connect
    const result = await client.upload(stream, "/upload-service/upload");

    return {
      success: true,
      data: result,
      message: "Workout uploaded successfully to Garmin Connect",
    };
  } catch (error: any) {
    console.error("Upload to Garmin failed:", error);
    return {
      success: false,
      error: error.message || "Failed to upload workout to Garmin Connect",
    };
  }
}

/**
 * Upload a workout FIT file to Garmin Connect using base64 encoded data
 * This is useful when sending data from the client
 * @param base64Data - The FIT file data as base64 string
 * @param filename - Optional filename
 */
export async function uploadWorkoutToGarminBase64(
  base64Data: string,
  filename: string = "workout.fit"
) {
  try {
    // Decode base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Use the main upload function
    return await uploadWorkoutToGarmin(buffer, filename);
  } catch (error: any) {
    console.error("Upload to Garmin failed:", error);
    return {
      success: false,
      error: error.message || "Failed to decode and upload workout",
    };
  }
}
