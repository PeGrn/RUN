# ✅ Checklist de Passage en Production

## 🔐 1. Configuration Clerk

### 1.1 Créer un projet de production
- [ ] Aller sur [dashboard.clerk.com](https://dashboard.clerk.com)
- [ ] Créer un **nouveau projet** pour la production (ne pas utiliser le projet de test)
- [ ] Récupérer les nouvelles clés :
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (commence par `pk_live_...`)
  - `CLERK_SECRET_KEY` (commence par `sk_live_...`)

### 1.2 Configurer les URLs de production
- [ ] Dans Clerk Dashboard → **Paths**
  - Sign-in URL : `/sign-in`
  - Sign-up URL : `/sign-up`
  - After sign-in : `/planning`
  - After sign-up : `/waiting`
- [ ] Dans Clerk Dashboard → **Domains**
  - Ajouter votre domaine : `run.paul-etienne.fr`
  - ⚠️ Attendre la vérification du domaine avant de déployer

### 1.3 Configurer le JWT Template
- [ ] Aller dans **Configure** → **Sessions** → **Customize session token**
- [ ] Remplacer le contenu par :
```json
{
  "email": "{{user.primary_email_address}}",
  "primaryEmail": "{{user.primary_email_address}}",
  "publicMetadata": "{{user.public_metadata}}"
}
```
- [ ] Sauvegarder

### 1.4 Configurer le Webhook (pour auto-admin)
- [ ] Aller dans **Webhooks** → **Add Endpoint**
- [ ] URL : `https://run.paul-etienne.fr/api/webhooks/clerk`
- [ ] Sélectionner l'événement : `user.created`
- [ ] Copier le **Signing Secret** (commence par `whsec_...`)
- [ ] Ajouter dans `.env` : `CLERK_WEBHOOK_SECRET="whsec_..."`
- [ ] ⚠️ Ajouter la vérification du webhook dans `route.ts` (voir section Sécurité)

### 1.5 Configurer les méthodes d'authentification
- [ ] **Email/Password** : Activer
- [ ] **Google OAuth** (optionnel) : Activer si souhaité
- [ ] **MFA** (optionnel) : Activer pour plus de sécurité

---

## 🌐 2. Variables d'Environnement

### 2.1 Créer `.env.production` sur le serveur

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Resend API
RESEND_API_KEY="re_..."
EMAIL_FROM="contact@paul-etienne.fr"
NEXT_PUBLIC_APP_URL="https://run.paul-etienne.fr"

# Minio (S3)
S3_ENDPOINT="minio-api.paul-etienne.fr"
S3_PORT=""
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="..."
S3_BUCKET_NAME="run-project"
S3_USE_SSL="true"

# Clerk Authentication (PRODUCTION KEYS)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
CLERK_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/planning"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/waiting"

# Admin Email
ADMIN_EMAIL="pauletiennegrn@gmail.com"
```

### 2.2 Vérifications importantes
- [ ] ⚠️ **NE JAMAIS** committer les fichiers `.env` de production
- [ ] Vérifier que `.gitignore` contient `.env*`
- [ ] Utiliser des secrets management (GitHub Secrets, Vercel Env, etc.)
- [ ] Changer `NEXT_PUBLIC_APP_URL` de `http://localhost:3000` à `https://run.paul-etienne.fr`

---

## 🔒 3. Sécurité

### 3.1 Sécuriser le webhook Clerk
- [ ] Ajouter la vérification de signature dans `src/app/api/webhooks/clerk/route.ts` :

```typescript
import { Webhook } from 'svix';

export async function POST(req: Request) {
  // Vérifier la signature du webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  // Récupérer les headers
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  // Récupérer le body
  const body = await req.text();

  // Créer l'instance Svix
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return new Response('Error: Verification failed', { status: 400 });
  }

  const { type, data } = evt;

  // Votre logique existante...
  if (type === 'user.created') {
    // ...
  }

  return NextResponse.json({ success: true });
}
```

- [ ] Installer `svix` : `npm install svix`

### 3.2 Protéger les routes API
- [ ] Vérifier que toutes les actions serveur vérifient les permissions
- [ ] Tester les routes API sans authentification (doivent retourner 401)

### 3.3 HTTPS et CORS
- [ ] Vérifier que le site est en HTTPS
- [ ] Configurer les headers de sécurité dans `next.config.js` :

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 📧 4. Configuration Email (Resend)

### 4.1 Vérifier la clé API
- [ ] Aller sur [resend.com](https://resend.com)
- [ ] Vérifier que la clé API est active
- [ ] Tester l'envoi d'un email de test

### 4.2 Domaine custom (déjà fait)
- [ ] Vérifier que `paul-etienne.fr` est vérifié dans Resend
- [ ] Vérifier les enregistrements DNS (SPF, DKIM, DMARC)
- [ ] Tester l'envoi depuis `contact@paul-etienne.fr`

---

## 💾 5. Base de Données

### 5.1 Backup
- [ ] Mettre en place des backups automatiques de la base de données
- [ ] Tester la restauration d'un backup

### 5.2 Migrations
- [ ] Vérifier que toutes les migrations Prisma sont appliquées
- [ ] Exécuter `npx prisma migrate deploy` sur la production
- [ ] Vérifier que le schéma est à jour : `npx prisma db push`

### 5.3 Performance
- [ ] Vérifier les index de la base de données
- [ ] Activer le connection pooling si nécessaire

---

## 🗄️ 6. Storage (MinIO/S3)

### 6.1 Vérifier la configuration
- [ ] S3_USE_SSL est à `"true"`
- [ ] Le bucket `run-project` existe
- [ ] Les permissions sont correctement configurées

### 6.2 Tester l'upload
- [ ] Tester la sauvegarde d'un PDF
- [ ] Vérifier que le téléchargement fonctionne
- [ ] Vérifier les URLs générées

---

## 🧪 7. Tests avant Déploiement

### 7.1 Tests fonctionnels
- [ ] **Authentification**
  - [ ] Inscription d'un nouvel utilisateur
  - [ ] Redirection vers `/waiting`
  - [ ] Connexion avec un compte existant
  - [ ] Déconnexion

- [ ] **Admin**
  - [ ] Connexion avec `pauletiennegrn@gmail.com`
  - [ ] Accès direct à l'application (pas de `/waiting`)
  - [ ] Accès à `/admin`
  - [ ] Approbation d'un utilisateur
  - [ ] Email d'approbation reçu
  - [ ] Changement de rôle (athlete → coach)
  - [ ] Révocation d'un utilisateur

- [ ] **Planning**
  - [ ] Affichage du calendrier
  - [ ] Création d'une séance
  - [ ] Sauvegarde d'une séance (coach uniquement)
  - [ ] Affichage des séances dans le calendrier
  - [ ] Ouverture du drawer avec détails de la séance

- [ ] **Training**
  - [ ] Création d'un programme VMA
  - [ ] Téléchargement du PDF (tous)
  - [ ] Planification et sauvegarde (coach uniquement)

- [ ] **Responsive**
  - [ ] Tester sur mobile (375px)
  - [ ] Tester sur tablette (768px)
  - [ ] Tester sur desktop (1920px)

### 7.2 Tests de sécurité
- [ ] Tenter d'accéder à `/admin` sans être connecté → redirection `/sign-in`
- [ ] Tenter d'accéder à `/planning` sans être connecté → redirection `/sign-in`
- [ ] Tenter d'accéder à `/admin` en tant qu'athlete → redirection `/planning`
- [ ] Tenter d'accéder à `/planning` avec status pending → redirection `/waiting`

### 7.3 Build de production
- [ ] Exécuter `npm run build`
- [ ] Vérifier qu'il n'y a pas d'erreurs TypeScript
- [ ] Vérifier qu'il n'y a pas d'erreurs de compilation
- [ ] Tester le build local : `npm run start`

---

## 🚀 8. Déploiement

### 8.1 Préparer le déploiement
- [ ] Merger toutes les branches dans `main`
- [ ] Créer un tag de version : `git tag v1.0.0`
- [ ] Push vers le repository : `git push --tags`

### 8.2 Déployer l'application
- [ ] Déployer sur votre serveur / plateforme (Vercel, Netlify, VPS, etc.)
- [ ] Configurer les variables d'environnement
- [ ] Vérifier que le domaine `run.paul-etienne.fr` pointe vers l'application

### 8.3 Vérifications post-déploiement
- [ ] Accéder à `https://run.paul-etienne.fr`
- [ ] Vérifier le certificat SSL (cadenas vert)
- [ ] Tester la connexion
- [ ] Tester l'inscription d'un nouvel utilisateur
- [ ] Vérifier les logs serveur (pas d'erreurs)

---

## 📊 9. Monitoring et Logs

### 9.1 Mettre en place le monitoring
- [ ] Configurer un outil de monitoring (Sentry, LogRocket, etc.)
- [ ] Surveiller les erreurs JavaScript côté client
- [ ] Surveiller les erreurs API côté serveur

### 9.2 Analytics
- [ ] Ajouter Google Analytics ou Plausible (optionnel)
- [ ] Suivre les conversions (inscriptions, approbations, etc.)

### 9.3 Logs
- [ ] Vérifier que les logs serveur sont accessibles
- [ ] Configurer la rotation des logs
- [ ] Surveiller les logs d'erreurs

---

## ⚡ 10. Performance

### 10.1 Optimisations
- [ ] Activer la compression gzip/brotli
- [ ] Configurer le caching des assets statiques
- [ ] Optimiser les images (déjà fait avec Next.js)

### 10.2 Tests de performance
- [ ] Tester avec Google Lighthouse (score > 90)
- [ ] Tester le temps de chargement initial
- [ ] Vérifier la taille du bundle JavaScript

---

## 📝 11. Documentation

### 11.1 Documenter les processus
- [ ] Créer un guide d'utilisation pour les coaches
- [ ] Documenter le processus d'approbation des utilisateurs
- [ ] Documenter les rôles et permissions

### 11.2 Documentation technique
- [ ] CLERK_SETUP.md ✅
- [ ] RESEND_SETUP.md ✅
- [ ] PRODUCTION_CHECKLIST.md ✅ (ce fichier)

---

## 🆘 12. Plan de Secours

### 12.1 Backup et rollback
- [ ] Créer un backup de la base de données avant déploiement
- [ ] Garder la version précédente accessible (rollback possible)
- [ ] Documenter la procédure de rollback

### 12.2 Contact d'urgence
- [ ] Préparer une page de maintenance
- [ ] Avoir un plan de communication en cas de problème
- [ ] Tester le rollback

---

## ✅ Checklist Finale

Avant de déclarer la production **PRÊTE** :

- [ ] ✅ Clerk configuré avec les clés de production
- [ ] ✅ Webhook Clerk sécurisé et testé
- [ ] ✅ Domaine custom vérifié dans Clerk
- [ ] ✅ Variables d'environnement de production configurées
- [ ] ✅ HTTPS actif avec certificat valide
- [ ] ✅ Base de données migrée et backupée
- [ ] ✅ Resend configuré avec domaine custom
- [ ] ✅ Email d'approbation testé et fonctionnel
- [ ] ✅ Tous les tests fonctionnels passent
- [ ] ✅ Tous les tests de sécurité passent
- [ ] ✅ Responsive testé sur mobile/tablette/desktop
- [ ] ✅ Build de production sans erreurs
- [ ] ✅ Monitoring et logs en place
- [ ] ✅ Plan de secours préparé

---

## 🎉 Post-Production

### Après le déploiement réussi :

1. **Communiquer le lancement**
   - Informer les premiers utilisateurs
   - Envoyer le lien : `https://run.paul-etienne.fr`

2. **Surveiller les premières 24h**
   - Vérifier les logs régulièrement
   - Être disponible pour les premiers retours
   - Corriger rapidement les bugs critiques

3. **Collecter les retours**
   - Demander aux premiers utilisateurs leurs impressions
   - Noter les bugs et améliorations à faire
   - Prioriser les corrections

---

## 🔧 Maintenance Continue

### Actions régulières :

- **Hebdomadaire**
  - Vérifier les logs d'erreurs
  - Surveiller les performances
  - Vérifier les backups

- **Mensuel**
  - Mettre à jour les dépendances : `npm update`
  - Vérifier les vulnérabilités : `npm audit`
  - Réviser les métriques d'utilisation

- **Trimestriel**
  - Réviser les permissions et rôles
  - Nettoyer les données obsolètes
  - Optimiser les performances

---

**Bonne chance pour le passage en production ! 🚀**
