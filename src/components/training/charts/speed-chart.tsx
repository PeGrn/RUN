'use client';

import { VMAProgram } from '@/lib/vma';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SpeedChartProps {
  program: VMAProgram;
}

export function SpeedChart({ program }: SpeedChartProps) {
  // Prepare data for the chart
  const data = program.steps.map((stepResult, index) => ({
    step: stepResult.step.name,
    stepNumber: index + 1,
    vitesse: Number(stepResult.speed.toFixed(2)),
    vmaPercentage: Math.round(stepResult.step.vmaMultiplier * 100),
    distance: stepResult.step.distance,
  }));

  return (
    <div className="w-full bg-card rounded-lg border p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Évolution de la vitesse</h3>
        <p className="text-sm text-muted-foreground">
          Vitesse et pourcentage de VMA par étape
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="stepNumber"
            label={{ value: 'Étape', position: 'insideBottom', offset: -5 }}
            className="text-xs"
          />
          <YAxis
            yAxisId="left"
            label={{ value: 'Vitesse (km/h)', angle: -90, position: 'insideLeft' }}
            className="text-xs"
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: '% VMA', angle: 90, position: 'insideRight' }}
            className="text-xs"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
            labelFormatter={(value) => `Étape ${value}`}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="vitesse"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            name="Vitesse (km/h)"
            dot={{ fill: 'hsl(var(--primary))' }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="vmaPercentage"
            stroke="hsl(142.1 76.2% 36.3%)"
            strokeWidth={2}
            name="% VMA"
            dot={{ fill: 'hsl(142.1 76.2% 36.3%)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
