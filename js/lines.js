// --- LABORATORIUM INTERAKTIF STANDARDISASI GARIS ---

document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('lines');
  const drawing = document.getElementById('line-technical-drawing');
  const stageContainer = document.getElementById('line-stage-container');
  const zoomViewport = document.getElementById('svg-zoom-viewport');
  const typeButtons = [...document.querySelectorAll('.line-type-button[data-line-type]')];
  const layers = [...document.querySelectorAll('[data-line-layer]')];
  const showAllButton = document.getElementById('line-show-all');

  // Detail card elements
  const detailCode = document.getElementById('line-detail-code');
  const detailTitle = document.getElementById('line-detail-title');
  const detailThickness = document.getElementById('line-detail-thickness');
  const detailFunction = document.getElementById('line-detail-function');
  const detailLocation = document.getElementById('line-detail-location');
  const detailRule = document.getElementById('line-detail-rule');
  const detailPencil = document.getElementById('line-detail-pencil');
  const detailTabButtons = [...document.querySelectorAll('.line-detail-tab-btn[data-detail-tab]')];
  const detailTabPanes = [...document.querySelectorAll('.line-tab-pane')];
  const mistakesContent = document.getElementById('line-mistakes-content');
  const tipsContent = document.getElementById('line-tips-content');

  // Challenge game elements
  const challengeButton = document.getElementById('line-challenge-start');
  const challengePrompt = document.getElementById('line-challenge-prompt');
  const challengeFeedback = document.getElementById('line-challenge-feedback');
  const challengeScore = document.getElementById('line-challenge-score');
  const challengeProgress = document.getElementById('line-challenge-progress');
  const streakPill = document.getElementById('line-streak-pill');
  const streakCount = document.getElementById('line-streak-count');

  // Toolbar & Stage elements
  const themeButtons = [...document.querySelectorAll('.ctrl-mode-btn[data-drawing-theme]')];
  const layerToggleButtons = [...document.querySelectorAll('.layer-toggle-btn[data-toggle-layer]')];
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');
  const hoverHud = document.getElementById('line-hover-hud');
  const hudTypeBadge = document.getElementById('hud-type-badge');
  const hudIsoBadge = document.getElementById('hud-iso-badge');
  const hudLineTitle = document.getElementById('hud-line-title');
  const hudSpecText = document.getElementById('hud-spec-text');

  // Simulation Player elements
  const btnSimulate = document.getElementById('btn-simulate-drafting');
  const simBanner = document.getElementById('drafting-sim-banner');
  const simStepBadge = document.getElementById('sim-step-badge');
  const simStepTitle = document.getElementById('sim-step-title');
  const simStepDesc = document.getElementById('sim-step-desc');
  const simProgressFill = document.getElementById('sim-progress-fill');
  const simBtnPrev = document.getElementById('sim-btn-prev');
  const simBtnPlay = document.getElementById('sim-btn-play');
  const simBtnNext = document.getElementById('sim-btn-next');
  const simBtnClose = document.getElementById('sim-btn-close');

  if (!section || !drawing || !typeButtons.length || !layers.length) return;

  const lineData = {
    visible: {
      code: '01 · Kontinu tebal',
      iso: 'ISO 128-20 (Tipe A)',
      title: 'Garis Benda / Garis Nyata',
      thickness: '0,5–0,7 mm',
      function: 'Menunjukkan kontur dan tepi benda yang terlihat langsung oleh pengamat.',
      location: 'Tepi luar flange 120×120 mm, silinder boss Ø80, lubang pusat Ø40, 4 lubang baut Ø12, dan kontur luar Potongan A–A.',
      rule: 'Tarik tegas, hitam, merata, dan tidak terputus. Harus paling dominan dibanding garis bantu.',
      pencil: 'HB atau B; mekanis 0,5–0,7 mm.',
      challenge: 'garis benda yang menunjukkan tepi nyata',
      mistakes: [
        'Menggunakan pensil 2H/H sehingga kontur benda tampak pudar atau kusam.',
        'Menarik garis bolak-balik (menggosok) sehingga ketebalan tidak merata atau timbul serabut.',
        'Pertemuan pada sudut luar flange tidak saling bertemu rapat (bocor / tumpang tindih).'
      ],
      tips: 'Putar sedikit batang pensil secara halus saat menarik garis lurus agar keruncingan grafit tetap rata dan garis tidak melebar di ujung.'
    },
    dimension: {
      code: '02 · Kontinu tipis',
      iso: 'ISO 128-20 (Tipe B)',
      title: 'Garis Ukuran & Garis Bantu',
      thickness: '0,25–0,35 mm',
      function: 'Menyampaikan nilai panjang, tinggi, diameter, radius, serta batas pengukuran.',
      location: 'Ukuran 120 mm, diameter Ø80, lubang Ø40, 4×Ø12, radius R10, tinggi boss 30, tinggi total 40, dan tebal 10 mm.',
      rule: 'Garis ukuran diberi anak panah; garis bantu sedikit melewati garis ukuran (1–2 mm) dan tidak menempel pada kontur benda.',
      pencil: 'H atau 2H; mekanis 0,3–0,35 mm.',
      challenge: 'garis ukuran yang memakai anak panah',
      mistakes: [
        'Garis bantu menabrak langsung kontur benda tanpa memberi celah jeda 1 mm.',
        'Anak panah digambar terlalu pendek atau tumpul (tidak memenuhi rasio panjang : lebar 3 : 1).',
        'Angka ukuran menabrak garis ukur dan tidak diposisikan tepat di tengah garis.'
      ],
      tips: 'Gunakan pensil 2H berujung runcing dengan tekanan stabil. Buat anak panah ramping dengan sudut lancip 15°–20°.'
    },
    hidden: {
      code: '03 · Putus-putus tipis',
      iso: 'ISO 128-20 (Tipe F)',
      title: 'Garis Tersembunyi',
      thickness: '0,25–0,35 mm',
      function: 'Menunjukkan tepi, alur, atau lubang yang tertutup permukaan sehingga tidak terlihat langsung.',
      location: 'Posisi lubang baut di belakang bidang potong pada sayap flange Potongan A–A.',
      rule: 'Buat panjang strip (3 mm) dan celah (1 mm) seragam. Pertemuan garis sebaiknya berawal dari strip padat.',
      pencil: 'H atau HB; mekanis 0,3–0,35 mm.',
      challenge: 'garis tersembunyi berbentuk putus-putus',
      mistakes: [
        'Panjang strip dan celah tidak konsisten (ada yang 1 mm, ada yang 5 mm).',
        'Membuat garis tersembunyi terlalu tebal sehingga bersaing dengan garis nyata.',
        'Garis putus-putus berawal dengan celah kosong pada sudut pertemuan benda.'
      ],
      tips: 'Iramakan goresan tangan Anda: ketukan 3mm garis lalu lompat 1mm celah dengan ketukan ritmis konstan.'
    },
    center: {
      code: '04 · Strip titik tipis',
      iso: 'ISO 128-20 (Tipe G)',
      title: 'Garis Sumbu / Simetri',
      thickness: '0,25–0,35 mm',
      function: 'Menentukan pusat lingkaran, sumbu putar, dan kesimetrian suatu benda.',
      location: 'Sumbu silang horizontal & vertikal lubang pusat, sumbu 4 lubang baut, dan sumbu vertikal Potongan A–A.',
      rule: 'Susun strip panjang (10–12 mm) – celah (1 mm) – strip pendek/titik (1–2 mm) – celah. Garis harus melewati pusat dan menonjol 2–3 mm ke luar bentuk.',
      pencil: '2H atau H; mekanis 0,3 mm.',
      challenge: 'garis sumbu yang melewati pusat lubang',
      mistakes: [
        'Titik pusat lingkaran diisi dengan celah kosong, bukan perpotongan strip panjang.',
        'Garis sumbu berhenti tepat di tepi lingkaran (tidak dilebihkan 2–3 mm ke luar).',
        'Titik sumbu digambar bulat besar seperti noda tinta.'
      ],
      tips: 'Titik potong sumbu di tengah lingkaran wajib berupa perpotongan garis strip panjang, bukan titik atau celah kosong.'
    },
    cutting: {
      code: '05 · Strip titik dengan ujung tebal',
      iso: 'ISO 128-20 (Tipe H)',
      title: 'Garis Bidang Potong',
      thickness: 'Tipis + ujung 0,7 mm',
      function: 'Menentukan lokasi bidang imajiner yang memotong benda dan arah pandang hasil potongan.',
      location: 'Garis bidang potong A–A vertikal pada tampak depan dengan panah tebal arah pandang ke kanan.',
      rule: 'Pakai pola strip titik tipis di tengah, pertebal bagian ujung/belokan, lalu beri anak panah dan huruf identitas huruf kapital (A-A).',
      pencil: 'H untuk jalur garis; HB/B untuk ujung tebal dan anak panah.',
      challenge: 'garis bidang potong A–A',
      mistakes: [
        'Ujung garis potong tidak dipertebal sehingga tertukar dengan garis sumbu biasa.',
        'Arah anak panah terbalik dari proyeksi potongan yang disajikan.',
        'Lupa memberikan huruf identitas (A-A) di dekat anak panah.'
      ],
      tips: 'Gambarkan anak panah menunjuk ke arah bagian benda yang dipertahankan dan dilihat pada gambar potongan.'
    },
    hatch: {
      code: '06 · Kontinu tipis bersudut',
      iso: 'ISO 128-20 (Tipe B)',
      title: 'Garis Arsir Potongan',
      thickness: '0,25–0,35 mm',
      function: 'Menandai bagian material padat yang benar-benar dilewati bidang potong.',
      location: 'Penampang kiri dan kanan material yang terpotong pada Potongan A–A (lubang tengah Ø40 dibiarkan kosong tanpa arsir).',
      rule: 'Tarik tipis, sejajar, berjarak seragam (2–3 mm); umumnya miring 45° terhadap garis dasar atau sumbu utama.',
      pencil: '2H atau H; mekanis 0,3 mm.',
      challenge: 'garis arsir 45 derajat pada potongan',
      mistakes: [
        'Garis arsir menyeberangi rongga/lubang yang sebenarnya kosong (lubang bor ikut diarsir).',
        'Jarak antar garis arsir renggang-rapat tidak seragam.',
        'Garis arsir tembus menabrak garis kontur batas benda.'
      ],
      tips: 'Gunakan mistar segitiga 45° yang digeser dengan penggaris penuntun untuk memastikan kemiringan dan jarak arsir selalu konstan.'
    },
    break: {
      code: '07 · Kontinu bebas / zig-zag tipis',
      iso: 'ISO 128-20 (Tipe C/D)',
      title: 'Garis Patahan',
      thickness: '0,25–0,35 mm',
      function: 'Menyingkat gambar benda yang panjang atau membatasi bagian yang sengaja tidak digambar penuh.',
      location: 'Simbol garis pemendekan/patahan standar ISO untuk bagian panjang yang seragam.',
      rule: 'Gunakan goresan bebas untuk patahan pendek atau zig-zag untuk patahan panjang; jangan disamakan dengan retak benda.',
      pencil: 'H atau 2H; mekanis 0,3 mm.',
      challenge: 'garis patahan zig-zag',
      mistakes: [
        'Garis patahan digambar terlalu tebal sehingga tampak seperti retakan fisik material.',
        'Zig-zag digambar sembarangan tanpa sudut simetris.'
      ],
      tips: 'Tarik garis patahan tipis dengan tangan bebas yang rileks namun pasti, tidak bergetar.'
    }
  };

  // Sound synthesizer using Web Audio API
  const playSound = (type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'wrong') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(164.81, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'step') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {
      // Audio context might be restricted before interaction, ignore safely
    }
  };

  // --- DETAIL TABS SWITCHING ---
  const updateDetails = (type) => {
    const data = lineData[type];
    if (!data) return;

    // Tab 1: ISO Aturan
    if (detailCode) detailCode.textContent = data.code;
    if (detailTitle) detailTitle.textContent = data.title;
    if (detailThickness) detailThickness.textContent = data.thickness;
    if (detailFunction) detailFunction.textContent = data.function;
    if (detailLocation) detailLocation.textContent = data.location;
    if (detailRule) detailRule.textContent = data.rule;
    if (detailPencil) detailPencil.textContent = data.pencil;

    // Tab 2: Kesalahan Siswa
    if (mistakesContent) {
      if (data.mistakes && data.mistakes.length) {
        mistakesContent.innerHTML = data.mistakes.map(m => `<li>${m}</li>`).join('');
      } else {
        mistakesContent.innerHTML = '<li>Perhatikan ketebalan dan pola garis agar sesuai standar ISO.</li>';
      }
    }

    // Tab 3: Tips Praktis
    if (tipsContent) {
      tipsContent.innerHTML = `<strong>Tips Presisi:</strong> ${data.tips || 'Gunakan alat gambar standar dan jaga kebersihan mistar.'}`;
    }
  };

  detailTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      detailTabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const tab = btn.dataset.detailTab;
      detailTabPanes.forEach(pane => {
        pane.style.display = 'none';
        pane.classList.remove('active');
      });

      const activePane = document.getElementById(`pane-tab-${tab}`);
      if (activePane) {
        activePane.style.display = tab === 'iso' ? 'grid' : 'block';
        activePane.classList.add('active');
      }
    });
  });

  const selectLine = (type, triggerDetails = true) => {
    if (!lineData[type]) return;
    drawing.classList.add('has-line-selection');

    typeButtons.forEach(button => {
      const isActive = button.dataset.lineType === type;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    layers.forEach(layer => {
      const isActive = layer.dataset.lineLayer === type;
      layer.classList.toggle('active', isActive);
      layer.classList.toggle('muted', !isActive);
      layer.setAttribute('aria-pressed', String(isActive));
    });

    showAllButton?.classList.remove('active');
    if (triggerDetails) updateDetails(type);
  };

  const showAllLines = () => {
    drawing.classList.remove('has-line-selection');
    typeButtons.forEach(button => {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    });
    layers.forEach(layer => {
      layer.classList.remove('active', 'muted');
      layer.setAttribute('aria-pressed', 'false');
    });
    showAllButton?.classList.add('active');

    if (detailCode) detailCode.textContent = 'Ringkasan gambar kerja';
    if (detailTitle) detailTitle.textContent = 'Semua Jenis Garis Bekerja Bersama';
    if (detailThickness) detailThickness.textContent = 'Rasio ≈ 2 : 1';
    if (detailFunction) detailFunction.textContent = 'Membedakan bentuk nyata, informasi ukuran, bagian tersembunyi, sumbu, dan potongan tanpa perlu warna.';
    if (detailLocation) detailLocation.textContent = 'Tampak depan menjelaskan bentuk dan posisi lubang; potongan A–A menjelaskan konstruksi bagian dalam.';
    if (detailRule) detailRule.textContent = 'Utamakan hierarki: garis benda paling dominan, sedangkan garis bantu, ukuran, sumbu, dan arsir lebih tipis.';
    if (detailPencil) detailPencil.textContent = 'Kombinasikan HB/B untuk garis tebal dan H/2H untuk garis tipis.';

    if (mistakesContent) {
      mistakesContent.innerHTML = `
        <li>Menggunakan satu jenis pensil untuk semua garis sehingga gambar terlihat rata dan monoton.</li>
        <li>Tebal garis tipis melebihi separuh tebal garis tebal (rasio harus konsisten 2:1).</li>
        <li>Kertas kotor akibat gesekan segitiga dengan debu grafit pensil.</li>
      `;
    }
    if (tipsContent) {
      tipsContent.innerHTML = '<strong>Aturan Emas:</strong> Garis nyata selalu paling dominan. Garis ukuran, sumbu, dan arsir berfungsi sebagai pelengkap keterangan.';
    }
  };

  // --- ZOOM & PAN ENGINE ---
  let currentZoom = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  const applyTransform = () => {
    if (zoomViewport) {
      zoomViewport.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
    }
  };

  btnZoomIn?.addEventListener('click', () => {
    currentZoom = Math.min(2.5, currentZoom + 0.2);
    applyTransform();
  });

  btnZoomOut?.addEventListener('click', () => {
    currentZoom = Math.max(0.7, currentZoom - 0.2);
    applyTransform();
  });

  btnZoomReset?.addEventListener('click', () => {
    currentZoom = 1;
    panX = 0;
    panY = 0;
    applyTransform();
  });

  stageContainer?.addEventListener('mousedown', (e) => {
    if (e.target.closest('.technical-line-layer') || e.target.closest('.line-hover-hud') || e.target.closest('.drafting-sim-banner')) return;
    if (currentZoom > 1.05) {
      isDragging = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      stageContainer.style.cursor = 'grabbing';
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      if (stageContainer) stageContainer.style.cursor = 'default';
    }
  });

  // --- THEME SWITCHER ENGINE ---
  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.dataset.drawingTheme;
      if (!stageContainer) return;
      stageContainer.classList.remove('theme-blueprint', 'theme-cad');
      if (theme === 'blueprint') {
        stageContainer.classList.add('theme-blueprint');
      } else if (theme === 'cad') {
        stageContainer.classList.add('theme-cad');
      }
    });
  });

  // --- CAD QUICK LAYER MANAGER (ON / OFF) ---
  const layerVisibility = {
    visible: true,
    dimension: true,
    center: true,
    cutting: true,
    hatch: true,
    hidden: true
  };

  layerToggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const layerType = btn.dataset.toggleLayer;
      layerVisibility[layerType] = !layerVisibility[layerType];
      const isVisible = layerVisibility[layerType];

      btn.classList.toggle('layer-hidden-state', !isVisible);
      const eyeSpan = btn.querySelector('.layer-eye');
      if (eyeSpan) eyeSpan.textContent = isVisible ? '👁️' : '🚫';

      const targetLayer = drawing.querySelector(`[data-line-layer="${layerType}"]`);
      if (targetLayer) {
        targetLayer.style.display = isVisible ? '' : 'none';
      }
    });
  });

  // --- FLOATING LIVE HUD (HOVER TOOLTIP) ---
  layers.forEach(layer => {
    layer.addEventListener('mouseenter', () => {
      const type = layer.dataset.lineLayer;
      const data = lineData[type];
      if (!data || !hoverHud) return;

      if (hudTypeBadge) hudTypeBadge.textContent = data.title.split('/')[0].trim();
      if (hudIsoBadge) hudIsoBadge.textContent = data.iso || 'ISO 128';
      if (hudLineTitle) hudLineTitle.textContent = data.code;
      if (hudSpecText) hudSpecText.textContent = `Tebal: ${data.thickness} · Pensil: ${data.pencil.split(';')[0]}`;
      hoverHud.style.display = 'block';
      hoverHud.style.opacity = '1';
    });

    layer.addEventListener('mouseleave', () => {
      if (hoverHud) {
        hoverHud.style.opacity = '0';
        window.setTimeout(() => {
          if (hoverHud.style.opacity === '0') hoverHud.style.display = 'none';
        }, 150);
      }
    });
  });

  // --- STEP-BY-STEP DRAFTING SIMULATION ---
  const simSteps = [
    {
      step: 1,
      total: 5,
      title: '1. Menarik Garis Sumbu Utama (Strip-Titik Tipis)',
      desc: 'Tentukan pusat lingkaran Ø80, Ø40, dan 4×Ø12 dengan pensil 2H. Garis sumbu harus saling berpotongan di pusat dan menonjol 2–3 mm ke luar.',
      activeLayer: 'center',
      revealLayers: ['center']
    },
    {
      step: 2,
      total: 5,
      title: '2. Menggambar Garis Benda Nyata (Kontinu Tebal)',
      desc: 'Tarik kontur luar flange 120×120 R10, silinder boss Ø80, lubang pusat Ø40, dan 4×Ø12 menggunakan pensil HB hitam tegas dan dominan.',
      activeLayer: 'visible',
      revealLayers: ['center', 'visible']
    },
    {
      step: 3,
      total: 5,
      title: '3. Menentukan Garis Bidang Potong A-A',
      desc: 'Tandai letak pemotongan vertikal pada sumbu dengan strip-titik tebal di ujung dan anak panah penunjuk arah proyeksi pandangan potongan.',
      activeLayer: 'cutting',
      revealLayers: ['center', 'visible', 'cutting']
    },
    {
      step: 4,
      total: 5,
      title: '4. Menggoreskan Bagian Tersembunyi & Arsir 45°',
      desc: 'Beri garis putus-putus pada lubang di belakang bidang potong, lalu arsir material padat yang terbelah dengan kemiringan 45° berjarak 2 mm.',
      activeLayer: 'hatch',
      revealLayers: ['center', 'visible', 'cutting', 'hidden', 'hatch']
    },
    {
      step: 5,
      total: 5,
      title: '5. Pemberian Ukuran, Toleransi & Catatan Teknik',
      desc: 'Lengkapi seluruh nilai dimensi: 120, Ø80, Ø40, 4×Ø12, R10, 30, 40, dan 10 mm beserta anak panah ramping dan etiket gambar resmi ISO.',
      activeLayer: 'dimension',
      revealLayers: ['center', 'visible', 'cutting', 'hidden', 'hatch', 'dimension']
    }
  ];

  let simIndex = 0;
  let simTimer = null;
  let simPlaying = false;

  const renderSimStep = (index) => {
    const cur = simSteps[index];
    if (!cur) return;

    if (simStepBadge) simStepBadge.textContent = `LANGKAH ${cur.step} DARI ${cur.total}`;
    if (simStepTitle) simStepTitle.textContent = cur.title;
    if (simStepDesc) simStepDesc.textContent = cur.desc;
    if (simProgressFill) simProgressFill.style.width = `${(cur.step / cur.total) * 100}%`;

    layers.forEach(layer => {
      const layerName = layer.dataset.lineLayer;
      if (cur.revealLayers.includes(layerName)) {
        layer.style.display = '';
        if (layerName === cur.activeLayer) {
          layer.classList.add('active');
          layer.classList.remove('muted');
        } else {
          layer.classList.remove('active');
          layer.classList.remove('muted');
        }
      } else {
        layer.style.display = 'none';
      }
    });

    selectLine(cur.activeLayer, true);
    playSound('step');
  };

  const startSimulation = () => {
    simIndex = 0;
    simPlaying = true;
    if (simBanner) simBanner.style.display = 'flex';
    if (simBtnPlay) simBtnPlay.textContent = '⏸ Jeda';
    renderSimStep(simIndex);

    clearInterval(simTimer);
    simTimer = setInterval(() => {
      if (simPlaying) {
        if (simIndex < simSteps.length - 1) {
          simIndex++;
          renderSimStep(simIndex);
        } else {
          simIndex = 0;
          renderSimStep(simIndex);
        }
      }
    }, 4500);
  };

  const stopSimulation = () => {
    clearInterval(simTimer);
    simPlaying = false;
    if (simBanner) simBanner.style.display = 'none';
    layers.forEach(layer => {
      layer.style.display = '';
      layer.classList.remove('active', 'muted');
    });
    showAllLines();
  };

  btnSimulate?.addEventListener('click', () => {
    if (simBanner && simBanner.style.display !== 'none') {
      stopSimulation();
    } else {
      startSimulation();
    }
  });

  simBtnClose?.addEventListener('click', stopSimulation);

  simBtnPlay?.addEventListener('click', () => {
    simPlaying = !simPlaying;
    if (simBtnPlay) simBtnPlay.textContent = simPlaying ? '⏸ Jeda' : '▶ Lanjut';
  });

  simBtnNext?.addEventListener('click', () => {
    simIndex = (simIndex + 1) % simSteps.length;
    renderSimStep(simIndex);
  });

  simBtnPrev?.addEventListener('click', () => {
    simIndex = (simIndex - 1 + simSteps.length) % simSteps.length;
    renderSimStep(simIndex);
  });

  // --- CHALLENGE / GUESSING GAME ---
  let challengeActive = false;
  let challengeOrder = [];
  let challengeRound = 0;
  let challengePoints = 0;
  let challengeLocked = false;
  let currentStreak = 0;

  const updateStreakUI = () => {
    if (streakPill && streakCount) {
      streakCount.textContent = currentStreak;
      if (currentStreak >= 2) {
        streakPill.style.display = 'inline-flex';
        streakPill.innerHTML = `🔥 <span>${currentStreak}</span> Combo!`;
      } else {
        streakPill.style.display = 'none';
      }
    }
  };

  const updateChallengeProgress = () => {
    if (challengeScore) challengeScore.textContent = `${challengePoints} / 4`;
    if (challengeProgress) challengeProgress.style.width = `${Math.min(100, challengeRound * 25)}%`;
  };

  const setNextChallenge = () => {
    challengeLocked = false;
    if (challengeRound >= 4) {
      challengeActive = false;
      if (challengePrompt) challengePrompt.textContent = `Latihan selesai. Skormu ${challengePoints} dari 4.`;
      if (challengeFeedback) {
        challengeFeedback.textContent = challengePoints >= 3
          ? 'Luar biasa! Kamu sudah menguasai hierarki garis teknik standar ISO.'
          : 'Coba ulangi dan cermati perbedaan goresan antara garis nyata dan bantu.';
        challengeFeedback.className = `line-challenge-feedback ${challengePoints >= 3 ? 'correct' : 'notice'}`;
      }
      if (challengeButton) challengeButton.textContent = 'Ulangi latihan';

      if (challengePoints >= 2 && typeof window.completeModule === 'function') {
        window.completeModule('lines');
      }
      return;
    }

    const target = challengeOrder[challengeRound];
    if (challengePrompt) challengePrompt.textContent = `Soal ${challengeRound + 1}: klik ${lineData[target].challenge} pada gambar.`;
    if (challengeFeedback) {
      challengeFeedback.textContent = 'Pilih langsung garis yang tepat pada ilustrasi gambar kerja.';
      challengeFeedback.className = 'line-challenge-feedback notice';
    }
  };

  const startChallenge = () => {
    challengeActive = true;
    challengeRound = 0;
    challengePoints = 0;
    challengeLocked = false;
    currentStreak = 0;
    updateStreakUI();

    const availableTypes = ['visible', 'dimension', 'center', 'cutting', 'hatch', 'hidden'];
    challengeOrder = availableTypes
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .slice(0, 4)
      .map(item => item.value);
    if (challengeButton) challengeButton.textContent = 'Mulai ulang';
    updateChallengeProgress();
    showAllLines();
    setNextChallenge();
  };

  const answerChallenge = (type) => {
    if (!challengeActive || challengeLocked) return false;
    const target = challengeOrder[challengeRound];
    if (type !== target) {
      currentStreak = 0;
      updateStreakUI();
      playSound('wrong');
      if (challengeFeedback) {
        challengeFeedback.textContent = 'Belum tepat. Perhatikan pola goresan dan posisinya, lalu coba lagi.';
        challengeFeedback.className = 'line-challenge-feedback wrong';
      }
      return true;
    }

    challengeLocked = true;
    challengePoints += 1;
    challengeRound += 1;
    currentStreak += 1;
    updateStreakUI();
    playSound('correct');
    selectLine(type);
    updateChallengeProgress();
    if (challengeFeedback) {
      challengeFeedback.textContent = `Benar — itu ${lineData[type].title.toLowerCase()}.`;
      challengeFeedback.className = 'line-challenge-feedback correct';
    }
    window.setTimeout(() => {
      if (challengeActive) {
        showAllLines();
        setNextChallenge();
      } else {
        setNextChallenge();
      }
    }, 850);
    return true;
  };

  typeButtons.forEach(button => {
    button.addEventListener('click', () => selectLine(button.dataset.lineType));
  });

  layers.forEach(layer => {
    const chooseLayer = () => {
      const type = layer.dataset.lineLayer;
      if (!answerChallenge(type)) selectLine(type);
    };
    layer.addEventListener('click', chooseLayer);
    layer.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        chooseLayer();
      }
    });
  });

  showAllButton?.addEventListener('click', () => {
    challengeActive = false;
    currentStreak = 0;
    updateStreakUI();
    showAllLines();
    if (challengeButton) challengeButton.textContent = 'Mulai latihan';
    if (challengePrompt) challengePrompt.textContent = 'Mulai latihan, lalu klik garis yang diminta langsung pada gambar kerja.';
    if (challengeFeedback) {
      challengeFeedback.textContent = '';
      challengeFeedback.className = 'line-challenge-feedback';
    }
  });

  challengeButton?.addEventListener('click', startChallenge);

  // --- ISO 3098 LETTERING SIMULATOR ---
  const letterInput = document.getElementById('iso-letter-input');
  const letterDisplay = document.getElementById('iso-letter-display');
  const heightButtons = document.querySelectorAll('#iso-height-picker .toggle-btn');
  const slantButtons = document.querySelectorAll('#iso-slant-picker .toggle-btn');

  if (letterInput && letterDisplay) {
    letterInput.addEventListener('input', () => {
      letterDisplay.textContent = letterInput.value || "DRAFT-LAB 2026";
      if (typeof window.completeModule === 'function') {
        window.completeModule('lines');
      }
    });

    heightButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        heightButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const h = btn.dataset.h;
        const fontMap = { '2.5': '1.05rem', '3.5': '1.25rem', '5': '1.55rem', '7': '1.9rem' };
        letterDisplay.style.fontSize = fontMap[h] || '1.5rem';
        if (typeof window.completeModule === 'function') {
          window.completeModule('lines');
        }
      });
    });

    slantButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        slantButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.slant === 'italic') {
          letterDisplay.classList.add('italic');
        } else {
          letterDisplay.classList.remove('italic');
        }
        if (typeof window.completeModule === 'function') {
          window.completeModule('lines');
        }
      });
    });
  }

  // --- ISO 216 PAPER SIZES INTERACTIVE ---
  const paperData = {
    a0: { name: "Format Kertas A0", area: "1 m²", dim: "841 × 1189 mm", marginL: "20 mm", marginO: "10 mm", orient: "Horizontal (Lanskap)", w: 84, h: 119 },
    a1: { name: "Format Kertas A1", area: "1/2 m²", dim: "594 × 841 mm", marginL: "20 mm", marginO: "10 mm", orient: "Horizontal / Vertikal", w: 80, h: 113 },
    a2: { name: "Format Kertas A2", area: "1/4 m²", dim: "420 × 594 mm", marginL: "20 mm", marginO: "10 mm", orient: "Horizontal / Vertikal", w: 75, h: 106 },
    a3: { name: "Format Kertas A3", area: "1/8 m²", dim: "297 × 420 mm", marginL: "20 mm", marginO: "10 mm", orient: "Horizontal (Lanskap)", w: 70, h: 99 },
    a4: { name: "Format Kertas A4", area: "1/16 m²", dim: "210 × 297 mm", marginL: "20 mm (atau 10 mm)", marginO: "5 mm", orient: "Vertikal / Horizontal", w: 65, h: 92 }
  };

  const paperTabButtons = document.querySelectorAll('.paper-tab-btn');
  const paperTitle = document.getElementById('paper-name-title');
  const paperArea = document.getElementById('paper-area-tag');
  const paperDim = document.getElementById('paper-dimensions');
  const paperML = document.getElementById('paper-margin-left');
  const paperMO = document.getElementById('paper-margin-other');
  const paperOrient = document.getElementById('paper-orientation');
  const paperRatioBox = document.getElementById('paper-ratio-box');
  const paperAspectPrev = document.getElementById('paper-aspect-preview');

  if (paperTabButtons.length && paperTitle) {
    paperTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        paperTabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const p = paperData[btn.dataset.paper];
        if (!p) return;

        paperTitle.textContent = p.name;
        paperArea.textContent = p.area;
        paperDim.textContent = p.dim;
        paperML.textContent = p.marginL;
        paperMO.textContent = p.marginO;
        paperOrient.textContent = p.orient;
        paperAspectPrev.textContent = `${btn.dataset.paper.toUpperCase()} (1:√2)`;

        if (paperRatioBox) {
          paperRatioBox.style.width = `${p.w}px`;
          paperRatioBox.style.height = `${p.h}px`;
        }

        if (typeof window.completeModule === 'function') {
          window.completeModule('lines');
        }
      });
    });
  }

  // Initial selection
  selectLine('visible');
});
