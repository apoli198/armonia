# Stato del progetto

Ultimo aggiornamento: 20 luglio 2026.

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
| Linguaggio | JavaScript/JSX con migrazione progressiva a TypeScript |
| PWA | `vite-plugin-pwa` 0.20.x |
| Icone UI | `lucide-react` |
| Persistenza | `localStorage` |
| Hosting | configurazione Netlify presente |
| Test automatici | Vitest 3.2.7; 41 test di caratterizzazione su conversioni e normalizzazioni |
| TypeScript | migrazione graduale con `allowJs`; conversioni e normalizzazioni cromatiche estratte |
| Type-check | disponibile tramite `npm run typecheck` |
| Test | disponibili tramite `npm test` |
| Lockfile | `package-lock.json` presente |
| Linting/formatting | assenti |
| CI | assente |
| Backend | assente |
| Account/sincronizzazione | assenti |

L'installazione riproducibile, il type-check e la build di produzione sono stati verificati il 18 luglio 2026 con `npm ci`, `npm run typecheck` e `npm run build`. `npm audit --omit=dev` non ha rilevato vulnerabilità nelle dipendenze distribuite in produzione. L'audit completo segnala tre vulnerabilità nella toolchain di sviluppo, due moderate e una alta; la correzione automatica proposta richiede aggiornamenti major non inclusi in questo incremento. Il repository contiene `package-lock.json`.

Il 19 luglio 2026 sono stati verificati localmente `npm test`, `npm run typecheck` e `npm run build` dopo l'introduzione di Vitest e l'estrazione delle conversioni cromatiche. I test introdotti sono test di caratterizzazione: documentano il comportamento corrente, ma non dimostrano la correttezza scientifica delle formule.

Il 20 luglio 2026 sono stati verificati localmente `npm test`, `npm run typecheck` e `npm run build` dopo l'estrazione delle normalizzazioni HSL. La verifica comprende 41 test di caratterizzazione. Le curve, i parametri e i comportamenti fuori dagli intervalli nominali sono stati preservati senza correzioni scientifiche intenzionali.

## Struttura corrente

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

`src/color.ts` contiene le conversioni pure `hexToHsl` e `hslToHex`, le normalizzazioni euristiche `normFabric`, `normBioSkin`, `normBioEyes` e `normBioHair` e l'orchestrazione `normHex`. Il modulo usa i tipi `Hsl` e `HslNormalizer` ed è indipendente da React, DOM, stato e persistenza.

`tests/color.characterization.test.ts` verifica colori canonici, casi acromatici, round trip, normalizzazione della hue, clamp delle conversioni, curve euristiche, valori fuori dagli intervalli nominali e output esadecimali normalizzati.

La maggior parte dell'applicazione resta concentrata in `src/App.jsx`, che contiene:

- validazione dei colori biologici;
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

- Elevato accoppiamento residuo in `src/App.jsx`, nonostante l'estrazione delle conversioni e delle normalizzazioni pure.
- Il bootstrap, la configurazione e `src/color.ts` sono tipizzati, ma il resto del dominio cromatico, la persistenza e i dati salvati restano non tipizzati e privi di validazione runtime.
- Generazione basata anche su `Date.now()`, quindi non completamente riproducibile dall'esterno.
- Dipendenza specifica da Netlify nella configurazione di deploy.
- Stili prevalentemente inline, difficili da governare come design system.

### Prodotto

- Primo avvio già operativo, ma senza percorso guidato o spiegazione dell'incertezza.
- L'interfaccia può suggerire una precisione superiore a quella realmente dimostrata.
- Nessuna infrastruttura per analytics, consenso o pubblicità.

## Incrementi completati

- introdotto Vitest 3.2.7 senza configurazione separata;
- aggiunto il comando `npm test`;
- definite le tuple e le firme TypeScript `Hsl` e `HslNormalizer`;
- estratte `hexToHsl` e `hslToHex` in `src/color.ts`;
- estratte nello stesso modulo `normFabric`, `normBioSkin`, `normBioEyes`, `normBioHair` e `normHex`;
- mantenuti privati gli helper `_sigL` e `_powS`;
- aggiunti 41 test di caratterizzazione per conversioni, clamp, round trip, curve di normalizzazione, casi fuori range e output esadecimali;
- documentato che saturazioni superiori a 100 e lightness fuori intervallo non vengono limitate prima delle curve correnti;
- mantenuto invariato il comportamento intenzionale dell'applicazione;
- verificati test, type-check e build di produzione.

## Prossima attività

Proseguire la separazione incrementale del dominio senza modificare le euristiche:

1. caratterizzare `BIO_RANGES` e `validateBioColor`;
2. definire un tipo finito per i componenti biologici `skin`, `eyes` e `hair`;
3. estrarre la validazione nello stesso `src/color.ts`, finché il modulo resta coeso e leggibile;
4. mantenere i range correnti esplicitamente classificati come euristiche non validate;
5. non modificare contemporaneamente range, soglie o comportamento della UI.

Criterio di completamento del prossimo incremento: validazione dei colori biologici invocabile senza React, casi limite coperti da test, input tipizzati, test, type-check e build positivi e nessuna regressione intenzionale nella UI.
