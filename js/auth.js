/**
 * DRAFT-LAB — Student Authentication, History Log & Google Spreadsheet Integration
 * Handles:
 * - Student Login (Nama Lengkap, No. Absen, Kelas)
 * - Persistent browser session (localStorage)
 * - Automatic Google Spreadsheet sync via Google Apps Script (Web App)
 * - Built-in Student History Log & 1-Click Excel (.CSV) Export
 * - Dynamic Topbar Profile updates & Account Switch
 */

const AUTH_STORAGE_KEY = 'draftlab_student_session';
const HISTORY_STORAGE_KEY = 'draftlab_students_history';
const SCRIPT_URL_STORAGE_KEY = 'draftlab_sheets_url';

import { renderDiagnostikRekapTable, exportDiagnostikToCsv, getLockMode, setLockMode } from './diagnostik.js';
import { renderPostTestRekapTable, exportPostTestToCsv } from './post-test.js';

// Default Google Apps Script URL
export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFJaCScOY49jSX0mfliQJXBAatbN6mUGhoAqDlDcbxoiD6Jxj38jzcBb3wzwQp4IQ/exec';

export function getScriptUrl() {
  const saved = localStorage.getItem(SCRIPT_URL_STORAGE_KEY);
  if (saved && !saved.includes('GANTI_DENGAN_URL')) {
    return saved;
  }
  return DEFAULT_SCRIPT_URL;
}

export function setScriptUrl(url) {
  if (url && typeof url === 'string') {
    localStorage.setItem(SCRIPT_URL_STORAGE_KEY, url.trim());
  }
}

export function getStudentSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('Error reading student session:', err);
    return null;
  }
}

export function saveStudentSession(studentData) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(studentData));
  } catch (err) {
    console.error('Error saving student session:', err);
  }
}

export function clearStudentSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Get all students who have logged in on this browser
 */
export function getAllStudentsHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Record a login entry into history
 */
export function recordStudentLogin(student) {
  try {
    const history = getAllStudentsHistory();
    const entry = {
      id: Date.now(),
      nama: student.nama,
      absen: student.absen,
      kelas: student.kelas,
      waktu: new Date().toLocaleString('id-ID', { 
        dateStyle: 'medium', 
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta' 
      }),
      timestamp: new Date().toISOString()
    };
    
    // Taruh data terbaru di paling atas
    history.unshift(entry);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving student history log:', e);
  }
}

/**
 * Export student history to CSV (Directly opens in Microsoft Excel or Google Sheets)
 */
