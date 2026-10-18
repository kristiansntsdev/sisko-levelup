/**
 * FORM MONITORING TEKNIS PENGGUNAAN SISKO PADA PELAKSANAAN EVENT
 * Sync otomatis dari SISKO (GET /api/internal/monitoring-sheet) tiap 5 menit.
 *
 * Setup sekali di spreadsheet tujuan:
 * 1. Extensions → Apps Script → ganti isi Code.gs dengan file ini → Save.
 * 2. Project Settings (ikon gear) → Script Properties → tambah:
 *      SISKO_API_URL     https://sisko-v2.vercel.app/api/internal/monitoring-sheet
 *      SISKO_API_SECRET  (nilai env MONITORING_SHEET_SECRET di Vercel)
 * 3. Pilih fungsi `setup` → Run → izinkan akses. Ini pasang trigger 5 menit + sync pertama.
 *
 * - Tab per tahun ("2026", "2027") dibangun ulang dari SISKO, dikelompokkan per bulan.
 *   Tahun berjalan + tahun depan dibuat otomatis kalau ada event; tahun lalu disinkron
 *   selama tabnya ada. Tahun lain: menu SISKO → Sinkron tab tahun…
 * - Kolom manual — Berita Acara ☑, Flyer ☑, Keterangan — disimpan per ID event
 *   (kolom P, tersembunyi), jadi tidak hilang walau baris bergeser.
 * - Ketepatan upload (H-14) / laporan (H+14) yang tidak tercatat di SISKO (event lama)
 *   juga dipertahankan dari centang manual.
 * - Sheet hanya ditulis kalau datanya berubah (version history tidak penuh).
 */

var FIRST_ROW = 4; // baris 1 judul, 2-3 header
var NCOLS = 16;
var C = {
  NO: 1, KOTA: 2, TANGGAL: 3, UPLOAD: 4, LINK_BA: 5, BA: 6, LINK_FLYER: 7, FLYER: 8,
  ABSEN: 9, LAPORAN: 10, LPJ: 11, DOK: 12, LINK_DOK: 13, KET: 14, CATATAN: 15, ID: 16,
};
var CHECKBOX_COLS = [C.UPLOAD, C.BA, C.FLYER, C.ABSEN, C.LAPORAN, C.LPJ, C.DOK];
var TEXT_COLS = [C.KOTA, C.TANGGAL, C.LINK_BA, C.LINK_FLYER, C.LINK_DOK, C.KET, C.CATATAN];
var MANUAL_COLS = [C.BA, C.FLYER, C.KET];
var MARKER = 'ID Event'; // header P2 — penanda tab dikelola script ini

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SISKO')
    .addItem('Sinkron sekarang', 'syncSisko')
    .addItem('Sinkron tab tahun…', 'syncYearPrompt')
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
  withLock_(function () {
    var y = Number(Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy'));
    syncYear_(y - 1, false);
    syncYear_(y, true);
    syncYear_(y + 1, true);
  });
}

function syncYearPrompt() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('Sinkron tab tahun', 'Tahun (contoh 2025):', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var year = Number(res.getResponseText().trim());
  if (!(year >= 2000 && year <= 2100)) {
    ui.alert('Tahun tidak valid');
    return;
  }
  withLock_(function () { syncYear_(year, true); });
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try {
    fn();
  } finally {
    lock.releaseLock();
  }
}

