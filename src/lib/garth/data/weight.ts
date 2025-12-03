import { Data } from "./_base";
import { client as defaultClient, Client } from "../http";
import { camelToSnakeDict, getLocalizedDatetime } from "../utils";

export class WeightData extends Data {
  sample_pk!: number;
  calendar_date!: Date;
  weight!: number;
  source_type!: string;
  weight_delta!: number;
  timestamp_gmt!: number;
  datetime_utc!: Date;
  datetime_local!: Date;
  bmi: number | null = null;
  body_fat: number | null = null;
  body_water: number | null = null;
  bone_mass: number | null = null;
  muscle_mass: number | null = null;
  physique_rating: number | null = null;
  visceral_fat: number | null = null;
  metabolic_age: number | null = null;

  constructor(data: any = {}) {
    super();
    // Handle timestamp_gmt -> datetime_utc alias
    if (data.timestamp_gmt && !data.datetime_utc) {
      data.datetime_utc = new Date(data.timestamp_gmt);
    }
    // Handle date -> datetime_local alias with localization
    if (data.timestamp_gmt && data.date && !data.datetime_local) {
      data.datetime_local = getLocalizedDatetime(data.timestamp_gmt, data.date);
    }
    // Ensure calendar_date is a Date
    if (typeof data.calendar_date === "string") {
      data.calendar_date = new Date(data.calendar_date);
    }
    Object.assign(this, data);
  }

  static async get(day: Date | string, options: { client?: Client } = {}): Promise<WeightData | null> {
    const client = options.client || defaultClient;
    const dayStr = typeof day === "string" ? day : day.toISOString().split("T")[0];
    const path = `/weight-service/weight/dayview/${dayStr}`;

    const data = await client.connectapi(path);

    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return null;
    }

    const dayWeightList = (data as Record<string, any>).dateWeightList || [];

    if (!dayWeightList || dayWeightList.length === 0) {
      return null;
    }

    // Get first (most recent) weight entry for the day
    const weightData = camelToSnakeDict(dayWeightList[0]);
    return new WeightData(weightData);
  }

  static async listRange(
    end: Date | string | null = null,
    days: number = 1,
    options: { client?: Client; max_workers?: number } = {}
  ): Promise<WeightData[]> {
    const client = options.client || defaultClient;

    // Use formatEndDate logic
    let endDate: Date;
    if (end === null) {
      endDate = new Date();
    } else if (typeof end === "string") {
      endDate = new Date(end);
    } else {
      endDate = end;
    }

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const data = await client.connectapi(`/weight-service/weight/range/${startStr}/${endStr}?includeAll=true`);

    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return [];
    }

    const weightSummaries = (data as Record<string, any>).dailyWeightSummaries || [];
    const weightMetrics: any[] = [];

    for (const summary of weightSummaries) {
      if (summary.allWeightMetrics && Array.isArray(summary.allWeightMetrics)) {
        weightMetrics.push(...summary.allWeightMetrics);
      }
    }

    const weightDataList = weightMetrics.map((wd) => new WeightData(camelToSnakeDict(wd)));

    // Sort by datetime_utc ascending
    return weightDataList.sort((a, b) => a.datetime_utc.getTime() - b.datetime_utc.getTime());
  }
}
