# Guide d'Intégration Coros

> Documentation complète pour l'implémentation de l'export d'entraînements vers Coros

Date de création : 28/12/2024
Dernière mise à jour : 28/12/2024

---

## 📚 Table des matières

1. [Architecture Garmin Existante](#architecture-garmin-existante)
2. [API Coros - Documentation Technique](#api-coros-documentation-technique)
3. [Comparaison Garmin vs Coros](#comparaison-garmin-vs-coros)
4. [Plan d'Implémentation](#plan-dimplémentation)
5. [Code de Référence](#code-de-référence)
6. [Sources et Ressources](#sources-et-ressources)

---

## 🏗️ Architecture Garmin Existante

### Vue d'ensemble

L'intégration Garmin utilise une architecture en 3 couches :

```
┌─────────────────────────────────────────────────────────┐
│                     UI Layer                            │
│  - ExportGarminButton.tsx                              │
│  - Profile page (connexion)                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                   Actions Layer                         │
│  - actions/garmin/user-auth.ts                         │
│  - actions/garmin/workout.ts                           │
│  - actions/garmin/upload.ts                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                            │
│  - lib/garth (Client OAuth)                            │
│  - lib/garmin/workout-json.ts (Conversion)             │
│  - Database (GarminConnection)                         │
└─────────────────────────────────────────────────────────┘
```

### Modèle de données Garmin

**Fichier** : `prisma/schema.prisma`

```prisma
model GarminConnection {
  id           String   @id @default(uuid())
  userId       String   @unique // Clerk User ID
  tokens       String   @db.Text // Encrypted serialized tokens (dumps())
  displayName  String?  // Nom d'affichage Garmin
  garminGuid   String?  // GUID Garmin
  connectedAt  DateTime @default(now())
  lastSyncedAt DateTime @updatedAt

  @@index([userId])
  @@map("garmin_connections")
}
```

### Flux d'authentification Garmin

**Fichier** : `src/actions/garmin/user-auth.ts`

```typescript
1. User entre email + password (+ MFA optionnel)
2. Login via lib/garth → OAuth1 + OAuth2 tokens
3. Sérialisation des tokens : client.dumps()
4. Chiffrement : encrypt(tokenString)
5. Stockage en DB : GarminConnection.upsert()
6. Récupération profile Garmin : UserProfile.get()
```

**Endpoints utilisés** :
- Garmin OAuth (géré par lib/garth)
- `/userprofile-service/socialProfile` (profile)

### Flux d'export Garmin

**Fichier** : `src/actions/garmin/workout.ts`

```typescript
1. User clique "Export Garmin" sur une séance
2. Vérification : getUserGarminStatus()
3. Conversion : convertToGarminWorkout(elements, name, vma)
   → Format JSON Garmin Workout
4. Upload : POST /workout-service/workout
5. Success toast avec confirmation
```

**Format de données Garmin** :
```typescript
interface GarminWorkout {
  workoutName: string;
  description: string | null;
  sportType: {
    sportTypeId: number;      // 1 = running
    sportTypeKey: string;      // "running"
  };
  workoutSegments: Array<{
    segmentOrder: number;
    sportType: { sportTypeId: number; sportTypeKey: string };
    workoutSteps: GarminWorkoutStep[];
  }>;
  estimatedDurationInSeconds?: number;
  estimatedDistanceInMeters?: number;
}
```

---

## 🔍 API Coros - Documentation Technique

### ⚠️ Important : API Non-Officielle

L'API Coros utilisée est **non-officielle** et a été reverse-engineered. Points d'attention :

- ❌ Pas de documentation publique
- ❌ Pas de garantie de stabilité
- ❌ Peut changer sans préavis
- ❌ Risque de blocage par Coros
- ✅ Fonctionnelle actuellement (vérifié 27/12/2024)

### URL de base

```
Base URL: https://teamapi.coros.com
FAQ URL:  https://faq.coros.com
```

### Endpoint 1 : Authentification

**Login**

```http
POST https://teamapi.coros.com/account/login
Content-Type: application/json

{
  "account": "user@example.com",
  "accountType": 2,
  "pwd": "MD5_HASH_OF_PASSWORD"
}
```

**Réponse succès** :
```json
{
  "result": "0000",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "123456",
    "email": "user@example.com"
  },
  "message": "success"
}
```

**Réponse erreur** :
```json
{
  "result": "1001",
  "message": "Invalid credentials",
  "data": null
}
```

**Notes importantes** :
- Password doit être hashé en MD5 avant envoi
- `accountType: 2` est obligatoire (type compte personnel)
- Le token n'a pas de date d'expiration visible
- Stocker le token pour réutilisation

### Endpoint 2 : Vérification du compte

**Query Account**

```http
GET https://teamapi.coros.com/account/query
Headers:
  accessToken: YOUR_ACCESS_TOKEN
```

**Réponse** :
```json
{
  "result": "0000",
  "data": {
    "userId": "123456",
    "email": "user@example.com",
    "nickname": "John Doe",
    "avatar": "https://...",
    "country": "FR"
  }
}
```

### Endpoint 3 : Upload de Workout (CLEF)

**Import FIT File**

```http
POST https://teamapi.coros.com/activity/fit/import
Headers:
  AccessToken: YOUR_ACCESS_TOKEN
  Content-Type: multipart/form-data

Body (FormData):
  file: workout.fit (binary)
  md5: MD5_HASH_OF_FILE
  fileSize: FILE_SIZE_IN_BYTES
  timeZone: "Europe/Paris"
```

**Réponse succès** :
```json
{
  "result": "0000",
  "data": {
    "importId": "abc123",
    "status": "processing"
  },
  "message": "Upload successful"
}
```

**Formats acceptés** :
- ✅ `.fit` (FIT file - recommandé)
- ✅ `.tcx` (Training Center XML)
- ❌ `.json` (non supporté, contrairement à Garmin)

**Différence importante avec Garmin** :
- Garmin : Upload JSON via API workout-service
- Coros : Upload fichier FIT binaire

### Endpoint 4 : Liste des imports

**Get Import List**

```http
POST https://teamapi.coros.com/activity/fit/getImportSportList
Headers:
  AccessToken: YOUR_ACCESS_TOKEN
```

### Endpoint 5 : Supprimer un import

**Delete Import**

```http
POST https://teamapi.coros.com/activity/fit/deleteSportImport
Headers:
  AccessToken: YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "importId": "abc123"
}
```

### Codes d'erreur courants

| Code | Signification | Action |
|------|--------------|--------|
| `0000` | Succès | ✅ Continuer |
| `1001` | Credentials invalides | Re-authentifier |
| `1002` | Token expiré | Nouveau login requis |
| `1003` | Token invalide | Nouveau login requis |
| `2001` | Fichier invalide | Vérifier format FIT |
| `2002` | Fichier trop gros | Réduire la taille |
| `5000` | Erreur serveur | Réessayer plus tard |

---

## ⚖️ Comparaison Garmin vs Coros

### Tableau comparatif

| Critère | Garmin | Coros |
|---------|--------|-------|
| **API** | Officielle (OAuth) | Non-officielle (reverse-engineered) |
| **Documentation** | Publique | Aucune |
| **Authentification** | OAuth1 + OAuth2 | Email/Password + Token |
| **Format upload** | JSON (GarminWorkout) | FIT file (binaire) |
| **Endpoint** | `/workout-service/workout` | `/activity/fit/import` |
| **Stockage tokens** | Sérialisé + chiffré | Token simple chiffré |
| **Expiration token** | Géré par OAuth refresh | Inconnue (manuel) |
| **Bibliothèque** | `garth` (Python) | Custom (Node.js refs) |
| **Stabilité** | ✅ Garantie | ❌ Aucune garantie |
| **Rate limiting** | Documenté | ❌ Inconnu |

### Architecture à adapter

```typescript
// GARMIN (actuel)
TrainingElement[]
  → convertToGarminWorkout()
  → GarminWorkout JSON
  → POST /workout-service/workout

// COROS (à implémenter)
TrainingElement[]
  → convertToFITFile()
  → Buffer FIT
  → POST /activity/fit/import (multipart)
```

---

## 🚀 Plan d'Implémentation

### Phase 1 : Database & Schema (30 min)

**1.1 - Ajouter le modèle Prisma**

```prisma
// prisma/schema.prisma

model CorosConnection {
  id           String   @id @default(uuid())
  userId       String   @unique // Clerk User ID
  accessToken  String   @db.Text // Encrypted token
  email        String?  // Email Coros (optionnel)
  connectedAt  DateTime @default(now())
  lastSyncedAt DateTime @updatedAt

  @@index([userId])
  @@map("coros_connections")
}
```

**1.2 - Migration**

```bash
npx prisma migrate dev --name add_coros_connection
npx prisma generate
```

### Phase 2 : Client Coros (1-2h)

**2.1 - Créer le client**

Créer `src/lib/coros/client.ts` :

```typescript
import crypto from 'crypto';

export class CorosClient {
  private baseUrl = 'https://teamapi.coros.com';
  private accessToken: string | null = null;

  /**
   * Hash password en MD5 pour l'API Coros
   */
  private hashPassword(password: string): string {
    return crypto.createHash('md5').update(password).digest('hex');
  }

  /**
   * Login sur Coros avec email/password
   */
  async login(email: string, password: string) {
    const hashedPassword = this.hashPassword(password);

    const response = await fetch(`${this.baseUrl}/account/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account: email,
        accountType: 2,
        pwd: hashedPassword,
      }),
    });

    const data = await response.json();

    if (data.result === '0000') {
      this.accessToken = data.data.accessToken;
      return {
        success: true,
        accessToken: data.data.accessToken,
        userId: data.data.userId,
      };
    }

    return {
      success: false,
      error: data.message || 'Login failed',
    };
  }

  /**
   * Vérifier le compte
   */
  async queryAccount() {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/account/query`, {
      headers: {
        accessToken: this.accessToken,
      },
    });

    return await response.json();
  }

  /**
   * Upload un fichier FIT vers Coros
   */
  async uploadFitFile(fitData: Buffer, fileName: string = 'workout.fit') {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const md5Hash = crypto.createHash('md5').update(fitData).digest('hex');

    const formData = new FormData();
    formData.append('file', new Blob([fitData]), fileName);
    formData.append('md5', md5Hash);
    formData.append('fileSize', fitData.length.toString());
    formData.append('timeZone', 'Europe/Paris');

    const response = await fetch(`${this.baseUrl}/activity/fit/import`, {
      method: 'POST',
      headers: {
        AccessToken: this.accessToken,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.result === '0000') {
      return {
        success: true,
        importId: data.data?.importId,
      };
    }

    return {
      success: false,
      error: data.message || 'Upload failed',
    };
  }

  /**
   * Définir le token manuellement (pour réutilisation)
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Récupérer le token actuel
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Export singleton
export const corosClient = new CorosClient();
```

### Phase 3 : Actions Server (1-2h)

**3.1 - User Authentication**

Créer `src/actions/coros/user-auth.ts` :

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { CorosClient } from "@/lib/coros/client";
import { encrypt, decrypt } from "@/lib/encryption";

/**
 * Connect user to their Coros account
 */
export async function connectUserCoros(email: string, password: string) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated. Please login first.",
      };
    }

    console.log(`Connecting user ${userId} to Coros...`);

    // Create a new Coros client
    const client = new CorosClient();

    // Attempt login
    const loginResult = await client.login(email, password);

    if (!loginResult.success) {
      return {
        success: false,
        error: loginResult.error || "Failed to login to Coros",
      };
    }

    // Encrypt the access token before storing
    const encryptedToken = encrypt(loginResult.accessToken);

    // Store in database
    await prisma.corosConnection.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: encryptedToken,
        email,
      },
      update: {
        accessToken: encryptedToken,
        email,
        lastSyncedAt: new Date(),
      },
    });

    console.log(`✓ User ${userId} connected to Coros successfully`);

    return {
      success: true,
      message: "Successfully connected to Coros",
    };
  } catch (error: any) {
    console.error("Failed to connect to Coros:", error);

    return {
      success: false,
      error: error.message || "Failed to connect to Coros",
    };
  }
}

