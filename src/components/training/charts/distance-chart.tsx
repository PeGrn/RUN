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

interface DistanceChartProps {
  program: VMAProgram;
}

export function DistanceChart({ program }: DistanceChartProps) {
  // Prepare cumulative distance data
  let cumulativeDistance = 0;
  const data = program.steps.map((stepResult, index) => {
    cumulativeDistance += stepResult.step.distance * stepResult.step.repetitions;
    return {
      step: stepResult.step.name,
      stepNumber: index + 1,
      distance: Number((cumulativeDistance / 1000).toFixed(2)), // in km
      stepDistance: Number(((stepResult.step.distance * stepResult.step.repetitions) / 1000).toFixed(2)),
    };
  });

  return (
    <div className="w-full bg-card rounded-lg border p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Distance cumulée</h3>
        <p className="text-sm text-muted-foreground">
          Progression de la distance au fil des étapes
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="stepNumber"
            label={{ value: 'Étape', position: 'insideBottom', offset: -5 }}
            className="text-xs"
          />
          <YAxis
            label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }}
            className="text-xs"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelFormatter={(value) => `Étape ${value}`}
            formatter={(value: number, name: string) => {
              if (name === 'Distance cumulée') {
                return [`${value.toFixed(2)} km`, name];
              }
              return [value, name];
            }}
          />
          <Area
            type="monotone"
            dataKey="distance"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#colorDistance)"
            name="Distance cumulée"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Distance totale:</span>
          <span className="ml-2 font-semibold">
            {(program.totalDistance / 1000).toFixed(2)} km
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Durée estimée:</span>
          <span className="ml-2 font-semibold">{program.estimatedDuration}</span>
        </div>
      </div>
    </div>
  );
}
