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

const formatDistance = (meters: number): string => {
  return (meters / 1000).toFixed(2);
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
      const distance = `${(step.distance / 1000).toFixed(2)} km`;
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
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // LOGIQUE D'AFFICHAGE : LISTE ou DÉTAIL
  // On affiche la liste s'il n'y a pas de session sélectionnée ET (plusieurs items OU 1 event + 1 session)
  // Sinon, si une seule session et pas d'event, on affiche directement le détail.
  const showList = !selectedSession && (sessions.length + events.length > 0);
  const isMultiView = sessions.length + events.length > 1 || events.length > 0;

  // --- VUE LISTE ---
  if (showList && isMultiView) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
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
            {/* SECTION ÉVÉNEMENTS (NOUVEAU STYLE CONSERVÉ) */}
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

            {/* SECTION SÉANCES (STYLE D'ORIGINE RESTAURÉ) */}
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
                          {formatDistance(session.totalDistance)} km
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

  // --- VUE DÉTAIL SÉANCE (STYLE D'ORIGINE RESTAURÉ) ---
  const session = selectedSession || (sessions.length === 1 ? sessions[0] : null);

  if (!session) {
    return null;
  }

  const sessionSteps = (session.steps as unknown as TrainingElement[]) || [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        {/* Bouton retour si on vient d'une liste mixte */}
        {isMultiView && (
          <button 
            onClick={() => setSelectedSession(null)}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 -ml-1"
          >
            <ChevronRight className="h-4 w-4 rotate-180" /> Retour
          </button>
        )}

        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">{session.name}</SheetTitle>
          <SheetDescription className="text-base">
            {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </SheetDescription>
        </SheetHeader>

        {/* Indicateurs clés - Style Original */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Route className="h-4 w-4" />
              Distance
            </div>
            <div className="text-2xl font-bold">
              {formatDistance(session.totalDistance)} km
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              Durée
            </div>
            <div className="text-2xl font-bold">
              {formatDuration(session.totalTime)}
            </div>
          </div>
        </div>

        {/* Description - Style Original */}
        {session.description && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{session.description}</p>
          </div>
        )}

        {/* Détails de la séance - Style Original */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Programme</h3>
          <div className="p-4 rounded-lg bg-muted/30 text-sm whitespace-pre-line font-mono">
            {generateSessionSummary(sessionSteps)}
          </div>
        </div>

        {/* Boutons d'actions - Style Original */}
        <div className="sticky bottom-0 left-0 right-0 pt-4 pb-2 bg-background border-t -mx-6 px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={() => handleDownloadPdf(session.id, session.name)}
              className="w-full"
              size="lg"
              disabled={downloading || sending}
              variant="default"
            >
              <Download className="mr-2 h-5 w-5" />
              {downloading ? 'Téléchargement...' : 'Télécharger'}
            </Button>
            <Button
              onClick={() => handleSendEmail(session.id, session.name)}
              className="w-full"
              size="lg"
              disabled={downloading || sending}
              variant="outline"
            >
              <Mail className="mr-2 h-5 w-5" />
              {sending ? 'Envoi...' : 'Envoyer par email'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}