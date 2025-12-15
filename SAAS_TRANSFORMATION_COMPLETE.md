# 🚀 Plan Complet de Transformation SaaS - PlaniTeam

## Vue d'ensemble

Ce document détaille la transformation complète de l'application en **PlaniTeam**, une plateforme SaaS multitenant multi-sports production-ready avec intégration Stripe et landing page moderne.

**Objectif** : Permettre à plusieurs clubs sportifs (running, athlétisme, natation, cyclisme, etc.) de gérer leurs entraînements de manière isolée, avec des builders adaptés à chaque sport, facturation récurrente et onboarding automatisé.

**Vision** : PlaniTeam n'est pas limité à la course à pied. Le système est conçu pour s'adapter à tout sport avec un facteur d'intensité (VMA pour le running, puissance pour le cyclisme, hauteur pour le saut, etc.). De nouveaux builders peuvent être créés sur demande pour chaque discipline.

---

## 📊 Architecture Cible

### Hiérarchie
```
Super Admin (Plateforme PlaniTeam)
└── Club (Organisation payante - multi-sports)
    ├── Club Admin (Président)
    ├── Coaches (Staff)
    │   └── Teams (Groupes d'entraînement)
    │       └── Athletes (Membres)
    └── Training Sessions & Events
```

### Multi-Sports Architecture

PlaniTeam supporte nativement plusieurs sports avec des builders adaptés :

| Sport | Facteur d'Intensité | Métriques | Builder Disponible |
|-------|---------------------|-----------|-------------------|
| **Running** | VMA (km/h) | Distance, Temps, Pace | ✅ Disponible |
| **Athlétisme (sauts)** | Hauteur maximale (cm) | Hauteur, Répétitions | 🔄 Sur demande |
| **Natation** | Temps au 100m | Distance, Temps, Allure | 🔄 Sur demande |
| **Cyclisme** | FTP (watts) | Distance, Puissance, Temps | 🔄 Sur demande |
| **Musculation** | RM (Répétition Max) | Poids, Séries, Reps | 🔄 Sur demande |
| **Autre** | Personnalisable | Adaptable | 🔄 Sur demande |

### Plans d'Abonnement

| Plan | Prix | Coaches | Athletes | Fonctionnalités |
|------|------|---------|----------|-----------------|
| **Solo** | 19€/mois | 1 | 20 | 1 Sport, Builder, Planning, PDF |
| **Standard** | 49€/mois | 3 | 100 | 2 Sports, + Teams, Analytics basiques |
| **Performance** | 99€/mois | Illimité | Illimité | Tous Sports, + Analytics avancés, Support prioritaire |

---

## 🏗️ PHASE 1 : Architecture & Base de Données

### 1.1 Nouveau Schéma Prisma

**Fichier** : `prisma/schema.prisma`

```prisma
// ============================================
// CLUB (Organisation)
// ============================================
model Club {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique // pour URLs custom
  sports      String[] @default(["running"]) // ["running", "swimming", "cycling"]
  logoUrl     String?

  // Subscription
  stripeCustomerId       String?  @unique
  stripeSubscriptionId   String?  @unique
  subscriptionPlan       String   @default("solo") // solo, standard, performance
  subscriptionStatus     String   @default("trialing") // trialing, active, canceled, past_due
  trialEndsAt           DateTime?
  subscriptionEndsAt    DateTime?

  // Limites selon le plan
  maxCoaches    Int      @default(1)
  maxAthletes   Int      @default(20)

  // Relations
  teams         Team[]
  memberships   ClubMembership[]
  sessions      TrainingSession[]
  events        Event[]
  invitations   Invitation[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([slug])
  @@index([stripeCustomerId])
  @@map("clubs")
}

// ============================================
// CLUB MEMBERSHIP (Utilisateurs du club)
// ============================================
model ClubMembership {
  id          String   @id @default(uuid())
  clubId      String
  club        Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)

  userId      String   // Clerk user ID
  email       String

  role        String   @default("athlete") // club_admin, coach, athlete
  status      String   @default("active") // active, suspended

  // Métadonnées utilisateur
  firstName   String?
  lastName    String?

  // Facteurs d'intensité par sport (JSON flexible)
  // Exemple: { "running": { "vma": 16.5 }, "cycling": { "ftp": 250 } }
  performanceFactors Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  teamMemberships TeamMembership[]

  @@unique([clubId, userId])
  @@index([userId])
  @@index([clubId, role])
  @@map("club_memberships")
}

// ============================================
// TEAM (Groupe d'entraînement)
// ============================================
model Team {
  id          String   @id @default(uuid())
  clubId      String
  club        Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)

  name        String
  description String?
  color       String?  // Pour le calendrier
  sport       String   @default("running") // Sport principal de cette team

  coachId     String   // Clerk user ID du coach responsable

  // Relations
  memberships TeamMembership[]
  sessions    TrainingSessionAssignment[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([clubId])
  @@index([coachId])
  @@map("teams")
}

// ============================================
// TEAM MEMBERSHIP (Athlètes dans une team)
// ============================================
model TeamMembership {
  id              String   @id @default(uuid())
  teamId          String
  team            Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  membershipId    String
  membership      ClubMembership @relation(fields: [membershipId], references: [id], onDelete: Cascade)

  joinedAt        DateTime @default(now())

  @@unique([teamId, membershipId])
  @@index([teamId])
  @@index([membershipId])
  @@map("team_memberships")
}

// ============================================
// TRAINING SESSION (Mise à jour)
// ============================================
model TrainingSession {
  id              String   @id @default(uuid())
  clubId          String
  club            Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)

  name            String
  description     String?
  sport           String   @default("running") // Sport de cette séance

  // Configuration du builder (structure flexible selon le sport)
  builderConfig   Json     // Contient: facteur d'intensité, étapes, calculs

  pdfUrl          String?
  pdfKey          String?

  // Métriques calculées (varient selon le sport)
  totalMetrics    Json     // Ex: { distance: 5000, time: 1200 } ou { sets: 5, reps: 10 }

  sessionDate     DateTime?

  createdById     String   // Clerk user ID

  // Assignation
  assignToAllClub Boolean  @default(false)
  teams           TrainingSessionAssignment[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([clubId])
  @@index([sessionDate])
  @@index([createdById])
  @@map("training_sessions")
}

// ============================================
// TRAINING SESSION ASSIGNMENT
// ============================================
model TrainingSessionAssignment {
  id          String   @id @default(uuid())
  sessionId   String
  session     TrainingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  teamId      String
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([sessionId, teamId])
  @@index([sessionId])
  @@index([teamId])
  @@map("training_session_assignments")
}

// ============================================
// EVENT (Mise à jour)
// ============================================
model Event {
  id          String   @id @default(uuid())
  clubId      String
  club        Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)

  title       String
  description String?
  eventDate   DateTime
  type        String   @default("race")

  createdById String   // Clerk user ID

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([clubId])
  @@index([eventDate])
  @@map("events")
}

// ============================================
// INVITATION (Coaches & Athletes)
// ============================================
model Invitation {
  id          String   @id @default(uuid())
  clubId      String
  club        Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)

  email       String
  role        String   // coach, athlete
  teamId      String?  // Si invitation à une team spécifique

  token       String   @unique
  status      String   @default("pending") // pending, accepted, expired

  invitedBy   String   // Clerk user ID
  expiresAt   DateTime
  acceptedAt  DateTime?

  createdAt   DateTime @default(now())

  @@index([clubId])
  @@index([token])
  @@index([email])
  @@map("invitations")
}
```

