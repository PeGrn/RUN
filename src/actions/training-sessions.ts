'use server';

import { prisma } from '@/lib/prisma';
import { uploadToS3, getS3Object, getSignedDownloadUrl } from '@/lib/s3';

// On garde l'interface pour le typage interne si besoin
export interface CreateSessionInput {
  name: string;
  description?: string;
  vma: number;
  totalDistance: number;
  totalTime: number;
}

/**
 * Crée une nouvelle séance et upload le PDF vers Minio
 * Utilise FormData pour gérer le fichier binaire proprement depuis le client
 */
export async function createTrainingSession(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const vma = parseFloat(formData.get('vma') as string);
    const totalDistance = parseFloat(formData.get('totalDistance') as string);
    const totalTime = parseFloat(formData.get('totalTime') as string);

    // Parsing du JSON pour les étapes
    const stepsJson = formData.get('steps') as string;
    const steps = stepsJson ? JSON.parse(stepsJson) : [];

    // Parsing de la date (optionnel)
    const sessionDateStr = formData.get('sessionDate') as string | null;
    const sessionDate = sessionDateStr ? new Date(sessionDateStr) : null;

    const file = formData.get('file') as File;
    
    if (!file || file.size === 0) {
      throw new Error('No PDF file provided');
    }

    const bytes = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(bytes);

    const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const fileName = `${sanitizedName}.pdf`;

    const uploadResult = await uploadToS3(pdfBuffer, fileName, 'application/pdf');

    const session = await prisma.trainingSession.create({
      data: {
        name,
        description,
        vma,
        totalDistance,
        totalTime,
        steps,
        pdfUrl: uploadResult.url,
        pdfKey: uploadResult.key,
        sessionDate,
      },
    });

    return { success: true, session };
  } catch (error) {
    console.error('Error creating training session:', error);
    return { success: false, error: 'Failed to create training session' };
  }
}

/**
 * Récupère le buffer PDF d'une séance (Utilisé pour l'envoi d'email serveur)
 */
export async function getSessionPdfBuffer(sessionId: string): Promise<Buffer | null> {
  try {
    // Validation de l'ID
    if (!sessionId || typeof sessionId !== 'string') {
      return null;
    }

    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: { pdfKey: true },
    });

    if (!session || !session.pdfKey) {
      return null;
    }

    return await getS3Object(session.pdfKey);
  } catch (error) {
    console.error('Error fetching PDF buffer:', error);
    return null;
  }
}

/**
 * --- FONCTION AJOUTÉE ---
 * Récupère l'URL signée (ou publique) pour le téléchargement côté client
 */
export async function getSessionPdfUrl(sessionId: string) {
  try {
    // Validation de l'ID
    if (!sessionId || typeof sessionId !== 'string') {
      return { success: false, error: 'Invalid session ID' };
    }

    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: { pdfKey: true, pdfUrl: true },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    // Si on a une clé, on génère une URL signée fraiche via S3
    if (session.pdfKey) {
      const url = await getSignedDownloadUrl(session.pdfKey);
      return { success: true, url };
    }

    // Fallback sur l'URL stockée si pas de clé (anciens enregistrements potentiels)
    return { success: true, url: session.pdfUrl };
  } catch (error) {
    console.error('Error getting PDF URL:', error);
    return { success: false, error: 'Failed to get PDF URL' };
  }
}

/**
 * Supprime une séance et le fichier S3 associé (optionnel)
 */
export async function deleteTrainingSession(id: string) {
  try {
    // Validation de l'ID
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid session ID' };
    }

    await prisma.trainingSession.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting training session:', error);
    return { success: false, error: 'Failed to delete training session' };
  }
}

/**
 * Récupère toutes les séances
 */
export async function getTrainingSessions() {
  try {
    const sessions = await prisma.trainingSession.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, sessions };
  } catch (error) {
    console.error('Error getting training sessions:', error);
    return { success: false, error: 'Failed to get training sessions' };
  }
}

/**
 * Récupère une séance par son ID
 */
export async function getTrainingSessionById(id: string) {
  try {
    // Validation de l'ID
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid session ID' };
    }

    const session = await prisma.trainingSession.findUnique({
      where: { id },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    return { success: true, session };
  } catch (error) {
    console.error('Error getting training session:', error);
    return { success: false, error: 'Failed to get training session' };
  }
}

/**
 * Récupère toutes les dates qui ont au moins une séance
 * Retourne un tableau de dates (format ISO) pour afficher les dots sur le calendrier
 */
export async function getSessionDates(year: number, month: number) {
  try {
    // Validation des paramètres
    if (!year || !month || year < 2000 || year > 2100 || month < 1 || month > 12) {
      return { success: false, error: 'Invalid date parameters' };
    }

    // Calculer le premier et dernier jour du mois
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const sessions = await prisma.trainingSession.findMany({
      where: {
        sessionDate: {
          gte: startDate,
          lte: endDate,
          not: null, // Optimisation : exclure les null directement dans la query
        },
      },
      select: {
        sessionDate: true,
      },
    });

    // Extraire les dates uniques en utilisant la timezone locale au lieu de UTC
    const dates = sessions.map((s) => {
      const date = s.sessionDate!;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });

    // Retourner les dates uniques
    const uniqueDates = [...new Set(dates)];

    return { success: true, dates: uniqueDates };
  } catch (error) {
    console.error('Error getting session dates:', error);
    return { success: false, error: 'Failed to get session dates' };
  }
}

/**
 * Récupère toutes les séances pour une date spécifique
 */
export async function getSessionsByDate(date: string) {
  try {
    // Parser la date au format YYYY-MM-DD
    const [year, month, day] = date.split('-').map(Number);

    // Validation de la date
    if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
      return { success: false, error: 'Invalid date format' };
    }

    // Créer les dates de début et fin du jour en timezone locale
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const sessions = await prisma.trainingSession.findMany({
      where: {
        sessionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, sessions };
  } catch (error) {
    console.error('Error getting sessions by date:', error);
    return { success: false, error: 'Failed to get sessions by date' };
  }
}