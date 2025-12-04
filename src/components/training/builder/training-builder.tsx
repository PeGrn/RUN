'use client';

import {
  TrainingElement,
  createRepetitionBlock,
  createEmptyStep,
  BuilderStep,
  RepetitionBlock
} from '@/lib/vma/builder-types';
import { StepRow } from './step-row';
import { RepetitionBlockRow } from './repetition-block-row';
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
    return sum + (block.steps.length * block.repetitions);
  }, 0);

  const totalDistance = elements.reduce((sum, block) => {
    const blockDistance = block.steps.reduce((s, step) => s + step.distance, 0);
    return sum + (blockDistance * block.repetitions);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Construction de l'entraînement
            </CardTitle>
            <CardDescription>
              Créez votre programme étape par étape
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={addStep} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un step
            </Button>
            <Button onClick={addNewBlock} size="sm">
              <Repeat className="h-4 w-4 mr-2" />
              Nouveau bloc
            </Button>
          </div>
        </div>

        {/* Summary */}
        {elements.length > 0 && (
          <div className="flex gap-6 text-sm text-muted-foreground mt-4 pt-4 border-t">
            <div>
              <span className="font-semibold text-foreground">{totalSteps}</span> étape{totalSteps > 1 ? 's' : ''} totale{totalSteps > 1 ? 's' : ''}
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div>
              <span className="font-semibold text-foreground">{(totalDistance / 1000).toFixed(2)}</span> km
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div>
              VMA: <span className="font-semibold text-primary">{vma}</span> km/h
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {elements.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              Aucune étape pour le moment
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={addStep} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Commencer l'entraînement
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>% VMA</TableHead>
                    <TableHead>Vitesse</TableHead>
                    <TableHead>Temps</TableHead>
                    <TableHead>Récup</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
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
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
