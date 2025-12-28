"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Client } from "@/lib/garth/http";
import { UserProfile } from "@/lib/garth/users/profile";
import { encrypt, decrypt } from "@/lib/encryption";

/**
 * Connect user to their Garmin account
 * This initiates the OAuth flow and stores encrypted tokens
 */
export async function connectUserGarmin(email: string, password: string, mfaCode?: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated. Please login first.",
      };
    }

    console.log(`Connecting user ${userId} to Garmin...`);

    // Create a new Garmin client for this login attempt
    const client = new Client();

    // Attempt login
    // The 3rd parameter is a function that returns the MFA code
    // The 4th parameter (true) enables MFA detection
    const result = await client.login(
      email,
      password,
      mfaCode ? () => mfaCode : null,
      true
    ) as any;

    // Check if MFA is required
    if (Array.isArray(result) && result[0] === "needs_mfa") {
      return {
        success: false,
        mfaRequired: true,
        error: "MFA code required",
        clientState: result[1], // For resuming login with MFA
      };
    }

    // After successful login, tokens are automatically stored in the client
    // Use dumps() to serialize all tokens into a JSON string
    const tokenString = client.dumps();

    if (!tokenString) {
      console.error("Client state after login:", {
        hasOauth1Token: !!client.oauth1_token,
        hasOauth2Token: !!client.oauth2_token,
      });
      return {
        success: false,
        error: "Failed to obtain Garmin tokens",
      };
    }

    // Get user profile to display name
    let displayName = null;
    let garminGuid = null;
    try {
      const profile = await UserProfile.get({ client });
      displayName = profile.full_name || profile.display_name;
      garminGuid = profile.garmin_guid;
      console.log(`✓ Retrieved Garmin profile: ${displayName} (GUID: ${garminGuid})`);
    } catch (error) {
      console.warn("Failed to fetch Garmin profile:", error);
      // Continue without profile info
    }

    // Encrypt the serialized tokens before storing
    const encryptedTokens = encrypt(tokenString);

    // Store in database (upsert - update if exists, create if not)
    await prisma.garminConnection.upsert({
      where: { userId },
      create: {
        userId,
        tokens: encryptedTokens,
        displayName,
        garminGuid,
      },
      update: {
        tokens: encryptedTokens,
        displayName,
        garminGuid,
        lastSyncedAt: new Date(),
      },
    });

    console.log(`✓ User ${userId} connected to Garmin successfully`);

    return {
      success: true,
      message: "Successfully connected to Garmin",
      displayName,
    };
  } catch (error: any) {
    console.error("Failed to connect to Garmin:", error);

    // Check for specific error types
    if (error.message?.includes("Incorrect username or password")) {
      return {
        success: false,
        error: "Identifiants incorrects",
      };
    }

    if (error.message?.includes("MFA")) {
      return {
        success: false,
        mfaRequired: true,
        error: "Code MFA requis",
      };
    }

    return {
      success: false,
      error: error.message || "Échec de la connexion à Garmin",
    };
  }
}

/**
 * Disconnect user from Garmin
 */
export async function disconnectUserGarmin() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Delete the connection from database
    await prisma.garminConnection.delete({
      where: { userId },
    });

    console.log(`✓ User ${userId} disconnected from Garmin`);

    return {
      success: true,
      message: "Disconnected from Garmin",
    };
  } catch (error: any) {
    // If connection doesn't exist, consider it a success
    if (error.code === "P2025") {
      return {
        success: true,
        message: "No Garmin connection found",
      };
    }

    console.error("Failed to disconnect from Garmin:", error);
    return {
      success: false,
      error: error.message || "Failed to disconnect",
    };
  }
}

/**
 * Get user's Garmin connection status
 */
export async function getUserGarminStatus() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        connected: false,
        error: "Not authenticated",
      };
    }

    const connection = await prisma.garminConnection.findUnique({
      where: { userId },
      select: {
        displayName: true,
        garminGuid: true,
        connectedAt: true,
        lastSyncedAt: true,
      },
    });

    if (!connection) {
      return {
        success: true,
        connected: false,
      };
    }

    return {
      success: true,
      connected: true,
      displayName: connection.displayName || undefined,
      garminGuid: connection.garminGuid || undefined,
      connectedAt: connection.connectedAt,
      lastSyncedAt: connection.lastSyncedAt,
    };
  } catch (error: any) {
    console.error("Failed to get Garmin status:", error);
    return {
      success: false,
      connected: false,
      error: error.message || "Failed to get status",
    };
  }
}

/**
 * Create a Garmin client for the current user
 * This is used internally by other Garmin actions
 */
export async function getUserGarminClient(): Promise<Client | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user's encrypted tokens from database
    const connection = await prisma.garminConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      throw new Error("No Garmin connection found. Please connect your Garmin account first.");
    }

    // Decrypt the serialized tokens
    const tokenString = decrypt(connection.tokens);

    // Create client and load tokens using loads()
    const client = new Client();
    client.loads(tokenString);

    return client;
  } catch (error) {
    console.error("Failed to create user Garmin client:", error);
    return null;
  }
}
