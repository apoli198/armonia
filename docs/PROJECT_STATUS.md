# Stato del progetto

Ultimo aggiornamento: 18 luglio 2026.

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
| Test automatici | assenti |
| TypeScript | baseline presente; migrazione graduale con `allowJs` |
| Type-check | disponibile tramite `npm run typecheck` |
| Lockfile | `package-lock.json` presente |
| Linting/formatting | assenti |
| CI | assente |
| Backend | assente |
| Account/sincronizzazione | assenti |

L'installazione riproducibile, il type-check e la build di produzione sono stati verificati il 18 luglio 2026 con `npm ci`, `npm run typecheck` e `npm run build`. `npm audit --omit=dev` non ha rilevato vulnerabilità nelle dipendenze distribuite in produzione. L'audit completo segnala tre vulnerabilità nella toolchain di sviluppo, due moderate e una alta; la correzione automatica proposta richiede aggiornamenti major non inclusi in questo incremento. Il repository contiene ora `package-lock.json`.

## Struttura corrente

```text
src/
  App.jsx       circa 1.352 righe
  index.css     circa 35 righe
  main.tsx
  vite-env.d.ts
public/
  apple-touch-icon.png
  icon-192.png
  icon-512.png
package-lock.json
tsconfig.json
vite.config.ts
netlify.toml
```

`src/App.jsx` contiene contemporaneamente:

- conversioni cromatiche;
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

- Elevato accoppiamento in un singolo file.
- Il bootstrap e la configurazione sono tipizzati, ma `App.jsx`, il dominio cromatico, la persistenza e i dati salvati restano non tipizzati e privi di validazione runtime.
- Generazione basata anche su `Date.now()`, quindi non completamente riproducibile dall'esterno.
- Dipendenza specifica da Netlify nella configurazione di deploy.
- Stili prevalentemente inline, difficili da governare come design system.

### Prodotto

- Primo avvio già operativo, ma senza percorso guidato o spiegazione dell'incertezza.
- L'interfaccia può suggerire una precisione superiore a quella realmente dimostrata.
- Nessuna infrastruttura per analytics, consenso o pubblicità.
- Nome, icona, manifest e README non sono ancora allineati ad Armonia.

## Prossima attività

Creare una baseline TypeScript senza cambiare intenzionalmente l'algoritmo:

## Prossima attività

Completare la milestone TypeScript e testabilità senza cambiare intenzionalmente l'algoritmo:

1. introdurre un test runner;
2. definire i primi tipi fondamentali del dominio;
3. aggiungere test di caratterizzazione della baseline;
4. estrarre le prime conversioni e utility pure;
5. rendere esplicito il seed nei moduli estratti.

Criterio di completamento: motore invocabile senza React almeno per i primi moduli estratti, test locali eseguibili con un singolo comando, build PWA funzionante e nessuna regressione intenzionale nell'interfaccia.
