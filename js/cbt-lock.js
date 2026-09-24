/**
 * ==========================================================================
 * DRAFT-LAB — CBT EXAM LOCK & ANTI-CHEAT ENGINE
 * Fitur Penguncian Layar HP, Deteksi Pindah Tab, Kiosk Fullscreen, & Anti-Contek
 * ==========================================================================
 */

const CBT_STORAGE_VIOLATIONS = 'draftlab_cbt_violations';
const MAX_VIOLATIONS_DEFAULT = 3;

export const cbtState = {
  isActive: false,
  maxViolations: MAX_VIOLATIONS_DEFAULT,
  violationCount: 0,
  violations: [],
  isFullscreen: false,
  wakeLock: null,
  lastViolationTime: 0,
  onAutoSubmitCallback: null,
  isSubmitted: false,
  examStarted: false
};

/**
 * Play Warning Sound using Web Audio API (No external files needed)
 */
function playWarningTone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Beep 1 (Higher pitch)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Beep 2 (Alarm pulse)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(440, now + 0.28); // A4
    gain2.gain.setValueAtTime(0.25, now + 0.28);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.28);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Audio context may require user gesture on first interaction
  }
}

/**
 * Vibrate phone if supported
 */
function triggerVibration() {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 150, 300]);
    }
  } catch (e) {}
}

/**
 * Request Screen Wake Lock (keep phone screen on)
 */
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') {
      cbtState.wakeLock = await navigator.wakeLock.request('screen');
      cbtState.wakeLock.addEventListener('release', () => {
        cbtState.wakeLock = null;
      });
    }
  } catch (e) {
    // Wake Lock may fail on low-battery or unsupported devices
  }
}

/**
 * Request Fullscreen on Document
 */
export async function requestCbtFullscreen() {
  const doc = document.documentElement;
  try {
    if (doc.requestFullscreen) {
      await doc.requestFullscreen();
    } else if (doc.webkitRequestFullscreen) {
      await doc.webkitRequestFullscreen();
    } else if (doc.mozRequestFullScreen) {
      await doc.mozRequestFullScreen();
    } else if (doc.msRequestFullscreen) {
      await doc.msRequestFullscreen();
    }
  } catch (err) {
    console.log('[CBT Fullscreen] Request rejected or unsupported:', err?.message);
  }
}

/**
 * Exit Fullscreen
 */
export async function exitCbtFullscreen() {
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
    }
  } catch (e) {}
}

/**
 * Update UI Counter & Pill Status
 */
export function updateViolationUI() {
  const countEl = document.getElementById('cbt-violation-count');
  const pillEl = document.getElementById('cbt-violation-pill');

  if (countEl) {
    countEl.textContent = cbtState.violationCount;
  }

  if (pillEl) {
    pillEl.classList.remove('has-warning', 'has-danger');
    if (cbtState.violationCount >= cbtState.maxViolations) {
      pillEl.classList.add('has-danger');
    } else if (cbtState.violationCount > 0) {
      pillEl.classList.add('has-warning');
    }
  }
}

/**
 * Show Mandatory CBT Screen Lock Gate Overlay
 * @param {'start' | 'relock'} mode
 */
