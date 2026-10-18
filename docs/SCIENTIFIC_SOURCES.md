# Riferimenti per la revisione aperta

Questo elenco contiene riferimenti pertinenti ai blocchi da revisionare.
La presenza di una fonte non significa che il codice sia conforme,
che il testo integrale sia stato verificato o che il modello sia validato.

Prima di usare una formula, verificare la sezione pertinente.
Registrare vicino al codice e ai test la versione della fonte,
le condizioni di applicazione e le eventuali limitazioni.

Quando un riferimento è documentato stabilmente nel modulo pertinente,
rimuovere da qui la voce duplicata.

## Conversioni e rappresentazioni

### W3C — CSS Color Module Level 4

- Fonte: https://www.w3.org/TR/css-color-4/
- Uso: definizioni e algoritmi per HSL, sRGB, linearizzazione e conversioni.
- Limite: specifica web in evoluzione; non valida misure biologiche
  o raccomandazioni estetiche.
- Prima di costruire test di conformità, fissare la versione utilizzata.

### CIE 015:2018 — Colorimetry, 4th Edition

- Fonte: https://www.cie.co.at/publications/colorimetry-4th-edition
- DOI: https://doi.org/10.25039/TR.015.2018
- Uso previsto: fondamenti colorimetrici e condizioni delle misure.
- Limite: consultare le sezioni necessarie prima di dichiarare conformità;
  la sola scheda bibliografica non basta.

### Sharma, Wu e Dalal (2005) — CIEDE2000

- Titolo: The CIEDE2000 Color-Difference Formula:
  Implementation Notes, Supplementary Test Data, and Mathematical Observations.
- DOI: https://doi.org/10.1002/col.20070
- Materiale degli autori:
  https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/
- Uso previsto: implementazione e test di ΔE00.
- Limite: una differenza cromatica non è una misura di preferenza
  o compatibilità personale.

## Misura e acquisizione del colore

### Xiao et al. (2017)

- Titolo: Characterising the variations in ethnic skin colours:
  a new calibrated data base for human skin.
- DOI: https://doi.org/10.1111/srt.12295
- Uso: riferimento per misure calibrate e variabilità del colore della pelle.
- Limite: non giustifica i BIO_RANGES HSL correnti né il mapping stagionale.
- L'eventuale riuso dei dati richiede verifica di disponibilità e licenza.

### Cronin et al. (2023)

- Titolo: Effect of camera distance and angle on color of diverse
  skin tone-based standards in smartphone photos.
- DOI: https://doi.org/10.1002/jbio.202200381
- Scheda istituzionale:
  https://research.lu.lv/en/publications/effect-of-camera-distance-and-angle-on-color-of-diverse-skin-tone/
- Uso: effetti della geometria di acquisizione sul colore fotografato.
- Limite: studio su standard di tono cutaneo; non calibra le curve di Armonia.

## Preferenze per i colori degli abiti

### Perrett e Sprengelmeyer (2021)

- Titolo: Clothing Aesthetics:
  Consistent Colour Choices to Match Fair and Tanned Skin Tones.
- DOI: https://doi.org/10.1177/20416695211053361
- Uso: esempio di studio sperimentale delle preferenze
  in relazione al colore della carnagione.
- Limiti: stimoli e partecipanti demograficamente limitati;
  non valida il modello a 12 stagioni o i coefficienti di Armonia.

## Evidenze ancora mancanti

Non è stata identificata una validazione specifica per:

- normalizzazioni normFabric e normBio\*;
- BIO_RANGES;
- formule, pesi e soglie del profilo corrente;
- mapping implementato verso le 12 stagioni;
- regole correnti di fit, armonia e ranking.

L'assenza di evidenze identificate non prova l'inutilità di un'euristica.
Impedisce di presentarla come una relazione scientificamente dimostrata.

Aggiungere nuovi riferimenti soltanto quando servono a una decisione
o a una verifica concreta. Evitare bibliografie speculative.