export function exportStudentsToCsv() {
  const history = getAllStudentsHistory();
  if (history.length === 0) {
    alert('Belum ada data siswa yang login untuk diunduh.');
    return;
  }

  // BOM untuk UTF-8 agar nama dengan simbol/karakter khusus terbaca rapi di Excel
  let csvContent = '\uFEFF';
  csvContent += 'No,Tanggal & Waktu,Nama Lengkap,No. Absen,Kelas\r\n';

  history.forEach((row, index) => {
    const no = index + 1;
    const waktu = `"${(row.waktu || row.timestamp || '').replace(/"/g, '""')}"`;
    const nama = `"${(row.nama || '').replace(/"/g, '""')}"`;
    const absen = `"${(row.absen || '').replace(/"/g, '""')}"`;
    const kelas = `"${(row.kelas || '').replace(/"/g, '""')}"`;
    csvContent += `${no},${waktu},${nama},${absen},${kelas}\r\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Siswa_DRAFT-LAB_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Send student login record to Google Sheets via Apps Script Web App
 */
export async function sendLoginToSpreadsheet(data) {
  const scriptUrl = getScriptUrl();
  
  // Jika URL masih placeholder bawaan, cukup log info
  if (!scriptUrl || scriptUrl.includes('GANTI_DENGAN_URL')) {
    console.info('[Google Sheets] URL Apps Script belum dikonfigurasi. Data tersimpan aman di Rekap Browser.');
    return { success: true, localOnly: true };
  }

  const payload = {
    action: 'login',
    nama: data.nama,
    absen: data.absen,
    kelas: data.kelas,
    timestamp: new Date().toISOString(),
    waktuLokal: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    userAgent: navigator.userAgent
  };

  try {
    // Mode 'no-cors' dengan text/plain memastikan pengiriman sukses dari GitHub Pages tanpa isu CORS preflight
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    return { success: true };
  } catch (error) {
    console.warn('[Google Sheets Sync] Gagal mengirim ke Spreadsheet, data tersimpan di browser:', error);
    return { success: false, error };
  }
}

/**
 * Update the top header profile widget with student info
 */
export function updateHeaderProfile(student) {
  const badgeLevel = document.getElementById('badge-level');
  const userSubLabel = document.querySelector('.header-user-badge .user-sub-label');
  const popoverName = document.getElementById('popover-student-name');
  const popoverMeta = document.getElementById('popover-student-meta');

  if (student && student.nama) {
    if (badgeLevel) {
      badgeLevel.textContent = student.nama;
      badgeLevel.title = student.nama;
    }
    if (userSubLabel) {
      userSubLabel.textContent = `Kelas: ${student.kelas} • No. ${student.absen}`;
      userSubLabel.title = `Kelas: ${student.kelas} | No. Absen: ${student.absen}`;
    }
    if (popoverName) popoverName.textContent = student.nama;
    if (popoverMeta) popoverMeta.textContent = `Kelas: ${student.kelas} • No. Absen: ${student.absen}`;
  } else {
    if (badgeLevel) badgeLevel.textContent = 'Draftsman Apprentice';
    if (userSubLabel) userSubLabel.textContent = 'Peserta PPG';
    if (popoverName) popoverName.textContent = 'Belum Login';
    if (popoverMeta) popoverMeta.textContent = 'Klik untuk masuk';
  }
}

/**
 * Show / Hide Login Modal
 */
export function showAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.classList.add('auth-modal-open');
  
  setTimeout(() => {
    document.getElementById('auth-name')?.focus();
  }, 120);
}

export function hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  modal.classList.add('fade-out');
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('fade-out');
    document.body.classList.remove('auth-modal-open');
  }, 250);
}

/**
 * Render Student History Table inside the Admin Modal
 */
export function renderRekapTable() {
  const tbody = document.getElementById('rekap-table-body');
  const countBadge = document.getElementById('rekap-total-count');
  if (!tbody) return;

  const history = getAllStudentsHistory();
  if (countBadge) countBadge.textContent = `${history.length} Siswa Tercatat`;

  if (history.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: #94a3b8;">
          Belum ada data siswa yang login.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = history.map((item, idx) => `
    <tr>
      <td><span class="rekap-num-badge">${idx + 1}</span></td>
      <td><strong>${escapeHtml(item.nama)}</strong></td>
      <td>${escapeHtml(item.absen)}</td>
      <td><span class="rekap-class-pill">${escapeHtml(item.kelas)}</span></td>
      <td style="color: #64748b; font-size: 0.78rem;">${escapeHtml(item.waktu || '-')}</td>
    </tr>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const DEV_PASSWORD = 'str08';
const DEV_SESSION_KEY = 'draftlab_dev_mode_unlocked';

export function isDevModeUnlocked() {
  return sessionStorage.getItem(DEV_SESSION_KEY) === 'true';
}

export function unlockDevMode() {
  sessionStorage.setItem(DEV_SESSION_KEY, 'true');
}

export function lockDevMode() {
  sessionStorage.removeItem(DEV_SESSION_KEY);
}

export function showDevModal() {
  const modal = document.getElementById('dev-modal');
  if (!modal) return;
  const pwdInput = document.getElementById('dev-password-input');
  const alertBox = document.getElementById('dev-alert');
  if (pwdInput) {
    pwdInput.value = '';
    pwdInput.type = 'password';
  }
  const eyeIconShow = document.getElementById('eye-icon-show');
  const eyeIconHide = document.getElementById('eye-icon-hide');
  if (eyeIconShow) eyeIconShow.style.display = 'block';
  if (eyeIconHide) eyeIconHide.style.display = 'none';
  if (alertBox) alertBox.style.display = 'none';

  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
  setTimeout(() => pwdInput?.focus(), 120);
}

export function hideDevModal() {
  const modal = document.getElementById('dev-modal');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.classList.remove('modal-open');
}

/**
 * Show / Hide Rekap Modal (Hanya bisa dibuka jika Developer Mode aktif)
 */
export function showRekapModal() {
  if (!isDevModeUnlocked()) {
    showDevModal();
    return;
  }

  const modal = document.getElementById('rekap-modal');
  if (!modal) return;
  renderRekapTable();
  renderDiagnostikRekapTable();

  // Set lock select value
  const lockSelect = document.getElementById('teacher-lock-mode-select');
  if (lockSelect) {
    lockSelect.value = getLockMode();
  }
  
  // Isi input URL Apps Script yang tersimpan
  const urlInput = document.getElementById('sheet-url-input');
  if (urlInput) {
    const currentUrl = localStorage.getItem(SCRIPT_URL_STORAGE_KEY) || '';
    urlInput.value = currentUrl;
  }

  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
}

export function hideRekapModal() {
  const modal = document.getElementById('rekap-modal');
  if (!modal) return;
  modal.style.display = 'none';
  document.body.classList.remove('modal-open');
}

/**
 * Initialize Authentication & Rekap System
 */
export function initAuth() {
  const authForm = document.getElementById('auth-form');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const userBadge = document.getElementById('header-user-badge');
  const userPopover = document.getElementById('user-popover');
  const btnLogout = document.getElementById('btn-change-account');
  const btnOpenRekap = document.getElementById('btn-open-rekap');
  const btnCloseRekap = document.getElementById('btn-close-rekap');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const btnSaveSheetUrl = document.getElementById('btn-save-sheet-url');

  // 1. Cek sesi yang sudah ada di localStorage
  const currentSession = getStudentSession();

  if (currentSession && currentSession.nama) {
    updateHeaderProfile(currentSession);
  } else {
    // Tampilkan modal login setelah splash screen selesai
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen && splashScreen.style.display !== 'none') {
      setTimeout(() => {
        showAuthModal();
      }, 2600);
    } else {
      showAuthModal();
    }
  }

  // 2. Event Submit Form Login
  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('auth-name');
      const absenInput = document.getElementById('auth-absen');
      const kelasInput = document.getElementById('auth-kelas');

      const nama = nameInput?.value.trim();
      const absen = absenInput?.value.trim();
      const kelas = kelasInput?.value.trim();

      if (!nama || !absen || !kelas) {
        showAuthAlert('Harap isi semua kolom identitas dengan benar.', 'error');
        return;
      }

      // State loading tombol
      if (authSubmitBtn) {
        authSubmitBtn.disabled = true;
        authSubmitBtn.classList.add('is-loading');
      }

      const studentData = {
        nama,
        absen,
        kelas,
        loginAt: new Date().toISOString()
      };

      // 1. Simpan sesi login aktif
      saveStudentSession(studentData);
      updateHeaderProfile(studentData);

      // Sinkronkan data siswa ke seluruh modul (LKPD, Etiket, dll)
      try {
        window.dispatchEvent(new CustomEvent('draftlab:student-login', { detail: studentData }));
      } catch (evErr) {
        console.warn('Error dispatching student-login event:', evErr);
      }

      // 2. Simpan di log histori rekap
      recordStudentLogin(studentData);

      // 3. Kirim ke Google Sheets di background (non-blocking)
      sendLoginToSpreadsheet(studentData).catch((err) => console.warn(err));

      // Berikan visual feedback cepat
      setTimeout(() => {
        if (authSubmitBtn) {
          authSubmitBtn.classList.remove('is-loading');
          authSubmitBtn.disabled = false;
        }

        hideAuthModal();
        showLoginToast(`Selamat belajar, ${nama}!`);
      }, 500);
    });
  }

  // 3. User Badge Popover Toggle
  if (userBadge && userPopover) {
    userBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = userPopover.style.display === 'block';
      userPopover.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!userPopover.contains(e.target) && !userBadge.contains(e.target)) {
        userPopover.style.display = 'none';
      }
    });
  }

  // 4. Tombol Ganti Akun / Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirm('Apakah Anda ingin ganti akun siswa atau keluar?')) {
        clearStudentSession();
        updateHeaderProfile(null);
        try {
          window.dispatchEvent(new CustomEvent('draftlab:student-logout'));
        } catch (evErr) {
          console.warn('Error dispatching student-logout event:', evErr);
        }
        if (userPopover) userPopover.style.display = 'none';
        
        authForm?.reset();
        showAuthModal();
      }
    });
  }

  // 5. Tombol Buka Modal Rekap Data Siswa
  if (btnOpenRekap) {
    btnOpenRekap.addEventListener('click', () => {
      if (userPopover) userPopover.style.display = 'none';
      showRekapModal();
    });
  }

  if (btnCloseRekap) {
    btnCloseRekap.addEventListener('click', hideRekapModal);
  }

  // 6. Tombol Download CSV
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', exportStudentsToCsv);
  }

  // 6b. Tab Switcher Rekap (Login vs Diagnostik vs Post-Test)
  const tabLogin = document.getElementById('tab-btn-rekap-login');
  const tabDiag = document.getElementById('tab-btn-rekap-diag');
  const tabPostTest = document.getElementById('tab-btn-rekap-posttest');
  const loginView = document.getElementById('rekap-login-view');
  const diagView = document.getElementById('rekap-diag-view');
  const postTestView = document.getElementById('rekap-posttest-view');
  const btnExportDiag = document.getElementById('btn-export-diag-csv');
  const btnExportPostTest = document.getElementById('btn-export-posttest-csv');
  const lockSelect = document.getElementById('teacher-lock-mode-select');

  const activateTab = (activeTabBtn, activeView, renderFn) => {
    [tabLogin, tabDiag, tabPostTest].forEach(tab => {
      if (tab) {
        tab.classList.remove('active');
        tab.style.borderBottomColor = 'transparent';
        tab.style.color = '#64748b';
      }
    });
    [loginView, diagView, postTestView].forEach(view => {
      if (view) view.style.display = 'none';
    });

    if (activeTabBtn) {
      activeTabBtn.classList.add('active');
      activeTabBtn.style.borderBottomColor = '#2567b9';
      activeTabBtn.style.color = '#2567b9';
    }
    if (activeView) activeView.style.display = 'block';
    if (typeof renderFn === 'function') renderFn();
  };

  tabLogin?.addEventListener('click', () => activateTab(tabLogin, loginView, renderRekapTable));
  tabDiag?.addEventListener('click', () => activateTab(tabDiag, diagView, renderDiagnostikRekapTable));
  tabPostTest?.addEventListener('click', () => activateTab(tabPostTest, postTestView, renderPostTestRekapTable));

  if (btnExportDiag) {
    btnExportDiag.addEventListener('click', exportDiagnostikToCsv);
  }

  if (btnExportPostTest) {
    btnExportPostTest.addEventListener('click', exportPostTestToCsv);
  }

  if (lockSelect) {
    lockSelect.value = getLockMode();
    lockSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      setLockMode(mode);
      alert(`Mode Kunci Platform diubah menjadi: ${mode.toUpperCase()}`);
    });
  }

  // 7. Tombol Reset / Bersihkan Riwayat
  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin menghapus riwayat rekap siswa di browser ini?')) {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
        renderRekapTable();
      }
    });
  }

  // 8. Tombol Simpan URL Spreadsheet
  if (btnSaveSheetUrl) {
    btnSaveSheetUrl.addEventListener('click', () => {
      const urlInput = document.getElementById('sheet-url-input');
      const val = urlInput?.value.trim() || '';
      if (val) {
        setScriptUrl(val);
        alert('URL Google Spreadsheet berhasil disimpan! Data login siswa akan langsung disinkronkan ke link tersebut.');
      } else {
        localStorage.removeItem(SCRIPT_URL_STORAGE_KEY);
        alert('URL Google Spreadsheet direset ke default.');
      }
    });
  }

  // 9. Developer Mode Form & Controls (Password: str08)
  const devAuthForm = document.getElementById('dev-auth-form');
  const devPwdInput = document.getElementById('dev-password-input');
  const devAlert = document.getElementById('dev-alert');
  const btnCancelDev = document.getElementById('btn-cancel-dev');
  const btnToggleDevPwd = document.getElementById('btn-toggle-dev-pwd');
  const btnLockDev = document.getElementById('btn-lock-dev');
  const eyeIconShow = document.getElementById('eye-icon-show');
  const eyeIconHide = document.getElementById('eye-icon-hide');
  const devModal = document.getElementById('dev-modal');

  if (devAuthForm) {
    devAuthForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = devPwdInput?.value.trim() || '';
      if (val === DEV_PASSWORD) {
        unlockDevMode();
        hideDevModal();
        showRekapModal();
        showLoginToast('🔓 Developer Mode Aktif! Akses rekap terbuka.');
      } else {
        if (devAlert) {
          devAlert.style.display = 'block';
          devAlert.classList.remove('shake');
          void devAlert.offsetWidth; // Force reflow
          devAlert.classList.add('shake');
        }
        if (devPwdInput) {
          devPwdInput.select();
        }
      }
    });
  }

  if (btnCancelDev) {
    btnCancelDev.addEventListener('click', hideDevModal);
  }

  if (devModal) {
    devModal.addEventListener('click', (e) => {
      if (e.target === devModal) hideDevModal();
    });
  }

  if (btnToggleDevPwd && devPwdInput) {
    btnToggleDevPwd.addEventListener('click', () => {
      const isPwd = devPwdInput.type === 'password';
      devPwdInput.type = isPwd ? 'text' : 'password';
      if (eyeIconShow && eyeIconHide) {
        eyeIconShow.style.display = isPwd ? 'none' : 'block';
        eyeIconHide.style.display = isPwd ? 'block' : 'none';
      }
    });
  }

  if (btnLockDev) {
    btnLockDev.addEventListener('click', () => {
      lockDevMode();
      hideRekapModal();
      showLoginToast('🔒 Developer Mode Telah Dikunci.');
    });
  }
}

function showAuthAlert(message, type = 'error') {
  const alertBox = document.getElementById('auth-alert');
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.className = `auth-alert auth-alert-${type}`;
  alertBox.style.display = 'block';
  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 4000);
}

function showLoginToast(message) {
  let toast = document.getElementById('auth-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'auth-toast';
    toast.className = 'auth-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
