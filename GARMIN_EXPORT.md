  # Export d'entraînements vers Garmin Connect

Cette documentation explique comment utiliser la fonctionnalité d'export des séances d'entraînement vers Garmin Connect.

## 📋 Vue d'ensemble

L'application permet maintenant de créer des séances d'entraînement directement dans votre compte Garmin Connect en utilisant l'API JSON de Garmin. Les séances créées apparaissent automatiquement dans votre bibliothèque d'entraînements et peuvent être synchronisées avec vos appareils Garmin.

## 🚀 Fonctionnalités

### 1. Création directe sur Garmin Connect (Recommandé)
- Conversion automatique des séances en format JSON Garmin
- Envoi direct vers votre compte Garmin Connect via l'API
- Support des entraînements par intervalles avec répétitions
- Configuration des zones d'intensité basées sur la VMA
- Support des étapes basées sur le temps ou la distance
- Inclusion des périodes de récupération
- Les entraînements apparaissent immédiatement dans la section "Workouts" de Garmin Connect

### 2. Export fichier FIT (Alternative)
- Génération de fichiers FIT (Flexible and Interoperable Data Transfer)
- Téléchargement local du fichier .fit
- Compatible avec tous les appareils Garmin
- Nécessite une copie manuelle vers l'appareil (dossier Garmin/Newfiles)

## 📖 Guide d'utilisation

### Étape 1 : Authentification Garmin (Admin uniquement)

1. Rendez-vous sur `/login` (page réservée aux administrateurs)
2. Entrez vos identifiants Garmin Connect
3. Si vous avez activé l'authentification à deux facteurs (MFA), entrez le code
4. Une fois authentifié, vous êtes redirigé vers `/dashboard`

### Étape 2 : Créer une séance d'entraînement

1. Allez sur la page `/training`
2. Configurez votre VMA
3. Créez votre séance d'entraînement :
   - Ajoutez des blocs de répétitions
   - Définissez les étapes (distance ou temps)
   - Configurez l'intensité (% VMA)
   - Ajoutez des périodes de récupération

### Étape 3 : Exporter vers Garmin

#### Méthode 1 : Export direct (Recommandé)

1. Cliquez sur le bouton **"Exporter vers Garmin"**
2. L'application va :
   - Convertir la séance au format JSON Garmin
   - Créer la séance directement dans Garmin Connect via l'API
   - Afficher une notification de succès

3. Votre entraînement est immédiatement disponible dans votre bibliothèque Garmin Connect !
4. Synchronisez votre appareil Garmin pour le retrouver

#### Méthode 2 : Téléchargement FIT (Alternative)

1. Cliquez sur **"Télécharger .FIT"** (si disponible)
2. Le fichier .fit sera téléchargé sur votre ordinateur
3. Connectez votre appareil Garmin à l'ordinateur
4. Copiez le fichier dans le dossier `Garmin/Newfiles` de votre appareil
5. Déconnectez l'appareil - la séance apparaîtra dans la liste des entraînements

## 🔧 Architecture technique

### Composants créés

#### 1. Convertisseur JSON Garmin
**Fichier**: `src/lib/garmin/workout-json.ts`

```typescript
convertToGarminWorkout(
  elements: TrainingElement[],
  workoutName: string,
  vma?: number
): GarminWorkout
```

Fonctionnalités :
- Conversion des TrainingElement en format JSON Garmin
- Support des workout steps avec durée/distance
- Calcul des vitesses cibles basées sur la VMA
- Gestion des blocs de répétitions (RepeatGroupDTO)
- Configuration des types d'étapes (warmup, interval, recovery, rest)

#### 2. Actions serveur pour l'API Workout
**Fichier**: `src/actions/garmin/workout.ts`

```typescript
createGarminWorkout(
  workoutData: GarminWorkout
): Promise<Result>

scheduleGarminWorkout(
  workoutId: number,
  date: string | Date
): Promise<Result>
```

#### 3. Générateur de fichiers FIT (Optionnel)
**Fichier**: `src/lib/fit/workout-generator.ts`

```typescript
generateWorkoutFIT(
  elements: TrainingElement[],
  options: WorkoutGenerationOptions
): Uint8Array
```

Pour téléchargement local uniquement.

#### 4. Composant UI
**Fichier**: `src/components/training/export-garmin-button.tsx`

Bouton réutilisable avec :
- Modes 'upload' (JSON API) et 'download' (FIT)
- États de chargement
- Gestion des erreurs
- Notifications toast
- Désactivation si pas de séance

### Bibliothèques utilisées

- Client Garmin (`src/lib/garth`) - Pour l'authentification et les requêtes API
- **@garmin/fitsdk** (v21.178.0) - Pour génération FIT optionnelle

## 📝 Format JSON Garmin

L'API Garmin utilise un format JSON structuré pour créer des séances d'entraînement.

### Structure principale :
```typescript
{
  workoutName: string,
  description: string | null,
  sportType: {
    sportTypeId: 1,              // 1 = running
    sportTypeKey: "running"
  },
  workoutSegments: [{
    segmentOrder: 1,
    sportType: { ... },
    workoutSteps: GarminWorkoutStep[]
  }]
}
```

### Types d'étapes :

