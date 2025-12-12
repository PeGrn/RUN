'use server';

import { prisma } from '@/lib/prisma';
import { isCoachOrAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server'; // Ajout de l'import manquant

/**
 * Crée un nouvel événement (Course, Rassemblement, etc.)
 */
export async function createEvent(formData: FormData) {
  try {
    // 1. Vérification des permissions
    const hasPermission = await isCoachOrAdmin();
    if (!hasPermission) {
      return { success: false, error: 'Non autorisé' };
    }

    // 2. Extraction des données
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const dateStr = formData.get('date') as string;

    if (!title || !dateStr) {
      return { success: false, error: 'Titre et date requis' };
    }

    // 3. Création
    await prisma.event.create({
      data: {
        title,
        description,
        type,
        eventDate: new Date(dateStr),
      },
    });

    // 4. Rafraîchir les caches
    revalidatePath('/planning');
    revalidatePath('/training');
    revalidatePath('/sessions'); // Mis à jour pour la page d'historique

    return { success: true };
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/**
 * Récupère les événements pour une date spécifique (utilisé par le calendrier)
 */
export async function getEventsByDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const events = await prisma.event.findMany({
      where: {
        eventDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    return { success: true, events };
  } catch (error) {
    console.error('Error fetching events by date:', error);
    return { success: false, error: 'Error fetching events' };
  }
}

/**
 * Récupère tous les événements pour l'historique
 */
export async function getUserEvents() {
  try {
    // Vérification que l'utilisateur est connecté
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Non autorisé' };

    const events = await prisma.event.findMany({
      orderBy: {
        eventDate: 'desc',
      },
    });

    return { success: true, events };
  } catch (error) {
    console.error('Error fetching user events:', error);
    return { success: false, error: 'Failed to fetch events' };
  }
}

/**
 * Met à jour un événement existant
 */
export async function updateEvent(eventId: string, formData: FormData) {
  try {
    // Vérification des permissions
    const hasPermission = await isCoachOrAdmin();
    if (!hasPermission) {
      return { success: false, error: 'Non autorisé' };
    }

    // Extraction des données
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const dateStr = formData.get('date') as string;

    if (!title || !dateStr) {
      return { success: false, error: 'Titre et date requis' };
    }

    // Mise à jour
    await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        type,
        eventDate: new Date(dateStr),
      },
    });

    // Rafraîchir les caches
    revalidatePath('/planning');
    revalidatePath('/training');
    revalidatePath('/sessions');

    return { success: true };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

/**
 * Supprime un événement
 */
export async function deleteEvent(eventId: string) {
  try {
    // Vérification des permissions (seul un coach/admin peut supprimer)
    const hasPermission = await isCoachOrAdmin();
    if (!hasPermission) {
      return { success: false, error: 'Non autorisé' };
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    // Rafraîchir les caches
    revalidatePath('/planning');
    revalidatePath('/sessions');

    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, error: 'Failed to delete event' };
  }
}