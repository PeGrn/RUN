'use server';

import { prisma } from '@/lib/prisma';
import { isCoachOrAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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

    return { success: true };
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, error: 'Erreur serveur' };
  }
}

export async function getEventsByDate(dateStr: string) {
    try {
        const date = new Date(dateStr);
        const startOfDay = new Date(date.setHours(0,0,0,0));
        const endOfDay = new Date(date.setHours(23,59,59,999));

        const events = await prisma.event.findMany({
            where: {
                eventDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });
        return { success: true, events };
    } catch (error) {
        return { success: false, error: 'Error fetching events' };
    }
}