export function showMandatoryGate(mode = 'start') {
  const gate = document.getElementById('cbt-mandatory-gate');
  const formView = document.getElementById('posttest-form-view');
  if (!gate) return;

  const header = document.getElementById('cbt-gate-header');
  const badge = document.getElementById('cbt-gate-badge');
  const title = document.getElementById('cbt-gate-title');
  const subtitle = document.getElementById('cbt-gate-subtitle');
  const desc = document.getElementById('cbt-gate-desc');
  const alertBox = document.getElementById('cbt-gate-alert');
  const btn = document.getElementById('cbt-btn-start-mandatory');

  if (mode === 'relock') {
    if (header) header.classList.add('is-relock');
    if (badge) badge.textContent = '⚠️ Peringatan Kunci Layar';
    if (title) title.textContent = 'KUNCI LAYAR TERLEPAS!';
    if (subtitle) subtitle.textContent = 'Ujian Ditangguhkan Sementara';
    if (desc) desc.innerHTML = 'Layar perangkat Anda keluar dari mode kunci penuh. Untuk melanjutkan pengerjaan ujian, Anda <strong>wajib mengunci layar kembali</strong> sekarang.';
    if (alertBox) alertBox.innerHTML = '⚠️ <strong>Pengerjaan Soal Ditangguhkan.</strong> Soal tidak dapat diakses atau diisi sebelum layar kembali terkunci penuh.';
    if (btn) btn.innerHTML = '<span>🔒 Kunci Layar Kembali &amp; Lanjutkan Ujian</span>';
  } else {
    if (header) header.classList.remove('is-relock');
    if (badge) badge.textContent = 'CBT Ujian Kiosk — Wajib';
    if (title) title.textContent = 'Kunci Layar Wajib Diaktifkan';
    if (subtitle) subtitle.textContent = 'Mode Ujian Layar Penuh (Wajib Sebelum Mulai)';
    if (desc) desc.innerHTML = 'Untuk menjamin kejujuran dan ketertiban evaluasi belajar, Anda <strong>wajib mengaktifkan Kunci Layar (Mode Ujian Penuh)</strong> sebelum dapat melihat atau mengerjakan lembar soal ini.';
    if (alertBox) alertBox.innerHTML = '⚠️ <strong>Sifat Kunci Layar: Wajib Mutlak.</strong> Lembar soal tidak dapat diakses atau dikerjakan tanpa mengaktifkan kunci layar.';
    if (btn) btn.innerHTML = '<span>🔒 Aktifkan Kunci Layar &amp; Mulai Ujian</span>';
  }

  gate.style.display = 'flex';
  if (formView) formView.classList.add('cbt-gated');
}

/**
 * Hide Mandatory CBT Screen Lock Gate Overlay
 */
export function hideMandatoryGate() {
  const gate = document.getElementById('cbt-mandatory-gate');
  const formView = document.getElementById('posttest-form-view');
  if (gate) gate.style.display = 'none';
  if (formView) formView.classList.remove('cbt-gated');
}

/**
 * User activates mandatory screen lock (via button click)
 */
export async function activateMandatoryLock() {
  await requestCbtFullscreen();
  cbtState.examStarted = true;
  try {
    localStorage.setItem('draftlab_cbt_exam_started', 'true');
  } catch (e) {}
  enableCbtLock();
  hideMandatoryGate();

  const lockedBadge = document.getElementById('cbt-locked-badge');
  const btnFullscreen = document.getElementById('cbt-btn-fullscreen');
  if (lockedBadge) lockedBadge.style.display = 'inline-flex';
  if (btnFullscreen) btnFullscreen.style.display = 'none';
}

/**
 * Record a Tab Switch / Out-of-App Violation
 */
function recordViolation(reason = 'Meninggalkan tab / jendela ujian') {
  if (!cbtState.isActive || cbtState.isSubmitted) return;

  const now = Date.now();
  // Debounce multiple triggers within 2 seconds
  if (now - cbtState.lastViolationTime < 2000) return;
  cbtState.lastViolationTime = now;

  cbtState.violationCount += 1;
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const entry = {
    count: cbtState.violationCount,
    reason,
    time: timeStr,
    timestamp: now
  };
  cbtState.violations.push(entry);

  try {
    localStorage.setItem(CBT_STORAGE_VIOLATIONS, JSON.stringify(cbtState.violations));
  } catch (e) {}

  updateViolationUI();
  triggerVibration();
  playWarningTone();
  showViolationModal(entry);
}

/**
 * Show the CBT Warning Modal
 */
