"use server";

import { client } from "@/lib/garth";
import { cookies } from "next/headers";

const GARMIN_TOKEN_COOKIE = "garmin_tokens";

export async function loginToGarmin(email: string, password: string) {
  try {
    const [oauth1, oauth2] = await client.login(email, password);

    // Store tokens in cookie (base64 encoded)
    const tokenString = client.dumps();
    const cookieStore = await cookies();

    cookieStore.set(GARMIN_TOKEN_COOKIE, tokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return {
      success: true,
      username: client.username,
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error.toString?.() || error.message || "Login failed",
    };
  }
}

export async function loginToGarminWithMFA(
  email: string,
  password: string,
  mfaCode?: string,
  clientState?: any
) {
  try {
    if (clientState && mfaCode) {
      // Resume login with MFA code
      const [oauth1, oauth2] = await client.resume_login(clientState, mfaCode);

      const tokenString = client.dumps();
      const cookieStore = await cookies();

      cookieStore.set(GARMIN_TOKEN_COOKIE, tokenString, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });

      return {
        success: true,
        username: client.username,
      };
    }

    // Initial login that may require MFA
    const result = await client.login(email, password, undefined, true);

    if (Array.isArray(result) && result[0] === "needs_mfa") {
      return {
        success: false,
        needsMfa: true,
        clientState: result[1],
      };
    }

    // No MFA needed
    const tokenString = client.dumps();
    const cookieStore = await cookies();

    cookieStore.set(GARMIN_TOKEN_COOKIE, tokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return {
      success: true,
      username: client.username,
    };
  } catch (error: any) {
    console.error("Login MFA error:", error);
    return {
      success: false,
      error: error.toString?.() || error.message || "Login failed",
    };
  }
}

export async function logoutFromGarmin() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(GARMIN_TOKEN_COOKIE);

    return {
      success: true,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Logout failed",
    };
  }
}

export async function getGarminAuth() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(GARMIN_TOKEN_COOKIE);

    if (!tokenCookie?.value) {
      return {
        isAuthenticated: false,
      };
    }

    // Load tokens into client
    client.loads(tokenCookie.value);

    return {
      isAuthenticated: true,
      username: client.username,
    };
  } catch (error: any) {
    return {
      isAuthenticated: false,
      error: error.message,
    };
  }
}

async function ensureAuthenticated() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(GARMIN_TOKEN_COOKIE);

  if (!tokenCookie?.value) {
    throw new Error("Not authenticated. Please login first.");
  }

  client.loads(tokenCookie.value);
}

export { ensureAuthenticated };