### 1.2 Commandes de Migration

```bash
# Créer la migration
npx prisma migrate dev --name add_multitenant_structure

# Générer le client
npx prisma generate

# (Optionnel) Reset complet pour développement
npx prisma migrate reset
```

---

## 🎨 PHASE 2 : Landing Page & Marketing

### 2.1 Structure des Pages

```
/                          → Landing page (publique)
/pricing                   → Plans & pricing
/features                  → Fonctionnalités détaillées
/about                     → À propos
/contact                   → Contact
/legal/terms               → CGU
/legal/privacy             → Politique de confidentialité

/app/*                     → Application (authentifiée)
```

### 2.2 Landing Page Components

**Fichier** : `src/app/(marketing)/page.tsx`

```tsx
// Structure recommandée :
<HeroSection />
  - Titre accrocheur : "Planifiez vos entraînements, quel que soit votre sport"
  - Sous-titre : "Running, natation, cyclisme, athlétisme... PlaniTeam s'adapte à votre discipline"
  - CTA "Commencer l'essai gratuit"
  - Illustration / Screenshot du builder

<MultiSportsShowcase />
  - Carrousel montrant les différents sports supportés
  - Badges des sports disponibles
  - "Votre sport n'est pas listé ? Contactez-nous !"

<FeaturesGrid />
  - Builder d'entraînements visuels adaptatifs
  - Facteurs d'intensité personnalisés par athlète
  - Calendrier interactif multi-équipes
  - Génération PDF automatique
  - Gestion de clubs multi-sports

<PricingPreview />
  - 3 plans en aperçu
  - Mention des sports inclus par plan
  - Lien vers /pricing

<TestimonialsSection />
  - 2-3 témoignages de clubs de sports variés

<CTASection />
  - Appel à l'action final
  - "Essayer gratuitement pendant 14 jours"
  - "Aucune carte bancaire requise"

<Footer />
  - Liens légaux
  - Réseaux sociaux
  - Contact pour nouveaux sports
```

### 2.3 Page Pricing

**Fichier** : `src/app/(marketing)/pricing/page.tsx`

```tsx
<PricingCards>
  {plans.map(plan => (
    <PricingCard key={plan.id}>
      <PlanName>{plan.name}</PlanName>
      <Price>{plan.price}€/mois</Price>
      <Features>
        - {plan.maxCoaches} coach(es)
        - {plan.maxAthletes} athlètes
        - Builder & Planning
        - {plan.features.map(...)}
      </Features>
      <CTAButton href="/onboarding/club">
        Choisir {plan.name}
      </CTAButton>
    </PricingCard>
  ))}
</PricingCards>

<FAQ />
  - Questions fréquentes sur les plans
  - Politique d'annulation
  - Personnalisation entreprise
```

### 2.4 SEO Configuration

**Fichier** : `src/app/layout.tsx`

```tsx
export const metadata: Metadata = {
  title: 'PlaniTeam - Plateforme de Gestion d\'Entraînements Multi-Sports',
  description: 'Créez, planifiez et partagez vos entraînements pour tous les sports. Builders adaptés, facteurs d\'intensité personnalisés, gestion de clubs sportifs.',
  keywords: ['entraînement', 'sport', 'club', 'coaching', 'running', 'natation', 'cyclisme', 'athlétisme', 'planification'],
  openGraph: {
    title: 'PlaniTeam - Gestion d\'Entraînements Multi-Sports',
    description: 'La plateforme tout-en-un pour gérer les entraînements de votre club sportif',
    images: ['/og-image.png'],
  },
};
```

**Fichier** : `src/app/sitemap.ts`

```tsx
export default function sitemap() {
  return [
    { url: 'https://planiteam.fr', lastModified: new Date() },
    { url: 'https://planiteam.fr/pricing', lastModified: new Date() },
    { url: 'https://planiteam.fr/features', lastModified: new Date() },
    { url: 'https://planiteam.fr/sports', lastModified: new Date() },
    // ...
  ];
}
```

---

## 💳 PHASE 3 : Intégration Stripe

### 3.1 Configuration Stripe

**Variables d'environnement** : `.env`

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Installation** :

```bash
npm install stripe @stripe/stripe-js
```

### 3.2 Configuration des Produits Stripe

**Dashboard Stripe** :

1. Créer 3 produits :
   - **Solo** : 19€/mois récurrent
   - **Standard** : 49€/mois récurrent
   - **Performance** : 99€/mois récurrent

2. Activer un essai gratuit de 14 jours

3. Configurer les webhooks :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### 3.3 API Route Checkout

**Fichier** : `src/app/api/stripe/checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { priceId, clubId } = await req.json();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      client_reference_id: clubId, // Pour lier au club
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          clubId,
          userId,
        },
      },
      metadata: {
        clubId,
        userId,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### 3.4 API Route Webhooks

**Fichier** : `src/app/api/webhooks/stripe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clubId = session.metadata?.clubId;
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!clubId) return;

  // Récupérer les détails de la subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  // Déterminer le plan
  let plan = 'solo';
  if (priceId === process.env.STRIPE_PRICE_STANDARD) plan = 'standard';
  if (priceId === process.env.STRIPE_PRICE_PERFORMANCE) plan = 'performance';

  // Mettre à jour le club
  await prisma.club.update({
    where: { id: clubId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionPlan: plan,
      subscriptionStatus: 'trialing',
      trialEndsAt: new Date(subscription.trial_end! * 1000),
    },
  });

  // TODO: Envoyer email de confirmation
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const clubId = subscription.metadata.clubId;

  if (!clubId) return;

  await prisma.club.update({
    where: { id: clubId },
    data: {
      subscriptionStatus: subscription.status,
      subscriptionEndsAt: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const clubId = subscription.metadata.clubId;

  if (!clubId) return;

  await prisma.club.update({
    where: { id: clubId },
    data: {
      subscriptionStatus: 'canceled',
    },
  });

  // TODO: Notifier le club admin
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const club = await prisma.club.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!club) return;

  // TODO: Envoyer email de relance de paiement
}
```

### 3.5 Customer Portal

**Fichier** : `src/app/api/stripe/portal/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserClub } from '@/lib/club';
import { auth } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const club = await getUserClub(userId);

    if (!club || !club.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: club.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/club/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
```

### 3.6 Feature Gates

**Fichier** : `src/lib/subscription.ts`

```typescript
export const PLAN_LIMITS = {
  solo: {
    maxCoaches: 1,
    maxAthletes: 20,
    maxSports: 1,
    features: ['builder', 'planning', 'pdf', 'single_sport'],
  },
  standard: {
    maxCoaches: 3,
    maxAthletes: 100,
    maxSports: 2,
    features: ['builder', 'planning', 'pdf', 'teams', 'analytics_basic', 'multi_sports'],
  },
  performance: {
    maxCoaches: 999,
    maxAthletes: 9999,
    maxSports: 999,
    features: [
      'builder',
      'planning',
      'pdf',
      'teams',
      'analytics_advanced',
      'all_sports',
      'priority_support',
      'custom_builder_request'
    ],
  },
};

export function canUseFeature(club: Club, feature: string): boolean {
  const plan = PLAN_LIMITS[club.subscriptionPlan];
  return plan?.features.includes(feature) || false;
}

export function hasReachedLimit(club: Club, type: 'coaches' | 'athletes', current: number): boolean {
  const plan = PLAN_LIMITS[club.subscriptionPlan];
  const limit = type === 'coaches' ? plan.maxCoaches : plan.maxAthletes;
  return current >= limit;
}
```

---

## 🎯 PHASE 4 : Onboarding Club

### 4.1 Flow Onboarding

**Route** : `/onboarding/club`

**Étapes** :

1. **Informations du club**
   - Nom du club
   - Sport (running, cyclisme, triathlon...)
   - Logo (upload)

2. **Informations du responsable**
   - Prénom / Nom
   - Email (pré-rempli via Clerk)
   - Téléphone

3. **Choix du plan**
   - Affichage des 3 plans
   - Sélection du plan

4. **Paiement Stripe**
   - Redirection vers Stripe Checkout
   - 14 jours d'essai gratuit

5. **Configuration initiale**
   - Création du premier groupe
   - Invitation des premiers membres

### 4.2 Component Wizard

**Fichier** : `src/components/onboarding/club-wizard.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClubInfoStep } from './steps/club-info-step';
import { SportSelectionStep } from './steps/sport-selection-step';
import { AdminInfoStep } from './steps/admin-info-step';
import { PlanSelectionStep } from './steps/plan-selection-step';
import { CheckoutStep } from './steps/checkout-step';

