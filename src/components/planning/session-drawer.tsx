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
import { Download, ChevronRight, Clock, Route, Mail, Flag, CalendarDays, Beer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getSessionPdfUrl } from '@/actions/training-sessions';
import { sendSessionEmail } from '@/actions/email';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { TrainingElement } from '@/lib/vma';
import type { TrainingSession, Event } from '@prisma/client';

// --- UTILITAIRES ---
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// MODIFICATION : Gestion m/km
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
};

const generateSessionSummary = (elements: TrainingElement[]): string => {
  if (!elements || elements.length === 0) {
    return 'Aucun détail disponible';
  }

  const summary: string[] = [];
  let blockIndex = 1;

  elements.forEach((block) => {
    const blockTitle = block.name || `Bloc ${blockIndex}`;
    summary.push(`${blockIndex}. ${block.repetitions}x ${blockTitle}`);

    block.steps.forEach((step, stepIdx) => {
      // MODIFICATION : Utilisation du format intelligent ici aussi
      const distance = formatDistance(step.distance);
      const intensity = `${step.vmaPercentage}% VMA`;
      const rest = step.rest !== '0"' ? ` - Récup: ${step.rest}` : '';
      const stepName = step.name || `Étape ${stepIdx + 1}`;

      summary.push(`   • ${stepName}: ${distance} à ${intensity}${rest}`);
    });

    blockIndex++;
  });

  return summary.join('\n');
};

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
                          {/* MODIFICATION ICI */}
                          {formatDistance(session.totalDistance)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(session.totalTime)}
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
                        {/* MODIFICATION ICI */}
                        {formatDistance(session.totalDistance)}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                        {formatDuration(session.totalTime)}
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
                </h3>
                <div className="text-sm font-mono leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border">
                    <pre className="whitespace-pre-wrap font-sans">
                        {generateSessionSummary(sessionSteps)}
                    </pre>
                </div>
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