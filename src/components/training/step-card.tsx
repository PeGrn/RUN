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
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-muted-foreground/30">
                  #{index + 1}
                </span>
                <h3 className="text-xl font-bold">{step.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
            <Badge className={`${groupColor} border`}>
              {groupLabels[step.group]}
            </Badge>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Target Time */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span>Temps</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatTime(targetTime)}
              </div>
            </div>

            {/* Pace */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>Allure</span>
              </div>
              <div className="text-2xl font-bold">
                {targetPace}
              </div>
            </div>

            {/* Distance */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Route className="h-4 w-4" />
                <span>Distance</span>
              </div>
              <div className="text-lg font-semibold">
                {step.distance}m
              </div>
            </div>

            {/* Repetitions */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Repeat className="h-4 w-4" />
                <span>Répétitions</span>
              </div>
              <div className="text-lg font-semibold">
                {step.repetitions}x
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Vitesse: </span>
                <span className="font-semibold">{speed} km/h</span>
              </div>
              <div>
                <span className="text-muted-foreground">VMA: </span>
                <span className="font-semibold">
                  {(step.vmaMultiplier * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            {step.rest && step.rest !== '0"' && (
              <Badge variant="outline" className="font-mono">
                Repos: {step.rest}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
