# Fonti scientifiche

## Scopo

Questo registro raccoglie standard, articoli primari e dataset rilevanti. La presenza di una fonte non implica che supporti il modello stagionale o l'algoritmo corrente.

## Regole di inclusione

Preferire:

1. standard CIE, ISO, IEC o W3C per definizioni e conversioni;
2. articoli peer-reviewed con metodo e dati descritti;
3. dataset calibrati e riutilizzabili;
4. studi psicofisici con campione, condizioni di osservazione e validazione dichiarati;
5. documentazione secondaria solo per orientamento, non come base delle formule.

Per ogni nuova fonte annotare quale decisione o ipotesi può supportare e quali limiti impediscono la generalizzazione.

## Fondamenti colorimetrici

### CIE 015:2018 — Colorimetry, 4th Edition

- Ente: Commission Internationale de l'Éclairage.
- DOI: https://doi.org/10.25039/TR.015.2018
- Pagina: https://www.cie.co.at/publications/colorimetry-4th-edition
- Uso previsto: osservatori standard, illuminanti, tristimulus, spazi colore e differenze cromatiche.
- Rilevanza: riferimento normativo principale per sostituire assunzioni HSL non documentate.

### ISO/CIE 11664-2:2022 — Standard illuminants

- DOI: https://doi.org/10.25039/DS1664-2.2022
- Pagina: https://www.cie.co.at/publications/colorimetry-part-2-cie-standard-illuminants-0
- Uso previsto: definizione di D65, D50 e illuminante A.
- Rilevanza: protocollo di acquisizione, white point e conversioni.

### CSS Color Module Level 4

- URL: https://www.w3.org/TR/css-color-4/
- Uso previsto: comportamento dei colori web e definizioni implementative di sRGB, linear-light e spazi CSS.
- Limite: specifica web, non sostituisce gli standard colorimetrici CIE/IEC.

### Sharma, Wu, Dalal (2005) — CIEDE2000

- Titolo: *The CIEDE2000 Color-Difference Formula: Implementation Notes, Supplementary Test Data, and Mathematical Observations*.
- DOI: https://doi.org/10.1002/col.20070
- Uso previsto: implementazione e test di ΔE00.
- Rilevanza: test standardizzati per differenze cromatiche.

### Li et al. (2017) — CAM16, CAT16, CAM16-UCS

- Titolo: *Comprehensive color solutions: CAM16, CAT16, and CAM16-UCS*.
- DOI: https://doi.org/10.1002/col.22131
- Uso previsto: apparenza del colore e spazio uniforme sotto condizioni di visione specificate.
- Rilevanza: candidato da confrontare con CIELAB/ΔE00 per scoring e ranking.

## Misura del colore della pelle

### Xiao et al. (2017)

- Titolo: *Characterising the variations in ethnic skin colours: a new calibrated data base for human skin*.
- DOI: https://doi.org/10.1111/srt.12295
- Metodo: misure spettrofotometriche su quattro gruppi etnici e quattro aree corporee, espresse in CIELAB.
- Rilevanza: range biologici e variabilità tra gruppi e aree.
- Limite: non valida la classificazione stagionale né input da fotografie non calibrate.

### Wang et al. (2017)

- Titolo: *Spectrophotometric Measurement of Human Skin Colour*.
- DOI: https://doi.org/10.1002/col.22143
- Copia istituzionale: https://eprints.whiterose.ac.uk/116965/
- Rilevanza: variabilità della misura per strumenti, gruppi, genere e aree anatomiche.

### Cronin et al. (2023)

- Titolo: *Effect of camera distance and angle on color of diverse skin tone-based standards in smartphone photos*.
- DOI: https://doi.org/10.1002/jbio.202200381
- Rilevanza: dimostra che geometria e acquisizione smartphone influenzano coordinate CIELAB anche usando standard colore.
- Limite: standard di tono cutaneo, non misura diretta del comportamento dell'app Armonia.

## Armonia e percezione

### Ou e Luo (2006)

- Titolo: *A colour harmony model for two-colour combinations*.
- DOI: https://doi.org/10.1002/col.20208
- Metodo: valutazione psicofisica di 1.431 coppie costruite in CIELAB e validazione su un dataset indipendente.
- Rilevanza: baseline empirica per sostituire parte delle regole manuali sulle coppie.
- Limiti: coppie isolate, monitor e condizioni controllate; non equivale a outfit, preferenza individuale o compatibilità con un volto.

### Zhang et al. (2026)

- Titolo: *The impact of clothing colour on skin tone perception and consumer preference*.
- DOI: https://doi.org/10.1111/cote.12828
- Metodo: osservazione di 22 felpe monocromatiche e modelli per percezione della fairness e preferenza in giovani consumatori cinesi.
- Rilevanza: prova che il colore dell'abbigliamento può modificare la percezione del tono della pelle e che preferenza e percezione non coincidono.
- Limiti: campione e obiettivo culturale specifici; non valida il sistema a 12 stagioni.

## Stato delle evidenze sul modello stagionale

Nella prima ricognizione non è stata identificata una validazione primaria del mapping implementato in Armonia:

```text
pelle + occhi + capelli
→ warm/cool/neutral, light/deep, low/medium/high
→ una delle 12 stagioni
```

Questa assenza non dimostra che il modello sia inutile, ma impedisce di descriverlo come risultato scientificamente stabilito. Va definito un target osservabile e validato direttamente.

## Backlog di ricerca

- evidenza sperimentale su sottotono e draping;
- dataset di volti con acquisizione colorimetrica controllata;
- relazione tra colore vicino al volto e variazioni percettive di uniformità, contrasto e salute apparente;
- modelli di armonia per più di due colori;
- variabilità interculturale e individuale della preferenza;
- accuratezza e bias delle pipeline fotografiche consumer;
- riproducibilità tra display e condizioni ambientali;
- protocolli etici e privacy per immagini biometriche.

## Registro delle fonti escluse

Blog, marketing di consulenti d'immagine e descrizioni commerciali possono aiutare a comprendere il dominio, ma non devono essere usati per derivare formule o rivendicare accuratezza scientifica.
