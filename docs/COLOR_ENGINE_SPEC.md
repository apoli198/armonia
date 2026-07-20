# Specifica del motore cromatico

## Stato

Il motore attuale è una baseline euristica. Questa specifica descrive ciò che esiste e il contratto verso cui migrare; non certifica la validità scientifica delle formule correnti.

## Obiettivi del motore

Il dominio deve supportare separatamente:

1. acquisizione e rappresentazione del colore;
2. analisi delle caratteristiche cromatiche personali;
3. classificazione in uno o più modelli estetici;
4. valutazione della compatibilità di un colore;
5. valutazione dell'armonia tra più colori;
6. generazione e ranking degli outfit;
7. stima dell'incertezza.

Queste operazioni non devono essere fuse in un unico punteggio opaco.

## Baseline corrente

### Rappresentazione

- Input principale: stringhe esadecimali sRGB.
- Spazio di lavoro: HSL derivato direttamente da sRGB codificato.
- Output: colori esadecimali.

### Normalizzazione “screen to real-world”

Il codice applica:

- una power law alla saturazione;
- una sigmoide alla lightness;
- parametri distinti per tessuto, pelle, occhi e capelli.

Parametri correnti:

| Superficie | Gamma saturazione | Saturazione massima | Lightness normalizzata |
|---|---:|---:|---:|
| Tessuto | 1,4 | 68 | 5–90 |
| Pelle | 1,2 | 38 | 20–88 |
| Occhi | 1,6 | 72 | 15–72 |
| Capelli | 1,3 | 55 | 5–82 |

Stato: **euristica non calibrata**. Non esiste nel repository un dataset che giustifichi tali curve o range.

### Validazione biologica

La baseline definisce range HSL distinti per pelle, occhi e capelli:

| Componente | Hue | Saturazione | Lightness |
|---|---:|---:|---:|
| Pelle | 0–70 | 2–38 | 20–88 |
| Occhi | 0–360 | 3–72 | 15–72 |
| Capelli | 0–90 | 5–55 | 5–82 |

I limiti sono inclusivi. `validateBioColor` può applicare una funzione di normalizzazione prima del confronto con i range.

Il tipo `BioComponent` limita il contratto TypeScript a `skin`, `eyes` e `hair`. Un valore sconosciuto ricevuto a runtime restituisce `false`.

La funzione è disponibile nel dominio e coperta da test, ma non è ancora collegata alla UI.

Stato: **euristica non validata**. I range non derivano attualmente da misure strumentali, dataset annotati o fonti primarie.

### Analisi del profilo

Il profilo produce tre categorie:

- `undertone`: warm, cool, neutral;
- `depth`: light, deep;
- `intensity`: low, medium, high.

La baseline combina HSL normalizzato di pelle, occhi e capelli con pesi, soglie e correzioni manuali. I riflessi selezionati dall'utente applicano correzioni discrete la cui influenza varia in funzione della distanza dalle soglie di classificazione.

Parametri correnti:

- il contributo dei capelli al sottotono è dinamico e dipende da riflettività stimata e volume;
- il peso massimo dei capelli è `0.50`;
- il peso della pelle è `0.50 - hairW * 0.30`;
- il peso degli occhi è `0.15`;
- il risultato del sottotono viene diviso per la somma dei pesi effettivi;
- soglia warm: `utScore > 0.12`;
- soglia cool: `utScore < -0.18`;
- depth: combinazione di lightness 55% pelle, 35% capelli e 10% occhi;
- soglia deep: `depthScore > 48`;
- intensità: 50% occhi, 30% capelli e 20% pelle, con bonus di contrasto pari al 15% del valore normalizzato;
- intensità alta: `intScore > 55`;
- intensità bassa: `intScore < 30`.

Stato: **euristica non validata**.

### Season detection

Le tre categorie vengono mappate deterministicamente su un modello a 12 stagioni. L'algoritmo restituisce una sola stagione, senza probabilità, margine o alternativa.

Stato: **modello di prodotto non validato**. Non è stata identificata nel repository una fonte primaria che dimostri questa specifica mappatura.

### Anchor biologico

Quando non esistono capi fissi, l'ancora biologica usa una media circolare delle hue:

- pelle 50%;
- capelli 40%;
- occhi 10%.

La generazione può inoltre scegliere un'ancora da un set manuale per stagione.

Stato: **euristica non validata**.

### Fit rispetto al profilo

Il fit del colore usa penalità discrete per:

- mismatch caldo/freddo;
- mismatch di profondità;
- mismatch di intensità;
- casi speciali per bianco, nero, neutri e jeans;
- riduzione della penalità in funzione del peso visivo del capo.

