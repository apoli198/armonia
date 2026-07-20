# Stato del progetto

Ultimo aggiornamento: 20 luglio 2026.

## Identità

* Nome corrente: **Armonia**.
* Codice e metadati principali allineati al nome **Armonia**.
* Repository canonica: https://github.com/apoli198/armonia
* Strategia: web app/PWA prima, store successivamente.

## Baseline tecnica verificata

| Area                     | Stato                                                                |
| ------------------------ | -------------------------------------------------------------------- |
| Framework                | React 18.3.1                                                         |
| Build tool               | Vite 5.4.x                                                           |
| Linguaggio               | JavaScript/JSX con migrazione progressiva a TypeScript               |
| PWA                      | `vite-plugin-pwa` 0.20.x                                             |
| Icone UI                 | `lucide-react`                                                       |
| Persistenza              | `localStorage`                                                       |
| Hosting                  | configurazione Netlify presente                                      |
| Test automatici          | Vitest 3.2.7; 53 test di caratterizzazione                           |
| TypeScript               | migrazione graduale con `allowJs`; blocco cromatico di base estratto |
| Type-check               | disponibile tramite `npm run typecheck`                              |
| Test                     | disponibili tramite `npm test`                                       |
| Lockfile                 | `package-lock.json` presente                                         |
| Linting/formatting       | assenti                                                              |
| CI                       | assente                                                              |
| Backend                  | assente                                                              |
| Account/sincronizzazione | assenti                                                              |

L'installazione riproducibile, il type-check e la build di produzione sono stati verificati il 18 luglio 2026 con `npm ci`, `npm run typecheck` e `npm run build`. `npm audit --omit=dev` non ha rilevato vulnerabilità nelle dipendenze distribuite in produzione. L'audit completo segnala tre vulnerabilità nella toolchain di sviluppo, due moderate e una alta; la correzione automatica proposta richiede aggiornamenti major non inclusi in questo incremento. Il repository contiene `package-lock.json`.

Il 19 luglio 2026 sono stati verificati localmente `npm test`, `npm run typecheck` e `npm run build` dopo l'introduzione di Vitest e l'estrazione delle conversioni cromatiche. I test introdotti sono test di caratterizzazione: documentano il comportamento corrente, ma non dimostrano la correttezza scientifica delle formule.

Il 20 luglio 2026 sono stati verificati localmente `npm test`, `npm run typecheck` e `npm run build` dopo il completamento del blocco cromatico di base. La verifica comprende 53 test di caratterizzazione.

Conversioni, normalizzazioni, range biologici e validazione sono stati estratti senza modificare intenzionalmente formule, parametri, soglie o output. Le curve e i range restano euristiche non validate scientificamente.

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

`src/color.ts` contiene:

* i tipi `Hsl` e `HslNormalizer`;
* il tipo finito `BioComponent`;
* le conversioni pure `hexToHsl` e `hslToHex`;
* le normalizzazioni euristiche `normFabric`, `normBioSkin`, `normBioEyes` e `normBioHair`;
* l'orchestrazione `normHex`;
* i range euristici `BIO_RANGES`;
* la funzione `validateBioColor`.

Il modulo è indipendente da React, DOM, stato applicativo e persistenza.

`tests/color.characterization.test.ts` verifica:

* colori canonici e casi acromatici;
* conversioni e round trip;
* normalizzazione e clamp dei valori HSL;
* curve euristiche;
* valori fuori dagli intervalli nominali;
* output esadecimali normalizzati;
* contenuto dei range biologici;
* inclusività dei limiti;
* applicazione opzionale della normalizzazione;
* fallback runtime per componenti sconosciuti.

La maggior parte dell'applicazione resta concentrata in `src/App.jsx`, che contiene:

* classificazione del contrasto;
* analisi del profilo;
* season detection;
* valutazione del fit;
* generazione delle armonie;
* pesi dei capi;
* persistenza;
* tema;
* componenti e schermate.

## Funzioni disponibili