export function ClubWizard() {
  const [step, setStep] = useState(1);
  const [clubData, setClubData] = useState({
    name: '',
    sports: ['running'], // Multi-sports support
    logoUrl: '',
    adminFirstName: '',
    adminLastName: '',
    adminPhone: '',
    selectedPlan: 'standard',
  });

  const router = useRouter();

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = async () => {
    // 1. Créer le club dans la BDD
    const res = await fetch('/api/clubs', {
      method: 'POST',
      body: JSON.stringify(clubData),
    });
    const { clubId } = await res.json();

    // 2. Créer la session Stripe
    const checkoutRes = await fetch('/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({
        priceId: getPriceId(clubData.selectedPlan),
        clubId,
      }),
    });
    const { sessionId } = await checkoutRes.json();

    // 3. Rediriger vers Stripe
    const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    await stripe?.redirectToCheckout({ sessionId });
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      {/* Progress Indicator */}
      <StepIndicator currentStep={step} totalSteps={4} />

      {/* Step Content */}
      {step === 1 && (
        <ClubInfoStep
          data={clubData}
          onUpdate={setClubData}
          onNext={nextStep}
        />
      )}
      {step === 2 && (
        <SportSelectionStep
          selectedSports={clubData.sports}
          onUpdate={(sports) => setClubData({ ...clubData, sports })}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {step === 3 && (
        <AdminInfoStep
          data={clubData}
          onUpdate={setClubData}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {step === 4 && (
        <PlanSelectionStep
          selectedPlan={clubData.selectedPlan}
          selectedSports={clubData.sports}
          onSelect={(plan) => setClubData({ ...clubData, selectedPlan: plan })}
          onNext={nextStep}
          onBack={prevStep}
        />
      )}
      {step === 5 && (
        <CheckoutStep
          clubData={clubData}
          onConfirm={handleComplete}
          onBack={prevStep}
        />
      )}
    </div>
  );
}
```

### 4.3 API Route Club Creation

**Fichier** : `src/app/api/clubs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();

  try {
    // 1. Créer le club
    const club = await prisma.club.create({
      data: {
        name: data.name,
        slug: generateSlug(data.name),
        sports: data.sports, // Array de sports
        logoUrl: data.logoUrl,
        subscriptionPlan: data.selectedPlan,
        subscriptionStatus: 'trialing',
      },
    });

    // 2. Créer le membership club_admin
    await prisma.clubMembership.create({
      data: {
        clubId: club.id,
        userId,
        email: data.adminEmail,
        role: 'club_admin',
        status: 'active',
        firstName: data.adminFirstName,
        lastName: data.adminLastName,
      },
    });

    // 3. Mettre à jour les métadonnées Clerk
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        clubId: club.id,
        role: 'club_admin',
      },
    });

    return NextResponse.json({ clubId: club.id });
  } catch (error) {
    console.error('Club creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create club' },
      { status: 500 }
    );
  }
}
```

### 4.4 Page de Succès

**Fichier** : `src/app/onboarding/success/page.tsx`

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function OnboardingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Vérifier le statut du paiement
    if (sessionId) {
      fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Rediriger vers le dashboard après 3s
            setTimeout(() => {
              router.push('/club/dashboard');
            }, 3000);
          }
        });
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">
          Bienvenue dans PlaniTeam ! 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          Votre club a été créé avec succès. Vous bénéficiez de 14 jours
          d'essai gratuit pour découvrir toutes nos fonctionnalités de planification d'entraînements.
        </p>
        <p className="text-sm text-gray-500">
          Redirection vers votre dashboard...
        </p>
      </div>
    </div>
  );
}
```

---

## 👥 PHASE 5 : Dashboard Club Admin

### 5.1 Layout Club

**Fichier** : `src/app/club/layout.tsx`

```tsx
import { redirect } from 'next/navigation';
import { getUserClub, requireClubAdmin } from '@/lib/club';
import { ClubSidebar } from '@/components/club/club-sidebar';
import { SubscriptionBanner } from '@/components/club/subscription-banner';

export default async function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireClubAdmin(); // Guard

  const club = await getUserClub();

  if (!club) {
    redirect('/onboarding/club');
  }

  return (
    <div className="flex h-screen">
      <ClubSidebar club={club} />
      <div className="flex-1 overflow-y-auto">
        {/* Banner si subscription expire bientôt */}
        {club.subscriptionStatus === 'past_due' && (
          <SubscriptionBanner club={club} />
        )}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
```

### 5.2 Dashboard Page

**Fichier** : `src/app/club/dashboard/page.tsx`

```tsx
import { getUserClub } from '@/lib/club';
import { prisma } from '@/lib/prisma';
import { StatsCards } from '@/components/club/stats-cards';
import { RecentActivity } from '@/components/club/recent-activity';
import { QuickActions } from '@/components/club/quick-actions';

export default async function ClubDashboardPage() {
  const club = await getUserClub();

  // Stats
  const [coachesCount, athletesCount, sessionsCount] = await Promise.all([
    prisma.clubMembership.count({
      where: { clubId: club!.id, role: 'coach' },
    }),
    prisma.clubMembership.count({
      where: { clubId: club!.id, role: 'athlete' },
    }),
    prisma.trainingSession.count({
      where: { clubId: club!.id },
    }),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Tableau de bord - {club!.name}
      </h1>

      <StatsCards
        coaches={coachesCount}
        athletes={athletesCount}
        sessions={sessionsCount}
        plan={club!.subscriptionPlan}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <QuickActions />
        <RecentActivity clubId={club!.id} />
      </div>
    </div>
  );
}
```

