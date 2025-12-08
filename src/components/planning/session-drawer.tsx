'use client';

import { useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Download, ChevronRight, Clock, Route, Mail, Flag, CalendarDays, Beer, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getSessionPdfUrl } from '@/actions/training-sessions';
import { sendSessionEmail } from '@/actions/email';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { TrainingElement } from '@/lib/vma';
import type { TrainingSession, Event } from '@prisma/client';
import { cn } from '@/lib/utils';

// --- UTILITAIRES DE FORMATAGE ---

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format "Friendly" : 20min, 45sec, 1h 10
function formatDurationFriendly(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const remainingSeconds = seconds % 3600;
  const mins = Math.floor(remainingSeconds / 60);
  const secs = Math.round(remainingSeconds % 60);

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}` : `${hours}h`;
  }
  if (mins > 0) {
    return secs > 0 ? `${mins}min ${secs}` : `${mins}min`;
  }
  return `${secs}sec`;
}

// Helper pour parser la durée stockée
function parseDuration(input: string | undefined): number {
  if (!input) return 0;
  if (input.includes(':')) {
    const [min, sec] = input.split(':').map(Number);
    return (min || 0) * 60 + (sec || 0);
  }
  const val = parseFloat(input);
  if (!isNaN(val)) {
     return val * 60; // Assume minutes par défaut
  }
  return 0;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
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
  return formatDurationFriendly(rounded); // Utilise friendly aussi ici (ex: 45sec)
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

// --- COMPOSANT VISUEL DES ÉTAPES (Local) ---

function ProgramSteps({ elements, userVma }: { elements: TrainingElement[], userVma: number | null }) {
  if (!elements || elements.length === 0) return <p className="text-sm text-muted-foreground">Aucun détail disponible</p>;

  return (
    <div className="space-y-4">
      {elements.map((block, blockIndex) => {
        const isRepetition = block.repetitions > 1;

        return (
          <div key={blockIndex} className="flex gap-3">
            {/* Badge Numéro du Bloc */}
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {blockIndex + 1}
              </div>
            </div>

            {/* Contenu du Bloc */}
            <div className="flex-1 space-y-2">
              <div className={cn("relative flex flex-col gap-2", isRepetition && "pr-12")}>
                
                {block.steps.map((step, stepIndex) => {
                  const isTimeBased = step.type === 'time';
                  const speed = userVma ? userVma * (step.vmaPercentage / 100) : 0;
                  const targetPace = (userVma && speed > 0) ? formatPace(speed) : null;
                  
                  // Déterminer la valeur principale à afficher
                  let mainValue = "";
                  if (isTimeBased) {
                    const durationSec = parseDuration(step.duration);
                    mainValue = formatDurationFriendly(durationSec);
                  } else {
                    mainValue = formatDistance(step.distance);
                  }
                  
                  // Calculer la valeur secondaire
                  let secondaryValue = null;
                  let effectiveDistance = step.distance;

                  if (userVma && speed > 0) {
                    if (isTimeBased) {
                      // Temps -> Dist
                      const seconds = parseDuration(step.duration);
                      effectiveDistance = (seconds * speed * 1000) / 3600;
                      secondaryValue = `~${formatDistance(effectiveDistance)}`;
                    } else {
                      // Dist -> Temps
                      effectiveDistance = step.distance;
                      const timeSeconds = (step.distance / 1000 / speed) * 3600;
                      secondaryValue = formatDurationFriendly(timeSeconds);
                    }
                  }
                  
                  // Split 200m
                  const split200 = (userVma && speed > 0 && effectiveDistance > 200) 
                    ? calculateSplit200m(speed) 
                    : null;

                  return (
                    <div key={stepIndex} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                      {/* Gauche: Consigne */}
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

                      {/* Droite: Infos */}
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

                {/* Badge Répétition */}
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

// --- SESSION DRAWER ---

interface SessionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: TrainingSession[];
  events?: Event[];
  selectedDate?: Date;
  loading?: boolean;
}

export function SessionDrawer({
  open,
  onOpenChange,
  sessions,
  events = [],
  selectedDate,
  loading = false,
}: SessionDrawerProps) {
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useUser();
  
  // Récupérer la VMA de l'utilisateur
  const userVma = (user?.publicMetadata?.vma as number) || null;

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setSelectedSession(null);
    }
    onOpenChange(isOpen);
  }, [onOpenChange]);

  const handleDownloadPdf = useCallback(async (sessionId: string, sessionName: string) => {
    setDownloading(true);
    try {
      const result = await getSessionPdfUrl(sessionId);
      if (result.success && result.url) {
        const link = document.createElement('a');
        link.href = result.url;
        link.download = `${sessionName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Téléchargement démarré');
      } else {
        toast.error('Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleSendEmail = useCallback(async (sessionId: string, sessionName: string) => {
    const userEmail = user?.emailAddresses[0]?.emailAddress;
    const userName = user?.firstName || user?.lastName || 'Athlète';

    if (!userEmail) {
      toast.error('Email non disponible');
      return;
    }

    setSending(true);
    try {
      const result = await sendSessionEmail({
        sessionId,
        sessionName,
        toEmail: userEmail,
        userName,
        sessionDate: selectedDate,
      });

      if (result.success) {
        toast.success(`Email envoyé à ${userEmail}`);
      } else {
        toast.error('Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSending(false);
    }
  }, [user, selectedDate]);

  // Vue : Chargement
  if (loading) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[50dvh] z-[200]">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // LOGIQUE D'AFFICHAGE
  const showList = !selectedSession && (sessions.length + events.length > 0);
  const isMultiView = sessions.length + events.length > 1 || events.length > 0;

  // --- VUE LISTE ---
  if (showList && isMultiView) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto z-[200]">
          <SheetHeader className="mb-4">
            <SheetTitle>
              {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </SheetTitle>
            <SheetDescription>
              {events.length > 0 ? `${events.length} événement(s) • ` : ''}
              {sessions.length} séance{sessions.length > 1 ? 's' : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* SECTION ÉVÉNEMENTS */}
            {events.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Événements</h3>
                {events.map((event) => (
                  <Card key={event.id} className="p-4 flex gap-4 bg-orange-50/50 dark:bg-orange-950/10 border-orange-200/50">
                    <div className="shrink-0 mt-1">
                      {event.type === 'race' ? <Flag className="h-5 w-5 text-orange-600" /> :
                       event.type === 'gathering' ? <Beer className="h-5 w-5 text-amber-600" /> :
                       <CalendarDays className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {event.description}
                        </p>
                      )}
                      <Badge variant="secondary" className="mt-2 text-[10px] uppercase">
                        {event.type === 'race' ? 'Compétition' : 
                         event.type === 'gathering' ? 'Vie du club' : 'Autre'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* SECTION SÉANCES */}
            {sessions.length > 0 && (
              <div className="space-y-3">
                {events.length > 0 && (
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Entraînements</h3>
                )}
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className="w-full p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{session.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Route className="h-4 w-4" />
                          {formatDistance(session.totalDistance)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(session.totalTime)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // --- VUE DÉTAIL SÉANCE ---
  const session = selectedSession || (sessions.length === 1 ? sessions[0] : null);

  if (!session) {
    return null;
  }

  const sessionSteps = (session.steps as unknown as TrainingElement[]) || [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] w-full z-[200] overflow-y-auto flex flex-col">
        
        {/* Header avec bouton retour */}
        <div className="mb-6 shrink-0">
            {isMultiView && (
                <button 
                    onClick={() => setSelectedSession(null)}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 -ml-1 py-2"
                >
                    <ChevronRight className="h-4 w-4 rotate-180" /> Retour au planning du jour
                </button>
            )}
            
            <div className="flex items-start justify-between gap-4">
                <div>
                    <SheetTitle className="text-2xl font-bold text-primary">
                        {session.name}
                    </SheetTitle>
                    <SheetDescription className="mt-1">
                        {selectedDate && format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                    </SheetDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="font-mono">
                        {formatDistance(session.totalDistance)}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                        {formatTime(session.totalTime)}
                    </Badge>
                </div>
            </div>
        </div>

        {/* Contenu défilable */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {session.description && (
                <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-sm text-muted-foreground italic">
                        &quot;{session.description}&quot;
                    </p>
                </div>
            )}

            <div className="space-y-3 mb-8">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    Détail de la séance
                    {!userVma && <span className="ml-2 text-xs normal-case text-orange-600">(Configurez votre VMA pour voir les temps)</span>}
                </h3>
                
                {/* INTÉGRATION DE ProgramSteps */}
                <ProgramSteps elements={sessionSteps} userVma={userVma} />
                
            </div>
        </div>

        {/* Footer Actions (Sticky) */}
        <div className="pt-4 mt-auto border-t bg-background sticky bottom-0 z-10 shrink-0">
            <div className="grid grid-cols-2 gap-3">
                <Button 
                    variant="default" 
                    onClick={() => handleDownloadPdf(session.id, session.name)}
                    disabled={downloading}
                    className="w-full"
                >
                    {downloading ? <span className="animate-pulse">...</span> : <Download className="h-4 w-4 mr-2" />}
                    PDF
                </Button>
                <Button 
                    variant="outline"
                    onClick={() => handleSendEmail(session.id, session.name)}
                    disabled={sending}
                    className="w-full"
                >
                    {sending ? <span className="animate-pulse">...</span> : <Mail className="h-4 w-4 mr-2" />}
                    Email
                </Button>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}