import axios, { AxiosInstance, AxiosResponse } from "axios";
import axiosRetry from "axios-retry";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as sso from "./sso";
import { OAuth1Token, OAuth2Token } from "./auth_tokens";
import { GarthHTTPError } from "./exc";
import { asDict } from "./utils";

const USER_AGENT = { "User-Agent": "GCM-iOS-5.7.2.1" };

export class Client {
  sess: AxiosInstance;
  lastResp: AxiosResponse | null = null;
  domain: string = "garmin.com";
  oauth1_token: OAuth1Token | "needs_mfa" | null = null;
  oauth2_token: OAuth2Token | Record<string, any> | null = null;
  timeout: number = 10000;
  retries: number = 3;
  status_forcelist: number[] = [408, 429, 500, 502, 503, 504];
  backoff_factor: number = 0.5;
  pool_connections: number = 10;
  pool_maxsize: number = 10;
  _user_profile: Record<string, any> | null = null;

  constructor(session?: AxiosInstance, options: Record<string, any> = {}) {
    if (session) {
      this.sess = session;
    } else {
      // Create axios instance with cookie jar support
      const jar = new CookieJar();
      this.sess = wrapper(axios.create({ jar }));
    }

    this.sess.defaults.headers.common = {
      ...this.sess.defaults.headers.common,
      ...USER_AGENT,
    };
    this.configure({
      timeout: this.timeout,
      retries: this.retries,
      status_forcelist: this.status_forcelist,
      backoff_factor: this.backoff_factor,
      ...options,
    });
  }

