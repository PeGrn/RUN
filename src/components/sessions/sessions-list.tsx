'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Mail, Trash2, Calendar, Route, Clock, Copy, Search, X, Edit } from 'lucide-react';
import { formatTime } from '@/lib/vma/calculator';
import { SendEmailDialog } from './send-email-dialog';
import { DeleteSessionDialog } from './delete-session-dialog';
import { toast } from 'sonner';
import { deleteTrainingSession, getSessionPdfUrl } from '@/actions/training-sessions';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  name: string;
  description: string | null;
  vma: number;
  totalDistance: number;
  totalTime: number;
  sessionDate: Date | null;
  createdAt: Date;
}

interface SessionsListProps {
  sessions: Session[];
}

export function SessionsList({ sessions: initialSessions }: SessionsListProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);

  // Filtrer les séances
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Filtre par recherche (nom ou description)
      const matchesSearch = !searchQuery ||
        session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (session.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      // Filtre par date de planification
      const matchesDate = !filterDate ||
        (session.sessionDate &&
          new Date(session.sessionDate).toDateString() === filterDate.toDateString());

      return matchesSearch && matchesDate;
    });
  }, [sessions, searchQuery, filterDate]);

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

  const handleEdit = (session: Session) => {
    router.push(`/training?edit=${session.id}`);
  };

  const handleDuplicate = (session: Session) => {
    router.push(`/training?duplicate=${session.id}`);
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
      {/* Filtres */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Barre de recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par nom ou description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtre par date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal",
                  !filterDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filterDate ? (
                  format(filterDate, "PPP", { locale: fr })
                ) : (
                  <span>Date de planification</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={filterDate}
                onSelect={setFilterDate}
                initialFocus
                locale={fr}
              />
              {filterDate && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setFilterDate(undefined)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Indicateur de résultats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredSessions.length} séance{filteredSessions.length > 1 ? 's' : ''} trouvée{filteredSessions.length > 1 ? 's' : ''}
            {(searchQuery || filterDate) && ` sur ${sessions.length}`}
          </span>
          {(searchQuery || filterDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterDate(undefined);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Effacer les filtres
            </Button>
          )}
        </div>
      </div>

      {/* Liste des séances */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune séance trouvée</h3>
          <p className="text-muted-foreground mb-4">
            Essayez de modifier vos critères de recherche
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setFilterDate(undefined);
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Réinitialiser les filtres
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => (
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

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Planifiée le</span>
                  </div>
                  <div className="font-semibold text-xs">
                    {session.sessionDate
                      ? new Date(session.sessionDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Non planifiée'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Créée le</span>
                  </div>
                  <div className="font-semibold text-xs">
                    {new Date(session.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(session)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Télécharger</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendEmail(session)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Envoyer</span>
                    <span className="sm:hidden">Email</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(session)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(session)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Dupliquer
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => handleDelete(session)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

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
