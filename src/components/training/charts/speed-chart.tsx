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
} from 'recharts';

interface SpeedChartProps {
  program: VMAProgram;
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
  }> = [];

  let stepCounter = 0;
  let cumulativeDistance = 0;

  // Process each step in the program and unfold repetitions
  // Detect blocks of steps with same repetition count and alternate them
  let i = 0;
  while (i < program.steps.length) {
    const currentStep = program.steps[i];
    const repetitions = currentStep.step.repetitions || 1;

    if (repetitions > 1) {
      // Collect all consecutive steps with the same repetition count (same block)
      const blockSteps = [currentStep];
      let j = i + 1;

      while (j < program.steps.length && (program.steps[j].step.repetitions || 1) === repetitions) {
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
        }
      }

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
      i++;
    }
  }

  return (
    <div className="w-full bg-card rounded-lg border p-3 sm:p-4 md:p-6">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold">Évolution de l'intensité</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Pourcentage de VMA par étape
        </p>
      </div>
      <div className="h-[250px] sm:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorVMA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
              </linearGradient>
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
