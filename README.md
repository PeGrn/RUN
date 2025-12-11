# ESL Team - Plateforme de Gestion d'Entraînements Running

Application web full-stack moderne de gestion d'entraînements sportifs avec intégration Garmin Connect.

## Table des Matières

- [Vue d'Ensemble](#vue-densemble)
- [Fonctionnalités Principales](#fonctionnalités-principales)
- [Technologies Utilisées](#technologies-utilisées)
- [Architecture du Projet](#architecture-du-projet)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Rôles et Permissions](#rôles-et-permissions)
- [Structure de la Base de Données](#structure-de-la-base-de-données)
- [Déploiement](#déploiement)

## Vue d'Ensemble

ESL Team est une plateforme complète de gestion d'entraînements running qui permet aux coachs de créer des séances personnalisées basées sur la VMA (Vitesse Maximale Aérobie), de les distribuer aux athlètes via un calendrier interactif, et de suivre les performances via l'intégration Garmin Connect.

### Points Clés

- **Builder d'Entraînement Avancé** : Interface drag-and-drop pour créer des séances complexes
- **Calculs Automatiques VMA** : Conversion automatique distance/temps/pace basée sur la VMA
- **Génération PDF** : Export professionnel des séances d'entraînement
- **Planning Interactif** : Calendrier avec visualisation des séances et événements
- **Intégration Garmin** : Récupération d'activités, stats et visualisation GPS
- **Système de Permissions** : Gestion des rôles (athlete, coach, admin)

## Fonctionnalités Principales

### Pour Tous les Utilisateurs

#### Accueil (`/`)
- Vue d'ensemble de la semaine courante et prochaine
- Affichage des séances planifiées
- Affichage des événements (courses, rassemblements)
- Graphiques de charge d'entraînement

#### Profil Utilisateur
- Gestion du profil via Clerk
- Configuration de la VMA personnelle
- Paramètres de compte

### Pour Utilisateurs Approuvés

#### Planning (`/planning`)
- **Calendrier interactif** avec navigation par mois
- **Indicateurs visuels** pour séances et événements
- **Drawer de détails** au clic sur une date
- **Téléchargement PDF** direct des séances
- Affichage des événements à venir

#### Créateur d'Entraînement (`/training`)
- **Interface drag-and-drop** avec DND Kit
- **Blocs de répétition** configurables (1 à N répétitions)
- **Étapes personnalisées** avec :
  - Type cible : Distance (mètres) ou Temps (MM:SS)
  - Pourcentage VMA (ex: 88% VMA)
  - Temps de repos (MM:SS)
  - Nom et description
- **Calculs automatiques** :
  - Distance → Temps + Pace
  - Temps → Distance estimée
  - Pace (min/km)
  - Split 200m
- **Visualisation en tableau** de la séance complète
- **Génération PDF automatique** avec mise en page professionnelle
- **Sauvegarde** en base de données + MinIO
- **Envoi par email** à des utilisateurs spécifiques

### Pour Coachs et Admins

#### Historique Global (`/sessions`)
- Vue consolidée de toutes les séances et événements
- **Filtrage** par type (séance/événement)
- **Recherche** textuelle
- **Actions** : télécharger PDF, supprimer, envoyer par email
- **Pagination** et tri

#### Gestion des Événements
- Création d'événements (courses, rassemblements)
- Date, titre, description
- Affichage sur le calendrier

### Pour Admins Uniquement

#### Dashboard Garmin (`/dashboard`)
- **Connexion sécurisée** à Garmin Connect (OAuth 1.0a)
- **Activités récentes** (top 10)
- **Statistiques quotidiennes** :
  - Pas (7 derniers jours)
  - Niveau de stress (7 derniers jours)
- Informations du profil Garmin

#### Détail Activité (`/activity/[id]`)
- **Carte interactive Leaflet** avec tracé GPX
- **Graphiques détaillés** :
  - Vitesse
  - Altitude
  - Fréquence cardiaque
- **Statistiques complètes** :
  - Durée, distance, pace moyen
  - Calories, dénivelé, température
- **Téléchargement GPX**

#### Gestion des Utilisateurs (`/admin`)
- **Liste complète** des utilisateurs
- **Approbation** des nouveaux inscrits
- **Modification des rôles** (athlete ↔ coach)
- **Gestion des statuts** (pending/approved)

## Technologies Utilisées

### Framework & Core
- **Next.js 16.0.6** - Framework React full-stack avec App Router
- **React 19.2.0** - Bibliothèque UI
- **TypeScript 5** - Typage statique
- **Node.js** ≥ 20.9.0

### Base de Données & ORM
- **PostgreSQL** - Base de données relationnelle
- **Prisma 5.22.0** - ORM moderne avec migrations

### Authentification
- **Clerk** - Authentification utilisateur avec RBAC
- **OAuth 1.0a** - Authentification Garmin Connect

### Stockage
- **MinIO 8.0.6** - Stockage S3-compatible pour PDFs
- **AWS SDK S3** - Client S3 avec URLs signées

### UI & Styling
- **Tailwind CSS 4** - Framework CSS utilitaire
- **Radix UI** - Composants accessibles (21 composants)
- **Lucide React** - Icônes SVG
- **Recharts 2.15.4** - Graphiques interactifs
- **Leaflet** - Cartes interactives

### Formulaires & Validation
- **React Hook Form 7.54.0** - Gestion de formulaires
- **Zod 3.23.8** - Validation de schémas TypeScript

### Email & PDF
- **Resend 6.5.2** - Service d'envoi d'emails
- **React Email** - Templates HTML réactifs
- **jsPDF 3.0.4** - Génération de PDFs côté client

### Autres
- **@dnd-kit** - Système drag-and-drop
- **date-fns 4.1.0** - Manipulation de dates
- **Axios 1.6.0** - Client HTTP avec retry

## Architecture du Projet

```
running-data/
├── src/
│   ├── app/                    # Pages et routes (Next.js App Router)
│   │   ├── page.tsx           # Accueil
│   │   ├── layout.tsx         # Layout racine
│   │   ├── dashboard/         # Dashboard Garmin (admin)
│   │   ├── training/          # Créateur d'entraînement
│   │   ├── planning/          # Calendrier
│   │   ├── sessions/          # Historique
│   │   ├── activity/[id]/     # Détail activité Garmin
│   │   ├── admin/             # Gestion utilisateurs
│   │   └── api/webhooks/      # Webhooks Clerk
│   ├── components/            # Composants React (43 fichiers)
│   │   ├── ui/               # Composants Radix UI (21)
│   │   ├── training/         # Builder et séances
│   │   ├── planning/         # Calendrier
│   │   ├── sessions/         # Historique
│   │   ├── history/          # Liste historique
│   │   ├── admin/            # Admin
│   │   └── header-clerk.tsx  # Navigation
│   ├── actions/              # Server Actions
│   │   ├── training-sessions.ts  # CRUD séances
│   │   ├── events.ts         # Événements
│   │   ├── users.ts          # Gestion utilisateurs
│   │   ├── email.ts          # Envoi emails
│   │   ├── planning.ts       # Planning
│   │   └── garmin/           # Intégration Garmin
│   ├── lib/                  # Utilitaires et logique métier
│   │   ├── auth.ts           # Authentification et RBAC
│   │   ├── prisma.ts         # Client Prisma
│   │   ├── s3.ts             # Client MinIO
│   │   ├── pdf-export.ts     # Génération PDF
│   │   ├── resend.ts         # Configuration email
│   │   ├── vma/              # Calculs VMA
│   │   └── garth/            # Client Garmin (port TypeScript)
│   ├── hooks/                # Hooks personnalisés
│   │   └── use-local-storage.ts
│   ├── emails/               # Templates email
│   └── proxy.ts              # Proxy requêtes externes
├── prisma/
│   ├── schema.prisma         # Schéma de base de données
│   └── migrations/           # Migrations
├── public/                   # Assets statiques
├── next.config.ts            # Configuration Next.js
├── tailwind.config.js        # Configuration Tailwind
├── tsconfig.json             # Configuration TypeScript
└── package.json              # Dépendances
```

## Installation

### Prérequis

- Node.js ≥ 20.9.0
- PostgreSQL
- MinIO ou S3
- Compte Clerk
- Compte Resend
- (Optionnel) Compte Garmin Connect

### Étapes

1. **Cloner le repository**

```bash
git clone <repository-url>
cd running-data
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer les variables d'environnement**

Créer un fichier `.env` à la racine :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/running_data"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# Admin
ADMIN_EMAIL="admin@example.com"

# MinIO/S3
S3_ENDPOINT="localhost"
S3_PORT="9000"
S3_USE_SSL="false"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_REGION="us-east-1"
S3_BUCKET_NAME="run-project"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@example.com"
EMAIL_FROM_NAME="ESL Team"

# Environment
NODE_ENV="development"
```

4. **Initialiser la base de données**

```bash
npx prisma migrate dev
npx prisma generate
```

5. **Démarrer le serveur de développement**

```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## Configuration

### MinIO (Développement Local)

```bash
# Installation avec Docker
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  quay.io/minio/minio server /data --console-address ":9001"
```

Console MinIO : [http://localhost:9001](http://localhost:9001)

### Clerk

1. Créer un compte sur [clerk.com](https://clerk.com)
2. Créer une nouvelle application
3. Copier les clés API dans `.env`
4. Configurer les URLs de redirection
5. Activer les métadonnées publiques

### Garmin Connect (Optionnel)

L'intégration Garmin utilise OAuth 1.0a. Aucune clé API n'est requise, mais vous devez fournir vos identifiants Garmin Connect via l'interface admin.

## Utilisation

### Créer une Séance d'Entraînement

1. Accéder à `/training`
2. Configurer votre VMA si ce n'est pas fait
3. Cliquer sur "Ajouter un bloc de répétition"
4. Ajouter des étapes avec :
   - Type (Distance ou Temps)
   - Valeur cible
   - Pourcentage VMA
   - Temps de repos
5. Visualiser les calculs automatiques
6. Cliquer sur "Sauvegarder la séance"
7. Remplir le nom, description, date
8. Choisir "Sauvegarder" ou "Envoyer par email"

### Consulter le Planning

1. Accéder à `/planning`
2. Naviguer dans le calendrier
3. Cliquer sur une date pour voir les séances
4. Télécharger les PDFs si nécessaire

### Gérer les Utilisateurs (Admin)

1. Accéder à `/admin`
2. Voir les utilisateurs en attente (status: pending)
3. Cliquer sur "Approuver" ou modifier le rôle
4. Les utilisateurs reçoivent un email de confirmation

### Se Connecter à Garmin (Admin)

1. Accéder à `/dashboard`
2. Cliquer sur "Se connecter à Garmin"
3. Entrer identifiants Garmin Connect
4. (Si MFA) Entrer le code 2FA
5. Visualiser les activités et statistiques

## Rôles et Permissions

### Athlete (Défaut)
- Voir l'accueil
- Consulter le planning
- Créer des séances (si approuvé)
- Configurer sa VMA

### Coach
- Toutes les permissions Athlete
- Accéder à l'historique global
- Créer et gérer des événements
- Voir toutes les séances

### Admin
- Toutes les permissions Coach
- Gérer les utilisateurs
- Approuver les inscriptions
- Modifier les rôles
- Accéder au dashboard Garmin
- Voir les activités détaillées

### Statuts
- **Pending** : En attente d'approbation (accès limité)
- **Approved** : Approuvé et actif (accès complet selon rôle)

## Structure de la Base de Données

### TrainingSession

```prisma
model TrainingSession {
  id            String    @id @default(uuid())
  name          String
  description   String?
  vma           Float              // VMA utilisée
  pdfUrl        String             // URL MinIO signée
  pdfKey        String             // Clé S3
  totalDistance Float              // Mètres
  totalTime     Int                // Secondes
  steps         Json               // Étapes (TrainingElement[])
  sessionDate   DateTime?          // Date planifiée
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  userId        String?
}
```

### Event

```prisma
model Event {
  id          String   @id @default(uuid())
  title       String
  description String?
  eventDate   DateTime
  type        String   @default("race")  // 'race' | 'gathering' | 'other'
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Métadonnées Utilisateur (Clerk)

Stockées dans `publicMetadata` :

```typescript
{
  vma: number,                    // VMA en km/h
  role: 'athlete' | 'coach' | 'admin',
  status: 'pending' | 'approved'
}
```

## Scripts Disponibles

```bash
# Développement
npm run dev                # Démarrer le serveur de dev

# Build
npm run build              # Build de production
npm run start              # Démarrer le serveur de prod

# Base de données
npx prisma migrate dev     # Créer une migration
npx prisma migrate deploy  # Appliquer les migrations
npx prisma generate        # Générer le client Prisma
npx prisma studio          # Interface graphique BD

# Linting
npm run lint               # Vérifier le code
```

## Déploiement

### Vercel (Recommandé)

1. Connecter le repository GitHub à Vercel
2. Configurer les variables d'environnement
3. Déployer

### Docker

```dockerfile
# Dockerfile exemple
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Variables d'Environnement de Production

Assurez-vous de configurer :
- `DATABASE_URL` avec PostgreSQL de production
- `S3_*` avec MinIO/S3 de production
- `RESEND_API_KEY` avec clé de production
- `CLERK_*` avec clés de production
- `ADMIN_EMAIL` avec email admin réel

## Support & Contact

Pour toute question ou problème, contactez Paul-Etienne Guérin.

## Licence

Propriétaire - Paul-Etienne Guérin

---

**Version** : 1.0.0
**Dernière mise à jour** : Décembre 2025
**Développé avec** : Next.js 16, React 19, TypeScript 5
