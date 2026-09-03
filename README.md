# Toul'hygiène

Site vitrine statique de Toul'hygiène, prêt pour Vercel et pour un hébergement web classique comme OVH.

Prérequis : Node.js 22.

## Développement

```bash
npm install
npm run dev
```

## Générer le site statique

```bash
npm run build
```

Les fichiers à publier sont générés dans `dist/client`.

## Déploiement

- **Vercel** : importer ce dépôt GitHub. La configuration de build est déjà fournie dans `vercel.json`.
- **OVH** : lancer `npm run build`, puis transférer le contenu de `dist/client` dans le dossier web de l'hébergement, généralement `www`.

Le formulaire prépare actuellement les demandes dans l'interface. Une adresse de réception ou un service de formulaire devra être configuré pour permettre l'envoi réel.
