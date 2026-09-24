/**
 * ==========================================================================
 * DRAFT-LAB — TES DIAGNOSTIK AWAL MODULE
 * Berdasarkan Instrumen Penelitian Tindakan Kelas (PTK) Gambar Teknik Manual
 * (9 Soal: 5 Pilihan Ganda + 4 Analisis & Kritis)
 * ==========================================================================
 */

import { getStudentSession, getScriptUrl } from './auth.js';

const LOCK_STORAGE_KEY = 'draftlab_lock_mode';
const DRAFT_STORAGE_KEY = 'draftlab_diagnostik_draft';
const SUBMISSIONS_STORAGE_KEY = 'draftlab_diagnostik_submissions';
const COMPLETED_STORAGE_KEY = 'draftlab_diagnostik_completed';

// Kunci Jawaban Pilihan Ganda Resmi (Sesuai Pedoman Penskoran PTK)
export const MCQ_KEYS = {
  q1: 'B', // Menyampaikan informasi bentuk dan ukuran benda secara jelas.
  q2: 'C', // Informasi untuk membuat benda belum lengkap.
  q3: 'C', // Bentuk dan ukuran benda.
  q4: 'B', // Penggaris.
  q5: 'C'  // Jangka.
};

// Initial State
let diagState = {
  activeSectionIndex: 0,
  lockMode: localStorage.getItem(LOCK_STORAGE_KEY) || 'locked', // 'locked', 'unlock_on_complete', 'unlocked'
  answers: {
    q1: null,
    q2: null,
    q3: null,
    q4: null,
    q5: null,
    q6_choice: null,
    q6_reason: '',
    q7_info: ['', '', '', ''],
    q8_impact: '',
    q9_critical: ''
  },
  student: {
    nama: '',
    absen: '',
    kelas: 'X T. Pemesinan',
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }
};

/**
 * Check if the web is currently locked for students
 */
export function isWebLocked() {
  const mode = localStorage.getItem(LOCK_STORAGE_KEY) || 'locked';
  if (mode === 'unlocked') return false;
  if (mode === 'unlock_on_complete') {
    return localStorage.getItem(COMPLETED_STORAGE_KEY) !== 'true';
  }
  // Default 'locked'
  return true;
}

export function getLockMode() {
  return localStorage.getItem(LOCK_STORAGE_KEY) || 'locked';
}

export function setLockMode(newMode) {
  localStorage.setItem(LOCK_STORAGE_KEY, newMode);
  diagState.lockMode = newMode;
  updateLockUI();
}

/**
 * Update Sidebar & UI according to lock status
 */
export function updateLockUI() {
  const locked = isWebLocked();
  const navItems = document.querySelectorAll('.nav-item');
  const banner = document.getElementById('web-locked-banner');

  if (banner) {
    banner.style.display = locked ? 'flex' : 'none';
  }

  navItems.forEach(item => {
    const target = item.getAttribute('data-target');
    // Khusus tahap ini, hanya modul Tes Pemahaman (Post-Test) yang terbuka
    const isAllowed = (target === 'quiz');
    if (isAllowed) {
      item.classList.remove('is-locked');
      const badge = item.querySelector('.nav-lock-badge');
      if (badge) badge.remove();
      return;
    }

    let badge = item.querySelector('.nav-lock-badge');
    if (locked) {
      item.classList.add('is-locked');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-lock-badge';
        badge.title = 'Terkunci — Khusus tahap ini hanya Tes Pemahaman (Post-Test) yang dibuka';
        badge.textContent = '🔒';
        item.appendChild(badge);
      }
    } else {
      item.classList.remove('is-locked');
      if (badge) badge.remove();
    }
  });
}

/**
 * Load draft answers from localStorage
 */
function loadSavedDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      diagState.answers = { ...diagState.answers, ...parsed };
    }
  } catch (err) {
    console.warn('Gagal memuat draf jawaban diagnostik:', err);
  }

  const session = getStudentSession();
  if (session && session.nama) {
    diagState.student.nama = session.nama;
    diagState.student.absen = session.absen || '';
    diagState.student.kelas = session.kelas || 'X T. Pemesinan';
  }
}

