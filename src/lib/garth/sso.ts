import axios, { AxiosInstance } from "axios";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { OAuth1Token, OAuth2Token } from "./auth_tokens";
import { GarthException } from "./exc";
import type { Client } from "./http";

const CSRF_RE = /name="_csrf"\s+value="(.+?)"/;
const TITLE_RE = /<title>(.+?)<\/title>/;
const OAUTH_CONSUMER_URL = "https://thegarth.s3.amazonaws.com/oauth_consumer.json";
let OAUTH_CONSUMER: { consumer_key: string; consumer_secret: string } | null = null;
const USER_AGENT = { "User-Agent": "com.garmin.android.apps.connectmobile" };

class GarminOAuth1Session {
  oauth: OAuth;
  token: OAuth.Token | null;
  axiosInstance: AxiosInstance;

  constructor(token: OAuth.Token | null = null, parentInstance?: AxiosInstance) {
    if (!OAUTH_CONSUMER) {
      throw new GarthException("OAuth consumer not initialized");
    }

    this.oauth = new OAuth({
      consumer: {
        key: OAUTH_CONSUMER.consumer_key,
        secret: OAUTH_CONSUMER.consumer_secret,
      },
      signature_method: "HMAC-SHA1",
      hash_function(baseString, key) {
        return crypto.createHmac("sha1", key).update(baseString).digest("base64");
      },
    });

    this.token = token;
    this.axiosInstance = parentInstance || axios.create();
  }

  async get(url: string, headers: Record<string, string> = {}, timeout?: number) {
    const requestData = {
      url,
      method: "GET" as const,
    };

    const authHeader = this.oauth.toHeader(this.oauth.authorize(requestData, this.token || undefined));

    return this.axiosInstance.get(url, {
      headers: { ...headers, ...authHeader },
      timeout,
    });
  }

  async post(url: string, headers: Record<string, string> = {}, data: Record<string, any> = {}, timeout?: number) {
    const requestData = {
      url,
      method: "POST" as const,
    };

    const authHeader = this.oauth.toHeader(this.oauth.authorize(requestData, this.token || undefined));

    return this.axiosInstance.post(url, data, {
      headers: { ...headers, ...authHeader },
      timeout,
    });
  }
}

async function initializeOAuthConsumer() {
  if (!OAUTH_CONSUMER) {
    const response = await axios.get(OAUTH_CONSUMER_URL);
    OAUTH_CONSUMER = response.data;
  }
}

