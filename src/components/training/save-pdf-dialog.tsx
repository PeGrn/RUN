'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Save, Mail, Calendar as CalendarIcon, Edit } from 'lucide-react';
import { createTrainingSession, updateTrainingSession } from '@/actions/training-sessions';
import { TrainingElement } from '@/lib/vma';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SavePdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  builderElements: TrainingElement[];
  vma: number;
  totalDistance: number;
  totalTime: number;
  editingSessionId?: string | null;
  editingSessionData?: { name: string; description: string; sessionDate: Date | null } | null;
}

export function SavePdfDialog({
  open,
  onOpenChange,
  builderElements,
  vma,
  totalDistance,
  totalTime,
  editingSessionId,
  editingSessionData,
}: SavePdfDialogProps) {
  const isEditMode = !!editingSessionId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'save' | 'email' | null>(null);

  // Initialiser les valeurs si en mode édition
  useEffect(() => {
    if (isEditMode && editingSessionData) {
      setName(editingSessionData.name);
      setDescription(editingSessionData.description);
      setSessionDate(editingSessionData.sessionDate || undefined);
      setMode('save'); // Mode sauvegarde par défaut en édition
    }
  }, [isEditMode, editingSessionData]);

  // Fonction utilitaire pour préparer le FormData (sans PDF, génération à la demande)
  const prepareFormData = () => {
    const formData = new FormData();

    formData.append('name', name);
    formData.append('description', description);
    formData.append('vma', vma.toString());
    formData.append('totalDistance', totalDistance.toString());
    formData.append('totalTime', totalTime.toString());

    // Ajouter la date si elle est définie
    // Important : Créer une date à midi UTC pour éviter les problèmes de timezone
    if (sessionDate) {
      const normalizedDate = new Date(Date.UTC(
        sessionDate.getFullYear(),
        sessionDate.getMonth(),
        sessionDate.getDate(),
        12, 0, 0
      ));
      formData.append('sessionDate', normalizedDate.toISOString());
    }

    // Important : On stringify le tableau d'objets pour le passer dans le FormData
    formData.append('steps', JSON.stringify(builderElements));

    // Plus besoin d'envoyer le PDF - il sera généré à la demande

    return formData;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Veuillez entrer un nom pour la séance');
      return;
    }

    if (!sessionDate) {
      toast.error('Veuillez sélectionner une date pour la séance');
      return;
    }

    setLoading(true);

    try {
      // Préparer le FormData avec les données JSON
      const formData = prepareFormData();

      // Mode édition ou création
      const result = isEditMode && editingSessionId
        ? await updateTrainingSession(editingSessionId, formData)
        : await createTrainingSession(formData);

      if (result.success) {
        toast.success(isEditMode ? 'Séance modifiée avec succès' : 'Séance sauvegardée avec succès');
        setName('');
        setDescription('');
        setSessionDate(undefined);
        onOpenChange(false);

        // Recharger la page pour voir les changements
        if (isEditMode) {
          window.location.href = '/sessions';
        }
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndSend = async () => {
    if (!name.trim()) {
      toast.error('Veuillez entrer un nom pour la séance');
      return;
    }

    if (!sessionDate) {
      toast.error('Veuillez sélectionner une date pour la séance');
      return;
    }

    if (!email || !email.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    setLoading(true);

    try {
      // 1. Préparer le FormData pour la sauvegarde
      const formData = prepareFormData();

      // 2. Sauvegarder (PDF généré à la demande)
      const saveResult = await createTrainingSession(formData);

      if (!saveResult.success || !saveResult.session) {
        toast.error('Erreur lors de la sauvegarde');
        return;
      }

      // 3. Envoyer par email (PDF généré à la demande côté serveur)
      // Utiliser sendSessionEmail au lieu de sendPdfEmail
      const { sendSessionEmail } = await import('@/actions/email');

      const emailResult = await sendSessionEmail({
        sessionId: saveResult.session.id,
        sessionName: name,
        toEmail: email,
        sessionDate: sessionDate,
      });

      if (emailResult.success) {
        toast.success(`Séance sauvegardée et envoyée à ${email}`);
        setName('');
        setDescription('');
        setSessionDate(undefined);
        setEmail('');
        onOpenChange(false);
      } else {
        toast.warning('Séance sauvegardée mais erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };

  // En mode édition, afficher directement le formulaire
  if (isEditMode) {
    // Continue to the form below
  } else if (!mode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sauvegarder le programme</DialogTitle>
            <DialogDescription>
              Que souhaitez-vous faire avec ce programme ?
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => setMode('save')}
            >
              <Save className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Sauvegarder uniquement</div>
                <div className="text-sm text-muted-foreground">
                  Enregistrer dans l&apos;historique
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => setMode('email')}
            >
              <Mail className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Sauvegarder et envoyer</div>
                <div className="text-sm text-muted-foreground">
                  Enregistrer et envoyer par email
                </div>
              </div>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={() => {
      setMode(null);
      onOpenChange(false);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit className="h-5 w-5" />
                Modifier la séance
              </>
            ) : (
              <>
                {mode === 'save' ? <Save className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                {mode === 'save' ? 'Sauvegarder la séance' : 'Sauvegarder et envoyer'}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifiez les informations de cette séance'
              : (mode === 'save'
                  ? 'Enregistrez cette séance dans votre historique'
                  : 'Enregistrez et envoyez cette séance par email'
                )
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la séance *</Label>
            <Input
              id="name"
              placeholder="Ex: Séance VMA courte"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Ex: Programme pour travailler la VMA sur courte distance"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Date de la séance *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !sessionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sessionDate ? (
                    format(sessionDate, "PPP", { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={setSessionDate}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {mode === 'email' && (
            <div className="space-y-2">
              <Label htmlFor="email">Email du destinataire *</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setMode(null)}
            disabled={loading}
          >
            Retour
          </Button>
          <Button
            onClick={mode === 'save' ? handleSave : handleSaveAndSend}
            disabled={loading}
          >
            {loading
              ? 'Traitement...'
              : isEditMode
              ? 'Enregistrer les modifications'
              : (mode === 'save'
                  ? 'Sauvegarder'
                  : 'Sauvegarder et envoyer'
                )
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}