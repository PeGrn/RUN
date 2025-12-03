export class OAuth1Token {
  oauth_token: string;
  oauth_token_secret: string;
  mfa_token: string | null;
  mfa_expiration_timestamp: Date | null;
  domain: string | null;

  constructor(
    oauth_token: string,
    oauth_token_secret: string,
    mfa_token: string | null = null,
    mfa_expiration_timestamp: Date | null = null,
    domain: string | null = null
  ) {
    this.oauth_token = oauth_token;
    this.oauth_token_secret = oauth_token_secret;
    this.mfa_token = mfa_token;
    this.mfa_expiration_timestamp = mfa_expiration_timestamp;
    this.domain = domain;
  }
}

export class OAuth2Token {
  scope: string;
  jti: string;
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  refresh_token_expires_in: number;
  refresh_token_expires_at: number;

  constructor(
    scope: string,
    jti: string,
    token_type: string,
    access_token: string,
    refresh_token: string,
    expires_in: number,
    expires_at: number,
    refresh_token_expires_in: number,
    refresh_token_expires_at: number
  ) {
    this.scope = scope;
    this.jti = jti;
    this.token_type = token_type;
    this.access_token = access_token;
    this.refresh_token = refresh_token;
    this.expires_in = expires_in;
    this.expires_at = expires_at;
    this.refresh_token_expires_in = refresh_token_expires_in;
    this.refresh_token_expires_at = refresh_token_expires_at;
  }

  get expired(): boolean {
    return this.expires_at < Date.now() / 1000;
  }

  get refresh_expired(): boolean {
    return this.refresh_token_expires_at < Date.now() / 1000;
  }

  toString(): string {
    return `${this.token_type.charAt(0).toUpperCase() + this.token_type.slice(1).toLowerCase()} ${this.access_token}`;
  }
}
