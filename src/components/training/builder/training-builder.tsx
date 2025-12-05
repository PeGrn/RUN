'use client';

import {
  TrainingElement,
  createRepetitionBlock,
  createEmptyStep,
  BuilderStep,
} from '@/lib/vma/builder-types';
import { SortableElementRow } from './sortable-element-row';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Repeat, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface TrainingBuilderProps {
  vma: number;
  elements: TrainingElement[];
  onProgramChange: (elements: TrainingElement[]) => void;
}

export function TrainingBuilder({ vma, elements, onProgramChange }: TrainingBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleElementsChange = (newElements: TrainingElement[]) => {
    onProgramChange(newElements);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = elements.findIndex((el) => el.id === active.id);
      const newIndex = elements.findIndex((el) => el.id === over.id);

      handleElementsChange(arrayMove(elements, oldIndex, newIndex));
    }
  };

  const addStep = () => {
    if (elements.length === 0) {
      // No blocks exist, create a new block with 1 repetition and the step
      handleElementsChange([createRepetitionBlock(1)]);
      toast.success('Bloc et étape ajoutés');
    } else {
      // Add step to the last block
      const newElements = [...elements];
      const lastBlock = newElements[newElements.length - 1];

      // Safety check: ensure steps array exists
      if (!lastBlock.steps || !Array.isArray(lastBlock.steps)) {
        lastBlock.steps = [];
      }

      lastBlock.steps.push(createEmptyStep());
      handleElementsChange(newElements);
      toast.success('Étape ajoutée au bloc');
    }
  };

  const addNewBlock = () => {
    handleElementsChange([...elements, createRepetitionBlock(1)]);
    toast.success('Nouveau bloc créé');
  };

  const updateElement = (index: number, element: TrainingElement) => {
    const newElements = [...elements];
    newElements[index] = element;
    handleElementsChange(newElements);
  };

  const deleteElement = (index: number) => {
    handleElementsChange(elements.filter((_, i) => i !== index));
    toast.success('Bloc supprimé');
  };

  const duplicateElement = (index: number) => {
    const blockToDuplicate = elements[index];

    // Safety check: ensure steps array exists
    if (!blockToDuplicate.steps || !Array.isArray(blockToDuplicate.steps)) {
      toast.error('Impossible de dupliquer un bloc invalide');
      return;
    }

    // All elements are RepetitionBlocks now
    const duplicatedBlock: TrainingElement = {
      ...blockToDuplicate,
      id: crypto.randomUUID(),
      steps: blockToDuplicate.steps.map(step => ({
        ...step,
        id: crypto.randomUUID()
      }))
    };

    const newElements = [...elements];
    newElements.splice(index + 1, 0, duplicatedBlock);
    handleElementsChange(newElements);
    toast.success('Bloc dupliqué');
  };

  const updateSingleStep = (index: number, step: BuilderStep) => {
    updateElement(index, {
      ...elements[index],
      step
    } as any);
  };

  // Calculate total stats
  // All elements are now RepetitionBlocks
  const totalSteps = elements.reduce((sum, block) => {
    // Safety check for undefined steps
    if (!block.steps || !Array.isArray(block.steps)) return sum;
    return sum + (block.steps.length * block.repetitions);
  }, 0);

  const totalDistance = elements.reduce((sum, block) => {
    // Safety check for undefined steps
    if (!block.steps || !Array.isArray(block.steps)) return sum;
    const blockDistance = block.steps.reduce((s, step) => s + step.distance, 0);
    return sum + (blockDistance * block.repetitions);
  }, 0);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileText className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Construction de l&apos;entraînement</span>
            </CardTitle>
            <CardDescription className="mt-1.5">
              Créez votre programme étape par étape
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button onClick={addStep} variant="outline" size="sm" className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ajouter un step</span>
              <span className="sm:hidden">Step</span>
            </Button>
            <Button onClick={addNewBlock} size="sm" className="flex-1 sm:flex-none">
              <Repeat className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nouveau bloc</span>
              <span className="sm:hidden">Bloc</span>
            </Button>
          </div>
        </div>

        {/* Summary */}
        {elements.length > 0 && (
          <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{totalSteps}</span>
              <span className="whitespace-nowrap">étape{totalSteps > 1 ? 's' : ''}</span>
            </div>
            <Separator orientation="vertical" className="hidden sm:block h-5" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{(totalDistance / 1000).toFixed(2)}</span>
              <span>km</span>
            </div>
            <Separator orientation="vertical" className="hidden sm:block h-5" />
            <div className="flex items-center gap-2">
              <span>VMA:</span>
              <span className="font-semibold text-primary">{vma}</span>
              <span>km/h</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {elements.length === 0 ? (
          <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg px-4">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground/50 mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Aucune étape pour le moment
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={addStep} size="sm" className="text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Commencer
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-3">
              <SortableContext
                items={elements.map(el => el.id)}
                strategy={verticalListSortingStrategy}
              >
                {elements.map((element, index) => (
                  <SortableElementRow
                    key={element.id}
                    element={element}
                    index={index}
                    vma={vma}
                    onUpdate={(el) => updateElement(index, el)}
                    onUpdateSingleStep={(step) => updateSingleStep(index, step)}
                    onDelete={() => deleteElement(index)}
                    onDuplicate={() => duplicateElement(index)}
                  />
                ))}
              </SortableContext>
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8 px-2"></TableHead>
                      <TableHead className="px-2 md:px-3 text-sm">Distance</TableHead>
                      <TableHead className="px-2 md:px-3 text-sm">% VMA</TableHead>
                      <TableHead className="px-2 md:px-3 text-sm">Vitesse</TableHead>
                      <TableHead className="px-2 md:px-3 text-sm">Allure</TableHead>
                      <TableHead className="px-2 md:px-3 text-sm">Temps</TableHead>
                      <TableHead className="px-2 md:px-3 text-sm">Récup</TableHead>
                      <TableHead className="w-16 px-2 text-sm">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={elements.map(el => el.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {elements.map((element, index) => (
                        <SortableElementRow
                          key={element.id}
                          element={element}
                          index={index}
                          vma={vma}
                          onUpdate={(el) => updateElement(index, el)}
                          onUpdateSingleStep={(step) => updateSingleStep(index, step)}
                          onDelete={() => deleteElement(index)}
                          onDuplicate={() => duplicateElement(index)}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </div>
            </div>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
