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
    const session = await prisma.trainingSession.findUnique({
      where: { id },
    });
    return { success: true, session };
  } catch (error) {
    console.error('Error getting training session:', error);
    return { success: false, error: 'Failed to get training session' };
  }
}