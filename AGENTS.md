# Istruzioni di lavoro — Armonia

## Obiettivo

Sviluppare una web app/PWA React affidabile per l'analisi cromatica personale
e le combinazioni di abbigliamento, imparando TypeScript attraverso il progetto.

Il codice iniziale è stato generato da AI. Non assumere che formule, commenti,
nomi, soglie o scelte architetturali siano corretti o giustificati.

## Fonti del progetto

- Repository ufficiale: https://github.com/apoli198/armonia
- Prima di analizzare il progetto, leggere il branch main aggiornato su GitHub.
- Leggere README.md, docs/PROJECT_STATUS.md e i file coinvolti.
- Per il motore leggere anche docs/COLOR_ENGINE_SPEC.md e le fonti pertinenti.
- Segnalare contraddizioni tra codice, test, documentazione ed evidenze.
- Le nuove istruzioni esplicite del proprietario prevalgono sui documenti.

## Consegna e operatività

- Fornire codice e documenti direttamente in chat.
- Per ogni documento modificato fornire l'intero contenuto aggiornato:
  niente frammenti, patch o sezioni da assemblare.
- Fornire integralmente ogni nuovo file di codice.
- Per modifiche mirate a file di codice esistenti sono ammesse sostituzioni
  precise; se viene richiesto il file completo, riportarlo senza omissioni.
- Usare GitHub esclusivamente per lettura e verifica.
- Non modificare risorse remote e non eseguire autonomamente commit, push,
  merge o apertura di pull request.
- Il proprietario applica e verifica le modifiche nella propria working copy.
- Prima delle modifiche indicare obiettivo, file coinvolti, rischi,
  istruzioni di applicazione e criteri di completamento.
- Valutare gli output reali prima di dichiarare riusciti test, type-check,
  build o verifiche manuali. Distinguere eventuali prove temporanee dalle
  verifiche eseguite sulla working copy.

## Metodo per ogni incremento

1. Ricostruire il comportamento del blocco e le sue dipendenze.
2. Revisionare matematica, significato delle grandezze e fondamento scientifico.
3. Individuare errori, assunzioni, euristiche e limiti delle evidenze.
4. Definire contratti TypeScript e controlli runtime.
5. Implementare l'estrazione e le correzioni motivate.
6. Aggiungere i test appropriati e confrontare i cambiamenti con la baseline.
7. Verificare l'integrazione e aggiornare soltanto la documentazione necessaria.

Non usare deadline, calendari, stime temporali o scadenze per guidare il lavoro.
Procedere per dipendenze, priorità e criteri di completamento.

## Imparare facendo

- Spiegare le scelte TypeScript nel punto in cui vengono introdotte.
- Collegare tipi, union, tuple, narrowing e generics a necessità reali del codice.
- Distinguere controlli statici, validazione runtime e correttezza del modello.
- Spiegare anche il comportamento JavaScript che stiamo sostituendo.
- Evitare astrazioni introdotte soltanto per mostrare una funzionalità del linguaggio.
- Tenere le spiegazioni didattiche in chat; non accumulare tutorial nei documenti.

## Revisione scientifica

- Ogni incremento del motore comprende la revisione delle formule coinvolte.
- Usare fonti primarie per colorimetria, matematica e risultati sperimentali.
- Documentare unità, intervalli, assunzioni e provenienza di soglie e pesi.
- Distinguere conformità a standard, verifica implementativa,
  validazione sperimentale e utilità di prodotto.
- Correggere gli errori dimostrati con test di regressione.
- I test di caratterizzazione descrivono la baseline:
  non obbligano a conservarne gli errori.
- Non sostituire coefficienti arbitrari con altri coefficienti arbitrari
  presentandoli come una correzione scientifica.
- Isolare le euristiche ancora necessarie e dichiararne i limiti.
- Se mancano dati o esperimenti, indicare cosa resta non validato.
- Non inventare fonti, risultati, benchmark, probabilità o livelli di confidenza.

## Vincoli tecnici

- Conservare React e Vite; migrare progressivamente a TypeScript.
- Nessuna riscrittura completa senza una necessità dimostrata.
- Estrarre blocchi coerenti, iniziando dalla logica pura.
- Separare dominio, UI, stato, persistenza e integrazioni esterne.
- Il dominio non deve dipendere da React, DOM o localStorage.
- Evitare any; modellare esplicitamente gli insiemi finiti.
- Validare i dati esterni e persistiti prima di considerarli conformi ai tipi.
- Rendere il motore deterministico; passare esplicitamente il seed quando serve.
- Non introdurre dipendenze, backend o infrastrutture senza una necessità concreta.
- Separare le modifiche al motore da quelle alla presentazione, salvo necessità.
- Preservare i dati salvati o definire una migrazione verificabile.
- Mantenere accessibilità, responsive design e funzionamento PWA.
- Non inserire segreti, dati personali o materiale non redistribuibile.
- Non aggiungere automaticamente una licenza.
- Il proprietario decide quando registrare o pubblicare le modifiche.

## Verifiche

Usare i controlli pertinenti all'intervento:

- conformità numerica a riferimenti e tolleranze dichiarate;
- caratterizzazione della baseline;
- proprietà, casi limite e regressioni;
- validazione su dati quando si fanno affermazioni empiriche;
- npm test;
- npm run typecheck;
- npm run build;
- verifica manuale delle funzionalità coinvolte e della PWA.

Un controllo positivo non dimostra automaticamente la correttezza degli altri aspetti.

## Documentazione temporanea

AGENTS.md e i documenti in docs/ servono a sostenere lo sviluppo corrente.

- Conservare problemi aperti, vincoli attivi e informazioni necessarie al prossimo lavoro.
- Eliminare attività concluse, piani superati, duplicazioni e strutture ipotetiche.
- Non usare i documenti come diario delle conversazioni o registro di ogni intervento.
- Mantenere una sola sede per ciascuna informazione.
- Trasferire contratti e fonti indispensabili vicino al codice e ai test pertinenti.
- A conclusione dello sviluppo rimuovere i documenti temporanei, dopo aver
  conservato nel README e nel codice le informazioni necessarie all'uso
  e alla manutenzione.
- Quando un documento viene rimosso, aggiornare anche tutti i riferimenti.
