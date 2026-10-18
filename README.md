# Armonia

Armonia è una web app/PWA React per l'analisi cromatica personale
e la generazione di combinazioni di abbigliamento.

Il progetto viene sviluppato per incrementi, con due obiettivi:
costruire un'app affidabile e imparare TypeScript lavorando sul codice reale.

> Il motore corrente contiene euristiche non validate.
> La classificazione stagionale non è una misura scientifica o una diagnosi.
> Un colore campionato da una fotografia non calibrata non equivale
> a una misura del colore fisico.

## Funzionalità attuali

- Selezione manuale dei colori di pelle, occhi e capelli.
- Campionamento da un'immagine caricata.
- Selezione di riflessi e volume dei capelli.
- Classificazione euristica nel modello a 12 stagioni.
- Configurazione dei capi come automatici, fissi o esclusi.
- Generazione di combinazioni di colori e valutazioni euristiche.
- Salvataggio locale delle preferenze.
- Interfaccia mobile con tema chiaro e scuro.
- Configurazione PWA per installazione e cache offline.

## Base tecnica

- React 18 e Vite 5.
- JavaScript/JSX con migrazione progressiva a TypeScript.
- Vitest per i test.
- localStorage per la persistenza.
- vite-plugin-pwa per la PWA.
- Configurazione di deploy Netlify presente.

La maggior parte dell'applicazione è ancora in src/App.jsx.
src/color.ts contiene conversioni HEX/HSL e operazioni angolari.
src/color-heuristics.ts raccoglie curve e range legacy non validati.
src/profile.ts contiene analisi e classificazione euristiche, identificate
con versione del modello e stato di validazione espliciti.

Il prossimo incremento introduce una base colorimetrica verificabile
prima della revisione del profilo e dell'estrazione degli altri algoritmi.

Ogni incremento del motore comprende analisi del comportamento,
revisione matematica e scientifica, contratti TypeScript e test.
La migrazione non deve conservare errori dimostrati.

## Avvio locale

Usare una versione di Node.js compatibile con le dipendenze del progetto e npm.

```bash
npm ci
npm run dev
```

## Verifica e build

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

I test di caratterizzazione presenti descrivono il comportamento precedente.
Non costituiscono da soli una validazione scientifica del motore.

## Direzione del prodotto

La priorità è l'affidabilità del motore, seguita da semplicità d'uso
e coerenza visiva. Il primo risultato deve richiedere pochi passaggi,
con dettagli avanzati accessibili successivamente.

L'obiettivo di accessibilità è WCAG 2.2 AA.
Gli effetti ispirati ai pattern Apple e Liquid Glass non devono alterare
la percezione dei campioni cromatici o compromettere la leggibilità.

La distribuzione parte dal web/PWA. Pubblicità e store saranno affrontati
quando esisteranno requisiti e condizioni concrete per sostenerli.
Eventuali inserzioni dovranno essere isolate dal motore e dai campioni,
senza interrompere il percorso verso il primo risultato.

## Documentazione di sviluppo

- [Metodo di lavoro](AGENTS.md)
- [Stato e prossimo incremento](docs/PROJECT_STATUS.md)
- [Revisione del motore e verifiche](docs/COLOR_ENGINE_SPEC.md)
- [Fonti pertinenti](docs/SCIENTIFIC_SOURCES.md)

Questi documenti sono temporanei: vengono snelliti durante lo sviluppo
e rimossi quando non sono più necessari.

## Repository e licenza

Repository ufficiale: https://github.com/apoli198/armonia

Il repository è destinato anche all'uso come portfolio.
Non includere segreti, dati personali o materiale non redistribuibile.

Licenza non ancora definita.
