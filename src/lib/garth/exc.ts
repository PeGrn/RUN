import { AxiosError } from "axios";

export class GarthException extends Error {
  msg: string;

  constructor(msg: string) {
    super(msg);
    this.msg = msg;
    this.name = "GarthException";
    Object.setPrototypeOf(this, GarthException.prototype);
  }
}

export class GarthHTTPError extends GarthException {
  error: AxiosError;

  constructor(msg: string, error: AxiosError) {
    super(msg);
    this.error = error;
    this.name = "GarthHTTPError";
    Object.setPrototypeOf(this, GarthHTTPError.prototype);
  }

  toString(): string {
    const statusInfo = this.error.response?.status ? ` (Status: ${this.error.response.status})` : '';
    const responseData = this.error.response?.data ? ` - ${JSON.stringify(this.error.response.data)}` : '';
    return `${this.msg}: ${this.error.message}${statusInfo}${responseData}`;
  }
}