### 5.3 Gestion du Staff

**Fichier** : `src/app/club/staff/page.tsx`

```tsx
import { getUserClub } from '@/lib/club';
import { prisma } from '@/lib/prisma';
import { StaffTable } from '@/components/club/staff-table';
import { InviteCoachButton } from '@/components/club/invite-coach-button';

export default async function ClubStaffPage() {
  const club = await getUserClub();

  const staff = await prisma.clubMembership.findMany({
    where: {
      clubId: club!.id,
      role: { in: ['club_admin', 'coach'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  const pendingInvitations = await prisma.invitation.findMany({
    where: {
      clubId: club!.id,
      role: 'coach',
      status: 'pending',
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion du Staff</h1>
        <InviteCoachButton club={club!} />
      </div>

      <StaffTable staff={staff} club={club!} />

      {pendingInvitations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Invitations en attente</h2>
          <InvitationsTable invitations={pendingInvitations} />
        </div>
      )}
    </div>
  );
}
```

### 5.4 Système d'Invitation Coach

**Fichier** : `src/components/club/invite-coach-dialog.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inviteCoach } from '@/actions/invitations';
import { toast } from 'sonner';

export function InviteCoachDialog({ club, open, onOpenChange }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInvite = async () => {
    setLoading(true);
    try {
      await inviteCoach(club.id, email);
      toast.success('Invitation envoyée !');
      setEmail('');
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un coach</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email du coach
            </label>
            <Input
              type="email"
              placeholder="coach@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={handleInvite}
            disabled={!email || loading}
            className="w-full"
          >
            {loading ? 'Envoi...' : 'Envoyer l\'invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Fichier** : `src/actions/invitations.ts`

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { sendInvitationEmail } from './email';

export async function inviteCoach(clubId: string, email: string) {
  // 1. Vérifier que le club n'a pas atteint sa limite
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) throw new Error('Club not found');

  const currentCoaches = await prisma.clubMembership.count({
    where: { clubId, role: 'coach' },
  });

  if (currentCoaches >= club.maxCoaches) {
    throw new Error('Limite de coaches atteinte pour ce plan');
  }

  // 2. Créer l'invitation
  const token = nanoid(32);
  const invitation = await prisma.invitation.create({
    data: {
      clubId,
      email,
      role: 'coach',
      token,
      status: 'pending',
      invitedBy: 'userId', // TODO: récupérer depuis auth
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    },
  });

  // 3. Envoyer l'email
  await sendInvitationEmail({
    to: email,
    clubName: club.name,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`,
  });

  return invitation;
}
```

### 5.5 Page de Gestion de l'Abonnement

**Fichier** : `src/app/club/billing/page.tsx`

```tsx
import { getUserClub } from '@/lib/club';
import { Button } from '@/components/ui/button';
import { SubscriptionCard } from '@/components/club/subscription-card';
import { BillingHistory } from '@/components/club/billing-history';

export default async function ClubBillingPage() {
  const club = await getUserClub();

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Facturation & Abonnement</h1>

      <SubscriptionCard club={club!} />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Historique des paiements</h2>
        <BillingHistory clubId={club!.id} />
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Gérer votre abonnement</h3>
        <p className="text-sm text-gray-600 mb-4">
          Modifiez votre plan, mettez à jour vos informations de paiement ou
          annulez votre abonnement via le portail client Stripe.
        </p>
        <form action="/api/stripe/portal" method="POST">
          <Button type="submit">
            Accéder au portail de gestion
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

## 🏋️ PHASE 6 : Espace Coach

### 6.1 Dashboard Coach

**Fichier** : `src/app/coach/dashboard/page.tsx`

```tsx
import { requireCoach } from '@/lib/club';
import { prisma } from '@/lib/prisma';
import { MyTeamsGrid } from '@/components/coach/my-teams-grid';
import { RecentSessions } from '@/components/coach/recent-sessions';

export default async function CoachDashboardPage() {
  const { userId, clubId } = await requireCoach();

  const teams = await prisma.team.findMany({
    where: {
      clubId,
      coachId: userId,
    },
    include: {
      _count: {
        select: { memberships: true },
      },
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Mes Groupes</h1>

      <MyTeamsGrid teams={teams} />

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Séances récentes</h2>
        <RecentSessions coachId={userId} />
      </div>
    </div>
  );
}
```

### 6.2 CRUD Teams

**Fichier** : `src/app/coach/teams/page.tsx`

```tsx
import { requireCoach } from '@/lib/club';
import { prisma } from '@/lib/prisma';
import { TeamsTable } from '@/components/coach/teams-table';
import { CreateTeamButton } from '@/components/coach/create-team-button';

export default async function CoachTeamsPage() {
  const { userId, clubId } = await requireCoach();

  const teams = await prisma.team.findMany({
    where: {
      clubId,
      coachId: userId,
    },
    include: {
      _count: {
        select: { memberships: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mes Groupes d'Entraînement</h1>
        <CreateTeamButton />
      </div>

      <TeamsTable teams={teams} />
    </div>
  );
}
```

**Actions** : `src/actions/teams.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireCoach } from '@/lib/club';

export async function createTeam(data: { name: string; description?: string; color?: string }) {
  const { userId, clubId } = await requireCoach();

  const team = await prisma.team.create({
    data: {
      clubId,
      coachId: userId,
      name: data.name,
      description: data.description,
      color: data.color || '#3b82f6',
    },
  });

  revalidatePath('/coach/teams');
  return team;
}

export async function updateTeam(teamId: string, data: Partial<Team>) {
  const { userId } = await requireCoach();

  // Vérifier que le coach est propriétaire
  const team = await prisma.team.findFirst({
    where: { id: teamId, coachId: userId },
  });

  if (!team) {
    throw new Error('Unauthorized');
  }

  const updated = await prisma.team.update({
    where: { id: teamId },
    data,
  });

  revalidatePath('/coach/teams');
  return updated;
}

export async function deleteTeam(teamId: string) {
  const { userId } = await requireCoach();

  const team = await prisma.team.findFirst({
    where: { id: teamId, coachId: userId },
  });

  if (!team) {
    throw new Error('Unauthorized');
  }

  await prisma.team.delete({ where: { id: teamId } });

  revalidatePath('/coach/teams');
}
```

### 6.3 Invitation Athlètes

**Fichier** : `src/components/coach/invite-athlete-dialog.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateInviteLink } from '@/actions/invitations';
import { toast } from 'sonner';
import { Copy, Mail } from 'lucide-react';

export function InviteAthleteDialog({ team, open, onOpenChange }) {
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const link = await generateInviteLink(team.id, 'athlete');
      setInviteLink(link);
      toast.success('Lien d\'invitation généré !');
    } catch (error) {
      toast.error('Erreur lors de la génération du lien');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Lien copié !');
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      await sendAthleteInvitation(team.id, email);
      toast.success('Invitation envoyée !');
      setEmail('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Inviter des athlètes - {team.name}
        </h2>

        {/* Méthode 1 : Lien unique */}
        <div className="space-y-3 pb-6 border-b">
          <h3 className="font-medium text-sm">Option 1 : Lien d'invitation</h3>
          <p className="text-sm text-gray-600">
            Générez un lien unique à partager avec vos athlètes.
          </p>
          {inviteLink ? (
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly />
              <Button size="icon" onClick={handleCopyLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={handleGenerateLink} disabled={loading}>
              Générer le lien
            </Button>
          )}
        </div>

        {/* Méthode 2 : Email direct */}
        <div className="space-y-3 pt-6">
          <h3 className="font-medium text-sm">Option 2 : Invitation par email</h3>
          <Input
            type="email"
            placeholder="athlete@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            onClick={handleSendEmail}
            disabled={!email || loading}
            className="w-full"
          >
            <Mail className="w-4 h-4 mr-2" />
            Envoyer l'invitation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 6.4 Gestion des Membres

**Fichier** : `src/app/coach/teams/[id]/members/page.tsx`

```tsx
import { requireCoach } from '@/lib/club';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { MembersTable } from '@/components/coach/members-table';
import { InviteAthleteButton } from '@/components/coach/invite-athlete-button';

export default async function TeamMembersPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId, clubId } = await requireCoach();

  const team = await prisma.team.findFirst({
    where: {
      id: params.id,
      clubId,
      coachId: userId,
    },
    include: {
      memberships: {
        include: {
          membership: true,
        },
        orderBy: {
          joinedAt: 'desc',
        },
      },
    },
  });

  if (!team) {
    notFound();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-gray-600 mt-2">
            {team.memberships.length} membre(s)
          </p>
        </div>
        <InviteAthleteButton team={team} />
      </div>

      <MembersTable members={team.memberships} teamId={team.id} />
    </div>
  );
}
```

---

## 🔐 PHASE 7 : Multi-Tenancy dans l'App

### 7.1 Middleware de Contexte Club

**Fichier** : `src/lib/club.ts`

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';
import { redirect } from 'next/navigation';

export async function getUserClub() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const membership = await prisma.clubMembership.findFirst({
    where: { userId },
    include: { club: true },
  });

  return membership?.club || null;
}

export async function requireClubMembership() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const membership = await prisma.clubMembership.findFirst({
    where: { userId, status: 'active' },
    include: {
      club: true,
      teamMemberships: {
        include: { team: true },
      },
    },
  });

  if (!membership) {
    redirect('/onboarding/club');
  }

  return {
    userId,
    clubId: membership.clubId,
    club: membership.club,
    role: membership.role,
    teams: membership.teamMemberships.map((tm) => tm.team),
  };
}

export async function requireClubAdmin() {
  const context = await requireClubMembership();

  if (context.role !== 'club_admin') {
    throw new Error('Unauthorized: Club admin required');
  }

  return context;
}

export async function requireCoach() {
  const context = await requireClubMembership();

  if (!['club_admin', 'coach'].includes(context.role)) {
    throw new Error('Unauthorized: Coach required');
  }

  return context;
}

export async function requireAthlete() {
  const context = await requireClubMembership();

  if (context.club.subscriptionStatus !== 'active' && context.club.subscriptionStatus !== 'trialing') {
    redirect('/club/billing');
  }

  return context;
}
```

