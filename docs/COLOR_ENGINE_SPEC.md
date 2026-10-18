# Motore cromatico: lavoro aperto

Mantenere qui soltanto questioni e criteri ancora aperti.
Contratti e riferimenti stabilizzati appartengono al codice e ai test.

## Limiti della baseline

src/color-heuristics.ts raccoglie trasformazioni e range non calibrati.
La separazione non ne cambia i risultati né ne dimostra la validità.

- normFabric e normBio\* non ricostruiscono colori fisici misurati.
- BIO_RANGES non certifica plausibilità biologica.
- La lightness HSL non equivale a luminanza o chiarezza CIELAB.
- hairReflectivity non è una misura di riflettanza.
- Pesi, soglie, riflessi e mapping stagionale non hanno una validazione
  identificata per questa implementazione.
- I punteggi non sono probabilità né indicatori di affidabilità.

## Correzione angolare e rischio residuo

hsl-heuristic-2 usa lo scarto orientato lungo l'arco più breve per i termini
della hue di pelle e capelli. Il caso noto vicino a 0°/360° ha una regressione.

Lo scarto sceglie -180° nel caso antipodale: esiste ancora una discontinuità
a 180° dalla reference. Questa è una correzione geometrica locale,
non un modello globale o biologico del sottotono.

I risultati possono cambiare rispetto alla baseline nei colori interessati.
Non trattare la nuova classificazione come un riferimento scientifico.

## Prossimo incremento

Implementare sRGB → RGB lineare → XYZ → CIELAB.

Prima del codice fissare:

- dominio, scale e unità delle coordinate;
- bianco di riferimento e gestione dell'adattamento cromatico;
- fonti degli algoritmi e vettori numerici esterni;
- tolleranze e trattamento degli input non validi.

Conservare le vecchie soglie soltanto nel percorso legacy.
Non introdurre nuovi coefficienti estetici in questo incremento.

## Revisione successiva del profilo

Definire operativamente sottotono, profondità, intensità e contrasto.
Decidere quali grandezze siano misurabili e quali giudizi estetici.

Per la validazione empirica servono:

- target osservabile: misura, accordo tra valutatori o preferenza;
- dati con provenienza, condizioni di acquisizione e limiti documentati;
- separazione tra dati di sviluppo e valutazione;
- confronto tra baseline e candidato sugli stessi casi;
- metriche, incertezza e limiti di generalizzazione espliciti.

Un campione fotografico non calibrato non è una misura di riflettanza.
Definire il protocollo prima di attribuire affidabilità al profilo.

Fit, armonie e ranking saranno revisionati distinguendo differenza cromatica,
compatibilità personale e preferenza. La base colorimetrica da sola
non valida nessuno di questi obiettivi.
