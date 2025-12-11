'use client';

import { VMAProgram } from '@/lib/vma';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';

interface SpeedChartProps {
  program: VMAProgram;
}

const BLOCK_GAP_DISTANCE = 0.2; // 200m en km
const REST_TIME_TO_DISTANCE_RATIO = 0.001; // 1 seconde de repos = 1m sur le graphe

// Helper pour convertir le temps de repos en secondes
function parseRestTime(rest: string): number {
  if (!rest || rest === '0' || rest === '0"') return 0;

  // Format MM:SS ou MM'SS"
  const match = rest.match(/(\d+)[':](\d+)/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    return minutes * 60 + seconds;
  }

  // Format juste secondes avec "
  const secondsMatch = rest.match(/(\d+)"/);
  if (secondsMatch) {
    return parseInt(secondsMatch[1], 10);
  }

  // Format juste minutes
  const minutesMatch = rest.match(/(\d+)'/);
  if (minutesMatch) {
    return parseInt(minutesMatch[1], 10) * 60;
  }

  return 0;
}

export function SpeedChart({ program }: SpeedChartProps) {
  // Build chart data for step chart: create start and end points for each step
  // to form horizontal plateaus
  const data: Array<{
    step: string;
    stepNumber: number;
    vmaPercentage: number;
    distance: number;
    cumulativeDistance: number;
    isPause?: boolean;
  }> = [];

  // Pour tracer les zones de pause entre blocs
  const pauseZones: Array<{ start: number; end: number }> = [];

  // Pour tracer les zones de récupération entre étapes
  const recoveryZones: Array<{ start: number; end: number; duration: number }> = [];

  let stepCounter = 0;
  let cumulativeDistance = 0;
  let previousBlockId: string | null = null;

  // Process each step in the program and unfold repetitions
  // Detect blocks of steps with same blockId and alternate them
  let i = 0;
  while (i < program.steps.length) {
    const currentStep = program.steps[i];
    const repetitions = currentStep.step.repetitions || 1;
    const blockId = currentStep.step.blockId;

    // Ajouter un gap si on change de bloc (sauf pour le premier bloc)
    if (previousBlockId !== null && blockId !== previousBlockId) {
      const pauseStart = cumulativeDistance / 1000;
      const pauseEnd = (cumulativeDistance + BLOCK_GAP_DISTANCE * 1000) / 1000;

      pauseZones.push({
        start: Number(pauseStart.toFixed(3)),
        end: Number(pauseEnd.toFixed(3)),
      });

      // Ajouter un point de rupture (null) pour arrêter la ligne
      data.push({
        step: 'Pause',
        stepNumber: 0,
        vmaPercentage: null as any,
        distance: 0,
        cumulativeDistance: Number(pauseStart.toFixed(3)),
        isPause: true,
      });

      cumulativeDistance += BLOCK_GAP_DISTANCE * 1000; // Ajouter 200m

      // Ajouter un autre point de rupture après la pause
      data.push({
        step: 'Pause',
        stepNumber: 0,
        vmaPercentage: null as any,
        distance: 0,
        cumulativeDistance: Number(pauseEnd.toFixed(3)),
        isPause: true,
      });
    }

    if (repetitions > 1 && blockId) {
      // Collect all consecutive steps with the same blockId (same block)
      const blockSteps = [currentStep];
      let j = i + 1;

      while (j < program.steps.length && program.steps[j].step.blockId === blockId) {
        blockSteps.push(program.steps[j]);
        j++;
      }

      // Alternate through the block steps for each repetition
      for (let rep = 0; rep < repetitions; rep++) {
        for (const stepResult of blockSteps) {
          stepCounter++;

          const stepStart = cumulativeDistance;
          const stepEnd = stepStart + stepResult.step.distance;
          const vmaPercentage = Math.round(stepResult.step.vmaMultiplier * 100);

          // Add point at start of step
          data.push({
            step: stepResult.step.name,
            stepNumber: stepCounter,
            vmaPercentage,
            distance: stepResult.step.distance,
            cumulativeDistance: Number((stepStart / 1000).toFixed(3)),
          });

          // Add point at end of step (creates horizontal plateau)
          data.push({
            step: stepResult.step.name,
            stepNumber: stepCounter,
            vmaPercentage,
            distance: stepResult.step.distance,
            cumulativeDistance: Number((stepEnd / 1000).toFixed(3)),
          });

          cumulativeDistance = stepEnd;

          // Ajouter une zone de récupération si l'étape a un temps de repos
          const restSeconds = parseRestTime(stepResult.step.rest);
          if (restSeconds > 0) {
            const recoveryStart = cumulativeDistance / 1000;
            const recoveryDistance = restSeconds * REST_TIME_TO_DISTANCE_RATIO * 1000; // en mètres
            const recoveryEnd = (cumulativeDistance + recoveryDistance) / 1000;

            recoveryZones.push({
              start: Number(recoveryStart.toFixed(3)),
              end: Number(recoveryEnd.toFixed(3)),
              duration: restSeconds,
            });

            // Points de rupture pour la récupération
            data.push({
              step: 'Récup',
              stepNumber: 0,
              vmaPercentage: null as any,
              distance: 0,
              cumulativeDistance: Number(recoveryStart.toFixed(3)),
              isPause: true,
            });

            cumulativeDistance += recoveryDistance;

            data.push({
              step: 'Récup',
              stepNumber: 0,
              vmaPercentage: null as any,
              distance: 0,
              cumulativeDistance: Number(recoveryEnd.toFixed(3)),
              isPause: true,
            });
          }
        }
      }

      previousBlockId = blockId;
      i = j; // Skip past all steps in this block
    } else {
      // Single step (no repetition block)
      stepCounter++;

      const stepStart = cumulativeDistance;
      const stepEnd = stepStart + currentStep.step.distance;
      const vmaPercentage = Math.round(currentStep.step.vmaMultiplier * 100);

      // Add point at start of step
      data.push({
        step: currentStep.step.name,
        stepNumber: stepCounter,
        vmaPercentage,
        distance: currentStep.step.distance,
        cumulativeDistance: Number((stepStart / 1000).toFixed(3)),
      });

      // Add point at end of step (creates horizontal plateau)
      data.push({
        step: currentStep.step.name,
        stepNumber: stepCounter,
        vmaPercentage,
        distance: currentStep.step.distance,
        cumulativeDistance: Number((stepEnd / 1000).toFixed(3)),
      });

      cumulativeDistance = stepEnd;

      // Ajouter une zone de récupération si l'étape a un temps de repos
      const restSeconds = parseRestTime(currentStep.step.rest);
      if (restSeconds > 0) {
        const recoveryStart = cumulativeDistance / 1000;
        const recoveryDistance = restSeconds * REST_TIME_TO_DISTANCE_RATIO * 1000; // en mètres
        const recoveryEnd = (cumulativeDistance + recoveryDistance) / 1000;

        recoveryZones.push({
          start: Number(recoveryStart.toFixed(3)),
          end: Number(recoveryEnd.toFixed(3)),
          duration: restSeconds,
        });

        // Points de rupture pour la récupération
        data.push({
          step: 'Récup',
          stepNumber: 0,
          vmaPercentage: null as any,
          distance: 0,
          cumulativeDistance: Number(recoveryStart.toFixed(3)),
          isPause: true,
        });

        cumulativeDistance += recoveryDistance;

        data.push({
          step: 'Récup',
          stepNumber: 0,
          vmaPercentage: null as any,
          distance: 0,
          cumulativeDistance: Number(recoveryEnd.toFixed(3)),
          isPause: true,
        });
      }

      previousBlockId = blockId || `single-${i}`;
      i++;
    }
  }

  return (
    <div className="w-full bg-card rounded-lg border p-3 sm:p-4 md:p-6">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold">Évolution de l'intensité</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Pourcentage de VMA par étape • <span className="text-green-600">Changement de bloc</span> • <span className="text-blue-500">Récupérations</span>
        </p>
      </div>
      <div className="h-[250px] sm:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
            <defs>
              {/* Gradient pour la courbe principale */}
              <linearGradient id="colorVMA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>

              {/* Pattern hachuré vert pour les changements de blocs */}
              <pattern id="pausePattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                <rect width="8" height="8" fill="rgba(34, 197, 94, 0.1)" />
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="2" />
              </pattern>

              {/* Pattern hachuré bleu doux pour les récupérations */}
              <pattern id="recoveryPattern" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
                <rect width="4" height="4" fill="rgba(59, 130, 246, 0.05)" />
                <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="1" />
              </pattern>
            </defs>

            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

            <XAxis
              dataKey="cumulativeDistance"
              label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5 }}
              className="text-xs"
              type="number"
              domain={[0, 'dataMax']}
            />
            <YAxis
              label={{ value: '% VMA', angle: -90, position: 'insideLeft' }}
              className="text-xs"
              domain={[0, 'auto']}
            />

            {/* Zones de récupération hachurées en bleu (plus discrètes) */}
            {recoveryZones.map((zone, index) => (
              <ReferenceArea
                key={`recovery-${index}`}
                x1={zone.start}
                x2={zone.end}
                fill="url(#recoveryPattern)"
                fillOpacity={1}
                stroke="rgb(59, 130, 246)"
                strokeWidth={1}
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />
            ))}

            {/* Zones de pause hachurées en vert (entre blocs) */}
            {pauseZones.map((zone, index) => (
              <ReferenceArea
                key={`pause-${index}`}
                x1={zone.start}
                x2={zone.end}
                fill="url(#pausePattern)"
                fillOpacity={1}
                stroke="rgb(34, 197, 94)"
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: 'Pause',
                  position: 'top',
                  fill: 'rgb(34, 197, 94)',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            ))}

            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              labelFormatter={(value) => `${value} km`}
              formatter={(value: number, name: string, props: any) => {
                const stepNum = props.payload.stepNumber;
                const stepName = props.payload.step;
                const stepDist = props.payload.distance;
                return [
                  `${value}% VMA`,
                  `Étape ${stepNum}: ${stepName} (${stepDist}m)`
                ];
              }}
            />

            <Area
              type="step"
              dataKey="vmaPercentage"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#colorVMA)"
              name="% VMA"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
