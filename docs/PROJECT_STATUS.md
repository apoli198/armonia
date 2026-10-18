# Stato di sviluppo

Base del pacchetto: main, commit
26f55882763e46d403a9b9d3c2338c15d4cf1d92.

## Incremento preparato

- Conversioni e differenza angolare in src/color.ts.
- Curve e range non validati isolati in src/color-heuristics.ts.
- Profilo identificato come hsl-heuristic-2, con stato unvalidated.
- Corretto il caso di salto del sottotono vicino a 0°/360°.
- Rimossi dalla UI i riferimenti non dimostrati alla simulazione dei tessuti.
- Ripristinata in App.jsx la dichiarazione di modes/setModes mancante in main.

Le euristiche restano operative per il confronto con la baseline.
La revisione non costituisce validazione empirica dell'armocromia.

## Verifica del pacchetto

Nella copia temporanea dell'assistente:

- 164 test positivi;
- type-check, build e generazione PWA positivi;
- round trip HEX/HSL esatto per tutti i 16.777.216 colori RGB a 8 bit;
- confronto della conversione HSL su 480 punti con formula di riferimento;
- rendering iniziale positivo con risultato predefinito e avviso sperimentale.

Il round trip verifica reversibilità, non correttezza del modello estetico.
Questi risultati riguardano il pacchetto preparato, non un commit applicato.

Per chiudere l'incremento nella working copy del proprietario:

- applicare le modifiche e ottenere npm test e npm run build positivi;
- verificare selettore HEX, riflessi, guardaroba, generazione e ricaricamento;
- verificare installazione e funzionamento offline della PWA.

## Prossimo incremento: base colorimetrica

Obiettivo: aggiungere funzioni pure per sRGB → RGB lineare → XYZ → CIELAB,
con unità, bianco di riferimento, adattamento cromatico e fonti espliciti.

Criteri di completamento:

- modulo indipendente dalla UI e dalle curve legacy;
- contratti TypeScript che distinguano le rappresentazioni;
- vettori di riferimento esterni, tolleranze e casi limite documentati;
- test, type-check e build positivi;
- nessun trasferimento automatico di soglie HSL in CIELAB.

In seguito: definire le grandezze del profilo e il protocollo di validazione
prima di estrarre fit, armonie e ranking.
