# Architettura

## Stato corrente

L'applicazione è un client React/Vite interamente locale. `src/App.jsx` concentra ancora la maggior parte del dominio, dello stato, della persistenza e della presentazione.

Le conversioni pure `hexToHsl` e `hslToHex` sono state estratte in `src/color.ts`, primo modulo TypeScript del dominio indipendente da React. I relativi test di caratterizzazione sono contenuti in `tests/color.characterization.test.ts`.

La struttura è mantenuta intenzionalmente minima: non vengono create cartelle, moduli di re-export o file di tipi separati finché la complessità effettiva non li rende necessari.

Il service worker è generato da `vite-plugin-pwa`. Non esistono API o backend.

## Obiettivi

- rendere il motore cromatico indipendente da React;
- migrare progressivamente a TypeScript;
- consentire test deterministici in locale;
- isolare persistenza, analytics e pubblicità;
- mantenere il deploy su hosting statico indipendente dal provider;
- preparare, senza implementarla prematuramente, una futura distribuzione mobile.

## Architettura target

```text
src/
  app/
    App.tsx
    routes.tsx
    providers/
  components/
    ui/
    layout/
  features/
    profile/
    wardrobe/
    recommendations/
    onboarding/
  domain/
    color/
      types.ts
      srgb.ts
      xyz.ts
      lab.ts
      difference.ts
      acquisition.ts
    profile/
      types.ts
      analyzeProfile.ts
      classifySeason.ts
    harmony/
      types.ts
      scoreHarmony.ts
      generateCandidates.ts
    outfit/
      types.ts
      weights.ts
      scoreOutfit.ts
      rankOutfits.ts
  services/
    storage/
    analytics/
    advertising/
  styles/
    tokens.css
    globals.css
  main.tsx
tests/
  characterization/
  standards/
  properties/
  datasets/
```

La struttura è indicativa. Va introdotta per incrementi, non creata vuota in un solo refactoring.

## Direzione delle dipendenze

```text
UI/features
    ↓
application orchestration
    ↓
domain

services/adapters → interfacce definite dall'application layer
```

Il dominio non deve importare React, DOM, `localStorage`, provider pubblicitari o API di piattaforma.

## Contratti principali

### Input cromatico

Deve contenere almeno:

- valore del colore;
- spazio colore e white point;
- origine: manuale, fotografia, dataset o misura;
- metadati di acquisizione disponibili;
- livello di affidabilità.

### Profilo

Deve distinguere valori continui e categorie derivate. Le categorie non devono sostituire i punteggi originali.

### Risultato

Deve includere:

- proposta o classificazione;
- score;
- confidenza o margine;
- motivazioni principali;
- avvertenze;
- versione del modello;
- seed, quando applicabile.

## Persistenza

`localStorage` può restare nella prima fase, ma deve essere racchiuso in un adapter con:

- schema versionato;
- valori predefiniti;
- validazione runtime;
- migrazioni;
- gestione esplicita degli errori;
- possibilità di sostituzione futura.

Le chiavi attuali `chs_*` devono essere migrate senza perdita di dati oppure supportate temporaneamente come legacy.

## Determinismo

Le funzioni del motore devono ricevere esplicitamente:

- input;
- configurazione/versione del modello;
- seed pseudocasuale.

`Date.now()` non deve essere letto all'interno del dominio. L'orchestratore può generare il seed e registrarlo nel risultato.

## Pubblicità

La UI deve usare un confine astratto, ad esempio:

```tsx
<AdSlot placement="results-secondary" />
```

Il componente non deve influenzare la logica cromatica. Il provider, il consenso e il caricamento degli script devono essere gestiti da un adapter dedicato.

## Deploy

La build deve produrre asset statici distribuibili su provider diversi. `netlify.toml` può rimanere durante la transizione, ma nessuna funzione essenziale deve dipendere da API Netlify.

## Percorso mobile futuro

La scelta tra wrapper web, Capacitor o implementazione più nativa deve essere effettuata dopo la validazione della web app. TypeScript facilita la condivisione del dominio, ma non determina la tecnologia mobile.

## Sequenza di migrazione

1. **Completato:** aggiungere TypeScript mantenendo l'entrypoint React funzionante.
2. **In corso:** definire i tipi fondamentali del dominio e il test runner. Vitest e il tipo `Hsl` sono presenti; gli altri tipi saranno introdotti insieme ai moduli che li richiedono.
3. **In corso:** estrarre conversioni e funzioni pure senza cambiare output. `hexToHsl` e `hslToHex` sono state estratte e caratterizzate.
4. Estrarre classificazione, fit, armonie e generazione.
5. Inserire un adapter per la persistenza.
6. Scomporre componenti e feature.
7. Centralizzare design token e stili.
8. Rimuovere configurazioni obsolete solo dopo il deploy sostitutivo.

## Regola di revisione

Ogni estrazione deve avere:

- comportamento caratterizzato;
- test dei casi limite;
- nessuna dipendenza UI nel modulo di dominio;
- documentazione delle euristiche conservate;
- build PWA verificata.
