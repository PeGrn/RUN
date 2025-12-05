'use client';

import { BuilderStep } from '@/lib/vma/builder-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

  // Calculate pace (min/km)
  const paceMinPerKm = speed > 0 ? 60 / speed : 0;
  const paceMinutes = Math.floor(paceMinPerKm);
  const paceSeconds = Math.round((paceMinPerKm - paceMinutes) * 60);
  const paceFormatted = speed > 0 ? `${paceMinutes}'${paceSeconds.toString().padStart(2, '0')}` : '-';

  const handleChange = (field: keyof BuilderStep, value: string | number) => {
    onChange({
      ...step,
      [field]: value
    });
  };

  // Render mobile card view
  const renderMobileCard = () => (
    <Card className="p-3 space-y-3">
      {/* Row 1: Distance & VMA% */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Distance</label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={step.distance}
              onChange={(e) => handleChange('distance', parseInt(e.target.value) || 0)}
              className="w-full h-9 text-sm"
              min="0"
              step="50"
            />
            <span className="text-xs text-muted-foreground">m</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">% VMA</label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={step.vmaPercentage}
              onChange={(e) => handleChange('vmaPercentage', parseInt(e.target.value) || 0)}
              className="w-full h-9 text-sm"
              min="0"
              max="200"
              step="5"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      {/* Row 2: Calculated values */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30 rounded">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-0.5">Vitesse</div>
          <div className="text-sm font-semibold">{speed.toFixed(1)} km/h</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-0.5">Allure</div>
          <div className="text-sm font-mono font-semibold">{paceFormatted}/km</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-0.5">Temps</div>
          <div className="text-sm font-mono font-semibold text-primary">{formatTime(targetTime)}</div>
        </div>
      </div>

      {/* Row 3: Rest & Actions */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground block mb-1">Récupération</label>
          <Input
            type="text"
            value={step.rest}
            onChange={(e) => handleChange('rest', e.target.value)}
            placeholder="0&quot;"
            className="w-full h-9 font-mono text-sm"
          />
        </div>
        <div className="flex gap-1">
          {onDuplicate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="h-9 w-9 p-0"
              title="Dupliquer"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  // Render desktop table view
  const renderDesktopTable = () => (
    <>
      {/* Distance */}
      <td className="px-2 md:px-3 py-2">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={step.distance}
            onChange={(e) => handleChange('distance', parseInt(e.target.value) || 0)}
            className="w-20 h-8 text-sm"
            min="0"
            step="50"
          />
          <span className="text-xs text-muted-foreground">m</span>
        </div>
      </td>

      {/* VMA % */}
      <td className="px-2 md:px-3 py-2">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={step.vmaPercentage}
            onChange={(e) => handleChange('vmaPercentage', parseInt(e.target.value) || 0)}
            className="w-16 h-8 text-sm"
            min="0"
            max="200"
            step="5"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </td>

      {/* Speed (calculated) */}
      <td className="px-2 md:px-3 py-2">
        <span className="text-sm font-medium whitespace-nowrap">
          {speed.toFixed(1)} km/h
        </span>
      </td>

      {/* Pace (calculated) */}
      <td className="px-2 md:px-3 py-2">
        <span className="text-sm font-mono font-medium text-muted-foreground whitespace-nowrap">
          {paceFormatted} /km
        </span>
      </td>

      {/* Target Time (calculated) */}
      <td className="px-2 md:px-3 py-2">
        <span className="text-sm font-mono font-medium text-primary whitespace-nowrap">
          {formatTime(targetTime)}
        </span>
      </td>

      {/* Rest */}
      <td className="px-2 md:px-3 py-2">
        <Input
          type="text"
          value={step.rest}
          onChange={(e) => handleChange('rest', e.target.value)}
          placeholder="0&quot;"
          className="w-20 h-8 font-mono text-sm"
        />
      </td>

      {/* Actions */}
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          {onDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="h-8 w-8 p-0 hover:bg-primary/10"
              title="Dupliquer"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </>
  );

  // Return mobile or desktop view based on screen size
  if (isInBlock) {
    return renderDesktopTable();
  }

  return (
    <>
      <div className="md:hidden">
        {renderMobileCard()}
      </div>
      <div className="hidden md:contents">
        {renderDesktopTable()}
      </div>
    </>
  );
}