Output corrente: livello intero da 0 a 3.

Stato: **euristica non calibrata**.

### Fit tra colori

La baseline confronta coppie di colori e penalizza:

- neutri scuri quasi indistinguibili;
- stessa famiglia di hue con saturazioni molto diverse;
- coppie caldo/freddo considerate in conflitto.

Il problema viene assegnato al capo con peso minore.

Stato: **regole manuali**. Non implementano direttamente un modello psicofisico pubblicato.

### Armonie

Le candidate palette sono generate con rotazioni HSL nominali per:

- mono;
- analog;
- complementary;
- split complementary;
- triad;
- tetrad;
- neutral;
- earth;
- pastel;
- deep.

Stato: **costruzione geometrica tradizionale su HSL**, non un modello dimostrato di preferenza o armonia.

### Pesi dei capi

I capi hanno pesi manuali, normalizzati rispetto a quelli presenti. Sono presenti correzioni per occlusione degli strati e vicinanza al viso.

Stato: **euristica di prodotto**.

### Correzione automatica

Un colore problematico viene modificato sequenzialmente su hue, lightness, saturazione e contrasto. Se non viene trovato un risultato accettabile viene usato un neutro di fallback.

Stato: **algoritmo di ricerca locale euristico**.

## Problemi scientifici prioritari

### Uso di HSL

HSL è utile per controlli UI, ma non è percettivamente uniforme e non è una base sufficiente per misurare differenze, similarità o armonia. Il motore deve valutare almeno CIELAB/ΔE00 e uno spazio di apparenza o uniforme moderno, senza assumere a priori quale produca il miglior modello.

### Colore fotografico

Un valore sRGB campionato da fotografia dipende da:

- illuminante;
- bilanciamento del bianco;
- esposizione;
- tone mapping e HDR;
- camera e pipeline computazionale;
- angolo, distanza e riflessi;
- profilo colore dell'immagine;
- area anatomica campionata.

Non deve essere trattato come misura assoluta della riflettanza della pelle, degli occhi o dei capelli.

### “Sottotono”

Il termine deve essere trasformato in una definizione operativa misurabile. Non assumere che una singola hue HSL della pelle rappresenti un sottotono stabile.

### Stagioni

La classificazione stagionale va trattata come tassonomia estetica. La validazione deve chiarire se il target è:

- accordo con analisti umani;
- preferenza percepita degli utenti;
- effetto visivo misurabile sulla percezione del volto;
- coerenza interna di palette;
- combinazione dei precedenti.

Questi target non sono equivalenti.

## Contratto target

### Tipi concettuali

```ts
type ColorSource = "manual" | "photo" | "dataset" | "instrument";

type ColorMeasurement = {
  source: ColorSource;
  srgb?: [number, number, number];
  xyzD65?: [number, number, number];
  labD65?: [number, number, number];
  metadata: AcquisitionMetadata;
  uncertainty: number | null;
};

type ModelResult<T> = {
  value: T;
  score: number;
  confidence: number | null;
  alternatives: Array<{ value: T; score: number }>;
  reasons: Reason[];
  warnings: Warning[];
  modelVersion: string;
};
```

I nomi sono indicativi. La rappresentazione finale va definita durante la migrazione TypeScript.

## Pipeline target

```text
input
→ validazione e metadati
→ conversione colorimetrica
→ estrazione di feature continue
→ stima del profilo con incertezza
→ scoring dei colori
→ scoring dell'armonia
→ generazione candidati
→ ranking
→ spiegazione e warnings
```

## Ipotesi da verificare

| ID | Ipotesi | Stato corrente |
|---|---|---|
| H-01 | Curve fisse HSL possono correggere screen-to-fabric e screen-to-biology | non supportata |
| H-02 | Pelle, occhi e capelli determinano in modo stabile tre assi discreti | non supportata |
| H-03 | I pesi dinamici del profilo e i pesi 50/40/10 dell'anchor biologico migliorano la previsione | arbitraria |
| H-04 | La mappa 3 assi → 12 stagioni riflette un target osservabile | non validata |
| H-05 | Le attuali soglie di fit predicono preferenza o compatibilità | non validata |
| H-06 | Le rotazioni HSL producono combinazioni percepite come armoniose | parzialmente plausibile, implementazione non validata |
| H-07 | I pesi visuali dei capi migliorano il ranking | ipotesi di prodotto |
| H-08 | Un colore fotografico non calibrato è sufficiente per il profilo | presumibilmente fragile |

## Versionamento

Ogni modifica scientifica deve incrementare una versione del modello distinta dalla versione dell'app. I risultati persistiti devono registrare tale versione per consentire confronti e migrazioni.
