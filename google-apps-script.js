/**
 * =========================================================================
 * DRAFT-LAB — Google Apps Script Penampung Data Login Siswa
 * Target Spreadsheet: 
 * https://docs.google.com/spreadsheets/d/1iQ-Hew4uODs9xOa7nQHqoDFHPSjH58mRheshwSrmEWg/edit
 * =========================================================================
 * 
 * CARA MEMASANG (Hanya 1 Menit):
 * 1. Buka link Google Spreadsheet kamu: 
 *    https://docs.google.com/spreadsheets/d/1iQ-Hew4uODs9xOa7nQHqoDFHPSjH58mRheshwSrmEWg/edit
 * 2. Di menu atas Spreadsheet, klik "Ekstensi" (Extensions) > pilih "Apps Script".
 * 3. Hapus semua tulisan di editor Apps Script, lalu PASTE SEMUA kode di file ini.
 * 4. Klik ikon disket (Simpan / Ctrl+S).
 * 5. Klik tombol biru "Deploy" (Terapkan) di pojok kanan atas > pilih "New deployment" (Penerapan baru).
 * 6. Klik ikon gerigi (Select type) > pilih "Web app" (Aplikasi web).
 * 7. Isi pengaturannya:
 *    - Description : Login Siswa DRAFT-LAB
 *    - Execute as  : Me (email kamu)
 *    - Who has access : Anyone (Siapa saja)  <-- PENTING! Agar siswa dari web bisa kirim tanpa login Google
 * 8. Klik tombol "Deploy". Berikan izin (Authorize Access) jika diminta Google.
 * 9. Salin URL Web App yang berakhiran "/exec" (contoh: https://script.google.com/macros/s/AKfycb.../exec).
 * 10. Di web kamu, klik profil pojok kanan atas > "Rekap Data Siswa" > paste link /exec tersebut > klik Simpan.
 */

const SPREADSHEET_ID = '1iQ-Hew4uODs9xOa7nQHqoDFHPSjH58mRheshwSrmEWg';

