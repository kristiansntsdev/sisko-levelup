/**
 * KESAKSIAN + FEEDBACK APP dari SISKO (GET /api/internal/kesaksian-feedback-sheet) tiap 5 menit.
 *
 * Setup sekali:
 * 1. Buka spreadsheet tujuan → Extensions → Apps Script → ganti isi Code.gs dengan file ini → Save.
 * 2. Project Settings (ikon gear) → Script Properties → tambah:
 *      SISKO_API_URL     https://www.levelupgen.com/api/internal/kesaksian-feedback-sheet
 *                        (pakai www: levelupgen.com tanpa www redirect 308 ke www, dan script menolak redirect)
 *      SISKO_API_SECRET  (nilai env KESAKSIAN_SHEET_SECRET di Vercel)
 * 3. Pilih fungsi `setup` → Run → izinkan akses. Ini pasang trigger 5 menit + sync pertama.
 *
 * - Tab "Kesaksian" dan "Feedback APP" dibuat otomatis kalau belum ada. Kolom A-B (Nama, isi)
 *   dibangun ulang dari SISKO, terbaru di atas. Jangan ketik manual di A-B: akan tertimpa.
 * - Sheet hanya ditulis kalau datanya berubah (version history tidak penuh).
 * - Teks yang diawali = + - @ disimpan sebagai teks biasa, tidak pernah dijalankan sebagai rumus.
 */

var SPREADSHEET_ID = '1DEQvqgkDs2dz4jbILgosLsmGHS_FdnYXgCw4vTYmLb8';
var TABS = [
  { key: 'kesaksian', name: 'Kesaksian', header: ['Nama', 'Kesaksian'] },
  { key: 'feedback', name: 'Feedback APP', header: ['Nama', 'Feedback'] },
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SISKO')
    .addItem('Sinkron sekarang', 'syncSisko')
    .addToUi();
}

function setup() {
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'syncSisko'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncSisko').timeBased().everyMinutes(5).create();
  syncSisko();
}

function syncSisko() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    var data = fetchSisko_();
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    // Terlihat di Executions → klik satu run
    console.log('SISKO: ' + (data.kesaksian || []).length + ' kesaksian, ' + (data.feedback || []).length +
      ' feedback · tujuan "' + ss.getName() + '" ' + ss.getUrl());
    TABS.forEach(function (tab) { writeTab_(ss, tab, data[tab.key] || []); });
  } finally {
    lock.releaseLock();
  }
}

function fetchSisko_() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SISKO_API_URL');
  var secret = props.getProperty('SISKO_API_SECRET');
  if (!url || !secret) throw new Error('Isi Script Properties SISKO_API_URL dan SISKO_API_SECRET dulu');
  // followRedirects false: redirect ke domain lain membuang header Authorization (hasilnya 401 yang membingungkan)
  var res = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + secret },
    muteHttpExceptions: true,
    followRedirects: false,
  });
  var code = res.getResponseCode();
  if (code !== 200) throw new Error('SISKO HTTP ' + code + ': ' + res.getContentText().slice(0, 200));
  return JSON.parse(res.getContentText());
}

/** Tulis ulang kolom A-B satu tab kalau isinya beda dengan SISKO. */
function writeTab_(ss, tab, rows) {
  var sh = ss.getSheetByName(tab.name) || ss.insertSheet(tab.name);
  var values = [tab.header].concat(rows.map(function (r) { return [String(r.nama || ''), String(r.isi || '')]; }));

  var last = sh.getLastRow();
  var current = last > 0 ? sh.getRange(1, 1, last, 2).getDisplayValues() : [];
  if (JSON.stringify(current) === JSON.stringify(values)) {
    console.log(tab.name + ': tidak ada data baru (' + rows.length + ' baris), sheet tidak ditulis');
    return;
  }

  sh.getRange(1, 1, sh.getMaxRows(), 2).clearContent();
  if (sh.getMaxRows() < values.length) sh.insertRowsAfter(sh.getMaxRows(), values.length - sh.getMaxRows());
  // Format teks biasa: "0812..." tidak jadi angka, "1/2" tidak jadi tanggal
  sh.getRange(1, 1, sh.getMaxRows(), 2).setNumberFormat('@');
  sh.getRange(1, 1, values.length, 2)
    .setValues(values.map(function (row) { return row.map(asText_); }))
    .setVerticalAlignment('top');

  sh.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#161616').setFontColor('#ffd83d');
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 220);
  sh.setColumnWidth(2, 640);
  sh.getRange(1, 2, values.length, 1).setWrap(true);
  console.log(tab.name + ': ditulis ' + rows.length + ' baris');
}

/** Awalan ' membuat Sheets menyimpan teks apa adanya (tanpa tanda ' terlihat), jadi "=..." tidak jadi rumus. */
function asText_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