  configure(
    options: {
      oauth1_token?: OAuth1Token | null;
      oauth2_token?: OAuth2Token | null;
      domain?: string | null;
      proxies?: Record<string, string> | null;
      ssl_verify?: boolean | null;
      timeout?: number | null;
      retries?: number | null;
      status_forcelist?: number[] | null;
      backoff_factor?: number | null;
      pool_connections?: number | null;
      pool_maxsize?: number | null;
    } = {}
  ): void {
    if (options.oauth1_token !== undefined) {
      this.oauth1_token = options.oauth1_token;
    }
    if (options.oauth2_token !== undefined) {
      this.oauth2_token = options.oauth2_token;
    }
    if (options.domain) {
      this.domain = options.domain;
    }
    if (options.proxies !== undefined && options.proxies !== null) {
      this.sess.defaults.proxy = false;
    }
    if (options.ssl_verify !== undefined && options.ssl_verify !== null) {
      this.sess.defaults.httpsAgent = options.ssl_verify
        ? undefined
        : new (require("https").Agent)({ rejectUnauthorized: false });
    }
    if (options.timeout !== undefined && options.timeout !== null) {
      this.timeout = options.timeout;
    }
    if (options.retries !== undefined && options.retries !== null) {
      this.retries = options.retries;
    }
    if (options.status_forcelist !== undefined && options.status_forcelist !== null) {
      this.status_forcelist = options.status_forcelist;
    }
    if (options.backoff_factor !== undefined && options.backoff_factor !== null) {
      this.backoff_factor = options.backoff_factor;
    }
    if (options.pool_connections !== undefined && options.pool_connections !== null) {
      this.pool_connections = options.pool_connections;
    }
    if (options.pool_maxsize !== undefined && options.pool_maxsize !== null) {
      this.pool_maxsize = options.pool_maxsize;
    }

    // Configure axios-retry
    axiosRetry(this.sess, {
      retries: this.retries,
      retryDelay: (retryCount) => {
        return retryCount * this.backoff_factor * 1000;
      },
      retryCondition: (error) => {
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response !== undefined && this.status_forcelist.includes(error.response.status))
        );
      },
    });
  }

  get user_profile(): Record<string, any> {
    if (!this._user_profile) {
      const profile = this.connectapi("/userprofile-service/socialProfile");
      if (!profile || typeof profile !== "object") {
        throw new Error("No profile from connectapi");
      }
      this._user_profile = profile as Record<string, any>;
    }
    return this._user_profile;
  }

  get profile(): Record<string, any> {
    return this.user_profile;
  }

  get username(): string {
    return this.user_profile.userName;
  }

  async request(
    method: string,
    subdomain: string,
    path: string,
    options: {
      api?: boolean;
      referrer?: string | boolean;
      headers?: Record<string, string>;
      [key: string]: any;
    } = {}
  ): Promise<AxiosResponse> {
    const { api = false, referrer = false, headers = {}, ...kwargs } = options;

    let url = `https://${subdomain}.${this.domain}`;
    url = new URL(path, url).toString();

    const requestHeaders = { ...headers };

    if (referrer === true && this.lastResp) {
      requestHeaders["referer"] = this.lastResp.config.url || "";
    }

    if (api) {
      if (!this.oauth1_token) {
        throw new Error("OAuth1 token is required for API requests");
      }
      if (!(this.oauth2_token instanceof OAuth2Token) || this.oauth2_token.expired) {
        await this.refresh_oauth2();
      }
      requestHeaders["Authorization"] = this.oauth2_token!.toString();
    }

    try {
      const response = await this.sess.request({
        method,
        url,
        headers: requestHeaders,
        timeout: this.timeout,
        ...kwargs,
      });
      this.lastResp = response;
      return response;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new GarthHTTPError("Error in request", error);
      }
      throw error;
    }
  }

  async get(subdomain: string, path: string, options: Record<string, any> = {}): Promise<AxiosResponse> {
    return this.request("GET", subdomain, path, options);
  }

  async post(subdomain: string, path: string, options: Record<string, any> = {}): Promise<AxiosResponse> {
    return this.request("POST", subdomain, path, options);
  }

  async delete(subdomain: string, path: string, options: Record<string, any> = {}): Promise<AxiosResponse> {
    return this.request("DELETE", subdomain, path, options);
  }

  async put(subdomain: string, path: string, options: Record<string, any> = {}): Promise<AxiosResponse> {
    return this.request("PUT", subdomain, path, options);
  }

  async login(
    email: string,
    password: string,
    promptMfa?: (() => string | Promise<string>) | null,
    returnOnMfa: boolean = false
  ): Promise<[OAuth1Token, OAuth2Token]> {
    const result = await sso.login(email, password, this, promptMfa, returnOnMfa);
    if (Array.isArray(result) && result[0] === "needs_mfa") {
      this.oauth1_token = "needs_mfa";
      this.oauth2_token = result[1];
      return result as any;
    }
    this.oauth1_token = result[0];
    this.oauth2_token = result[1];
    return result;
  }

  async resume_login(...args: Parameters<typeof sso.resumeLogin>): Promise<[OAuth1Token, OAuth2Token]> {
    const result = await sso.resumeLogin(args[0], args[1]);
    this.oauth1_token = result[0];
    this.oauth2_token = result[1];
    return result;
  }

  async refresh_oauth2(): Promise<void> {
    if (!this.oauth1_token || !(this.oauth1_token instanceof OAuth1Token)) {
      throw new Error("OAuth1 token is required for OAuth2 refresh");
    }
    // There is a way to perform a refresh of an OAuth2 token, but it
    // appears even Garmin uses this approach when the OAuth2 is expired
    this.oauth2_token = await sso.exchange(this.oauth1_token, this);
  }

  async connectapi(
    path: string,
    method: string = "GET",
    options: Record<string, any> = {}
  ): Promise<Record<string, any> | Array<Record<string, any>> | null> {
    const resp = await this.request(method, "connectapi", path, { api: true, ...options });
    if (resp.status === 204) {
      return null;
    }
    return resp.data;
  }

  async download(path: string, options: Record<string, any> = {}): Promise<Buffer> {
    const resp = await this.get("connectapi", path, { api: true, ...options });
    return Buffer.from(resp.data);
  }

  async upload(fp: fs.ReadStream, uploadPath: string = "/upload-service/upload"): Promise<Record<string, any>> {
    const fname = path.basename(fp.path.toString());
    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    formData.append("file", fp, fname);

    const result = await this.connectapi(uploadPath, "POST", {
      data: formData,
      headers: formData.getHeaders(),
    });

    if (!result || typeof result !== "object") {
      throw new Error("No result from upload");
    }
    return result as Record<string, any>;
  }

  dump(dirPath: string): void {
    dirPath = dirPath.replace(/^~/, os.homedir());
    fs.mkdirSync(dirPath, { recursive: true });

    if (this.oauth1_token) {
      fs.writeFileSync(path.join(dirPath, "oauth1_token.json"), JSON.stringify(asDict(this.oauth1_token), null, 4));
    }
    if (this.oauth2_token) {
      fs.writeFileSync(path.join(dirPath, "oauth2_token.json"), JSON.stringify(asDict(this.oauth2_token), null, 4));
    }
  }

  dumps(): string {
    const r = [];
    r.push(asDict(this.oauth1_token));
    r.push(asDict(this.oauth2_token));
    const s = JSON.stringify(r);
    return Buffer.from(s).toString("base64");
  }

  load(dirPath: string): void {
    dirPath = dirPath.replace(/^~/, os.homedir());

    const oauth1Data = JSON.parse(fs.readFileSync(path.join(dirPath, "oauth1_token.json"), "utf-8"));
    const oauth1 = new OAuth1Token(
      oauth1Data.oauth_token,
      oauth1Data.oauth_token_secret,
      oauth1Data.mfa_token || null,
      oauth1Data.mfa_expiration_timestamp ? new Date(oauth1Data.mfa_expiration_timestamp) : null,
      oauth1Data.domain || null
    );

    const oauth2Data = JSON.parse(fs.readFileSync(path.join(dirPath, "oauth2_token.json"), "utf-8"));
    const oauth2 = new OAuth2Token(
      oauth2Data.scope,
      oauth2Data.jti,
      oauth2Data.token_type,
      oauth2Data.access_token,
      oauth2Data.refresh_token,
      oauth2Data.expires_in,
      oauth2Data.expires_at,
      oauth2Data.refresh_token_expires_in,
      oauth2Data.refresh_token_expires_at
    );

    this.configure({
      oauth1_token: oauth1,
      oauth2_token: oauth2,
      domain: oauth1.domain || undefined,
    });
  }

  loads(s: string): void {
    const decoded = Buffer.from(s, "base64").toString();
    const [oauth1Data, oauth2Data] = JSON.parse(decoded);

    this.configure({
      oauth1_token: new OAuth1Token(
        oauth1Data.oauth_token,
        oauth1Data.oauth_token_secret,
        oauth1Data.mfa_token || null,
        oauth1Data.mfa_expiration_timestamp ? new Date(oauth1Data.mfa_expiration_timestamp) : null,
        oauth1Data.domain || null
      ),
      oauth2_token: new OAuth2Token(
        oauth2Data.scope,
        oauth2Data.jti,
        oauth2Data.token_type,
        oauth2Data.access_token,
        oauth2Data.refresh_token,
        oauth2Data.expires_in,
        oauth2Data.expires_at,
        oauth2Data.refresh_token_expires_in,
        oauth2Data.refresh_token_expires_at
      ),
      domain: oauth1Data.domain || undefined,
    });
  }
}

export const client = new Client();
