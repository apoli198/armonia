# Stato del progetto

Ultimo aggiornamento: 19 luglio 2026.

## Identità

- Nome corrente: **Armonia**.
- Codice e metadati principali allineati al nome **Armonia**.
- Repository canonica: https://github.com/apoli198/armonia
- Strategia: web app/PWA prima, store successivamente.

## Baseline tecnica verificata

| Area | Stato |
|---|---|
| Framework | React 18.3.1 |
| Build tool | Vite 5.4.x |
| Linguaggio | JavaScript/JSX con bootstrap e configurazione TypeScript |
| PWA | `vite-plugin-pwa` 0.20.x |
| Icone UI | `lucide-react` |
| Persistenza | `localStorage` |
| Hosting | configurazione Netlify presente |
| Test automatici | Vitest 3.2.7; primi test di caratterizzazione presenti |
| TypeScript | migrazione graduale con `allowJs`; primo modulo cromatico estratto |
| Type-check | disponibile tramite `npm run typecheck` |
| Test | disponibili tramite `npm test` |
| Lockfile | `package-lock.json` presente |
| Linting/formatting | assenti |
| CI | assente |
| Backend | assente |
| Account/sincronizzazione | assenti |

L'installazione riproducibile, il type-check e la build di produzione sono stati verificati il 18 luglio 2026 con `npm ci`, `npm run typecheck` e `npm run build`. `npm audit --omit=dev` non ha rilevato vulnerabilità nelle dipendenze distribuite in produzione. L'audit completo segnala tre vulnerabilità nella toolchain di sviluppo, due moderate e una alta; la correzione automatica proposta richiede aggiornamenti major non inclusi in questo incremento. Il repository contiene ora `package-lock.json`.
Il 19 luglio 2026 sono stati verificati localmente `npm test`, `npm run typecheck` e `npm run build` dopo l'introduzione di Vitest e l'estrazione delle conversioni cromatiche. I test introdotti sono test di caratterizzazione: documentano il comportamento corrente, ma non dimostrano la correttezza scientifica delle formule.

## Struttura corrente

```text
```text
src/
  App.jsx
  color.ts
  index.css
  main.tsx
  vite-env.d.ts
tests/
  color.characterization.test.ts
public/
  apple-touch-icon.png
  icon-192.png
  icon-512.png
package.json
package-lock.json
tsconfig.json
vite.config.ts
netlify.toml
```

`src/color.ts` contiene le conversioni pure `hexToHsl` e `hslToHex`, tipizzate tramite la tupla `Hsl` e indipendenti da React, DOM, stato e persistenza.

`tests/color.characterization.test.ts` verifica colori canonici, casi acromatici, normalizzazione e clamp dei valori HSL e round trip rappresentativi.

La maggior parte dell'applicazione resta concentrata in `src/App.jsx`, che contiene:

- normalizzazioni euristiche;
- classificazione del profilo;
- season detection;
- valutazione del fit;
- generazione delle armonie;
- pesi dei capi;
- persistenza;
- tema;
- componenti e schermate.

## Funzioni disponibili

- selezione di colore per pelle, occhi e capelli;
- campionamento di un colore da immagine caricata;
- indicazione manuale di riflessi e sottotono;
- classificazione in un modello a 12 stagioni;
- configurazione dei capi come automatici, fissi o esclusi;
- gestione di colori secondari, pattern e materiali;
- generazione di combinazioni monocromatiche, analoghe, complementari, split, triadiche, tetradiche, neutre, earth, pastello e deep;
- valutazione euristica “fuori palette” e “combo errata”;
- salvataggio locale delle preferenze;
- modalità chiara e scura;
- installabilità PWA e cache offline.

## Rischi principali

### Scientifici

- Il motore usa HSL, che non è uno spazio percettivamente uniforme.
- Le trasformazioni “screen to real-world” sono curve costruite manualmente e non calibrate su misure.
- Soglie, pesi e range biologici non sono associati a dataset o fonti.
- La classificazione stagionale è deterministica ma non restituisce confidenza o alternative vicine.
- Il campionamento fotografico non controlla illuminazione, bilanciamento del bianco, camera, esposizione o profilo colore.
- Le regole di armonia implementate non derivano attualmente da un modello psicofisico validato.

### Tecnici

- Elevato accoppiamento residuo in `src/App.jsx`, nonostante la prima estrazione delle conversioni pure.
- Il bootstrap, la configurazione e `src/color.ts` sono tipizzati, ma il resto del dominio cromatico, la persistenza e i dati salvati restano non tipizzati e privi di validazione runtime.
- Generazione basata anche su `Date.now()`, quindi non completamente riproducibile dall'esterno.
- Dipendenza specifica da Netlify nella configurazione di deploy.
- Stili prevalentemente inline, difficili da governare come design system.

### Prodotto

- Primo avvio già operativo, ma senza percorso guidato o spiegazione dell'incertezza.
- L'interfaccia può suggerire una precisione superiore a quella realmente dimostrata.
- Nessuna infrastruttura per analytics, consenso o pubblicità.

## Incremento completato

- introdotto Vitest 3.2.7 senza configurazione separata;
- aggiunto il comando `npm test`;
- definita la tupla TypeScript `Hsl`;
- estratte `hexToHsl` e `hslToHex` in `src/color.ts`;
- aggiunti test di caratterizzazione per conversioni, clamp, normalizzazione e round trip;
- mantenuto invariato il comportamento intenzionale dell'applicazione;
- verificati test, type-check e build di produzione.

## Prossima attività

Proseguire la separazione incrementale del dominio senza modificare le formule:

1. caratterizzare le funzioni pure di normalizzazione HSL;
2. estrarre tali funzioni nello stesso `src/color.ts`, finché il file resta coeso e leggibile;
3. evitare nuove cartelle o file finché non esiste una necessità concreta;
4. mantenere distinti test di caratterizzazione e futuri test di conformità colorimetrica.

Criterio di completamento del prossimo incremento: normalizzazioni invocabili senza React, comportamento corrente coperto da test, type-check e build positivi, nessuna regressione intenzionale nella UI.
