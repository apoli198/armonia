# Requisiti di prodotto

## Visione

Armonia deve aiutare una persona a scegliere colori e combinazioni di abbigliamento compatibili con le proprie caratteristiche cromatiche e con i capi disponibili, fornendo risultati comprensibili, modificabili e accompagnati da un livello di incertezza realistico.

## Strategia di distribuzione

1. Pubblicazione come web app/PWA.
2. Crescita dell'utenza e introduzione controllata di inserzioni.
3. Verifica della sostenibilità economica.
4. Pubblicazione su Play Store e App Store quando costi operativi e di distribuzione sono sostenibili.

## Principio di esperienza utente

Al primo avvio l'app deve essere immediatamente utilizzabile. La raccolta di dettagli aggiuntivi deve avvenire dopo il primo valore fornito, con progressive disclosure.

Flusso target:

```text
apertura
→ input minimo
→ primo risultato
→ incertezza e spiegazione essenziale
→ possibilità di affinare i dati
→ strumenti avanzati
```

## Utenti

### Utente essenziale

Vuole una risposta rapida, pochi controlli e suggerimenti direttamente utilizzabili.

### Utente avanzato

Vuole controllare input, capi, materiali, pattern, armonie, criteri di ranking e spiegazioni del risultato.

L'interfaccia principale deve servire l'utente essenziale senza rimuovere profondità all'utente avanzato.

## Requisiti funzionali prioritari

### P0 — affidabilità del motore

- input cromatici espliciti e validati;
- risultato riproducibile a parità di input e seed;
- separazione tra classificazione, compatibilità e generazione;
- visualizzazione della confidenza o dell'ambiguità;
- spiegazione delle caratteristiche che hanno contribuito al risultato;
- test automatici e dataset versionato;
- gestione dei casi fuori dominio.

### P0 — web app

- esecuzione locale e build di produzione;
- responsive mobile-first;
- installabilità PWA;
- funzionamento di base offline;
- persistenza locale resiliente a dati obsoleti;
- nessun obbligo di account nel primo rilascio.

### P1 — guardaroba e outfit

- includere, fissare o escludere capi;
- gestire colori principali e secondari;
- considerare pattern e materiali solo quando modellati in modo verificabile;
- generare alternative ordinate e non soltanto casuali;
- spiegare perché una proposta è stata favorita o penalizzata.

### P1 — UX

- home con azione primaria evidente;
- modalità rapida e modalità avanzata;
- correzione semplice degli input;
- nessun blocco iniziale con questionari estesi;
- stati vuoti e messaggi di errore comprensibili;
- accessibilità della navigazione e dei controlli.

### P2 — monetizzazione

- slot pubblicitari isolati dal layout principale;
- consenso e privacy coerenti con provider e giurisdizioni applicabili;
- nessuna inserzione tra input e primo risultato;
- nessuna inserzione sovrapposta ai campioni di colore;
- nessun layout shift significativo;
- adapter distinto tra provider web e provider mobile futuri.

### P3 — store

- valutazione separata tra wrapper web e implementazione più nativa;
- supporto delle linee guida delle piattaforme;
- costi di account, manutenzione e conformità sostenuti dal prodotto.

## Requisiti non funzionali

- funzioni del dominio preferibilmente pure e deterministiche;
- risultato del motore serializzabile;
- nessun segreto nel bundle client;
- privacy by default;
- accessibilità almeno WCAG 2.2 AA come obiettivo di progetto;
- prestazioni adeguate su smartphone di fascia media;
- assenza di dipendenza obbligatoria da uno specifico hosting statico;
- compatibilità con tema chiaro, scuro e preferenze di riduzione del movimento e trasparenza.

## Politica delle affermazioni

Fino al completamento della validazione:

- non usare “scientifico”, “accurato” o equivalenti senza qualificazione;
- descrivere la classificazione stagionale come modello estetico/euristico;
- non presentare risultati come diagnosi;
- mostrare incertezza e limiti dell'acquisizione fotografica;
- separare preferenza personale, armonia percepita e compatibilità con il profilo.

## Non-obiettivi della prima beta

- diagnosi dermatologica o medica;
- misura colorimetrica professionale da una fotografia non calibrata;
- account obbligatorio;
- marketplace o e-commerce;
- social network;
- backend complesso;
- pubblicazione contemporanea su web e store;
- completa automazione della classificazione da selfie senza protocollo di acquisizione.

## Criteri della beta di settembre 2026

- progetto rinominato coerentemente in Armonia;
- codice principale migrato o migrabile in TypeScript con confini definiti;
- motore separato da React;
- suite di test eseguibile;
- metodologia e limiti documentati;
- almeno una baseline scientifica confrontabile con il motore precedente;
- UX mobile coerente e presentabile;
- PWA distribuibile senza dipendenza funzionale da Netlify;
- repository leggibile come progetto portfolio.
