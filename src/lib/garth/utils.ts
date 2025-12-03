const CAMEL_TO_SNAKE = /((?<=[a-z0-9])[A-Z]|(?!^)[A-Z](?=[a-z])|(?<=[a-zA-Z])[0-9])/g;

export function camelToSnake(camelStr: string): string {
  const snakeStr = camelStr.replace(CAMEL_TO_SNAKE, "_$1");
  return snakeStr.toLowerCase();
}

export function camelToSnakeDict(camelDict: Record<string, any>): Record<string, any> {
  /**
   * Converts a dictionary's keys from camel case to snake case. This version
   * handles nested dictionaries and lists.
   */
  const snakeDict: Record<string, any> = {};
  for (const [k, v] of Object.entries(camelDict)) {
    const newKey = camelToSnake(k);
    if (v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      snakeDict[newKey] = camelToSnakeDict(v);
    } else if (Array.isArray(v)) {
      snakeDict[newKey] = v.map((i) =>
        i !== null && typeof i === "object" && !Array.isArray(i) && !(i instanceof Date) ? camelToSnakeDict(i) : i
      );
    } else {
      snakeDict[newKey] = v;
    }
  }
  return snakeDict;
}

export function formatEndDate(end: Date | string | null): Date {
  if (end === null) {
    return new Date();
  } else if (typeof end === "string") {
    return new Date(end);
  }
  return end;
}

export function* dateRange(date_: Date | string, days: number): Generator<Date> {
  const date = typeof date_ === "string" ? new Date(date_) : date_;
  for (let day = 0; day < days; day++) {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - day);
    yield newDate;
  }
}

export function asDict(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Check if it's a class instance with properties
  if (typeof obj === "object" && obj.constructor !== Object && obj.constructor !== Array) {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      result[key] = asDict(value);
    }
    return result;
  }

  if (Array.isArray(obj)) {
    return obj.map((v) => asDict(v));
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  return obj;
}

export function getLocalizedDatetime(gmtTimestamp: number, localTimestamp: number): Date {
  const localDiff = localTimestamp - gmtTimestamp;
  const gmtTime = new Date(gmtTimestamp);

  // Create a new Date with the local offset applied
  const localTime = new Date(gmtTime.getTime() + localDiff);

  return localTime;
}
