'use client';

import { VMAProgram } from '@/lib/vma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Route, Flame, TrendingUp } from 'lucide-react';

interface TrainingPlanDisplayProps {
  program: VMAProgram;
}

export function TrainingPlanDisplay({ program }: TrainingPlanDisplayProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-background">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl">Résumé de l&apos;entraînement</CardTitle>
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
    </div>
  );
}
