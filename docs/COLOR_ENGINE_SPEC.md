# Motore cromatico: revisione aperta

Questo documento raccoglie soltanto i problemi e le verifiche ancora necessari.
Non certifica il motore corrente. Contratti, formule e fonti stabilizzati
devono essere trasferiti vicino al codice e ai test, eliminando qui
le sezioni corrispondenti.

## Confini da rispettare

Separare:

- rappresentazione e conversione dei colori;
- qualità e provenienza dell'input;
- caratteristiche del profilo;
- classificazione estetica;
- compatibilità personale;
- armonia tra colori;
- generazione e ranking degli outfit.

Una conversione corretta non valida le decisioni estetiche costruite sopra di essa.

## Blocco colore

### Conversioni HEX/HSL

Le formule correnti sono coerenti con le conversioni sRGB/HSL
nel dominio degli input validi esaminato.

Restano da definire e verificare:

- formati HEX accettati;
- unità e intervalli HSL;
- trattamento di NaN, infiniti e valori finiti fuori intervallo;
- significato della hue per i colori acromatici;
- precisione, arrotondamento e tolleranze;
- gestione degli errori nei chiamanti e nella persistenza.

HSL è una rappresentazione utile per controlli e trasformazioni cromatiche.
La sua lightness non coincide con luminanza o chiarezza percettiva.
Le sue distanze non vanno trattate automaticamente come differenze percepite.

### Trasformazioni euristiche

normFabric, normBioSkin, normBioEyes e normBioHair applicano potenze
alla saturazione e sigmoidali alla lightness.

Non è stata identificata una calibrazione che giustifichi i parametri correnti
come correzione dal colore a schermo al colore fisico.
Queste trasformazioni non sono la linearizzazione sRGB.

Separarle dalle conversioni. Un eventuale mantenimento temporaneo serve
al confronto con la baseline e deve restare esplicitamente sperimentale.

### Range biologici

BIO_RANGES contiene intervalli HSL scelti manualmente.
validateBioColor controlla l'appartenenza a questi intervalli;
non dimostra che un colore sia biologicamente plausibile.

Distinguere:

1. formato valido;
2. coordinate nel dominio della rappresentazione;
3. appartenenza a un intervallo euristico;
4. plausibilità supportata da dati.

Correggere inoltre il controllo runtime dei componenti, includendo
chiavi ereditate come toString e constructor nei casi di regressione.

## Profilo

### Discontinuità della hue

La formula corrente usa (hSk - 22) / 22 per il segnale della pelle.
Questa operazione non rispetta la circolarità della hue.

Caso da trasformare in regressione, con occhi e capelli #808080
e riflessi predefiniti:

| Pelle   | Sottotono corrente | Stagione corrente |
| ------- | ------------------ | ----------------- |
| #b98c8d | warm               | spring-light      |
| #b98d8c | cool               | summer-soft       |

I due input differiscono di un livello in due canali RGB.
Il risultato dipende dall'attraversamento di 0°/360°.

Una distanza angolare può correggere il trattamento della coordinata,
ma non basta a validare un modello del sottotono.

### Grandezze e categorie

Prima dell'estrazione:

- definire operativamente cosa intendiamo per sottotono, profondità e intensità;
- distinguere coordinate del colore, punteggi e categorie;
- rivedere hairReflectivity, che non misura la riflettanza fisica;
- verificare l'effetto delle normalizzazioni e del volume dei capelli;
- giustificare o confinare soglie, pesi e correzioni;
- rappresentare casi fuori dominio e ambiguità senza inventare probabilità.

Il mapping a 12 stagioni resta una tassonomia estetica non validata
per l'implementazione corrente.

## Blocchi successivi

Fit, armonie, pesi dei capi e ranking richiedono ancora revisione.
Rotazioni HSL, penalità manuali e ricerca di colori alternativi
non dimostrano da sole armonia o preferenza.

Prima di modificarli, distinguere il fenomeno da prevedere:
differenza cromatica, compatibilità col profilo, preferenza personale
o giudizio estetico di osservatori.

## Protocollo di verifica per ogni blocco

### Correttezza implementativa

- Confrontare le formule con riferimenti primari.
- Dichiarare unità, dominio e tolleranze.
- Verificare casi limite, acromatici e circolarità degli angoli.
- Gestire esplicitamente gli input non validi.
- Verificare determinismo e seed dove applicabili.

### Confronto con la baseline

- Conservare fixture minime che descrivano il comportamento precedente.
- Aggiungere una regressione per ogni errore corretto.
- Distinguere cambiamenti intenzionali e regressioni.
- Non usare gli output precedenti come prova di correttezza scientifica.

### Validazione empirica

Quando una conclusione dipende da persone o misure:

- definire prima il target osservabile;
- documentare acquisizione, provenienza e limiti dei dati;
- separare etichette degli esperti, preferenze e misure;
- conservare il valutatore quando serva misurare l'accordo;
- confrontare baseline e candidato sugli stessi dati congelati;
- scegliere metriche e criteri prima del confronto finale;
- riportare incertezza, errori e limiti di generalizzazione.

In assenza di dati sufficienti, il blocco può essere verificato
nell'implementazione ma resta empiricamente non validato.

## Acquisizione e dati

Un campione fotografico dipende da illuminazione, camera, esposizione,
bilanciamento del bianco, geometria e gestione del colore.

Registrare l'origine dell'input e i metadati disponibili.
Non attribuire affidabilità numerica senza un metodo che la giustifichi.

Il protocollo fotografico va definito prima di validare il profilo.
Luce uniforme, assenza di filtri e geometria ripetibile sono accorgimenti
da valutare, non una garanzia automatica di misura calibrata.

Usare fixture sintetiche o dati con provenienza e licenza compatibili.
Non inserire immagini identificabili o dati personali senza un processo esplicito.

## Fondamenti da introdurre quando necessari

Per le misure colorimetriche valutare sRGB linearizzato, XYZ, CIELAB
e differenze cromatiche con riferimenti di test.

Documentare white point e condizioni pertinenti.
Le conversioni devono essere coerenti lungo tutta la pipeline.

Non trasferire automaticamente in un nuovo spazio le soglie HSL precedenti.
Uno spazio più appropriato non valida da solo il modello di raccomandazione.

## Evoluzione del modello

Le modifiche sostanziali al comportamento richiedono un identificatore
del modello e un confronto riproducibile, distinti dalla versione dell'app.

Non presentare come scientificamente accurato un risultato privo
delle evidenze necessarie.