/**
 * Save draft answers to localStorage
 */
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(diagState.answers));
    const indicator = document.getElementById('diag-autosave-status');
    if (indicator) {
      indicator.textContent = 'Tersimpan otomatis';
    }
  } catch (err) {
    console.warn('Gagal menyimpan draf:', err);
  }
}

/**
 * Check if a question is answered
 */
function isQuestionAnswered(qKey) {
  const ans = diagState.answers;
  switch (qKey) {
    case 'q1': return !!ans.q1;
    case 'q2': return !!ans.q2;
    case 'q3': return !!ans.q3;
    case 'q4': return !!ans.q4;
    case 'q5': return !!ans.q5;
    case 'q6': return !!ans.q6_choice && ans.q6_reason.trim().length > 3;
    case 'q7': return ans.q7_info.filter(x => x.trim().length > 0).length >= 2;
    case 'q8': return ans.q8_impact.trim().length > 5;
    case 'q9': return ans.q9_critical.trim().length > 5;
    default: return false;
  }
}

/**
 * Calculate diagnostic scores
 */
export function calculateScores() {
  const ans = diagState.answers;

  // 1. Bagian 1: Pilihan Ganda (5 soal x 5 poin = maks 25)
  let mcqScore = 0;
  Object.keys(MCQ_KEYS).forEach(k => {
    if (ans[k] === MCQ_KEYS[k]) {
      mcqScore += 5;
    }
  });

  // 2. Status kelengkapan uraian (Soal 6, 7, 8, 9)
  let essayAnsweredCount = 0;
  if (isQuestionAnswered('q6')) essayAnsweredCount++;
  if (isQuestionAnswered('q7')) essayAnsweredCount++;
  if (isQuestionAnswered('q8')) essayAnsweredCount++;
  if (isQuestionAnswered('q9')) essayAnsweredCount++;

  return {
    mcqScore,
    mcqMax: 25,
    essayAnsweredCount,
    essayTotal: 4
  };
}

/**
 * Update UI progress bar and question navigator buttons
 */
export function updateProgressUI() {
  let totalAnswered = 0;
  const totalQuestions = 9;

  for (let i = 1; i <= 9; i++) {
    const qKey = `q${i}`;
    const answered = isQuestionAnswered(qKey);
    if (answered) totalAnswered++;

    const btn = document.querySelector(`.diag-nav-btn[data-q="${i}"]`);
    if (btn) {
      if (answered) {
        btn.classList.add('answered');
      } else {
        btn.classList.remove('answered');
      }
    }
  }

  const percent = Math.round((totalAnswered / totalQuestions) * 100);
  const progressBar = document.getElementById('diag-progress-bar-fill');
  const progressText = document.getElementById('diag-progress-text');
  const progressBadge = document.getElementById('diag-progress-badge');

  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressText) progressText.textContent = `${totalAnswered} dari ${totalQuestions} soal selesai`;
  if (progressBadge) progressBadge.textContent = `${percent}% Selesai`;
}

/**
 * Switch active section card
 */
export function switchSection(sectionIndex) {
  const sections = document.querySelectorAll('.diag-section-card');
  const tabs = document.querySelectorAll('.diag-sec-tab');
  const navBtns = document.querySelectorAll('.diag-nav-btn');

  if (sectionIndex < 0 || sectionIndex >= sections.length) return;

  diagState.activeSectionIndex = sectionIndex;

  sections.forEach((sec, idx) => {
    sec.classList.toggle('active', idx === sectionIndex);
  });

  tabs.forEach((tab, idx) => {
    tab.classList.toggle('active', idx === sectionIndex);
  });

  navBtns.forEach(btn => btn.classList.remove('active'));
  if (sectionIndex === 0) {
    document.querySelector('.diag-nav-btn[data-q="1"]')?.classList.add('active');
  } else if (sectionIndex === 1) {
    document.querySelector('.diag-nav-btn[data-q="6"]')?.classList.add('active');
  } else if (sectionIndex === 2) {
    document.querySelector('.diag-nav-btn[data-q="9"]')?.classList.add('active');
  }

  window.scrollTo({ top: 120, behavior: 'smooth' });
}

