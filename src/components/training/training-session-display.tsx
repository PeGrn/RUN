'use client';

import { Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingElement } from '@/lib/vma';

// --- UTILITAIRES DE FORMATAGE ---

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationFriendly(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const remainingSeconds = seconds % 3600;
  const mins = Math.floor(remainingSeconds / 60);
  const secs = Math.round(remainingSeconds % 60);

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}` : `${hours}h`;
  }
  if (mins > 0) {
    return secs > 0 ? `${mins}min ${secs}` : `${mins}min`;
  }
  return `${secs}sec`;
}

export function parseDuration(input: string | undefined): number {
  if (!input) return 0;
  if (input.includes(':')) {
    const [min, sec] = input.split(':').map(Number);
    return (min || 0) * 60 + (sec || 0);
  }
  const val = parseFloat(input);
  if (!isNaN(val)) {
     return val * 60; // Assume minutes par défaut
  }
  return 0;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatPace(speedKmh: number): string {
  if (!speedKmh || speedKmh <= 0) return "";
  const secondsPerKm = 3600 / speedKmh;
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}'${secs.toString().padStart(2, '0')}/km`;
}

export function calculateSplit200m(speedKmh: number): string {
  if (speedKmh <= 0) return "";
  const seconds = (0.2 / speedKmh) * 3600;
  const rounded = Math.round(seconds);
  if (rounded < 60) return `${rounded}"`;
  return formatDurationFriendly(rounded);
}

export function getIntensityColor(vmaPercentage: number): string {
  if (vmaPercentage < 70) return "text-green-600";
  if (vmaPercentage < 85) return "text-blue-600";
  if (vmaPercentage < 100) return "text-orange-500";
  return "text-red-600";
}

export function getIntensityLabel(vmaPercentage: number): string {
  if (vmaPercentage < 70) return "Allure EF";
  if (vmaPercentage < 90) return "Allure Active";
  return "Allure VMA";
}

// --- COMPOSANT VISUEL DES ÉTAPES ---

interface ProgramStepsProps {
  elements: TrainingElement[];
  userVma: number | null;
}

export function ProgramSteps({ elements, userVma }: ProgramStepsProps) {
  if (!elements || elements.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun détail disponible</p>;
  }

  return (
    <div className="space-y-4">
      {elements.map((block, blockIndex) => {
        const isRepetition = block.repetitions > 1;

        return (
          <div key={blockIndex} className="flex gap-3">
            {/* Badge Numéro du Bloc */}
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {blockIndex + 1}
              </div>
            </div>

            {/* Contenu du Bloc */}
            <div className="flex-1 space-y-2">
              <div className={cn("relative flex flex-col gap-2", isRepetition && "pr-12")}>

                {block.steps.map((step, stepIndex) => {
                  const isTimeBased = step.type === 'time';
                  const speed = userVma ? userVma * (step.vmaPercentage / 100) : 0;
                  const targetPace = (userVma && speed > 0) ? formatPace(speed) : null;

                  // Déterminer la valeur principale à afficher
                  let mainValue = "";
                  if (isTimeBased) {
                    const durationSec = parseDuration(step.duration);
                    mainValue = formatDurationFriendly(durationSec);
                  } else {
                    mainValue = formatDistance(step.distance);
                  }

                  // Calculer la valeur secondaire
                  let secondaryValue = null;
                  let effectiveDistance = step.distance;

                  if (userVma && speed > 0) {
                    if (isTimeBased) {
                      // Temps -> Dist
                      const seconds = parseDuration(step.duration);
                      effectiveDistance = (seconds * speed * 1000) / 3600;
                      secondaryValue = `~${formatDistance(effectiveDistance)}`;
                    } else {
                      // Dist -> Temps
                      effectiveDistance = step.distance;
                      const timeSeconds = (step.distance / 1000 / speed) * 3600;
                      secondaryValue = formatDurationFriendly(timeSeconds);
                    }
                  }

                  // Split 200m
                  const split200 = (userVma && speed > 0 && effectiveDistance > 200)
                    ? calculateSplit200m(speed)
                    : null;

                  return (
                    <div key={stepIndex} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border bg-white p-3 shadow-sm">
                      {/* Gauche: Consigne */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">
                          {mainValue}
                        </span>

                        {secondaryValue ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-primary flex items-baseline gap-1">
                              <span>({secondaryValue}</span>
                              {targetPace && (
                                <span className="text-xs text-muted-foreground font-normal">
                                  @ {targetPace}
                                </span>
                              )}
                              <span>)</span>
                            </span>

                            {split200 && (
                              <span className="text-[10px] font-medium text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                200m: {split200}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            à {(step.vmaPercentage)}% VMA
                          </span>
                        )}
                      </div>

                      {/* Droite: Infos */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 sm:mt-0">
                        {secondaryValue && (
                           <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                             {step.vmaPercentage}% VMA
                           </span>
                        )}

                        <span className={cn("text-xs font-semibold uppercase", getIntensityColor(step.vmaPercentage))}>
                          {getIntensityLabel(step.vmaPercentage)}
                        </span>

                        <div className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <span className="text-[10px]">R:</span> {(!step.rest || step.rest === '0"' || step.rest === '0') ? "0" : step.rest}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Badge Répétition */}
                {isRepetition && (
                  <div className="absolute top-1/2 -right-0 -translate-y-1/2 flex flex-col items-center gap-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white shadow-md">
                      {block.repetitions}x
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                      <Repeat className="h-3 w-3" />
                    </div>
                  </div>
                )}
              </div>

              {isRepetition && (
                 <div className="h-full w-4 absolute right-4 top-0 border-r-2 border-orange-200 rounded-r-lg -z-10" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