function fetchYear_(year) {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SISKO_API_URL');
  var secret = props.getProperty('SISKO_API_SECRET');
  if (!url || !secret) throw new Error('Isi Script Properties SISKO_API_URL dan SISKO_API_SECRET dulu');
  var res = UrlFetchApp.fetch(url + '?year=' + year, {
    headers: { Authorization: 'Bearer ' + secret },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error('SISKO ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300));
  }
  return JSON.parse(res.getContentText());
}

function syncYear_(year, allowCreate) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(String(year));
  if (!sheet && !allowCreate) return;

  var sections = fetchYear_(year).sections;
  if (!sheet) {
    if (!sections.length) return;
    sheet = ss.insertSheet(String(year));
    setupSheet_(sheet, year);
  } else if (sheet.getRange(2, C.ID).getValue() !== MARKER) {
    throw new Error('Tab "' + year + '" sudah ada tapi bukan buatan script ini. Ganti nama tab lama dulu.');
  }

  var lastRow = sheet.getLastRow();
  var old = lastRow >= FIRST_ROW
    ? sheet.getRange(FIRST_ROW, 1, lastRow - FIRST_ROW + 1, NCOLS).getValues()
    : [];
  var prev = {};
  old.forEach(function (r) {
    if (r[C.ID - 1] !== '') prev[r[C.ID - 1]] = r;
  });

  var grid = [];
  var isMonth = [];
  sections.forEach(function (s) {
    var month = [s.label];
    for (var i = 1; i < NCOLS; i++) month.push('');
    grid.push(month);
    isMonth.push(true);

    s.rows.forEach(function (e, idx) {
      var p = prev[e.id_event];
      var keep = function (col) { return p ? p[col - 1] === true : false; };
      grid.push([
        idx + 1,
        e.kota,
        e.tanggal,
        e.uploadTepatWaktu === null ? keep(C.UPLOAD) : e.uploadTepatWaktu,
        e.linkBeritaAcara,
        keep(C.BA),
        e.linkFlyer,
        keep(C.FLYER),
        e.absensi,
        e.laporanTepatWaktu === null ? keep(C.LAPORAN) : e.laporanTepatWaktu,
        e.lpj,
        e.dokumentasi,
        e.linkDokumentasi,
        p ? p[C.KET - 1] : '',
        e.catatan,
        e.id_event,
      ]);
      isMonth.push(false);
    });
  });

  if (sameGrid_(old, grid)) return;
  writeGrid_(sheet, grid, isMonth);
  sheet.getRange(1, C.CATATAN).setValue(
    'Diperbarui ' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm') + ' WIB'
  );
}

function sameGrid_(a, b) {
  if (a.length !== b.length) return false;
  for (var r = 0; r < a.length; r++) {
    for (var c = 0; c < NCOLS; c++) {
      if (String(a[r][c]) !== String(b[r][c])) return false;
    }
  }
  return true;
}

function colA1_(c) {
  return String.fromCharCode(64 + c);
}

function writeGrid_(sheet, grid, isMonth) {
  var need = FIRST_ROW + grid.length - 1;
  if (sheet.getMaxRows() < need) sheet.insertRowsAfter(sheet.getMaxRows(), need - sheet.getMaxRows());
  sheet.getRange(FIRST_ROW, 1, sheet.getMaxRows() - FIRST_ROW + 1, NCOLS)
    .breakApart()
    .clearDataValidations()
    .clear();
  if (!grid.length) return;

  var n = grid.length;
  TEXT_COLS.forEach(function (c) { sheet.getRange(FIRST_ROW, c, n, 1).setNumberFormat('@'); });

  // Checkbox hanya di baris event; dikelompokkan per blok antar header bulan
  var checkboxes = [];
  var monthRows = [];
  var start = null;
  var flush = function (end) {
    if (start === null) return;
    CHECKBOX_COLS.forEach(function (c) {
      checkboxes.push(colA1_(c) + start + ':' + colA1_(c) + end);
    });
    start = null;
  };
  isMonth.forEach(function (m, i) {
    var row = FIRST_ROW + i;
    if (m) {
      flush(row - 1);
      monthRows.push(row);
    } else if (start === null) {
      start = row;
    }
  });
  flush(FIRST_ROW + n - 1);
  if (checkboxes.length) sheet.getRangeList(checkboxes).insertCheckboxes();

  var range = sheet.getRange(FIRST_ROW, 1, n, NCOLS);
  range.setValues(grid)
    .setFontFamily('Arial')
    .setFontSize(9)
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
    .setBorder(true, true, true, true, true, true);
  [C.NO].concat(CHECKBOX_COLS).forEach(function (c) {
    sheet.getRange(FIRST_ROW, c, n, 1).setHorizontalAlignment('center');
  });
  sheet.getRange(FIRST_ROW, C.KET, n, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  monthRows.forEach(function (row) {
    sheet.getRange(row, 1, 1, NCOLS - 1)
      .merge()
      .setBackground('#ffff00')
      .setFontWeight('bold')
      .setHorizontalAlignment('left');
  });
}

function setupSheet_(sheet, year) {
  sheet.getRange(1, 1, 1, C.KET)
    .merge()
    .setValue('FORM MONITORING TEKNIS PENGGUNAAN SISKO PADA PELAKSANAAN EVENT - ' + year)
    .setFontWeight('bold')
    .setFontSize(12)
    .setHorizontalAlignment('center');
  sheet.getRange(1, C.CATATAN).setFontSize(8).setFontStyle('italic').setFontColor('#666666');

  var h2 = [
    'No', 'LevelUP Kota', 'Tanggal Event', 'Ketepatan waktu pengunggahan event (minimal H-14)',
    'Kelengkapan dokumen yang diunggah', '', '', '', 'Absensi SISKO',
    'Ketepatan waktu dan kelengkapan laporan pasca acara (maksimal H+14)',
    'Kelengkapan dokumen yang diunggah', '', '', 'Keterangan', 'Catatan Sistem', MARKER,
  ];
  var h3 = [
    '', '', '', '', 'Link Berita Acara', 'Berita Acara', 'Flyer', 'Flyer', '', '',
    'LPJ', 'Dokumentasi', 'Link Dokumentasi', '', '', '',
  ];
  sheet.getRange(2, 1, 2, NCOLS)
    .setValues([h2, h3])
    .setFontFamily('Arial')
    .setFontWeight('bold')
    .setFontSize(9)
    .setBackground('#d9d9d9')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setBorder(true, true, true, true, true, true);
  [C.NO, C.KOTA, C.TANGGAL, C.UPLOAD, C.ABSEN, C.LAPORAN, C.KET, C.CATATAN, C.ID].forEach(function (c) {
    sheet.getRange(2, c, 2, 1).merge();
  });
  sheet.getRange(2, C.LINK_BA, 1, 4).merge();
  sheet.getRange(2, C.LPJ, 1, 3).merge();

  var widths = {};
  widths[C.NO] = 35; widths[C.KOTA] = 130; widths[C.TANGGAL] = 140; widths[C.UPLOAD] = 110;
  widths[C.LINK_BA] = 120; widths[C.BA] = 75; widths[C.LINK_FLYER] = 120; widths[C.FLYER] = 60;
  widths[C.ABSEN] = 75; widths[C.LAPORAN] = 130; widths[C.LPJ] = 60; widths[C.DOK] = 85;
  widths[C.LINK_DOK] = 120; widths[C.KET] = 180; widths[C.CATATAN] = 320; widths[C.ID] = 70;
  Object.keys(widths).forEach(function (c) { sheet.setColumnWidth(Number(c), widths[c]); });
  sheet.setFrozenRows(3);
  sheet.hideColumns(C.ID);

  // Kolom otomatis: peringatan kalau diedit manual (akan tertimpa sync berikutnya)
  var protection = sheet.protect().setDescription('Diisi otomatis dari SISKO').setWarningOnly(true);
  protection.setUnprotectedRanges(MANUAL_COLS.map(function (c) {
    return sheet.getRange(FIRST_ROW, c, sheet.getMaxRows() - FIRST_ROW + 1, 1);
  }));
}