function showViolationModal(entry) {
  const modal = document.getElementById('cbt-violation-modal');
  if (!modal) return;

  const badgeEl = document.getElementById('cbt-modal-violation-badge');
  const countEl = document.getElementById('cbt-modal-violation-num');
  const timeEl = document.getElementById('cbt-modal-violation-time');
  const descEl = document.getElementById('cbt-modal-violation-desc');
  const btnResume = document.getElementById('cbt-btn-resume');
  const btnSubmit = document.getElementById('cbt-btn-forced-submit');

  const isFinal = cbtState.violationCount >= cbtState.maxViolations;

  if (badgeEl) {
    badgeEl.textContent = `Pelanggaran ${cbtState.violationCount} dari ${cbtState.maxViolations}`;
    badgeEl.style.background = isFinal ? '#fee2e2' : '#ffffff';
    badgeEl.style.color = isFinal ? '#dc2626' : '#b91c1c';
  }

  if (countEl) countEl.textContent = `${cbtState.violationCount} / ${cbtState.maxViolations}`;
  if (timeEl) timeEl.textContent = entry.time;

  if (descEl) {
    if (isFinal) {
      descEl.innerHTML = `<strong>BATAS MAKSIMAL TERCAPAI (${cbtState.maxViolations}x):</strong> Anda telah melampaui toleransi perpindahan tab. Lembar jawaban Anda dihentikan dan otomatis dikumpulkan ke guru.`;
    } else {
      const remaining = cbtState.maxViolations - cbtState.violationCount;
      descEl.innerHTML = `Sistem mencatat Anda meninggalkan halaman ujian. Sisa toleransi: <strong>${remaining} kali lagi</strong> sebelum jawaban otomatis dikumpulkan!`;
    }
  }

  if (btnResume) {
    btnResume.style.display = isFinal ? 'none' : 'block';
  }

  if (btnSubmit) {
    btnSubmit.style.display = isFinal ? 'block' : 'none';
  }

  modal.style.display = 'flex';

  // If final violation reached, trigger auto-submit after 3 seconds or on button click
  if (isFinal && typeof cbtState.onAutoSubmitCallback === 'function') {
    setTimeout(() => {
      triggerForcedSubmission('Pelanggaran batas perpindahan tab (3x)');
    }, 4000);
  }
}

/**
 * Dismiss Violation Modal and resume exam
 */
export function dismissViolationModal() {
  const modal = document.getElementById('cbt-violation-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  // Re-request fullscreen and wake lock on resume
  requestCbtFullscreen();
  requestWakeLock();
  setTimeout(() => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && cbtState.examStarted && !cbtState.isSubmitted) {
      showMandatoryGate('relock');
    }
  }, 350);
}

/**
 * Trigger Forced Submission due to violations
 */
export function triggerForcedSubmission(reason = 'Pelanggaran batas perpindahan tab') {
  if (cbtState.isSubmitted) return;
  cbtState.isSubmitted = true;
  disableCbtLock();

  const modal = document.getElementById('cbt-violation-modal');
  if (modal) modal.style.display = 'none';

  if (typeof cbtState.onAutoSubmitCallback === 'function') {
    cbtState.onAutoSubmitCallback(true, reason);
  }
}

/**
 * Event Handlers
 */
function handleVisibilityChange() {
  if (!cbtState.isActive || cbtState.isSubmitted) return;
  if (document.hidden || document.visibilityState === 'hidden') {
    recordViolation('Pindah tab / beralih ke aplikasi lain (Background App)');
  } else {
    // Returned to tab: re-request wake lock
    requestWakeLock();
  }
}

function handleWindowBlur() {
  if (!cbtState.isActive || cbtState.isSubmitted) return;
  // Some mobile browsers fire blur when notification tray or split screen opens
  setTimeout(() => {
    if (document.hidden) {
      recordViolation('Kehilangan fokus layar ujian (Buka notifikasi / split screen)');
    }
  }, 250);
}

function handleBeforeUnload(e) {
  if (cbtState.isActive && !cbtState.isSubmitted) {
    e.preventDefault();
    e.returnValue = 'Ujian sedang berlangsung! Jika Anda meninggalkan halaman ini, jawaban tidak tersimpan.';
    return e.returnValue;
  }
}

function handlePopState() {
  if (cbtState.isActive && !cbtState.isSubmitted) {
    // Lock Android hardware back button
    history.pushState(null, null, window.location.href);
    if (window.showDraftlabToast) {
      window.showDraftlabToast(
        "Tombol Kembali Dikunci",
        "Tombol kembali dinonaktifkan demi integritas ujian. Gunakan navigasi lembar soal di dalam web.",
        "🔒"
      );
    }
  }
}

function handleCopyCut(e) {
  if (!cbtState.isActive || cbtState.isSubmitted) return;
  const target = e.target;
  const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
  if (!isInput) {
    e.preventDefault();
    if (window.showDraftlabToast) {
      window.showDraftlabToast(
        "Teks Dilindungi",
        "Menyalin (Copy) teks naskah soal tidak diizinkan selama ujian berlangsung.",
        "⚠️"
      );
    }
  }
}

function handleContextMenu(e) {
  if (!cbtState.isActive || cbtState.isSubmitted) return;
  // Disable long press menu / right click on exam
  e.preventDefault();
}

/**
 * Enable CBT Exam Lock
 */