#### ExecutableStepDTO (Étape simple)
```typescript
{
  type: "ExecutableStepDTO",
  stepOrder: number,
  stepType: {
    stepTypeId: number,          // 1=warmup, 2=recovery, 3=interval, 4=rest
    stepTypeKey: string
  },
  endCondition: {
    conditionTypeId: number,     // 2=time, 3=distance
    conditionTypeKey: string
  },
  endConditionValue: number,     // Seconds or meters
  targetType: {
    workoutTargetTypeId: number, // 1=no.target, 6=speed.zone
    workoutTargetTypeKey: string
  },
  targetValueOne: number?,       // Lower bound (m/s)
  targetValueTwo: number?        // Upper bound (m/s)
}
```

#### RepeatGroupDTO (Bloc de répétitions)
```typescript
{
  type: "RepeatGroupDTO",
  stepOrder: number,
  numberOfIterations: number,    // Number of repetitions
  smartRepeat: boolean,
  childSteps: ExecutableStepDTO[]
}
```

### Exemple de séance convertie :

**Séance créée** :
- Échauffement : 10 min @ 65% VMA
- 3x (400m @ 100% VMA + 200m @ 65% VMA)
- Retour au calme : 5 min @ 65% VMA

**JSON généré** :
```json
{
  "workoutName": "Séance VMA",
  "sportType": { "sportTypeId": 1, "sportTypeKey": "running" },
  "workoutSegments": [{
    "segmentOrder": 1,
    "workoutSteps": [
      {
        "type": "ExecutableStepDTO",
        "stepOrder": 1,
        "stepType": { "stepTypeId": 1, "stepTypeKey": "warmup" },
        "endCondition": { "conditionTypeId": 2, "conditionTypeKey": "time" },
        "endConditionValue": 600
      },
      {
        "type": "RepeatGroupDTO",
        "stepOrder": 2,
        "numberOfIterations": 3,
        "childSteps": [
          {
            "stepOrder": 1,
            "stepType": { "stepTypeId": 3, "stepTypeKey": "interval" },
            "endCondition": { "conditionTypeId": 3, "conditionTypeKey": "distance" },
            "endConditionValue": 400
          },
          {
            "stepOrder": 2,
            "stepType": { "stepTypeId": 2, "stepTypeKey": "recovery" },
            "endCondition": { "conditionTypeId": 3, "conditionTypeKey": "distance" },
            "endConditionValue": 200
          }
        ]
      },
      {
        "type": "ExecutableStepDTO",
        "stepOrder": 3,
        "stepType": { "stepTypeId": 1, "stepTypeKey": "warmup" },
        "endCondition": { "conditionTypeId": 2, "conditionTypeKey": "time" },
        "endConditionValue": 300
      }
    ]
  }]
}
```

## 🔒 Sécurité

### Authentification
- Les tokens OAuth sont stockés dans des cookies HttpOnly
- Durée de validité : 30 jours
- Refresh automatique des tokens OAuth2

### Permissions
- L'upload Garmin est disponible pour tous les utilisateurs
- L'authentification Garmin (page `/login`) est réservée aux admins
- Les tokens ne sont jamais exposés côté client

## ❗ Limitations et notes

1. **Répétitions** : Supportées nativement via RepeatGroupDTO dans l'API JSON
2. **Zones de fréquence cardiaque** : Non configurées par défaut (peut être ajouté ultérieurement)
3. **Types de sport** : Actuellement configuré pour "running", peut être étendu
4. **API non officielle** : Utilise l'API non officielle de Garmin Connect - peut changer sans préavis
5. **Fichiers FIT** : Le mode "download" génère des FIT mais ne peut pas les uploader automatiquement (limitation Garmin)

## 🐛 Dépannage

### "Not authenticated. Please login first."
- Allez sur `/login` pour vous authentifier
- Vérifiez que vos identifiants Garmin sont corrects

### "Failed to create workout"
- Vérifiez votre connexion internet
- Assurez-vous que votre session Garmin est toujours valide
- Essayez de vous reconnecter sur `/login`
- Vérifiez les logs console pour plus de détails

### Le workout n'apparaît pas sur Garmin Connect
- Rafraîchissez la page Garmin Connect
- Vérifiez dans "Entraînements" → "Mes entraînements"
- La séance devrait apparaître immédiatement après la création

### Erreur lors de la création de la séance
- Les zones de vitesse doivent être en m/s
- Les durées doivent être en secondes
- Les distances doivent être en mètres
- Vérifiez que tous les champs requis sont remplis

## 🔮 Évolutions futures possibles

- [ ] Support des zones de fréquence cardiaque
- [ ] Configuration des alertes (vibrations, son)
- [ ] Support de plusieurs types de sport (vélo, natation)
- [ ] Export groupé de plusieurs séances
- [ ] Planification automatique des séances sur le calendrier
- [ ] Synchronisation bidirectionnelle (import depuis Garmin)
- [ ] Prévisualisation du workout avant l'export
- [ ] Support des zones de puissance (pour le vélo)
- [ ] Édition de séances existantes sur Garmin Connect

## 📚 Ressources

- [Documentation FIT SDK](https://developer.garmin.com/fit)
- [FIT JavaScript SDK GitHub](https://github.com/garmin/fit-javascript-sdk)
- [Garmin Connect Developer Forum](https://forums.garmin.com/developer/)

---

**Note** : Cette fonctionnalité utilise l'API non officielle de Garmin Connect via le client garth. Garmin peut modifier son API à tout moment.
