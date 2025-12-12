import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { addWeeks, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { HomeContent } from "./home-content";

async function getSessionsAndEvents(weekOffset: number = 0) {
  const now = new Date();
  const targetWeek = addWeeks(now, weekOffset);
  const weekStart = startOfWeek(targetWeek, { locale: fr, weekStartsOn: 1 }); // Lundi
  const weekEnd = endOfWeek(targetWeek, { locale: fr, weekStartsOn: 1 }); // Dimanche

  const [sessions, events] = await Promise.all([
    prisma.trainingSession.findMany({
      where: {
        sessionDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: {
        sessionDate: 'asc',
      },
    }),
    prisma.event.findMany({
      where: {
        eventDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: {
        eventDate: 'asc',
      },
    }),
  ]);

  return { sessions, events, weekStart, weekEnd };
}

export default async function Home() {
  const { userId } = await auth();
  const user = await currentUser();

  // ÉTAPE 3 : Récupérer la VMA stockée dans les métadonnées
  // On cast en number ou null si non défini
  const userVma = (user?.publicMetadata?.vma as number) || null;
  const userRole = (user?.publicMetadata?.role as string) || 'athlete';
  const userStatus = (user?.publicMetadata?.status as string) || 'pending';

  // IMPORTANT : Ne charger les séances que si l'utilisateur est approuvé
  // Si l'utilisateur n'est pas approuvé, on affiche la version publique de la page
  const isApproved = userStatus === 'approved';

  // Récupérer semaine courante et semaine prochaine UNIQUEMENT si approuvé
  const [currentWeek, nextWeek] = isApproved
    ? await Promise.all([
        getSessionsAndEvents(0),
        getSessionsAndEvents(1),
      ])
    : [
        { sessions: [], events: [], weekStart: new Date(), weekEnd: new Date() },
        { sessions: [], events: [], weekStart: new Date(), weekEnd: new Date() },
      ];

  const firstName = user?.firstName || "Athlète";

  return (
    <HomeContent
      userId={isApproved ? userId : null} // Passer null si non approuvé pour afficher la version publique
      firstName={firstName}
      userVma={userVma} // On passe la VMA au composant client
      userRole={userRole}
      userStatus={userStatus}
      currentWeek={currentWeek}
      nextWeek={nextWeek}
    />
  );
}