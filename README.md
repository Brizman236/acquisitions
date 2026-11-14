# Acquisitions API

API backend Node.js/Express qui sert actuellement de base à une application de gestion d'utilisateurs et d'accès. Le parcours d'inscription est implémenté : les données sont validées, le mot de passe est hashé, l'utilisateur est enregistré dans PostgreSQL et un JWT est envoyé dans un cookie.

Ce dépôt peut aussi servir de modèle pour construire une autre API REST : les responsabilités sont séparées entre routes, contrôleurs, services, validations et modèles.

## État actuel

| Méthode | URL                  | État        | Rôle                                               |
| ------- | -------------------- | ----------- | -------------------------------------------------- |
| `GET`   | `/`                  | Implémenté  | Message d'accueil                                  |
| `GET`   | `/health`            | Implémenté  | État, date et durée de fonctionnement du processus |
| `GET`   | `/api`               | Implémenté  | Vérification simple de l'API                       |
| `POST`  | `/api/auth/sign-up`  | Implémenté  | Crée un compte et définit un cookie JWT            |
| `POST`  | `/api/auth/sign-in`  | À compléter | Réponse provisoire, pas d'authentification         |
| `POST`  | `/api/auth/sign-out` | À compléter | Réponse provisoire, ne supprime pas de session     |

## Architecture

Le projet est un **monolithe modulaire** : une seule application Express, organisée en couches. Pour une requête HTTP, le chemin général est :

```text
Client
  │ HTTP
  ▼
Express + middlewares (sécurité, parsing, cookies, logs)
  │
  ▼
Route ──► Contrôleur ──► Validation
                │
                ▼
             Service ──► Modèle Drizzle ──► PostgreSQL (Neon)
                │
                ▼
          Réponse HTTP
```

### Organisation des fichiers

```text
src/
├── config/
│   ├── database.js       # Client Neon et instance Drizzle
│   └── logger.js         # Winston : console et fichiers de logs
├── controllers/
│   └── auth.controller.js
├── models/
│   └── user.model.js     # Schéma de la table users
├── routes/
│   └── auth.route.js     # Endpoints /api/auth
├── services/
│   └── auth.service.js   # Création de comptes et hash des mots de passe
├── utils/
│   ├── cookies.js
│   ├── format.js
│   └── jwt.js
├── validations/
│   └── auth.validation.js
├── app.js                # Assemble Express, middlewares et routes
├── server.js             # Démarre l'écoute HTTP
└── index.js              # Charge l'environnement puis le serveur
drizzle/                  # Migrations SQL et métadonnées Drizzle Kit
drizzle.config.js         # Configuration de génération des migrations
```

### Responsabilité de chaque couche

- **Routes** : associent une méthode et une URL à un contrôleur. Elles ne contiennent pas les règles métier.
- **Contrôleurs** : traduisent la requête HTTP en appels applicatifs, choisissent le statut HTTP et construisent la réponse.
- **Validations** : définissent la forme des données acceptées et peuvent les normaliser avant traitement.
- **Services** : portent les règles métier et coordonnent les opérations de données.
- **Modèles** : décrivent les tables et colonnes utilisées par Drizzle.
- **Configuration et utilitaires** : partagent les connexions, logs et fonctions transverses comme les cookies et les JWT.

## Parcours d'inscription

Pour `POST /api/auth/sign-up` :

1. `src/app.js` exécute les middlewares Express, puis transmet la requête au routeur `/api/auth`.
2. `src/routes/auth.route.js` associe `/sign-up` à `signup`.
3. `src/controllers/auth.controller.js` valide le corps de la requête avec le schéma Zod.
4. `src/services/auth.service.js` cherche un compte avec le même email, hash le mot de passe avec bcrypt, puis insère l'utilisateur via Drizzle.
5. Le contrôleur signe un JWT, le place dans un cookie HttpOnly et renvoie les champs publics de l'utilisateur.

Exemple de requête :

```bash
curl -i -X POST http://localhost:3000/api/auth/sign-up \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"un-mot-de-passe"}'
```

`role` est facultatif dans le schéma et sa valeur par défaut est `user`. En cas de succès, l'API répond avec le statut `201`, un cookie `token` et un objet `user` qui ne contient pas le hash du mot de passe.

## Technologies

- **Node.js avec modules ES** : environnement d'exécution JavaScript côté serveur.
- **Express** : serveur HTTP, middlewares et routage.
- **Zod** : validation et normalisation des entrées.
- **PostgreSQL / Neon** : stockage relationnel, avec le client serverless Neon.
- **Drizzle ORM / Drizzle Kit** : requêtes typées à partir du schéma JavaScript et génération de migrations SQL.
- **bcrypt** : hash des mots de passe avant stockage.
- **jsonwebtoken** : signature et vérification des JWT.
- **Winston et Morgan** : journalisation des événements applicatifs et des requêtes HTTP.
- **Helmet, CORS et cookie-parser** : en-têtes de sécurité, politique CORS et lecture des cookies.