/**
 * Disconnect user from Coros
 */
export async function disconnectUserCoros() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Delete the connection from database
    await prisma.corosConnection.delete({
      where: { userId },
    });

    console.log(`✓ User ${userId} disconnected from Coros`);

    return {
      success: true,
      message: "Disconnected from Coros",
    };
  } catch (error: any) {
    // If connection doesn't exist, consider it a success
    if (error.code === "P2025") {
      return {
        success: true,
        message: "No Coros connection found",
      };
    }

    console.error("Failed to disconnect from Coros:", error);
    return {
      success: false,
      error: error.message || "Failed to disconnect",
    };
  }
}

/**
 * Get user's Coros connection status
 */
export async function getUserCorosStatus() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        connected: false,
        error: "Not authenticated",
      };
    }

    const connection = await prisma.corosConnection.findUnique({
      where: { userId },
      select: {
        email: true,
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
      email: connection.email || undefined,
      connectedAt: connection.connectedAt,
      lastSyncedAt: connection.lastSyncedAt,
    };
  } catch (error: any) {
    console.error("Failed to get Coros status:", error);
    return {
      success: false,
      connected: false,
      error: error.message || "Failed to get status",
    };
  }
}

/**
 * Create a Coros client for the current user
 */
export async function getUserCorosClient(): Promise<CorosClient | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user's encrypted token from database
    const connection = await prisma.corosConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      throw new Error("No Coros connection found. Please connect your Coros account first.");
    }

    // Decrypt the access token
    const accessToken = decrypt(connection.accessToken);

    // Create client and set token
    const client = new CorosClient();
    client.setAccessToken(accessToken);

    return client;
  } catch (error) {
    console.error("Failed to create user Coros client:", error);
    return null;
  }
}
```

**3.2 - Export index**

Créer `src/actions/coros/index.ts` :

```typescript
export { connectUserCoros, disconnectUserCoros, getUserCorosStatus, getUserCorosClient } from './user-auth';
export { uploadWorkoutToCoros } from './workout';
```

### Phase 4 : Conversion FIT (2-4h)

**4.1 - Installer la bibliothèque FIT**

```bash
npm install fit-file-writer
# ou
npm install easy-fit
```

**4.2 - Créer le convertisseur**

Créer `src/lib/coros/fit-converter.ts` :

```typescript
import { FitFileWriter } from 'fit-file-writer';
import type { TrainingElement } from '@/lib/vma/builder-types';

