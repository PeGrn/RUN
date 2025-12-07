'use client';

import { useState } from 'react';
import Link from "next/link";
import { CalendarDays, ArrowRight, Dumbbell, Calendar, ChevronRight, ChevronLeft, ChevronDown, Clock, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { TrainingSession, Event } from "@prisma/client";
import type { TrainingElement } from "@/lib/vma";

interface WeekData {
  sessions: TrainingSession[];
  events: Event[];
  weekStart: Date;
  weekEnd: Date;
}

interface HomeContentProps {
  userId: string | null;
  firstName: string;
  currentWeek: WeekData;
  nextWeek: WeekData;
}

// Fonction utilitaire pour formater le temps
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Formate la distance : "200m" ou "1.50km"
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

// Fonction utilitaire pour générer le résumé de la séance
function generateSessionSummary(elements: TrainingElement[]): string {
  if (!elements || elements.length === 0) {
    return 'Aucun détail disponible';
  }

  const summary: string[] = [];
  let blockIndex = 1;

  elements.forEach((block) => {
    const blockTitle = block.name || `Bloc ${blockIndex}`;
    summary.push(`${blockIndex}. ${block.repetitions}x ${blockTitle}`);

    block.steps.forEach((step, stepIdx) => {
      const distance = formatDistance(step.distance);
      const intensity = `${step.vmaPercentage}% VMA`;
      const rest = step.rest !== '0"' ? ` - Récup: ${step.rest}` : '';
      const stepName = step.name || `Étape ${stepIdx + 1}`;

      summary.push(`   • ${stepName}: ${distance} à ${intensity}${rest}`);
    });

    blockIndex++;
  });

  return summary.join('\n');
}

// Composant SessionCard avec expansion
interface SessionCardProps {
  session: TrainingSession;
}

function SessionCard({ session }: SessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sessionSteps = (session.steps as unknown as TrainingElement[]) || [];

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-1 flex items-center gap-2">
                {session.name}
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <CalendarDays className="h-3 w-3" />
                {session.sessionDate && format(new Date(session.sessionDate), "EEEE d MMMM", { locale: fr })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </button>

      {isExpanded && (
        <CardContent className="border-t pt-4">
          {/* Description */}
          {session.description && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{session.description}</p>
            </div>
          )}

          {/* Indicateurs clés */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Route className="h-4 w-4" />
                Distance
              </div>
              <div className="text-xl font-bold">
                {formatDistance(session.totalDistance)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                Durée
              </div>
              <div className="text-xl font-bold">
                {formatTime(session.totalTime)}
              </div>
            </div>
          </div>

          {/* Programme détaillé */}
          {sessionSteps.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Programme</h4>
              <div className="p-3 rounded-lg bg-muted/30 text-xs font-mono whitespace-pre-line">
                {generateSessionSummary(sessionSteps)}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function HomeContent({ userId, firstName, currentWeek, nextWeek }: HomeContentProps) {
  const [showingNextWeek, setShowingNextWeek] = useState(false);

  // Déterminer quelle semaine afficher
  const displayedWeek = showingNextWeek ? nextWeek : currentWeek;
  const { sessions, events, weekStart, weekEnd } = displayedWeek;

  // Vérifier s'il y a du contenu dans la semaine prochaine
  const hasNextWeekContent = nextWeek.sessions.length > 0 || nextWeek.events.length > 0;

  const weekLabel = showingNextWeek ? "Semaine prochaine" : "Cette semaine";
  const weekDateRange = `${format(weekStart, "d MMM", { locale: fr })} - ${format(weekEnd, "d MMM", { locale: fr })}`;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative mx-auto px-4 py-16 sm:py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                ASUL Bron - Équipe ESL
              </span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {userId ? (
                <>
                  Bonjour <span className="text-primary">{firstName}</span> 👋
                </>
              ) : (
                <>
                  Bienvenue sur <span className="text-primary">ESL Team</span>
                </>
              )}
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {userId ? (
                "Voici un aperçu de votre semaine d'entraînement"
              ) : (
                "Votre plateforme d'entraînement personnalisée pour atteindre vos objectifs"
              )}
            </p>

            {!userId && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="text-base">
                  <Link href="/sign-in">
                    Se connecter
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                  <Link href="/sign-up">
                    Créer un compte
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        {userId ? (
          // Vue utilisateur connecté
          <div className="max-w-5xl mx-auto space-y-8">
            {/* En-tête de semaine avec navigation */}
            {/* MODIFICATION : flex-col sur mobile pour que les boutons passent dessous */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{weekLabel}</h2>
                  <p className="text-sm text-muted-foreground">{weekDateRange}</p>
                </div>
                {!showingNextWeek && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    Actuelle
                  </Badge>
                )}
              </div>

              {/* MODIFICATION : w-full sur mobile pour prendre toute la largeur */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowingNextWeek(false)}
                  disabled={!showingNextWeek}
                  className="flex-1 md:flex-none" // flex-1 pour équilibrer la largeur sur mobile
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Semaine actuelle
                </Button>
                
                {hasNextWeekContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowingNextWeek(true)}
                    disabled={showingNextWeek}
                    className="flex-1 md:flex-none" // flex-1 pour équilibrer la largeur sur mobile
                  >
                    Semaine prochaine
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {/* Séances à venir */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">Séances d'entraînement</h3>
                  <p className="text-sm text-muted-foreground">
                    {sessions.length > 0 
                      ? `${sessions.length} séance${sessions.length > 1 ? 's' : ''} planifiée${sessions.length > 1 ? 's' : ''}`
                      : "Aucune séance planifiée"
                    }
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/planning">
                    Planning complet
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {sessions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {sessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-center mb-4">
                      Aucune séance planifiée pour {showingNextWeek ? "la semaine prochaine" : "cette semaine"}
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/planning">
                        Consulter le planning
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Événements à venir */}
            {events.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">Événements</h3>
                    <p className="text-sm text-muted-foreground">
                      Courses et rassemblements
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {events.map((event) => (
                    <Card key={event.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-1">
                              {event.title}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(event.eventDate), "EEEE d MMMM", { locale: fr })}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="shrink-0"
                          >
                            {event.type === 'race' ? '🏁 Course' : 
                             event.type === 'gathering' ? '🍺 Social' : 
                             '📅 Autre'}
                          </Badge>
                        </div>
                      </CardHeader>
                      {event.description && (
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Actions rapides */}
            <section>
              <h3 className="text-xl font-semibold mb-6">Actions rapides</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                  <Link href="/training" className="block h-full">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Dumbbell className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">
                          Créer un entraînement
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        Construisez votre séance personnalisée
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>

                <Card className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                  <Link href="/planning" className="block h-full">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <CalendarDays className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">
                          Planning complet
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        Consultez toutes vos séances planifiées
                      </CardDescription>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            </section>
          </div>
        ) : (
          // Vue utilisateur non connecté
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6 md:grid-cols-3 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Planning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Consultez et téléchargez vos séances d'entraînement planifiées
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    Création
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Créez vos propres programmes d'entraînement personnalisés
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Événements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Suivez les courses et rassemblements du club
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  Prêt à commencer ?
                </CardTitle>
                <CardDescription className="text-base">
                  Rejoignez l'équipe ESL et accédez à tous les outils d'entraînement
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/sign-in">
                    Se connecter
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/sign-up">
                    Créer un compte
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}