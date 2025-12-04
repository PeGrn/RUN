'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TrainingElement } from '@/lib/vma/builder-types';
import { RepetitionBlockRow } from './repetition-block-row';

interface SortableElementRowProps {
  element: TrainingElement;
  index: number;
  vma: number;
  onUpdate: (element: TrainingElement) => void;
  onUpdateSingleStep: (step: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function SortableElementRow({
  element,
  index,
  vma,
  onUpdate,
  onDelete,
  onDuplicate
}: SortableElementRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // All elements are now RepetitionBlocks
  return (
    <>
      <RepetitionBlockRow
        block={element}
        vma={vma}
        onChange={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        setNodeRef={setNodeRef}
        style={style}
      />
    </>
  );
}
