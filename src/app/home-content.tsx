'use client';

import { useState, useMemo } from 'react';
import Link from "next/link";
import { 
  CalendarDays, 
  ArrowRight, 
  Dumbbell, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  ChevronDown, 
  Clock, 
  Route, 
  Repeat, 
  Activity, 
  Flag, 
  Beer,
  BarChart3,
  List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { TrainingSession, Event } from "@prisma/client";
import type { TrainingElement } from "@/lib/vma";
import { calculateVMAProgram, convertBuilderElementsToSteps } from "@/lib/vma";
import { SpeedChart } from "@/components/training/charts/speed-chart";
import { cn } from "@/lib/utils";
import { VmaDialog } from '@/components/settings/vma-dialog';

interface WeekData {
  sessions: TrainingSession[];
  events: Event[];
  weekStart: Date;
  weekEnd: Date;
}

interface HomeContentProps {
  userId: string | null;
  firstName: string;
  userVma: number | null;
  currentWeek: WeekData;
  nextWeek: WeekData;
}

// --- UTILITAIRES ---

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)}km`;
}

function formatPace(speedKmh: number): string {
  if (!speedKmh || speedKmh <= 0) return "";
  const secondsPerKm = 3600 / speedKmh;
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}'${secs.toString().padStart(2, '0')}/km`;
}

function calculateSplit200m(speedKmh: number): string {
  if (speedKmh <= 0) return "";
  const seconds = (0.2 / speedKmh) * 3600;
  const rounded = Math.round(seconds);
  if (rounded < 60) return `${rounded}"`;
  return formatTime(rounded);
}

function getIntensityColor(vmaPercentage: number): string {
  if (vmaPercentage < 70) return "text-green-600";
  if (vmaPercentage < 85) return "text-blue-600";
  if (vmaPercentage < 100) return "text-orange-500";
  return "text-red-600";
}

function getIntensityLabel(vmaPercentage: number): string {
  if (vmaPercentage < 70) return "Allure EF";
  if (vmaPercentage < 90) return "Allure Active";
  return "Allure VMA";
}

function calculateTargetTime(distanceMeters: number, vmaPercent: number, userVma: number): string {
  const targetSpeedKmh = userVma * (vmaPercent / 100);
  if (targetSpeedKmh <= 0) return "-";
  const timeSeconds = (distanceMeters / 1000) / targetSpeedKmh * 3600;
  return formatTime(timeSeconds);
}

// --- COMPOSANT VISUEL DES ÉTAPES ---

