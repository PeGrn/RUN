'use client';

import { RepetitionBlock, BuilderStep, createEmptyStep } from '@/lib/vma/builder-types';
import { StepRow } from './step-row';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Repeat, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { useState } from 'react';

interface RepetitionBlockRowProps {
  block: RepetitionBlock;
  vma: number;
  onChange: (block: RepetitionBlock) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  dragHandleProps?: any;
  isDragging?: boolean;
  setNodeRef?: any;
  style?: any;
}

export function RepetitionBlockRow({
  block,
  vma,
  onChange,
  onDelete,
  onDuplicate,
  dragHandleProps,
  isDragging,
  setNodeRef,
  style
}: RepetitionBlockRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Safety check: ensure steps array exists
  const safeSteps = block.steps && Array.isArray(block.steps) ? block.steps : [];

  const handleDeleteClick = () => {
    if (safeSteps.length > 1) {
      setShowDeleteDialog(true);
    } else {
      onDelete();
    }
  };

  const handleConfirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  const handleRepetitionsChange = (value: number) => {
    onChange({
      ...block,
      repetitions: value
    });
  };

  const handleStepChange = (index: number, step: BuilderStep) => {
    const newSteps = [...safeSteps];
    newSteps[index] = step;
    onChange({
      ...block,
      steps: newSteps
    });
  };

  const handleAddStep = () => {
    onChange({
      ...block,
      steps: [...safeSteps, createEmptyStep()]
    });
  };

  const handleDeleteStep = (index: number) => {
    if (safeSteps.length === 1) {
      // If it's the last step, delete the entire block
      onDelete();
    } else {
      const newSteps = safeSteps.filter((_, i) => i !== index);
      onChange({
        ...block,
        steps: newSteps
      });
    }
  };

  const handleDuplicateStep = (index: number) => {
    const stepToDuplicate = safeSteps[index];
    const duplicatedStep = {
      ...stepToDuplicate,
      id: crypto.randomUUID()
    };
    const newSteps = [...safeSteps];
    newSteps.splice(index + 1, 0, duplicatedStep);
    onChange({
      ...block,
      steps: newSteps
    });
  };

  return (
    <>
      {/* Block Header */}
      <tr
        ref={setNodeRef}
        style={style}
        className={`bg-gradient-to-r from-primary/10 to-primary/5 border-y-2 border-primary/30 ${isDragging ? 'opacity-50' : ''}`}
      >
        <td colSpan={7} className="px-2 sm:px-4 py-2 sm:py-3">
          <div className="space-y-2 sm:space-y-0">
            {/* Mobile Layout: Stacked */}
            <div className="flex sm:hidden flex-col gap-2">
              {/* Line 1: Controls */}
              <div className="flex items-center gap-2">
                {/* Drag Handle */}
                {dragHandleProps && (
                  <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0">
                    <div className="h-4 w-4 text-muted-foreground">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="5" cy="5" r="1.5" />
                        <circle cx="15" cy="5" r="1.5" />
                        <circle cx="5" cy="10" r="1.5" />
                        <circle cx="15" cy="10" r="1.5" />
                        <circle cx="5" cy="15" r="1.5" />
                        <circle cx="15" cy="15" r="1.5" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Expand/Collapse */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-7 w-7 p-0 flex-shrink-0"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>

                {/* Badge + Repetitions */}
                <Badge className="bg-primary text-primary-foreground border-0 px-2 py-0.5 text-xs">
                  Bloc
                </Badge>
                <Input
                  type="number"
                  value={block.repetitions}
                  onChange={(e) => handleRepetitionsChange(parseInt(e.target.value) || 1)}
                  className="w-12 h-7 text-xs"
                  min="1"
                  max="50"
                />
                <span className="text-xs font-medium">× rép.</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {safeSteps.length} étape{safeSteps.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Line 2: Actions */}
              <div className="flex items-center gap-1 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                  className="h-7 text-xs px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Étape
                </Button>
                {onDuplicate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDuplicate}
                    className="h-7 w-7 p-0 hover:bg-primary/10"
                    title="Dupliquer le bloc"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Supprimer le bloc"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Desktop Layout: Single Line */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Drag Handle */}
                {dragHandleProps && (
                  <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0">
                    <div className="h-5 w-5 text-muted-foreground">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="5" cy="5" r="1.5" />
                        <circle cx="15" cy="5" r="1.5" />
                        <circle cx="5" cy="10" r="1.5" />
                        <circle cx="15" cy="10" r="1.5" />
                        <circle cx="5" cy="15" r="1.5" />
                        <circle cx="15" cy="15" r="1.5" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Expand/Collapse */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>

                <Repeat className="h-5 w-5 text-primary" />
                <Badge className="bg-primary text-primary-foreground border-0 px-3 py-1 text-xs">
                  Bloc
                </Badge>

                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={block.repetitions}
                    onChange={(e) => handleRepetitionsChange(parseInt(e.target.value) || 1)}
                    className="w-20 h-8 text-sm"
                    min="1"
                    max="50"
                  />
                  <span className="text-sm font-medium">× rép.</span>
                </div>

                <span className="text-sm text-muted-foreground">
                  ({safeSteps.length} étape{safeSteps.length > 1 ? 's' : ''})
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                  className="h-8 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une étape
                </Button>
                {onDuplicate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDuplicate}
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                    title="Dupliquer le bloc"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Supprimer le bloc"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </td>
      </tr>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Supprimer ce bloc de répétition ?"
        description={`Ce bloc contient ${safeSteps.length} étapes. Cette action est irréversible.`}
      />

      {/* Block Steps (Indented) */}
      {isExpanded && safeSteps.map((step, index) => (
        <tr key={step.id} className="bg-primary/5 border-l-4 border-l-primary/40">
          <td className="w-8 px-2">
            <div className="h-full flex items-center justify-center">
              <div className="w-0.5 h-full bg-primary/40" />
            </div>
          </td>
          <td colSpan={6} className="p-0">
            <table className="w-full">
              <tbody>
                <StepRow
                  step={step}
                  vma={vma}
                  onChange={(updatedStep) => handleStepChange(index, updatedStep)}
                  onDelete={() => handleDeleteStep(index)}
                  onDuplicate={() => handleDuplicateStep(index)}
                  isInBlock={true}
                />
              </tbody>
            </table>
          </td>
        </tr>
      ))}

      {/* Block Footer */}
      {isExpanded && (
        <tr className="border-b-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <td colSpan={7} className="px-2 sm:px-4 py-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-primary/20" />
              <span className="font-medium whitespace-nowrap">
                Fin du bloc ({block.repetitions}× {safeSteps.length})
              </span>
              <div className="h-px flex-1 bg-primary/20" />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