export async function login(
  email: string,
  password: string,
  client?: Client,
  promptMfa?: (() => string | Promise<string>) | null,
  returnOnMfa: boolean = false
): Promise<[OAuth1Token, OAuth2Token] | ["needs_mfa", Record<string, any>]> {
  /**
   * Login to Garmin Connect.
   *
   * Args:
   *   email: Garmin account email
   *   password: Garmin account password
   *   client: Optional HTTP client to use
   *   promptMfa: Callable that prompts for MFA code. Returns on MFA if None.
   *   returnOnMfa: If True, returns dict with MFA info instead of prompting
   *
   * Returns:
   *   If returnOnMfa=false (default):
   *     [OAuth1Token, OAuth2Token]: OAuth tokens after login
   *   If returnOnMfa=true and MFA required:
   *     ['needs_mfa', object]: Contains needs_mfa and client_state for resumeLogin()
   */
  await initializeOAuthConsumer();

  if (!client) {
    throw new GarthException("Client is required");
  }

  // Define params based on domain
  const SSO = `https://sso.${client.domain}/sso`;
  const SSO_EMBED = `${SSO}/embed`;
  const SSO_EMBED_PARAMS = {
    id: "gauth-widget",
    embedWidget: "true",
    gauthHost: SSO,
  };
  const SIGNIN_PARAMS = {
    ...SSO_EMBED_PARAMS,
    gauthHost: SSO_EMBED,
    service: SSO_EMBED,
    source: SSO_EMBED,
    redirectAfterAccountLoginUrl: SSO_EMBED,
    redirectAfterAccountCreationUrl: SSO_EMBED,
  };

  // Set cookies
  await client.get("sso", "/sso/embed", { params: SSO_EMBED_PARAMS });

  // Get CSRF token
  await client.get("sso", "/sso/signin", {
    params: SIGNIN_PARAMS,
    referrer: true,
  });
  const csrfToken = getCsrfToken(client.lastResp?.data || "");

  // Submit login form with email and password
  const formData = new URLSearchParams({
    username: email,
    password: password,
    embed: "true",
    _csrf: csrfToken,
  });

  await client.post("sso", "/sso/signin", {
    params: SIGNIN_PARAMS,
    referrer: true,
    data: formData.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  let title = getTitle(client.lastResp?.data || "");

  // Handle MFA
  if (title.includes("MFA")) {
    if (returnOnMfa || promptMfa === null || promptMfa === undefined) {
      return [
        "needs_mfa",
        {
          signin_params: SIGNIN_PARAMS,
          client: client,
        },
      ];
    }

    await handleMfa(client, SIGNIN_PARAMS, promptMfa);
    title = getTitle(client.lastResp?.data || "");
  }

  if (title !== "Success") {
    throw new GarthException(`Unexpected title: ${title}`);
  }
  return _completeLogin(client);
}

async function getOauth1Token(ticket: string, client: Client): Promise<OAuth1Token> {
  const sess = new GarminOAuth1Session(null, client.sess);
  const baseUrl = `https://connectapi.${client.domain}/oauth-service/oauth/`;
  const loginUrl = `https://sso.${client.domain}/sso/embed`;
  const url = `${baseUrl}preauthorized?ticket=${ticket}&login-url=${loginUrl}&accepts-mfa-tokens=true`;

  const resp = await sess.get(url, USER_AGENT, client.timeout);

  // Parse query string response
  const parsed: Record<string, string> = {};
  const pairs = resp.data.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    parsed[key] = value;
  }

  return new OAuth1Token(
    parsed.oauth_token,
    parsed.oauth_token_secret,
    parsed.mfa_token || null,
    parsed.mfa_expiration_timestamp ? new Date(parsed.mfa_expiration_timestamp) : null,
    client.domain
  );
}

export async function exchange(oauth1: OAuth1Token, client: Client): Promise<OAuth2Token> {
  await initializeOAuthConsumer();

  const sess = new GarminOAuth1Session(
    {
      key: oauth1.oauth_token,
      secret: oauth1.oauth_token_secret,
    },
    client.sess
  );

  const data = oauth1.mfa_token ? { mfa_token: oauth1.mfa_token } : {};
  const baseUrl = `https://connectapi.${client.domain}/oauth-service/oauth/`;
  const url = `${baseUrl}exchange/user/2.0`;
  const headers = {
    ...USER_AGENT,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const resp = await sess.post(url, headers, data, client.timeout);
  const token = resp.data;
  return new OAuth2Token(
    token.scope,
    token.jti,
    token.token_type,
    token.access_token,
    token.refresh_token,
    token.expires_in,
    setExpirations(token).expires_at,
    token.refresh_token_expires_in,
    setExpirations(token).refresh_token_expires_at
  );
}

async function handleMfa(
  client: Client,
  signinParams: Record<string, any>,
  promptMfa: () => string | Promise<string>
): Promise<void> {
  const csrfToken = getCsrfToken(client.lastResp?.data || "");
  const mfaCode = await Promise.resolve(promptMfa());

  const mfaFormData = new URLSearchParams({
    "mfa-code": mfaCode,
    embed: "true",
    _csrf: csrfToken,
    fromPage: "setupEnterMfaCode",
  });

  await client.post("sso", "/sso/verifyMFA/loginEnterMfaCode", {
    params: signinParams,
    referrer: true,
    data: mfaFormData.toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
}

function setExpirations(token: Record<string, any>): Record<string, any> {
  token.expires_at = Math.floor(Date.now() / 1000 + token.expires_in);
  token.refresh_token_expires_at = Math.floor(Date.now() / 1000 + token.refresh_token_expires_in);
  return token;
}

function getCsrfToken(html: string): string {
  const match = CSRF_RE.exec(html);
  if (!match) {
    throw new GarthException("Couldn't find CSRF token");
  }
  return match[1];
}

function getTitle(html: string): string {
  const match = TITLE_RE.exec(html);
  if (!match) {
    throw new GarthException("Couldn't find title");
  }
  return match[1];
}

export async function resumeLogin(
  clientState: Record<string, any>,
  mfaCode: string
): Promise<[OAuth1Token, OAuth2Token]> {
  /**
   * Complete login after MFA code is provided.
   *
   * Args:
   *   clientState: The client state from login() when MFA was needed
   *   mfaCode: The MFA code provided by the user
   *
   * Returns:
   *   [OAuth1Token, OAuth2Token]: The OAuth tokens after login
   */
  const client = clientState.client;
  const signinParams = clientState.signin_params;
  await handleMfa(client, signinParams, () => mfaCode);
  return _completeLogin(client);
}

async function _completeLogin(client: Client): Promise<[OAuth1Token, OAuth2Token]> {
  /**
   * Complete the login process after successful authentication.
   *
   * Args:
   *   client: The HTTP client
   *
   * Returns:
   *   [OAuth1Token, OAuth2Token]: The OAuth tokens
   */
  // Parse ticket
  const ticketMatch = /embed\?ticket=([^"]+)"/.exec(client.lastResp?.data || "");
  if (!ticketMatch) {
    throw new GarthException("Couldn't find ticket in response");
  }
  const ticket = ticketMatch[1];

  const oauth1 = await getOauth1Token(ticket, client);
  const oauth2 = await exchange(oauth1, client);

  return [oauth1, oauth2];
}
