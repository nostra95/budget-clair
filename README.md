# Budget Clair

Un budget mensuel calculé à partir du salaire : plafonds en pourcentage et en euros, tolérance pour les cafés, les achats en ligne et les sorties, réserve de sécurité, projets, investissement, conseils et « khotta », un plan calculé à partir du salaire et des charges.

Site personnel de fan, non officiel. Les images de `assets/img` montrent des personnages de Black Clover (© Yūki Tabata / Shueisha, TV Tokyo, Pierrot). Plusieurs sont des fan arts, signés notamment Arts_Vini67 et Dank2001 ; ils appartiennent à leurs auteurs. Le reste du design est original.

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

Polices : Grenze Gotisch et Alegreya Sans, sous licence SIL OFL 1.1 (voir `assets/fonts`).
