// --- ETIKET ISO & STANDARDISASI GARIS LOGIK ---

document.addEventListener('DOMContentLoaded', () => {
  // --- FORM INPUT ELEMENTS ---
  const inputInstansi = document.getElementById('input-instansi');
  const inputTitle = document.getElementById('input-title');
  const inputDrawer = document.getElementById('input-drawer');
  const inputChecker = document.getElementById('input-checker');
  const inputApproved = document.getElementById('input-approved');
  const inputDrawnDate = document.getElementById('input-drawn-date');
  const inputCheckedDate = document.getElementById('input-checked-date');
  const inputApprovedDate = document.getElementById('input-approved-date');
  const inputScale = document.getElementById('input-scale');
  const inputProjection = document.getElementById('input-projection');
  const inputPaper = document.getElementById('input-paper-size');
  const inputSheet = document.getElementById('input-sheet-num');
  const inputSheetTotal = document.getElementById('input-sheet-total');
  const inputDrawingNum = document.getElementById('input-drawing-num');

  // --- SVG TEXT ELEMENTS ---
  const txtInstansi = document.getElementById('txt-instansi-name');
  const txtTitle = document.getElementById('txt-drawing-title');
  const txtDrawer = document.getElementById('txt-drawer-name');
  const txtChecker = document.getElementById('txt-checker-name');
  const txtApproved = document.getElementById('txt-approved-name');
  const txtDrawnDate = document.getElementById('txt-drawn-date');
  const txtCheckedDate = document.getElementById('txt-checked-date');
  const txtApprovedDate = document.getElementById('txt-approved-date');
  const txtScale = document.getElementById('txt-scale');
  const txtPaper = document.getElementById('txt-paper');
  const txtSheet = document.getElementById('txt-sheet-num');
  const txtSheetTotal = document.getElementById('txt-sheet-total');
  const txtDrawingNum = document.getElementById('txt-drawing-num');

  if (!inputInstansi) return; // Guard for pages that don't load etiket

  // Update text helper
  const updateField = (inputEl, svgEl) => {
    if (inputEl && svgEl) {
      svgEl.textContent = inputEl.value.toUpperCase();
    }
  };

  const updateInstansiOverlay = () => {
    const hasCustomLogo = localStorage.getItem('etiket-custom-logo') !== null;
    const instansiVal = inputInstansi ? inputInstansi.value.trim().toUpperCase() : "";
    
    const cover = document.getElementById('custom-logo-bg-cover');
    const defaultLogo = document.getElementById('etiket-logo-default');
    const customLogo = document.getElementById('etiket-logo-img');

    if (cover) cover.style.display = 'none';
    
    if (txtInstansi) {
      txtInstansi.style.display = 'block';
      txtInstansi.textContent = instansiVal || "SMK NEGERI 1 DRAFTING INDONESIA";
    }

    if (hasCustomLogo) {
      if (customLogo) customLogo.style.display = 'block';
      if (defaultLogo) defaultLogo.style.display = 'none';
    } else {
      if (customLogo) customLogo.style.display = 'none';
      if (defaultLogo) defaultLogo.style.display = 'block';
    }
  };

  // Event Listeners for Live Preview
  inputInstansi.addEventListener('input', updateInstansiOverlay);
  inputTitle.addEventListener('input', () => updateField(inputTitle, txtTitle));
  inputDrawer.addEventListener('input', () => updateField(inputDrawer, txtDrawer));
  inputChecker.addEventListener('input', () => updateField(inputChecker, txtChecker));
  inputApproved.addEventListener('input', () => updateField(inputApproved, txtApproved));
  
  inputDrawnDate.addEventListener('input', () => updateField(inputDrawnDate, txtDrawnDate));
  inputCheckedDate.addEventListener('input', () => updateField(inputCheckedDate, txtCheckedDate));
  inputApprovedDate.addEventListener('input', () => updateField(inputApprovedDate, txtApprovedDate));

  inputDrawingNum.addEventListener('input', () => {
    if (txtDrawingNum) txtDrawingNum.textContent = "No. Gambar: " + inputDrawingNum.value.toUpperCase();
  });

  inputSheet.addEventListener('input', () => {
    if (txtSheet) txtSheet.textContent = inputSheet.value;
  });

  inputSheetTotal.addEventListener('input', () => {
    if (txtSheetTotal) txtSheetTotal.textContent = inputSheetTotal.value;
  });

  inputScale.addEventListener('change', () => {
    if (txtScale) txtScale.textContent = inputScale.value;
  });

  inputPaper.addEventListener('change', () => {
    if (txtPaper) txtPaper.textContent = inputPaper.value;
  });

  // Sinkronisasi Drafter (Digambar) otomatis dari akun login siswa
  const syncDrawerFromAuth = (studentData) => {
    let student = studentData;
    if (!student) {
      try {
        const raw = localStorage.getItem('draftlab_student_session');
        student = raw ? JSON.parse(raw) : null;
      } catch (e) {
        student = null;
      }
    }
    if (student && student.nama && inputDrawer) {
      inputDrawer.value = student.nama;
      updateField(inputDrawer, txtDrawer);
    }
  };

  syncDrawerFromAuth();
  window.addEventListener('draftlab:student-login', (e) => syncDrawerFromAuth(e.detail));
  window.addEventListener('draftlab:student-logout', () => {
    if (inputDrawer) {
      inputDrawer.value = 'DRAFTSMAN';
      updateField(inputDrawer, txtDrawer);
    }
  });

  // Handle Projection Symbol updates
  const symbolGroup = document.getElementById('projection-symbol-group');
  
  const updateProjectionSymbol = (mode) => {
    if (!symbolGroup) return;

    if (mode === 'eropa') {
      // First Angle (European): Circles on Right, Trapeze on Left
      // Large end of trapeze facing circles (right side of trapeze is large)
      symbolGroup.innerHTML = `
        <!-- First Angle (European) -->
        <circle cx="80" cy="25" r="10" fill="none" stroke="#1e293b" stroke-width="6"/>
        <circle cx="80" cy="25" r="18" fill="none" stroke="#1e293b" stroke-width="6"/>
        <line x1="80" y1="3" x2="80" y2="47" stroke="#1e293b" stroke-width="3" stroke-dasharray="16 8 4 8"/>
        <line x1="2" y1="25" x2="98" y2="25" stroke="#1e293b" stroke-width="3" stroke-dasharray="16 8 4 8"/>
        <polygon points="20,15 20,35 50,43 50,7" fill="none" stroke="#1e293b" stroke-width="6"/>
      `;
    } else {
      // Third Angle (American): Circles on Left, Trapeze on Right
      // Small end of trapeze facing circles (left side of trapeze is small)
      symbolGroup.innerHTML = `
        <!-- Third Angle (American) -->
        <circle cx="20" cy="25" r="10" fill="none" stroke="#1e293b" stroke-width="6"/>
        <circle cx="20" cy="25" r="18" fill="none" stroke="#1e293b" stroke-width="6"/>
        <line x1="20" y1="3" x2="20" y2="47" stroke="#1e293b" stroke-width="3" stroke-dasharray="16 8 4 8"/>
        <line x1="2" y1="25" x2="98" y2="25" stroke="#1e293b" stroke-width="3" stroke-dasharray="16 8 4 8"/>
        <polygon points="50,15 50,35 80,43 80,7" fill="none" stroke="#1e293b" stroke-width="6"/>
      `;
    }
  };

  inputProjection.addEventListener('change', () => {
    updateProjectionSymbol(inputProjection.value);
  });

  // Initialize values
  updateField(inputTitle, txtTitle);
  updateField(inputDrawer, txtDrawer);
  updateField(inputChecker, txtChecker);
  updateField(inputApproved, txtApproved);
  updateField(inputDrawnDate, txtDrawnDate);
  updateField(inputCheckedDate, txtCheckedDate);
  updateField(inputApprovedDate, txtApprovedDate);
  
  if (txtDrawingNum) txtDrawingNum.textContent = "No. Gambar: " + inputDrawingNum.value.toUpperCase();
  if (txtScale) txtScale.textContent = inputScale.value;
  if (txtPaper) txtPaper.textContent = inputPaper.value;
  if (txtSheet) txtSheet.textContent = inputSheet.value;
  if (txtSheetTotal) txtSheetTotal.textContent = inputSheetTotal.value;
  updateProjectionSymbol(inputProjection.value);
  updateInstansiOverlay();

  // --- ZOOM INTERACTION & FORM LOCK LOGIC ---
  const a4Viewport = document.getElementById('a4-viewport');
  const btnZoomA4 = document.getElementById('btn-zoom-a4');
  const btnZoomEtiket = document.getElementById('btn-zoom-etiket');
  const formLockOverlay = document.getElementById('form-lock-overlay');
  const btnLockZoomTrigger = document.getElementById('btn-lock-zoom-trigger');
  const a4SheetImage = document.getElementById('a4-sheet-image');
  
  // Elements of the form to lock/unlock
  const formInputs = [
    inputInstansi, inputTitle, inputDrawer, inputChecker, 
    inputApproved, inputDrawnDate, inputCheckedDate, inputApprovedDate,
    inputScale, inputProjection, inputPaper, inputSheet, inputSheetTotal,
    inputDrawingNum,
    document.getElementById('input-logo'),
    document.getElementById('btn-reset-logo')
  ].filter(el => el !== null);

  const setFormLockedState = (locked) => {
    // Enable or disable form inputs
    formInputs.forEach(input => {
      input.disabled = locked;
    });

    if (locked) {
      if (formLockOverlay) formLockOverlay.classList.remove('hidden');
    } else {
      if (formLockOverlay) formLockOverlay.classList.add('hidden');
    }
  };

  const zoomToA4 = () => {
    if (a4Viewport) {
      a4Viewport.classList.remove('state-etiket');
      a4Viewport.classList.add('state-a4');
    }
    if (a4SheetImage) {
      a4SheetImage.src = 'Etiket dengan isi .svg';
    }
    if (btnZoomA4) btnZoomA4.classList.add('active');
    if (btnZoomEtiket) btnZoomEtiket.classList.remove('active');
    setFormLockedState(true);
  };

  const zoomToEtiket = () => {
    if (a4Viewport) {
      a4Viewport.classList.remove('state-a4');
      a4Viewport.classList.add('state-etiket');
    }
    if (a4SheetImage) {
      a4SheetImage.src = 'Etiket tanpa isi .svg';
    }
    if (btnZoomA4) btnZoomA4.classList.remove('active');
    if (btnZoomEtiket) btnZoomEtiket.classList.add('active');
    setFormLockedState(false);
    if (typeof window.completeModule === 'function') {
      window.completeModule('etiket');
    }
  };

  if (btnZoomA4) btnZoomA4.addEventListener('click', zoomToA4);
  if (btnZoomEtiket) btnZoomEtiket.addEventListener('click', zoomToEtiket);
  if (formLockOverlay) formLockOverlay.addEventListener('click', zoomToEtiket);
  if (btnLockZoomTrigger) btnLockZoomTrigger.addEventListener('click', (e) => {
    e.stopPropagation(); // Avoid double triggering of click on lock overlay
    zoomToEtiket();
  });

  // Start with form locked
  setFormLockedState(true);

  // --- LOGO UPLOAD & HANDLING ---
  const inputLogo = document.getElementById('input-logo');
  const etiketLogoImg = document.getElementById('etiket-logo-img');
  const btnResetLogo = document.getElementById('btn-reset-logo');
  const defaultLogoGroup = document.getElementById('etiket-logo-default');

  // Load saved logo from localStorage
  const savedLogo = localStorage.getItem('etiket-custom-logo');
  if (savedLogo && etiketLogoImg) {
    etiketLogoImg.setAttribute('href', savedLogo);
  }
  updateInstansiOverlay();

  if (inputLogo && etiketLogoImg) {
    inputLogo.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          etiketLogoImg.setAttribute('href', dataUrl);
          localStorage.setItem('etiket-custom-logo', dataUrl);
          updateInstansiOverlay();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (btnResetLogo && etiketLogoImg) {
    btnResetLogo.addEventListener('click', () => {
      etiketLogoImg.setAttribute('href', '');
      localStorage.removeItem('etiket-custom-logo');
      if (inputLogo) inputLogo.value = '';
      updateInstansiOverlay();
    });
  }


  // --- PRINT ETIKET FUNCTION ---
  const printBtn = document.getElementById('etiket-print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      const etiketSvg = document.getElementById('iso-etiket-svg');
      if (!etiketSvg) return;

      // Create printable page window
      const printWindow = window.open('', '_blank');
      const svgClone = etiketSvg.cloneNode(true);
      
      // Clear classes and styles to prevent transparent/absolute layout overrides
      svgClone.setAttribute('class', '');
      svgClone.id = 'print-etiket-svg';
      svgClone.removeAttribute('style');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <base href="${window.location.href}">
          <title>Cetak Etiket - ${inputTitle.value}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: #fff;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
            .container {
              width: 100%;
              max-width: 900px;
              text-align: center;
            }
            .header-info {
              margin-bottom: 20px;
              font-family: sans-serif;
              color: #333;
            }
            #print-area svg {
              width: 100%;
              height: auto;
              background: #ffffff !important;
              border: 1.2px solid #1e293b !important;
              box-shadow: none !important;
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header-info no-print">
              <h2>Hasil Cetak Kepala Gambar (Etiket Kustom)</h2>
              <p>Gunakan setelan cetak Lanskap (Landscape) dan atur skala cetak ke 100%.</p>
              <button onclick="window.print()" style="padding: 10px 20px; font-weight: bold; cursor: pointer;">Cetak Sekarang</button>
            </div>
            <div id="print-area">
              ${svgClone.outerHTML}
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    });
  }
});
