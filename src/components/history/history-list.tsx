'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Download, Mail, Trash2, Calendar as CalendarIcon, Route, Clock, Copy, Search, X, 
  Flag, Beer, CalendarDays, Filter 
} from 'lucide-react';
import { formatTime } from '@/lib/vma/calculator';
import { SendEmailDialog } from '@/components/sessions/send-email-dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle, 
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { deleteTrainingSession, getSessionPdfUrl } from '@/actions/training-sessions';
import { deleteEvent } from '@/actions/events';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar'; // Assurez-vous que c'est bien le composant UI
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker'; // Import nécessaire pour le type
import type { TrainingSession, Event } from '@prisma/client';

type HistoryItem = 
  | { type: 'session'; data: TrainingSession; date: Date }
  | { type: 'event'; data: Event; date: Date };

interface HistoryListProps {
  initialSessions: TrainingSession[];
  initialEvents: Event[];
}

export function HistoryList({ initialSessions, initialEvents }: HistoryListProps) {
  const router = useRouter();
  
  // 1. Fusion des données
  const [items, setItems] = useState<HistoryItem[]>(() => {
    const sessionItems = initialSessions.map(s => ({ 
      type: 'session' as const, 
      data: s, 
      date: new Date(s.sessionDate || s.createdAt) 
    }));
    const eventItems = initialEvents.map(e => ({ 
      type: 'event' as const, 
      data: e, 
      date: new Date(e.eventDate) 
    }));
    return [...sessionItems, ...eventItems].sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  // États pour les actions
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'session' | 'event', name: string } | null>(null);

  // --- FILTRES ---
  const [searchQuery, setSearchQuery] = useState('');
  // Modification ici : On utilise DateRange au lieu de Date
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filtrage
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Filtre Recherche
      const name = item.type === 'session' ? item.data.name : item.data.title;
      const desc = item.type === 'session' ? item.data.description : item.data.description;
      
      const matchesSearch = !searchQuery || 
        name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (desc?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      // 2. Filtre Date (Plage)
      let matchesDate = true;
      if (dateRange?.from) {
        const itemDate = new Date(item.date);
        itemDate.setHours(0, 0, 0, 0); // On normalise l'heure pour comparer les jours
        
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        // Vérifie si après la date de début
        if (itemDate < fromDate) {
          matchesDate = false;
        }

        // Vérifie si avant la date de fin (si elle existe)
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999); // Fin de journée
          if (itemDate > toDate) {
            matchesDate = false;
          }
        }
      }

      // 3. Filtre Type
      let matchesType = true;
      if (typeFilter !== 'all') {
        if (typeFilter === 'session') matchesType = item.type === 'session';
        else if (typeFilter === 'event') matchesType = item.type === 'event';
        else if (item.type === 'event') matchesType = item.data.type === typeFilter;
        else matchesType = false;
      }

      return matchesSearch && matchesDate && matchesType;
    });
  }, [items, searchQuery, dateRange, typeFilter]);

  // --- ACTIONS ---

  const handleDownload = async (session: TrainingSession) => {
    try {
      toast.loading('Téléchargement en cours...');
      const result = await getSessionPdfUrl(session.id);
      if (result.success && result.url) {
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

  const handleSendEmail = (session: TrainingSession) => {
    setSelectedSession(session);
    setEmailDialogOpen(true);
  };

  const handleDuplicate = (session: TrainingSession) => {
    router.push(`/training?duplicate=${session.id}`);
  };

  const confirmDelete = (id: string, type: 'session' | 'event', name: string) => {
    setItemToDelete({ id, type, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const result = itemToDelete.type === 'session'
        ? await deleteTrainingSession(itemToDelete.id)
        : await deleteEvent(itemToDelete.id);

      if (result.success) {
        setItems(prev => prev.filter(i => 
          !(i.type === itemToDelete.type && (i.type === 'session' ? i.data.id : i.data.id) === itemToDelete.id)
        ));
        toast.success('Élément supprimé');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDateRange(undefined);
    setTypeFilter('all');
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucun historique</h3>
        <p className="text-muted-foreground mb-4">
          Vous n&apos;avez pas encore créé de séance ou d&apos;événement.
        </p>
        <Button asChild>
          <a href="/training">Créer un programme</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* --- BARRE DE FILTRES --- */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
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

          {/* Filtre Type */}
          <div className="w-full md:w-[180px]">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout voir</SelectItem>
                <SelectItem value="session">🏃 Entraînements</SelectItem>
                <SelectItem value="event">📅 Événements</SelectItem>
                <SelectItem value="race">🏁 Courses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtre Date (Plage) */}
          <div className="w-full md:w-[260px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd MMM", { locale: fr })} -{" "}
                        {format(dateRange.to, "dd MMM", { locale: fr })}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMMM yyyy", { locale: fr })
                    )
                  ) : (
                    <span>Filtrer par date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range" // C'est ici qu'on active la plage de dates
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  locale={fr}
                />
                {/* Bouton pour effacer la date dans le popover */}
                {dateRange && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setDateRange(undefined)}
                    >
                      <X className="h-4 w-4 mr-2" /> Effacer la date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

           {/* Bouton Reset Global */}
           {(searchQuery || dateRange || typeFilter !== 'all') && (
            <Button variant="ghost" size="icon" onClick={resetFilters} title="Tout effacer">
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredItems.length} résultat{filteredItems.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* --- GRILLE DE CARTES --- */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
          <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            // === CARTE SÉANCE ===
            if (item.type === 'session') {
              const session = item.data;
              return (
                <Card key={session.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
                  <CardHeader>
                    <CardTitle className="text-xl line-clamp-1">{session.name}</CardTitle>
                    {session.description && (
                      <CardDescription className="line-clamp-1">{session.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-3 text-sm flex-1">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Route className="h-3 w-3" /> <span>Distance</span>
                        </div>
                        <div className="font-semibold">{(session.totalDistance / 1000).toFixed(2)} km</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3 w-3" /> <span>Durée</span>
                        </div>
                        <div className="font-semibold">{formatTime(session.totalTime)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" /> <span>Planifiée le</span>
                        </div>
                        <div className="font-semibold text-xs">
                          {session.sessionDate 
                            ? format(new Date(session.sessionDate), 'd MMM yyyy', { locale: fr }) 
                            : 'Non planifiée'}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" /> <span>Créée le</span>
                        </div>
                        <div className="font-semibold text-xs">
                          {format(new Date(session.createdAt), 'd MMM', { locale: fr })}
                        </div>
                      </div>
                    </div>

                    {/* Boutons d'action Session */}
                    <div className="space-y-2 pt-2 mt-auto">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDownload(session)}>
                          <Download className="h-4 w-4 mr-1" /> PDF
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleSendEmail(session)}>
                          <Mail className="h-4 w-4 mr-1" /> Envoyer
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => confirmDelete(session.id, 'session', session.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button variant="secondary" size="sm" className="w-full" onClick={() => handleDuplicate(session)}>
                        <Copy className="h-4 w-4 mr-1" /> Dupliquer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            } 
            // === CARTE ÉVÉNEMENT ===
            else {
              const event = item.data;
              return (
                <Card key={event.id} className="hover:shadow-lg transition-shadow flex flex-col h-full border-orange-200/50 bg-orange-50/30 dark:bg-orange-950/10">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-2">
                       <div className="p-2 bg-orange-100/50 dark:bg-orange-900/20 rounded-full shrink-0">
                          {event.type === 'race' ? <Flag className="h-5 w-5 text-orange-600" /> :
                           event.type === 'gathering' ? <Beer className="h-5 w-5 text-amber-600" /> :
                           <CalendarDays className="h-5 w-5 text-blue-600" />}
                       </div>
                       <Badge variant="outline" className="border-orange-200 text-orange-700 bg-white/50">
                          {event.type === 'race' ? 'Course' : event.type === 'gathering' ? 'Vie du club' : 'Autre'}
                       </Badge>
                    </div>
                    <CardTitle className="text-xl line-clamp-1 mt-2">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200 font-medium mb-3">
                        <CalendarIcon className="h-4 w-4" />
                        {format(new Date(event.eventDate), 'EEEE d MMMM yyyy', { locale: fr })}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 bg-white/50 dark:bg-black/20 p-3 rounded-md">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Bouton d'action Événement */}
                    <div className="pt-2 mt-auto">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full bg-white text-destructive border border-destructive hover:bg-destructive hover:text-white"
                        onClick={() => confirmDelete(event.id, 'event', event.title)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer l&apos;événement
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }
          })}
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

      {/* Dialog de suppression (Commun) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {itemToDelete?.type === 'session' ? 'la séance' : "l'événement"} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <span className="font-semibold text-foreground">&quot;{itemToDelete?.name}&quot;</span> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}