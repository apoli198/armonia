# Motore cromatico: revisione aperta

Questo documento contiene soltanto le verifiche ancora necessarie.
Contratti e fonti stabilizzati vanno mantenuti vicino al codice e ai test,
eliminando qui le informazioni duplicate.

## Contratti tecnici dell'incremento corrente

- Le conversioni accettano HEX sRGB opachi nel formato #RRGGBB.
- hexToHsl rifiuta un formato non valido con TypeError.
- hslToHex rifiuta coordinate non finite con RangeError.
- Per coordinate finite conserva rotazione della hue e clamp esistenti.
- validateBioColor restituisce false per HEX o componenti non validi
  e per output non finiti del normalizzatore.
- I riflessi mancanti o non riconosciuti vengono ricondotti ai default.
- I chiamanti UI filtrano i colori persistiti non validi e impediscono
  la conferma di HEX incompleti.

Questi controlli proteggono l'esecuzione.
Non validano il significato scientifico delle formule.

## Conversioni e rappresentazioni

Le formule HEX/HSL sono coerenti con le conversioni sRGB/HSL
nel dominio degli input validi esaminato.

La revisione scientifica deve ancora consolidare:

- riferimenti e tolleranze nei test di conformità;
- significato della hue nei colori acromatici;
- distinzione tra lightness HSL, luminanza e chiarezza percettiva;
- spazio colore e condizioni appropriati per le misure del profilo.

HSL non è percettivamente uniforme.
Una conversione corretta non valida le decisioni estetiche successive.

## Trasformazioni euristiche

normFabric, normBioSkin, normBioEyes e normBioHair applicano potenze
alla saturazione e sigmoidali alla lightness.

Non è stata identificata una calibrazione che giustifichi i parametri
come correzione dal colore a schermo al colore fisico.
Queste trasformazioni non sono la linearizzazione sRGB.

Definire il loro dominio e decidere, sulla base delle evidenze,
quali rimuovere, sostituire o isolare per il confronto con la baseline.

## Range biologici

BIO_RANGES contiene intervalli HSL scelti manualmente.
validateBioColor ne verifica l'appartenenza, non la plausibilità biologica.

La revisione deve distinguere formato valido, dominio della rappresentazione
e plausibilità supportata da misure.

Non usare i range per escludere input biologici senza dati che lo giustifichino.

## Profilo

Il segnale della pelle usa ancora (hSk - 22) / 22,
che non rispetta la circolarità della hue.

Caso da trasformare in regressione, con occhi e capelli #808080
e riflessi predefiniti:

| Pelle   | Sottotono corrente | Stagione corrente |
| ------- | ------------------ | ----------------- |
| #b98c8d | warm               | spring-light      |
| #b98d8c | cool               | summer-soft       |

Una correzione angolare non basta a validare il sottotono.

Prima di modificare il modello:

- definire operativamente sottotono, profondità e intensità;
- rivedere hairReflectivity e l'effetto del volume dei capelli;
- verificare l'effetto delle normalizzazioni;
- giustificare o confinare pesi, soglie e correzioni dei riflessi;
- distinguere punteggi, categorie e ambiguità.

Il mapping a 12 stagioni resta una tassonomia estetica non validata
per l'implementazione corrente.

## Metodo di verifica

Per ciascun blocco:

1. Verificare formule, unità, dominio e fonti primarie.
2. Confrontare i calcoli con riferimenti e tolleranze dichiarate.
3. Conservare fixture della baseline senza trattarle come verità scientifica.
4. Aggiungere regressioni per gli errori corretti.
5. Distinguere cambiamenti intenzionali e regressioni.

Quando servono dati empirici:

- definire il target osservabile;
- documentare acquisizione, provenienza e limiti dei dati;
- separare misure, giudizi degli esperti e preferenze;
- confrontare baseline e candidato sugli stessi dati congelati;
- dichiarare metriche, incertezza e limiti di generalizzazione.

In assenza di dati sufficienti, dichiarare il modello non validato.

## Acquisizione

Un campione fotografico dipende da illuminazione, camera, esposizione,
bilanciamento del bianco, geometria e gestione del colore.

Non trattarlo come misura della riflettanza.
Definire un protocollo prima di validare il profilo.
Non attribuire affidabilità numerica senza un metodo che la giustifichi.

## Blocchi successivi

Fit, armonie, pesi dei capi e ranking richiedono ancora revisione.

Distinguere differenza cromatica, compatibilità personale, armonia
e preferenza. Non fondere questi obiettivi in un punteggio opaco.

Valutare conversioni colorimetriche e differenze cromatiche appropriate
quando necessarie, documentando white point e condizioni pertinenti.

Non trasferire automaticamente le soglie HSL in un nuovo spazio.
Le modifiche sostanziali al modello richiedono un identificatore
e un confronto riproducibile distinti dalla versione dell'app.