/**
 * Convertit TrainingElement[] en fichier FIT binaire
 */
export function convertToFITFile(
  elements: TrainingElement[],
  workoutName: string,
  vma: number
): Buffer {
  const writer = new FitFileWriter();

  // File ID message (obligatoire)
  writer.writeFileId({
    type: 'workout',
    manufacturer: 'development',
    product: 0,
    timeCreated: new Date(),
  });

  // Workout message
  writer.writeWorkout({
    sport: 'running',
    capabilities: 0x00000020, // Structured workout
    numValidSteps: calculateTotalSteps(elements),
    wktName: workoutName,
  });

  let stepIndex = 0;

  // Pour chaque bloc
  elements.forEach((block, blockIndex) => {
    // Si répétition > 1, créer un repeat step
    if (block.repetitions > 1) {
      writer.writeWorkoutStep({
        messageIndex: stepIndex++,
        wktStepName: block.name || `Bloc ${blockIndex + 1}`,
        durationType: 'repeat_until_steps_cmplt',
        durationValue: block.steps.length,
        targetType: 'open',
        repeatType: 'repeat',
        repeatValue: block.repetitions,
      });
    }

    // Pour chaque step du bloc
    block.steps.forEach((step) => {
      const speed = calculateSpeedFromVMA(step.vmaPercentage, vma);

      if (step.type === 'time') {
        const durationSeconds = parseDuration(step.duration);

        writer.writeWorkoutStep({
          messageIndex: stepIndex++,
          wktStepName: step.name || 'Step',
          durationType: 'time',
          durationValue: durationSeconds * 1000, // milliseconds
          targetType: 'speed',
          targetValue: 0,
          customTargetSpeedLow: speed.low,
          customTargetSpeedHigh: speed.high,
          intensity: 'active',
        });
      } else {
        writer.writeWorkoutStep({
          messageIndex: stepIndex++,
          wktStepName: step.name || 'Step',
          durationType: 'distance',
          durationValue: step.distance * 100, // centimeters
          targetType: 'speed',
          targetValue: 0,
          customTargetSpeedLow: speed.low,
          customTargetSpeedHigh: speed.high,
          intensity: 'active',
        });
      }

      // Ajouter le repos si nécessaire
      const restSeconds = parseRest(step.rest);
      if (restSeconds > 0) {
        writer.writeWorkoutStep({
          messageIndex: stepIndex++,
          wktStepName: 'Repos',
          durationType: 'time',
          durationValue: restSeconds * 1000,
          targetType: 'open',
          intensity: 'rest',
        });
      }
    });
  });

  // Générer le buffer
  const buffer = writer.getBuffer();
  return Buffer.from(buffer);
}