/**
 * Send Diagnostic Submission to Google Sheets Web App
 */
export async function sendDiagnostikToSpreadsheet(submissionData) {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl || scriptUrl.includes('GANTI_DENGAN_URL')) {
    console.info('[Google Sheets] URL belum disetel, data diagnostik disimpan di browser.');
    return { success: true, localOnly: true };
  }

  if (scriptUrl.includes('sheetdb.io')) {
    const diagRow = {
      'No': 'INCREMENT',
      'ID Tiket': submissionData.id,
      'Waktu Serah (WIB)': submissionData.waktu,
      'Nama Siswa': submissionData.student.nama,
      'No. Absen': submissionData.student.absen,
      'Kelas': submissionData.student.kelas,
      'Skor PG (25)': submissionData.scores.mcqScore,
      'Uraian Selesai (4)': `${submissionData.scores.essayAnsweredCount}/4`,
      'Soal 1': submissionData.answers.q1 || '-',
      'Soal 2': submissionData.answers.q2 || '-',
      'Soal 3': submissionData.answers.q3 || '-',
      'Soal 4': submissionData.answers.q4 || '-',
      'Soal 5': submissionData.answers.q5 || '-',
      'Pilihan Soal 6': submissionData.answers.q6_choice || '-',
      'Alasan Soal 6': submissionData.answers.q6_reason || '-',
      'Informasi Soal 7': (submissionData.answers.q7_info || []).join('; ') || '-',
      'Dampak Soal 8': submissionData.answers.q8_impact || '-',
      'Uraian Kritis Soal 9': submissionData.answers.q9_critical || '-'
    };
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: [diagRow] })
      });
      return { success: true };
    } catch (e) {
      console.warn('[Diagnostik SheetDB] Gagal mengirim:', e);
      return { success: false, error: e };
    }
  }

  const payload = {
    action: 'diagnostik',
    id: submissionData.id,
    waktuLokal: submissionData.waktu,
    nama: submissionData.student.nama,
    absen: submissionData.student.absen,
    kelas: submissionData.student.kelas,
    mcqScore: submissionData.scores.mcqScore,
    essayAnsweredCount: submissionData.scores.essayAnsweredCount,
    q1: submissionData.answers.q1,
    q2: submissionData.answers.q2,
    q3: submissionData.answers.q3,
    q4: submissionData.answers.q4,
    q5: submissionData.answers.q5,
    q6_choice: submissionData.answers.q6_choice,
    q6_reason: submissionData.answers.q6_reason,
    q7_info: submissionData.answers.q7_info.join('; '),
    q8_impact: submissionData.answers.q8_impact,
    q9_critical: submissionData.answers.q9_critical
  };

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return { success: true };
  } catch (err) {
    console.warn('Gagal sinkronisasi diagnostik ke Google Spreadsheet:', err);
    return { success: false, error: err };
  }
}

/**
 * Handle Final Submission of the Diagnostic Test
 */
