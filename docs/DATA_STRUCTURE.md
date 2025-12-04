# Documentation - Structure des données VMA Training

## Table des matières
- [Vue d'ensemble](#vue-densemble)
- [Types de données](#types-de-données)
- [Structure du Builder](#structure-du-builder)
- [Structure du Programme](#structure-du-programme)
- [Stockage localStorage](#stockage-localstorage)
- [Conversion des données](#conversion-des-données)
- [Exemples JSON](#exemples-json)
- [Export PDF](#export-pdf)
- [Base de données](#base-de-données)

---

## Vue d'ensemble

Le système utilise **deux structures de données distinctes**:

1. **Builder Types** - Pour la création et l'édition (interface utilisateur)
2. **Training Types** - Pour le calcul et l'affichage (programme final)

```
┌─────────────────┐                    ┌──────────────────┐
│  Builder Types  │  ─conversion──>    │  Training Types  │
│  (Interface)    │                    │  (Calculs)       │
└─────────────────┘                    └──────────────────┘
        │                                       │
        │                                       │
   localStorage                           Affichage
   + Edition                              + Export PDF
```

---

## Types de données

### 1. Builder Types (`src/lib/vma/builder-types.ts`)

Ces types sont utilisés pour l'interface de création:

#### `BuilderStep`
Un step simple avec ses paramètres éditables.

```typescript
interface BuilderStep {
  id: string;              // UUID unique
  distance: number;        // Distance en mètres (ex: 100, 200, 800)
  vmaPercentage: number;   // Pourcentage de VMA (ex: 88, 110, 120)
  rest: string;            // Temps de repos (ex: "0"", "2'", "15"")
  name?: string;           // Nom optionnel du step
  description?: string;    // Description optionnelle
  group?: 'warmup' | 'main' | 'cooldown';  // Catégorie
}
```

#### `SingleStep`
Un step autonome (non répété).

```typescript
interface SingleStep {
  id: string;              // UUID unique
  type: 'single';          // Type: step simple
  step: BuilderStep;       // Le step lui-même
}
```

#### `RepetitionBlock`
Un bloc contenant plusieurs steps à répéter N fois.

```typescript
interface RepetitionBlock {
  id: string;              // UUID unique
  type: 'repetition';      // Type: bloc de répétition
  repetitions: number;     // Nombre de répétitions (ex: 12)
  steps: BuilderStep[];    // Liste des steps du bloc
  name?: string;           // Nom optionnel du bloc
}
```

#### `TrainingElement`
Union type des éléments de training.

```typescript
type TrainingElement = SingleStep | RepetitionBlock;
```

#### `BuilderProgram`
Programme complet au format builder.

```typescript
interface BuilderProgram {
  name: string;                    // Nom du programme
  elements: TrainingElement[];     // Liste des éléments
}
```

---

### 2. Training Types (`src/lib/vma/types.ts`)

Ces types sont utilisés pour les calculs et l'affichage:

#### `TrainingStep`
Step avec les temps calculés.

```typescript
interface TrainingStep {
  id: string;                      // UUID unique
  name: string;                    // Nom (ex: "STEP 1", "STEP 2")
  distance: number;                // Distance en mètres
  vmaMultiplier: number;           // Multiplicateur VMA (ex: 0.88, 1.1)
  rest: string;                    // Temps de repos
  repetitions: number;             // Nombre de répétitions
  group: 'warmup' | 'main' | 'cooldown';  // Catégorie
  description?: string;            // Description
}
```

#### `StepResult`
Résultat calculé pour un step donné.

```typescript
interface StepResult {
  step: TrainingStep;              // Le step de base
  targetTime: number;              // Temps cible en secondes
  targetPace: string;              // Allure (ex: "5:30/km")
  speed: number;                   // Vitesse en km/h
}
```

#### `VMAProgram`
Programme complet avec calculs.

```typescript
interface VMAProgram {
  vma: number;                     // VMA en km/h
  steps: StepResult[];             // Steps avec résultats
  totalDistance: number;           // Distance totale en mètres
  totalTime: number;               // Temps total en secondes
  estimatedDuration: string;       // Durée formatée (ex: "45:30")
}
```

---

## Structure du Builder

### Format stocké en localStorage

Clé: `training-elements`

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "single",
    "step": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "distance": 800,
      "vmaPercentage": 88,
      "rest": "0\"",
      "group": "warmup"
    }
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "type": "repetition",
    "repetitions": 12,
    "steps": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "distance": 100,
        "vmaPercentage": 110,
        "rest": "0\"",
        "group": "main"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "distance": 100,
        "vmaPercentage": 76,
        "rest": "3'",
        "group": "main"
      }
    ],
    "name": "Travail fractionné"
  }
]
```

---

## Structure du Programme

### Format après conversion et calcul

```json
{
  "vma": 16,
  "steps": [
    {
      "step": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "STEP 1",
        "distance": 800,
        "vmaMultiplier": 0.88,
        "rest": "0\"",
        "repetitions": 1,
        "group": "warmup"
      },
      "targetTime": 225.5,
      "targetPace": "4:43/km",
      "speed": 14.08
    },
    {
      "step": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "name": "STEP 2",
        "distance": 100,
        "vmaMultiplier": 1.1,
        "rest": "0\"",
        "repetitions": 12,
        "group": "main"
      },
      "targetTime": 20.45,
      "targetPace": "3:24/km",
      "speed": 17.6
    }
  ],
  "totalDistance": 2000,
  "totalTime": 850,
  "estimatedDuration": "14:10"
}
```

---

## Stockage localStorage

### Clés utilisées

| Clé | Type | Description |
|-----|------|-------------|
| `training-vma` | `number` | VMA de l'utilisateur (ex: 16) |
| `training-elements` | `TrainingElement[]` | Programme en cours d'édition |

### Lecture depuis localStorage

```typescript
// Récupérer la VMA
const vmaStr = localStorage.getItem('training-vma');
const vma = vmaStr ? JSON.parse(vmaStr) : 16;

// Récupérer les éléments
const elementsStr = localStorage.getItem('training-elements');
const elements = elementsStr ? JSON.parse(elementsStr) : [];
```

### Écriture vers localStorage

```typescript
// Sauvegarder la VMA
localStorage.setItem('training-vma', JSON.stringify(16));

// Sauvegarder les éléments
localStorage.setItem('training-elements', JSON.stringify(elements));
```

---

## Conversion des données

### Builder → Training

Fonction: `convertBuilderElementsToSteps()`
Fichier: `src/lib/vma/builder-converter.ts`

```typescript
import { convertBuilderElementsToSteps, calculateVMAProgram } from '@/lib/vma';

// 1. Récupérer les données du builder
const builderElements = JSON.parse(localStorage.getItem('training-elements'));
const vma = JSON.parse(localStorage.getItem('training-vma'));

// 2. Convertir en TrainingSteps
const trainingSteps = convertBuilderElementsToSteps(builderElements);

// 3. Calculer le programme avec VMA
const program = calculateVMAProgram(trainingSteps, vma);

// 4. Accéder aux résultats
console.log(program.totalDistance);     // Distance totale
console.log(program.estimatedDuration); // Durée estimée
console.log(program.steps);             // Steps avec temps calculés
```

### Logique de conversion

```
SingleStep
  └─> 1 TrainingStep (repetitions = 1)

RepetitionBlock (12× avec 2 steps)
  └─> 2 TrainingSteps (repetitions = 12 pour chaque)
```

---

## Exemples JSON

### Exemple 1: Programme simple (2 steps)

```json
{
  "vma": 16,
  "elements": [
    {
      "id": "a1",
      "type": "single",
      "step": {
        "id": "s1",
        "distance": 800,
        "vmaPercentage": 88,
        "rest": "2'",
        "group": "warmup"
      }
    },
    {
      "id": "a2",
      "type": "single",
      "step": {
        "id": "s2",
        "distance": 200,
        "vmaPercentage": 104,
        "rest": "0\"",
        "group": "cooldown"
      }
    }
  ]
}
```

### Exemple 2: Programme avec bloc de répétition

```json
{
  "vma": 18,
  "elements": [
    {
      "id": "b1",
      "type": "repetition",
      "repetitions": 8,
      "steps": [
        {
          "id": "s1",
          "distance": 200,
          "vmaPercentage": 105,
          "rest": "30\"",
          "group": "main"
        },
        {
          "id": "s2",
          "distance": 200,
          "vmaPercentage": 80,
          "rest": "1'30\"",
          "group": "main"
        }
      ],
      "name": "Pyramide 200m"
    }
  ]
}
```

### Exemple 3: Programme complet (Excel)

```json
{
  "vma": 16,
  "elements": [
    {
      "id": "warmup-1",
      "type": "single",
      "step": {
        "id": "step-1",
        "distance": 800,
        "vmaPercentage": 88,
        "rest": "0\"",
        "group": "warmup",
        "name": "STEP 1",
        "description": "Échauffement progressif"
      }
    },
    {
      "id": "warmup-2",
      "type": "single",
      "step": {
        "id": "step-1bis",
        "distance": 200,
        "vmaPercentage": 96,
        "rest": "2'",
        "group": "warmup",
        "name": "STEP 1bis"
      }
    },
    {
      "id": "main-block",
      "type": "repetition",
      "repetitions": 12,
      "steps": [
        {
          "id": "step-2",
          "distance": 100,
          "vmaPercentage": 110,
          "rest": "0\"",
          "group": "main",
          "name": "STEP 2",
          "description": "Travail haute intensité"
        },
        {
          "id": "step-2bis",
          "distance": 100,
          "vmaPercentage": 76,
          "rest": "3'",
          "group": "main",
          "name": "STEP 2bis",
          "description": "Récupération active"
        }
      ],
      "name": "Série principale"
    },
    {
      "id": "cooldown-1",
      "type": "single",
      "step": {
        "id": "step-3",
        "distance": 200,
        "vmaPercentage": 104,
        "rest": "15\"",
        "group": "cooldown",
        "name": "STEP 3"
      }
    }
  ]
}
```

---

## Export PDF

### Données nécessaires pour l'export

Pour générer un PDF, vous aurez besoin de:

```typescript
interface PDFData {
  // Informations générales
  programName: string;
  vma: number;
  date: string;

  // Résumé
  totalDistance: number;        // en mètres
  totalTime: number;            // en secondes
  estimatedDuration: string;    // formaté
  totalSteps: number;

  // Détails des steps
  steps: Array<{
    stepNumber: number;
    name: string;
    distance: number;           // en mètres
    repetitions: number;
    vmaPercentage: number;
    speed: number;              // km/h
    targetTime: string;         // formaté (MM:SS)
    targetPace: string;         // min/km
    rest: string;
    group: string;
    isPartOfBlock?: boolean;    // Si fait partie d'un bloc
    blockName?: string;         // Nom du bloc si applicable
  }>;
}
```

### Code d'extraction pour PDF

```typescript
import { convertBuilderElementsToSteps, calculateVMAProgram } from '@/lib/vma';

function extractPDFData(builderElements: TrainingElement[], vma: number): PDFData {
  // 1. Convertir et calculer
  const trainingSteps = convertBuilderElementsToSteps(builderElements);
  const program = calculateVMAProgram(trainingSteps, vma);

  // 2. Préparer les données pour le PDF
  const pdfData: PDFData = {
    programName: "Programme VMA",
    vma: vma,
    date: new Date().toLocaleDateString('fr-FR'),
    totalDistance: program.totalDistance,
    totalTime: program.totalTime,
    estimatedDuration: program.estimatedDuration,
    totalSteps: program.steps.reduce((sum, s) => sum + s.step.repetitions, 0),
    steps: program.steps.map((stepResult, index) => ({
      stepNumber: index + 1,
      name: stepResult.step.name,
      distance: stepResult.step.distance,
      repetitions: stepResult.step.repetitions,
      vmaPercentage: Math.round(stepResult.step.vmaMultiplier * 100),
      speed: stepResult.speed,
      targetTime: formatTime(stepResult.targetTime),
      targetPace: stepResult.targetPace,
      rest: stepResult.step.rest,
      group: stepResult.step.group,
    }))
  };

  return pdfData;
}
```

### Bibliothèques recommandées

- **jsPDF** - Génération de PDF
- **pdfmake** - Alternative plus flexible
- **react-pdf** - Pour React

---

## Base de données

### Schéma SQL recommandé

```sql
-- Table des programmes
CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  vma DECIMAL(4,1) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table des éléments (steps ou blocs)
CREATE TABLE training_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL,
  element_type VARCHAR(20) NOT NULL, -- 'single' ou 'repetition'
  position INTEGER NOT NULL,         -- Ordre dans le programme
  repetitions INTEGER DEFAULT 1,     -- Pour les blocs
  name VARCHAR(255),
  FOREIGN KEY (program_id) REFERENCES training_programs(id) ON DELETE CASCADE
);

-- Table des steps
CREATE TABLE training_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id UUID NOT NULL,
  position INTEGER NOT NULL,         -- Ordre dans l'élément/bloc
  distance INTEGER NOT NULL,         -- en mètres
  vma_percentage INTEGER NOT NULL,   -- ex: 88, 110
  rest_time VARCHAR(10),             -- ex: "2'", "30""
  step_group VARCHAR(20),            -- 'warmup', 'main', 'cooldown'
  name VARCHAR(255),
  description TEXT,
  FOREIGN KEY (element_id) REFERENCES training_elements(id) ON DELETE CASCADE
);
```

### Format JSON pour stockage (PostgreSQL JSONB)

Si vous préférez stocker en JSON:

```sql
CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  vma DECIMAL(4,1) NOT NULL,
  data JSONB NOT NULL,  -- Stocke tout le programme
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

