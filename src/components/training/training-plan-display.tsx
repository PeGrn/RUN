'use client';

import { VMAProgram } from '@/lib/vma';
import { StepCard } from './step-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, Route, Flame, TrendingUp } from 'lucide-react';

interface TrainingPlanDisplayProps {
  program: VMAProgram;
}

export function TrainingPlanDisplay({ program }: TrainingPlanDisplayProps) {
  // Group steps by category
  const warmupSteps = program.steps.filter(s => s.step.group === 'warmup');
  const mainSteps = program.steps.filter(s => s.step.group === 'main');
  const cooldownSteps = program.steps.filter(s => s.step.group === 'cooldown');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-background">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl">Résumé de l'entraînement</CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1.5">
            Programme personnalisé pour une VMA de {program.vma} km/h
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Durée totale</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold truncate">
                {program.estimatedDuration}
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Route className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Distance totale</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold truncate">
                {(program.totalDistance / 1000).toFixed(2)} km
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Flame className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Étapes</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold">
                {program.steps.length}
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">VMA</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-primary">
                {program.vma} km/h
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warmup Section */}
      {warmupSteps.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge className="bg-blue-500 text-white border-0 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
              Échauffement
            </Badge>
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {warmupSteps.length} étape{warmupSteps.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {warmupSteps.map((stepResult, index) => (
              <StepCard
                key={stepResult.step.id}
                stepResult={stepResult}
                index={index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Section */}
      {mainSteps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-orange-500 text-white border-0 text-sm px-3 py-1">
              Travail Principal
            </Badge>
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {mainSteps.length} étape{mainSteps.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {mainSteps.map((stepResult, index) => (
              <StepCard
                key={stepResult.step.id}
                stepResult={stepResult}
                index={warmupSteps.length + index}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cooldown Section */}
      {cooldownSteps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-green-500 text-white border-0 text-sm px-3 py-1">
              Retour au Calme
            </Badge>
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground">
              {cooldownSteps.length} étape{cooldownSteps.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cooldownSteps.map((stepResult, index) => (
              <StepCard
                key={stepResult.step.id}
                stepResult={stepResult}
                index={warmupSteps.length + mainSteps.length + index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
