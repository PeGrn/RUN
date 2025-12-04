# Documentation VMA Training

Bienvenue dans la documentation du système VMA Training!

## 📚 Documents disponibles

### [DATA_STRUCTURE.md](./DATA_STRUCTURE.md)
Documentation complète de la structure des données:
- Types TypeScript (Builder & Training)
- Format de stockage localStorage
- Conversion des données
- Exemples JSON
- Schéma de base de données

**À lire si:**
- Vous devez comprendre comment les données sont organisées
- Vous voulez implémenter un export
- Vous prévoyez d'intégrer une base de données
- Vous avez besoin de modifier la structure

### [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)
Exemples pratiques d'utilisation:
- Export PDF avec jsPDF
- Sauvegarde en BDD (Prisma, Supabase)
- API REST Next.js
- Génération de graphiques

**À lire si:**
- Vous devez implémenter un export PDF
- Vous voulez sauvegarder les programmes
- Vous créez une API
- Vous souhaitez visualiser les données

---

## 🚀 Démarrage rapide

### Récupérer les données du localStorage

```typescript
const vma = JSON.parse(localStorage.getItem('training-vma'));
const elements = JSON.parse(localStorage.getItem('training-elements'));
```

### Calculer un programme

```typescript
import { convertBuilderElementsToSteps, calculateVMAProgram } from '@/lib/vma';

const trainingSteps = convertBuilderElementsToSteps(elements);
const program = calculateVMAProgram(trainingSteps, vma);
```

### Exporter en PDF (simple)

```typescript
import jsPDF from 'jspdf';

const doc = new jsPDF();
doc.text(`Programme VMA - ${program.vma} km/h`, 20, 20);
doc.save('programme.pdf');
```

---

## 🗂️ Structure des fichiers clés

```
src/
├── lib/vma/
│   ├── builder-types.ts      # Types pour le builder
│   ├── types.ts               # Types pour les calculs
│   ├── builder-converter.ts   # Conversion builder → training
│   ├── calculator.ts          # Calculs de temps et allures
│   └── programs.ts            # Programmes par défaut
│
├── components/training/
│   ├── builder/               # Interface de création
│   │   ├── training-builder.tsx
│   │   ├── step-row.tsx
│   │   └── repetition-block-row.tsx
│   └── vma-selector.tsx       # Sélecteur de VMA
│
└── hooks/
    └── use-local-storage.ts   # Hook pour localStorage
```

---

## 🔑 Concepts clés

### 1. Deux formats de données

**Builder Format** (Interface)
- Utilisé pour créer et éditer
- Stocké en localStorage
- Contient `TrainingElement[]`

**Training Format** (Calculs)
- Utilisé pour les calculs et l'affichage
- Converti à la volée
- Contient `StepResult[]` avec temps calculés

### 2. Elements vs Steps

**Elements** = Container
- Peut être un `SingleStep` ou un `RepetitionBlock`
- Stocké et édité

**Steps** = Unité d'entraînement
- Toujours à l'intérieur d'un element
- Contient distance, VMA%, repos

### 3. Blocs de répétition

Un bloc contient plusieurs steps à répéter N fois:
```
Bloc (12 répétitions)
  ├─ Step 1: 100m à 110% VMA
  └─ Step 2: 100m à 76% VMA

= 12 × (Step 1 + Step 2)
= 24 steps au total
```

---

## 📊 Exemples de données

### Programme simple (2 steps)

```json
{
  "vma": 16,
  "elements": [
    {
      "id": "uuid-1",
      "type": "single",
      "step": {
        "distance": 800,
        "vmaPercentage": 88,
        "rest": "2'"
      }
    },
    {
      "id": "uuid-2",
      "type": "single",
      "step": {
        "distance": 200,
        "vmaPercentage": 104,
        "rest": "0\""
      }
    }
  ]
}
```

### Programme avec bloc

```json
{
  "vma": 18,
  "elements": [
    {
      "id": "uuid-1",
      "type": "repetition",
      "repetitions": 8,
      "steps": [
        {
          "distance": 200,
          "vmaPercentage": 105,
          "rest": "30\""
        },
        {
          "distance": 200,
          "vmaPercentage": 80,
          "rest": "1'30\""
        }
      ]
    }
  ]
}
```

---

## 🛠️ Cas d'usage courants

### Export PDF
→ Voir [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#export-pdf-avec-jspdf)

### Sauvegarde BDD
→ Voir [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#sauvegarde-en-base-de-données)

### API REST
→ Voir [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#api-rest)

### Graphiques
→ Voir [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#génération-de-graphiques)

---

## 💡 Bonnes pratiques

### ✅ À faire
- Valider les données avant la sauvegarde
- Utiliser `useMemo` pour les calculs
- Stocker en JSONB en PostgreSQL
- Ajouter des index sur user_id et created_at

### ❌ À éviter
- Modifier directement le localStorage
- Oublier la conversion builder → training
- Stocker les temps calculés (recalculer à la volée)
- Exposer les IDs internes dans les URLs

---

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités:

1. Mettre à jour les types si nécessaire
2. Ajouter les calculs dans `calculator.ts`
3. Mettre à jour la conversion si besoin
4. Documenter dans cette section

---

## 📝 Notes techniques

### Format des temps de repos
- `"0""` = 0 secondes
- `"30""` = 30 secondes
- `"2'"` = 2 minutes (120 secondes)
- `"1'30""` = 1 min 30s (90 secondes)

### Calcul du temps cible
```
temps (s) = distance (km) / vitesse (km/h) × 3600
vitesse = VMA × (vmaPercentage / 100)
```

### Calcul de l'allure
```
allure (s/km) = 3600 / vitesse (km/h)
```

---

## 📞 Support

Pour toute question sur la structure des données:
1. Consultez d'abord [DATA_STRUCTURE.md](./DATA_STRUCTURE.md)
2. Vérifiez les exemples dans [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)
3. Inspectez le code source dans `src/lib/vma/`

---

Dernière mise à jour: Décembre 2024
