import { Stats } from "./_base";

const BASE_PATH = "/usersummary-service/stats/stress";

export class DailyStress extends Stats {
  overall_stress_level!: number;
  rest_stress_duration: number | null = null;
  low_stress_duration: number | null = null;
  medium_stress_duration: number | null = null;
  high_stress_duration: number | null = null;

  static _path = `${BASE_PATH}/daily/{start}/{end}`;
  static _page_size = 28;

  constructor(calendar_date: Date, data: Partial<DailyStress> = {}) {
    super(calendar_date);
    Object.assign(this, data);
  }
}

export class WeeklyStress extends Stats {
  value!: number;

  static _path = `${BASE_PATH}/weekly/{end}/{period}`;
  static _page_size = 52;

  constructor(calendar_date: Date, data: Partial<WeeklyStress> = {}) {
    super(calendar_date);
    Object.assign(this, data);
  }
}
