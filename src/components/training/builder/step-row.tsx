'use client';

import { BuilderStep } from '@/lib/vma/builder-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, Copy } from 'lucide-react';
import { calculateTime, formatTime } from '@/lib/vma';

interface StepRowProps {
  step: BuilderStep;
  vma: number;
  onChange: (step: BuilderStep) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  isInBlock?: boolean;
}

export function StepRow({ step, vma, onChange, onDelete, onDuplicate, isInBlock = false }: StepRowProps) {
  // Calculate target time based on VMA
  const speed = vma * (step.vmaPercentage / 100);
  const targetTime = calculateTime(step.distance, speed);

  const handleChange = (field: keyof BuilderStep, value: string | number) => {
    onChange({
      ...step,
      [field]: value
    });
  };

  return (
    <>
      {/* Distance */}
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={step.distance}
            onChange={(e) => handleChange('distance', parseInt(e.target.value) || 0)}
            className="w-16 sm:w-20 md:w-24 h-8 text-xs sm:text-sm"
            min="0"
            step="50"
          />
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">m</span>
        </div>
      </td>

      {/* VMA % */}
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={step.vmaPercentage}
            onChange={(e) => handleChange('vmaPercentage', parseInt(e.target.value) || 0)}
            className="w-14 sm:w-16 md:w-20 h-8 text-xs sm:text-sm"
            min="0"
            max="200"
            step="5"
          />
          <span className="text-xs sm:text-sm text-muted-foreground">%</span>
        </div>
      </td>

      {/* Speed (calculated) */}
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
          {speed.toFixed(1)}
          <span className="hidden sm:inline"> km/h</span>
          <span className="sm:hidden text-xs text-muted-foreground ml-0.5">km/h</span>
        </span>
      </td>

      {/* Target Time (calculated) */}
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <span className="text-xs sm:text-sm font-mono font-medium text-primary whitespace-nowrap">
          {formatTime(targetTime)}
        </span>
      </td>

      {/* Rest */}
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <Input
          type="text"
          value={step.rest}
          onChange={(e) => handleChange('rest', e.target.value)}
          placeholder="0&quot;"
          className="w-14 sm:w-20 md:w-24 h-8 font-mono text-xs sm:text-sm"
        />
      </td>

      {/* Actions */}
      <td className="px-2 sm:px-3 py-2 sm:py-3">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {onDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-primary/10"
              title="Dupliquer"
            >
              <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </td>
    </>
  );
}
