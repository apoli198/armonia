# Piano di validazione

## Principio

La validazione deve distinguere tre domande:

1. il codice implementa correttamente una formula?
2. la formula rappresenta correttamente un fenomeno colorimetrico o percettivo?
3. il risultato è utile e preferito dagli utenti target?

Un esito positivo a una domanda non implica automaticamente le altre.

## Livelli di test

### Livello 1 — correttezza implementativa

Obiettivi:

- conversioni sRGB ↔ XYZ ↔ CIELAB;
- gestione del white point;
- ΔE00;
- media circolare degli angoli;
- clamp, normalizzazione e casi degeneri;
- determinismo del generatore.

Fonti attese: standard e dataset di test pubblicati.

Criteri:

- corrispondenza numerica con dati di riferimento entro tolleranze dichiarate;
- nessun `NaN`, infinito o valore fuori contratto;
- round trip documentati;
- test dei bordi di hue e dei colori acromatici.

### Livello 2 — caratterizzazione della baseline

Obiettivo: preservare temporaneamente il comportamento corrente durante l'estrazione TypeScript.

I test devono essere etichettati come `characterization` e non devono essere interpretati come prova scientifica.

Registrare:

- input;
- output corrente;
- seed;
- versione del modello;
- eventuali anomalie note.

### Livello 3 — proprietà e stabilità

Proprietà iniziali:

- stesso input e stesso seed producono lo stesso risultato;
- piccoli cambiamenti dell'input non causano salti inspiegabili senza segnalare bassa confidenza;
- rotazioni e neutralità sono gestite in modo continuo dove il modello lo richiede;
- l'ordine degli input non modifica risultati che dovrebbero essere simmetrici;
- i punteggi restano nel dominio definito;
- duplicare un colore non deve alterare arbitrariamente la valutazione, salvo peso esplicito.

### Livello 4 — validazione colorimetrica

Confrontare:

- HSL corrente;
- CIELAB con ΔE00;
- CAM16-UCS o alternative motivate;
- eventuale spazio più semplice usato soltanto per UI.

Obiettivi:

- identificare quale rappresentazione produce maggiore stabilità e migliore relazione con i giudizi raccolti;
- quantificare l'errore introdotto da fotografia e display;
- definire quando un input è fuori dominio.

### Livello 5 — validazione del profilo e delle stagioni

Possibili target, da non mescolare:

- accordo tra analisti indipendenti;
- preferenza dell'utente;
- valutazione percettiva con draping controllato;
- cambiamenti misurabili della percezione del volto;
- utilità nella scelta quotidiana.

Dataset minimo concettuale:

```text
participant_id anonimo
acquisition_protocol
skin/eye/hair measurements
candidate drapes or garment colors
expert labels with rater_id
user preferences
pairwise observer ratings
model predictions
model version
```

Le etichette degli esperti devono conservare il singolo valutatore per poter misurare disaccordo e affidabilità.

Metriche candidate:

- confusion matrix e macro-F1 per classificazioni;
- Cohen's/Fleiss' kappa o Krippendorff's alpha per accordo;
- Brier score o log loss per output probabilistici;
- accuracy pairwise, Spearman/Kendall e NDCG per ranking;
- intervalli di confidenza bootstrap;
- analisi separata per gruppi di tono cutaneo, dispositivo e condizioni di acquisizione.

Le soglie di accettazione scientifica devono essere fissate dopo un pilot e non inventate in anticipo.

### Livello 6 — utilità di prodotto

Misurare separatamente:

- completamento del primo flusso;
- tempo al primo risultato;
- comprensione dell'incertezza;
- salvataggio o utilizzo di una proposta;
- correzioni manuali;
- ritorno nell'app;
- effetto delle inserzioni sul flusso.

Queste metriche non validano la correttezza colorimetrica.

## Protocollo fotografico iniziale

Finché non esiste calibrazione automatica affidabile, l'app deve almeno:

- richiedere luce uniforme e non mista;
- evitare filtri, modalità ritratto e makeup quando rilevante;
- disabilitare o documentare il flash;
- indicare area e distanza di acquisizione;
- preferire immagini con profilo colore interpretabile;
- mostrare un avviso quando l'immagine è sovraesposta o troppo scura;
- valutare l'uso di una reference card solo in modalità avanzata.

L'input manuale o fotografico deve mantenere un indicatore di qualità.

## Dataset nel repository

Consentiti:

- casi sintetici;
- dati colorimetrici pubblici compatibili con la licenza;
- feature derivate anonime;
- metadati non identificativi;
- fixture minime autorizzate.

Non consentiti senza processo esplicito:

- selfie o volti identificabili;
- dati biometrici non necessari;
- immagini con licenza incerta;
- informazioni personali dei partecipanti;
- credenziali o identificativi di servizi.

## Confronto tra modelli

Ogni revisione importante deve essere confrontata con la baseline su un dataset congelato:

```text
baseline-current
candidate-model
metriche per target
stabilità per perturbazione
analisi degli errori
regressioni note
```

Non sostituire la baseline solo perché il nuovo modello appare qualitativamente migliore su pochi esempi.

## Exit criteria della prima revisione

- conversioni standard implementate e testate;
- baseline corrente riproducibile;
- registro completo delle euristiche;
- primo dataset di validazione definito e versionato;
- almeno un confronto quantitativo tra baseline e candidato;
- output con confidenza o margine;
- limiti documentati nella UI e nel README;
- nessuna affermazione scientifica non supportata.
