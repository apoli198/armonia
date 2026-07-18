# Istruzioni per assistenti di sviluppo

## Contesto

Il progetto si chiama **Armonia**. È una web app/PWA React dedicata all'analisi cromatica personale e alla proposta di combinazioni di colori per l'abbigliamento.

La repository è la fonte primaria del contesto di progetto. Non assumere informazioni provenienti da conversazioni esterne non registrate nei file del repository.

## Ordine di lettura

Prima di proporre o applicare modifiche sostanziali, leggere:

1. `docs/INDEX.md`
2. `docs/PROJECT_STATUS.md`
3. `docs/DECISIONS.md`
4. `docs/ARCHITECTURE.md`
5. `docs/COLOR_ENGINE_SPEC.md`
6. `docs/VALIDATION_PLAN.md`
7. i file di codice direttamente coinvolti

Per modifiche a prodotto, UX o roadmap, leggere anche `docs/PRODUCT_REQUIREMENTS.md` e `docs/ROADMAP.md`.

## Priorità

1. Migrazione progressiva a TypeScript.
2. Isolamento del dominio cromatico dalla UI.
3. Revisione scientifica e matematica del motore.
4. Test automatici e validazione riproducibile.
5. UI, UX e design system.
6. Monetizzazione pubblicitaria.
7. Packaging e distribuzione sugli store.

La correttezza del motore prevale sulla rifinitura visiva.

## Regole scientifiche

- Trattare il motore corrente come un insieme di euristiche non validate.
- Non descrivere un risultato come scientificamente corretto solo perché il codice compila o i test passano.
- Distinguere sempre tra standard colorimetrici, risultati empirici, ipotesi, euristiche e decisioni di prodotto.
- Ogni nuova formula, soglia, peso o classificazione deve avere almeno uno dei seguenti stati documentati:
  - derivata da standard;
  - derivata da fonte primaria;
  - stimata da dataset;
  - euristica esplicita;
  - ipotesi da validare.
- Non introdurre il termine “scientifico” nella UI o nei metadati finché i criteri in `docs/VALIDATION_PLAN.md` non sono soddisfatti.
- Non usare etichette di esperti come verità assoluta: misurare anche accordo tra valutatori e incertezza.

## Regole tecniche

- Conservare React e Vite salvo decisione architetturale esplicita.
- Migrare in modo incrementale; evitare riscritture complete.
- Estrarre prima le funzioni pure, poi i componenti, quindi lo stato e i servizi.
- Evitare modifiche simultanee a logica scientifica e presentazione nello stesso intervento, salvo necessità motivata.
- Non aggiungere dipendenze senza una necessità concreta e documentata.
- Preservare il comportamento esistente durante la migrazione, usando test di caratterizzazione quando il comportamento non è ancora validato.
- La compatibilità PWA e il funzionamento locale devono rimanere verificabili dopo ogni milestone.
- Non inserire segreti o identificativi di provider nel codice client.
- Il provider pubblicitario deve essere isolato dietro un adapter o componente dedicato.

## Modalità operativa con GitHub

- Usare GitHub e i relativi connettori esclusivamente per operazioni di lettura e verifica.
- Non creare o modificare branch, file, commit, issue, pull request, commenti, label o altre risorse remote.
- Non eseguire autonomamente `git commit`, `git push`, merge o apertura di pull request.
- Le modifiche al repository locale devono essere descritte passo passo affinché il proprietario possa applicarle, verificarle e comprenderle.
- Prima di ogni modifica indicare obiettivo, file coinvolti, comandi da eseguire, risultato atteso e controlli successivi.
- Analizzare gli output reali forniti dal proprietario prima di considerare riuscita un’installazione, un type-check, una build o un test.
- GitHub rimane la fonte primaria per leggere lo stato aggiornato del branch `main`; la working copy locale del proprietario è l’ambiente in cui applicare e verificare le modifiche.

## TypeScript

- Evitare `any` salvo confine esterno non tipizzabile e motivato.
- Modellare esplicitamente colori, profili, stagioni, capi, armonie, risultati e livelli di confidenza.
- Usare union type per domini finiti.
- Validare i dati persistiti prima di considerarli conformi ai tipi TypeScript.
- Non confondere la tipizzazione statica con la validazione runtime.

## Test

- Aggiungere test insieme alla logica estratta o modificata.
- Separare:
  - test di conversione e conformità a standard;
  - test di caratterizzazione del comportamento corrente;
  - test di proprietà e invarianti;
  - test di validazione su dataset;
  - test UI.
- I test di caratterizzazione devono essere chiaramente identificati: preservano il comportamento, non ne provano la correttezza scientifica.
- Ogni bug scientifico corretto deve produrre un caso di regressione.

## Documentazione

Aggiornare i documenti interessati quando una modifica cambia:

- architettura;
- assunzioni del motore;
- fonti;
- protocollo di validazione;
- roadmap;
- stato delle decisioni.

Registrare le decisioni irreversibili o costose in `docs/DECISIONS.md`.
