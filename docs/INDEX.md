# Indice della documentazione

## Documenti

| File | Scopo |
|---|---|
| `PROJECT_STATUS.md` | Fotografia verificabile dello stato corrente e dei rischi aperti |
| `PRODUCT_REQUIREMENTS.md` | Obiettivi di prodotto, utenti, requisiti e non-obiettivi |
| `ARCHITECTURE.md` | Architettura corrente, architettura target e direzione delle dipendenze |
| `COLOR_ENGINE_SPEC.md` | Inventario del motore attuale, assunzioni e contratto target |
| `SCIENTIFIC_SOURCES.md` | Registro delle fonti normative ed empiriche |
| `VALIDATION_PLAN.md` | Protocollo di test e validazione scientifica |
| `ROADMAP.md` | Sequenza di lavoro e criteri di uscita delle milestone |
| `DECISIONS.md` | Registro delle decisioni architetturali e di prodotto |

## Fonti di verità

In caso di conflitto usare questo ordine:

1. decisioni accettate in `DECISIONS.md`;
2. requisiti e specifiche approvati;
3. standard e fonti primarie registrate;
4. implementazione corrente;
5. test automatici;
6. roadmap e stato di avanzamento.

L'implementazione e i test descrivono ciò che il software fa, ma non dimostrano da soli che il risultato sia scientificamente corretto.

## Aggiornamento

Ogni documento deve riportare assunzioni e incertezze senza trasformarle in fatti. Quando una modifica rende obsoleta una sezione, aggiornarla nello stesso intervento oppure aprire un elemento esplicito nel backlog.
