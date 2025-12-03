import { Stats } from "./_base";

const BASE_PATH = "/usersummary-service/stats/steps";

export class DailySteps extends Stats {
  total_steps!: number | null;
  total_distance!: number | null;
  step_goal!: number;

  static _path = `${BASE_PATH}/daily/{start}/{end}`;
  static _page_size = 28;

  constructor(calendar_date: Date, data: Partial<DailySteps> = {}) {
    super(calendar_date);
    Object.assign(this, data);
  }
}

export class WeeklySteps extends Stats {
  total_steps!: number;
  average_steps!: number;
  average_distance!: number;
  total_distance!: number;
  wellness_data_days_count!: number;

  static _path = `${BASE_PATH}/weekly/{end}/{period}`;
  static _page_size = 52;

  constructor(calendar_date: Date, data: Partial<WeeklySteps> = {}) {
    super(calendar_date);
    Object.assign(this, data);
  }
}
