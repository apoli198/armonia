# Stato di sviluppo

Base dell'intervento: main, commit
31dcad8c968e2df12fe3bbafc87743e3da8df683.

## Codice presente

- src/color.ts contiene conversioni HEX/HSL e trasformazioni euristiche.
- src/profile.ts contiene contrasto, analisi del profilo e classificazione stagionale.
- src/App.jsx associa i risultati del profilo ai metadati di presentazione
  e contiene ancora fit, armonie, generazione, stato e persistenza.
- I due blocchi TypeScript hanno test di caratterizzazione.
- Bootstrap React e configurazione Vite sono in TypeScript.

## Correzioni tecniche preparate

- Contratto HEX limitato a #RRGGBB, verificato integralmente.
- Rifiuto di coordinate HSL non finite nella conversione verso HEX.
- Controllo esplicito dei componenti in validateBioColor.
- Normalizzazione dei riflessi prima dei lookup.
- Correzione del test con @ts-expect-error.
- Filtraggio dei colori persistiti e controllo della conferma nel selettore.
- Type-check richiesto prima della build.
- Test di contratto in tests/input.contract.test.ts.

Il controllo della persistenza riguarda i dati cromatici coinvolti.
Non costituisce una revisione completa dello storage.

## Verifica dell'intervento

Nella copia temporanea preparata dall'assistente:

- 143 test positivi;
- type-check positivo;
- build e generazione PWA positive;
- rendering iniziale positivo con default e alcuni dati persistiti corrotti.

Restano da verificare nella working copy del proprietario:

- applicazione corretta delle modifiche;
- npm test;
- npm run build, che comprende il type-check;
- selettore HEX, colori salvati e riflessi;
- generazione degli outfit;
- ricaricamento, persistenza e funzionamento PWA.

L'intervento non è chiuso prima degli output reali e del controllo manuale.

## Prossimo incremento: revisione scientifica

Revisionare le formule dei due moduli TypeScript.

Problemi aperti:

- curve normFabric e normBio\* prive di calibrazione identificata;
- BIO_RANGES non validati come intervalli biologici;
- discontinuità del sottotono vicino a 0°/360°;
- uso della lightness HSL per profondità e contrasto;
- hairReflectivity priva di relazione calibrata con la riflettanza;
- pesi, soglie, riflessi e mapping stagionale non validati.

Le correzioni tecniche non attribuiscono validità scientifica al modello.
