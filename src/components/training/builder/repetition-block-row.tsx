'use client';

import { RepetitionBlock, BuilderStep, createEmptyStep } from '@/lib/vma/builder-types';
import { StepRow } from './step-row';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Trash2, Plus, Repeat, ChevronDown, ChevronRight, Copy, GripVertical } from 'lucide-react';
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

  // Render mobile card view
  const renderMobileCard = () => (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Card Header */}
      <div className="p-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {dragHandleProps && (
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <Badge className="bg-primary text-primary-foreground">
              <Repeat className="h-3 w-3 mr-1" />
              Bloc
            </Badge>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={block.repetitions}
                onChange={(e) => handleRepetitionsChange(parseInt(e.target.value) || 1)}
                className="w-14 h-8 text-sm"
                min="1"
                max="50"
              />
              <span className="text-sm font-medium">× répétitions</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddStep}
            className="h-8 flex-1 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Ajouter une étape
          </Button>
          {onDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="h-8 w-8 p-0"
              title="Dupliquer le bloc"
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="h-8 w-8 p-0 text-destructive"
            title="Supprimer le bloc"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Card Body - Steps */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {safeSteps.map((step, index) => (
            <div key={step.id}>
              <StepRow
                step={step}
                vma={vma}
                onChange={(updatedStep) => handleStepChange(index, updatedStep)}
                onDelete={() => handleDeleteStep(index)}
                onDuplicate={() => handleDuplicateStep(index)}
                isInBlock={false}
              />
            </div>
          ))}
          {safeSteps.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Aucune étape. Cliquez sur "Ajouter une étape" pour commencer.
            </div>
          )}
        </div>
      )}
    </Card>
  );

  // Render desktop table view
  const renderDesktopTable = () => (
    <>
      {/* Block Header */}
      <tr
        ref={setNodeRef}
        style={style}
        className={`bg-gradient-to-r from-primary/10 to-primary/5 border-y-2 border-primary/30 ${isDragging ? 'opacity-50' : ''}`}
      >
        <td colSpan={8} className="px-1.5 sm:px-2 md:px-4 py-1.5 sm:py-2 md:py-3">
          <div className="space-y-2 sm:space-y-0">
            {/* Mobile Layout: Stacked */}
            <div className="flex sm:hidden flex-col gap-1.5">
              {/* Line 1: Controls */}
              <div className="flex items-center gap-1.5">
                {/* Drag Handle */}
                {dragHandleProps && (
                  <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0">
                    <div className="h-3.5 w-3.5 text-muted-foreground">
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
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
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  {isExpanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                </Button>

                {/* Badge + Repetitions */}
                <Badge className="bg-primary text-primary-foreground border-0 px-1.5 py-0 text-[10px]">
                  Bloc
                </Badge>
                <Input
                  type="number"
                  value={block.repetitions}
                  onChange={(e) => handleRepetitionsChange(parseInt(e.target.value) || 1)}
                  className="w-10 h-6 text-[11px]"
                  min="1"
                  max="50"
                />
                <span className="text-[10px] font-medium">×</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {safeSteps.length} ét.
                </span>
              </div>

              {/* Line 2: Actions */}
              <div className="flex items-center gap-1 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                  className="h-6 text-[10px] px-1.5"
                >
                  <Plus className="h-2.5 w-2.5 mr-0.5" />
                  Ét.
                </Button>
                {onDuplicate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDuplicate}
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                    title="Dupliquer le bloc"
                  >
                    <Copy className="h-2.5 w-2.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Supprimer le bloc"
                >
                  <Trash2 className="h-2.5 w-2.5" />
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

      {/* Block Steps (Indented) */}
      {isExpanded && safeSteps.map((step, index) => (
        <tr key={step.id} className="bg-primary/5 border-l-4 border-l-primary/40">
          <td className="w-5 sm:w-8 px-1 sm:px-2">
            <div className="h-full flex items-center justify-center">
              <div className="w-0.5 h-full bg-primary/40" />
            </div>
          </td>
          <td colSpan={7} className="p-0">
            <table className="w-full">
              <tbody>
                <tr>
                  <StepRow
                    step={step}
                    vma={vma}
                    onChange={(updatedStep) => handleStepChange(index, updatedStep)}
                    onDelete={() => handleDeleteStep(index)}
                    onDuplicate={() => handleDuplicateStep(index)}
                    isInBlock={true}
                  />
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      ))}

      {/* Block Footer */}
      {isExpanded && (
        <tr className="border-b-2 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <td colSpan={8} className="px-1.5 sm:px-2 md:px-4 py-1 sm:py-1.5">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-primary/20" />
              <span className="font-medium whitespace-nowrap">
                Fin ({block.repetitions}× {safeSteps.length})
              </span>
              <div className="h-px flex-1 bg-primary/20" />
            </div>
          </td>
        </tr>
      )}
    </>
  );

  // Return mobile card view or desktop table view
  return (
    <>
      <div className="md:hidden">
        {renderMobileCard()}
      </div>
      <div className="hidden md:contents">
        {renderDesktopTable()}
      </div>
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Supprimer ce bloc de répétition ?"
        description={`Ce bloc contient ${safeSteps.length} étapes. Cette action est irréversible.`}
      />
    </>
  );
}