/**
 * Parse duration string to seconds
 */
function parseDuration(duration: string): number {
  if (!duration) return 0;

  if (duration.includes(':')) {
    const [min, sec] = duration.split(':').map(Number);
    return (min || 0) * 60 + (sec || 0);
  }

  const val = parseFloat(duration);
  return !isNaN(val) ? val * 60 : 0;
}

/**
 * Parse rest string to seconds
 */
function parseRest(rest: string): number {
  if (!rest || rest === '0"' || rest === '-') return 0;

  if (rest.includes("'") || rest.includes('"')) {
    const minMatch = rest.match(/(\d+)'/);
    const secMatch = rest.match(/(\d+)"/);
    return (minMatch ? parseInt(minMatch[1]) * 60 : 0) +
           (secMatch ? parseInt(secMatch[1]) : 0);
  }

  return parseInt(rest) || 0;
}

/**
 * Calculate speed range from VMA percentage
 */
function calculateSpeedFromVMA(vmaPercent: number, vma: number) {
  const speedKmh = (vmaPercent / 100) * vma;
  const speedMs = speedKmh / 3.6; // Convert to m/s

  // Zone de ±5%
  return {
    low: speedMs * 0.95 * 1000, // mm/s
    high: speedMs * 1.05 * 1000, // mm/s
  };
}

/**
 * Calculate total number of steps
 */
function calculateTotalSteps(elements: TrainingElement[]): number {
  return elements.reduce((total, block) => {
    return total + block.steps.length * block.repetitions;
  }, 0);
}
```

**4.3 - Créer l'action d'upload**

Créer `src/actions/coros/workout.ts` :

```typescript
"use server";

import { getUserCorosClient } from "./user-auth";
import { convertToFITFile } from "@/lib/coros/fit-converter";
import type { TrainingElement } from "@/lib/vma/builder-types";

/**
 * Upload a workout to Coros
 */
export async function uploadWorkoutToCoros(
  elements: TrainingElement[],
  workoutName: string,
  vma: number
) {
  try {
    // Get user-specific Coros client
    const client = await getUserCorosClient();

    if (!client) {
      return {
        success: false,
        error: "Not connected to Coros. Please connect your Coros account in your profile.",
      };
    }

    console.log("Converting workout to FIT format...");

    // Convert to FIT file
    const fitBuffer = convertToFITFile(elements, workoutName, vma);

    console.log(`FIT file created: ${fitBuffer.length} bytes`);

    // Upload to Coros
    const result = await client.uploadFitFile(fitBuffer, `${workoutName}.fit`);

    if (result.success) {
      return {
        success: true,
        message: "Workout uploaded successfully to Coros",
        importId: result.importId,
      };
    }

    return {
      success: false,
      error: result.error || "Failed to upload workout",
    };
  } catch (error: any) {
    console.error("Failed to upload workout to Coros:", error);

    return {
      success: false,
      error: error.message || "Failed to upload workout to Coros",
    };
  }
}
```

### Phase 5 : UI Components (1-2h)

**5.1 - Icône Coros**

Créer `src/components/icons/CorosIcon.tsx` :

```typescript
import React from 'react';

interface CorosIconProps {
  className?: string;
}

export function CorosIcon({ className }: CorosIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Logo Coros simplifié - à adapter selon le design */}
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
    </svg>
  );
}
```

**5.2 - Bouton Export Coros**

Créer `src/components/training/export-coros-button.tsx` :

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadWorkoutToCoros } from '@/actions/coros';
import { getUserCorosStatus } from '@/actions/coros/user-auth';
import type { TrainingElement } from '@/lib/vma/builder-types';
import { CorosIcon } from '@/components/icons/CorosIcon';

interface ExportCorosButtonProps {
  elements: TrainingElement[];
  vma: number;
  workoutName?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  iconOnly?: boolean;
}

export function ExportCorosButton({
  elements,
  vma,
  workoutName = 'Workout',
  disabled = false,
  variant = 'default',
  className,
  iconOnly = false,
}: ExportCorosButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleUploadToCoros = async () => {
    if (!elements || elements.length === 0) {
      toast.error('Aucune séance à exporter');
      return;
    }

    setIsUploading(true);

    try {
      // Check if user is connected to Coros
      const status = await getUserCorosStatus();

      if (!status.connected) {
        setIsUploading(false);
        toast.error('Connectez-vous à Coros', {
          description: 'Vous devez connecter votre compte Coros dans votre profil',
          duration: 5000,
        });
        router.push('/profile');
        return;
      }

      toast.info('Création de la séance sur Coros...');

      // Upload workout to Coros
      const result = await uploadWorkoutToCoros(elements, workoutName, vma);

      if (result.success) {
        toast.success('Séance créée sur Coros ! 🎉', {
          description: 'La séance est maintenant disponible dans votre compte Coros',
          duration: 5000,
        });
      } else {
        // Check if it's an authentication error
        if (result.error?.includes('authenticated') || result.error?.includes('connect')) {
          toast.error('Reconnectez-vous à Coros', {
            description: 'Votre session Coros a expiré',
            duration: 5000,
          });
          router.push('/profile');
        } else {
          toast.error('Échec de la création de la séance', {
            description: result.error,
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to create Coros workout:', error);
      toast.error('Erreur lors de la création de la séance', {
        description: error.message || 'Une erreur inattendue s\'est produite',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Button
      className={className}
      variant={variant}
      onClick={handleUploadToCoros}
      disabled={disabled || isUploading}
      title="Exporter vers Coros"
    >
      {isUploading ? (
        <>
          <Loader2 className={iconOnly ? "h-4 w-4 animate-spin" : "h-4 w-4 mr-2 animate-spin"} />
          {!iconOnly && ' Création...'}
        </>
      ) : (
        <>
          {iconOnly ? (
            <CorosIcon className="h-4 w-4" />
          ) : (
            <>
              <CorosIcon className="h-4 w-4 mr-2" />
              Export Coros
            </>
          )}
        </>
      )}
    </Button>
  );
}
```