export function enableCbtLock(options = {}) {
  cbtState.isActive = true;
  cbtState.isSubmitted = false;
  if (options.maxViolations) cbtState.maxViolations = options.maxViolations;
  if (options.onAutoSubmit) cbtState.onAutoSubmitCallback = options.onAutoSubmit;

  document.body.classList.add('cbt-exam-active');
  const postTestSec = document.getElementById('quiz');
  if (postTestSec) postTestSec.classList.add('cbt-exam-active');
  const diagSec = document.getElementById('diagnostik');
  if (diagSec) diagSec.classList.add('cbt-exam-active');

  // Push state to trap back button
  history.pushState(null, null, window.location.href);

  // Request wake lock
  requestWakeLock();

  // Show lock bar if available
  const lockBar = document.getElementById('cbt-lock-bar');
  if (lockBar) lockBar.style.display = 'flex';

  updateViolationUI();
}

/**
 * Disable CBT Exam Lock (Call after student finishes / submits)
 */
export function disableCbtLock() {
  cbtState.isActive = false;
  cbtState.examStarted = false;
  try {
    localStorage.removeItem('draftlab_cbt_exam_started');
  } catch (e) {}
  document.body.classList.remove('cbt-exam-active');

  const postTestSec = document.getElementById('quiz');
  if (postTestSec) postTestSec.classList.remove('cbt-exam-active');
  const diagSec = document.getElementById('diagnostik');
  if (diagSec) diagSec.classList.remove('cbt-exam-active');

  hideMandatoryGate();

  const modal = document.getElementById('cbt-violation-modal');
  if (modal) modal.style.display = 'none';

  const lockBar = document.getElementById('cbt-lock-bar');
  if (lockBar) lockBar.style.display = 'none';

  if (cbtState.wakeLock) {
    try {
      cbtState.wakeLock.release();
    } catch (e) {}
    cbtState.wakeLock = null;
  }

  exitCbtFullscreen();
}

/**
 * Initialize CBT Lock Listeners & Buttons
 */
export function initCbtLock(options = {}) {
  if (options.maxViolations) cbtState.maxViolations = options.maxViolations;
  if (options.onAutoSubmit) cbtState.onAutoSubmitCallback = options.onAutoSubmit;

  // Window & Document Listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('popstate', handlePopState);
  document.addEventListener('copy', handleCopyCut);
  document.addEventListener('cut', handleCopyCut);
  document.addEventListener('contextmenu', handleContextMenu);

  // Wire Modal Buttons
  const btnResume = document.getElementById('cbt-btn-resume');
  if (btnResume) {
    btnResume.addEventListener('click', dismissViolationModal);
  }

  const btnForcedSubmit = document.getElementById('cbt-btn-forced-submit');
  if (btnForcedSubmit) {
    btnForcedSubmit.addEventListener('click', () => {
      triggerForcedSubmission('Pelanggaran batas perpindahan tab (3x)');
    });
  }

  // Wire Mandatory Gate Start Button (Mandatory activation)
  const btnStartMandatory = document.getElementById('cbt-btn-start-mandatory');
  if (btnStartMandatory) {
    btnStartMandatory.addEventListener('click', () => {
      activateMandatoryLock();
    });
  }

  // Wire Lock Bar Fullscreen Button (Re-lock trigger only, never voluntary exit!)
  const btnFullscreen = document.getElementById('cbt-btn-fullscreen');
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      activateMandatoryLock();
    });
  }

  // Fullscreen state listener: strictly enforce re-lock if fullscreen is dropped
  const onFullscreenChange = () => {
    cbtState.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const lockedBadge = document.getElementById('cbt-locked-badge');
    const btnFullscreenEl = document.getElementById('cbt-btn-fullscreen');

    if (cbtState.isFullscreen) {
      if (lockedBadge) lockedBadge.style.display = 'inline-flex';
      if (btnFullscreenEl) btnFullscreenEl.style.display = 'none';
      if (cbtState.examStarted && !cbtState.isSubmitted) {
        hideMandatoryGate();
      }
    } else {
      if (lockedBadge) lockedBadge.style.display = 'none';
      if (btnFullscreenEl) {
        btnFullscreenEl.style.display = 'inline-flex';
        btnFullscreenEl.innerHTML = '<span>⚠️ Kunci Layar</span>';
      }
      // If exam is ongoing and not submitted, screen lock is strictly mandatory!
      if (cbtState.isActive && cbtState.examStarted && !cbtState.isSubmitted) {
        showMandatoryGate('relock');
      }
    }
  };
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
}
