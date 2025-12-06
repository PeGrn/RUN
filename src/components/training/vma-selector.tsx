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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-6">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <span className="truncate">Votre VMA</span>
          <Badge variant="outline" className="text-base sm:text-lg font-bold px-3 sm:px-4 py-0.5 sm:py-1 whitespace-nowrap ml-2">
            {localValue} km/h
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1.5">
          Sélectionnez votre Vitesse Maximale Aérobie
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* VMA Display */}
          <div className="text-center space-y-2">
            <div className="relative">
              <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                {localValue}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">km/h</div>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-3 sm:space-y-4 px-1 sm:px-2">
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
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[12, 14, 16, 18, 20].map((vma) => (
              <button
                key={vma}
                onClick={() => {
                  setLocalValue(vma);
                  onChange(vma);
                }}
                className={`
                  px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all
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
