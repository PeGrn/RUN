'use client';

import { useState } from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import {
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
import { cn } from '@/lib/utils';

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
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[10001] bg-black/50"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[10001] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-[425px]"
          )}
        >
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
          <DialogPrimitive.Close
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}