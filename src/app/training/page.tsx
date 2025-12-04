'use client';

import { useMemo } from 'react';
import { VMASelector, TrainingPlanDisplay } from '@/components/training';
import { TrainingBuilder } from '@/components/training/builder';
import { SpeedChart, DistanceChart } from '@/components/training/charts';
import { calculateVMAProgram, TrainingElement, convertBuilderElementsToSteps } from '@/lib/vma';
import { generatePDF } from '@/lib/pdf-export';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Download, Edit, Eye, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function TrainingPage() {
  const [vma, setVMA] = useLocalStorage('training-vma', 16);
  const [builderElements, setBuilderElements, isLoaded] = useLocalStorage<TrainingElement[]>('training-elements', []);

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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                Entraînement VMA
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Créez votre programme d&apos;entraînement personnalisé
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Optimisez vos performances avec un plan fractionné adapté à votre VMA.
              Chaque étape est calculée précisément pour maximiser vos progrès.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Sidebar */}
          <div className="space-y-6">
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
                Exporter en PDF
              </Button>
            </div>

            {/* Info Card */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <h3 className="font-semibold">💡 Conseil</h3>
              <p className="text-muted-foreground">
                La VMA (Vitesse Maximale Aérobie) est votre vitesse de course maximale que vous
                pouvez maintenir pendant 4 à 6 minutes.
              </p>
            </div>
          </div>

          {/* Training Builder/Display */}
          <div>
            <Tabs defaultValue="builder" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="builder" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Créer
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2" disabled={!program}>
                  <Eye className="h-4 w-4" />
                  Aperçu
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center gap-2" disabled={!program}>
                  <BarChart3 className="h-4 w-4" />
                  Statistiques
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
                  <>
                    <SpeedChart program={program} />
                    <DistanceChart program={program} />
                  </>
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
    </div>
  );
}
