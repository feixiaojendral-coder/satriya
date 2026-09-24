// --- PROYEKSI ORTHOGONAL GLASS BOX SIMULATOR (BALOK BERTINGKAT ISO) ---

document.addEventListener('DOMContentLoaded', () => {
  const viewport = document.querySelector('.projection-viewport');
  const glassBox = document.getElementById('projection-glass-box');
  const instructions = document.getElementById('projection-instructions');
  
  if (!viewport || !glassBox) return;

  // Buttons - View Mode
  const btn3D = document.getElementById('btn-proj-3d');
  const btnUnfold = document.getElementById('btn-proj-unfold');

  // Buttons - Standardization System
  const btnEU = document.getElementById('btn-proj-eu');
  const btnUS = document.getElementById('btn-proj-us');

  // Quick Action Buttons
  const btnReset = document.getElementById('btn-proj-reset');
  const btnAutoRotate = document.getElementById('btn-proj-autorotate');

  // Info Card Elements
  const infoTitle = document.getElementById('projection-info-title');
  const infoDesc = document.getElementById('projection-info-desc');
  const isoSymbolContainer = document.getElementById('projection-iso-symbol');

  // Drag-to-rotate State
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let rotX = -20; // Default isometric rotation X
  let rotY = 35;  // Default isometric rotation Y
  let currentMode = '3d'; // '3d' or 'flat'
  let currentSystem = 'eu'; // 'eu' or 'us'
  let autoRotate = false;
  let animationFrameId = null;

  // ISO 5456-2 Standard Projection Symbols
  const ISO_SYMBOLS = {
    eu: `
      <svg class="iso-symbol-svg" viewBox="0 0 120 40" width="115" height="38" role="img" aria-label="Simbol Proyeksi Eropa ISO (Sudut Pertama)">
        <line x1="5" y1="20" x2="115" y2="20" stroke="#718ba4" stroke-width="1" stroke-dasharray="8 3 2 3"/>
        <polygon points="15,10 45,5 45,35 15,30" fill="rgba(29, 98, 184, 0.12)" stroke="#1d62b8" stroke-width="1.8"/>
        <circle cx="85" cy="20" r="7.5" fill="none" stroke="#1d62b8" stroke-width="1.8"/>
        <circle cx="85" cy="20" r="15" fill="rgba(29, 98, 184, 0.08)" stroke="#1d62b8" stroke-width="1.8"/>
        <line x1="85" y1="2" x2="85" y2="38" stroke="#718ba4" stroke-width="1" stroke-dasharray="8 3 2 3"/>
      </svg>
    `,
    us: `
      <svg class="iso-symbol-svg" viewBox="0 0 120 40" width="115" height="38" role="img" aria-label="Simbol Proyeksi Amerika ISO (Sudut Ketiga)">
        <line x1="5" y1="20" x2="115" y2="20" stroke="#718ba4" stroke-width="1" stroke-dasharray="8 3 2 3"/>
        <circle cx="35" cy="20" r="7.5" fill="none" stroke="#1d62b8" stroke-width="1.8"/>
        <circle cx="35" cy="20" r="15" fill="rgba(29, 98, 184, 0.08)" stroke="#1d62b8" stroke-width="1.8"/>
        <line x1="35" y1="2" x2="35" y2="38" stroke="#718ba4" stroke-width="1" stroke-dasharray="8 3 2 3"/>
        <polygon points="75,5 105,10 105,30 75,35" fill="rgba(29, 98, 184, 0.12)" stroke="#1d62b8" stroke-width="1.8"/>
      </svg>
    `
  };

  const getFlatScale = () => {
    const availableWidth = Math.max(viewport.clientWidth - 48, 320);
    const availableHeight = Math.max(viewport.clientHeight - 48, 360);
    return Math.min(0.72, availableWidth / 1200, availableHeight / 900);
  };

  const updateCardContent = () => {
    if (isoSymbolContainer) {
      isoSymbolContainer.innerHTML = ISO_SYMBOLS[currentSystem];
    }

    if (currentSystem === 'eu') {
      infoTitle.innerHTML = `🇪🇺 Proyeksi Eropa (Sudut Pertama / Kuadran I)`;
      infoDesc.innerHTML = `
        Dikenal sebagai <strong>First Angle Projection</strong>. Posisi benda berada di antara pengamat dan bidang proyeksi (bayangan tembus ke belakang).<br><br>
        <strong>Karakteristik Tata Letak 2D (Buka Lipatan):</strong>
        <br>• <strong>Pandangan Atas:</strong> Digambar di <strong>BAWAH</strong> Pandangan Depan.
        <br>• <strong>Pandangan Kiri:</strong> Digambar di sebelah <strong>KANAN</strong> Pandangan Depan.
        <br>• <strong>Pandangan Kanan:</strong> Digambar di sebelah <strong>KIRI</strong> Pandangan Depan.
        <br>• <strong>Pandangan Bawah:</strong> Digambar di <strong>ATAS</strong> Pandangan Depan.
        <br><br>
        <strong>Analisis Balok Bertingkat ISO:</strong>
        <br>• <em>Pandangan Depan (Pusat):</em> Berbentuk huruf L berukuran 120 × 120 mm dengan ketebalan sayap 60 mm.
        <br>• <em>Pandangan Samping Kiri:</em> Garis undakan step berada di belakang dinding balok sehingga digambar menggunakan <strong>garis putus-putus (garis gores ISO)</strong>.
      `;
    } else {
      infoTitle.innerHTML = `🇺🇸 Proyeksi Amerika (Sudut Ketiga / Kuadran III)`;
      infoDesc.innerHTML = `
        Dikenal sebagai <strong>Third Angle Projection</strong>. Bidang proyeksi (kaca transparan) berada di antara pengamat dan benda.<br><br>
        <strong>Karakteristik Tata Letak 2D (Buka Lipatan):</strong>
        <br>• <strong>Pandangan Atas:</strong> Digambar di <strong>ATAS</strong> Pandangan Depan.
        <br>• <strong>Pandangan Kanan:</strong> Digambar di sebelah <strong>KANAN</strong> Pandangan Depan.
        <br>• <strong>Pandangan Kiri:</strong> Digambar di sebelah <strong>KIRI</strong> Pandangan Depan.
        <br>• <strong>Pandangan Bawah:</strong> Digambar di <strong>BAWAH</strong> Pandangan Depan.
        <br><br>
        <strong>Analisis Balok Bertingkat ISO:</strong>
        <br>• <em>Lebih Intuitif:</em> Letak pandangan searah dengan mata pengamat (menatap dari atas, hasil gambar ditaruh di atas).
        <br>• <em>Standar Utama CAD:</em> Format baku yang umum dipakai pada industri manufaktur modern dan software CAD internasional.
      `;
    }
  };

  // --- MOUSE / TOUCH ROTATION (ONLY IN 3D MODE) ---
  viewport.addEventListener('pointerdown', (e) => {
    if (currentMode !== '3d') return;
    
    isDragging = true;
    if (autoRotate) {
      autoRotate = false;
      btnAutoRotate?.setAttribute('aria-pressed', 'false');
      btnAutoRotate?.classList.remove('active');
    }
    viewport.setPointerCapture(e.pointerId);
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isDragging || currentMode !== '3d') return;

    const deltaX = e.clientX - prevMouseX;
    const deltaY = e.clientY - prevMouseY;

    rotY += deltaX * 0.5;
    rotX -= deltaY * 0.5;

    // Limit X rotation to avoid gimbal flip
    rotX = Math.max(-80, Math.min(80, rotX));

    glassBox.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  const stopDrag = (e) => {
    if (isDragging) {
      isDragging = false;
      try { viewport.releasePointerCapture(e.pointerId); } catch(err) {}
    }
  };
  viewport.addEventListener('pointerup', stopDrag);
  viewport.addEventListener('pointercancel', stopDrag);

  // --- VIEW MODE MANAGEMENT ---
  const applyViewState = () => {
    if (currentMode === '3d') {
      glassBox.className = 'glass-box-container state-3d';
      glassBox.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      viewport.style.cursor = 'grab';
      if (instructions) {
        instructions.textContent = '🖱️ Drag mouse untuk memutar kotak kaca proyeksi 3D (Balok Bertingkat ISO 120 × 120 × 60 mm).';
      }
    } else {
      stopAutoRotate();
      if (currentSystem === 'eu') {
        glassBox.className = 'glass-box-container state-unfolded-eu';
      } else {
        glassBox.className = 'glass-box-container state-unfolded-us';
      }
      glassBox.style.transform = `rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(${getFlatScale()})`;
      viewport.style.cursor = 'default';
      if (instructions) {
        instructions.textContent = `📄 Tampilan Bentangan 2D: ${currentSystem === 'eu' ? 'Proyeksi Eropa (Sudut I)' : 'Proyeksi Amerika (Sudut III)'}`;
      }
    }
  };

  window.addEventListener('resize', () => {
    if (currentMode === 'flat') applyViewState();
  });

  // Auto-rotate loop
  const stepAutoRotate = () => {
    if (!autoRotate || currentMode !== '3d') return;
    rotY = (rotY + 0.4) % 360;
    glassBox.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    animationFrameId = requestAnimationFrame(stepAutoRotate);
  };

  const startAutoRotate = () => {
    autoRotate = true;
    btnAutoRotate?.setAttribute('aria-pressed', 'true');
    btnAutoRotate?.classList.add('active');
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(stepAutoRotate);
  };

  const stopAutoRotate = () => {
    autoRotate = false;
    btnAutoRotate?.setAttribute('aria-pressed', 'false');
    btnAutoRotate?.classList.remove('active');
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  // --- BUTTON HANDLERS ---
  btn3D?.addEventListener('click', () => {
    btn3D.classList.add('active');
    btnUnfold?.classList.remove('active');
    currentMode = '3d';
    applyViewState();
    if (typeof window.completeModule === 'function') {
      window.completeModule('projection');
    }
  });

  btnUnfold?.addEventListener('click', () => {
    btnUnfold.classList.add('active');
    btn3D?.classList.remove('active');
    currentMode = 'flat';
    applyViewState();
    if (typeof window.completeModule === 'function') {
      window.completeModule('projection');
    }
  });

  btnEU?.addEventListener('click', () => {
    btnEU.classList.add('active');
    btnUS?.classList.remove('active');
    currentSystem = 'eu';
    updateCardContent();
    applyViewState();
    if (typeof window.completeModule === 'function') {
      window.completeModule('projection');
    }
  });

  btnUS?.addEventListener('click', () => {
    btnUS.classList.add('active');
    btnEU?.classList.remove('active');
    currentSystem = 'us';
    updateCardContent();
    applyViewState();
    if (typeof window.completeModule === 'function') {
      window.completeModule('projection');
    }
  });

  btnReset?.addEventListener('click', () => {
    stopAutoRotate();
    rotX = -20;
    rotY = 35;
    applyViewState();
  });

  btnAutoRotate?.addEventListener('click', () => {
    if (currentMode !== '3d') {
      btn3D?.click();
    }
    if (autoRotate) {
      stopAutoRotate();
    } else {
      startAutoRotate();
    }
  });

  // Initial render
  updateCardContent();
  applyViewState();
});
