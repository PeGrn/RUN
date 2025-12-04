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
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-background">
        <CardHeader>
          <CardTitle className="text-2xl">Résumé de l'entraînement</CardTitle>
          <CardDescription>
            Programme personnalisé pour une VMA de {program.vma} km/h
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Durée totale</span>
              </div>
              <div className="text-2xl font-bold">
                {program.estimatedDuration}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Route className="h-4 w-4" />
                <span>Distance totale</span>
              </div>
              <div className="text-2xl font-bold">
                {(program.totalDistance / 1000).toFixed(2)} km
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flame className="h-4 w-4" />
                <span>Étapes</span>
              </div>
              <div className="text-2xl font-bold">
                {program.steps.length}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>VMA</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {program.vma} km/h
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warmup Section */}
      {warmupSteps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-500 text-white border-0 text-sm px-3 py-1">
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
