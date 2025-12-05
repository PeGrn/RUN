'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Mail, Trash2, Calendar, Route, Clock } from 'lucide-react';
import { formatTime } from '@/lib/vma/calculator';
import { SendEmailDialog } from './send-email-dialog';
import { DeleteSessionDialog } from './delete-session-dialog';
import { toast } from 'sonner';
import { deleteTrainingSession, getSessionPdfUrl } from '@/actions/training-sessions';

interface Session {
  id: string;
  name: string;
  description: string | null;
  vma: number;
  totalDistance: number;
  totalTime: number;
  createdAt: Date;
}

interface SessionsListProps {
  sessions: Session[];
}

export function SessionsList({ sessions: initialSessions }: SessionsListProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  const handleDownload = async (session: Session) => {
    try {
      toast.loading('Téléchargement en cours...');

      const result = await getSessionPdfUrl(session.id);

      if (result.success && result.url) {
        // Télécharger le fichier
        const response = await fetch(result.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.name.replace(/[^a-z0-9]/gi, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.dismiss();
        toast.success('PDF téléchargé');
      } else {
        toast.dismiss();
        toast.error('Erreur lors du téléchargement');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleSendEmail = (session: Session) => {
    setSelectedSession(session);
    setEmailDialogOpen(true);
  };

  const handleDelete = (session: Session) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;

    try {
      const result = await deleteTrainingSession(sessionToDelete.id);

      if (result.success) {
        setSessions(sessions.filter(s => s.id !== sessionToDelete.id));
        toast.success('Séance supprimée');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune séance sauvegardée</h3>
        <p className="text-muted-foreground mb-4">
          Créez votre premier programme d'entraînement dans l'onglet Entraînement
        </p>
        <Button asChild>
          <a href="/training">Créer un programme</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{session.name}</CardTitle>
              {session.description && (
                <CardDescription>{session.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Route className="h-3 w-3" />
                    <span>Distance</span>
                  </div>
                  <div className="font-semibold">
                    {(session.totalDistance / 1000).toFixed(2)} km
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Durée</span>
                  </div>
                  <div className="font-semibold">
                    {formatTime(session.totalTime)}
                  </div>
                </div>

                <div className="space-y-1 col-span-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Créée le</span>
                  </div>
                  <div className="font-semibold text-xs">
                    {new Date(session.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(session)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSendEmail(session)}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Envoyer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(session)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog d'envoi d'email */}
      {selectedSession && (
        <SendEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          session={selectedSession}
        />
      )}

      {/* Dialog de suppression */}
      {sessionToDelete && (
        <DeleteSessionDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          sessionName={sessionToDelete.name}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
