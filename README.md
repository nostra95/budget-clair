# Budget Clair

Un budget mensuel calculé à partir du salaire : plafonds en pourcentage et en euros, tolérance pour les cafés, les achats en ligne et les sorties, réserve de sécurité, projets et conseils.

Site : https://nostra95.github.io/budget-clair/

## Comment ça marche

- `index.html` : la page.
- `assets/core.js` : les calculs, sans interface. Les montants sont des entiers en centimes.
- `assets/app.js` : l'interface.
- `assets/style.css` : le design, en clair et en sombre.
- `tests/core.test.js` : les tests des calculs.

Les données restent dans le navigateur (`localStorage`). Rien n'est envoyé sur Internet. Une sauvegarde s'exporte depuis Réglages.

## Tests

```sh
node --test tests/*.test.js
```

Polices : Bricolage Grotesque et Figtree, sous licence SIL OFL 1.1 (voir `assets/fonts`).
