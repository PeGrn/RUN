'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

interface VMASelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function VMASelector({
  value,
  onChange,
  min = 10,
  max = 25,
  step = 0.5
}: VMASelectorProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0];
    setLocalValue(newValue);
    onChange(newValue);
  };

  const getVMALevel = (vma: number): { label: string; color: string } => {
    if (vma < 14) return { label: 'Débutant', color: 'bg-red-500' };
    if (vma < 16) return { label: 'Intermédiaire', color: 'bg-yellow-500' };
    if (vma < 18) return { label: 'Confirmé', color: 'bg-blue-500' };
    if (vma < 20) return { label: 'Avancé', color: 'bg-green-500' };
    return { label: 'Expert', color: 'bg-purple-500' };
  };

  const level = getVMALevel(localValue);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardTitle className="flex items-center justify-between">
          <span>Votre VMA</span>
          <Badge variant="outline" className="text-lg font-bold px-4 py-1">
            {localValue} km/h
          </Badge>
        </CardTitle>
        <CardDescription>
          Sélectionnez votre Vitesse Maximale Aérobie
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* VMA Display */}
          <div className="text-center space-y-2">
            <div className="relative">
              <div className="text-6xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                {localValue}
              </div>
              <div className="text-sm text-muted-foreground">km/h</div>
            </div>
            <Badge className={`${level.color} text-white border-0`}>
              {level.label}
            </Badge>
          </div>

          {/* Slider */}
          <div className="space-y-4 px-2">
            <Slider
              value={[localValue]}
              onValueChange={handleSliderChange}
              min={min}
              max={max}
              step={step}
              className="cursor-pointer"
            />

            {/* Min/Max Labels */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{min} km/h</span>
              <span>{max} km/h</span>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {[12, 14, 16, 18, 20].map((vma) => (
              <button
                key={vma}
                onClick={() => {
                  setLocalValue(vma);
                  onChange(vma);
                }}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-all
                  ${localValue === vma
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-secondary hover:bg-secondary/80'
                  }
                `}
              >
                {vma}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