### 7.2 Mise à jour getUserMetadata

**Fichier** : `src/lib/auth.ts`

```typescript
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './prisma';

export type UserRole = 'club_admin' | 'coach' | 'athlete';

export interface UserContext {
  userId: string;
  clubId: string | null;
  role: UserRole;
  teamIds: string[];
  vma: number | null;
}

export async function getUserContext(): Promise<UserContext | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const membership = await prisma.clubMembership.findFirst({
    where: { userId },
    include: {
      teamMemberships: true,
    },
  });

  if (!membership) {
    return {
      userId,
      clubId: null,
      role: 'athlete',
      teamIds: [],
      vma: null,
    };
  }

  return {
    userId,
    clubId: membership.clubId,
    role: membership.role as UserRole,
    teamIds: membership.teamMemberships.map((tm) => tm.teamId),
    vma: membership.vma,
  };
}
```

### 7.3 Mise à jour Actions training-sessions.ts

**Fichier** : `src/actions/training-sessions.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireClubMembership, requireCoach } from '@/lib/club';

export async function getSessions(filters?: {
  startDate?: Date;
  endDate?: Date;
  teamIds?: string[];
}) {
  const context = await requireClubMembership();

  const where: any = {
    clubId: context.clubId,
  };

  // Filtrage par dates
  if (filters?.startDate || filters?.endDate) {
    where.sessionDate = {};
    if (filters.startDate) where.sessionDate.gte = filters.startDate;
    if (filters.endDate) where.sessionDate.lte = filters.endDate;
  }

  // Filtrage par teams
  if (context.role === 'athlete') {
    // Athlète : voir uniquement ses séances
    where.OR = [
      { assignToAllClub: true },
      {
        teams: {
          some: {
            teamId: { in: context.teams.map((t) => t.id) },
          },
        },
      },
    ];
  } else if (filters?.teamIds && filters.teamIds.length > 0) {
    // Coach : filtrage optionnel par teams
    where.teams = {
      some: {
        teamId: { in: filters.teamIds },
      },
    };
  }

  const sessions = await prisma.trainingSession.findMany({
    where,
    include: {
      teams: {
        include: {
          team: true,
        },
      },
    },
    orderBy: { sessionDate: 'desc' },
  });

  return sessions;
}

export async function createSession(data: {
  name: string;
  description?: string;
  sport: string;
  builderConfig: any; // Configuration flexible selon le sport
  totalMetrics: any;  // Métriques calculées flexibles
  sessionDate?: Date;
  assignToAllClub?: boolean;
  teamIds?: string[];
}) {
  const context = await requireCoach();

  // Vérifier que le sport est autorisé pour ce club
  const club = await prisma.club.findUnique({ where: { id: context.clubId } });
  if (!club?.sports.includes(data.sport)) {
    throw new Error(`Sport ${data.sport} non autorisé pour ce club`);
  }

  // Créer la session
  const session = await prisma.trainingSession.create({
    data: {
      clubId: context.clubId,
      createdById: context.userId,
      name: data.name,
      description: data.description,
      sport: data.sport,
      builderConfig: data.builderConfig,
      totalMetrics: data.totalMetrics,
      sessionDate: data.sessionDate,
      assignToAllClub: data.assignToAllClub || false,
    },
  });

  // Créer les assignations aux teams
  if (data.teamIds && data.teamIds.length > 0 && !data.assignToAllClub) {
    await prisma.trainingSessionAssignment.createMany({
      data: data.teamIds.map((teamId) => ({
        sessionId: session.id,
        teamId,
      })),
    });
  }

  revalidatePath('/training');
  revalidatePath('/planning');

  return session;
}

export async function updateSession(
  sessionId: string,
  data: Partial<TrainingSession>
) {
  const context = await requireCoach();

  // Vérifier que la session appartient au club
  const session = await prisma.trainingSession.findFirst({
    where: {
      id: sessionId,
      clubId: context.clubId,
    },
  });

  if (!session) {
    throw new Error('Session not found or unauthorized');
  }

  const updated = await prisma.trainingSession.update({
    where: { id: sessionId },
    data,
  });

  revalidatePath('/planning');
  revalidatePath('/sessions');

  return updated;
}

export async function deleteSession(sessionId: string) {
  const context = await requireCoach();

  const session = await prisma.trainingSession.findFirst({
    where: {
      id: sessionId,
      clubId: context.clubId,
    },
  });

  if (!session) {
    throw new Error('Unauthorized');
  }

  await prisma.trainingSession.delete({
    where: { id: sessionId },
  });

  revalidatePath('/planning');
  revalidatePath('/sessions');
}
```

