'use client';

import { StepResult } from '@/lib/vma';
import { formatTime, getStepGroupColor } from '@/lib/vma';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Zap, Route, Repeat } from 'lucide-react';

interface StepCardProps {
  stepResult: StepResult;
  index: number;
}

export function StepCard({ stepResult, index }: StepCardProps) {
  const { step, targetTime, targetPace, speed } = stepResult;
  const groupColor = getStepGroupColor(step.group);

  // Group labels
  const groupLabels = {
    warmup: 'Échauffement',
    main: 'Travail Principal',
    cooldown: 'Retour au Calme'
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className={`h-1 ${groupColor.split(' ')[0]}`} />
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-2xl font-bold text-muted-foreground/30 flex-shrink-0">
                  #{index + 1}
                </span>
                <h3 className="text-base sm:text-xl font-bold truncate">{step.name}</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {step.description}
              </p>
            </div>
            <Badge className={`${groupColor} border flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1`}>
              {groupLabels[step.group]}
            </Badge>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Target Time */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Timer className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Temps</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {formatTime(targetTime)}
              </div>
            </div>

            {/* Pace */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Allure</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold">
                {targetPace}
              </div>
            </div>

            {/* Distance */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Route className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Distance</span>
              </div>
              <div className="text-base sm:text-lg font-semibold">
                {step.distance}m
              </div>
            </div>

            {/* Repetitions */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Repeat className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Répétitions</span>
              </div>
              <div className="text-base sm:text-lg font-semibold">
                {step.repetitions}x
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-3 sm:pt-4 border-t">
            <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="whitespace-nowrap">
                <span className="text-muted-foreground">Vitesse: </span>
                <span className="font-semibold">{speed} km/h</span>
              </div>
              <div className="whitespace-nowrap">
                <span className="text-muted-foreground">VMA: </span>
                <span className="font-semibold">
                  {(step.vmaMultiplier * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            {step.rest && step.rest !== '0"' && (
              <Badge variant="outline" className="font-mono text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
                Repos: {step.rest}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
