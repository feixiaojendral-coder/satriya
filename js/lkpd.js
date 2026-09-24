// ==========================================================================
// LKPD (LEMBAR KERJA PESERTA DIDIK) INTERACTIVE LOGIC
// Menangani interaksi Job 1 - Job 6, checklist, modal panduan, & cetak A4
// ==========================================================================

export function initLkpd() {
  const lkpdSection = document.getElementById('lkpd');
  if (!lkpdSection) return;

  // --- JOB SWITCHING LOGIC ---
  const jobTabs = lkpdSection.querySelectorAll('.lkpd-job-tab');
  const job1Sheet = document.getElementById('lkpd-sheet-job1');
  const jobComingSoon = document.getElementById('lkpd-job-coming-soon');
  const csTitle = document.getElementById('lkpd-cs-title');
  const csBadge = document.getElementById('lkpd-cs-badge');
  const csDesc = document.getElementById('lkpd-cs-desc');
  const csFeat1 = document.getElementById('lkpd-cs-feat-1');
  const csFeat2 = document.getElementById('lkpd-cs-feat-2');
  const csFeat3 = document.getElementById('lkpd-cs-feat-3');
  const csFeat4 = document.getElementById('lkpd-cs-feat-4');
  const csActionBtn = document.getElementById('lkpd-cs-action-btn');

  const JOB_METADATA = {
    job1: {
      isReady: true,
      title: "Garis dalam Gambar",
    },
    job2: {
      isReady: false,
      badge: "JOB 2 • MODUL TAHAP BERIKUTNYA",
      title: "Konstruksi Geometris Gambar Teknik",
      desc: "Latihan melukis konstruksi geometris presisi menggunakan jangka dan sepasang penggaris segitiga sesuai kaidah gambar teknik mesin standar ISO.",
      feat1: { title: "Membagi Garis & Sudut", desc: "Membagi garis n-bagian sama panjang dan membagi sudut sembarang secara akurat." },
      feat2: { title: "Segi Beraturan (Segi-5 & Segi-6)", desc: "Melukis pentagon dan heksagon beraturan di dalam/luar lingkaran." },
      feat3: { title: "Busur & Lingkaran Singgung", desc: "Membuat garis singgung dua lingkaran dan menyambung garis lengkung dengan radius R." },
      feat4: { title: "Konstruksi Bentuk Elips", desc: "Metode 4 titik pusat lingkaran dan metode koordinat konsentris." },
      actionTarget: "tools",
      actionText: "Buka Papan Gambar Simulator →"
    },
    job3: {
      isReady: false,
      badge: "JOB 3 • MODUL TAHAP BERIKUTNYA",
      title: "Proyeksi Piktorial Mesin (3D Manual)",
      desc: "Menggambar pandangan piktorial 3 dimensi pada bidang gambar 2D untuk memvisualisasikan benda kerja mekanik secara realistis.",
      feat1: { title: "Proyeksi Isometri (30°/30°)", desc: "Sudut sumbu simetris 30 derajat terhadap garis horizontal tanpa skala pemendekan." },
      feat2: { title: "Proyeksi Dimetri (7°/42°)", desc: "Visualisasi proporsional dengan skala pemendekan sumbu z 1:2." },
      feat3: { title: "Gambar Miring / Oblique (Kavalier 45°)", desc: "Pandangan depan utuh dan kedalaman dimiringkan 45°." },
      feat4: { title: "Perspektif Mesin Satu & Dua Titik Hilang", desc: "Konsep sudut pandang mata manusia (human-eye view) untuk presentasi teknis." },
      actionTarget: "model3d",
      actionText: "Buka Studio Model 3D →"
    },
    job4: {
      isReady: false,
      badge: "JOB 4 • MODUL TAHAP BERIKUTNYA",
      title: "Proyeksi Ortogonal 2D (Eropa vs Amerika)",
      desc: "Standar representasi benda teknik dalam gambar kerja multidimensi menggunakan sistem Proyeksi Sudut Pertama (Eropa) dan Sudut Ketiga (Amerika).",
      feat1: { title: "Pandangan Depan (Front View)", desc: "Menentukan arah pandang utama yang memuat informasi bentuk paling dominan." },
      feat2: { title: "Pandangan Atas (Top View)", desc: "Posisi bawah pada sistem Eropa dan posisi atas pada sistem Amerika." },
      feat3: { title: "Pandangan Samping Kanan/Kiri", desc: "Garis proyeksi 45 derajat (garis bantu transfer dimensi)." },
      feat4: { title: "Simbol Proyeksi Standar ISO", desc: "Simbol kerucut terpancung resmi ISO 5456-2 pada etiket gambar." },
      actionTarget: "projection",
      actionText: "Buka Simulator Glass Box 3D →"
    },
    job5: {
      isReady: false,
      badge: "JOB 5 • MODUL TAHAP BERIKUTNYA",
      title: "Potongan & Penampang Mesin (Section Views)",
      desc: "Menampilkan kontur dalam, rongga, dan lubang tersembunyi benda kerja tanpa membingungkan pembaca gambar dengan garis terhalang.",
      feat1: { title: "Potongan Penuh (Full Section)", desc: "Benda dipotong lurus melewati sumbu simetri utama." },
      feat2: { title: "Potongan Separuh (Half Section)", desc: "Cocok untuk benda silindris simetris: separuh luar, separuh tampak dalam." },
      feat3: { title: "Potongan Meloncat (Offset Section)", desc: "Garis potong bertingkat untuk memperlihatkan beberapa fitur sekaligus." },
      feat4: { title: "Standar Arsiran ISO 128-50", desc: "Garis tipis kontinyu miring 45° dengan jarak seragam 2 - 3 mm." },
      actionTarget: "lines",
      actionText: "Pelajari Aturan Garis ISO →"
    },
    job6: {
      isReady: false,
      badge: "JOB 6 • MODUL TAHAP BERIKUTNYA",
      title: "Etiket ISO & Penunjukan Ukuran (Dimensi)",
      desc: "Menyusun kepala gambar (etiket) resmi 180×25 mm dan memberikan penunjukan ukuran linear, diameter, radius, serta toleransi umum.",
      feat1: { title: "Format Etiket Resmi ISO 7200", desc: "Kolom skala, satuan, judul gambar, pemeriksa, tanggal, dan nama instansi." },
      feat2: { title: "Garis Ukur & Garis Bantu", desc: "Garis tipis dengan anak panah lancip perbandingan 1:3 dan perpanjangan 2 mm." },
      feat3: { title: "Angka Ukuran Sejajar vs Tegak", desc: "Sistem penulisan angka ukuran menurut standar ISO (Metode 1 vs Metode 2)." },
      feat4: { title: "Penunjukan Chamfer, Ulir & Toleransi", desc: "Kaidah memberi ukuran lubang bertingkat, ulir metrik M, dan fillet R." },
      actionTarget: "etiket",
      actionText: "Buka Simulator Etiket ISO →"
    }
  };

  jobTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const jobId = tab.getAttribute('data-job');
      jobTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const meta = JOB_METADATA[jobId];
      if (!meta) return;

      if (meta.isReady) {
        if (job1Sheet) job1Sheet.style.display = 'block';
        if (jobComingSoon) jobComingSoon.style.display = 'none';
      } else {
        if (job1Sheet) job1Sheet.style.display = 'none';
        if (jobComingSoon) {
          jobComingSoon.style.display = 'flex';
          if (csBadge) csBadge.textContent = meta.badge;
          if (csTitle) csTitle.textContent = meta.title;
          if (csDesc) csDesc.textContent = meta.desc;
          
          if (csFeat1) {
            csFeat1.querySelector('strong').textContent = meta.feat1.title;
            csFeat1.querySelector('p').textContent = meta.feat1.desc;
          }
          if (csFeat2) {
            csFeat2.querySelector('strong').textContent = meta.feat2.title;
            csFeat2.querySelector('p').textContent = meta.feat2.desc;
          }
          if (csFeat3) {
            csFeat3.querySelector('strong').textContent = meta.feat3.title;
            csFeat3.querySelector('p').textContent = meta.feat3.desc;
          }
          if (csFeat4) {
            csFeat4.querySelector('strong').textContent = meta.feat4.title;
            csFeat4.querySelector('p').textContent = meta.feat4.desc;
          }

          if (csActionBtn) {
            csActionBtn.textContent = meta.actionText;
            csActionBtn.onclick = () => {
              const targetNav = document.querySelector(`.nav-item[data-target='${meta.actionTarget}']`);
              if (targetNav) targetNav.click();
            };
          }
        }
      }
    });
  });

  // --- LOCAL STORAGE PERSISTENCE ---
  const STORAGE_KEY = 'draftlab_lkpd_job1_data';
  const nameInput = document.getElementById('lkpd-name');
  const classInput = document.getElementById('lkpd-class');
  const absenInput = document.getElementById('lkpd-absen');
  const dateInput = document.getElementById('lkpd-date');
  const scoreInput = document.getElementById('lkpd-score');
  const parafInput = document.getElementById('lkpd-paraf');
  const noteInput = document.getElementById('lkpd-note');
  const checkboxes = lkpdSection.querySelectorAll('.lkpd-check-item input[type="checkbox"]');

  // Load saved state
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.name && nameInput) nameInput.value = saved.name;
    if (saved.className && classInput) classInput.value = saved.className;
    if (saved.absen && absenInput) absenInput.value = saved.absen;
    if (saved.date && dateInput) dateInput.value = saved.date;
    if (saved.score && scoreInput) scoreInput.value = saved.score;
    if (saved.paraf && parafInput) parafInput.value = saved.paraf;
    if (saved.note && noteInput) noteInput.value = saved.note;

    if (saved.checks && Array.isArray(saved.checks)) {
      checkboxes.forEach((cb, idx) => {
        cb.checked = !!saved.checks[idx];
      });
    }
  } catch (e) {
    console.warn("Error loading LKPD saved data", e);
  }

  // Set default date if empty
  if (dateInput && !dateInput.value) {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    dateInput.value = `${day}/${month}/${year}`;
  }

  const saveData = () => {
    const checks = [];
    checkboxes.forEach(cb => checks.push(cb.checked));

    const payload = {
      name: nameInput ? nameInput.value : '',
      className: classInput ? classInput.value : '',
      absen: absenInput ? absenInput.value : '',
      date: dateInput ? dateInput.value : '',
      score: scoreInput ? scoreInput.value : '',
      paraf: parafInput ? parafInput.value : '',
      note: noteInput ? noteInput.value : '',
      checks: checks,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  // --- SINKRONISASI OTOMATIS DENGAN AKUN LOGIN SISWA ---
  const syncStudentIdentity = (studentData) => {
    let student = studentData;
    if (!student) {
      try {
        const raw = localStorage.getItem('draftlab_student_session');
        student = raw ? JSON.parse(raw) : null;
      } catch (e) {
        student = null;
      }
    }

    const syncBadge = document.getElementById('lkpd-sync-badge');
    const syncText = document.getElementById('lkpd-sync-text');

    if (student && student.nama) {
      if (nameInput) nameInput.value = student.nama;
      if (classInput) classInput.value = student.kelas || '';
      if (absenInput) absenInput.value = student.absen || '';

      if (syncBadge) {
        syncBadge.style.display = 'inline-flex';
        if (syncText) {
          syncText.textContent = `Tersinkron akun: ${student.nama} (No. ${student.absen || '-'}, ${student.kelas || '-'})`;
        }
      }
      saveData();
    } else {
      if (syncBadge) syncBadge.style.display = 'none';
    }
  };

  // Sinkronkan saat LKPD pertama kali dimuat
  syncStudentIdentity();

  // Dengarkan sinyal login siswa dari modul Auth
  window.addEventListener('draftlab:student-login', (e) => {
    syncStudentIdentity(e.detail);
  });

  // Dengarkan sinyal ganti akun / logout
  window.addEventListener('draftlab:student-logout', () => {
    const syncBadge = document.getElementById('lkpd-sync-badge');
    if (syncBadge) syncBadge.style.display = 'none';
    if (nameInput) nameInput.value = '';
    if (classInput) classInput.value = '';
    if (absenInput) absenInput.value = '';
    saveData();
  });

  // Auto save on change
  [nameInput, classInput, absenInput, dateInput, scoreInput, parafInput, noteInput].forEach(inp => {
    inp?.addEventListener('input', saveData);
  });
  checkboxes.forEach(cb => {
    cb.addEventListener('change', saveData);
  });

  // Save button
  const saveBtn = document.getElementById('btn-save-lkpd');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveData();
      if (typeof window.showDraftlabToast === 'function') {
        window.showDraftlabToast("Data Disimpan", "Isian Lembar Kerja Job 1 berhasil disimpan di browser!", "💾");
      } else {
        alert("Isian Lembar Kerja Job 1 berhasil disimpan!");
      }
    });
  }

  // Reset button
  const resetBtn = document.getElementById('btn-reset-lkpd');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm("Apakah Anda yakin ingin mengosongkan kembali isian LKPD Job 1?")) {
        let student = null;
        try {
          const raw = localStorage.getItem('draftlab_student_session');
          student = raw ? JSON.parse(raw) : null;
        } catch (e) {}

        // Kosongkan penilaian & checklist, pertahankan data siswa jika sedang login
        if (nameInput) nameInput.value = student ? student.nama : '';
        if (classInput) classInput.value = student ? student.kelas : '';
        if (absenInput) absenInput.value = student ? student.absen : '';
        if (scoreInput) scoreInput.value = '';
        if (parafInput) parafInput.value = '';
        if (noteInput) noteInput.value = '';
        checkboxes.forEach(cb => cb.checked = false);
        saveData();

        if (typeof window.showDraftlabToast === 'function') {
          window.showDraftlabToast("Isian Direset", "Formulir LKPD Job 1 telah dikosongkan.", "🔄");
        }
      }
    });
  }

  // Print A4 button
  const printBtn = document.getElementById('btn-print-lkpd');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      // Ensure Job 1 is currently active before printing
      const job1Tab = lkpdSection.querySelector('.lkpd-job-tab[data-job="job1"]');
      if (job1Tab && !job1Tab.classList.contains('active')) {
        job1Tab.click();
      }
      setTimeout(() => {
        window.print();
      }, 150);
    });
  }

  // --- PATTERN INSPECTOR MODAL LOGIC ---
  const modalBackdrop = document.getElementById('lkpd-pattern-modal');
  const modalCloseBtn = document.getElementById('lkpd-modal-close');
  const modalDismissBtn = document.getElementById('lkpd-modal-dismiss');
  const modalTitle = document.getElementById('lkpd-modal-title');
  const modalSvgContainer = document.getElementById('lkpd-modal-svg-box');
  const modalSubtitle = document.getElementById('lkpd-modal-subtitle');
  const modalDesc = document.getElementById('lkpd-modal-desc');
  const modalStepsList = document.getElementById('lkpd-modal-steps');

  const PATTERN_DETAILS = {
    1: {
      title: "Pola 1: Garis Mendatar (Horizontal Lines)",
      subtitle: "Latihan Menarik Garis Sejajar & Tebal-Tipis ISO",
      desc: "Pola ini melatih tarikan garis horizontal dari kiri ke kanan dengan kecepatan konstan, ketebalan seragam, serta pergantian tipe garis tebal, garis tipis, garis gores, dan garis sumbu bertitik.",
      steps: [
        "Rapatkan penggaris lurus / penggaris T pada tepi kiri meja/papan gambar.",
        "Gunakan pensil 2H untuk garis tipis (0.25 mm) dan pensil HB/2B untuk garis tebal (0.5 - 0.7 mm).",
        "Tarik garis selalu dari kiri ke kanan (atau dari kanan ke kiri untuk yang bertangan kidal).",
        "Putar pensil perlahan saat menarik garis agar ketebalan mata pensil tetap bulat dan seragam.",
        "Jaga jarak antar garis sebesar 5 mm menggunakan tanda titik ukur penggaris."
      ]
    },
    2: {
      title: "Pola 2: Garis Tegak (Vertical Lines)",
      subtitle: "Latihan Menggunakan Sepasang Penggaris Segitiga",
      desc: "Pola ini melatih kestabilan tangan menarik garis vertikal tegak lurus (90°) dari bawah ke atas menggunakan kombinasi sepasang penggaris segitiga.",
      steps: [
        "Letakkan segitiga 45° sebagai landasan horizontal di bawah.",
        "Rapatkan segitiga 30°-60° di atas landasan membentuk sudut tegak 90 derajat.",
        "Tarik garis dari bawah ke arah atas dengan sudut kemiringan pensil sekitar 60°.",
        "Jangan menekan pensil terlalu kuat agar permukaan kertas A4 tidak berlekuk.",
        "Perhatikan pergantian garis kontinyu tebal, garis gores (strip-strip), dan garis bertitik (strip-titik-strip)."
      ]
    },
    3: {
      title: "Pola 3: Pola Siku-Siku (Interlocking Weave)",
      subtitle: "Latihan Ketelitian Sudut Siku & Perpotongan Sudut",
      desc: "Pola anyaman siku-siku bertingkat melatih ketepatan berhenti di batas pertemuan sudut (tidak boleh tembus atau lewat garis perbatasan).",
      steps: [
        "Bagi kotak 200x200 mm menjadi grid blok berselang-seling (horizontal dan vertikal).",
        "Isi tiap blok dengan garis paralel rapat dengan jarak seragam.",
        "Pastikan ujung garis horizontal tepat bersentuhan dengan garis vertikal tanpa menyisakan celah (gap).",
        "Gunakan penggaris segitiga berpasangan yang digeser secara bergantian untuk menjaga kepresisian sudut 90°.",
        "Periksa kebersihan: angkat penggaris sedikit saat menggeser agar grafit pensil tidak membekas kotor."
      ]
    },
    4: {
      title: "Pola 4: Garis Miring 45° (Diagonal Quadrants)",
      subtitle: "Latihan Sudut 45 Derajat Berpasangan & Simetri",
      desc: "Kotak dibagi menjadi 4 kuadran segitiga dengan dua garis diagonal 'X'. Masing-masing kuadran diisi arsiran garis miring 45° yang saling berlawanan arah.",
      steps: [
        "Tarik dua garis diagonal dari keempat sudut kotak menggunakan penggaris panjang hingga bersilangan di titik pusat.",
        "Gunakan penggaris segitiga sama kaki (sudut 45°-45°-90°) ditumpangkan di atas penggaris pengarah.",
        "Arsir kuadran atas dengan sudut 45° condong ke kanan atas.",
        "Arsir kuadran bawah dengan arah simetris.",
        "Arsir kuadran samping dengan sudut miring 135° (45° ke arah kiri atas).",
        "Semua garis harus berhenti tepat pada garis diagonal tanpa keluar batas."
      ]
    },
    5: {
      title: "Pola 5: Gabungan Garis (Hexagonal / Diamond Grid)",
      subtitle: "Kombinasi Garis Horizontal & Garis Miring 60°",
      desc: "Pola anyaman belah ketupat dan segitiga sama sisi yang dihasilkan dari perpotongan 3 arah garis: mendatar (0°), miring 60°, dan miring 120°.",
      steps: [
        "Buat terlebih dahulu garis-garis horizontal tipis berjarak konstan.",
        "Gunakan penggaris segitiga siku-siku 30°-60° untuk menarik garis miring 60° dari kiri bawah ke kanan atas.",
        "Balik penggaris segitiga 60° untuk menarik garis miring 120° (60° dari kanan bawah ke kiri atas).",
        "Titik perpotongan garis harus saling bertemu tepat pada satu titik simpul (node) membentuk segitiga sama sisi dan segi enam yang rapi.",
        "Pola ini merupakan dasar penting untuk memahami grid gambar piktorial isometri."
      ]
    },
    6: {
      title: "Pola 6: Garis Lengkung (Concentric Radial Arcs)",
      subtitle: "Latihan Penggunaan Jangka Gambar Berpusat Sudut",
      desc: "Pola busur lingkaran konsentris bertingkat yang dilukis menggunakan jangka dari sudut-sudut kotak dengan peningkatan jari-jari bertahap.",
      steps: [
        "Tancapkan jarum jangka secara hati-hati pada titik sudut kotak (titik pusat r).",
        "Atur bukaan jangka dengan pertambahan jari-jari kelipatan teratur (misal r = 15, 30, 45, 60 mm).",
        "Putar jangka searah jarum jam dengan memegang kenop atas jangka menggunakan ibu jari dan telunjuk.",
        "Pastikan tebal garis busur yang dihasilkan jangka sama pekatnya dengan garis lurus pensil.",
        "Lukis busur dari sudut yang berlawanan hingga membentuk gelombang irisan lingkaran yang halus."
      ]
    }
  };

  const openPatternModal = (patternId) => {
    const data = PATTERN_DETAILS[patternId];
    if (!data || !modalBackdrop) return;

    if (modalTitle) modalTitle.textContent = data.title;
    if (modalSubtitle) modalSubtitle.textContent = data.subtitle;
    if (modalDesc) modalDesc.textContent = data.desc;

    if (modalStepsList) {
      modalStepsList.innerHTML = '';
      data.steps.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        modalStepsList.appendChild(li);
      });
    }

    // Clone SVG from original pattern frame into modal preview
    const frame = lkpdSection.querySelector(`.lkpd-pattern-item[data-pattern="${patternId}"] .lkpd-pattern-frame`);
    if (frame && modalSvgContainer) {
      const originalSvg = frame.querySelector('svg');
      if (originalSvg) {
        modalSvgContainer.innerHTML = originalSvg.outerHTML;
      }
    }

    modalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closePatternModal = () => {
    if (modalBackdrop) {
      modalBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  lkpdSection.querySelectorAll('.lkpd-pattern-item').forEach(item => {
    const patternId = item.getAttribute('data-pattern');
    item.addEventListener('click', () => openPatternModal(patternId));
  });

  modalCloseBtn?.addEventListener('click', closePatternModal);
  modalDismissBtn?.addEventListener('click', closePatternModal);
  modalBackdrop?.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closePatternModal();
  });

  // Open guide button from top bar opens pattern 1 as demo
  const openGuideBtn = document.getElementById('btn-guide-lkpd');
  if (openGuideBtn) {
    openGuideBtn.addEventListener('click', () => {
      openPatternModal(1);
    });
  }
}
