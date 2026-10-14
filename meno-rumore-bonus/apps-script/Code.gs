/**
 * Riceve i lead dalla landing del bonus "Il quaderno del rumore"
 * e li scrive nella scheda "Lead" di questo Google Sheet.
 *
 * Da incollare così com'è: non serve modificare nulla.
 * Il codice segreto qui sotto è già identico a quello in .env.example.
 */
var SHARED_SECRET = 'vDolO8zbGAlOT14lCBqYYjF5PY5b4CBv';
var SHEET_NAME = 'Lead';
var HEADERS = ['Data prima iscrizione', 'Nome', 'Cognome', 'Email', 'Libro', 'Ultimo accesso', 'Accessi'];

function doPost(e) {
  var data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'bad_json' });
  }
  if (!data || data.secret !== SHARED_SECRET) {
    return json_({ ok: false, error: 'unauthorized' });
  }
  var nome = String(data.nome || '').trim().slice(0, 80);
  var cognome = String(data.cognome || '').trim().slice(0, 80);
  var email = String(data.email || '').trim().toLowerCase().slice(0, 160);
  var libro = String(data.libro || '').trim().slice(0, 160);
  if (!nome || !cognome || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json_({ ok: false, error: 'invalid' });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }
  try {
    var sheet = getSheet_();
    var now = new Date();
    var lastRow = sheet.getLastRow();
    var rowIndex = -1;
    if (lastRow > 1) {
      var emails = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
      for (var i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).trim().toLowerCase() === email) { rowIndex = i + 2; break; }
      }
    }
    if (rowIndex > 0) {
      // Email già presente: aggiorna nome, cognome, ultimo accesso e contatore.
      var count = Number(sheet.getRange(rowIndex, 7).getValue()) || 1;
      sheet.getRange(rowIndex, 2, 1, 2).setValues([[safe_(nome), safe_(cognome)]]);
      sheet.getRange(rowIndex, 5, 1, 3).setValues([[safe_(libro), now, count + 1]]);
    } else {
      sheet.appendRow([now, safe_(nome), safe_(cognome), safe_(email), safe_(libro), now, 1]);
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'write_failed' });
  } finally {
    lock.releaseLock();
  }
}

// Apri l'URL /exec nel browser per controllare che lo script sia attivo.
function doGet() {
  return json_({ ok: true, status: 'attivo' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Evita che un valore che inizia con = + - @ venga interpretato come formula.
function safe_(v) {
  v = String(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
