📋 TO-DO LIST : Transformation SaaS
1. Architecture & Base de données (Le fondations)
[ ] Mettre à jour le schéma Prisma (voir le code ci-dessous) pour intégrer les tables Club, Team (Groupes) et les relations.

[ ] Migrer la base de données (npx prisma migrate dev).

[ ] Mettre à jour le Middleware Clerk : S'assurer que les routes /admin, /coach et /app sont protégées différemment.

2. Gestion Administrative & Onboarding (Club)
[ ] Créer le tunnel d'inscription Club : Une page où un président/head-coach crée le club (Nom, Logo, Sport).

[ ] Intégrer Stripe (Billing) :

[ ] Créer les produits dans Stripe (Solo, Standard, Performance).

[ ] Créer une page de Pricing dans l'app.

[ ] Mettre en place les Webhooks Stripe (pour activer le club dans ta BDD dès le paiement reçu).

[ ] Dashboard "Super Admin" (Club) :

[ ] Page de gestion de l'abonnement (Lien vers portail client Stripe).

[ ] Page "Gestion du Staff" : Formulaire pour inviter un Coach par email (envoi d'un lien d'invitation).

3. Espace Coach (Gestion d'équipe)
[ ] Dashboard Coach : Vue d'ensemble de ses groupes.

[ ] CRUD Groupes : Le coach doit pouvoir créer, renommer, supprimer une "Équipe" (ex: "Groupe VMA Mardi", "Groupe Trail").

[ ] Invitation Athlètes :

[ ] Le coach sélectionne un Groupe.

[ ] Il génère un lien d'invitation unique ou entre les emails.

[ ] L'athlète qui s'inscrit via ce lien est automatiquement ajouté au Club ET à la Team.

4. Planification & Calendrier (Le cœur du réacteur)
[ ] Modifier le Builder de Séance :

[ ] Ajouter une étape "Assignation" : Case à cocher "Tout le club" OU sélection multiple des "Équipes".

[ ] Modifier les Server Actions (getSessions) :

[ ] Si l'utilisateur est un Athlète : Récupérer les séances assignées à ses équipes + les séances globales du club.

[ ] Si l'utilisateur est Coach : Voir tout, avec un filtre par équipe.