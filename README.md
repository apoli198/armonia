# Armonia

Armonia è una web app/PWA React per l'analisi cromatica personale e la generazione di combinazioni di colori per l'abbigliamento.

Il progetto è in una fase di ristrutturazione. Le priorità attuali sono:

1. migrare progressivamente il codice da JavaScript a TypeScript;
2. isolare il motore cromatico dalla UI;
3. sottoporre formule, soglie e classificazioni a revisione scientifica;
4. costruire test automatici e un processo di validazione riproducibile;
5. migliorare successivamente esperienza utente e identità visiva.

> Stato scientifico: il motore corrente contiene euristiche non ancora validate. I risultati non devono essere presentati come misurazioni scientifiche o diagnosi.

## Stato attuale

* React 18 e Vite 5.
* PWA tramite `vite-plugin-pwa`.
* Persistenza locale tramite `localStorage`.
* Deploy configurato per Netlify.
* Interfaccia mobile-first con modalità chiara e scura.
* Analisi di pelle, occhi e capelli.
* Classificazione nel modello a 12 stagioni.
* Generazione di outfit mediante armonie cromatiche e pesi visivi dei capi.
* Selezione manuale dei colori e campionamento da immagine.

La quasi totalità dell'applicazione è ancora contenuta in `src/App.jsx`. Il blocco cromatico di base è stato estratto in `src/color.ts`, primo modulo TypeScript del dominio indipendente da React.

Il modulo comprende:

* rappresentazione HSL tipizzata;
* conversioni tra colore esadecimale e HSL;
* normalizzazioni euristiche per tessuto, pelle, occhi e capelli;
* range biologici euristici;
* validazione dei colori biologici.

I relativi test di caratterizzazione sono eseguiti con Vitest. I 53 test correnti coprono conversioni, round trip, normalizzazione della hue, clamp, curve di normalizzazione, valori fuori dagli intervalli nominali, range biologici e validazione.

Questi test preservano il comportamento della baseline durante la migrazione, ma non costituiscono una validazione scientifica del modello HSL, delle curve o dei range biologici.

La validazione biologica è attualmente disponibile nel dominio e coperta da test, ma non è ancora collegata alla UI.

Il resto del motore, la persistenza e la maggior parte della UI restano temporaneamente in JavaScript/JSX. Linting e CI non sono ancora presenti.

## Avvio locale

Requisiti:

* Node.js supportato dalla versione di Vite installata;
* npm.

```bash
npm ci
npm run typecheck
npm test
npm run dev
```

Build di produzione:

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## Documentazione

La documentazione di progetto è indicizzata in [`docs/INDEX.md`](docs/INDEX.md).

Prima di modificare il motore cromatico, leggere almeno:

* [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)
* [`docs/COLOR_ENGINE_SPEC.md`](docs/COLOR_ENGINE_SPEC.md)
* [`docs/SCIENTIFIC_SOURCES.md`](docs/SCIENTIFIC_SOURCES.md)
* [`docs/VALIDATION_PLAN.md`](docs/VALIDATION_PLAN.md)
* [`docs/DECISIONS.md`](docs/DECISIONS.md)

## Roadmap

La roadmap corrente è in [`docs/ROADMAP.md`](docs/ROADMAP.md). L'obiettivo per l'inizio di settembre 2026 è una beta web coerente, verificabile e presentabile, con priorità alla correttezza del motore rispetto alla rifinitura grafica.

## Distribuzione

La sequenza prevista è:

1. web app/PWA;
2. crescita dell'utenza e sperimentazione della monetizzazione pubblicitaria;
3. validazione della sostenibilità economica;
4. eventuale distribuzione su Play Store e App Store.

TypeScript è una scelta di manutenibilità e verificabilità; non è di per sé un requisito per la pubblicazione sugli store.

## Repository

Repository canonica: https://github.com/apoli198/armonia

La repository è pensata anche come progetto portfolio. Dataset proprietari, credenziali, dati personali e materiale non redistribuibile non devono essere inclusi.

## Licenza

Licenza non ancora definita.
