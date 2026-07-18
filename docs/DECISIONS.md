# Registro delle decisioni

## Stati

- **Proposta**: da valutare.
- **Accettata**: vincolante finché non sostituita.
- **Superata**: sostituita da una decisione successiva.
- **Rifiutata**: valutata e non adottata.

## D-001 — Web-first

- Data: 18 luglio 2026.
- Stato: Accettata.
- Decisione: Armonia viene sviluppata e distribuita inizialmente come web app/PWA.
- Motivazione: ridurre costi e attrito di distribuzione, validare il prodotto prima degli store.
- Conseguenze: il deploy deve essere static-hosting friendly; store e packaging mobile non sono milestone iniziali.

## D-002 — TypeScript prima della revisione profonda

- Data: 18 luglio 2026.
- Stato: Accettata.
- Decisione: migrare progressivamente a TypeScript e isolare il dominio prima di modificare in modo sostanziale gli algoritmi.
- Motivazione: rendere contratti, test e regressioni più controllabili.
- Conseguenze: la prima migrazione deve preservare il comportamento con test di caratterizzazione.

## D-003 — Correttezza scientifica prioritaria

- Data: 18 luglio 2026.
- Stato: Accettata.
- Decisione: la revisione scientifica del motore viene prima di UI, UX, monetizzazione e store, immediatamente dopo la base TypeScript/testabile.
- Motivazione: un'app esteticamente riuscita ma con risultati inaffidabili non soddisfa la funzione principale.
- Conseguenze: le milestone grafiche possono slittare; le affermazioni di accuratezza devono essere limitate.

## D-004 — Repository pubblica come portfolio

- Data: 18 luglio 2026.
- Stato: Accettata.
- Decisione: la repository è destinata a essere pubblica e collegabile dal CV.
- Motivazione: mostrare architettura, qualità del codice, test e processo scientifico.
- Conseguenze: nessun segreto, dato personale, dataset proprietario o materiale non redistribuibile nel repository.

## D-005 — Repository come unica fonte del progetto ChatGPT

- Data: 18 luglio 2026.
- Stato: Accettata.
- Decisione: il progetto ChatGPT riceverà come fonte il solo link della repository.
- Motivazione: evitare duplicazioni e contesto divergente tra chat.
- Conseguenze: decisioni, stato, fonti e specifiche devono essere mantenuti nel repository; le chat non sono fonte ufficiale.

## D-006 — Conservare React e Vite

- Data: 18 luglio 2026.
- Stato: Accettata.
- Decisione: mantenere React e Vite durante la ristrutturazione.
- Motivazione: non esiste al momento una necessità dimostrata di riscrittura tecnologica.
- Conseguenze: migrazione incrementale; nessun cambio framework insieme alla revisione del motore.

## D-007 — Nessun backend prematuro

- Data: 18 luglio 2026.
- Stato: Accettata.
- Decisione: non introdurre un backend finché non esiste un requisito concreto di account, sincronizzazione, protezione di dati/modelli o elaborazione server-side.
- Motivazione: limitare costi e complessità nella fase di validazione.
- Conseguenze: prima beta locale-first; eventuale motore privato sarà una decisione separata.

## D-008 — Pubblicità tramite adapter

- Data: 18 luglio 2026.
- Stato: Accettata.
- Decisione: predisporre slot pubblicitari indipendenti dal provider.
- Motivazione: distinguere provider web e mobile e impedire l'accoppiamento con la UI.
- Conseguenze: nessun SDK pubblicitario direttamente nei componenti di dominio o feature.

## D-009 — Design dopo l'affidabilità minima

- Data: 18 luglio 2026.
- Stato: Accettata.
- Decisione: il redesign completo e l'adozione di effetti Liquid Glass avvengono dopo una prima revisione verificabile del motore.
- Motivazione: priorità al valore funzionale e rischio che trasparenze e sfondi alterino la percezione dei campioni.
- Conseguenze: prima design token e gerarchia; vetro limitato a navigazione e controlli, salvo verifiche di contrasto.

## D-010 — Modello corrente classificato come euristico

- Data: 18 luglio 2026.
- Stato: Accettata.
- Decisione: formule HSL, normalizzazioni, soglie, pesi e mapping stagionale correnti sono una baseline euristica finché non validati.
- Motivazione: il repository non contiene fonti o dati che ne dimostrino la calibrazione.
- Conseguenze: non usare “armocromia scientifica” nei metadati o nella UI durante questa fase.

## D-011 — Licenza della repository

- Data: 18 luglio 2026.
- Stato: Proposta.
- Decisione da prendere: scegliere tra assenza temporanea di licenza, licenza open source o licenza proprietaria esplicita.
- Vincolo: la decisione deve essere consapevole degli obiettivi portfolio, collaborazione e riuso.
- Conseguenze: non aggiungere automaticamente MIT, Apache o altre licenze.
