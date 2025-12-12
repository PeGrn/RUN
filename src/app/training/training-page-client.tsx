'use client';

import { useMemo, useEffect, useState } from 'react';
import { VMASelector, TrainingPlanDisplay } from '@/components/training';
import { TrainingBuilder } from '@/components/training/builder';
import { SpeedChart } from '@/components/training/charts';
import { SavePdfDialog } from '@/components/training/save-pdf-dialog';
import { CreateEventDialog } from '@/components/training/create-event-dialog'; // Import ajouté
import { calculateVMAProgram, TrainingElement, convertBuilderElementsToSteps } from '@/lib/vma';
import { generatePDF } from '@/lib/pdf-export';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Download, Edit, Eye, BarChart3, Save, Flag } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@/lib/auth';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTrainingSessionById } from '@/actions/training-sessions';

interface TrainingPageClientProps {
  userRole: UserRole;
}

export default function TrainingPageClient({ userRole }: TrainingPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [vma, setVMA] = useLocalStorage('training-vma', 16);
  const [builderElements, setBuilderElements, isLoaded] = useLocalStorage<TrainingElement[]>('training-elements', []);

  // États pour les dialogues
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false); // Nouvel état pour l'événement

  // État pour le mode édition
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionData, setEditingSessionData] = useState<{ name: string; description: string; sessionDate: Date | null } | null>(null);

  // Handle edit from query param
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !isLoaded) return;

    const loadEditSession = async () => {
      try {
        const result = await getTrainingSessionById(editId);

        if (result.success && result.session) {
          const steps = result.session.steps as unknown as TrainingElement[];

          // Validation des steps
          const isValid = Array.isArray(steps) && steps.every(
            (element) => element.steps && Array.isArray(element.steps)
          );

          if (isValid) {
            setBuilderElements(steps);
            setEditingSessionId(editId);
            setEditingSessionData({
              name: result.session.name,
              description: result.session.description || '',
              sessionDate: result.session.sessionDate ? new Date(result.session.sessionDate) : null,
            });
            toast.success(`Séance "${result.session.name}" chargée en mode édition`);

            // Nettoyer l'URL en retirant le query param
            router.replace('/training');
          } else {
            toast.error('Données de la séance invalides');
          }
        } else {
          toast.error('Séance introuvable');
        }
      } catch (error) {
        console.error('Error loading edit session:', error);
        toast.error('Erreur lors du chargement de la séance');
      }
    };

    loadEditSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoaded]);

  // Handle duplication from query param
  useEffect(() => {
    const duplicateId = searchParams.get('duplicate');
    if (!duplicateId || !isLoaded) return;

    const loadDuplicateSession = async () => {
      try {
        const result = await getTrainingSessionById(duplicateId);

        if (result.success && result.session) {
          const steps = result.session.steps as unknown as TrainingElement[];

          // Validation des steps
          const isValid = Array.isArray(steps) && steps.every(
            (element) => element.steps && Array.isArray(element.steps)
          );

          if (isValid) {
            setBuilderElements(steps);
            toast.success(`Séance "${result.session.name}" chargée`);

            // Nettoyer l'URL en retirant le query param
            router.replace('/training');
          } else {
            toast.error('Données de la séance invalides');
          }
        } else {
          toast.error('Séance introuvable');
        }
      } catch (error) {
        console.error('Error loading duplicate session:', error);
        toast.error('Erreur lors du chargement de la séance');
      }
    };

    loadDuplicateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoaded]);

  // Validate and clean builder elements on load
  useEffect(() => {
    if (!isLoaded) return;

    // Check if elements are valid
    const hasInvalidElements = builderElements.some(
      (element) => !element.steps || !Array.isArray(element.steps)
    );

    if (hasInvalidElements) {
      console.warn('Invalid builder elements detected, resetting to empty array');
      setBuilderElements([]);
    }
  }, [isLoaded, builderElements, setBuilderElements]);

  // Calculate program based on builder elements
  const program = useMemo(() => {
    if (builderElements.length === 0) return null;
    const steps = convertBuilderElementsToSteps(builderElements);
    return calculateVMAProgram(steps, vma);
  }, [builderElements, vma]);

  // Handle PDF export
  const handleExportPDF = () => {
    if (!program || builderElements.length === 0) {
      toast.error('Aucun programme à exporter');
      return;
    }

    try {
      generatePDF(builderElements, 'Programme VMA');
      toast.success('PDF généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
      console.error(error);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b lg:sticky lg:top-0 lg:z-50">
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wide">
                Création de Séances d&apos;Entraînement
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr]">
          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            {/* VMA Selector */}
            <VMASelector value={vma} onChange={setVMA} />

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleExportPDF}
                disabled={!program}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
              
              {/* Boutons réservés aux Coachs et Admins */}
              {(userRole === 'coach' || userRole === 'admin') && (
                <>
                  <Button
                    className="w-full"
                    size="lg"
                    variant="outline"
                    onClick={() => setSaveDialogOpen(true)}
                    disabled={!program}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Planifier & Sauvegarder
                  </Button>

                  <Button
                    className="w-full border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-primary/50"
                    size="lg"
                    variant="ghost"
                    onClick={() => setEventDialogOpen(true)}
                  >
                    <Flag className="h-4 w-4 mr-2 text-orange-500" />
                    Créer un événement
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Training Builder/Display */}
          <div className="order-1 lg:order-2">
            <Tabs defaultValue="builder" className="w-full">
              <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto grid grid-cols-3 sm:inline-grid">
                <TabsTrigger value="builder" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Créer</span>
                  <span className="sm:hidden">Créer</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" disabled={!program}>
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Aperçu</span>
                  <span className="sm:hidden">Aperçu</span>
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" disabled={!program}>
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Statistiques</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="space-y-6">
                <TrainingBuilder
                  vma={vma}
                  elements={builderElements}
                  onProgramChange={setBuilderElements}
                />
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                {program ? (
                  <TrainingPlanDisplay program={program} />
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Eye className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Créez des étapes dans l&apos;onglet &quot;Créer&quot; pour voir l&apos;aperçu
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="charts" className="space-y-6">
                {program ? (
                  <SpeedChart program={program} />
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Créez des étapes dans l&apos;onglet &quot;Créer&quot; pour voir les statistiques
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Save PDF Dialog (Séance) */}
      {program && (
        <SavePdfDialog
          open={saveDialogOpen}
          onOpenChange={(open) => {
            setSaveDialogOpen(open);
            // Réinitialiser le mode édition quand on ferme le dialog
            if (!open && editingSessionId) {
              setEditingSessionId(null);
              setEditingSessionData(null);
            }
          }}
          builderElements={builderElements}
          vma={vma}
          totalDistance={program.totalDistance}
          totalTime={program.totalTime}
          editingSessionId={editingSessionId}
          editingSessionData={editingSessionData}
        />
      )}

      {/* Create Event Dialog (Événement) */}
      <CreateEventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
      />
    </>
  );
}