### 7.4 Mise à jour Actions events.ts

**Fichier** : `src/actions/events.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireCoach, requireClubMembership } from '@/lib/club';

export async function getEvents(filters?: { startDate?: Date; endDate?: Date }) {
  const context = await requireClubMembership();

  const where: any = {
    clubId: context.clubId,
  };

  if (filters?.startDate || filters?.endDate) {
    where.eventDate = {};
    if (filters.startDate) where.eventDate.gte = filters.startDate;
    if (filters.endDate) where.eventDate.lte = filters.endDate;
  }

  return prisma.event.findMany({
    where,
    orderBy: { eventDate: 'asc' },
  });
}

export async function createEvent(data: {
  title: string;
  description?: string;
  eventDate: Date;
  type: string;
}) {
  const context = await requireCoach();

  const event = await prisma.event.create({
    data: {
      clubId: context.clubId,
      createdById: context.userId,
      ...data,
    },
  });

  revalidatePath('/planning');

  return event;
}

export async function deleteEvent(eventId: string) {
  const context = await requireCoach();

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      clubId: context.clubId,
    },
  });

  if (!event) {
    throw new Error('Unauthorized');
  }

  await prisma.event.delete({
    where: { id: eventId },
  });

  revalidatePath('/planning');
}
```

---

## 📅 PHASE 8 : Planification & Assignation

### 8.1 Mise à jour du Builder avec Assignation

**Fichier** : `src/components/training/training-form.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { createSession } from '@/actions/training-sessions';
import { toast } from 'sonner';

export function TrainingForm({
  teams,
  club,
  performanceFactors
}: {
  teams: Team[];
  club: Club;
  performanceFactors: any; // Facteurs de performance de l'athlète
}) {
  const [assignToAllClub, setAssignToAllClub] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedSport, setSelectedSport] = useState(club.sports[0]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sessionDate: new Date(),
    builderConfig: {},
    // ...
  });

  const router = useRouter();

  const handleSubmit = async () => {
    try {
      await createSession({
        ...formData,
        sport: selectedSport,
        assignToAllClub,
        teamIds: assignToAllClub ? [] : selectedTeams,
      });

      toast.success('Séance créée avec succès !');
      router.push('/planning');
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      {/* Sélection du sport */}
      <div className="mb-6">
        <Label>Sport</Label>
        <Select value={selectedSport} onValueChange={setSelectedSport}>
          {club.sports.map((sport) => (
            <option key={sport} value={sport}>
              {sport.charAt(0).toUpperCase() + sport.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      {/* Builder adaptatif selon le sport sélectionné */}
      {selectedSport === 'running' && (
        <RunningBuilder
          performanceFactor={performanceFactors?.running?.vma}
          onChange={(config) => setFormData({ ...formData, builderConfig: config })}
        />
      )}
      {selectedSport === 'swimming' && (
        <SwimmingBuilder
          performanceFactor={performanceFactors?.swimming?.pace100m}
          onChange={(config) => setFormData({ ...formData, builderConfig: config })}
        />
      )}
      {selectedSport === 'cycling' && (
        <CyclingBuilder
          performanceFactor={performanceFactors?.cycling?.ftp}
          onChange={(config) => setFormData({ ...formData, builderConfig: config })}
        />
      )}

      {/* Section Assignation */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-4">Assignation</h3>

        <div className="space-y-4">
          {/* Option 1 : Tout le club */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="all-club"
              checked={assignToAllClub}
              onCheckedChange={(checked) => {
                setAssignToAllClub(checked as boolean);
                if (checked) setSelectedTeams([]);
              }}
            />
            <Label htmlFor="all-club">
              Assigner à tout le club
            </Label>
          </div>

          {/* Option 2 : Groupes spécifiques */}
          {!assignToAllClub && (
            <div className="pl-6 space-y-2">
              <p className="text-sm text-gray-600 mb-2">
                Ou sélectionner des groupes :
              </p>
              {teams.map((team) => (
                <div key={team.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`team-${team.id}`}
                    checked={selectedTeams.includes(team.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTeams([...selectedTeams, team.id]);
                      } else {
                        setSelectedTeams(selectedTeams.filter((id) => id !== team.id));
                      }
                    }}
                  />
                  <Label htmlFor={`team-${team.id}`}>
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: team.color }}
                    />
                    {team.name}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        {!assignToAllClub && selectedTeams.length === 0 && (
          <p className="text-sm text-amber-600 mt-4">
            ⚠️ Aucun groupe sélectionné. La séance ne sera visible par personne.
          </p>
        )}
      </div>

      <button type="submit" className="mt-8">
        Sauvegarder la séance
      </button>
    </form>
  );
}
```

### 8.2 Mise à jour du Calendrier

**Fichier** : `src/components/planning/calendar.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { getSessions } from '@/actions/training-sessions';

export function Calendar({ userContext }: { userContext: UserContext }) {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const data = await getSessions({
      startDate: startOfMonth(currentMonth),
      endDate: endOfMonth(currentMonth),
    });
    setSessions(data);
  };

  return (
    <div className="calendar-grid">
      {/* ... Grid du calendrier ... */}

      {/* Affichage des séances par jour */}
      {days.map((day) => {
        const daySessions = sessions.filter(
          (s) => isSameDay(new Date(s.sessionDate), day)
        );

        return (
          <div key={day.toString()} className="calendar-day">
            <div className="day-number">{format(day, 'd')}</div>

            {/* Indicateurs de séances */}
            <div className="sessions-indicators">
              {daySessions.map((session) => (
                <div
                  key={session.id}
                  className="session-indicator"
                  style={{
                    backgroundColor: session.assignToAllClub
                      ? '#3b82f6'
                      : session.teams[0]?.team.color || '#gray',
                  }}
                  onClick={() => openSessionDrawer(session)}
                >
                  <span className="truncate">{session.name}</span>
                  {!session.assignToAllClub && (
                    <span className="text-xs">
                      {session.teams.map((t) => t.team.name).join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### 8.3 Filtres Coach dans /sessions

**Fichier** : `src/app/sessions/page.tsx`

```tsx
import { requireCoach } from '@/lib/club';
import { prisma } from '@/lib/prisma';
import { SessionsTable } from '@/components/sessions/sessions-table';
import { TeamFilter } from '@/components/sessions/team-filter';

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: { teamIds?: string };
}) {
  const context = await requireCoach();

  const teamIds = searchParams.teamIds
    ? searchParams.teamIds.split(',')
    : undefined;

  // Récupérer les teams du coach
  const teams = await prisma.team.findMany({
    where: {
      clubId: context.clubId,
      coachId: context.userId,
    },
  });

  // Récupérer les sessions avec filtrage
  const sessions = await getSessions({ teamIds });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Historique des Séances</h1>
        <TeamFilter teams={teams} selectedTeamIds={teamIds || []} />
      </div>

      <SessionsTable sessions={sessions} />
    </div>
  );
}
```

---

## 🔒 PHASE 9 : Système de Permissions Étendu

### 9.1 Types de Rôles Étendus

**Fichier** : `src/lib/auth.ts` (mise à jour)

```typescript
export type UserRole = 'super_admin' | 'club_admin' | 'coach' | 'athlete';

