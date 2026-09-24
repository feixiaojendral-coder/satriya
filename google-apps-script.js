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
      // Sheet tab khusus hasil Post-Test Pemahaman
      let postSheet = ss.getSheetByName('Post-Test Pemahaman');
      if (!postSheet) {
        postSheet = ss.insertSheet('Post-Test Pemahaman');
      }

      if (postSheet.getLastRow() === 0) {
        let headers = [
          'No', 'ID Tiket', 'Waktu Serah (WIB)', 'Nama Siswa', 'No. Absen', 'Kelas',
          'Skor PG (60)', 'Esai Terisi (10)', 'Estimasi Total'
        ];
        for (let i = 1; i <= 20; i++) headers.push('PG ' + i);
        for (let j = 21; j <= 30; j++) headers.push('Esai ' + j);

        postSheet.appendRow(headers);

        const headerRange = postSheet.getRange(1, 1, 1, headers.length);
        headerRange.setFontWeight('bold');
        headerRange.setBackground('#065f46'); // Dark emerald green
        headerRange.setFontColor('#ffffff');
        headerRange.setHorizontalAlignment('center');
        postSheet.setRowHeight(1, 35);
        postSheet.setFrozenRows(1);
      }

      const rowNum = Math.max(1, postSheet.getLastRow());
      const waktu = data.waktuLokal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
      
      let rowValues = [
        rowNum, data.id || '-', waktu, data.nama || '-', data.absen || '-', data.kelas || '-',
        data.mcqScoreFormatted || (data.mcqScore + '/60'),
        data.essayCountFormatted || (data.essayAnsweredCount + '/10'),
        data.estimatedScore || 0
      ];

      for (let i = 1; i <= 20; i++) rowValues.push(data['q' + i] || '-');
      for (let j = 21; j <= 30; j++) rowValues.push(data['q' + j] || '-');

      postSheet.appendRow(rowValues);

      const lastRow = postSheet.getLastRow();
      postSheet.getRange(lastRow, 1).setHorizontalAlignment('center');
      postSheet.getRange(lastRow, 5).setHorizontalAlignment('center');
      postSheet.getRange(lastRow, 6).setHorizontalAlignment('center');
      postSheet.getRange(lastRow, 7).setHorizontalAlignment('center');
      postSheet.getRange(lastRow, 8).setHorizontalAlignment('center');

      return ContentService.createTextOutput(
        JSON.stringify({ status: 'success', message: 'Data post-test berhasil disimpan' })
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

function doGet(e) {
  return ContentService.createTextOutput(
    'DRAFT-LAB API Google Sheets aktif! Status: Siap menerima kiriman data siswa.'
  ).setMimeType(ContentService.MimeType.TEXT);
}
