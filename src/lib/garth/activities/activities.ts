import { client as defaultClient, Client } from "../http";
import { camelToSnakeDict } from "../utils";
import type { ActivitySummary, ActivityDetails } from "./types";

export class Activity {
  // Convert ActivitySummary from camelCase to snake_case for easier use
  activity_id!: number;
  activity_name!: string;
  description!: string | null;
  start_time_local!: string;
  start_time_gmt!: string;
  activity_type!: {
    type_id: number;
    type_key: string;
    parent_type_id: number;
  };
  distance!: number | null;
  duration!: number;
  elapsed_duration!: number;
  moving_duration!: number;
  elevation_gain!: number | null;
  elevation_loss!: number | null;
  average_speed!: number | null;
  max_speed!: number | null;
  average_hr!: number | null;
  max_hr!: number | null;
  average_running_cadence_in_steps_per_minute!: number | null;
  max_running_cadence_in_steps_per_minute!: number | null;
  steps!: number | null;
  calories!: number | null;
  bmr_calories!: number | null;
  average_temperature!: number | null;
  max_temperature!: number | null;
  min_temperature!: number | null;
  training_effect!: number | null;
  aerobic_training_effect!: number | null;
  anaerobic_training_effect!: number | null;
  strokes!: number | null;
  avg_strokes!: number | null;
  max_strokes!: number | null;
  avg_power!: number | null;
  max_power!: number | null;
  normalized_power!: number | null;
  left_balance!: number | null;
  right_balance!: number | null;
  vo2_max_value!: number | null;
  location_name!: string | null;
  lap_count!: number;
  favorite!: boolean;
  pr!: boolean;
  auto_calc_calories!: boolean;
  has_polyline!: boolean;
  has_images!: boolean;
  has_video!: boolean;
  moderate_intensity_minutes!: number;
  vigorous_intensity_minutes!: number;
  purposeful!: boolean;

  constructor(data: any) {
    Object.assign(this, data);
  }

  /**
   * Get a list of activities for a user
   * @param start - Start index (0-based)
   * @param limit - Number of activities to return (max 100)
   * @param options - Optional client
   */
  static async list(
    start: number = 0,
    limit: number = 20,
    options: { client?: Client } = {}
  ): Promise<Activity[]> {
    const client = options.client || defaultClient;

    const data = await client.connectapi(
      `/activitylist-service/activities/search/activities?start=${start}&limit=${limit}`
    );

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((activity) => {
      const snakeCased = camelToSnakeDict(activity);
      return new Activity(snakeCased);
    });
  }

  /**
   * Get activities within a date range
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @param options - Optional client and activity type
   */
  static async getByDateRange(
    startDate: string | Date,
    endDate: string | Date,
    options: { client?: Client; activityType?: string } = {}
  ): Promise<Activity[]> {
    const client = options.client || defaultClient;

    const startStr =
      typeof startDate === "string"
        ? startDate
        : startDate.toISOString().split("T")[0];
    const endStr =
      typeof endDate === "string"
        ? endDate
        : endDate.toISOString().split("T")[0];

    let url = `/activitylist-service/activities/search/activities?startDate=${startStr}&endDate=${endStr}`;

    if (options.activityType) {
      url += `&activityType=${options.activityType}`;
    }

    const data = await client.connectapi(url);

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((activity) => {
      const snakeCased = camelToSnakeDict(activity);
      return new Activity(snakeCased);
    });
  }

  /**
   * Get detailed information about a specific activity including laps, splits, metrics
   * @param activityId - The activity ID
   * @param options - Optional client
   */
  static async getDetails(
    activityId: number,
    options: { client?: Client } = {}
  ): Promise<any> {
    const client = options.client || defaultClient;

    const data = await client.connectapi(`/activity-service/activity/${activityId}`);

    if (!data || typeof data !== "object") {
      return null;
    }

    return camelToSnakeDict(data);
  }

  /**
   * Get last activity with full details (equivalent to Python's get_last_activity)
   * @param options - Optional client
   */
  static async getLastActivity(options: { client?: Client } = {}): Promise<any> {
    const activities = await Activity.list(0, 1, options);

    if (activities && activities.length > 0) {
      return activities[0];
    }

    return null;
  }

