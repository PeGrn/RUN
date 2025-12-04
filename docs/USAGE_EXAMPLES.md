# Exemples d'utilisation - VMA Training Data

Ce document contient des exemples pratiques pour exploiter les données du système VMA Training.

## Table des matières
- [Récupération des données](#récupération-des-données)
- [Export PDF avec jsPDF](#export-pdf-avec-jspdf)
- [Sauvegarde en base de données](#sauvegarde-en-base-de-données)
- [API REST](#api-rest)
- [Génération de graphiques](#génération-de-graphiques)

---

## Récupération des données

### Depuis le localStorage

```typescript
import { TrainingElement } from '@/lib/vma';

// Récupérer les données brutes
function getTrainingData() {
  const vmaStr = localStorage.getItem('training-vma');
  const elementsStr = localStorage.getItem('training-elements');

  return {
    vma: vmaStr ? JSON.parse(vmaStr) : 16,
    elements: elementsStr ? JSON.parse(elementsStr) : []
  };
}

// Utilisation
const { vma, elements } = getTrainingData();
console.log(`VMA: ${vma} km/h`);
console.log(`Nombre d'éléments: ${elements.length}`);
```

### Conversion en programme calculé

```typescript
import {
  convertBuilderElementsToSteps,
  calculateVMAProgram
} from '@/lib/vma';

function getCalculatedProgram() {
  const { vma, elements } = getTrainingData();

  // Convertir en steps
  const trainingSteps = convertBuilderElementsToSteps(elements);

  // Calculer avec la VMA
  const program = calculateVMAProgram(trainingSteps, vma);

  return program;
}

// Utilisation
const program = getCalculatedProgram();
console.log(`Distance totale: ${program.totalDistance}m`);
console.log(`Durée estimée: ${program.estimatedDuration}`);
```

---

## Export PDF avec jsPDF

### Installation

```bash
npm install jspdf
npm install @types/jspdf --save-dev
```

### Exemple complet

```typescript
import jsPDF from 'jspdf';
import { getCalculatedProgram } from './utils';

export function generatePDF() {
  const program = getCalculatedProgram();
  const doc = new jsPDF();

  // Configuration
  const margin = 20;
  let yPos = margin;

  // Titre
  doc.setFontSize(20);
  doc.text('Programme VMA Training', margin, yPos);
  yPos += 15;

  // Informations générales
  doc.setFontSize(12);
  doc.text(`VMA: ${program.vma} km/h`, margin, yPos);
  yPos += 7;
  doc.text(`Distance totale: ${(program.totalDistance / 1000).toFixed(2)} km`, margin, yPos);
  yPos += 7;
  doc.text(`Durée estimée: ${program.estimatedDuration}`, margin, yPos);
  yPos += 7;
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPos);
  yPos += 15;

  // Ligne de séparation
  doc.line(margin, yPos, 190, yPos);
  yPos += 10;

  // Steps
  doc.setFontSize(14);
  doc.text('Plan d\'entraînement', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  program.steps.forEach((stepResult, index) => {
    const { step, targetTime, targetPace, speed } = stepResult;

    // Vérifier si on doit ajouter une nouvelle page
    if (yPos > 270) {
      doc.addPage();
      yPos = margin;
    }

    // Nom du step
    doc.setFont(undefined, 'bold');
    doc.text(`${index + 1}. ${step.name}`, margin, yPos);
    yPos += 6;

    // Détails
    doc.setFont(undefined, 'normal');
    doc.text(`Distance: ${step.distance}m`, margin + 5, yPos);
    yPos += 5;
    doc.text(`Répétitions: ${step.repetitions}×`, margin + 5, yPos);
    yPos += 5;
    doc.text(`Vitesse: ${speed.toFixed(2)} km/h (${Math.round(step.vmaMultiplier * 100)}% VMA)`, margin + 5, yPos);
    yPos += 5;
    doc.text(`Temps cible: ${formatTime(targetTime)} (${targetPace})`, margin + 5, yPos);
    yPos += 5;

    if (step.rest && step.rest !== '0"') {
      doc.text(`Récupération: ${step.rest}`, margin + 5, yPos);
      yPos += 5;
    }

    yPos += 5;
  });

  // Sauvegarder
  doc.save(`programme-vma-${program.vma}kmh.pdf`);
}

// Fonction utilitaire pour formater le temps
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

### Utilisation dans un composant

```typescript
'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generatePDF } from '@/lib/pdf-export';
import { toast } from 'sonner';

export function ExportPDFButton() {
  const handleExport = () => {
    try {
      generatePDF();
      toast.success('PDF généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF');
      console.error(error);
    }
  };

  return (
    <Button onClick={handleExport} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Exporter en PDF
    </Button>
  );
}
```

---

## Sauvegarde en base de données

### Avec Prisma

#### 1. Schéma Prisma

```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  programs  TrainingProgram[]
}

model TrainingProgram {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  name        String
  vma         Float
  data        Json      // Stocke les TrainingElement[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
}
```

#### 2. Sauvegarde

```typescript
import { prisma } from '@/lib/prisma';
import { TrainingElement } from '@/lib/vma';

async function saveProgram(
  userId: string,
  name: string,
  vma: number,
  elements: TrainingElement[]
) {
  const program = await prisma.trainingProgram.create({
    data: {
      userId,
      name,
      vma,
      data: elements as any, // Prisma stocke en JSONB
    },
  });

  return program;
}

// Utilisation
const { vma, elements } = getTrainingData();
const program = await saveProgram(
  'user-123',
  'Mon programme VMA',
  vma,
  elements
);
```

#### 3. Récupération

```typescript
async function getProgram(programId: string) {
  const program = await prisma.trainingProgram.findUnique({
    where: { id: programId },
  });

  if (!program) return null;

  return {
    id: program.id,
    name: program.name,
    vma: program.vma,
    elements: program.data as TrainingElement[],
    createdAt: program.createdAt,
  };
}
```

#### 4. Liste des programmes d'un utilisateur

```typescript
async function getUserPrograms(userId: string) {
  const programs = await prisma.trainingProgram.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return programs.map(p => ({
    id: p.id,
    name: p.name,
    vma: p.vma,
    elementsCount: (p.data as TrainingElement[]).length,
    createdAt: p.createdAt,
  }));
}
```

### Avec Supabase

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Sauvegarde
async function saveToSupabase(
  userId: string,
  name: string,
  vma: number,
  elements: TrainingElement[]
) {
  const { data, error } = await supabase
    .from('training_programs')
    .insert({
      user_id: userId,
      name,
      vma,
      data: elements,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Récupération
async function loadFromSupabase(programId: string) {
  const { data, error } = await supabase
    .from('training_programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (error) throw error;
  return data;
}
```

---

## API REST

### Routes Next.js App Router

#### 1. Sauvegarder un programme

```typescript
// app/api/programs/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, vma, elements } = body;

    const program = await prisma.trainingProgram.create({
      data: {
        userId,
        name,
        vma,
        data: elements,
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const programs = await prisma.trainingProgram.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(programs);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}
```

#### 2. Récupérer un programme spécifique

```typescript
// app/api/programs/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const program = await prisma.trainingProgram.findUnique({
      where: { id: params.id },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(program);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, vma, elements } = body;

    const program = await prisma.trainingProgram.update({
      where: { id: params.id },
      data: {
        name,
        vma,
        data: elements,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.trainingProgram.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    );
  }
}
```

#### 3. Utilisation côté client

```typescript
// lib/api/programs.ts

import { TrainingElement } from '@/lib/vma';

export async function createProgram(
  userId: string,
  name: string,
  vma: number,
  elements: TrainingElement[]
) {
  const response = await fetch('/api/programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name, vma, elements }),
  });

  if (!response.ok) throw new Error('Failed to create program');
  return response.json();
}

export async function getPrograms(userId: string) {
  const response = await fetch(`/api/programs?userId=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch programs');
  return response.json();
}

export async function getProgram(id: string) {
  const response = await fetch(`/api/programs/${id}`);
  if (!response.ok) throw new Error('Failed to fetch program');
  return response.json();
}

export async function updateProgram(
  id: string,
  data: { name: string; vma: number; elements: TrainingElement[] }
) {
  const response = await fetch(`/api/programs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to update program');
  return response.json();
}

export async function deleteProgram(id: string) {
  const response = await fetch(`/api/programs/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) throw new Error('Failed to delete program');
  return response.json();
}
```

---

## Génération de graphiques

### Avec Recharts

```typescript
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getCalculatedProgram } from '@/lib/utils';

export function VMAChart() {
  const program = getCalculatedProgram();

  // Préparer les données pour le graphique
  const data = program.steps.map((stepResult, index) => ({
    step: stepResult.step.name,
    vitesse: stepResult.speed,
    vmaPercentage: Math.round(stepResult.step.vmaMultiplier * 100),
    distance: stepResult.step.distance,
  }));

  return (
    <div className="w-full h-96">
      <LineChart width={800} height={400} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="step" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="vitesse"
          stroke="#8884d8"
          name="Vitesse (km/h)"
        />
        <Line
          type="monotone"
          dataKey="vmaPercentage"
          stroke="#82ca9d"
          name="% VMA"
        />
      </LineChart>
    </div>
  );
}
```

### Graphique de distance cumulée

```typescript
export function DistanceChart() {
  const program = getCalculatedProgram();

  let cumulativeDistance = 0;
  const data = program.steps.map((stepResult) => {
    cumulativeDistance += stepResult.step.distance * stepResult.step.repetitions;
    return {
      step: stepResult.step.name,
      distance: cumulativeDistance / 1000, // en km
    };
  });

  return (
    <LineChart width={800} height={400} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="step" />
      <YAxis label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }} />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="distance"
        stroke="#ff7300"
        name="Distance cumulée"
      />
    </LineChart>
  );
}
```

---

## Conseils

### Performance
- Utilisez `useMemo` pour les calculs coûteux
- Stockez les programmes calculés en cache
- Limitez les re-renders avec React.memo

### Validation
- Validez les données avec Zod avant la sauvegarde
- Vérifiez que la VMA est > 0
- Assurez-vous que les distances sont positives

### Sécurité
- Toujours vérifier l'authentification côté serveur
- Validez que l'utilisateur a accès au programme
- Sanitize les inputs utilisateur

---

## Ressources

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [Recharts Documentation](https://recharts.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
