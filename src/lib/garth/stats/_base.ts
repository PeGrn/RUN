import { client as defaultClient, Client } from "../http";
import { camelToSnakeDict, formatEndDate } from "../utils";

export abstract class Stats {
  calendar_date: Date;

  static _path: string;
  static _page_size: number;

  constructor(calendar_date: Date) {
    this.calendar_date = calendar_date;
  }

  static async list<T extends Stats>(
    this: {
      new (calendar_date: Date, ...args: any[]): T;
      list(end: Date | string | null, period: number, options: { client?: Client }): Promise<T[]>;
      _path: string;
      _page_size: number;
    },
    end: Date | string | null = null,
    period: number = 1,
    options: { client?: Client } = {}
  ): Promise<T[]> {
    const client = options.client || defaultClient;
    const endDate = formatEndDate(end);
    const periodType = this._path.includes("daily") ? "days" : "weeks";

    if (period > this._page_size) {
      const page = await this.list(endDate, this._page_size, { client });
      if (!page || page.length === 0) {
        return [];
      }

      const newEndDate = new Date(endDate);
      if (periodType === "days") {
        newEndDate.setDate(newEndDate.getDate() - this._page_size);
      } else {
        newEndDate.setDate(newEndDate.getDate() - this._page_size * 7);
      }

      const previousPage = await this.list(newEndDate, period - this._page_size, { client });
      return [...previousPage, ...page];
    }

    const start = new Date(endDate);
    if (periodType === "days") {
      start.setDate(start.getDate() - (period - 1));
    } else {
      start.setDate(start.getDate() - (period - 1) * 7);
    }

    const path = this._path
      .replace("{start}", start.toISOString().split("T")[0])
      .replace("{end}", endDate.toISOString().split("T")[0])
      .replace("{period}", period.toString());

    const pageDirs = await client.connectapi(path);
    if (!Array.isArray(pageDirs) || pageDirs.length === 0) {
      return [];
    }

    let filtered = pageDirs.filter((d): d is Record<string, any> => typeof d === "object" && d !== null);

    if (filtered.length > 0 && "values" in filtered[0]) {
      filtered = filtered.map((stat) => {
        const { values, ...rest } = stat;
        return { ...rest, ...values };
      });
    }

    const snakeCased = filtered.map((stat) => camelToSnakeDict(stat));

    return snakeCased.map((stat) => {
      const calendarDate = new Date(stat.calendar_date);
      return new this(calendarDate, stat) as T;
    });
  }
}