  /**
   * Get splits (km or mile splits) for an activity
   * @param activityId - The activity ID
   * @param options - Optional client
   */
  static async getSplits(
    activityId: number,
    options: { client?: Client } = {}
  ): Promise<any[]> {
    const client = options.client || defaultClient;

    const data = await client.connectapi(
      `/activity-service/activity/${activityId}/splits`
    );


    // Handle if data is an object with a splits array inside
    if (data && typeof data === "object" && !Array.isArray(data)) {
      // Check for common property names that might contain the splits array
      const splitsArray = (data as any).lapDTOs || (data as any).splits || (data as any).splitDTOs;

      if (Array.isArray(splitsArray)) {
        return splitsArray.map((split: any) => camelToSnakeDict(split));
      }
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((split) => camelToSnakeDict(split));
  }

  /**
   * Get split summaries (laps) for an activity
   * @param activityId - The activity ID
   * @param options - Optional client
   */
  static async getSplitSummaries(
    activityId: number,
    options: { client?: Client } = {}
  ): Promise<any[]> {
    const client = options.client || defaultClient;

    const data = await client.connectapi(
      `/activity-service/activity/${activityId}/split_summaries`
    );

    if (!data || typeof data !== "object") {
      return [];
    }

    // The API returns an object with a splitSummaries array
    const summaries = (data as any).splitSummaries || [];

    if (!Array.isArray(summaries)) {
      return [];
    }

    return summaries.map((split: any) => camelToSnakeDict(split));
  }

  /**
   * Get detailed metrics/samples for an activity (heart rate, cadence, power, etc.)
   * @param activityId - The activity ID
   * @param options - Optional client and metric keys
   */
  static async getMetrics(
    activityId: number,
    options: { client?: Client; metricKeys?: string[] } = {}
  ): Promise<any> {
    const client = options.client || defaultClient;

    let url = `/activity-service/activity/${activityId}/details`;

    // Common metric keys: heartRate, speed, cadence, power, elevation, distance, duration
    if (options.metricKeys && options.metricKeys.length > 0) {
      url += `?maxSize=1000000`;
    }

    const data = await client.connectapi(url);

    if (!data || typeof data !== "object") {
      return null;
    }

    return camelToSnakeDict(data);
  }

  /**
   * Get weather data for an activity
   * @param activityId - The activity ID
   * @param options - Optional client
   */
  static async getWeather(
    activityId: number,
    options: { client?: Client } = {}
  ): Promise<any> {
    const client = options.client || defaultClient;

    const data = await client.connectapi(
      `/activity-service/activity/${activityId}/weather`
    );

    if (!data || typeof data !== "object") {
      return null;
    }

    return camelToSnakeDict(data);
  }

  /**
   * Get gear information for an activity
   * @param activityId - The activity ID
   * @param options - Optional client
   */
  static async getGear(
    activityId: number,
    options: { client?: Client } = {}
  ): Promise<any> {
    const client = options.client || defaultClient;

    const details = await Activity.getDetails(activityId, options);

    return details?.gear_vo || null;
  }

  /**
   * Download activity data in GPX format
   * @param activityId - The activity ID
   * @param options - Optional client
   */
  static async downloadGPX(
    activityId: number,
    options: { client?: Client } = {}
  ): Promise<Buffer> {
    const client = options.client || defaultClient;

    return client.download(`/download-service/export/gpx/activity/${activityId}`);
  }

  /**
   * Download activity data in TCX format
   * @param activityId - The activity ID
   * @param options - Optional client
   */
  static async downloadTCX(
    activityId: number,
    options: { client?: Client } = {}
  ): Promise<Buffer> {
    const client = options.client || defaultClient;

    return client.download(`/download-service/export/tcx/activity/${activityId}`);
  }

  /**
   * Download activity data in original FIT format
   * @param activityId - The activity ID
   * @param options - Optional client
   */
  static async downloadFIT(
    activityId: number,
    options: { client?: Client } = {}
  ): Promise<Buffer> {
    const client = options.client || defaultClient;

    return client.download(`/download-service/files/activity/${activityId}`);
  }

  /**
   * Get a complete activity with all details (laps, splits, metrics, weather, gear)
   * @param activityId - The activity ID
   * @param options - Optional client
   */
  static async getFull(
    activityId: number,
    options: { client?: Client } = {}
  ): Promise<any> {
    const client = options.client || defaultClient;

    const [details, laps, splitSummaries, weather] = await Promise.all([
      Activity.getDetails(activityId, { client }),
      Activity.getSplits(activityId, { client }), // This contains the actual laps (lapDTOs)
      Activity.getSplitSummaries(activityId, { client }),
      Activity.getWeather(activityId, { client }).catch(() => null),
    ]);

    return {
      ...details,
      laps, // These are the actual laps with full metrics
      splits: splitSummaries, // These are split summaries (may be empty)
      weather,
    };
  }
}