function doPost(e) {
  try {
    let ss;
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (err) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    // 1. Ekstrak data JSON yang dikirim dari web
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    const action = data.action || 'login';

    if (action === 'diagnostik') {
      // Sheet tab khusus hasil tes diagnostik
      let diagSheet = ss.getSheetByName('Tes Diagnostik');
      if (!diagSheet) {
        diagSheet = ss.insertSheet('Tes Diagnostik');
      }

      if (diagSheet.getLastRow() === 0) {
        diagSheet.appendRow([
          'No', 'ID Tiket', 'Waktu Serah (WIB)', 'Nama Siswa', 'No. Absen', 'Kelas',
          'Skor PG (25)', 'Uraian Selesai (4)',
          'Soal 1', 'Soal 2', 'Soal 3', 'Soal 4', 'Soal 5',
          'Pilihan Soal 6', 'Alasan Soal 6', 'Informasi Soal 7', 'Dampak Soal 8',
          'Uraian Kritis Soal 9'
        ]);

        const header = diagSheet.getRange(1, 1, 1, 18);
        header.setFontWeight('bold');
        header.setBackground('#1e3a8a'); // Dark blue
        header.setFontColor('#ffffff');
        header.setHorizontalAlignment('center');
        diagSheet.setRowHeight(1, 35);
        diagSheet.setFrozenRows(1);
      }

      const rowNum = Math.max(1, diagSheet.getLastRow());
      const waktu = data.waktuLokal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
      
      diagSheet.appendRow([
        rowNum, data.id || '-', waktu, data.nama || '-', data.absen || '-', data.kelas || '-',
        data.mcqScore || 0, (data.essayAnsweredCount || 4) + '/4',
        data.q1 || '-', data.q2 || '-', data.q3 || '-', data.q4 || '-', data.q5 || '-',
        data.q6_choice || '-', data.q6_reason || '-', data.q7_info || '-', data.q8_impact || '-',
        data.q9_critical || '-'
      ]);

      const lastRow = diagSheet.getLastRow();
      diagSheet.getRange(lastRow, 1).setHorizontalAlignment('center');
      diagSheet.getRange(lastRow, 5).setHorizontalAlignment('center');
      diagSheet.getRange(lastRow, 6).setHorizontalAlignment('center');
      diagSheet.getRange(lastRow, 7).setHorizontalAlignment('center');
      diagSheet.getRange(lastRow, 8).setHorizontalAlignment('center');

      return ContentService.createTextOutput(
        JSON.stringify({ status: 'success', message: 'Data diagnostik berhasil disimpan' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'posttest') {
      let postSheet = null;
      const sheets = ss.getSheets();
      for (let s of sheets) {
        if (s.getSheetId() === 473406807 || s.getName() === 'Post-Test Pemahaman') {
          postSheet = s;
          break;
        }
      }
      if (!postSheet) {
        postSheet = ss.getSheetByName('Post-Test Pemahaman') || ss.insertSheet('Post-Test Pemahaman');
      }

      if (postSheet.getName() !== 'Post-Test Pemahaman') {
        try { postSheet.setName('Post-Test Pemahaman'); } catch (err) {}
      }

      // Buat header jika sheet masih kosong
      if (postSheet.getLastRow() === 0) {
        setupPostTestHeaders(postSheet);
      }

      const nextRow = postSheet.getLastRow() + 1;
      const waktu = data.waktuLokal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
      const mcqScore = Number(data.mcqScore) || 0;

      // Formula otomatis untuk Nilai Akhir (Skor PG + Nilai Esai Guru)
      const formulaTotal = `=G${nextRow}+J${nextRow}`;
      const formulaPredikat = `=IF(K${nextRow}>=85, "SANGAT KOMPETEN (A) ⭐", IF(K${nextRow}>=75, "KOMPETEN (B) ✅", IF(K${nextRow}>=60, "CUKUP (C) ⚠️", "PERLU PEMBINAAN (D) ❌")))`;

      let rowValues = [
        nextRow - 1,                                                          // Col A (1): No
        data.id || '-',                                                       // Col B (2): ID Tiket
        waktu,                                                                // Col C (3): Waktu Selesai (WIB)
        data.nama || '-',                                                     // Col D (4): Nama Lengkap Siswa
        data.absen || '-',                                                    // Col E (5): No. Absen
        data.kelas || '-',                                                    // Col F (6): Kelas
        mcqScore,                                                             // Col G (7): Skor PG (Maks 60)
        data.mcqCorrectCount || (Math.round(mcqScore / 3) + ' / 20'),        // Col H (8): Benar PG
        data.essayCountFormatted || ((data.essayAnsweredCount || 0) + ' / 15'), // Col I (9): Esai Terisi
        '',                                                                   // Col J (10): Nilai Esai Guru (Diisi Manual Guru)
        formulaTotal,                                                         // Col K (11): TOTAL NILAI AKHIR (100)
        formulaPredikat,                                                      // Col L (12): Predikat Capaian
        data.pelanggaranTab ? ('⚠️ ' + data.pelanggaranTab + 'x Pindah Tab') : 'Tertib (0x)' // Col M (13): Integritas CBT
      ];

      // Cols N s.d. AG (14 s.d. 33): Detail PG 1 s.d. 20 (dengan simbol ✅ / ❌)
      for (let i = 1; i <= 20; i++) {
        rowValues.push(data['pg_' + i] || data['q' + i] || '-');
      }

      // Cols AH s.d. AV (34 s.d. 48): Detail Jawaban Esai 21 s.d. 35
      for (let j = 21; j <= 35; j++) {
        rowValues.push(data['q' + j] || '-');
      }

      postSheet.appendRow(rowValues);

      // --- FORMATTING ROW DATA ---
      const lastRow = postSheet.getLastRow();
      postSheet.getRange(lastRow, 1, 1, 48).setVerticalAlignment('top').setFontSize(10);
      postSheet.getRange(lastRow, 1).setHorizontalAlignment('center'); // No
      postSheet.getRange(lastRow, 2).setHorizontalAlignment('center'); // ID Tiket
      postSheet.getRange(lastRow, 3).setHorizontalAlignment('center'); // Waktu
      postSheet.getRange(lastRow, 4).setFontWeight('bold');           // Nama Siswa
      postSheet.getRange(lastRow, 5).setHorizontalAlignment('center'); // No. Absen
      postSheet.getRange(lastRow, 6).setHorizontalAlignment('center'); // Kelas

      // Skor PG (Col G)
      const mcqCell = postSheet.getRange(lastRow, 7);
      mcqCell.setHorizontalAlignment('center').setFontWeight('bold').setFontSize(11).setBackground('#eff6ff');

      postSheet.getRange(lastRow, 8).setHorizontalAlignment('center'); // Benar PG
      postSheet.getRange(lastRow, 9).setHorizontalAlignment('center'); // Esai Terisi

      // Kolom Input Guru Esai (Col J) - Highlight Kuning Terang agar guru mudah melihat tempat input nilai
      const essayScoreCell = postSheet.getRange(lastRow, 10);
      essayScoreCell.setHorizontalAlignment('center').setFontWeight('bold').setFontSize(11).setBackground('#fef9c3');

      // Kolom Total Nilai Akhir (Col K) - Highlight Hijau Segar
      const totalCell = postSheet.getRange(lastRow, 11);
      totalCell.setHorizontalAlignment('center').setFontWeight('bold').setFontSize(11).setBackground('#dcfce7').setFontColor('#15803d');

      // Predikat (Col L)
      postSheet.getRange(lastRow, 12).setHorizontalAlignment('center').setFontWeight('bold');

      // Status CBT (Col M)
      postSheet.getRange(lastRow, 13).setHorizontalAlignment('center');

      // Center kolom PG 1-20
      postSheet.getRange(lastRow, 14, 1, 20).setHorizontalAlignment('center');

      // Wrap text pada seluruh kolom esai 21-35 agar mudah dibaca
      postSheet.getRange(lastRow, 34, 1, 15).setWrap(true);

      // Zebra striping untuk baris genap
      if (lastRow % 2 === 0) {
        postSheet.getRange(lastRow, 1, 1, 6).setBackground('#f8fafc');
        postSheet.getRange(lastRow, 8, 1, 2).setBackground('#f8fafc');
        postSheet.getRange(lastRow, 12, 1, 37).setBackground('#f8fafc');
      }

      return ContentService.createTextOutput(
        JSON.stringify({ status: 'success', message: 'Data post-test berhasil disimpan di spreadsheet' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Default: Presensi Login
    let sheet = ss.getSheetByName('Presensi Login') || ss.getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['No', 'Waktu Login (WIB)', 'Nama Lengkap', 'No. Absen', 'Kelas', 'Browser / Perangkat']);
      const header = sheet.getRange(1, 1, 1, 6);
      header.setFontWeight('bold');
      header.setBackground('#1e293b');
      header.setFontColor('#ffffff');
      header.setHorizontalAlignment('center');
      sheet.setRowHeight(1, 35);
      sheet.setFrozenRows(1);
    }

    const rowNumber = Math.max(1, sheet.getLastRow());
    const waktu = data.waktuLokal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    sheet.appendRow([rowNumber, waktu, data.nama || '-', data.absen || '-', data.kelas || '-', data.userAgent || '-']);

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1).setHorizontalAlignment('center');
    sheet.getRange(lastRow, 4).setHorizontalAlignment('center');
    sheet.getRange(lastRow, 5).setHorizontalAlignment('center');

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', message: 'Data siswa tersimpan' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Setup Tata Letak & Header Tabel Post-Test yang Elegan
 */
function setupPostTestHeaders(sheet) {
  let headers = [
    'No', 'ID Tiket', 'Waktu Selesai (WIB)', 'Nama Lengkap Siswa', 'No. Absen', 'Kelas',
    'Skor PG (60)', 'Benar PG (20)', 'Esai Terisi (15)', 'Nilai Esai Guru (40)', 'TOTAL NILAI (100)', 'Predikat Kelulusan', 'Catatan CBT'
  ];

  const keys = {
    1:'B', 2:'C', 3:'B', 4:'B', 5:'A', 6:'A', 7:'A', 8:'B', 9:'C', 10:'B',
    11:'B', 12:'B', 13:'B', 14:'B', 15:'A', 16:'B', 17:'B', 18:'B', 19:'A', 20:'C'
  };
  for (let i = 1; i <= 20; i++) {
    headers.push('PG ' + i + ' (K: ' + keys[i] + ')');
  }

  const essayTitles = [
    'Esai 21: Fungsi Standar ISO',
    'Esai 22: Alasan Standardisasi Internasional',
    'Esai 23: Gambar Sebagai Bahasa Teknik & Acuan',
    'Esai 24: Manfaat Gambar Sebelum Mesin',
    'Esai 25: 5 Sikap Kerja Profesional Gambar',
    'Esai 26: Alur Ide Desain ke Benda Nyata',
    'Esai 27: Menjaga Kebersihan Alat & Kertas',
    'Esai 28: Karakteristik Pensil H vs 2B',
    'Esai 29: 6 Alat Gambar Teknik & Fungsinya',
    'Esai 30: Alat & Bahan yang Harus Disiapkan',
    'Esai 31: Fungsi Etiket & Sudut Kanan Bawah',
    'Esai 32: 5 Informasi Wajib Dalam Etiket',
    'Esai 33: Arti Skala 1:1, 1:2, dan 2:1',
    'Esai 34: Ukuran Kertas A0 s.d. A4 (mm)',
    'Esai 35: Hubungan Seri A & Hasil A3 Dibagi 2'
  ];
  for (let t of essayTitles) {
    headers.push(t);
  }

  sheet.appendRow(headers);

  // Set Row Height & Freeze
  sheet.setRowHeight(1, 42);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(6); // Kolom 1-6 (Identitas Siswa) tetap terkunci saat scroll horizontal

  // Styling Header
  const totalCols = headers.length;
  const headerRange = sheet.getRange(1, 1, 1, totalCols);
  headerRange.setFontWeight('bold');
  headerRange.setFontColor('#ffffff');
  headerRange.setVerticalAlignment('middle');
  headerRange.setHorizontalAlignment('center');
  headerRange.setFontSize(10);

  // Palet Warna Header Elegan per Kategori
  sheet.getRange(1, 1, 1, 6).setBackground('#1e293b');   // 1-6: Identitas Siswa (Navy Gelap)
  sheet.getRange(1, 7, 1, 3).setBackground('#1d4ed8');   // 7-9: Skor PG & Esai (Biru Royal)
  sheet.getRange(1, 10, 1, 3).setBackground('#047857');  // 10-12: Nilai Akhir & Predikat Guru (Hijau Zamrud)
  sheet.getRange(1, 13).setBackground('#b45309');        // 13: Catatan Integritas CBT (Amber)
  sheet.getRange(1, 14, 1, 20).setBackground('#334155'); // 14-33: Rincian PG 1-20 (Slate)
  sheet.getRange(1, 34, 1, 15).setBackground('#0f766e'); // 34-48: Rincian Esai 21-35 (Teal)

  // Lebar Kolom Nyaman Dibaca
  sheet.setColumnWidth(1, 50);   // No
  sheet.setColumnWidth(2, 115);  // ID Tiket
  sheet.setColumnWidth(3, 145);  // Waktu
  sheet.setColumnWidth(4, 220);  // Nama Siswa
  sheet.setColumnWidth(5, 75);   // Absen
  sheet.setColumnWidth(6, 110);  // Kelas
  sheet.setColumnWidth(7, 115);  // Skor PG
  sheet.setColumnWidth(8, 100);  // Benar PG
  sheet.setColumnWidth(9, 105);  // Esai Terisi
  sheet.setColumnWidth(10, 145); // Nilai Esai Guru
  sheet.setColumnWidth(11, 140); // Total Nilai Akhir
  sheet.setColumnWidth(12, 160); // Predikat
  sheet.setColumnWidth(13, 140); // Catatan CBT

  // Lebar kolom PG
  for (let i = 14; i <= 33; i++) {
    sheet.setColumnWidth(i, 90);
  }

  // Lebar kolom Esai (320px lapang & lega)
  for (let j = 34; j <= 48; j++) {
    sheet.setColumnWidth(j, 320);
  }
}

/**
 * FUNGSI INSTAN: Jalankan fungsi ini langsung di editor Apps Script
 * untuk memformat otomatis tab "Post-Test Pemahaman" di spreadsheet kamu!
 */
function setupPostTestSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let postSheet = null;
  const sheets = ss.getSheets();
  for (let s of sheets) {
    if (s.getSheetId() === 473406807 || s.getName() === 'Post-Test Pemahaman') {
      postSheet = s;
      break;
    }
  }
  if (!postSheet) {
    postSheet = ss.insertSheet('Post-Test Pemahaman');
  } else {
    postSheet.clear();
  }
  setupPostTestHeaders(postSheet);
  Logger.log('Tabel Post-Test Pemahaman berhasil diformat dengan sempurna!');
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'setup') {
    setupPostTestSheet();
    return ContentService.createTextOutput('Tabel Post-Test Pemahaman berhasil disiapkan!').setMimeType(ContentService.MimeType.TEXT);
  }
  return ContentService.createTextOutput(
    'DRAFT-LAB API Google Sheets aktif! Status: Siap menerima kiriman data nilai siswa.'
  ).setMimeType(ContentService.MimeType.TEXT);
}
