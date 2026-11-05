# EquaSprint

Web app / PWA gratuita e indipendente per allenarsi con equazioni numeriche nello stile generale di **digitChallenge**. **Non è un prodotto ufficiale Aon né Trenitalia**.

## Come usarla
1. Apri il sito su computer o tablet.
2. Scegli `Allenamento` (10 domande, correzione immediata) o `Simulazione` (5 minuti, livello fisso, riepilogo finale) o `Sfida` (5 minuti, difficoltà crescente, quesiti illimitati).
3. Seleziona uno dei quattro livelli.
4. Tocca le caselle e usa il tastierino numerico (o la tastiera fisica) per inserire cifre da 1 a 9, senza ripetizioni tra le caselle e le cifre già presenti nell’espressione.
5. Premi **Conferma** oppure **Salta**.

I quesiti sono generati direttamente sul dispositivo, partendo da una soluzione già valida. La verifica ricalcola l'espressione e accetta qualsiasi altra soluzione corretta.

## Pubblicazione gratuita su GitHub Pages
1. Crea un repository **pubblico** su GitHub (es. `equasprint`).
2. Carica **tutti i file di questa cartella nella radice** del repository (non la cartella contenitrice).
3. In **Settings → Pages**, scegli **Deploy from a branch**, branch `main`, cartella `/ (root)` e salva.
4. Il sito sarà normalmente raggiungibile all'indirizzo `https://TUO-USERNAME.github.io/equasprint/`.
5. Apri l'indirizzo dal browser del tablet Huawei. Se il browser lo supporta, usa **Aggiungi alla schermata Home**.

## Modalità offline
Dopo aver visitato il sito con una connessione Internet, un service worker salva i file necessari. L'uso offline richiede un browser che supporti i service worker e il sito deve essere servito tramite HTTPS (GitHub Pages lo usa). La prima installazione/caricamento richiede la rete.

## Dati e privacy
La generazione degli esercizi avviene localmente. Le ultime 30 sessioni vengono conservate **solo nel browser del dispositivo** tramite `localStorage`; non vengono sincronizzate.

## Limiti
- Il livello adattivo e il punteggio non corrispondono al meccanismo proprietario Aon.
- Le equazioni sono generate da un insieme di strutture, quindi la forma può ricorrere con cifre diverse.
- L'assenza di sincronizzazione è intenzionale.

## Sviluppo
Solo HTML, CSS e JavaScript: nessuna dipendenza, compilazione o server richiesti. Per testare il service worker in locale, servi la cartella tramite un server statico, per esempio `python -m http.server 8000` e apri `http://localhost:8000`.

## Correzione 1.1
Il generatore ora evita anche la ripetizione tra una cifra nascosta e una cifra già visibile nell’espressione; la verifica rifiuta queste ripetizioni. Cache offline aggiornata.

## Nuova modalità Sfida (v1.2)
- 5 minuti non interrompibili una volta iniziati.
- Parte dal livello 1, passa ai livelli 2, 3 e 4 dopo rispettivamente 3, 7 e 12 risposte corrette.
- Quesiti illimitati, saltare è possibile, nessun feedback durante la prova.
- A tempo scaduto: corrette, errate, saltate, livello raggiunto e corrette al minuto.
- Questa progressione è progettata per l’allenamento: **non** riproduce la valutazione proprietaria Aon.