export async function submitDiagnosticTest() {
  const student = diagState.student;
  if (!student.nama || !student.absen) {
    alert('Harap pastikan Nama Lengkap dan No. Absen sudah terisi di bagian atas lembar tes.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  let unanswered = [];
  for (let i = 1; i <= 9; i++) {
    if (!isQuestionAnswered(`q${i}`)) unanswered.push(i);
  }

  if (unanswered.length > 0) {
    const confirmSubmit = confirm(
      `Masih ada beberapa nomor soal yang belum lengkap diisi (${unanswered.join(', ')}).\n\nApakah Anda tetap ingin mengirimkan jawaban Anda sekarang?`
    );
    if (!confirmSubmit) return;
  } else {
    const confirmSubmit = confirm('Apakah Anda yakin ingin menyelesaikan dan mengirimkan Tes Diagnostik Awal ini?');
    if (!confirmSubmit) return;
  }

  const scores = calculateScores();
  const submissionId = `DL-DIAG-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const submissionRecord = {
    id: submissionId,
    timestamp: new Date().toISOString(),
    waktu: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }),
    student: { ...student },
    answers: JSON.parse(JSON.stringify(diagState.answers)),
    scores
  };

  try {
    const existingRaw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift(submissionRecord);
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('Gagal menyimpan riwayat penyerahan:', e);
  }

  localStorage.setItem(COMPLETED_STORAGE_KEY, 'true');
  sendDiagnostikToSpreadsheet(submissionRecord);

  if (diagState.lockMode === 'unlock_on_complete') {
    updateLockUI();
  }

  showResultCard(submissionRecord);
}

function showResultCard(record) {
  const testSectionCards = document.querySelectorAll('.diag-section-card');
  const cbtToolbar = document.querySelector('.diag-cbt-toolbar');
  const secTabs = document.querySelector('.diag-section-tabs');
  const resultCard = document.getElementById('diag-result-card');

  testSectionCards.forEach(s => s.style.display = 'none');
  if (cbtToolbar) cbtToolbar.style.display = 'none';
  if (secTabs) secTabs.style.display = 'none';

  if (resultCard) {
    resultCard.classList.add('active');
    resultCard.style.display = 'block';

    const idCode = document.getElementById('diag-result-id');
    const studentName = document.getElementById('diag-result-student-name');
    const scoreVal = document.getElementById('diag-result-mcq-score');
    const essayStatusVal = document.getElementById('diag-result-essay-status');
    const statusNote = document.getElementById('diag-result-lock-status');

    if (idCode) idCode.textContent = record.id;
    if (studentName) studentName.textContent = `${record.student.nama} (${record.student.kelas} • No. ${record.student.absen})`;
    if (scoreVal) scoreVal.textContent = `${record.scores.mcqScore} / 25`;
    if (essayStatusVal) essayStatusVal.textContent = `${record.scores.essayAnsweredCount} / 4 Soal Terisi`;

    if (statusNote) {
      if (isWebLocked()) {
        statusNote.innerHTML = '🎯 <em>Jawaban Tes Diagnostik Awal tersimpan. Silakan lanjutkan ke instrumen <strong>Tes Pemahaman (Post-Test)</strong> melalui tombol di bawah atau menu samping.</em>';
      } else {
        statusNote.innerHTML = '🎉 <strong>Akses Terbuka!</strong> Anda sekarang dapat mengakses modul pembelajaran dan simulator DRAFT-LAB.';
        const btnGo = document.getElementById('diag-btn-enter-app');
        if (btnGo) btnGo.style.display = 'inline-flex';
      }
    }

    const btnPosttest = document.getElementById('diag-btn-goto-posttest');
    if (btnPosttest) {
      btnPosttest.classList.remove('is-locked');
      btnPosttest.style.opacity = '1';
      btnPosttest.style.cursor = 'pointer';
      btnPosttest.innerHTML = '<span>Lanjut ke Tes Pemahaman (Post-Test) ➔</span>';
      btnPosttest.onclick = () => {
        document.querySelector('.nav-item[data-target=\'quiz\']')?.click();
      };
    }
  }

  window.scrollTo({ top: 80, behavior: 'smooth' });
}

export function renderDiagnostikRekapTable() {
  const tbody = document.getElementById('rekap-diag-table-body');
  const countBadge = document.getElementById('rekap-diag-total-count');
  if (!tbody) return;

  let submissions = [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    submissions = raw ? JSON.parse(raw) : [];
  } catch (e) {
    submissions = [];
  }

  if (countBadge) countBadge.textContent = `${submissions.length} Jawaban Masuk`;

  if (submissions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem; color: #94a3b8;">
          Belum ada siswa yang menyelesaikan tes diagnostik awal.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = submissions.map((sub, idx) => `
    <tr>
      <td><span class="rekap-num-badge">${idx + 1}</span></td>
      <td><strong>${escapeHtml(sub.student.nama)}</strong></td>
      <td>${escapeHtml(sub.student.absen)}</td>
      <td><span class="rekap-class-pill">${escapeHtml(sub.student.kelas)}</span></td>
      <td><span style="font-weight: 800; color: #16a36a;">${sub.scores.mcqScore}/25</span></td>
      <td><span style="font-weight: 700; color: #2567b9;">${sub.scores.essayAnsweredCount || 4}/4 Soal Terisi</span></td>
      <td style="color: #64748b; font-size: 0.76rem;">${escapeHtml(sub.waktu)}</td>
    </tr>
  `).join('');
}

export function exportDiagnostikToCsv() {
  let submissions = [];
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    submissions = raw ? JSON.parse(raw) : [];
  } catch (e) {
    submissions = [];
  }

  if (submissions.length === 0) {
    alert('Belum ada data pengerjaan tes diagnostik untuk diunduh.');
    return;
  }

  let csv = '\uFEFF';
  csv += 'No,ID Tiket,Waktu Selesai,Nama Siswa,No. Absen,Kelas,Skor PG (25),Uraian Terisi (4),Soal 1,Soal 2,Soal 3,Soal 4,Soal 5,Pilihan Soal 6,Alasan Soal 6,Informasi Soal 7,Dampak Soal 8,Uraian Kritis Soal 9\r\n';

  submissions.forEach((item, idx) => {
    const s = item.student;
    const a = item.answers;
    const sc = item.scores;

    const row = [
      idx + 1,
      `"${item.id || ''}"`,
      `"${item.waktu || ''}"`,
      `"${(s.nama || '').replace(/"/g, '""')}"`,
      `"${(s.absen || '').replace(/"/g, '""')}"`,
      `"${(s.kelas || '').replace(/"/g, '""')}"`,
      sc.mcqScore,
      `${sc.essayAnsweredCount || 4}/4`,
      a.q1 || '-',
      a.q2 || '-',
      a.q3 || '-',
      a.q4 || '-',
      a.q5 || '-',
      a.q6_choice || '-',
      `"${(a.q6_reason || '').replace(/"/g, '""')}"`,
      `"${(a.q7_info.join('; ') || '').replace(/"/g, '""')}"`,
      `"${(a.q8_impact || '').replace(/"/g, '""')}"`,
      `"${(a.q9_critical || '').replace(/"/g, '""')}"`
    ];

    csv += row.join(',') + '\r\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `Rekap_Tes_Diagnostik_DRAFT-LAB_${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function initDiagnostik() {
  loadSavedDraft();
  updateLockUI();

  // 1. Hook MCQ Options (Soal 1 - 5)
  for (let i = 1; i <= 5; i++) {
    const qKey = `q${i}`;
    const opts = document.querySelectorAll(`.diag-mcq-opt[data-q="${qKey}"]`);
    opts.forEach(opt => {
      const val = opt.getAttribute('data-val');
      if (diagState.answers[qKey] === val) {
        opt.classList.add('selected');
      }

      opt.addEventListener('click', () => {
        opts.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        diagState.answers[qKey] = val;
        saveDraft();
        updateProgressUI();
      });
    });
  }

  // 2. Soal 6 (Quick Toggle + Reason)
  const q6Toggles = document.querySelectorAll('.diag-toggle-btn[data-q="q6"]');
  q6Toggles.forEach(btn => {
    const val = btn.getAttribute('data-val');
    if (diagState.answers.q6_choice === val) btn.classList.add('selected');

    btn.addEventListener('click', () => {
      q6Toggles.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      diagState.answers.q6_choice = val;
      saveDraft();
      updateProgressUI();
    });
  });

  const q6Reason = document.getElementById('diag-q6-reason');
  if (q6Reason) {
    q6Reason.value = diagState.answers.q6_reason || '';
    q6Reason.addEventListener('input', (e) => {
      diagState.answers.q6_reason = e.target.value;
      saveDraft();
      updateProgressUI();
    });
  }

  // 3. Soal 7 (4 information inputs)
  const q7Inputs = document.querySelectorAll('.diag-q7-input');
  q7Inputs.forEach((inp, idx) => {
    inp.value = diagState.answers.q7_info[idx] || '';
    inp.addEventListener('input', (e) => {
      diagState.answers.q7_info[idx] = e.target.value;
      saveDraft();
      updateProgressUI();
    });
  });

  // 4. Soal 8 (Impact textarea)
  const q8Input = document.getElementById('diag-q8-impact');
  if (q8Input) {
    q8Input.value = diagState.answers.q8_impact || '';
    q8Input.addEventListener('input', (e) => {
      diagState.answers.q8_impact = e.target.value;
      saveDraft();
      updateProgressUI();
    });
  }

  // 5. Soal 9 (Critical thinking)
  const q9Input = document.getElementById('diag-q9-critical');
  if (q9Input) {
    q9Input.value = diagState.answers.q9_critical || '';
    q9Input.addEventListener('input', (e) => {
      diagState.answers.q9_critical = e.target.value;
      saveDraft();
      updateProgressUI();
    });
  }

  // 6. Student Identity form bindings
  const inName = document.getElementById('diag-student-name-input');
  const inAbsen = document.getElementById('diag-student-absen-input');
  const inKelas = document.getElementById('diag-student-kelas-input');

  if (inName) {
    inName.value = diagState.student.nama;
    inName.addEventListener('input', (e) => {
      diagState.student.nama = e.target.value;
    });
  }
  if (inAbsen) {
    inAbsen.value = diagState.student.absen;
    inAbsen.addEventListener('input', (e) => {
      diagState.student.absen = e.target.value;
    });
  }
  if (inKelas) {
    inKelas.value = diagState.student.kelas;
    inKelas.addEventListener('input', (e) => {
      diagState.student.kelas = e.target.value;
    });
  }

  window.addEventListener('draftlab:student-login', (e) => {
    const data = e.detail;
    if (data) {
      diagState.student.nama = data.nama || '';
      diagState.student.absen = data.absen || '';
      diagState.student.kelas = data.kelas || 'X T. Pemesinan';
      if (inName) inName.value = diagState.student.nama;
      if (inAbsen) inAbsen.value = diagState.student.absen;
      if (inKelas) inKelas.value = diagState.student.kelas;
    }
  });

  // 7. Section Tabs & Navigator Buttons
  const secTabs = document.querySelectorAll('.diag-sec-tab');
  secTabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => switchSection(idx));
  });

  const navBtns = document.querySelectorAll('.diag-nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.getAttribute('data-q');
      const num = parseInt(q, 10);
      if (num <= 5) switchSection(0);
      else if (num <= 8) switchSection(1);
      else if (num === 9) switchSection(2);

      setTimeout(() => {
        const el = document.getElementById(`diag-item-${q}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    });
  });

  const prevBtns = document.querySelectorAll('.diag-btn-prev');
  const nextBtns = document.querySelectorAll('.diag-btn-next');

  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => switchSection(diagState.activeSectionIndex - 1));
  });

  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => switchSection(diagState.activeSectionIndex + 1));
  });

  const btnSubmit = document.getElementById('diag-btn-submit');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', submitDiagnosticTest);
  }

  const btnPrint = document.getElementById('diag-btn-print');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => window.print());
  }

  const btnEnterApp = document.getElementById('diag-btn-enter-app');
  if (btnEnterApp) {
    btnEnterApp.addEventListener('click', () => {
      const dashboardNav = document.querySelector('.nav-item[data-target="dashboard"]');
      if (dashboardNav) dashboardNav.click();
    });
  }

  // Teacher lock control toggle in Rekap Modal if available
  const lockSelect = document.getElementById('teacher-lock-mode-select');
  if (lockSelect) {
    lockSelect.value = getLockMode();
    lockSelect.addEventListener('change', (e) => {
      setLockMode(e.target.value);
      alert(`Mode Penguncian diperbarui: ${e.target.value.toUpperCase()}`);
    });
  }

  updateProgressUI();
}
