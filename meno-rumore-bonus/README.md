# Landing del bonus · Il quaderno del rumore

Pagina per i lettori di *Meno Rumore in Testa con lo Zen*: chiede nome, cognome ed email, salva i dati su un Google Sheet e solo dopo il salvataggio mostra il link alla cartella Drive del bonus (PDF del quaderno + 6 sfondi per il telefono).

Il link del bonus non è scritto da nessuna parte nella pagina: vive solo nelle impostazioni di Vercel e viene mandato al browser dopo che il Google Sheet ha confermato il salvataggio.

## Cosa c'è nella cartella

| File | A cosa serve |
|---|---|
| `index.html` e `assets/` | La pagina che vedono i lettori |
| `api/submit.js` | Riceve il modulo, salva il lead e restituisce il link del bonus |
| `api/config.js` | Fornisce alla pagina l'email per la privacy (facoltativa) |
| `apps-script/Code.gs` | Lo script da incollare nel Google Sheet |
| `.env.example` | Le impostazioni da copiare su Vercel, con il codice segreto già pronto |

Prima di cominciare ti servono: un account Google, un account GitHub e un account Vercel (bastano quelli gratuiti; su Vercel puoi entrare direttamente con GitHub).

---

## Passo 0 · Prepara la cartella del bonus su Drive

1. Su Google Drive crea una cartella, per esempio "Il quaderno del rumore".
2. Caricaci `Il_quaderno_del_rumore.pdf` e la cartella con i 6 sfondi.
3. Tasto destro sulla cartella → **Condividi** → in "Accesso generale" scegli **Chiunque abbia il link**, ruolo **Visualizzatore**.
4. **Copia link** e tienilo da parte: è il valore di `BONUS_DRIVE_URL`.

## Passo 1 · Google Sheet e Apps Script

1. Crea un nuovo Google Sheet vuoto (per esempio "Lead quaderno del rumore").
2. Menu **Estensioni → Apps Script**.
3. Cancella tutto il codice che trovi e incolla il contenuto di `apps-script/Code.gs` così com'è. Non serve modificare nulla.
4. Clicca l'icona del dischetto per salvare.
5. In alto a destra **Esegui il deployment → Nuovo deployment**.
6. Clicca l'ingranaggio accanto a "Seleziona tipo" e scegli **Applicazione web**. Imposta:
   - Esegui come: **Me**
   - Chi ha accesso: **Chiunque**
7. **Esegui il deployment** → **Autorizza accesso** → scegli il tuo account Google.
8. Comparirà la schermata "Google non ha verificato questa app". È normale per uno script personale: clicca **Avanzate** → **Vai a … (non sicuro)** → **Consenti**.
9. Copia l'**URL dell'applicazione web**: finisce con `/exec`. È il valore di `GOOGLE_SCRIPT_URL`.
10. Per controllare che funzioni, apri quell'URL in una nuova scheda: devi vedere `{"ok":true,"status":"attivo"}`.

## Passo 2 · GitHub

1. Scompatta lo zip.
2. Su github.com clicca **New repository**, chiamalo per esempio `meno-rumore-bonus`, lascialo **Private** e crealo.
3. Nella pagina del repository vuoto clicca **uploading an existing file**.
4. Trascina tutto il contenuto della cartella `meno-rumore-bonus` (non la cartella stessa, ma quello che c'è dentro), comprese le cartelle `api`, `apps-script`, `assets`.
5. I file che iniziano con il punto (`.gitignore`, `.env.example`) sul Mac sono nascosti: nella finestra del Finder premi **Cmd + Maiusc + .** per vederli e trascinali insieme agli altri.
6. **Commit changes**.

## Passo 3 · Vercel

1. Su vercel.com → **Add New… → Project** → importa il repository `meno-rumore-bonus`.
2. Prima di cliccare Deploy, apri **Environment Variables** e aggiungi queste (nome a sinistra, valore a destra):

| Nome | Valore |
|---|---|
| `GOOGLE_SCRIPT_URL` | L'URL `/exec` del passo 1 |
| `APPS_SCRIPT_SECRET` | Il valore già scritto in `.env.example`, copiato identico |
| `BONUS_DRIVE_URL` | Il link della cartella Drive del passo 0 |
| `PRIVACY_EMAIL` | Facoltativo: l'email a cui i lettori possono chiedere la cancellazione |

3. Clicca **Deploy**. Alla fine Vercel ti dà l'indirizzo della pagina (per esempio `meno-rumore-bonus.vercel.app`).

**Se aggiungi o cambi una variabile dopo il primo deploy**, la pagina non la vede finché non rifai il deploy: **Deployments** → i tre puntini sull'ultimo → **Redeploy**.

## Passo 4 · Prova completa

1. Apri l'indirizzo della pagina e compila il modulo con un tuo nome e una tua email di prova.
2. Il link al bonus deve comparire solo dopo l'invio. Aprilo e controlla che porti alla cartella Drive.
3. Nel Google Sheet guarda la scheda **Lead** in basso: la riga è lì, non nella prima scheda "Foglio1" che si apre di default.
4. Se compare un errore o la riga non arriva: su Vercel apri il progetto → **Logs** (i log di esecuzione, non quelli di build) e leggi il messaggio. I casi più frequenti:
   - "Configurazione incompleta: mancano …" → manca una variabile, aggiungila e fai **Redeploy**.
   - "Apps Script ha rifiutato il salvataggio: unauthorized" → `APPS_SCRIPT_SECRET` su Vercel non è identico a quello di `Code.gs`.
   - "Apps Script ha risposto in modo inatteso" → nel passo 1 "Chi ha accesso" non è impostato su **Chiunque**.

## Se un giorno modifichi Code.gs

Pubblica la nuova versione da **Esegui il deployment → Gestisci deployment → matita → Versione: Nuova versione → Esegui il deployment**. Non creare un "Nuovo deployment": genererebbe un URL `/exec` diverso e dovresti aggiornarlo anche su Vercel.

## I lead

Il Google Sheet è già l'elenco dei lead, aggiornato a ogni invio: data della prima iscrizione, nome, cognome, email, libro, ultimo accesso e numero di accessi. Se una persona si iscrive due volte con la stessa email, la riga viene aggiornata invece di essere duplicata.

## Privacy

La pagina spiega in breve perché vengono chiesti i dati e chiede il consenso con una casella. Prima di usare le email per comunicazioni oltre al bonus, verifica con un consulente gli obblighi del GDPR (informativa completa, titolare del trattamento, gestione delle cancellazioni).
