# 🚀 Guide de Duplication : running-data → PlaniTeam

Ce guide vous explique comment créer un nouveau repository PlaniTeam à partir du projet actuel.

---

## 📋 Étape 1 : Créer le nouveau repository sur GitHub

### Option A : Via GitHub Web Interface (Recommandé)

1. Allez sur [github.com/new](https://github.com/new)
2. Configurez le repository :
   - **Repository name** : `planiteam`
   - **Description** : "PlaniTeam - Plateforme SaaS Multi-Sports de Gestion d'Entraînements"
   - **Visibility** : Private (pour commencer)
   - ⚠️ **NE PAS** initialiser avec README/gitignore/license (on va pousser le code existant)
3. Cliquez sur **Create repository**

### Option B : Via GitHub CLI

```bash
gh repo create planiteam --private --description "PlaniTeam - Plateforme SaaS Multi-Sports"
```

---

## 📦 Étape 2 : Dupliquer le projet localement

### Méthode 1 : Duplication avec historique Git (Recommandé)

Ouvrez un terminal et exécutez :

```bash
# 1. Naviguer vers le bureau
cd C:\Users\paule\Desktop

# 2. Créer un clone bare (miroir complet) du projet actuel
git clone --bare running-data running-data-backup.git

# 3. Créer le nouveau dossier PlaniTeam
git clone running-data-backup.git planiteam

# 4. Entrer dans le nouveau dossier
cd planiteam

# 5. Changer l'origine remote vers le nouveau repo GitHub
# Remplacez YOUR_USERNAME par votre nom d'utilisateur GitHub
git remote set-url origin https://github.com/PeGrn/planiteam.git

# 6. Vérifier que l'origine a bien changé
git remote -v

# 7. Pousser tout l'historique vers le nouveau repo
git push -u origin main

# 8. (Optionnel) Supprimer le backup bare
cd ..
rmdir /s running-data-backup.git
```

### Méthode 2 : Copie simple sans historique (Plus rapide mais perd l'historique)

```bash
# 1. Copier tout le dossier
cd C:\Users\paule\Desktop
xcopy /E /I /H running-data planiteam

# 2. Supprimer l'ancien .git
cd planiteam
rmdir /s .git

# 3. Initialiser un nouveau repo
git init

# 4. Créer le premier commit
git add .
git commit -m "🎉 Initial commit - PlaniTeam SaaS Platform"

# 5. Connecter au repo GitHub distant
git remote add origin https://github.com/YOUR_USERNAME/planiteam.git

# 6. Pousser vers GitHub
git branch -M main
git push -u origin main
```

---

## 🧹 Étape 3 : Nettoyer les fichiers spécifiques au projet actuel

Dans le nouveau dossier `planiteam`, exécutez :

```bash
# Supprimer les fichiers temporaires
rm -rf node_modules
rm -rf .next

# Supprimer les fichiers de configuration locaux (on les recrée après)
rm .env
rm .env.local

# (Optionnel) Supprimer les fichiers de données de dev
rm -rf prisma/dev.db*
```

---

## ⚙️ Étape 4 : Mettre à jour les configurations pour PlaniTeam

### 4.1 Mettre à jour `package.json`

```bash
# Ouvrir le fichier dans VS Code
code package.json
```

Modifiez :

```json
{
  "name": "planiteam",
  "version": "1.0.0",
  "description": "PlaniTeam - Plateforme SaaS Multi-Sports de Gestion d'Entraînements",
  "private": true,
  // ... reste identique
}
```

### 4.2 Créer un nouveau `.env`

```bash
# Copier le template
copy .env.example .env
```

Puis modifiez `.env` avec de **nouvelles credentials** (ne pas réutiliser celles de production) :

```env
# Base de données (créer une NOUVELLE database pour PlaniTeam)
DATABASE_URL="postgresql://user:password@localhost:5432/planiteam_dev"

# Clerk (créer une NOUVELLE application Clerk pour PlaniTeam)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_NEW_KEY"
CLERK_SECRET_KEY="sk_test_NEW_KEY"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# Admin (votre email)
ADMIN_EMAIL="pauletiennegrn@gmail.com"

# MinIO/S3 (nouveau bucket)
S3_ENDPOINT="localhost"
S3_PORT="9000"
S3_USE_SSL="false"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_REGION="us-east-1"
S3_BUCKET_NAME="planiteam-dev"

# Email (créer une nouvelle clé Resend ou réutiliser)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@planiteam.fr"
EMAIL_FROM_NAME="PlaniTeam"

# URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

### 4.3 Mettre à jour `README.md`

```bash
# Remplacer l'ancien README par un nouveau pour PlaniTeam
code README.md
```

Contenu suggéré :

```markdown
# PlaniTeam 🏃🏊🚴

**Plateforme SaaS Multi-Sports de Gestion d'Entraînements**

PlaniTeam permet aux clubs sportifs de créer, planifier et partager des entraînements personnalisés pour tous les sports.

## 🌟 Caractéristiques

- 🎯 **Multi-Sports** : Running, natation, cyclisme, athlétisme, et plus
- 👥 **Multi-Tenant** : Chaque club dispose de son espace isolé
- 🏗️ **Builders Adaptés** : Interface de création selon le sport
- 📊 **Facteurs d'Intensité** : VMA, FTP, RM, personnalisés par athlète
- 📅 **Planning Interactif** : Calendrier avec assignation par équipes
- 💳 **Stripe Integration** : Abonnements récurrents (Solo, Standard, Performance)

## 🚀 Quick Start

```bash
# Installer les dépendances
npm install

# Configurer la base de données
npx prisma migrate dev

# Lancer le serveur de dev
npm run dev
```

## 📖 Documentation

- [Architecture Technique](./SAAS_TRANSFORMATION_COMPLETE.md)
- [Guide de Transformation SaaS](./SAAS_TRANSFORMATION_COMPLETE.md)

## 🛠️ Stack Technique

- Next.js 16 + React 19
- PostgreSQL + Prisma
- Clerk (Auth)
- Stripe (Billing)
- MinIO/S3 (Storage)
- Tailwind CSS

## 📄 Licence

Propriétaire - Paul-Etienne Guérin
```

### 4.4 Créer un nouveau fichier `.env.example`

```bash
code .env.example
```

```env
# PlaniTeam - Configuration Template

# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/planiteam_dev"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# Admin
ADMIN_EMAIL="your-email@example.com"

# MinIO/S3
S3_ENDPOINT="localhost"
S3_PORT="9000"
S3_USE_SSL="false"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_REGION="us-east-1"
S3_BUCKET_NAME="planiteam-dev"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@planiteam.fr"
EMAIL_FROM_NAME="PlaniTeam"

# URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Stripe (à configurer plus tard)
# STRIPE_SECRET_KEY="sk_test_..."
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
# STRIPE_WEBHOOK_SECRET="whsec_..."

# Environment
NODE_ENV="development"
```

---

## 🎯 Étape 5 : Initialiser le nouveau projet

```bash
# 1. Installer les dépendances
npm install

# 2. Créer une nouvelle base de données PostgreSQL
# Via pgAdmin ou en ligne de commande :
createdb planiteam_dev

# 3. Générer le client Prisma
npx prisma generate

# 4. Appliquer les migrations existantes
npx prisma migrate dev

# 5. (Optionnel) Créer un MinIO bucket
# Via l'interface MinIO (localhost:9001) ou CLI
# Nom du bucket : planiteam-dev

# 6. Lancer le serveur
npm run dev
```

Visitez [http://localhost:3000](http://localhost:3000)

---

## 📝 Étape 6 : Premier commit PlaniTeam

```bash
# Ajouter tous les changements
git add .

# Créer le commit de rebranding
git commit -m "🎨 Rebrand to PlaniTeam - Update configs and docs"

# Pousser vers GitHub
git push origin main
```

---

## ⚠️ Points d'Attention

### Secrets et Credentials

❌ **NE JAMAIS** :
- Réutiliser les credentials de production dans le nouveau repo
- Commiter des fichiers `.env` avec des vraies clés
- Partager les clés Stripe/Clerk entre les deux projets

✅ **TOUJOURS** :
- Créer de nouvelles applications Clerk pour PlaniTeam
- Créer de nouveaux produits Stripe pour PlaniTeam
- Utiliser des bases de données séparées
- Créer de nouveaux buckets S3/MinIO

### Fichiers à ne PAS commiter

Vérifiez votre `.gitignore` :

```gitignore
# dependencies
/node_modules

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
prisma/dev.db
prisma/dev.db-journal

# IDE
.vscode/
.idea/
*.swp
```

---

## 🔄 Workflow Recommandé

### Structure des branches

```
main (production)
└── develop (integration)
    ├── feature/phase-1-multitenant
    ├── feature/phase-2-landing-page
    ├── feature/phase-3-stripe
    └── ...
```

### Commandes Git utiles

```bash
# Créer une branche pour la Phase 1
git checkout -b feature/phase-1-multitenant

# Travailler sur la phase 1...

# Commit
git add .
git commit -m "feat: add multi-tenant schema (PHASE 1.1)"

# Pousser la branche
git push -u origin feature/phase-1-multitenant

# Créer une Pull Request sur GitHub
# puis merger dans develop

# Une fois la phase validée, merger develop dans main
git checkout main
git merge develop
git push origin main
```

---

## 🎨 Personnalisation du Branding

### Fichiers à modifier pour le branding PlaniTeam

- [ ] `package.json` - Nom et description
- [ ] `README.md` - Documentation
- [ ] `src/app/layout.tsx` - Metadata SEO
- [ ] `src/app/manifest.ts` - PWA manifest
- [ ] `public/` - Logo, favicon, og-image
- [ ] Tous les composants avec texte "ESL Team" → "PlaniTeam"

### Commandes de recherche/remplacement

```bash
# Rechercher toutes les occurrences de "ESL Team"
grep -r "ESL Team" src/

# Rechercher toutes les occurrences de "eslteam"
grep -ri "eslteam" src/
```

Ou utiliser l'outil de recherche/remplacement de VS Code :
- `Ctrl+Shift+H` (Windows)
- Chercher : `ESL Team` ou `eslteam` ou `running-data`
- Remplacer par : `PlaniTeam` ou `planiteam`

---

## 🚀 Prochaines Étapes

Une fois le repo dupliqué et initialisé :

1. ✅ Valider que tout fonctionne en local
2. 📝 Lire `SAAS_TRANSFORMATION_COMPLETE.md`
3. 🏗️ Démarrer la **PHASE 1** : Architecture Multi-Sports
4. 💳 Configurer Stripe pour PlaniTeam
5. 🎨 Créer la landing page PlaniTeam

---

## 🆘 Troubleshooting

### Erreur : "remote: Repository not found"

→ Vérifiez l'URL du remote :
```bash
git remote -v
```

Corrigez si nécessaire :
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/planiteam.git
```

### Erreur : Database connection failed

→ Vérifiez que PostgreSQL est lancé et que la DATABASE_URL est correcte :
```bash
# Tester la connexion
psql -U user -d planiteam_dev
```

### Erreur : Prisma client not generated

→ Régénérer le client :
```bash
npx prisma generate
```

### Port 3000 déjà utilisé

→ Tuer le processus ou utiliser un autre port :
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou utiliser un autre port
npm run dev -- -p 3001
```

---

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Clerk](https://clerk.com/docs)
- [Documentation Stripe](https://stripe.com/docs)

---

**Bon courage pour PlaniTeam ! 🚀**
