'use server';

import { prisma } from '@/lib/prisma';

export async function getPlanningData(year: number, month: number) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Récupérer les séances
    const sessions = await prisma.trainingSession.findMany({
      where: { sessionDate: { gte: startDate, lte: endDate, not: null } },
      select: { sessionDate: true }
    });

    // Récupérer les événements
    const events = await prisma.event.findMany({
      where: { eventDate: { gte: startDate, lte: endDate } },
      select: { eventDate: true }
    });

    // Formatter les dates en strings uniques YYYY-MM-DD
    const sessionDates = sessions.map(s => s.sessionDate!.toISOString().split('T')[0]);
    const eventDates = events.map(e => e.eventDate.toISOString().split('T')[0]);

    return { 
      success: true, 
      sessionDates: [...new Set(sessionDates)], 
      eventDates: [...new Set(eventDates)] 
    };
  } catch (error) {
    return { success: false, error: 'Failed to load planning' };
  }
}