export const ROLE_HIERARCHY = {
  super_admin: 4,
  club_admin: 3,
  coach: 2,
  athlete: 1,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Permissions granulaires
export const PERMISSIONS = {
  // Club management
  'club:update': ['super_admin', 'club_admin'],
  'club:delete': ['super_admin'],
  'club:view_billing': ['super_admin', 'club_admin'],

  // Staff management
  'staff:invite': ['super_admin', 'club_admin'],
  'staff:remove': ['super_admin', 'club_admin'],
  'staff:update_role': ['super_admin', 'club_admin'],

  // Teams
  'team:create': ['super_admin', 'club_admin', 'coach'],
  'team:update': ['super_admin', 'club_admin', 'coach'],
  'team:delete': ['super_admin', 'club_admin', 'coach'],

  // Sessions
  'session:create': ['super_admin', 'club_admin', 'coach'],
  'session:update': ['super_admin', 'club_admin', 'coach'],
  'session:delete': ['super_admin', 'club_admin', 'coach'],
  'session:view_all': ['super_admin', 'club_admin', 'coach'],

  // Athletes
  'athlete:invite': ['super_admin', 'club_admin', 'coach'],
  'athlete:remove': ['super_admin', 'club_admin', 'coach'],

  // Sports (plan-based)
  'sport:add': [], // Vérifié via subscription plan limits
};

export function can(userRole: UserRole, permission: string): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
}
```

### 9.2 Middleware de Protection

**Fichier** : `src/middleware.ts`

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Routes publiques
const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/features',
  '/about',
  '/contact',
  '/legal/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/invite/(.*)', // Acceptation d'invitations
]);

// Routes protégées par rôle
const isClubAdminRoute = createRouteMatcher(['/club/(.*)']);
const isCoachRoute = createRouteMatcher(['/coach/(.*)']);
const isAthleteRoute = createRouteMatcher(['/app/(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Authentification requise
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // Vérifications de rôle (simplifiées ici, la vraie logique est dans les server actions)
  if (isClubAdminRoute(req)) {
    // TODO: Vérifier le rôle club_admin
  }

  if (isCoachRoute(req)) {
    // TODO: Vérifier le rôle coach ou club_admin
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### 9.3 Guards dans les Pages

Exemple dans `src/app/club/dashboard/page.tsx` :

```tsx
import { requireClubAdmin } from '@/lib/club';

export default async function ClubDashboardPage() {
  // 🔒 Guard : seuls les club_admin peuvent accéder
  await requireClubAdmin();

  // ... reste du code
}
```

---

## 🛡️ PHASE 10 : Sécurité & Production

### 10.1 Tests de Sécurité Multi-tenant

Créer des tests pour vérifier l'isolation des données :

**Fichier** : `tests/security/multitenant.test.ts`

```typescript
import { test, expect } from '@jest/globals';
import { prisma } from '@/lib/prisma';

test('Club A cannot access Club B sessions', async () => {
  const clubA = await prisma.club.create({ data: { name: 'Club A' } });
  const clubB = await prisma.club.create({ data: { name: 'Club B' } });

  const sessionB = await prisma.trainingSession.create({
    data: {
      clubId: clubB.id,
      name: 'Session B',
      // ...
    },
  });

  // Tenter d'accéder à sessionB depuis Club A
  const result = await prisma.trainingSession.findFirst({
    where: {
      id: sessionB.id,
      clubId: clubA.id, // ❌ Devrait échouer
    },
  });

  expect(result).toBeNull();
});
```

### 10.2 Rate Limiting

**Installation** :

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Fichier** : `src/lib/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    throw new Error('Rate limit exceeded');
  }

  return { limit, reset, remaining };
}
```

Utilisation dans les API routes :

```typescript
export async function POST(req: NextRequest) {
  const { userId } = await auth();

  // Rate limiting
  await checkRateLimit(`user:${userId}`);

  // ... reste du code
}
```

### 10.3 Monitoring avec Sentry

**Installation** :

```bash
npm install @sentry/nextjs
```

**Configuration** : `sentry.client.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### 10.4 Analytics avec PostHog

```bash
npm install posthog-js
```

**Fichier** : `src/lib/posthog.ts`

```typescript
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://app.posthog.com',
  });
}

export { posthog };
```

### 10.5 Backup Automatique PostgreSQL

**Option 1 : Vercel Postgres**

- Backups automatiques inclus

**Option 2 : Script cron manuel**

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="running_data"

pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Upload vers S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql s3://my-backups/

# Garder seulement les 30 derniers jours
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete
```

### 10.6 CI/CD avec GitHub Actions

**Fichier** : `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npx tsc --noEmit

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🚢 PHASE 11 : Migration & Déploiement

### 11.1 Script de Migration des Données

**Fichier** : `scripts/migrate-to-multitenant.ts`

```typescript
import { prisma } from '../src/lib/prisma';

async function migrate() {
  console.log('🚀 Démarrage de la migration PlaniTeam...');

  // 1. Créer un club par défaut pour les données existantes
  const defaultClub = await prisma.club.create({
    data: {
      name: 'Club Demo',
      slug: 'club-demo',
      sports: ['running'], // Multi-sports support
      subscriptionPlan: 'performance',
      subscriptionStatus: 'active',
      maxCoaches: 999,
      maxAthletes: 9999,
    },
  });

  console.log('✅ Club par défaut créé');

  // 2. Migrer les sessions existantes (running uniquement)
  const sessions = await prisma.trainingSession.findMany({
    where: { clubId: null },
  });

  for (const session of sessions) {
    // Transformer l'ancienne structure en builderConfig
    const builderConfig = {
      sport: 'running',
      vma: session.vma || 14,
      steps: session.steps,
    };

    const totalMetrics = {
      distance: session.totalDistance,
      time: session.totalTime,
    };

    await prisma.trainingSession.update({
      where: { id: session.id },
      data: {
        clubId: defaultClub.id,
        createdById: 'admin-user-id', // TODO: adapter
        assignToAllClub: true,
        sport: 'running',
        builderConfig,
        totalMetrics,
      },
    });
  }

  console.log(`✅ ${sessions.length} sessions migrées`);

  // 3. Migrer les événements
  const events = await prisma.event.findMany({
    where: { clubId: null },
  });

  for (const event of events) {
    await prisma.event.update({
      where: { id: event.id },
      data: {
        clubId: defaultClub.id,
        createdById: 'admin-user-id',
      },
    });
  }

  console.log(`✅ ${events.length} événements migrés`);

  console.log('🎉 Migration terminée !');
}

migrate()
  .catch((e) => {
    console.error('❌ Erreur lors de la migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Exécution** :

```bash
npx tsx scripts/migrate-to-multitenant.ts
```

### 11.2 Tests de Charge

**Installation** :

```bash
npm install -g k6
```

**Fichier** : `tests/load/sessions.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Montée à 50 users
    { duration: '3m', target: 50 },  // Maintien
    { duration: '1m', target: 100 }, // Montée à 100 users
    { duration: '3m', target: 100 }, // Maintien
    { duration: '1m', target: 0 },   // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% des requêtes < 500ms
    http_req_failed: ['rate<0.01'],   // < 1% d'erreurs
  },
};

