// --- LABORATORIUM PENSIL GAMBAR (PENCIL GRADE LAB) ---

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('pencil-lab-canvas-element');
  const wrapper = document.getElementById('pencil-canvas-wrapper');
  if (!canvas || !wrapper) return;

  const ctx = canvas.getContext('2d');
  
  // State
  let isDrawing = false;
  let activeGrade = 'hb'; // '9h' to '9b'
  let activeMode = 'draw'; // 'draw', 'erase', or 'stump'
  let points = [];
  let startX = 0;
  let startY = 0;

  // Back buffer for straight line previews
  const backBufferCanvas = document.createElement('canvas');
  const backBufferCtx = backBufferCanvas.getContext('2d');

  // Extended Metadata for all 20 ISO Graphite Grades
  const pencilMetadata = {
    '2h': {
      title: "Pensil 2H (Keras / Hard)",
      hardnessText: "KERAS (63% Liat)",
      hardnessWidth: "63%",
      use: "Menggambar garis arsir potongan, garis ukuran (dimensi), dan garis bantu proyeksi.",
      pro: "Presisi tinggi untuk detail teknik, garis konsisten dan tidak mengotori kertas kerja.",
      con: "Kurang kontras saat difotokopi, garis kurang tebal untuk batas pandangan benda.",
      color: "rgba(100, 116, 139, 0.80)",
      width: 1.2
    },
    'h': {
      title: "Pensil H (Keras Ringan / Hard)",
      hardnessText: "KERAS RINGAN (58% Liat)",
      hardnessWidth: "58%",
      use: "Garis bantu arsir umum, tulisan deskripsi gambar tipis, kepala etiket sekunder.",
      pro: "Kombinasi kekerasan sedang dengan kebersihan yang baik di atas kertas.",
      con: "Goresan masih sedikit abu-abu dibanding standar penulisan pensil HB.",
      color: "rgba(100, 116, 139, 0.90)",
      width: 1.5
    },
    'hb': {
      title: "Pensil HB (Sedang / Medium)",
      hardnessText: "SEDANG (50% Clay / 50% Carbon)",
      hardnessWidth: "50%",
      use: "Menulis teks gambar, membuat huruf standardisasi (ISO 3098), kepala gambar (etiket), dan garis sedang.",
      pro: "Ketebalan seimbang dan serbaguna, tulisan terbaca jelas dan tidak mudah patah.",
      con: "Kurang tipis untuk garis bantu arsir halus, dan kurang hitam untuk garis tepi utama.",
      color: "rgba(71, 85, 105, 1.0)",
      width: 2.2
    },
    'b': {
      title: "Pensil B (Lunak Ringan / Soft)",
      hardnessText: "LUNAK RINGAN (43% Clay / 57% Carbon)",
      hardnessWidth: "43%",
      use: "Membuat sketsa arsitektur bebas, tulisan penjelasan tebal, dan outline sedang.",
      pro: "Goresan lancar dan hitam, memberikan kontras visual yang baik.",
      con: "Mulai mudah luntur jika digesek mistar/segitiga gambar secara terus-menerus.",
      color: "rgba(45, 55, 75, 1.0)",
      width: 2.8
    },
    '2b': {
      title: "Pensil 2B (Lunak / Soft)",
      hardnessText: "LUNAK (35% Clay / 65% Carbon)",
      hardnessWidth: "35%",
      use: "Menggambar garis tepi benda nyata (garis tampak utama), huruf besar, dan etiket batas utama.",
      pro: "Sangat kontras, hitam pekat, memenuhi standar ketebalan garis gambar nyata (0.5 mm).",
      con: "Grafit lunak mudah luntur jika tergeser tangan, harus sering diruncingkan agar garis tetap presisi.",
      color: "rgba(30, 41, 59, 1.0)",
      width: 3.5
    }
  };

  // Canvas Resizing Helper
  const resizePencilCanvas = () => {
    const rect = wrapper.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }

    // Only copy and restore content if the current canvas has valid dimensions
    if (canvas.width > 0 && canvas.height > 0) {
      try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(canvas, 0, 0);

        canvas.width = rect.width;
        canvas.height = rect.height;

        // Restore drawn content
        ctx.drawImage(tempCanvas, 0, 0);
      } catch (e) {
        console.warn("Gagal menyimpan isi kanvas saat resize:", e);
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    } else {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  };

  window.addEventListener('resize', resizePencilCanvas);
  setTimeout(resizePencilCanvas, 100);

  // Apply active style (Pencil vs Eraser vs Blending Stump)
  const applyPencilStyle = () => {
    const meta = pencilMetadata[activeGrade];
    if (!meta) return;

    if (activeMode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 24; // Eraser size
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (activeMode === 'stump') {
      // Blending Stump (Dusel): soft airbrush smudge trail
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 20;
      ctx.strokeStyle = 'rgba(160, 160, 160, 0.08)'; // semi-transparent smudge gray
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 14;
      ctx.shadowColor = 'rgba(160, 160, 160, 0.15)';
    } else {
      // Draw Mode
      ctx.globalCompositeOperation = 'source-over';
      
      ctx.lineWidth = meta.width;
      ctx.strokeStyle = meta.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.shadowBlur = meta.blur || 0;
      ctx.shadowColor = meta.color;
    }
  };



  // Drawing events (straight line for draw mode, freehand for erase/stump)
  canvas.addEventListener('pointerdown', (e) => {
    isDrawing = true;
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    startX = x;
    startY = y;
    points.push({ x, y });

    if (activeMode === 'draw') {
      // Save canvas state to back buffer
      backBufferCanvas.width = canvas.width;
      backBufferCanvas.height = canvas.height;
      backBufferCtx.drawImage(canvas, 0, 0);
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeMode === 'draw') {
      // Clear main canvas and restore state
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(backBufferCanvas, 0, 0);
      
      // Draw straight line preview
      applyPencilStyle();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      points.push({ x, y });
      applyPencilStyle();

      // Smoother line joints via quadratic curve (for eraser and stump)
      if (points.length > 2) {
        const lastTwo = points.slice(-3);
        const xc = (lastTwo[1].x + lastTwo[2].x) / 2;
        const yc = (lastTwo[1].y + lastTwo[2].y) / 2;
        
        ctx.quadraticCurveTo(lastTwo[1].x, lastTwo[1].y, xc, yc);
        ctx.stroke();
      } else {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  });

  let pencilDrawCount = 0;
  const stopDrawing = (e) => {
    if (isDrawing) {
      isDrawing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch(err) {}
      points = [];
      pencilDrawCount++;
      if (pencilDrawCount >= 2 && typeof window.completeModule === 'function') {
        window.completeModule('pencils');
      }
    }
  };

  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointercancel', stopDrawing);

  // Sync selections dynamically between cards, chart cells, and metadata info
  const syncPencilGradeSelection = (grade) => {
    activeGrade = grade;
    
    // 1. Update Pencil Grade selector cards active states
    const pencilGradeCards = document.querySelectorAll('.pencil-grade-card');
    pencilGradeCards.forEach(card => {
      if (card.getAttribute('data-grade') === grade) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // 2. Update ISO Chart cells active states
    const cells = document.querySelectorAll('.graphite-cell');
    cells.forEach(cell => {
      if (cell.getAttribute('data-iso') === grade) {
        cell.classList.add('active');
      } else {
        cell.classList.remove('active');
      }
    });

    // 3. Populate metadata info card
    updatePencilInfoCard(grade);
  };

  // Card selector click handlers
  const pencilGradeCards = document.querySelectorAll('.pencil-grade-card');
  pencilGradeCards.forEach(card => {
    card.addEventListener('click', () => {
      const grade = card.getAttribute('data-grade');
      syncPencilGradeSelection(grade);
    });
  });

  // ISO Grid cells click handlers
  const graphiteCells = document.querySelectorAll('.graphite-cell');
  graphiteCells.forEach(cell => {
    cell.addEventListener('click', () => {
      const grade = cell.getAttribute('data-iso');
      syncPencilGradeSelection(grade);
    });
  });

  // Update dynamic details card text
  const updatePencilInfoCard = (grade) => {
    const meta = pencilMetadata[grade];
    if (!meta) return;

    const titleEl = document.getElementById('pencil-info-title');
    const fillEl = document.getElementById('pencil-hardness-fill');
    const textEl = document.getElementById('pencil-hardness-text');
    const useEl = document.getElementById('pencil-info-use');
    const proEl = document.getElementById('pencil-info-pro');
    const conEl = document.getElementById('pencil-info-con');

    if (titleEl) titleEl.textContent = meta.title;
    if (fillEl) fillEl.style.width = meta.hardnessWidth;
    if (textEl) textEl.textContent = meta.hardnessText;
    if (useEl) useEl.textContent = meta.use;
    if (proEl) proEl.textContent = meta.pro;
    if (conEl) conEl.textContent = meta.con;
  };

  // Canvas Mode selectors (Draw vs Erase vs Stump)
  const btnDrawMode = document.getElementById('pencil-mode-draw-btn');
  const btnEraseMode = document.getElementById('pencil-mode-erase-btn');
  const btnStumpMode = document.getElementById('pencil-mode-stump-btn');

  const updateModeButtons = (mode) => {
    activeMode = mode;
    if (btnDrawMode) btnDrawMode.classList.toggle('active', mode === 'draw');
    if (btnEraseMode) btnEraseMode.classList.toggle('active', mode === 'erase');
    if (btnStumpMode) btnStumpMode.classList.toggle('active', mode === 'stump');
    
    if (mode === 'draw') canvas.style.cursor = 'crosshair';
    else if (mode === 'erase') canvas.style.cursor = 'cell';
    else if (mode === 'stump') canvas.style.cursor = 'w-resize';
  };

  if (btnDrawMode) {
    btnDrawMode.addEventListener('click', () => updateModeButtons('draw'));
  }
  if (btnEraseMode) {
    btnEraseMode.addEventListener('click', () => updateModeButtons('erase'));
  }
  if (btnStumpMode) {
    btnStumpMode.addEventListener('click', () => updateModeButtons('stump'));
  }

  // Guidelines template toggler
  const btnTemplate = document.getElementById('pencil-toggle-template-btn');
  const templateGuide = document.getElementById('pencil-template-guide');
  if (btnTemplate && templateGuide) {
    btnTemplate.addEventListener('click', () => {
      const isVisible = templateGuide.style.display !== 'none';
      templateGuide.style.display = isVisible ? 'none' : 'block';
      btnTemplate.classList.toggle('active');
    });
  }

  // Clear Canvas
  const btnClearCanvas = document.getElementById('pencil-clear-canvas-btn');
  if (btnClearCanvas) {
    btnClearCanvas.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin menghapus seluruh kanvas coretan pensil?')) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  }

  // Download pencil drawing as PNG
  const btnDownloadPencil = document.getElementById('pencil-download-btn');
  if (btnDownloadPencil) {
    btnDownloadPencil.addEventListener('click', () => {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width || 800;
      exportCanvas.height = canvas.height || 600;
      const expCtx = exportCanvas.getContext('2d');

      // 1. Paper background
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // 2. Border
      expCtx.strokeStyle = '#2567b9';
      expCtx.lineWidth = 1.5;
      expCtx.strokeRect(15, 15, exportCanvas.width - 30, exportCanvas.height - 30);

      // 3. Draw content
      expCtx.drawImage(canvas, 0, 0);

      // 4. Header / Footer watermark
      expCtx.fillStyle = '#123f76';
      expCtx.font = 'bold 11px sans-serif';
      expCtx.textAlign = 'left';
      expCtx.fillText('DRAFT-LAB • Lembar Uji Karakteristik Grafit Pensil (ISO)', 25, exportCanvas.height - 24);

      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      expCtx.fillStyle = '#536a85';
      expCtx.font = '10px monospace';
      expCtx.textAlign = 'right';
      expCtx.fillText(today, exportCanvas.width - 25, exportCanvas.height - 24);

      // 5. Download
      const link = document.createElement('a');
      link.download = `draftlab-pensil-lab-${Date.now()}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();

      if (typeof window.completeModule === 'function') {
        window.completeModule('pencils');
      }
    });
  }

  // Trigger default load values
  syncPencilGradeSelection('hb');

  // Expose sizing helper internationally
  window.resizePencilCanvas = resizePencilCanvas;
});
