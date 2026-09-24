// --- DRAFT-LAB MAIN APP LOGIC ---
import { isWebLocked } from './js/diagnostik.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- SPLASH INTRO SCREEN LOGIC ---
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    setTimeout(() => {
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.style.display = 'none';
      }, 600);
    }, 2200);
  }

  // --- SIDEBAR TOGGLE LOGIC ---
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const appContainer = document.querySelector('.app-container');
  if (sidebarToggleBtn && appContainer) {
    const sidebarScrim = document.querySelector('.sidebar-scrim');
    const isMobileNavigation = () => window.matchMedia('(max-width: 860px)').matches;

    const closeMobileNavigation = () => {
      appContainer.classList.remove('sidebar-open');
      document.body.classList.remove('nav-open');
      sidebarToggleBtn.setAttribute('aria-expanded', 'false');
    };

    sidebarToggleBtn.addEventListener('click', () => {
      if (isMobileNavigation()) {
        const isOpen = appContainer.classList.toggle('sidebar-open');
        document.body.classList.toggle('nav-open', isOpen);
        sidebarToggleBtn.setAttribute('aria-expanded', String(isOpen));
      } else {
        appContainer.classList.toggle('sidebar-collapsed');

        const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
        localStorage.setItem('draftlab_sidebar_collapsed', isCollapsed);
      }
    });

    sidebarScrim?.addEventListener('click', closeMobileNavigation);
    
    // Load state from localStorage on load
    const savedSidebarState = localStorage.getItem('draftlab_sidebar_collapsed');
    if (savedSidebarState === 'true' && !isMobileNavigation()) {
      appContainer.classList.add('sidebar-collapsed');
    }

    window.addEventListener('resize', () => {
      if (!isMobileNavigation()) closeMobileNavigation();
    });
  }

  // --- QUESTION BANK GAMBAR TEKNIK MESIN (ISO) ---
  const QUESTION_BANK = [
    {
      text: "Garis tebal kontinyu (Tipe A) dalam standardisasi gambar teknik ISO digunakan untuk...",
      options: [
        "Menyatakan garis sumbu dan silinder",
        "Menyatakan garis ukuran, arsir, dan garis bantu",
        "Menyatakan garis gambar nyata dan tepi objek yang terlihat langsung",
        "Menyatakan bagian benda terhalang atau tidak terlihat"
      ],
      correct: 2,
      feedback: "Garis tebal kontinyu (0.5 - 0.7 mm) digunakan khusus untuk garis benda nyata dan garis tepi gambar."
    },
    {
      text: "Pada sistem Proyeksi Eropa (Sudut Pertama), di manakah posisi Pandangan Atas (Top View) diletakkan relatif terhadap Pandangan Depan?",
      options: [
        "Di sebelah kanan pandangan depan",
        "Di sebelah kiri pandangan depan",
        "Di atas pandangan depan",
        "Di bawah pandangan depan"
      ],
      correct: 3,
      feedback: "Proyeksi Eropa memproyeksikan pandangan ke arah berlawanan, sehingga Pandangan Atas diletakkan di BAWAH Pandangan Depan."
    },
    {
      text: "Berapakah ukuran standar panjang untuk kepala gambar (etiket) menurut standar ISO?",
      options: [
        "180 mm",
        "210 mm",
        "150 mm",
        "297 mm"
      ],
      correct: 0,
      feedback: "Panjang standar etiket menurut ISO adalah 180 mm, diletakkan di sudut kanan bawah kertas gambar."
    },
    {
      text: "Jika Anda ingin menggambar garis sejajar bersudut 75 derajat menggunakan sepasang penggaris segitiga, kombinasi sudut mana yang digunakan?",
      options: [
        "Kombinasi sudut 45° dan 30°",
        "Kombinasi sudut 60° dan 45°",
        "Kombinasi sudut 30° dan 60°",
        "Kombinasi sudut 45° dan 90°"
      ],
      correct: 0,
      feedback: "Sudut 75° diperoleh dengan menjumlahkan sudut 45° dari segitiga sama kaki dan sudut 30° dari segitiga 30°-60° (45° + 30° = 75°)."
    },
    {
      text: "Dalam simbol proyeksi standar ISO, jika kerucut terpancung digambar dengan lingkaran berada di sebelah KANAN trapesium, ini menunjukkan proyeksi...",
      options: [
        "Proyeksi Amerika (Sudut Ketiga)",
        "Proyeksi Eropa (Sudut Pertama)",
        "Proyeksi Isometrik",
        "Proyeksi Aksonometri"
      ],
      correct: 0,
      feedback: "Dalam Proyeksi Amerika (Sudut Ketiga), lingkaran diletakkan di kanan trapesium dengan sisi kecil trapesium menghadap lingkaran."
    },
    {
      text: "Jenis pensil gambar dengan tingkat kekerasan 'Hard' (H) biasanya digunakan juru gambar teknik untuk keperluan...",
      options: [
        "Membuat sketsa awal dan garis bantu konstruksi yang tipis dan bersih",
        "Menulis huruf dan angka pada etiket",
        "Menebalkan garis nyata pada hasil akhir gambar",
        "Mengarsir bidang luas secara pekat dan hitam"
      ],
      correct: 0,
      feedback: "Pensil seri H (misal 2H - 4H) memiliki grafit keras sehingga menghasilkan garis tipis presisi yang ideal untuk garis konstruksi."
    },
    {
      text: "Garis strip-titik tipis (Tipe G menurut ISO 128) memiliki fungsi utama untuk menunjukkan...",
      options: [
        "Garis sumbu simetri, lintasan gerak, dan lingkaran jarak bagi roda gigi",
        "Garis penunjuk ukuran dimensi dan garis arsir",
        "Tepi benda yang terhalang dari pandangan",
        "Batas pemotongan bidang yang digerakkan"
      ],
      correct: 0,
      feedback: "Garis strip-titik tipis (Centerline) digunakan untuk menyatakan sumbu simetri benda bulat/silindris serta bidang simetri."
    },
    {
      text: "Garis gores tipis / putus-putus (Tipe E atau F) digunakan pada gambar teknik untuk menyatakan...",
      options: [
        "Garis nyata yang tampak di depan mata",
        "Garis tepi yang terhalang (hidden lines)",
        "Garis potong benda",
        "Garis batas bidang tekuk pengerjaan pelat"
      ],
      correct: 1,
      feedback: "Garis gores tipis berfungsi menggambarkan kontur atau tepi benda kerja yang tertutup/terhalang material di depannya."
    },
    {
      text: "Berdasarkan standar ISO 5455, penulisan skala 1:2 pada etiket gambar teknik memiliki arti bahwa...",
      options: [
        "Ukuran pada gambar 2 kali lebih besar daripada benda aslinya",
        "Ukuran pada gambar dibuat sama persis dengan benda aslinya",
        "Ukuran pada gambar diperkecil menjadi setengah dari ukuran benda aslinya",
        "Toleransi ukuran benda adalah 2 milimeter"
      ],
      correct: 2,
      feedback: "Skala 1:2 adalah skala pengecilan (reduction scale), di mana 1 unit pada gambar mewakili 2 unit pada benda kerja nyata."
    },
    {
      text: "Berapakah ukuran standar kertas gambar format A4 menurut standar internasional ISO 216?",
      options: [
        "210 x 297 mm",
        "297 x 420 mm",
        "148 x 210 mm",
        "420 x 594 mm"
      ],
      correct: 0,
      feedback: "Ukuran standar kertas A4 adalah 210 mm x 297 mm dengan perbandingan rasio aspek 1 : √2 (1 : 1.414)."
    },
    {
      text: "Menurut standar huruf teknik ISO 3098, huruf miring (italic) standar memiliki sudut kemiringan sebesar...",
      options: [
        "45 derajat terhadap garis horizontal",
        "60 derajat terhadap garis horizontal",
        "75 derajat terhadap garis horizontal",
        "90 derajat (tegak lurus)"
      ],
      correct: 2,
      feedback: "Huruf teknik ISO 3098 Type B miring distandarkan pada kemiringan 75° ke arah kanan."
    },
    {
      text: "Lebar tepi kiri (margin penjilidan) pada format kertas gambar A4 s.d. A0 menurut standar ISO adalah...",
      options: [
        "10 mm",
        "15 mm",
        "20 mm",
        "25 mm"
      ],
      correct: 2,
      feedback: "Batas tepi kiri selalu dibuat selebar 20 mm untuk semua ukuran kertas guna memberikan ruang pengarsipan dan penjilidan."
    },
    {
      text: "Garis arsir penampang potong (hatching) umumnya ditarik dengan sudut kemiringan sebesar...",
      options: [
        "30 derajat",
        "45 derajat",
        "60 derajat",
        "75 derajat"
      ],
      correct: 1,
      feedback: "Garis arsir standar ditarik dengan garis tipis kontinyu bersudut 45° terhadap garis sumbu atau garis batas utama benda."
    },
    {
      text: "Di manakah posisi baku peletakan kepala gambar (etiket) pada lembar kertas gambar teknik?",
      options: [
        "Pojok kiri atas",
        "Pojok kanan atas",
        "Pojok kiri bawah",
        "Pojok kanan bawah"
      ],
      correct: 3,
      feedback: "Etiket selalu diletakkan di sudut kanan bawah kertas gambar agar mudah terbaca saat kertas dilipat sesuai standar ISO."
    },
    {
      text: "Garis petunjuk ukuran dimensi dan garis bantu ukuran harus digambar menggunakan jenis garis...",
      options: [
        "Garis tebal kontinyu (0.7 mm)",
        "Garis tipis kontinyu (0.25 - 0.35 mm)",
        "Garis gores tipis",
        "Garis strip-titik tebal"
      ],
      correct: 1,
      feedback: "Garis ukuran dan garis bantu dimensi menggunakan garis tipis kontinyu agar kontras dan tidak mengaburkan garis benda nyata."
    },
    {
      text: "Pada proyeksi piktorial isometrik, berapakah sudut yang dibentuk oleh sumbu X dan sumbu Y terhadap garis horizontal?",
      options: [
        "15 derajat",
        "30 derajat",
        "45 derajat",
        "60 derajat"
      ],
      correct: 1,
      feedback: "Proyeksi isometrik memiliki sudut sumbu X dan Y sebesar 30° terhadap garis horizontal, dengan rasio skala 1:1:1."
    },
    {
      text: "Jika sepasang segitiga digunakan bersama, berapa sudut terkecil selain 0° yang dapat dibentuk secara akurat tanpa busur derajat?",
      options: [
        "10 derajat",
        "15 derajat",
        "20 derajat",
        "25 derajat"
      ],
      correct: 1,
      feedback: "Sudut terkecil yang bisa dibentuk sepasang segitiga adalah 15° (didapat dari pengurangan sudut 45° - 30° = 15°)."
    },
    {
      text: "Simbol angka 'Ra 1.6' pada gambar kerja manufaktur mesin menyatakan...",
      options: [
        "Radius kelengkungan permukaan sebesar 1.6 mm",
        "Kekasaran permukaan rata-rata sebesar 1.6 mikrometer (μm)",
        "Toleransi dimensi sebesar ±1.6 mm",
        "Tingkat kebulatan poros sebesar 1.6 mm"
      ],
      correct: 1,
      feedback: "Simbol Ra menyatakan Roughness Average (kekasaran permukaan aritmetis) dalam satuan mikrometer (μm) sesuai ISO 1302."
    }
  ];

  // --- STATE MANAGEMENT ---
  const state = {
    activeTab: 'dashboard',
    progress: {
      book: false,
      intro: false,
      tools: false,
      pencils: false,
      lines: false,
      etiket: false,
      projection: false,
      model3d: false,
      quiz: false
    },
    quiz: {
      questions: QUESTION_BANK.slice(0, 5).map((q, idx) => ({
        ...q,
        num: `Pertanyaan ${idx + 1} dari 5`
      })),
      currentQuestion: 0,
      score: 0,
      selectedAnswer: null,
      isAnswered: false
    }
  };

  // --- LOCAL STORAGE & PROGRESS LOGIC ---
  const loadProgress = () => {
    const saved = localStorage.getItem('draftlab_progress');
    if (saved) {
      try {
        state.progress = { ...state.progress, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Gagal memuat progress belajar", e);
      }
    }
    updateProgressUI();
  };

  const saveProgress = () => {
    localStorage.setItem('draftlab_progress', JSON.stringify(state.progress));
    updateProgressUI();
  };

  const updateProgressUI = () => {
    // Calculate percentage
    const keys = Object.keys(state.progress);
    const completedCount = keys.filter(k => state.progress[k]).length;
    const percentage = Math.round((completedCount / keys.length) * 100);

    // Update Progress Bar
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    if (progressBar && progressText) {
      progressBar.style.width = `${percentage}%`;
      progressText.textContent = `${percentage}%`;
    }

    // Update Badge Level
    const badgeLevel = document.getElementById('badge-level');
    if (badgeLevel) {
      if (percentage === 100) {
        badgeLevel.textContent = "Chief Draftsman";
      } else if (percentage >= 60) {
        badgeLevel.textContent = "Expert Draftsman";
      } else if (percentage >= 20) {
        badgeLevel.textContent = "Intermediate Draftsman";
      } else {
        badgeLevel.textContent = "Draftsman Apprentice";
      }
    }

    // Update Dashboard Cards status
    keys.forEach(key => {
      const card = document.querySelector(`.module-card[data-module="${key}"]`);
      if (card) {
        const statusSpan = card.querySelector('.module-status');
        if (state.progress[key]) {
          card.classList.add('completed');
          card.classList.remove('active-learning');
          if (statusSpan) statusSpan.textContent = "Selesai";
        } else {
          card.classList.remove('completed');
          if (key === 'tools' && !state.progress.tools) {
            card.classList.add('active-learning');
            if (statusSpan) statusSpan.textContent = "Sedang Dipelajari";
          } else {
            card.classList.remove('active-learning');
            if (statusSpan) statusSpan.textContent = "Belum Selesai";
          }
        }
      }
    });
  };

  // Floating achievement toast notification
  const showToast = (title, desc, icon = '🎉') => {
    const toast = document.getElementById('draftlab-toast');
    if (!toast) return;
    const titleEl = document.getElementById('toast-title');
    const descEl = document.getElementById('toast-desc');
    const iconEl = document.getElementById('toast-icon');
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
    if (iconEl) iconEl.textContent = icon;
    toast.classList.add('show');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  };
  window.showDraftlabToast = showToast;

  // Complete a learning module
  window.completeModule = (moduleName, customTitle) => {
    if (state.progress.hasOwnProperty(moduleName) && !state.progress[moduleName]) {
      state.progress[moduleName] = true;
      saveProgress();
      const moduleTitles = {
        book: "Buku Ajar Gambar Teknik Mesin",
        intro: "Pengenalan Gambar Teknik Mesin",
        tools: "Papan Gambar Digital & Mistar Segitiga",
        pencils: "Laboratorium Pensil Gambar",
        lines: "Standardisasi Garis & Huruf ISO 3098",
        etiket: "Kepala Gambar (Etiket Standar ISO)",
        projection: "Simulasi Proyeksi Orthogonal Glass Box",
        model3d: "Konversi Model 3D Interaktif",
        quiz: "Tes Pemahaman (Post-Test Evaluasi Pertemuan 1)"
      };
      const title = customTitle || moduleTitles[moduleName] || "Modul Pembelajaran";
      showToast(`Pencapaian: ${title}`, "Modul berhasil diselesaikan! Peringkat keahlian Anda meningkat.", "🎓");
    }
  };

  // --- SPA ROUTER ---
  const initNavigation = () => {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.app-section');
    const pageTitle = document.getElementById('current-page-title');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const target = item.getAttribute('data-target');
        
        // Lock check: if web is locked, allow ONLY diagnostik (Post-Test & materi lainnya terkunci)
        if (target !== 'diagnostik' && isWebLocked()) {
          if (window.showDraftlabToast) {
            window.showDraftlabToast(
              target === 'quiz' ? "Tes Pemahaman Terkunci" : "Modul Terkunci (Pertemuan 1)",
              target === 'quiz'
                ? "Modul Tes Pemahaman (Post-Test) saat ini masih dikunci dan akan dibuka oleh guru setelah kegiatan pembelajaran selesai."
                : "Khusus tahap ini, hanya instrumen Tes Diagnostik Awal yang dapat diakses.",
              "🔒"
            );
          } else {
            alert(target === 'quiz' ? "🔒 Tes Pemahaman (Post-Test) masih dikunci guru." : "🔒 Modul ini dikunci guru.");
          }
          return;
        }

        // Update active class on nav
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Update active section
        sections.forEach(sec => sec.classList.remove('active'));
        const targetSection = document.getElementById(target);
        if (targetSection) {
          targetSection.classList.add('active');
        }

        // Update title
        const titles = {
          diagnostik: "Tes Diagnostik Awal — Gambar Teknik Manual",
          dashboard: "Dashboard Utama",
          book: "Buku Ajar Gambar Teknik Mesin",
          intro: "Pengenalan Gambar Teknik Mesin",
          tools: "Papan Gambar Digital & Segitiga Berpasangan",
          pencils: "Laboratorium Pensil Gambar (Pencil Grade Lab)",
          lines: "Standardisasi Garis Gambar (ISO)",
          etiket: "Kepala Gambar (Etiket ISO)",
          projection: "Simulator Proyeksi Orthogonal",
          model3d: "Konversi Gambar 2D ke Model 3D",
          lkpd: "Lembar Kerja Peserta Didik (LKPD)",
          quiz: "Tes Pemahaman — Post-Test Pertemuan 1"
        };
        pageTitle.textContent = titles[target] || "DRAFT-LAB";
        state.activeTab = target;

        if (window.matchMedia('(max-width: 860px)').matches) {
          appContainer?.classList.remove('sidebar-open');
          document.body.classList.remove('nav-open');
          sidebarToggleBtn?.setAttribute('aria-expanded', 'false');
        }

        // Auto trigger size layout check for canvases
        if (target === 'tools' && typeof window.resizeBoardCanvas === 'function') {
          setTimeout(window.resizeBoardCanvas, 100);
        } else if (target === 'pencils' && typeof window.resizePencilCanvas === 'function') {
          setTimeout(window.resizePencilCanvas, 100);
        }
      });
    });

    // Make dashboard cards clickable
    const dashboardCards = document.querySelectorAll('.module-card');
    dashboardCards.forEach(card => {
      card.addEventListener('click', () => {
        const targetModule = card.getAttribute('data-module');
        const navItem = document.querySelector(`.nav-item[data-target="${targetModule}"]`);
        if (navItem) {
          navItem.click();
        }
      });
    });

    // Initial State on Page Load: If locked, activate diagnostik
    if (isWebLocked()) {
      state.activeTab = 'diagnostik';
      const diagNav = document.querySelector('.nav-item[data-target="diagnostik"]');
      if (diagNav) {
        navItems.forEach(nav => nav.classList.remove('active'));
        diagNav.classList.add('active');
      }
      sections.forEach(sec => sec.classList.remove('active'));
      const diagSec = document.getElementById('diagnostik');
      if (diagSec) {
        diagSec.classList.add('active');
      }
      if (pageTitle) {
        pageTitle.textContent = "Tes Diagnostik Awal — Gambar Teknik Manual";
      }
    }
  };

  // --- QUIZ GAME LOGIC ---
  const initQuiz = () => {
    const startView = document.getElementById('quiz-start-view');
    const playView = document.getElementById('quiz-play-view');
    const resultView = document.getElementById('quiz-result-view');
    
    const btnStart = document.getElementById('btn-start-quiz');
    const btnNext = document.getElementById('btn-next-question');
    const btnRetry = document.getElementById('btn-retry-quiz');

    const questionNum = document.getElementById('quiz-question-num');
    const questionText = document.getElementById('quiz-question-text');
    const optionsContainer = document.getElementById('quiz-options-container');
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const scoreTracker = document.getElementById('quiz-score-tracker');

    const finalScore = document.getElementById('quiz-final-score');
    const resultTitle = document.getElementById('quiz-result-title');
    const resultDesc = document.getElementById('quiz-result-desc');
    const resultMedal = document.getElementById('quiz-result-medal');

    const btnClaimCert = document.getElementById('btn-claim-certificate');
    const certModal = document.getElementById('certificate-modal');
    const btnCloseCert = document.getElementById('btn-close-certificate');
    const btnDismissCert = document.getElementById('btn-dismiss-certificate');
    const btnPrintCert = document.getElementById('btn-print-certificate');
    const inputStudentName = document.getElementById('cert-student-name');
    const displayStudentName = document.getElementById('cert-display-name');
    const displayScore = document.getElementById('cert-display-score');
    const displayBadge = document.getElementById('cert-display-badge');
    const displayDate = document.getElementById('cert-display-date');
    const certIdCode = document.getElementById('cert-id-code');

    let currentCertScore = 100;

    const setupCertificate = (finalVal) => {
      currentCertScore = finalVal;
      if (!btnClaimCert) return;

      if (finalVal >= 80) {
        btnClaimCert.style.display = 'inline-flex';
      } else {
        btnClaimCert.style.display = 'none';
      }
    };

    if (btnClaimCert && certModal) {
      btnClaimCert.addEventListener('click', () => {
        certModal.style.display = 'flex';
        
        const savedName = localStorage.getItem('draftlab_student_name') || '';
        if (inputStudentName) inputStudentName.value = savedName;
        if (displayStudentName) {
          displayStudentName.textContent = (savedName.trim() || 'NAMA LENGKAP SISWA').toUpperCase();
        }

        if (displayScore) {
          displayScore.textContent = `${currentCertScore} / 100`;
        }
        if (displayBadge) {
          displayBadge.textContent = currentCertScore === 100 ? "CHIEF DRAFTSMAN (DISTINCTION)" : "EXPERT DRAFTSMAN";
        }
        if (displayDate) {
          displayDate.textContent = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        }
        if (certIdCode) {
          const randomHash = Math.random().toString(36).substring(2, 7).toUpperCase();
          certIdCode.textContent = `DL-GT-2026-${randomHash}`;
        }
      });

      inputStudentName?.addEventListener('input', (e) => {
        const val = e.target.value;
        localStorage.setItem('draftlab_student_name', val);
        if (displayStudentName) {
          displayStudentName.textContent = (val.trim() || 'NAMA LENGKAP SISWA').toUpperCase();
        }
      });

      const closeCertModal = () => {
        certModal.style.display = 'none';
      };

      btnCloseCert?.addEventListener('click', closeCertModal);
      btnDismissCert?.addEventListener('click', closeCertModal);
      
      certModal.addEventListener('click', (e) => {
        if (e.target === certModal) closeCertModal();
      });

      btnPrintCert?.addEventListener('click', () => {
        window.print();
      });
    }

    const resetQuizState = () => {
      state.quiz.currentQuestion = 0;
      state.quiz.score = 0;
      state.quiz.selectedAnswer = null;
      state.quiz.isAnswered = false;
    };

    const startNewQuizRound = () => {
      // Pick 5 randomized questions from QUESTION_BANK
      const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 5);
      state.quiz.questions = selected.map((q, idx) => ({
        ...q,
        num: `Pertanyaan ${idx + 1} dari ${selected.length}`
      }));

      resetQuizState();
      startView.style.display = 'none';
      playView.style.display = 'block';
      resultView.style.display = 'none';
      loadQuestion();
    };

    const loadQuestion = () => {
      const qIndex = state.quiz.currentQuestion;
      const q = state.quiz.questions[qIndex];

      questionNum.textContent = q.num;
      questionText.textContent = q.text;
      scoreTracker.textContent = `Skor: ${state.quiz.score} / ${qIndex}`;

      // Reset feedback and button
      feedbackBox.classList.remove('visible', 'success', 'error');
      btnNext.disabled = true;
      state.quiz.isAnswered = false;
      state.quiz.selectedAnswer = null;

      // Populate options
      optionsContainer.innerHTML = '';
      q.options.forEach((opt, idx) => {
        const button = document.createElement('button');
        button.className = 'quiz-option';
        button.innerHTML = `
          <span class="quiz-option-letter">${String.fromCharCode(65 + idx)}</span>
          <span class="option-text">${opt}</span>
        `;
        button.addEventListener('click', () => selectOption(idx, button));
        optionsContainer.appendChild(button);
      });
    };

    const selectOption = (idx, buttonElement) => {
      if (state.quiz.isAnswered) return;

      state.quiz.selectedAnswer = idx;
      state.quiz.isAnswered = true;

      const q = state.quiz.questions[state.quiz.currentQuestion];
      const allButtons = optionsContainer.querySelectorAll('.quiz-option');

      if (idx === q.correct) {
        // Correct
        buttonElement.classList.add('correct');
        state.quiz.score++;
        feedbackBox.textContent = q.feedback;
        feedbackBox.className = "quiz-feedback visible success";
      } else {
        // Wrong
        buttonElement.classList.add('wrong');
        // Highlight correct option
        allButtons[q.correct].classList.add('correct');
        feedbackBox.textContent = `Salah. Jawaban yang benar adalah: ${String.fromCharCode(65 + q.correct)}. ${q.feedback}`;
        feedbackBox.className = "quiz-feedback visible error";
      }

      scoreTracker.textContent = `Skor: ${state.quiz.score} / ${state.quiz.currentQuestion + 1}`;
      btnNext.disabled = false;
    };

    btnStart?.addEventListener('click', () => {
      startNewQuizRound();
    });

    btnNext?.addEventListener('click', () => {
      state.quiz.currentQuestion++;
      if (state.quiz.currentQuestion < state.quiz.questions.length) {
        loadQuestion();
      } else {
        // End of quiz
        showResults();
      }
    });

    btnRetry?.addEventListener('click', () => {
      startNewQuizRound();
    });

    const showResults = () => {
      playView.style.display = 'none';
      resultView.style.display = 'flex';

      const finalVal = Math.round((state.quiz.score / state.quiz.questions.length) * 100);
      finalScore.textContent = finalVal;
      setupCertificate(finalVal);

      if (finalVal === 100) {
        resultMedal.textContent = "🥇";
        resultTitle.textContent = "Luar Biasa! Chief Draftsman!";
        resultDesc.textContent = `Kamu menjawab semua ${state.quiz.questions.length} pertanyaan dengan benar! Sekarang kamu memegang tingkat kepangkatan tertinggi di DRAFT-LAB.`;
        window.completeModule('quiz');
      } else if (finalVal >= 80) {
        resultMedal.textContent = "🥈";
        resultTitle.textContent = "Kerja Bagus! Expert Draftsman!";
        resultDesc.textContent = `Kamu menjawab ${state.quiz.score} dari ${state.quiz.questions.length} pertanyaan dengan benar. Bagus sekali! Sertifikat kompetensi digitalmu kini dapat dicetak.`;
        window.completeModule('quiz');
      } else if (finalVal >= 60) {
        resultMedal.textContent = "🥉";
        resultTitle.textContent = "Cukup Baik! Lulus!";
        resultDesc.textContent = `Kamu menjawab ${state.quiz.score} dari ${state.quiz.questions.length} pertanyaan dengan benar. Kamu lulus, namun raih skor minimal 80 untuk mencetak sertifikat resmi!`;
        window.completeModule('quiz');
      } else {
        resultMedal.textContent = "❌";
        resultTitle.textContent = "Coba Lagi!";
        resultDesc.textContent = `Kamu menjawab ${state.quiz.score} dari ${state.quiz.questions.length} pertanyaan dengan benar. Kamu belum lulus kuis. Silakan pelajari kembali modul-modul di papan gambar dan proyeksi lalu ulangi kuis!`;
      }
    };
  };

  // Modul Pengenalan Gamtek sekarang terorganisasi secara mandiri dan modular di js/intro.js

  // --- INITIALIZE APPLICATION ---
  loadProgress();
  initNavigation();
  initQuiz();
});