Données stockées dans `data`:
```json
{
  "elements": [...] // TrainingElement[]
}
```

### Requêtes utiles

```sql
-- Récupérer un programme avec tous ses éléments
SELECT
  p.*,
  json_agg(
    json_build_object(
      'id', e.id,
      'type', e.element_type,
      'repetitions', e.repetitions,
      'steps', (
        SELECT json_agg(
          json_build_object(
            'id', s.id,
            'distance', s.distance,
            'vmaPercentage', s.vma_percentage,
            'rest', s.rest_time,
            'group', s.step_group
          ) ORDER BY s.position
        )
        FROM training_steps s
        WHERE s.element_id = e.id
      )
    ) ORDER BY e.position
  ) as elements
FROM training_programs p
LEFT JOIN training_elements e ON e.program_id = p.id
WHERE p.id = 'program-uuid'
GROUP BY p.id;
```

---

## Résumé des fichiers clés

| Fichier | Description |
|---------|-------------|
| `src/lib/vma/builder-types.ts` | Types pour le builder (interface) |
| `src/lib/vma/types.ts` | Types pour les calculs |
| `src/lib/vma/builder-converter.ts` | Conversion builder → training |
| `src/lib/vma/calculator.ts` | Calculs de temps et allures |
| `src/hooks/use-local-storage.ts` | Hook pour localStorage |

---

## Questions fréquentes

### Comment ajouter un nouveau champ?

1. Ajoutez-le dans `BuilderStep` (`builder-types.ts`)
2. Ajoutez-le dans `TrainingStep` (`types.ts`)
3. Mettez à jour la conversion dans `builder-converter.ts`
4. Ajoutez le champ dans le formulaire (`step-row.tsx`)

### Comment calculer le temps total avec les repos?

Le temps total est calculé dans `calculateVMAProgram()`:
- Temps de travail: somme des `targetTime × repetitions`
- Temps de repos: parsé depuis la string (ex: "2'" = 120s)
- Total = travail + repos

### Quel format pour les temps de repos?

- `"0""` = 0 secondes
- `"30""` = 30 secondes
- `"2'"` = 2 minutes = 120 secondes
- `"1'30""` = 1 min 30s = 90 secondes

---

## Licence

Ce document fait partie du projet running-data.