## Installation et démarrage

### Prérequis

- Node.js et npm
- Une base PostgreSQL accessible (par exemple une base Neon)

### Configuration

1. Installer les dépendances :

   ```bash
   npm install
   ```

2. Copier `.env.example` vers `.env`, puis renseigner au minimum l'URL de connexion :

   ```dotenv
   PORT=3000
   NODE_ENV=development
   LOG_LEVEL=info
   DATABASE_URL=postgresql://...
   JWT_SECRET=une-cle-aleatoire-longue-et-secrete
   ```

   `JWT_SECRET` n'est pas encore présent dans `.env.example`, mais l'application l'utilise pour signer les tokens. Le code a actuellement une valeur de repli : configurez une vraie valeur secrète et ne déployez pas avec cette valeur de repli.

3. Créer/appliquer les migrations Drizzle si la base n'est pas encore à jour :

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Lancer l'API en développement :

   ```bash
   npm run dev
   ```

Le script `dev` utilise `node --watch ./src/index.js`. Le serveur écoute sur `PORT`, ou sur le port `3000` par défaut. Les scripts `npm run db:studio` ouvrent Drizzle Studio et `npm run lint` lance ESLint.

## Comment cette API a été développée

L'organisation suit une progression qui aide à garder le code lisible et à isoler les responsabilités :

1. **Définir les données** : l'entité utilisateur et ses contraintes sont décrites dans `src/models/user.model.js`.
2. **Créer la migration** : Drizzle Kit compare le modèle aux migrations et génère le SQL dans `drizzle/`. La migration doit être vérifiée puis appliquée à la base.
3. **Définir les entrées** : `src/validations/auth.validation.js` fixe les champs, les formats, les limites et les valeurs par défaut.
4. **Implémenter le service** : `src/services/auth.service.js` contient la création du compte, le hash et l'accès à la base.
5. **Orchestrer le cas d'usage** : `src/controllers/auth.controller.js` valide la requête, appelle le service et prépare la réponse HTTP.
6. **Exposer l'endpoint** : `src/routes/auth.route.js` relie l'URL au contrôleur.
7. **Assembler l'application** : `src/app.js` configure les middlewares et monte les routes; `src/server.js` démarre le serveur.
8. **Vérifier** : lancer le lint, démarrer l'API, puis tester les cas valides et invalides avec curl ou un client HTTP.

Cette progression part du modèle de données et remonte jusqu'à l'interface HTTP. Elle permet de tester et de faire évoluer chaque couche sans mêler requêtes SQL, règles métier et détails Express dans le même fichier.

## Réutiliser cette structure pour une autre API

Pour ajouter une ressource, par exemple `products`, on peut suivre le même découpage :

```text
src/
├── models/product.model.js
├── validations/product.validation.js
├── services/product.service.js
├── controllers/product.controller.js
└── routes/product.route.js
```

Ordre de travail conseillé :

1. Définir les champs et contraintes de `products`.
2. Décrire la table dans `product.model.js`, puis générer et appliquer sa migration.
3. Définir les schémas Zod pour la création et la mise à jour.
4. Implémenter les opérations de données et règles métier dans `product.service.js`.
5. Écrire les contrôleurs HTTP, qui appellent le service et renvoient les statuts/réponses appropriés.
6. Déclarer les URLs dans `product.route.js`, puis monter le routeur dans `src/app.js`, par exemple sous `/api/products`.
7. Tester les succès, les entrées invalides, les ressources absentes et les erreurs de base de données.

Quelques règles de séparation à conserver :

- Un routeur déclare les chemins; il ne fait pas les requêtes à la base.
- Un contrôleur connaît Express (`req`, `res`, `next`); un service ne devrait pas en dépendre.
- Une validation décrit les entrées attendues; elle ne persiste pas les données.
- Un service applique les règles métier et utilise le modèle/la base.
- Les configurations partagées (base, logger, sécurité) restent centralisées.
- Les migrations SQL sont versionnées avec le code et appliquées dans chaque environnement.

## Points à compléter avant une mise en production

- Implémenter réellement la connexion et la déconnexion.
- Ne pas permettre à une inscription publique de choisir un rôle privilégié comme `admin`.
- Exiger un `JWT_SECRET` configuré et supprimer la valeur secrète de repli.
- Vérifier la durée de vie du cookie par rapport à celle du JWT.
- Corriger et tester la gestion des doublons d'emails et la suppression du cookie.
- Ajouter des tests automatisés, un middleware d'erreurs explicite et une configuration CORS adaptée au client.
- Vérifier le lint et les paramètres de sécurité pour l'environnement de déploiement.

À ce jour, aucun script de test n'est défini dans `package.json`.
