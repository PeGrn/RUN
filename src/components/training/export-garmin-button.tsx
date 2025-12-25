'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createGarminWorkout } from '@/actions/garmin';
import { getUserGarminStatus } from '@/actions/garmin/user-auth';
import { convertToGarminWorkout } from '@/lib/garmin/workout-json';
import type { TrainingElement } from '@/lib/vma/builder-types';
import { GarminIcon } from '@/components/icons/GarminIcon';

interface ExportGarminButtonProps {
  elements: TrainingElement[];
  vma: number;
  workoutName?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  iconOnly?: boolean;
  mode?: string;
}

export function ExportGarminButton({
  elements,
  vma,
  workoutName = 'Workout',
  disabled = false,
  variant = 'default',
  className,
  iconOnly = false,
}: ExportGarminButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleUploadToGarmin = async () => {
    if (!elements || elements.length === 0) {
      toast.error('Aucune séance à exporter');
      return;
    }

    setIsUploading(true);

    try {
      // Check if user is connected to Garmin
      const status = await getUserGarminStatus();

      if (!status.connected) {
        setIsUploading(false);
        toast.error('Connectez-vous à Garmin Connect', {
          description: 'Vous devez connecter votre compte Garmin dans votre profil',
          duration: 5000,
        });
        router.push('/profile');
        return;
      }

      toast.info('Création de la séance sur Garmin Connect...');

      // Convert to Garmin's JSON workout format
      const workoutData = convertToGarminWorkout(elements, workoutName, vma);

      console.log('Garmin workout JSON:', JSON.stringify(workoutData, null, 2));

      // Create workout in Garmin Connect
      const result = await createGarminWorkout(workoutData);

      if (result.success) {
        toast.success('Séance créée sur Garmin Connect ! 🎉', {
          description: 'La séance est maintenant disponible dans votre bibliothèque Garmin Connect',
          duration: 5000,
        });
      } else {
        // Check if it's an authentication error
        if (result.error?.includes('authenticated') || result.error?.includes('login') || result.error?.includes('connect')) {
          toast.error(
            'Reconnectez-vous à Garmin Connect',
            {
              description: 'Votre session Garmin a expiré',
              duration: 5000,
            }
          );
          router.push('/profile');
        } else {
          toast.error('Échec de la création de la séance', {
            description: result.error,
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to create Garmin workout:', error);
      toast.error('Erreur lors de la création de la séance', {
        description: error.message || 'Une erreur inattendue s\'est produite',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Button
      className={className}
      variant={variant}
      onClick={handleUploadToGarmin}
      disabled={disabled || isUploading}
      title="Exporter vers Garmin Connect"
    >
      {isUploading ? (
        <>
          <Loader2 className={iconOnly ? "h-4 w-4 animate-spin" : "h-4 w-4 mr-2 animate-spin"} />
          {!iconOnly && ' Création...'}
        </>
      ) : (
        <>
          {iconOnly ? (
            <GarminIcon className="h-4 w-4" />
          ) : (
            <>
              <GarminIcon className="h-4 w-4 mr-2" />
              Export Garmin
            </>
          )}
        </>
      )}
    </Button>
  );
}