export default function () {
  const res = http.get('https://eslteam.fr/api/sessions');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Exécution** :

```bash
k6 run tests/load/sessions.js
```

### 11.3 Documentation Utilisateur

Créer un dossier `docs/` avec :

- **Guide Admin** : Comment créer un club, inviter des coaches, gérer l'abonnement
- **Guide Coach** : Comment créer des groupes, inviter des athlètes, créer des séances
- **Guide Athlète** : Comment consulter le planning, télécharger les séances

### 11.4 Documentation Technique

**Fichier** : `ARCHITECTURE.md`

```markdown
# Architecture Technique - PlaniTeam

## Stack
- Next.js 16 (App Router)
- PostgreSQL + Prisma
- Clerk (Auth)
- Stripe (Billing)
- MinIO (Storage)

## Architecture Multi-Sports
PlaniTeam est conçu pour supporter plusieurs disciplines sportives avec des builders adaptés :
- Structure de données flexible (JSON) pour les configurations d'entraînement
- Facteurs de performance personnalisables par sport et par athlète
- Système de builders modulaires (un builder par sport)
- Calculs adaptés selon le sport (VMA pour running, FTP pour cyclisme, etc.)

## Multi-Tenancy
- Isolation par `clubId` dans toutes les tables
- Vérification systématique dans les Server Actions
- Middleware de contexte club
- Support multi-sports par club selon le plan d'abonnement

## Extensibilité
Nouveaux sports ajoutables facilement :
1. Ajouter le sport dans la liste des sports supportés
2. Créer le builder component pour ce sport
3. Définir les facteurs de performance
4. Implémenter les calculs spécifiques
5. Générer le PDF adapté

## Déploiement
- Hosting : Vercel
- Base de données : Neon / Supabase
- Storage : AWS S3 / MinIO
- Monitoring : Sentry
- Analytics : PostHog

## API Routes
- `/api/clubs` - CRUD clubs
- `/api/stripe/checkout` - Création session Stripe
- `/api/stripe/portal` - Portail client
- `/api/webhooks/stripe` - Webhooks Stripe
- `/api/webhooks/clerk` - Webhooks Clerk
- `/api/sports` - Liste des sports supportés

## Sécurité
- Rate limiting avec Upstash
- CSRF protection (Next.js intégré)
- Isolation données multi-tenant
- Validation Zod sur tous les inputs
- Vérification des sports autorisés par plan
```

### 11.5 Configuration Production

**Variables d'environnement Vercel** :

```env
# Database
DATABASE_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# S3
S3_ENDPOINT=s3.amazonaws.com
S3_BUCKET_NAME=eslteam-prod
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@eslteam.fr

# URLs
NEXT_PUBLIC_APP_URL=https://planiteam.fr

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=...
NEXT_PUBLIC_POSTHOG_KEY=...

# Rate Limiting
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### 11.6 Déploiement Final

**Checklist avant déploiement** :

- [ ] Migrations Prisma appliquées en prod
- [ ] Variables d'environnement configurées
- [ ] Webhooks Stripe configurés avec l'URL prod
- [ ] Webhooks Clerk configurés
- [ ] DNS configuré
- [ ] SSL activé
- [ ] Tests de bout en bout passés
- [ ] Monitoring configuré
- [ ] Backups automatiques activés
- [ ] Rate limiting activé
- [ ] Documentation à jour

**Commandes** :

```bash
# Build local
npm run build

# Test du build
npm run start

# Déploiement Vercel
vercel --prod

# Vérifier les migrations
npx prisma migrate status --schema=./prisma/schema.prisma

# Appliquer les migrations
npx prisma migrate deploy
```

---

## 📋 Récapitulatif des Priorités

### Ordre d'Implémentation Recommandé

1. **Phase 1** (Architecture Multi-Sports) - CRITIQUE
2. **Phase 3** (Stripe) - CRITIQUE
3. **Phase 4** (Onboarding avec sélection sports) - CRITIQUE
4. **Phase 2** (Landing Page Multi-Sports) - HAUTE
5. **Phase 7** (Multi-tenancy App) - HAUTE
6. **Phase 5** (Dashboard Admin) - HAUTE
7. **Phase 6** (Espace Coach avec sports) - HAUTE
8. **Phase 8** (Planification Multi-Sports) - MOYENNE
9. **Phase 9** (Permissions) - MOYENNE
10. **Phase 10** (Sécurité) - HAUTE (avant prod)
11. **Phase 11** (Déploiement) - FINALE

### Développement des Builders par Sport

**Phase initiale** : Builder Running (déjà existant)
- Facteur : VMA (km/h)
- Métriques : Distance, Temps, Pace, Split 200m

**Phase 2** : Builders sur demande
- Swimming (Temps au 100m, Distance, Allure)
- Cycling (FTP, Distance, Puissance, Temps)
- Athletics/Sauts (Hauteur max, Répétitions, Intensité)
- Musculation (RM, Poids, Séries, Reps)

**Approche** : Développement incrémental selon les demandes clients

### Estimation Temps

- **Phase 1** : 3-4 jours
- **Phase 2** : 5-7 jours
- **Phase 3** : 4-5 jours
- **Phase 4** : 3-4 jours
- **Phase 5** : 4-5 jours
- **Phase 6** : 5-6 jours
- **Phase 7** : 6-8 jours
- **Phase 8** : 3-4 jours
- **Phase 9** : 2-3 jours
- **Phase 10** : 4-5 jours
- **Phase 11** : 3-4 jours

**Total estimé** : 6-8 semaines de développement

---

## 🎯 Prochaines Étapes Immédiates

1. Valider l'architecture multi-sports et le schéma Prisma
2. Configurer Stripe et créer les 3 produits (avec limites de sports)
3. Démarrer par la Phase 1 (BDD avec support multi-sports)
4. Adapter le builder Running existant vers la nouvelle structure flexible
5. Créer le système de sélection de sport dans l'onboarding
6. Tester le flow d'onboarding en local avec multi-sports
7. Créer la landing page PlaniTeam avec showcase multi-sports

## 🌟 Vision Long Terme

**PlaniTeam** n'est pas juste une application de gestion d'entraînements, c'est une **plateforme adaptative** qui :

- 🏃 Commence avec le running (builder existant)
- 🏊 S'étend à d'autres sports selon la demande
- 🎯 Personnalise les facteurs d'intensité par athlète et par sport
- 📈 Permet aux clubs multi-disciplines de tout gérer en un seul endroit
- 🚀 Offre un service de développement de builders sur mesure (plan Performance)

**Positionnement marché** : La seule plateforme de planification sportive véritablement multi-sports et personnalisable.

---

**Version** : 1.0 - PlaniTeam Edition
**Dernière mise à jour** : Décembre 2025
**Auteur** : Paul-Etienne Guérin
**Nom du projet** : PlaniTeam - Plateforme Multi-Sports