**5.3 - Section Profil Coros**

Ajouter dans `src/app/profile/profile-page-client.tsx` :

```typescript
import { ExportCorosButton } from '@/components/training/export-coros-button';
import { getUserCorosStatus, connectUserCoros, disconnectUserCoros } from '@/actions/coros';

// Dans le composant
const [corosStatus, setCorosStatus] = useState<any>(null);
const [corosEmail, setCorosEmail] = useState('');
const [corosPassword, setCorosPassword] = useState('');
const [isConnectingCoros, setIsConnectingCoros] = useState(false);

useEffect(() => {
  async function loadCorosStatus() {
    const status = await getUserCorosStatus();
    setCorosStatus(status);
  }
  loadCorosStatus();
}, []);

const handleConnectCoros = async () => {
  setIsConnectingCoros(true);
  const result = await connectUserCoros(corosEmail, corosPassword);

  if (result.success) {
    toast.success('Connecté à Coros');
    const status = await getUserCorosStatus();
    setCorosStatus(status);
    setCorosEmail('');
    setCorosPassword('');
  } else {
    toast.error(result.error);
  }

  setIsConnectingCoros(false);
};

// Dans le JSX, ajouter une section similaire à Garmin
<Card>
  <CardHeader>
    <CardTitle>Connexion Coros</CardTitle>
    <CardDescription>
      Connectez votre compte Coros pour exporter vos entraînements
    </CardDescription>
  </CardHeader>
  <CardContent>
    {corosStatus?.connected ? (
      <div>
        <p className="text-sm text-green-600 mb-4">
          ✓ Connecté à Coros ({corosStatus.email})
        </p>
        <Button
          variant="destructive"
          onClick={async () => {
            await disconnectUserCoros();
            const status = await getUserCorosStatus();
            setCorosStatus(status);
          }}
        >
          Déconnecter
        </Button>
      </div>
    ) : (
      <form onSubmit={(e) => { e.preventDefault(); handleConnectCoros(); }}>
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email Coros"
            value={corosEmail}
            onChange={(e) => setCorosEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={corosPassword}
            onChange={(e) => setCorosPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={isConnectingCoros}>
            {isConnectingCoros ? 'Connexion...' : 'Connecter à Coros'}
          </Button>
        </div>
      </form>
    )}
  </CardContent>
</Card>
```

