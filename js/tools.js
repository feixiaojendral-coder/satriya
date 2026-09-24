// --- PAPAN GAMBAR & SIMULATOR ALAT ---

window.resizeBoardCanvas = () => {}; // Global ref for app.js

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('drawing-canvas-element');
  const wrapper = document.getElementById('board-canvas-wrapper');
  if (!canvas || !wrapper) return;

  const ctx = canvas.getContext('2d');
  
  // State
  let drawHistory = [];
  let isDrawing = false;
  let startX = 0, startY = 0;
  let currentX = 0, currentY = 0;
  let drawMode = 'drag'; // 'drag' or 'draw'
  let isDemoRunning = false;
  let activePencil = 'hb'; // 'hb', '2b', '2h'
  let pencilSettings = {
    '2h': { width: 1, color: '#94a3b8', label: '2H (Tipis/Bantu)' },
    'hb': { width: 2, color: '#475569', label: 'HB (Sedang)' },
    '2b': { width: 3.5, color: '#0f172a', label: '2B (Tebal/Utama)' }
  };

  const toolData = {
    tsquare: {
      name: "Penggaris T-Square",
      usage: "Digunakan sebagai landasan utama untuk menggambar garis horizontal lurus di atas papan gambar secara paralel.",
      fact: "Geser secara vertikal pada tepi kiri meja untuk menggambar garis sejajar. Ini adalah rel dasar menggambar manual!"
    },
    'triangle-45': {
      name: "Segitiga 45°-45°",
      usage: "Digunakan untuk membentuk garis tegak lurus (90°) atau garis bersudut diagonal 45° dengan menyandarkannya di atas penggaris T-Square.",
      fact: "Segitiga siku sama kaki ini wajib digunakan berpasangan dengan segitiga 30°-60° untuk menggambar proyeksi."
    },
    'triangle-30-60': {
      name: "Segitiga 30°-60°",
      usage: "Digunakan untuk membentuk garis bersudut 30°, 60°, atau 90° dengan presisi tinggi.",
      fact: "Bentuk siku-siku sembarang ini sangat berguna dalam menggambar proyeksi isometrik (sudut 30°)."
    },
    compass: {
      name: "Jangka Gambar (Compass)",
      usage: "Digunakan untuk menggambar lingkaran sempurna atau busur lingkaran dengan jari-jari ukuran tertentu.",
      fact: "Kaki jarum ditancapkan sebagai titik pusat lingkaran, sementara kaki pensil diputar secara melingkar. Geser radius di panel kontrol!"
    },
    protractor: {
      name: "Busur Derajat (Protractor)",
      usage: "Digunakan untuk mengukur besar sudut objek gambar secara presisi dari skala 0° hingga 180°.",
      fact: "Sangat membantu untuk menggambar sudut-sudut non-istimewa yang tidak dapat dijangkau oleh penggaris segitiga berpasangan."
    },
    template: {
      name: "Mal Gambar & Sablon (Templates)",
      usage: "Digunakan sebagai cetakan instan untuk mempermudah menggambar lengkungan kurva bebas, bentuk lingkaran kecil, elips, serta huruf & angka standar.",
      fact: "Mempercepat penyelesaian detail etiket gambar atau simbol baut, roda gigi, dan teks keterangan agar seragam."
    }
  };

  // Resize canvas to match container
  window.resizeBoardCanvas = () => {
    const rect = wrapper.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    redrawCanvas();
  };

  window.addEventListener('resize', window.resizeBoardCanvas);

  // Redraw all elements
  const redrawCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw borders (margin kertas gambar A4)
    const leftMargin = 40; // 20mm
    const otherMargin = 10; // 5mm
    
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(leftMargin, otherMargin, canvas.width - leftMargin - otherMargin, canvas.height - 2 * otherMargin);

    // Draw drawing history (supports lines and circles)
    drawHistory.forEach(item => {
      ctx.beginPath();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.width;
      ctx.lineCap = 'round';
      if (item.type === 'circle') {
        ctx.arc(item.cx, item.cy, item.r, item.startAngle, item.endAngle);
      } else {
        ctx.moveTo(item.x1, item.y1);
        ctx.lineTo(item.x2, item.y2);
      }
      ctx.stroke();
    });

    // Draw active drawing line
    if (isDrawing) {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = pencilSettings[activePencil].color;
      ctx.lineWidth = pencilSettings[activePencil].width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  };

  // --- RULERS DATA ---
  const rulers = {
    tsquare: {
      el: document.getElementById('ruler-tsquare'),
      dragging: false,
      offsetY: 0,
      y: 200
    },
    triangle45: {
      el: document.getElementById('ruler-triangle-45'),
      dragging: false,
      offsetX: 0,
      offsetY: 0,
      x: 150,
      y: 80,
      rotation: 0
    },
    triangle3060: {
      el: document.getElementById('ruler-triangle-30-60'),
      dragging: false,
      offsetX: 0,
      offsetY: 0,
      x: 320,
      y: 120,
      rotation: 0
    },
    compass: {
      el: document.getElementById('ruler-compass'),
      dragging: false,
      offsetX: 0,
      offsetY: 0,
      x: 200,
      y: 100,
      rotation: 0,
      radius: 60
    },
    protractor: {
      el: document.getElementById('ruler-protractor'),
      dragging: false,
      offsetX: 0,
      offsetY: 0,
      x: 180,
      y: 160,
      rotation: 0
    },
    template: {
      el: document.getElementById('ruler-template'),
      dragging: false,
      offsetX: 0,
      offsetY: 0,
      x: 140,
      y: 120,
      rotation: 0
    }
  };

  const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;

  const getRulerSize = (ruler) => ({
    width: ruler.el.offsetWidth || Number.parseFloat(ruler.el.style.width) || 0,
    height: ruler.el.offsetHeight || Number.parseFloat(ruler.el.style.height) || 0
  });

  const getRotatedBounds = (ruler) => {
    const { width, height } = getRulerSize(ruler);
    const radians = (ruler.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const corners = [
      { x: 0, y: 0 },
      { x: width * cos, y: width * sin },
      { x: -height * sin, y: height * cos },
      { x: width * cos - height * sin, y: width * sin + height * cos }
    ];

    return {
      minX: Math.min(...corners.map(point => point.x)),
      maxX: Math.max(...corners.map(point => point.x)),
      minY: Math.min(...corners.map(point => point.y)),
      maxY: Math.max(...corners.map(point => point.y))
    };
  };

  const clampBetween = (value, min, max) => {
    if (max < min) return (min + max) / 2;
    return Math.max(min, Math.min(max, value));
  };

  const clampRulerPosition = (ruler, x, y) => {
    const bounds = getRotatedBounds(ruler);
    const padding = 6;
    const minX = padding - bounds.minX;
    const maxX = wrapper.clientWidth - padding - bounds.maxX;
    const minY = padding - bounds.minY;
    const maxY = wrapper.clientHeight - padding - bounds.maxY;

    return {
      x: clampBetween(x, minX, maxX),
      y: clampBetween(y, minY, maxY)
    };
  };

  const applyRulerTransform = (key) => {
    const ruler = rulers[key];
    if (!ruler?.el) return;

    ruler.el.style.transform = `translate(${ruler.x}px, ${ruler.y}px) rotate(${ruler.rotation}deg)`;
  };

  const rulerPointToBoard = (ruler, localX, localY) => {
    const radians = (ruler.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    return {
      x: ruler.x + localX * cos - localY * sin,
      y: ruler.y + localX * sin + localY * cos
    };
  };

  // Make T-Square draggable vertically
  const initTSquareDrag = () => {
    const tsq = rulers.tsquare;
    if (!tsq.el) return;

    tsq.el.addEventListener('pointerdown', (e) => {
      if (isDemoRunning) return;
      if (drawMode !== 'drag') return;
      if (e.target.classList.contains('rotate-handle')) return;
      
      tsq.dragging = true;
      tsq.el.setPointerCapture(e.pointerId);
      const rect = tsq.el.getBoundingClientRect();
      tsq.offsetY = e.clientY - rect.top;
      e.stopPropagation();
    });

    tsq.el.addEventListener('pointermove', (e) => {
      if (!tsq.dragging) return;
      const wrapperRect = wrapper.getBoundingClientRect();
      let newY = e.clientY - wrapperRect.top - tsq.offsetY;
      
      newY = Math.max(0, Math.min(canvas.height - 40, newY));
      tsq.y = newY;
      tsq.el.style.transform = `translate(0px, ${newY}px)`;
    });

    const stopDrag = (e) => {
      if (tsq.dragging) {
        tsq.dragging = false;
        try { tsq.el.releasePointerCapture(e.pointerId); } catch(err) {}
      }
    };
    tsq.el.addEventListener('pointerup', stopDrag);
    tsq.el.addEventListener('pointercancel', stopDrag);
  };

  // Make Triangles, Compass, and Protractor Draggable & Rotatable
  const initDraggableRuler = (key, triangleHeight = null) => {
    const tri = rulers[key];
    if (!tri.el) return;

    const handle = tri.el.querySelector('.rotate-handle');

    tri.el.addEventListener('pointerdown', (e) => {
      if (isDemoRunning) return;
      if (drawMode !== 'drag') return;
      if (e.target.closest('.rotate-handle')) return;

      tri.dragging = true;
      tri.activePointerId = e.pointerId;
      tri.pointerStartX = e.clientX;
      tri.pointerStartY = e.clientY;
      tri.positionStartX = tri.x;
      tri.positionStartY = tri.y;
      tri.el.setPointerCapture(e.pointerId);
      tri.el.classList.add('dragging');
      e.preventDefault();
      e.stopPropagation();
    });

    tri.el.addEventListener('pointermove', (e) => {
      if (!tri.dragging || e.pointerId !== tri.activePointerId) return;

      let newX = tri.positionStartX + (e.clientX - tri.pointerStartX);
      let newY = tri.positionStartY + (e.clientY - tri.pointerStartY);

      // Snapping to T-Square top edge (only for triangles)
      if (triangleHeight !== null && normalizeAngle(tri.rotation) === 0) {
        const bottomY = newY + triangleHeight;
        const tsqTopY = rulers.tsquare.y;

        if (Math.abs(bottomY - tsqTopY) < 15) {
          newY = tsqTopY - triangleHeight;
        }
      }

      const clamped = clampRulerPosition(tri, newX, newY);
      tri.x = clamped.x;
      tri.y = clamped.y;

      if (key === 'compass') {
        updateCompassTransform();
      } else {
        applyRulerTransform(key);
      }
    });

    const stopDrag = (e) => {
      if (tri.dragging && e.pointerId === tri.activePointerId) {
        tri.dragging = false;
        tri.activePointerId = null;
        tri.el.classList.remove('dragging');
        try { tri.el.releasePointerCapture(e.pointerId); } catch(err) {}
      }
    };
    tri.el.addEventListener('pointerup', stopDrag);
    tri.el.addEventListener('pointercancel', stopDrag);

    if (handle) {
      let rotateGesture = null;

      handle.addEventListener('pointerdown', (e) => {
        if (isDemoRunning || drawMode !== 'drag') return;
        rotateGesture = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
        try { handle.setPointerCapture(e.pointerId); } catch(err) {}
        e.stopPropagation();
        e.preventDefault();
      });

      handle.addEventListener('pointerup', (e) => {
        if (!rotateGesture || rotateGesture.pointerId !== e.pointerId) return;

        const movement = Math.hypot(e.clientX - rotateGesture.x, e.clientY - rotateGesture.y);
        rotateGesture = null;
        try { handle.releasePointerCapture(e.pointerId); } catch(err) {}

        if (movement <= 8) {
          const rotationStep = key === 'triangle3060' ? 30 : 45;
          const snappedRotation = Math.round(normalizeAngle(tri.rotation) / rotationStep) * rotationStep;
          tri.rotation = normalizeAngle(snappedRotation + rotationStep);

          const clamped = clampRulerPosition(tri, tri.x, tri.y);
          tri.x = clamped.x;
          tri.y = clamped.y;

          if (key === 'compass') {
            updateCompassTransform();
          } else {
            applyRulerTransform(key);
          }
        }

        e.stopPropagation();
        e.preventDefault();
      });

      handle.addEventListener('pointercancel', (e) => {
        rotateGesture = null;
        try { handle.releasePointerCapture(e.pointerId); } catch(err) {}
      });
    }
  };

  // Update Compass SVG width (stretching legs)
  const updateCompassVisual = (radius) => {
    const dx = radius / 2;
    const compEl = rulers.compass.el;
    if (!compEl) return;
    const svg = compEl.querySelector('svg');
    if (!svg) return;
    
    const needleLeg = svg.querySelector('.compass-needle-leg');
    const needleTip = svg.querySelector('.compass-needle-tip');
    const pencilLeg = svg.querySelector('.compass-pencil-leg');
    const pencilHolder = svg.querySelector('.compass-pencil-holder');
    const pencilTip = svg.querySelector('.compass-pencil-tip');
    
    const needleIndicator = svg.querySelector('.compass-needle-indicator');
    const pencilIndicator = svg.querySelector('.compass-pencil-indicator');
    
    const nx = 60 - dx - 3;
    const px = 60 + dx;
    
    if (needleLeg) needleLeg.setAttribute('x2', 60 - dx);
    if (needleTip) {
      needleTip.setAttribute('x1', 60 - dx);
      needleTip.setAttribute('x2', nx);
    }
    if (pencilLeg) pencilLeg.setAttribute('x2', 60 + dx);
    if (pencilHolder) pencilHolder.setAttribute('x', px - 4);
    if (pencilTip) {
      pencilTip.setAttribute('points', `${px - 2},107 ${px + 2},107 ${px},115`);
    }
    if (needleIndicator) needleIndicator.setAttribute('cx', nx);
    if (pencilIndicator) pencilIndicator.setAttribute('cx', px);
  };

  const updateCompassTransform = () => {
    const comp = rulers.compass;
    if (!comp.el) return;
    const dx = comp.radius / 2;
    const nx = 60 - dx - 3;
    
    comp.el.style.transformOrigin = `${nx}px 115px`;
    comp.el.style.transform = `translate(${comp.x}px, ${comp.y}px) rotate(${comp.rotation}deg)`;
  };

  // Compass draw animations
  const runCompassDrawAnimation = (drawArcOnly = false) => {
    const comp = rulers.compass;
    if (!comp.el) return;
    
    const btnCircle = document.getElementById('btn-compass-draw');
    const btnArc = document.getElementById('btn-compass-draw-arc');
    if (btnCircle) btnCircle.disabled = true;
    if (btnArc) btnArc.disabled = true;
    
    const startAngleDeg = comp.rotation;
    const targetSweep = drawArcOnly ? 180 : 360;
    
    const duration = 1200; // ms
    const startTime = performance.now();
    
    const cx = comp.x + (60 - comp.radius/2 - 3);
    const cy = comp.y + 115;
    const r = comp.radius;
    
    const startAngleRad = startAngleDeg * Math.PI / 180;
    
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Rotate visual compass
      comp.rotation = startAngleDeg + progress * targetSweep;
      updateCompassTransform();
      
      const currentAngleRad = startAngleRad + (progress * targetSweep * Math.PI / 180);
      
      // Render
      redrawCanvas();
      
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngleRad, currentAngleRad);
      ctx.strokeStyle = pencilSettings[activePencil].color;
      ctx.lineWidth = pencilSettings[activePencil].width;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Save to draw history
        drawHistory.push({
          type: 'circle',
          cx: cx,
          cy: cy,
          r: r,
          startAngle: startAngleRad,
          endAngle: currentAngleRad,
          color: pencilSettings[activePencil].color,
          width: pencilSettings[activePencil].width
        });
        
        if (btnCircle) btnCircle.disabled = false;
        if (btnArc) btnArc.disabled = false;
        
        comp.rotation = comp.rotation % 360;
        updateCompassTransform();
        redrawCanvas();
      }
    };
    
    requestAnimationFrame(animate);
  };

  // --- DRAWING WITH SNAPPING LOGIC ---
  const getSnappedCoordinates = (rawX, rawY) => {
    let bestX = rawX;
    let bestY = rawY;
    let minDistance = Infinity;

    // Snapping to T-Square top edge
    const tsqDist = Math.abs(rawY - rulers.tsquare.y);
    if (tsqDist < 20) {
      minDistance = tsqDist;
      bestY = rulers.tsquare.y;
    }

    // Snapping to 45 Triangle
    const tri45 = rulers.triangle45;
    if (tri45.el && tri45.el.style.display !== 'none') {
      if (tri45.rotation === 0) {
        const leftDist = Math.abs(rawX - tri45.x);
        if (leftDist < 20 && rawY >= tri45.y && rawY <= tri45.y + 200) {
          if (leftDist < minDistance) {
            minDistance = leftDist;
            bestX = tri45.x;
            bestY = rawY;
          }
        }
        const bottomDist = Math.abs(rawY - (tri45.y + 200));
        if (bottomDist < 20 && rawX >= tri45.x && rawX <= tri45.x + 200) {
          if (bottomDist < minDistance) {
            minDistance = bottomDist;
            bestY = tri45.y + 200;
            bestX = rawX;
          }
        }
        const targetY = rawX - tri45.x + tri45.y;
        const hypDist = Math.abs(rawY - targetY) * 0.707;
        if (hypDist < 20 && rawX >= tri45.x && rawX <= tri45.x + 200) {
          if (hypDist < minDistance) {
            minDistance = hypDist;
            bestY = targetY;
            bestX = rawX;
          }
        }
      }
    }

    // Snapping to 30-60 Triangle
    const tri3060 = rulers.triangle3060;
    if (tri3060.el && tri3060.el.style.display !== 'none') {
      if (tri3060.rotation === 0) {
        const leftDist = Math.abs(rawX - tri3060.x);
        if (leftDist < 20 && rawY >= tri3060.y && rawY <= tri3060.y + 138.56) {
          if (leftDist < minDistance) {
            minDistance = leftDist;
            bestX = tri3060.x;
            bestY = rawY;
          }
        }
        const bottomDist = Math.abs(rawY - (tri3060.y + 138.56));
        if (bottomDist < 20 && rawX >= tri3060.x && rawX <= tri3060.x + 240) {
          if (bottomDist < minDistance) {
            minDistance = bottomDist;
            bestY = tri3060.y + 138.56;
            bestX = rawX;
          }
        }
      }
    }

    return { x: bestX, y: bestY };
  };

  // Canvas events
  canvas.addEventListener('pointerdown', (e) => {
    if (isDemoRunning) return;
    if (drawMode !== 'draw') return;
    
    isDrawing = true;
    canvas.setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const snapped = getSnappedCoordinates(rawX, rawY);
    startX = snapped.x;
    startY = snapped.y;
    currentX = snapped.x;
    currentY = snapped.y;
    
    redrawCanvas();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const snapped = getSnappedCoordinates(rawX, rawY);
    
    if (e.shiftKey) {
      const dx = snapped.x - startX;
      const dy = snapped.y - startY;
      if (Math.abs(dx) > Math.abs(dy)) {
        currentX = snapped.x;
        currentY = startY;
      } else {
        currentX = startX;
        currentY = snapped.y;
      }
    } else {
      currentX = snapped.x;
      currentY = snapped.y;
    }

    redrawCanvas();
  });

  const stopDrawingHandler = (e) => {
    if (isDrawing) {
      isDrawing = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch(err) {}

      const dx = currentX - startX;
      const dy = currentY - startY;
      if (Math.sqrt(dx*dx + dy*dy) > 2) {
        drawHistory.push({
          type: 'line',
          x1: startX,
          y1: startY,
          x2: currentX,
          y2: currentY,
          color: pencilSettings[activePencil].color,
          width: pencilSettings[activePencil].width
        });
        if (typeof window.completeModule === 'function') {
          window.completeModule('tools');
        }
      }
      redrawCanvas();
    }
  };

  canvas.addEventListener('pointerup', stopDrawingHandler);
  canvas.addEventListener('pointercancel', stopDrawingHandler);

  // --- INTERACTION & DESCRIPTION CONTROL ---
  const toolCards = document.querySelectorAll('.tool-item-card');
  toolCards.forEach(card => {
    card.addEventListener('click', () => {
      if (isDemoRunning) return;
      const toolType = card.getAttribute('data-tool');
      
      // Handle overlay visibility toggle
      let isNowVisible = false;
      
      if (toolType === 'tsquare') {
        const isVisible = rulers.tsquare.el.style.display !== 'none';
        rulers.tsquare.el.style.display = isVisible ? 'none' : 'block';
        isNowVisible = !isVisible;
      } else if (toolType === 'triangle-45') {
        const isVisible = rulers.triangle45.el.style.display !== 'none';
        rulers.triangle45.el.style.display = isVisible ? 'none' : 'block';
        isNowVisible = !isVisible;
      } else if (toolType === 'triangle-30-60') {
        const isVisible = rulers.triangle3060.el.style.display !== 'none';
        rulers.triangle3060.el.style.display = isVisible ? 'none' : 'block';
        isNowVisible = !isVisible;
      } else if (toolType === 'compass') {
        const isVisible = rulers.compass.el.style.display !== 'none';
        rulers.compass.el.style.display = isVisible ? 'none' : 'block';
        isNowVisible = !isVisible;
        
        // Show/hide radius controls
        const compassCtrl = document.getElementById('compass-controls-card');
        if (compassCtrl) {
          compassCtrl.style.display = isNowVisible ? 'flex' : 'none';
        }
      } else if (toolType === 'protractor') {
        const isVisible = rulers.protractor.el.style.display !== 'none';
        rulers.protractor.el.style.display = isVisible ? 'none' : 'block';
        isNowVisible = !isVisible;
      } else if (toolType === 'template') {
        const isVisible = rulers.template.el.style.display !== 'none';
        rulers.template.el.style.display = isVisible ? 'none' : 'block';
        isNowVisible = !isVisible;
      }
      
      // Set active highlight on shelf card
      if (isNowVisible) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
      
      // Update dynamic description card
      const info = toolData[toolType];
      if (info) {
        const descName = document.getElementById('desc-tool-name');
        const descUsage = document.getElementById('desc-tool-usage');
        const descFact = document.getElementById('desc-tool-fact');
        
        if (descName) descName.textContent = info.name;
        if (descUsage) descUsage.textContent = info.usage;
        if (descFact) descFact.textContent = info.fact;
      }
    });
  });

  // Jangka Compass Radius Controls
  const sliderRadius = document.getElementById('slider-compass-radius');
  const valRadius = document.getElementById('val-compass-radius');
  if (sliderRadius && valRadius) {
    sliderRadius.addEventListener('input', () => {
      if (isDemoRunning) return;
      const radius = parseInt(sliderRadius.value);
      rulers.compass.radius = radius;
      valRadius.textContent = `${radius} px`;
      updateCompassVisual(radius);
      updateCompassTransform();
    });
  }

  // Jangka Draw Circle Button
  const btnCompassDraw = document.getElementById('btn-compass-draw');
  if (btnCompassDraw) {
    btnCompassDraw.addEventListener('click', () => {
      if (isDemoRunning) return;
      runCompassDrawAnimation(false); // 360 deg
    });
  }

  // Jangka Draw Arc Button
  const btnCompassDrawArc = document.getElementById('btn-compass-draw-arc');
  if (btnCompassDrawArc) {
    btnCompassDrawArc.addEventListener('click', () => {
      if (isDemoRunning) return;
      runCompassDrawAnimation(true); // 180 deg
    });
  }



  // Mode Selectors (Drag vs Draw)
  const btnDrag = document.getElementById('tool-mode-drag');
  const btnDraw = document.getElementById('tool-mode-draw');

  if (btnDrag && btnDraw) {
    btnDrag.addEventListener('click', () => {
      if (isDemoRunning) return;
      btnDrag.classList.add('active');
      btnDraw.classList.remove('active');
      drawMode = 'drag';
      canvas.style.cursor = 'crosshair';
    });

    btnDraw.addEventListener('click', () => {
      if (isDemoRunning) return;
      btnDraw.classList.add('active');
      btnDrag.classList.remove('active');
      drawMode = 'draw';
      canvas.style.cursor = 'pencil';
    });
  }

  // Grid Toggler
  const btnGrid = document.getElementById('board-toggle-grid');
  const gridGuide = document.getElementById('board-grid-guide');
  if (btnGrid && gridGuide) {
    btnGrid.addEventListener('click', () => {
      if (isDemoRunning) return;
      gridGuide.classList.toggle('visible');
      btnGrid.classList.toggle('active');
    });
  }

  // Clear Board
  const btnClear = document.getElementById('board-btn-clear');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (isDemoRunning) return;
      if (confirm('Apakah Anda yakin ingin menghapus semua hasil gambar?')) {
        drawHistory = [];
        redrawCanvas();
      }
    });
  }

  // --- AUTOMATED DEMO RUNNER (NEW) ---
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const captionEl = document.getElementById('demo-caption-overlay');

  const showCaption = (text) => {
    if (captionEl) {
      captionEl.textContent = text;
      captionEl.classList.add('active');
    }
  };

  const hideCaption = () => {
    if (captionEl) {
      captionEl.classList.remove('active');
    }
  };

  const animateMoveRuler = (key, targetX, targetY, targetRot, duration = 800) => {
    return new Promise(resolve => {
      const tri = rulers[key];
      const startX = tri.x !== undefined ? tri.x : 0;
      const startY = tri.y !== undefined ? tri.y : 0;
      const startYReal = key === 'tsquare' ? tri.y : startY;
      const startRot = tri.rotation !== undefined ? tri.rotation : 0;
      
      const startTime = performance.now();
      
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress * (2 - progress); // Ease out
        
        if (key === 'tsquare') {
          tri.y = startYReal + (targetY - startYReal) * ease;
          tri.el.style.transform = `translate(0px, ${tri.y}px)`;
        } else {
          tri.x = startX + (targetX - startX) * ease;
          tri.y = startYReal + (targetY - startYReal) * ease;
          tri.rotation = startRot + (targetRot - startRot) * ease;
          
          if (key === 'compass') {
            updateCompassTransform();
          } else {
            applyRulerTransform(key);
          }
        }
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(step);
    });
  };

  const animateDemoLine = (from, to, duration = 700) => {
    return new Promise(resolve => {
      const startedAt = performance.now();

      const step = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        isDrawing = true;
        startX = from.x;
        startY = from.y;
        currentX = from.x + (to.x - from.x) * eased;
        currentY = from.y + (to.y - from.y) * eased;
        redrawCanvas();

        if (progress < 1) {
          requestAnimationFrame(step);
          return;
        }

        isDrawing = false;
        drawHistory.push({
          type: 'line',
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          color: pencilSettings[activePencil].color,
          width: pencilSettings[activePencil].width
        });
        redrawCanvas();
        resolve();
      };

      requestAnimationFrame(step);
    });
  };

  const triangleDemoConfigs = {
    '15': {
      title: 'Sudut 15°',
      note: 'Selisih sudut 45° dan 30° menghasilkan garis 15°.',
      supportRotation: -60,
      movingRotation: -30,
      showTSquare: false,
      line: { start: [0, 0], end: [200, 200] },
      intro: 'Gabungkan 45° − 30° untuk memperoleh sudut 15°.',
      supportStep: 'Putar segitiga 30°–60° sebagai penggaris penyangga miring.',
      alignStep: 'Sandarkan sisi bawah segitiga 45° tepat pada sisi miring penggaris penyangga.',
      drawStep: 'Tarik pada sisi miring segitiga 45°—terbentuk garis 15°.',
      resultStep: 'Tarik garis kedua—hasilnya sejajar dan tetap bersudut 15°.',
      finish: 'Sudut 15° terbentuk dari selisih 45° dan 30°. Sekarang coba susun ulang sendiri.'
    },
    '45-parallel': {
      title: 'Garis sejajar 45°',
      note: 'Satu segitiga menjadi rel; segitiga 45° digeser untuk membuat garis-garis sejajar.',
      supportRotation: -30,
      movingRotation: 0,
      showTSquare: true,
      line: { start: [0, 0], end: [200, 200] },
      intro: 'Gunakan segitiga 30°–60° sebagai rel untuk menggeser segitiga 45°.',
      supportStep: 'Letakkan sisi miring segitiga 30°–60° mendatar sebagai penggaris penyangga.',
      alignStep: 'Tempelkan sisi bawah segitiga 45° pada rel tanpa celah.',
      drawStep: 'Tarik garis pertama di sisi miring segitiga 45°.',
      resultStep: 'Tarik garis kedua—kedua garis 45° sejajar karena sudut penggaris tidak berubah.',
      finish: 'Kunci garis sejajar: tahan penggaris penyangga, lalu geser hanya segitiga 45°.'
    },
    '75': {
      title: 'Sudut 75°',
      note: 'Penjumlahan sudut 45° dan 30° menghasilkan garis 75°.',
      supportRotation: 0,
      movingRotation: 30,
      showTSquare: true,
      line: { start: [0, 0], end: [200, 200] },
      intro: 'Gabungkan 45° + 30° untuk memperoleh sudut 75°.',
      supportStep: 'Letakkan segitiga 30°–60° di atas T-Square sebagai penggaris penyangga.',
      alignStep: 'Sandarkan sisi bawah segitiga 45° pada sisi miring 30° penggaris penyangga.',
      drawStep: 'Tarik pada sisi miring segitiga 45°—terbentuk garis 75°.',
      resultStep: 'Tarik garis kedua—hasilnya sejajar dan tetap bersudut 75°.',
      finish: 'Sudut 75° terbentuk dari penjumlahan 45° dan 30°. Coba ulangi tanpa panduan.'
    },
    '90': {
      title: 'Garis tegak lurus 90°',
      note: 'Segitiga pertama menjadi rel; sisi siku segitiga kedua menghasilkan garis tegak lurus.',
      supportRotation: -30,
      movingRotation: 0,
      showTSquare: true,
      line: { start: [0, 200], end: [0, 0] },
      intro: 'Gunakan satu segitiga sebagai rel dan sisi siku segitiga 45° sebagai pembentuk 90°.',
      supportStep: 'Atur sisi miring segitiga 30°–60° mendatar sebagai penggaris penyangga.',
      alignStep: 'Rapatkan sisi bawah segitiga 45° pada rel, lalu tahan penggaris penyangga.',
      drawStep: 'Tarik garis pada sisi tegak segitiga 45° untuk membentuk sudut 90°.',
      resultStep: 'Geser dan tarik lagi—terbentuk dua garis vertikal yang sejajar dan tegak lurus rel.',
      finish: 'Untuk garis 90° yang konsisten, tahan rel dan geser hanya segitiga yang digunakan menggambar.'
    }
  };

  const rotateDemoPoint = (x, y, rotation) => {
    const radians = rotation * Math.PI / 180;
    return {
      x: x * Math.cos(radians) - y * Math.sin(radians),
      y: x * Math.sin(radians) + y * Math.cos(radians)
    };
  };

  const getDemoBounds = (x, y, width, height, rotation) => {
    const corners = [
      rotateDemoPoint(0, 0, rotation),
      rotateDemoPoint(width, 0, rotation),
      rotateDemoPoint(0, height, rotation),
      rotateDemoPoint(width, height, rotation)
    ];

    return {
      minX: x + Math.min(...corners.map(point => point.x)),
      maxX: x + Math.max(...corners.map(point => point.x)),
      minY: y + Math.min(...corners.map(point => point.y)),
      maxY: y + Math.max(...corners.map(point => point.y))
    };
  };

  const planTriangleDemo = (config) => {
    const supportRatio = 0.22;
    const slideDistance = 40;
    const anchor = {
      x: wrapper.clientWidth * 0.4,
      y: wrapper.clientHeight * 0.64
    };
    const supportContact = rotateDemoPoint(
      240 * supportRatio,
      138.56 * supportRatio,
      config.supportRotation
    );
    const movingBaseLeft = rotateDemoPoint(0, 200, config.movingRotation);
    const slide = rotateDemoPoint(slideDistance, 0, config.movingRotation);
    const support = {
      x: anchor.x - supportContact.x,
      y: anchor.y - supportContact.y
    };
    const moving = {
      x: anchor.x - movingBaseLeft.x,
      y: anchor.y - movingBaseLeft.y
    };

    const bounds = [
      getDemoBounds(support.x, support.y, 240, 138.56, config.supportRotation),
      getDemoBounds(moving.x, moving.y, 200, 200, config.movingRotation),
      getDemoBounds(moving.x + slide.x, moving.y + slide.y, 200, 200, config.movingRotation)
    ];
    const padding = 12;
    const combined = {
      minX: Math.min(...bounds.map(item => item.minX)),
      maxX: Math.max(...bounds.map(item => item.maxX)),
      minY: Math.min(...bounds.map(item => item.minY)),
      maxY: Math.max(...bounds.map(item => item.maxY))
    };
    let shiftX = 0;
    let shiftY = 0;

    if (combined.minX < padding) shiftX = padding - combined.minX;
    if (combined.maxX + shiftX > wrapper.clientWidth - padding) {
      shiftX += wrapper.clientWidth - padding - (combined.maxX + shiftX);
    }
    if (combined.minY < padding) shiftY = padding - combined.minY;
    if (combined.maxY + shiftY > wrapper.clientHeight - padding) {
      shiftY += wrapper.clientHeight - padding - (combined.maxY + shiftY);
    }

    return {
      supportX: support.x + shiftX,
      supportY: support.y + shiftY,
      movingX: moving.x + shiftX,
      movingY: moving.y + shiftY,
      slideX: slide.x,
      slideY: slide.y,
      tSquareY: (
        config.supportRotation === 0
          ? support.y + 138.56
          : support.y
      ) + shiftY
    };
  };

  const triangleComboButtons = [...document.querySelectorAll('.triangle-combo-btn')];
  const triangleDemoNote = document.getElementById('triangle-demo-note');
  let selectedTriangleDemo = triangleComboButtons.find(button => button.classList.contains('active'))?.dataset.triangleDemo || '15';

  const selectTriangleDemo = (demoKey) => {
    const config = triangleDemoConfigs[demoKey];
    if (!config || isDemoRunning) return;

    selectedTriangleDemo = demoKey;
    triangleComboButtons.forEach(button => {
      const isSelected = button.dataset.triangleDemo === demoKey;
      button.classList.toggle('active', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });
    if (triangleDemoNote) triangleDemoNote.textContent = config.note;
  };

  triangleComboButtons.forEach(button => {
    button.addEventListener('click', () => selectTriangleDemo(button.dataset.triangleDemo));
  });

  const runTrianglesDemo = async () => {
    if (isDemoRunning) return;
    const config = triangleDemoConfigs[selectedTriangleDemo];
    if (!config) return;

    isDemoRunning = true;
    const demoControls = [
      document.getElementById('btn-demo-triangles'),
      document.getElementById('btn-demo-protractor'),
      ...triangleComboButtons
    ].filter(Boolean);
    demoControls.forEach(control => { control.disabled = true; });

    try {
      drawHistory = [];
      redrawCanvas();

      rulers.tsquare.el.style.display = config.showTSquare ? 'block' : 'none';
      rulers.triangle45.el.style.display = 'block';
      rulers.triangle3060.el.style.display = 'block';
      rulers.compass.el.style.display = 'none';
      rulers.protractor.el.style.display = 'none';
      rulers.template.el.style.display = 'none';

      const compControls = document.getElementById('compass-controls-card');
      if (compControls) compControls.style.display = 'none';

      toolCards.forEach(card => {
        const tool = card.getAttribute('data-tool');
        card.classList.toggle('active', [
          ...(config.showTSquare ? ['tsquare'] : []),
          'triangle-45',
          'triangle-30-60'
        ].includes(tool));
      });

      const layout = planTriangleDemo(config);

      showCaption(`Langkah 1 · ${config.title}: ${config.intro}`);
      if (config.showTSquare) {
        await animateMoveRuler('tsquare', 0, layout.tSquareY, 0, 650);
      }
      await sleep(500);

      showCaption(`Langkah 2: ${config.supportStep}`);
      await animateMoveRuler(
        'triangle3060',
        layout.supportX,
        layout.supportY,
        config.supportRotation,
        750
      );
      await sleep(600);

      showCaption(`Langkah 3: ${config.alignStep}`);
      await animateMoveRuler(
        'triangle45',
        layout.movingX,
        layout.movingY,
        config.movingRotation,
        850
      );
      await sleep(650);

      showCaption(`Langkah 4: ${config.drawStep}`);
      let lineStart = rulerPointToBoard(rulers.triangle45, ...config.line.start);
      let lineEnd = rulerPointToBoard(rulers.triangle45, ...config.line.end);
      await animateDemoLine(lineStart, lineEnd, 750);
      await sleep(600);

      showCaption('Langkah 5: Tahan penggaris penyangga, lalu geser segitiga 45° tanpa memutarnya.');
      await animateMoveRuler(
        'triangle45',
        layout.movingX + layout.slideX,
        layout.movingY + layout.slideY,
        config.movingRotation,
        750
      );
      await sleep(600);

      showCaption(`Langkah 6: ${config.resultStep}`);
      lineStart = rulerPointToBoard(rulers.triangle45, ...config.line.start);
      lineEnd = rulerPointToBoard(rulers.triangle45, ...config.line.end);
      await animateDemoLine(lineStart, lineEnd, 750);
      await sleep(750);

      showCaption(`Selesai! ${config.finish}`);
      await sleep(1800);
    } catch (error) {
      console.error('Demo kombinasi segitiga gagal dijalankan', error);
      isDrawing = false;
      redrawCanvas();
      showCaption('Demo terhenti. Silakan jalankan kembali.');
      await sleep(1200);
    } finally {
      isDrawing = false;
      drawMode = 'drag';
      if (btnDrag && btnDraw) {
        btnDrag.classList.add('active');
        btnDraw.classList.remove('active');
      }
      demoControls.forEach(control => { control.disabled = false; });
      hideCaption();
      isDemoRunning = false;
    }
  };

  const runProtractorDemo = async () => {
    if (isDemoRunning) return;
    isDemoRunning = true;

    // Clear canvas
    drawHistory = [];
    redrawCanvas();

    // Setup visibilities
    rulers.tsquare.el.style.display = 'block';
    rulers.protractor.el.style.display = 'block';
    rulers.triangle45.el.style.display = 'none';
    rulers.triangle3060.el.style.display = 'none';
    rulers.compass.el.style.display = 'none';
    rulers.template.el.style.display = 'none';
    const compControls = document.getElementById('compass-controls-card');
    if (compControls) compControls.style.display = 'none';

    toolCards.forEach(c => {
      const t = c.getAttribute('data-tool');
      if (t === 'tsquare' || t === 'protractor') c.classList.add('active');
      else c.classList.remove('active');
    });

    // Step 1: Slide T-Square & draw base horizontal line
    showCaption("Langkah 1: Posisikan penggaris T-Square dan buat garis dasar horizontal.");
    await animateMoveRuler('tsquare', 0, 180, 0, 800);
    await sleep(800);
    
    let lx = 60;
    while(lx <= 280) {
      drawHistory.push({ type: 'line', x1: lx, y1: 180, x2: lx + 10, y2: 180, color: '#475569', width: 2 });
      redrawCanvas();
      lx += 10;
      await sleep(25);
    }
    await sleep(1500);

    // Step 2: Slide Protractor center to (170, 180)
    // Protractor center is at (100, 100) local.
    // So if center is at (170, 180), then protractor.x = 70, protractor.y = 80.
    showCaption("Langkah 2: Tempatkan pusat busur derajat tepat di ujung/titik sudut garis dasar.");
    await animateMoveRuler('protractor', 70, 80, 0, 1000);
    await sleep(1800);

    // Step 3: Highlight target angle (60 deg)
    showCaption("Langkah 3: Tentukan titik sudut yang diinginkan pada busur (contoh: 60°/120°).");
    drawHistory.push({ type: 'line', x1: 214, y1: 102, x2: 216, y2: 102, color: 'var(--color-orange)', width: 4 });
    redrawCanvas();
    await sleep(2000);

    // Step 4: Draw line from center to marked point
    showCaption("Langkah 4: Hubungkan titik pusat dengan titik sudut untuk membuat garis bersudut 60°.");
    const steps = 15;
    const startPt = { x: 170, y: 180 };
    const endPt = { x: 215, y: 102 };
    for (let i = 1; i <= steps; i++) {
      const px = startPt.x + (endPt.x - startPt.x) * (i / steps);
      const py = startPt.y + (endPt.y - startPt.y) * (i / steps);
      const prevX = startPt.x + (endPt.x - startPt.x) * ((i-1) / steps);
      const prevY = startPt.y + (endPt.y - startPt.y) * ((i-1) / steps);
      drawHistory.push({ type: 'line', x1: prevX, y1: prevY, x2: px, y2: py, color: '#475569', width: 2 });
      redrawCanvas();
      await sleep(35);
    }
    await sleep(1500);

    // Step 5: Hide protractor
    showCaption("Selesai! Garis bersudut 60° berhasil dibentuk secara akurat.");
    rulers.protractor.el.style.display = 'none';
    const protractorCard = document.querySelector('.tool-item-card[data-tool="protractor"]');
    if (protractorCard) protractorCard.classList.remove('active');
    await sleep(2000);

    hideCaption();
    isDemoRunning = false;
  };

  // Bind demo buttons
  const btnDemoTri = document.getElementById('btn-demo-triangles');
  if (btnDemoTri) {
    btnDemoTri.addEventListener('click', runTrianglesDemo);
  }

  const btnDemoProt = document.getElementById('btn-demo-protractor');
  if (btnDemoProt) {
    btnDemoProt.addEventListener('click', runProtractorDemo);
  }

  // Initialize all drag listeners
  initTSquareDrag();
  initDraggableRuler('triangle45', 200);
  initDraggableRuler('triangle3060', 138.56);
  initDraggableRuler('compass');
  initDraggableRuler('protractor');
  initDraggableRuler('template');

  // Trigger initial updates
  updateCompassVisual(60);
  updateCompassTransform();
  
  // Set T-Square default active styling
  const tSquareCard = document.querySelector('.tool-item-card[data-tool="tsquare"]');
  if (tSquareCard) tSquareCard.classList.add('active');

  // Download canvas drawing as PNG
  const btnDownloadCanvas = document.getElementById('board-btn-download');
  if (btnDownloadCanvas) {
    btnDownloadCanvas.addEventListener('click', () => {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width || 800;
      exportCanvas.height = canvas.height || 600;
      const expCtx = exportCanvas.getContext('2d');

      // 1. White paper background
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // 2. A4 Margins Border (20mm left, 5mm others)
      expCtx.strokeStyle = '#2567b9';
      expCtx.lineWidth = 1.5;
      expCtx.strokeRect(40, 10, exportCanvas.width - 50, exportCanvas.height - 20);

      // 3. Draw canvas content
      expCtx.drawImage(canvas, 0, 0);

      // 4. Footer watermark stamp
      expCtx.fillStyle = '#123f76';
      expCtx.font = 'bold 11px sans-serif';
      expCtx.textAlign = 'left';
      expCtx.fillText('DRAFT-LAB • Latihan Papan Gambar Digital (Standard ISO)', 50, exportCanvas.height - 18);
      
      const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      expCtx.fillStyle = '#536a85';
      expCtx.font = '10px monospace';
      expCtx.textAlign = 'right';
      expCtx.fillText(today, exportCanvas.width - 20, exportCanvas.height - 18);

      // 5. Trigger download
      const link = document.createElement('a');
      link.download = `draftlab-papan-gambar-${Date.now()}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();

      if (typeof window.completeModule === 'function') {
        window.completeModule('tools');
      }
    });
  }

  setTimeout(resizeBoardCanvas, 100);
});
