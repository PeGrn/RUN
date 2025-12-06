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
import { Download, ChevronRight, Clock, Route, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getSessionPdfUrl } from '@/actions/training-sessions';
import { sendSessionEmail } from '@/actions/email';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { TrainingElement } from '@/lib/vma';
import type { TrainingSession } from '@prisma/client';

// Fonctions utilitaires pures (déplacées hors du composant pour éviter les re-créations)
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
  selectedDate?: Date;
  loading?: boolean;
}

export function SessionDrawer({
  open,
  onOpenChange,
  sessions,
  selectedDate,
  loading = false,
}: SessionDrawerProps) {
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useUser();

  // Réinitialiser la sélection quand on ferme le drawer
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setSelectedSession(null);
    }
    onOpenChange(isOpen);
  }, [onOpenChange]);

  // Gérer le téléchargement du PDF
  const handleDownloadPdf = useCallback(async (sessionId: string, sessionName: string) => {
    setDownloading(true);
    try {
      const result = await getSessionPdfUrl(sessionId);
      if (result.success && result.url) {
        // Créer un lien temporaire et le cliquer pour télécharger
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

  // Gérer l'envoi par email
  const handleSendEmail = useCallback(async (sessionId: string, sessionName: string) => {
    const userEmail = user?.emailAddresses[0]?.emailAddress;

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
  }, [user]);

  // Vue : Chargement
  if (loading) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Chargement des séances...</div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Vue : Liste des séances
  if (sessions.length > 1 && !selectedSession) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>
              {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </SheetTitle>
            <SheetDescription>
              {sessions.length} séance{sessions.length > 1 ? 's' : ''} prévue{sessions.length > 1 ? 's' : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3">
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
        </SheetContent>
      </Sheet>
    );
  }

  // Vue : Détails d'une seule séance (ou séance sélectionnée)
  const session = selectedSession || (sessions.length === 1 ? sessions[0] : null);

  if (!session) {
    return null;
  }

  // Parser les steps JSON en TrainingElement[]
  const sessionSteps = (session.steps as unknown as TrainingElement[]) || [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">{session.name}</SheetTitle>
          <SheetDescription className="text-base">
            {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </SheetDescription>
        </SheetHeader>

        {/* Indicateurs clés */}
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

        {/* Description */}
        {session.description && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{session.description}</p>
          </div>
        )}

        {/* Détails de la séance */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Programme</h3>
          <div className="p-4 rounded-lg bg-muted/30 text-sm whitespace-pre-line font-mono">
            {generateSessionSummary(sessionSteps)}
          </div>
        </div>

        {/* Boutons d'actions (sticky en bas) */}
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

        {/* Bouton retour si on vient de la liste */}
        {selectedSession && sessions.length > 1 && (
          <Button
            variant="ghost"
            onClick={() => setSelectedSession(null)}
            className="w-full mt-2"
          >
            Retour à la liste
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}
