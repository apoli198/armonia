# Architettura

## Stato corrente

L'applicazione è un client React/Vite interamente locale. `src/App.jsx` concentra ancora la maggior parte del dominio, dello stato, della persistenza e della presentazione.

Il blocco cromatico di base è stato estratto in `src/color.ts`. Il modulo è scritto in TypeScript e non dipende da React, DOM, stato applicativo o persistenza.

Il modulo comprende:

* rappresentazione HSL;
* conversioni tra esadecimale e HSL;
* normalizzazioni euristiche per tessuto e componenti biologici;
* range biologici euristici;
* validazione dei colori biologici.

Gli helper matematici `_sigL` e `_powS` restano privati al modulo.

L'interfaccia pubblica espone:

* `Hsl`;
* `HslNormalizer`;
* `BioComponent`;
* `BIO_RANGES`;
* funzioni di conversione;
* funzioni di normalizzazione;
* `normHex`;
* `validateBioColor`.

I test di caratterizzazione sono mantenuti nel singolo file `tests/color.characterization.test.ts`. I 53 test coprono il comportamento corrente del blocco, inclusi limiti e comportamenti fuori dagli intervalli nominali, senza attribuire validità scientifica alle curve o ai range.

La validazione biologica è disponibile nel dominio, ma non è ancora integrata nella UI.

La struttura è mantenuta intenzionalmente minima: non vengono create cartelle, moduli di re-export o file di tipi separati finché la complessità effettiva non li rende necessari.

Il service worker è generato da `vite-plugin-pwa`. Non esistono API o backend.

## Obiettivi

* rendere il motore cromatico indipendente da React;
* migrare progressivamente a TypeScript;
* consentire test deterministici in locale;
* isolare persistenza, analytics e pubblicità;
* mantenere il deploy su hosting statico indipendente dal provider;
* preparare, senza implementarla prematuramente, una futura distribuzione mobile.

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

* valore del colore;
* spazio colore e white point;
* origine: manuale, fotografia, dataset o misura;
* metadati di acquisizione disponibili;
* livello di affidabilità.

Il contratto corrente `BioComponent` distingue `skin`, `eyes` e `hair`. La UI usa ancora in alcuni punti `eye`; l'adattamento tra UI e dominio dovrà essere esplicito.

### Profilo

Deve distinguere valori continui e categorie derivate. Le categorie non devono sostituire i punteggi originali.

### Risultato

Deve includere:

* proposta o classificazione;
* score;
* confidenza o margine;
* motivazioni principali;
* avvertenze;
* versione del modello;
* seed, quando applicabile.

## Persistenza

`localStorage` può restare nella prima fase, ma deve essere racchiuso in un adapter con:

* schema versionato;
* valori predefiniti;
* validazione runtime;
* migrazioni;
* gestione esplicita degli errori;
* possibilità di sostituzione futura.

Le chiavi attuali `chs_*` devono essere migrate senza perdita di dati oppure supportate temporaneamente come legacy.

## Determinismo

Le funzioni del motore devono ricevere esplicitamente:

* input;
* configurazione/versione del modello;
* seed pseudocasuale.

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
2. **In corso:** definire i tipi fondamentali del dominio insieme ai blocchi che li richiedono e mantenere Vitest come test runner.
3. **Completato:** estrarre e caratterizzare il blocco cromatico di base, comprendente conversioni, normalizzazioni, range e validazione biologica.
4. **Prossimo:** estrarre come singolo incremento il blocco completo del profilo cromatico, comprendente contrasto, analisi del profilo e season detection.
5. Estrarre per blocchi coerenti fit cromatico, armonie, outfit e generazione.
6. Inserire un adapter per la persistenza.
7. Scomporre stato applicativo, componenti e feature.
8. Centralizzare design token e stili.
9. Rimuovere configurazioni obsolete solo dopo il deploy sostitutivo.

## Regola di revisione

Ogni blocco estratto deve avere:

* comportamento caratterizzato;
* tipi introdotti insieme ai contratti che li richiedono;
* test dei casi limite;
* nessuna dipendenza UI nel dominio;
* documentazione delle euristiche conservate;
* nessuna modifica simultanea e non necessaria alla presentazione;
* build PWA verificata.
