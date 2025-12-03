import { client as defaultClient, Client } from "../http";
import { dateRange, formatEndDate } from "../utils";

const MAX_WORKERS = 10;

export abstract class Data {
  static async get(_day: Date | string, _options: { client?: Client } = {}): Promise<any | any[] | null> {
    throw new Error("Method get() must be implemented by subclass");
  }

  static async list<T extends Data>(
    this: { new (...args: any[]): T; get(day: Date | string, options?: any): Promise<T | T[] | null> },
    end: Date | string | null = null,
    days: number = 1,
    options: { client?: Client; max_workers?: number } = {}
  ): Promise<T[]> {
    const client = options.client || defaultClient;
    const max_workers = options.max_workers || MAX_WORKERS;
    const endDate = formatEndDate(end);

    const fetchDate = async (date: Date): Promise<T | T[] | null> => {
      const day = await this.get(date, { client });
      return day || null;
    };

    const dates = Array.from(dateRange(endDate, days));

    // Implement controlled concurrency with Promise.all and chunks
    const chunkSize = max_workers;
    const results: (T | T[] | null)[] = [];

    for (let i = 0; i < dates.length; i += chunkSize) {
      const chunk = dates.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk.map(fetchDate));
      results.push(...chunkResults);
    }

    // Filter out null values and flatten lists
    const filtered = results.filter((day): day is T | T[] => day !== null);
    const flattened: T[] = [];
    for (const day of filtered) {
      if (Array.isArray(day)) {
        flattened.push(...day);
      } else {
        flattened.push(day);
      }
    }

    return flattened;
  }
}