* selezione di colore per pelle, occhi e capelli;
* campionamento di un colore da immagine caricata;
* indicazione manuale di riflessi e sottotono;
* classificazione in un modello a 12 stagioni;
* configurazione dei capi come automatici, fissi o esclusi;
* gestione di colori secondari, pattern e materiali;
* generazione di combinazioni monocromatiche, analoghe, complementari, split, triadiche, tetradiche, neutre, earth, pastello e deep;
* valutazione euristica “fuori palette” e “combo errata”;
* salvataggio locale delle preferenze;
* modalità chiara e scura;
* installabilità PWA e cache offline.

## Rischi principali

### Scientifici

* Il motore usa HSL, che non è uno spazio percettivamente uniforme.
* Le trasformazioni “screen to real-world” sono curve costruite manualmente e non calibrate su misure.
* Soglie, pesi e range biologici non sono associati a dataset o fonti.
* La classificazione stagionale è deterministica ma non restituisce confidenza o alternative vicine.
* Il campionamento fotografico non controlla illuminazione, bilanciamento del bianco, camera, esposizione o profilo colore.
* Le regole di armonia implementate non derivano attualmente da un modello psicofisico validato.

### Tecnici

* Elevato accoppiamento residuo in `src/App.jsx`, nonostante il completamento del primo blocco TypeScript del dominio.
* Il bootstrap, la configurazione e `src/color.ts` sono tipizzati, ma il resto del dominio cromatico, la persistenza e i dati salvati restano non tipizzati e privi di validazione runtime.
* `validateBioColor` è disponibile e testata, ma non è attualmente collegata alla UI.
* La UI usa in alcuni punti la chiave `eye`, mentre il contratto del dominio usa `eyes`; la corrispondenza dovrà essere gestita esplicitamente prima dell'integrazione.
* Le stringhe esadecimali non vengono ancora validate a runtime prima della conversione.
* La generazione è basata anche su `Date.now()`, quindi non è completamente riproducibile dall'esterno.
* È presente una dipendenza specifica da Netlify nella configurazione di deploy.
* Gli stili sono prevalentemente inline e difficili da governare come design system.

### Prodotto

* Primo avvio già operativo, ma senza percorso guidato o spiegazione dell'incertezza.
* L'interfaccia può suggerire una precisione superiore a quella realmente dimostrata.
* Nessuna infrastruttura per analytics, consenso o pubblicità.

## Incrementi completati

* introdotto Vitest 3.2.7 senza configurazione separata;
* aggiunto il comando `npm test`;
* definiti i tipi `Hsl`, `HslNormalizer` e `BioComponent`;
* estratte `hexToHsl` e `hslToHex` in `src/color.ts`;
* estratte `normFabric`, `normBioSkin`, `normBioEyes`, `normBioHair` e `normHex`;
* mantenuti privati gli helper `_sigL` e `_powS`;
* estratti e tipizzati i range euristici `BIO_RANGES`;
* estratta e tipizzata `validateBioColor`;
* documentata esplicitamente la natura euristica e non validata dei range biologici;
* aggiunti 53 test di caratterizzazione;
* caratterizzati limiti inclusivi, normalizzazione opzionale e fallback runtime;
* mantenuto invariato il comportamento intenzionale dell'applicazione;
* verificati test, type-check e build di produzione.

## Prossima attività

Estrarre come singolo incremento coerente il blocco completo del profilo cromatico, senza suddividerlo in micro-estrazioni.

Il blocco dovrà comprendere:

1. caratterizzazione di `classifyContrastLevel`, `analyzeProfile` e `detectSeason`;
2. tipi per riflessi, profilo, categorie derivate, identificatori di stagione e risultato;
3. estrazione delle funzioni pure e delle costanti di dominio collegate;
4. separazione tra identificatore della stagione e metadati puramente presentazionali;
5. documentazione di ogni peso, soglia e fallback come euristica;
6. conservazione degli output correnti durante la migrazione.

Potranno essere creati nuovi file o una cartella di dominio solo se necessari per mantenere il blocco coeso e leggibile.

Criterio di completamento del prossimo incremento: analisi del profilo e season detection invocabili senza React, contratti tipizzati, comportamento corrente coperto da test, test, type-check e build positivi e nessuna regressione intenzionale nella UI.
