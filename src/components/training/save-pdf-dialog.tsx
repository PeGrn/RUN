'use client';

import { useState } from 'react';
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
import { Save, Mail } from 'lucide-react';
import { createTrainingSession } from '@/actions/training-sessions';
import { sendPdfEmail } from '@/actions/email';
import { generatePDFBuffer } from '@/lib/pdf-export';
import { TrainingElement } from '@/lib/vma';
import { toast } from 'sonner';

interface SavePdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  builderElements: TrainingElement[];
  vma: number;
  totalDistance: number;
  totalTime: number;
}

export function SavePdfDialog({
  open,
  onOpenChange,
  builderElements,
  vma,
  totalDistance,
  totalTime,
}: SavePdfDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'save' | 'email' | null>(null);

  // Fonction utilitaire pour préparer le FormData
  const prepareFormData = (pdfBlob: Blob, fileName: string) => {
    const formData = new FormData();
    
    formData.append('name', name);
    formData.append('description', description);
    formData.append('vma', vma.toString());
    formData.append('totalDistance', totalDistance.toString());
    formData.append('totalTime', totalTime.toString());
    
    // Important : On stringify le tableau d'objets pour le passer dans le FormData
    formData.append('steps', JSON.stringify(builderElements));
    
    // Création d'un objet File à partir du Blob du PDF
    const file = new File([pdfBlob], `${fileName}.pdf`, { type: 'application/pdf' });
    formData.append('file', file);

    return formData;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Veuillez entrer un nom pour la séance');
      return;
    }

    setLoading(true);

    try {
      // 1. Générer le PDF
      const pdfOutput = generatePDFBuffer(builderElements, name);
      // Convertir le Buffer en Uint8Array pour la compatibilité Blob
      const pdfBlob = new Blob([new Uint8Array(pdfOutput)], { type: 'application/pdf' });

      // 2. Préparer le FormData
      const formData = prepareFormData(pdfBlob, name);

      // 3. Sauvegarder dans Minio et BDD via la Server Action
      const result = await createTrainingSession(formData);

      if (result.success) {
        toast.success('Séance sauvegardée avec succès');
        setName('');
        setDescription('');
        onOpenChange(false);
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

    if (!email || !email.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    setLoading(true);

    try {
      // 1. Générer le PDF
      const pdfOutput = generatePDFBuffer(builderElements, name);
      const pdfBlob = new Blob([new Uint8Array(pdfOutput)], { type: 'application/pdf' });

      // 2. Préparer le FormData pour la sauvegarde
      const formData = prepareFormData(pdfBlob, name);

      // 3. Sauvegarder
      const saveResult = await createTrainingSession(formData);

      if (!saveResult.success) {
        toast.error('Erreur lors de la sauvegarde');
        return;
      }

      // 4. Envoyer par email
      // Note : sendPdfEmail attend probablement un ArrayBuffer ou FormData aussi maintenant.
      // Si sendPdfEmail n'a pas été modifié pour accepter FormData, on doit convertir le Blob en ArrayBuffer.
      const arrayBuffer = await pdfBlob.arrayBuffer(); 
      // Pour les Server Actions, il est souvent préférable de passer l'ArrayBuffer encodé ou brut
      // selon comment ta fonction sendPdfEmail est codée.
      
      const emailResult = await sendPdfEmail(
        Buffer.from(arrayBuffer) as any, // Cast "as any" temporaire si le type côté client râle sur Buffer
        name,
        email,
        `Programme VMA - ${name}`
      );

      if (emailResult.success) {
        toast.success(`Séance sauvegardée et envoyée à ${email}`);
        setName('');
        setDescription('');
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

  if (!mode) {
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
            {mode === 'save' ? <Save className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
            {mode === 'save' ? 'Sauvegarder la séance' : 'Sauvegarder et envoyer'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'save'
              ? 'Enregistrez cette séance dans votre historique'
              : 'Enregistrez et envoyez cette séance par email'
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
              : mode === 'save'
              ? 'Sauvegarder'
              : 'Sauvegarder et envoyer'
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}