function ProgramSteps({ elements, userVma }: { elements: TrainingElement[], userVma: number | null }) {
  if (!elements || elements.length === 0) return <p className="text-sm text-muted-foreground">Aucun détail</p>;

  return (
    <div className="space-y-4 pt-2">
      {elements.map((block, blockIndex) => {
        const isRepetition = block.repetitions > 1;

        return (
          <div key={blockIndex} className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {blockIndex + 1}
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className={cn("relative flex flex-col gap-2", isRepetition && "pr-12")}>
                
                {block.steps.map((step, stepIndex) => {
                  const isTimeBased = step.type === 'time';
                  const speed = userVma ? userVma * (step.vmaPercentage / 100) : 0;
                  const targetPace = (userVma && speed > 0) ? formatPace(speed) : null;
                  const mainValue = isTimeBased ? step.duration : formatDistance(step.distance);
                  
                  let secondaryValue = null;
                  let effectiveDistance = step.distance;

                  if (userVma && speed > 0) {
                    if (isTimeBased) {
                      let seconds = 0;
                      if (step.duration && step.duration.includes(':')) {
                        const [m, s] = step.duration.split(':').map(Number);
                        seconds = (m || 0) * 60 + (s || 0);
                      } else if (step.duration) {
                        seconds = parseFloat(step.duration) * 60;
                      }
                      effectiveDistance = (seconds * speed * 1000) / 3600;
                      secondaryValue = `~${formatDistance(effectiveDistance)}`;
                    } else {
                      effectiveDistance = step.distance;
                      const timeSeconds = (step.distance / 1000 / speed) * 3600;
                      secondaryValue = formatTime(timeSeconds);
                    }
                  }

                  const split200 = (userVma && speed > 0 && effectiveDistance > 200) 
                    ? calculateSplit200m(speed) 
                    : null;

                  return (
                    <div key={stepIndex} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">
                          {mainValue}
                        </span>
                        
                        {secondaryValue ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-primary flex items-baseline gap-1">
                              <span>({secondaryValue}</span>
                              {targetPace && (
                                <span className="text-xs text-muted-foreground font-normal">
                                  @ {targetPace}
                                </span>
                              )}
                              <span>)</span>
                            </span>
                            
                            {split200 && (
                              <span className="text-[10px] font-medium text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                200m: {split200}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            à {(step.vmaPercentage)}% VMA
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 sm:mt-0">
                        {secondaryValue && (
                           <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                             {step.vmaPercentage}% VMA
                           </span>
                        )}

                        <span className={cn("text-xs font-semibold uppercase", getIntensityColor(step.vmaPercentage))}>
                          {getIntensityLabel(step.vmaPercentage)}
                        </span>
                        
                        <div className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <span className="text-[10px]">R:</span> {(!step.rest || step.rest === '0"' || step.rest === '0') ? "0" : step.rest}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isRepetition && (
                  <div className="absolute top-1/2 -right-0 -translate-y-1/2 flex flex-col items-center gap-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white shadow-md">
                      {block.repetitions}x
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <Repeat className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>
              
              {isRepetition && (
                 <div className="h-full w-4 absolute right-4 top-0 border-r-2 border-orange-200 rounded-r-lg -z-10" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- SESSION CARD ---

function SessionCard({ session, userVma }: { session: TrainingSession, userVma: number | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sessionSteps = (session.steps as unknown as TrainingElement[]) || [];

  // Calcul du programme complet pour le graphique
  const program = useMemo(() => {
    if (!sessionSteps.length) return null;
    const steps = convertBuilderElementsToSteps(sessionSteps);
    // Utiliser la VMA utilisateur si dispo, sinon une valeur par défaut pour visualiser l'intensité
    const calcVma = userVma || 15;
    return calculateVMAProgram(steps, calcVma);
  }, [sessionSteps, userVma]);

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden bg-slate-50/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <CardHeader className="bg-white">
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
        <CardContent className="border-t pt-6 pb-6 px-4 sm:px-6">
          {session.description && (
            <div className="mb-6 p-3 bg-white rounded-md border text-sm text-muted-foreground italic">
              "{session.description}"
            </div>
          )}

          {/* Stats rapides */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-lg bg-white border shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                <Route className="h-3 w-3" />
                Distance
              </div>
              <div className="text-xl font-bold text-slate-900">
                {formatDistance(session.totalDistance)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white border shadow-sm">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                <Clock className="h-3 w-3" />
                Durée
              </div>
              <div className="text-xl font-bold text-slate-900">
                {formatTime(session.totalTime)}
              </div>
            </div>
          </div>

          {/* Système d'Onglets : Détail vs Graphique */}
          {sessionSteps.length > 0 && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Détail</span>
                  <span className="sm:hidden">Détail</span>
                </TabsTrigger>
                <TabsTrigger value="graph" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Graphique</span>
                  <span className="sm:hidden">Graphique</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-0">
                {!userVma && (
                  <div className="mb-4 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100 flex items-center justify-center">
                    ⚠️ Configurez votre VMA pour voir vos allures personnalisées
                  </div>
                )}
                <ProgramSteps elements={sessionSteps} userVma={userVma} />
              </TabsContent>
              
              <TabsContent value="graph" className="mt-0">
                {program ? (
                  <div className="bg-white p-2 sm:p-4 rounded-lg border shadow-sm">
                    <SpeedChart program={program} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Données insuffisantes pour le graphique
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// --- HOME CONTENT PRINCIPAL ---

export function HomeContent({ userId, firstName, userVma, currentWeek, nextWeek }: HomeContentProps) {
  const [showingNextWeek, setShowingNextWeek] = useState(false);
  const [vmaDialogOpen, setVmaDialogOpen] = useState(false);

  const displayedWeek = showingNextWeek ? nextWeek : currentWeek;
  const { sessions, events, weekStart, weekEnd } = displayedWeek;
  const hasNextWeekContent = nextWeek.sessions.length > 0 || nextWeek.events.length > 0;

  const weekLabel = showingNextWeek ? "Semaine prochaine" : "Cette semaine";
  const weekDateRange = `${format(weekStart, "d MMM", { locale: fr })} - ${format(weekEnd, "d MMM", { locale: fr })}`;

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative mx-auto px-4 py-8 sm:py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                ASUL Bron - Équipe ESL
              </span>
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              {userId ? (
                <>Bonjour <span className="text-primary">{firstName}</span> 👋</>
              ) : (
                <>Bienvenue sur <span className="text-primary">ESL Team</span></>
              )}
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {userId ? "Voici un aperçu de votre semaine d'entraînement" : "Votre plateforme d'entraînement personnalisée pour atteindre vos objectifs"}
            </p>

            {userId ? (
              <div className="flex justify-center mt-6">
                  <Button 
                      variant="outline" 
                      className="bg-white/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5"
                      onClick={() => setVmaDialogOpen(true)}
                  >
                      <Activity className="h-4 w-4 mr-2 text-primary" />
                      {userVma ? `Ma VMA : ${userVma} km/h` : "Configurer ma VMA"}
                  </Button>
              </div>
            ) : (
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
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Navigation Semaine */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{weekLabel}</h2>
                  <p className="text-sm text-muted-foreground">{weekDateRange}</p>
                </div>
                {!showingNextWeek && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Actuelle</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowingNextWeek(false)}
                  disabled={!showingNextWeek}
                  className="flex-1 md:flex-none"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Semaine actuelle
                </Button>
                
                {hasNextWeekContent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowingNextWeek(true)}
                    disabled={showingNextWeek}
                    className="flex-1 md:flex-none"
                  >
                    Semaine prochaine <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>

            {/* Séances */}
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
                  <Link href="/planning">Planning complet <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>

              {sessions.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {sessions.map((session) => (
                    <SessionCard key={session.id} session={session} userVma={userVma} />
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
                      <Link href="/planning">Consulter le planning</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Événements */}
            {events.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">Événements</h3>
                    <p className="text-sm text-muted-foreground">Courses et rassemblements</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {events.map((event) => (
                    <Card key={event.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-1">{event.title}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(event.eventDate), "EEEE d MMMM", { locale: fr })}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {event.type === 'race' ? '🏁 Course' : event.type === 'gathering' ? '🍺 Social' : '📅 Autre'}
                          </Badge>
                        </div>
                      </CardHeader>
                      {event.description && (
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Actions Rapides */}
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
                        <CardTitle className="text-xl">Créer un entraînement</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">Construisez votre séance personnalisée</CardDescription>
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
                        <CardTitle className="text-xl">Planning complet</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">Consultez toutes vos séances planifiées</CardDescription>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            </section>
          </div>
        ) : (
          // Vue non connecté (inchangée)
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

      <VmaDialog 
        open={vmaDialogOpen} 
        onOpenChange={setVmaDialogOpen} 
        currentVma={userVma || undefined} 
      />
    </main>
  );
}