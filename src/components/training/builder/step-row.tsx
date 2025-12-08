'use client';

import { BuilderStep } from '@/lib/vma/builder-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Trash2, Copy } from 'lucide-react';
import { calculateTime, formatTime } from '@/lib/vma';
import { cn } from '@/lib/utils';

interface StepRowProps {
  step: BuilderStep;
  vma: number;
  onChange: (step: BuilderStep) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  isInBlock?: boolean;
}

export function StepRow({ step, vma, onChange, onDelete, onDuplicate, isInBlock = false }: StepRowProps) {
  // Calculs pour l'affichage (informatif)
  const speed = vma * (step.vmaPercentage / 100);
  
  let infoValue = '';
  let infoLabel = '';

  if (step.type === 'time') {
    // Estimation distance si mode Temps
    const parts = step.duration.split(':');
    const seconds = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : parseInt(step.duration) * 60 || 0;
    const dist = (seconds * speed * 1000) / 3600;
    infoValue = `${Math.round(dist)}m`;
    infoLabel = 'Dist. estimée';
  } else {
    // Estimation temps si mode Distance
    const time = calculateTime(step.distance, speed);
    infoValue = formatTime(time);
    infoLabel = 'Temps estimé';
  }

  // Calcul allure
  const paceMinPerKm = speed > 0 ? 60 / speed : 0;
  const paceMinutes = Math.floor(paceMinPerKm);
  const paceSeconds = Math.round((paceMinPerKm - paceMinutes) * 60);
  const paceFormatted = speed > 0 ? `${paceMinutes}'${paceSeconds.toString().padStart(2, '0')}` : '-';

  // --- LOGIQUE D'EXCLUSION MUTUELLE ---

  const handleDistanceChange = (val: number) => {
    onChange({
      ...step,
      type: 'distance',     // On force le type distance
      distance: val,
      duration: ''          // On vide le champ durée
    });
  };

  const handleDurationChange = (val: string) => {
    onChange({
      ...step,
      type: 'time',         // On force le type temps
      duration: val,
      distance: 0           // On vide le champ distance (ou 0)
    });
  };

  const handleVmaChange = (val: number) => {
    onChange({ ...step, vmaPercentage: val });
  };

  const handleRestChange = (val: string) => {
    onChange({ ...step, rest: val });
  };

  // --- Rendu Mobile (Card) ---
  const renderMobileCard = () => (
    <Card className={cn(
      "p-3 space-y-3 relative overflow-hidden transition-colors",
      // Subtil changement de bordure selon le mode
      step.type === 'distance' ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-orange-500"
    )}>
      <div className="grid grid-cols-2 gap-3 pl-2">
        {/* Champ Distance */}
        <div>
          <Label className={cn("text-xs mb-1 block", step.type === 'distance' ? "text-blue-600 font-semibold" : "text-muted-foreground")}>
            Distance (m)
          </Label>
          <Input
            type="number"
            value={step.distance || ''} // Affiche vide si 0
            onChange={(e) => handleDistanceChange(parseInt(e.target.value) || 0)}
            className={cn("h-9 text-sm transition-opacity", step.type === 'time' && "opacity-50 focus:opacity-100")}
            placeholder={step.type === 'time' ? "---" : "ex: 200"}
          />
        </div>

        {/* Champ Durée */}
        <div>
          <Label className={cn("text-xs mb-1 block", step.type === 'time' ? "text-orange-600 font-semibold" : "text-muted-foreground")}>
            Durée (mm:ss)
          </Label>
          <Input
            type="text"
            value={step.duration}
            onChange={(e) => handleDurationChange(e.target.value)}
            className={cn("h-9 text-sm transition-opacity", step.type === 'distance' && "opacity-50 focus:opacity-100")}
            placeholder={step.type === 'distance' ? "---" : "ex: 10:00"}
          />
        </div>

        {/* VMA */}
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground mb-1 block">% VMA</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={step.vmaPercentage}
              onChange={(e) => handleVmaChange(parseInt(e.target.value) || 0)}
              className="h-9 text-sm"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      {/* Stats calculées */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30 rounded ml-2">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">Vitesse</div>
          <div className="text-xs font-semibold">{speed.toFixed(1)} km/h</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">Allure</div>
          <div className="text-xs font-mono font-semibold">{paceFormatted}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">{infoLabel}</div>
          <div className="text-xs font-mono font-semibold text-primary">{infoValue}</div>
        </div>
      </div>

      {/* Footer: Récup + Actions */}
      <div className="flex items-end gap-2 pl-2">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1 block">Récup.</Label>
          <Input
            type="text"
            value={step.rest}
            onChange={(e) => handleRestChange(e.target.value)}
            placeholder='ex: 1&apos;30"'
            className="h-8 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {onDuplicate && (
            <Button variant="outline" size="sm" onClick={onDuplicate} className="h-8 w-8 p-0">
              <Copy className="h-3 w-3" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );

  // --- Rendu Desktop (Table) ---
  const renderDesktopTable = () => (
    <>
      {/* Colonne Distance */}
      <td className="px-2 py-2 w-[110px]">
         <div className="flex items-center gap-1">
           <Input
             type="number"
             value={step.distance || ''}
             onChange={(e) => handleDistanceChange(parseInt(e.target.value) || 0)}
             className={cn("h-8 text-sm", step.type === 'time' && "opacity-40 focus:opacity-100 bg-muted/50")}
             placeholder="m"
           />
         </div>
      </td>

      {/* Colonne Durée */}
      <td className="px-2 py-2 w-[110px]">
         <Input
           type="text"
           value={step.duration}
           onChange={(e) => handleDurationChange(e.target.value)}
           className={cn("h-8 text-sm", step.type === 'distance' && "opacity-40 focus:opacity-100 bg-muted/50")}
           placeholder="mm:ss"
         />
      </td>

      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={step.vmaPercentage}
            onChange={(e) => handleVmaChange(parseInt(e.target.value) || 0)}
            className="w-16 h-8 text-sm"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </td>

      <td className="px-2 py-2 text-sm font-medium">{speed.toFixed(1)} km/h</td>
      <td className="px-2 py-2 text-sm font-mono text-muted-foreground">{paceFormatted}</td>
      
      {/* Résultat dynamique */}
      <td className="px-2 py-2 text-sm font-mono text-primary">
        {infoValue}
        <span className="block text-[10px] text-muted-foreground font-sans">
            {step.type === 'distance' ? '(temps)' : '(dist.)'}
        </span>
      </td>

      <td className="px-2 py-2">
        <Input
          type="text"
          value={step.rest}
          onChange={(e) => handleRestChange(e.target.value)}
          className="w-20 h-8 text-sm"
          placeholder='R'
        />
      </td>

      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          {onDuplicate && (
            <Button variant="ghost" size="sm" onClick={onDuplicate} className="h-8 w-8 p-0">
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </>
  );

  if (isInBlock) return renderDesktopTable();

  return (
    <>
      <div className="md:hidden">{renderMobileCard()}</div>
      <div className="hidden md:contents">{renderDesktopTable()}</div>
    </>
  );
}