# LoanWise Hub

https://github.com/DarkShadowCoder/execution-hub.git
A base de ce repo github et de cette base de données je veux que tu continue la conception du site web admin pour y integrer la gestion du module "pret" (dont les données sont deja crées dans la base de données zender_test).
Fonctionnement conceptuel du module Prêt

Le système peut être vu comme une chaîne :

Profil utilisateur → Rang → Règles de prêt → Éligibilité → Demande → Validation → Décaissement → Remboursement → Historique

1. Les règles sont définies par l’administrateur

L’admin dispose d'une section dédiée aux règles de prêt.

Pour chaque rang, il définit notamment les paramètres autorisés dans l'application, par exemple :

Rang
├── Montant minimum
├── Montant maximum
├── Durée maximale
├── Taux / frais éventuels
├── Nombre de prêts autorisés
├── Délai entre deux prêts
├── Conditions d'éligibilité
└── Statut actif/inactif

L'idée importante est que l'utilisateur ne choisit pas librement ses privilèges. Ses possibilités sont déterminées automatiquement par son rang et les règles administratives.

2. L'utilisateur consulte sa capacité d'emprunt

Dans l'application, l'utilisateur doit pouvoir voir une synthèse du type :

MON PRÊT

Rang : Gold

Montant disponible
500 000 FCFA

Durée maximale
6 mois

Prêt actuellement actif
150 000 FCFA

Montant encore accessible
350 000 FCFA

Statut
✓ Éligible

Le système vérifie automatiquement les règles avant de permettre une demande.

3. L'utilisateur fait une demande

L'utilisateur sélectionne le montant et les paramètres proposés par le système.

Par exemple :

Montant demandé : 300 000 FCFA
Durée : 6 mois

Avant validation, l'application affiche un récapitulatif :

Montant : 300 000 FCFA
Durée : 6 mois
Frais/taux : ...
Total à rembourser : ...
Mensualité : ...

La demande passe ensuite dans un statut tel que :

PENDING

Elle n'est donc pas immédiatement considérée comme accordée.

4. Le système effectue les contrôles

Avant qu'une demande soit acceptée, il faut vérifier plusieurs choses :

Utilisateur actif ?
        ↓
Rang valide ?
        ↓
Règles du rang respectées ?
        ↓
Montant autorisé ?
        ↓
Durée autorisée ?
        ↓
Pas de prêt incompatible déjà actif ?
        ↓
Historique compatible ?
        ↓
Éligible

Cela évite qu'une modification de l'interface permette de contourner les règles.

5. L'administrateur traite la demande

Dans le dashboard admin, les demandes sont visibles avec leur état :

Demandes de prêt

Jean       300 000 FCFA    En attente
Paul       150 000 FCFA    Approuvé
Marc       500 000 FCFA    Refusé

L'admin peut consulter le dossier de l'utilisateur, examiner la demande et décider :

APPROUVER
REFUSER

Selon la logique métier retenue, certaines demandes peuvent aussi nécessiter une vérification supplémentaire.

6. Une demande approuvée devient un prêt

Une fois approuvée, la demande n'est plus simplement une demande : elle devient un loan actif.

On passe conceptuellement de :

PENDING
   ↓
APPROVED
   ↓
DISBURSED
   ↓
ACTIVE

Le prêt contient alors ses informations contractuelles :

Montant
Date d'approbation
Date de décaissement
Durée
Échéances
Montant remboursé
Reste à payer
Prochaine échéance
Statut

7. Le remboursement est suivi

L'utilisateur dispose ensuite d'un espace permettant de suivre son prêt :

PRÊT #LD-10245

300 000 FCFA empruntés

Remboursé
100 000 FCFA

Reste
200 000 FCFA

Prochaine échéance
50 000 FCFA

Statut
ACTIF

Chaque remboursement doit être enregistré dans l'historique afin de garder une trace complète des opérations.

8. Les statuts permettent de gérer tout le cycle de vie

Le prêt devrait avoir une machine d'état claire, par exemple :

PENDING
   │
   ├──→ REJECTED
   │
   └──→ APPROVED
            │
            ↓
        DISBURSED
            │
            ↓
          ACTIVE
            │
       ┌────┴────┐
       ↓         ↓
   COMPLETED   DEFAULTED

Cela permet de distinguer une demande refusée d'un véritable prêt qui est ensuite remboursé ou en défaut.

Le rôle des rangs

C'est le cœur du système que nous avions évoqué.

Par exemple, de manière illustrative :

RANK        MAX LOAN       MAX DURATION
────────────────────────────────────────
Bronze      50 000 FCFA    1 mois
Silver      150 000 FCFA   3 mois
Gold        500 000 FCFA   6 mois
Platinum    1 000 000      12 mois

Ces montants sont seulement un exemple, pas les valeurs officielles de ton application.

L'avantage de cette architecture est que l'admin peut modifier :

Gold → 500 000 FCFA

en :

Gold → 750 000 FCFA

sans avoir à modifier le code de l'application.

Architecture logique

Le module peut donc être organisé autour de quatre éléments principaux :

PROFILES
   │
   └── rank
        │
        ↓
LOAN RULES
        │
        ↓
LOAN APPLICATIONS
        │
        ↓
LOANS
        │
        ↓
REPAYMENTS

Avec, côté utilisateur :

My Loans
   ├── Eligibility
   ├── Request Loan
   ├── Active Loan
   ├── Repayment
   └── History

Et côté admin :

Loans
   ├── Overview
   ├── Applications
   ├── Active Loans
   ├── Repayments
   └── Loan Rules

Le point le plus important est que les règles du rang doivent être appliquées côté base/backend, pas uniquement dans React Native : l'interface peut afficher qu'un utilisateur est éligible, mais la base doit également empêcher une demande qui dépasse réellement ses droits.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5017f8d7-2d5e-4db2-90be-a0b5666f26cf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
