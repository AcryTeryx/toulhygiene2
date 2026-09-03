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
- **OVH** : lancer `npm run build`, puis transférer tout le contenu de `dist/client` dans le dossier web de l'hébergement, généralement `www`.

## Envoi des formulaires

Le site reste statique, à l'exception des deux petits endpoints PHP nécessaires à l'envoi des e-mails :

- `public/api/contact.php` pour les demandes de devis ;
- `public/api/recruitment.php` pour les candidatures et leur CV.

Le build les copie automatiquement dans `dist/client/api`.

Sur l'hébergement OVH :

1. Créer et activer l'adresse `contact@toulhygiene.fr`.
2. Vérifier que PHP et la fonction `mail()` sont disponibles sur l'offre d'hébergement.
3. Publier le contenu complet de `dist/client`, y compris le dossier `api`.
4. Envoyer une demande de devis et une candidature test depuis le domaine final, puis vérifier la réception ainsi que le dossier des indésirables.

Les traitements valident les champs côté serveur, utilisent une adresse d'expédition du domaine et contiennent un champ anti-robot invisible. Les CV acceptés sont les PDF, DOCX et PNG de 5 Mo maximum. En cas de spam récurrent, ajouter ensuite un CAPTCHA (par exemple Cloudflare Turnstile).

Vercel peut servir la prévisualisation statique, mais n'exécute pas ce fichier PHP. L'envoi réel fonctionnera donc sur l'hébergement OVH compatible PHP ; pour l'activer directement sur Vercel, il faudrait remplacer l'endpoint PHP par une fonction serverless et un service d'e-mail.
