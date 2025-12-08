'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUserVma } from '@/actions/users';
import { toast } from 'sonner';
import { Activity } from 'lucide-react';

interface VmaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentVma?: number;
}

export function VmaDialog({ open, onOpenChange, currentVma }: VmaDialogProps) {
  const [vma, setVma] = useState<string>(currentVma?.toString() || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vmaValue = parseFloat(vma);

    if (isNaN(vmaValue) || vmaValue < 5 || vmaValue > 25) {
      toast.error('Veuillez entrer une VMA valide (entre 5 et 25 km/h)');
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserVma(vmaValue);
      if (result.success) {
        toast.success('VMA mise à jour avec succès');
        onOpenChange(false);
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Configurer ma VMA
          </DialogTitle>
          <DialogDescription>
            Renseignez votre VMA actuelle pour que nous puissions calculer vos temps de passage automatiquement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="vma">VMA (km/h)</Label>
            <div className="relative">
              <Input
                id="vma"
                type="number"
                step="0.1"
                placeholder="Ex: 16.5"
                value={vma}
                onChange={(e) => setVma(e.target.value)}
                className="pr-12"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                km/h
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}