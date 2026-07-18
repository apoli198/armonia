# Stato del progetto

Ultimo aggiornamento: 18 luglio 2026.

## Identità

- Nome corrente: **Armonia**.
- Nome ancora presente nel codice e nei metadati: **Color Harmony**.
- Repository canonica: https://github.com/apoli198/armonia
- Strategia: web app/PWA prima, store successivamente.

## Baseline tecnica verificata

| Area | Stato |
|---|---|
| Framework | React 18.3.1 |
| Build tool | Vite 5.4.x |
| Linguaggio | JavaScript/JSX |
| PWA | `vite-plugin-pwa` 0.20.x |
| Icone UI | `lucide-react` |
| Persistenza | `localStorage` |
| Hosting | configurazione Netlify presente |
| Test automatici | assenti |
| TypeScript | assente |
| Linting/formatting | assenti |
| CI | assente |
| Backend | assente |
| Account/sincronizzazione | assenti |

La build di produzione è stata verificata il 18 luglio 2026 con `npm install` e `npm run build`. L'installazione risolta in quella data ha segnalato tre vulnerabilità npm: due moderate e una alta. Il repository sorgente analizzato non conteneva un lockfile, quindi la risoluzione effettiva delle dipendenze può cambiare tra installazioni.

## Struttura corrente

```text
src/
  App.jsx       circa 1.352 righe
  index.css     circa 35 righe
  main.jsx
public/
  apple-touch-icon.png
  icon-192.png
  icon-512.png
vite.config.js
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
- Il testo PWA dichiara “Armocromia scientifica”, affermazione non supportata dallo stato corrente.

### Tecnici

- Elevato accoppiamento in un singolo file.
- Assenza di tipi, test e convalida runtime dei dati persistiti.
- Generazione basata anche su `Date.now()`, quindi non completamente riproducibile dall'esterno.
- Assenza di lockfile nel baseline analizzato.
- Dipendenza specifica da Netlify nella configurazione di deploy.
- Stili prevalentemente inline, difficili da governare come design system.

### Prodotto

- Primo avvio già operativo, ma senza percorso guidato o spiegazione dell'incertezza.
- L'interfaccia può suggerire una precisione superiore a quella realmente dimostrata.
- Nessuna infrastruttura per analytics, consenso o pubblicità.
- Nome, icona, manifest e README non sono ancora allineati ad Armonia.

## Prossima attività

Creare una baseline TypeScript senza cambiare intenzionalmente l'algoritmo:

1. aggiungere configurazione TypeScript;
2. estrarre conversioni e tipi del dominio;
3. aggiungere test di caratterizzazione;
4. rendere deterministico il motore nei test;
5. documentare ogni euristica estratta.

Criterio di completamento: stessa funzionalità utente, build locale funzionante, motore invocabile senza React e prima suite di test eseguibile.