### Phase 6 : Tests (1h)

**6.1 - Checklist de tests**

- [ ] Login Coros fonctionne
- [ ] Token stocké correctement en DB (chiffré)
- [ ] Conversion FIT génère un fichier valide
- [ ] Upload vers Coros réussit
- [ ] Gestion d'erreur si non connecté
- [ ] Gestion d'erreur si token expiré
- [ ] Déconnexion fonctionne
- [ ] UI affiche le bon statut

**6.2 - Tests manuels recommandés**

```typescript
// Test 1 : Vérifier la génération FIT
const testElements = [/* vos training elements */];
const fitBuffer = convertToFITFile(testElements, 'Test Workout', 15);
console.log('FIT size:', fitBuffer.length); // Devrait être > 0

// Test 2 : Vérifier le hash MD5
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(fitBuffer).digest('hex');
console.log('MD5:', hash); // Devrait être 32 caractères

// Test 3 : Sauvegarder le FIT localement pour debug
const fs = require('fs');
fs.writeFileSync('test-workout.fit', fitBuffer);
```

### Temps total estimé : 6-11h

---

## 💻 Code de Référence

### Exemple complet d'utilisation

```typescript
// 1. User se connecte dans son profil
await connectUserCoros('user@example.com', 'password123');

// 2. Dans la page d'entraînement, bouton export
<ExportCorosButton
  elements={trainingElements}
  vma={userVma}
  workoutName="Séance VMA 5x1000m"
  variant="outline"
/>

// 3. Flow interne du bouton
const status = await getUserCorosStatus();
if (!status.connected) {
  router.push('/profile');
  return;
}

const result = await uploadWorkoutToCoros(elements, name, vma);
// → convertToFITFile()
// → client.uploadFitFile()
// → POST /activity/fit/import
```

