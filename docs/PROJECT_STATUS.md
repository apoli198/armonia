# Stato di sviluppo

Base del codice esaminata: main, commit
48dcfa7f3c4b773894cb30bc0dc5ee44685fba21.

Questo documento contiene soltanto stato rilevante, problemi aperti
e prossimo incremento. Le attività concluse vanno rimosse quando
non servono più a comprendere il lavoro restante.

## Codice presente

- src/App.jsx contiene profilo, stagioni, fit, armonie, generazione,
  stato, persistenza e maggior parte della UI.
- src/color.ts contiene tipi HSL, conversioni HEX/HSL,
  normalizzazioni euristiche, BIO_RANGES e validateBioColor.
- tests/color.characterization.test.ts caratterizza il blocco colore.
- Bootstrap React e configurazione Vite sono già in TypeScript.
- Persistenza locale e configurazione PWA sono presenti.
- CI e linting non sono presenti.
- L'estrazione proposta in src/profile.ts non è presente su questo main.

La documentazione precedente riporta 53 test e una verifica positiva
di test, type-check e build il 20 luglio 2026.
Quell'esito storico non certifica il codice corrente o modifiche successive.

## Revisione preliminare: problemi ancora aperti

### Blocco colore

- hexToHsl accetta alcune stringhe malformate o le interpreta parzialmente.
- Valori NaN o infiniti non hanno una gestione esplicita e coerente.
- validateBioColor può accedere a proprietà ereditate per chiavi
  come toString o constructor e generare un errore.
- Le curve normFabric e normBio\* non sono una calibrazione dimostrata.
- BIO_RANGES esprime vincoli euristici, non plausibilità biologica validata.
- validateBioColor non è collegata alla UI.
- La UI usa anche eye, mentre BioComponent usa eyes:
  i contratti vanno distinti o adattati esplicitamente.

### Profilo

- Il punteggio del sottotono tratta la hue della pelle come un numero lineare,
  producendo una discontinuità vicino a 0°/360°.
- hairReflectivity non è una misura calibrata della riflettanza.
- Profondità e contrasto dipendono da lightness HSL trasformate euristicamente.
- Pesi, soglie, correzioni dei riflessi e mapping stagionale non sono validati.
- Il risultato non rappresenta alternative o ambiguità.

### Integrazione

- I dati persistiti non hanno ancora un contratto runtime affidabile.
- La generazione dipende anche da Date.now() e non espone un seed riproducibile.
- Non sono presenti nel repository evidenze sufficienti per dichiarare
  validato il modello di raccomandazione.

## Prossimo incremento: revisione del blocco colore

Obiettivo: correggere i contratti di ingresso e separare le conversioni
dalle trasformazioni euristiche prima di proseguire con il profilo.

Lavoro:

1. Definire formati supportati, unità e gestione degli input non validi.
2. Verificare i chiamanti e i dati persistiti prima di rendere i controlli più severi.
3. Aggiungere test di conformità, contratto e regressione.
4. Correggere parsing, valori non finiti e controllo dei componenti.
5. Separare le trasformazioni non calibrate dalle conversioni standard.
6. Spiegare i tipi e i controlli TypeScript introdotti.

File da esaminare: src/color.ts, tests/color.characterization.test.ts
e i chiamanti pertinenti in src/App.jsx.
Nuovi file soltanto se servono a rendere chiaro il confine.

Rischio principale: un controllo più severo può far emergere dati salvati
non validi e interrompere la UI se non viene gestito al confine.

## Criteri di completamento

- Contratti di ingresso espliciti e comportamento degli errori verificato.
- Conversioni confrontate con riferimenti e tolleranze dichiarate.
- Test di regressione per i difetti corretti.
- Trasformazioni euristiche riconoscibili e limiti documentati.
- Dati salvati e chiamanti compatibili con il nuovo contratto.
- Test, type-check, build e verifica manuale pertinenti positivi,
  sulla base degli output reali del proprietario.

## Passo successivo

Dopo la chiusura del blocco colore, revisionare ed estrarre il profilo:
contrasto, analisi e classificazione stagionale.

La sola estrazione invariata proposta in precedenza è superata.
Le correzioni devono essere motivate e confrontate con la baseline.
