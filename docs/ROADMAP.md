# Roadmap

Data di riferimento: 18 luglio 2026.

## Vincoli

- sviluppo secondario, svolto prevalentemente nel tempo libero;
- obiettivo di una beta web accattivante e coerente per l'inizio di settembre 2026;
- correttezza del motore prioritaria rispetto alla rifinitura grafica;
- mantenimento dell'app utilizzabile durante la migrazione.

Le date sono target, non sostituiscono i criteri di uscita.

## M0 — Baseline e documentazione

Target: 18–20 luglio.

Deliverable:

- rinomina concettuale in Armonia;
- documentazione di progetto;
- inventario delle euristiche;
- build locale verificata;
- backlog iniziale.

Exit criteria:

- repository sufficiente come unica fonte di contesto;
- rischi scientifici e tecnici espliciti;
- prossima milestone definita.

## M1 — TypeScript e testabilità

Target: 21–31 luglio.

Deliverable:

- configurazione TypeScript;
- tipi fondamentali;
- test runner;
- estrazione di conversioni, utility e generatore pseudocasuale;
- test di caratterizzazione del comportamento corrente;
- seed esplicito.

Exit criteria:

- motore invocabile senza React almeno per i primi moduli estratti;
- build PWA funzionante;
- nessuna regressione intenzionale nell'interfaccia;
- test locali eseguibili con un singolo comando.

## M2 — Fondamenti colorimetrici

Target: 1–10 agosto.

Deliverable:

- sRGB linearizzato;
- conversioni XYZ e CIELAB con white point documentato;
- ΔE00 con test pubblicati;
- confronto tecnico con HSL;
- rimozione o confinamento delle normalizzazioni non dimostrate;
- protocollo iniziale di qualità dell'input.

Exit criteria:

- conversioni conformi ai riferimenti scelti;
- HSL non usato per misure di differenza senza motivazione;
- euristiche residue marcate nel codice e nella specifica.

## M3 — Revisione del profilo e season detection

Target: 11–20 agosto.

Deliverable:

- feature continue separate dalle etichette;
- output con score, margine e alternative;
- baseline stagionale versionata;
- dataset pilota o protocollo di raccolta;
- analisi di sensibilità a input e acquisizione;
- rimozione della dichiarazione “scientifica” non supportata.

Exit criteria:

- nessun salto di categoria senza margine osservabile;
- casi borderline rappresentati;
- confronto quantitativo baseline/candidato disponibile;
- limiti esposti al prodotto.

## M4 — Armonia, outfit e ranking

Target: 21–28 agosto.

Deliverable:

- separazione tra fit personale, armonia e preferenza;
- modello pairwise confrontato con una baseline empirica;
- generazione distinta dal ranking;
- spiegazioni del punteggio;
- gestione deterministica dei capi fissi e del seed.

Exit criteria:

- ranking riproducibile;
- nessuna regola opaca non registrata;
- casi di regressione per errori corretti;
- qualità confrontabile su dataset congelato.

## M5 — UX e identità visiva della beta

Target: 29 agosto–6 settembre.

Deliverable:

- nome Armonia applicato a UI, manifest e metadati;
- home o entry flow immediato;
- modalità essenziale e accesso progressivo ai dettagli;
- design token;
- restyling coerente con i pattern Apple contemporanei senza alterare la percezione dei campioni;
- nuova icona;
- accessibilità e responsive review;
- README portfolio e screenshot.

Exit criteria:

- primo risultato ottenibile senza configurazione estesa;
- incertezza e limiti comprensibili;
- campioni di colore su superfici visivamente stabili;
- build PWA distribuibile;
- repository presentabile dal CV.

## M6 — Deploy indipendente e osservabilità

Dopo la beta.

Deliverable:

- scelta hosting statico;
- CI per build e test;
- analytics privacy-aware;
- error reporting;
- policy di versione e release.

## M7 — Monetizzazione web

Dopo una baseline di utilizzo reale.

Deliverable:

- provider pubblicitario dietro adapter;
- gestione consenso;
- slot non invasivi;
- misurazione impatto su UX e prestazioni;
- criteri per rimuovere o limitare inserzioni.

## M8 — Store

Dopo validazione di pubblico e sostenibilità.

Deliverable:

- scelta tecnica mobile;
- compliance store;
- test su dispositivi;
- modello economico;
- release graduale.

## Priorità in caso di ritardo

Mantenere, in ordine:

1. TypeScript e testabilità;
2. correttezza colorimetrica;
3. validazione e gestione dell'incertezza;
4. flusso utente essenziale;
5. coerenza visiva minima;
6. icona e rifiniture;
7. pubblicità e store.

Non comprimere la revisione scientifica per rispettare una scadenza puramente estetica.