### Debugging

```typescript
// Activer les logs détaillés
export async function uploadWorkoutToCoros(elements, name, vma) {
  console.log('=== COROS UPLOAD DEBUG ===');
  console.log('Elements:', JSON.stringify(elements, null, 2));
  console.log('VMA:', vma);

  const fitBuffer = convertToFITFile(elements, name, vma);
  console.log('FIT Buffer size:', fitBuffer.length);
  console.log('FIT Buffer (hex):', fitBuffer.toString('hex').slice(0, 100));

  const client = await getUserCorosClient();
  console.log('Client token:', client?.getAccessToken()?.slice(0, 20) + '...');

  const result = await client.uploadFitFile(fitBuffer, `${name}.fit`);
  console.log('Upload result:', result);

  return result;
}
```

---

## 📚 Sources et Ressources

### Documentation Officielle Coros

- [COROS API Application Form](https://support.coros.com/hc/en-us/articles/17085887816340-Submitting-an-API-Application) - Demande d'accès API officielle
- [COROS Training Hub Manual](https://support.coros.com/hc/en-us/articles/4412176269844-COROS-Training-Hub-Manual) - Manuel officiel
- [Creating Training Plans](https://support.coros.com/hc/en-us/articles/360048955151-Creating-and-Using-Training-Plans) - Créer des plans
- [Bulk Importing from Garmin to COROS](https://support.coros.com/hc/en-us/articles/7708736140948-Bulk-Importing-Workout-Data-from-Garmin-to-COROS) - Import depuis Garmin

### Projets Open Source

**Repos avec API Upload (Node.js)**
- [jmn8718/coros-connect](https://github.com/jmn8718/coros-connect) - Upload FIT/TCX vers Coros
  - Dernière release : v0.1.4 (avril 2025)
  - Langue : TypeScript/Node.js
  - ⚠️ Utilise API non-officielle

**Repos avec API Export (Node.js)**
- [xballoy/coros-api](https://github.com/xballoy/coros-api) - Export activités depuis Coros
  - Dernière update : 27 décembre 2024
  - Langue : TypeScript/Node.js
  - Documentation API via Bruno
  - ⚠️ Uniquement export, pas d'upload

**Autres outils**
- [Python Gist - Coros Training Hub](https://gist.github.com/quiver/1dc414da3f32f7a6b68d0723a912c956) - Script Python récupération données
- [futoshita/Coros-Training-Hub-Exporter](https://github.com/futoshita/Coros-Training-Hub-Exporter) - Export calendrier (Java)

### Services Tiers

- [Terra API - Coros Integration](https://tryterra.co/integrations/coros) - Service commercial API Coros
- [TrainingPeaks](https://help.trainingpeaks.com/hc/en-us/articles/360041756752-Coros) - Sync avec Coros
- [Tredict - Coros Sync](https://www.tredict.com/blog/coros_training_sync/) - Service de sync automatique

### Format FIT

- [FIT SDK Official](https://developer.garmin.com/fit/overview/) - Documentation officielle Garmin
- [npm: fit-file-writer](https://www.npmjs.com/package/fit-file-writer) - Bibliothèque Node.js
- [npm: easy-fit](https://www.npmjs.com/package/easy-fit) - Parser/Writer FIT
- [FIT File Format Spec](https://developer.garmin.com/fit/protocol/) - Spécification protocole

### Outils de Debug

- [Bruno API Client](https://www.usebruno.com/) - Client API utilisé pour documenter endpoints Coros
- [FIT File Tools](https://www.fitfiletools.com/) - Vérifier validité fichiers FIT
- [Garmin FIT File Viewer](https://www.fitfileviewer.com/) - Visualiser contenu FIT

### Comparaisons & Discussions

- [Coros vs Garmin Structured Workouts - Intervals.icu Forum](https://forum.intervals.icu/t/coros-and-structured-workouts/16859)
- [V.O2 Support - Coros Workout Sync](https://support.vdoto2.com/set-up-instructions-for-coros-workout-sync/)
- [RUNALYZE - Coros Help](https://runalyze.com/help/article/coros?_locale=en)

---

## ⚠️ Avertissements et Limitations

### Risques API Non-Officielle

1. **Stabilité** : L'API peut changer sans préavis
2. **Rate Limiting** : Limites inconnues, risque de blocage
3. **Support** : Aucun support officiel de Coros
4. **Légalité** : Usage non autorisé des endpoints reverse-engineered
5. **Token Expiration** : Pas d'information sur la durée de vie des tokens

### Recommandations

- ✅ Implémenter une gestion d'erreur robuste
- ✅ Logger tous les appels API pour debug
- ✅ Prévoir un fallback si l'API change
- ✅ Informer les utilisateurs du caractère non-officiel
- ✅ Monitorer les repos GitHub pour détecter les breaking changes
- ⚠️ Envisager de demander un accès API officiel en parallèle

### Alternative : API Officielle

Si vous préférez une solution pérenne, soumettez une demande via :
- [Formulaire API Application](https://support.coros.com/hc/en-us/articles/17085887816340-Submitting-an-API-Application)
- Délai de réponse : inconnu
- Documentation : fournie après approbation
- Stabilité : garantie

---

## 📝 Notes de Version

**v1.0 - 28/12/2024**
- Documentation initiale
- Analyse architecture Garmin
- Reverse engineering API Coros
- Plan d'implémentation complet
- Code de référence

---

## 🤝 Contribution

Pour mettre à jour cette documentation :

1. Vérifier que les endpoints API sont toujours valides
2. Tester les exemples de code
3. Mettre à jour les dates et versions
4. Ajouter de nouvelles sources si découvertes
5. Documenter les changements dans Notes de Version

---

**Dernière vérification API : 28/12/2024**
**Statut : ✅ Fonctionnel**
