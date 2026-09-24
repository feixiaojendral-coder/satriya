import { publicAssetUrl } from '../src/asset-url.js';

// --- PEMBACA BUKU / FLIPBOOK ---

document.addEventListener('DOMContentLoaded', () => {
  const reader = document.getElementById('book-reader');
  const stage = document.getElementById('book-stage');
  const frame = document.getElementById('book-page-frame');
  const pageImage = document.getElementById('book-page-image');
  const flipSheet = document.getElementById('book-flip-sheet');
  const flipStripsContainer = document.getElementById('book-flip-strips');
  const flipFrontImage = document.getElementById('book-flip-front-image');
  const flipBackImage = document.getElementById('book-flip-back-image');
  const flipFold = flipSheet?.querySelector('.book-flip-fold');
  const pageSheen = frame?.querySelector('.book-page-sheen');
  const loading = document.getElementById('book-page-loading');
  const currentPageLabel = document.getElementById('book-current-page');
  const progressLabel = document.getElementById('book-progress-label');
  const pageRange = document.getElementById('book-page-range');
  const zoomRange = document.getElementById('book-zoom-range');
  const zoomValue = document.getElementById('book-zoom-value');
  const thumbnails = document.getElementById('book-thumbnail-strip');
  const previousButton = document.getElementById('book-prev-page');
  const nextButton = document.getElementById('book-next-page');
  const previousEdge = document.getElementById('book-edge-prev');
  const nextEdge = document.getElementById('book-edge-next');
  const zoomOutButton = document.getElementById('book-zoom-out');
  const zoomInButton = document.getElementById('book-zoom-in');
  const fullscreenButton = document.getElementById('book-fullscreen');
  const startReadingButton = document.getElementById('book-start-reading');
  const bookSection = reader?.closest('#book');

  if (!reader || !stage || !frame || !pageImage) return;

  const books = {
    'gamtek-dasar': {
      title: 'Bab 1 · Fungsi dan Sifat Gambar',
      totalPages: 17,
      basePath: publicAssetUrl('books/gambar-teknik-mesin/pages')
    },
    'garis-huruf': {
      title: 'Bab 2 · Garis dan Huruf Standar ISO',
      totalPages: 20,
      basePath: publicAssetUrl('books/gambar-teknik-mesin-garis-huruf/pages')
    }
  };

  let activeBookId = 'gamtek-dasar';
  let totalPages = books[activeBookId].totalPages;
  let pageBasePath = books[activeBookId].basePath;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const storedPage = Number.parseInt(localStorage.getItem('draftlab_book_page') || '1', 10);
  let currentPage = clamp(Number.isFinite(storedPage) ? storedPage : 1, 1, totalPages);
  let zoom = 100;
  let pageRequestId = 0;
  let turnAnimationFrame = null;
  let loadingTimer = null;
  let fullscreenControlsTimer = null;
  let pointerOverFullscreenControls = false;
  let fullscreenStartedByPointer = false;
  let isBusy = false;
  let swipeStart = null;
  const flipStrips = [];

  const pageSource = (page) => `${pageBasePath}/page-${String(page).padStart(2, '0')}.webp`;

  const createFlipStrips = () => {
    if (!flipStripsContainer) return;

    const stripCount = 32;
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < stripCount; index += 1) {
      const strip = document.createElement('span');
      const front = document.createElement('span');
      const back = document.createElement('span');
      const width = (100 / stripCount) + 0.12;
      const backgroundPosition = `${(index / (stripCount - 1)) * 100}% center`;

      strip.className = 'book-flip-strip';
      front.className = 'book-flip-strip-face book-flip-strip-front';
      back.className = 'book-flip-strip-face book-flip-strip-back';
      strip.style.left = `${(index / stripCount) * 100}%`;
      strip.style.width = `${width}%`;
      strip.style.setProperty('--strip-index', String(index));
      strip.style.setProperty('--strip-count', String(stripCount));
      front.style.backgroundSize = `${stripCount * 100}% 100%`;
      back.style.backgroundSize = `${stripCount * 100}% 100%`;
      front.style.backgroundPosition = backgroundPosition;
      back.style.backgroundPosition = backgroundPosition;
      strip.append(front, back);
      fragment.append(strip);
      flipStrips.push({ strip, front, back, index });
    }

    flipStripsContainer.append(fragment);
    flipSheet?.classList.add('has-strips');
  };

  const createThumbnails = () => {
    if (!thumbnails) return;

    const fragment = document.createDocumentFragment();
    for (let page = 1; page <= totalPages; page += 1) {
      const button = document.createElement('button');
      const image = document.createElement('img');
      const label = document.createElement('span');

      button.type = 'button';
      button.className = 'book-thumbnail';
      button.dataset.page = String(page);
      button.setAttribute('aria-label', `Buka halaman ${page}`);
      image.src = pageSource(page);
      image.alt = '';
      image.width = 993;
      image.height = 1404;
      image.loading = page <= 3 ? 'eager' : 'lazy';
      image.decoding = 'async';
      label.textContent = String(page);
      button.append(image, label);
      button.addEventListener('click', () => {
        const direction = page >= currentPage ? 'next' : 'previous';
        renderPage(page, direction);
      });
      fragment.append(button);
    }

    thumbnails.append(fragment);
  };

  const updatePageControls = () => {
    if (currentPageLabel) currentPageLabel.textContent = String(currentPage);
    if (pageRange) pageRange.value = String(currentPage);
    if (progressLabel) {
      progressLabel.textContent = `${Math.round((currentPage / totalPages) * 100)}% selesai dibaca`;
    }

    if (currentPage >= 3 && typeof window.completeModule === 'function') {
      window.completeModule('book');
    }

    stage.setAttribute('aria-label', `Pratinjau buku, halaman ${currentPage} dari ${totalPages}`);
    [previousButton, previousEdge].filter(Boolean).forEach(button => {
      button.disabled = isBusy || currentPage <= 1;
    });
    [nextButton, nextEdge].filter(Boolean).forEach(button => {
      button.disabled = isBusy || currentPage >= totalPages;
    });
    if (pageRange) pageRange.disabled = isBusy;
    thumbnails?.classList.toggle('is-busy', isBusy);

    const activeThumbnail = thumbnails?.querySelector('.book-thumbnail.active');
    activeThumbnail?.classList.remove('active');
    activeThumbnail?.removeAttribute('aria-current');

    const nextActiveThumbnail = thumbnails?.querySelector(`.book-thumbnail[data-page="${currentPage}"]`);
    if (nextActiveThumbnail) {
      nextActiveThumbnail.classList.add('active');
      nextActiveThumbnail.setAttribute('aria-current', 'page');
      nextActiveThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const updatePageWidth = () => {
    const stagePadding = window.matchMedia('(max-width: 620px)').matches ? 36 : 118;
    const isFullscreen = document.fullscreenElement === reader;
    const widthLimit = Math.max(230, stage.clientWidth - stagePadding);
    const heightLimit = isFullscreen
      ? Math.max(230, (stage.clientHeight - 32) * (993 / 1404))
      : 620;
    const baseWidth = Math.min(620, widthLimit, heightLimit);
    frame.style.setProperty('--book-render-width', `${Math.round(baseWidth * (zoom / 100))}px`);
  };

  const updateZoom = (nextZoom) => {
    zoom = clamp(Number(nextZoom) || 100, 75, 160);
    if (zoomRange) zoomRange.value = String(zoom);
    if (zoomValue) zoomValue.textContent = `${zoom}%`;
    updatePageWidth();
  };

  const animatePaperTurn = (direction, previousSource, nextSource, onComplete) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!flipSheet || !flipFrontImage || !flipBackImage || !flipStrips.length || prefersReducedMotion) {
      onComplete();
      return;
    }

    window.cancelAnimationFrame(turnAnimationFrame);
    flipFrontImage.src = previousSource;
    flipBackImage.src = nextSource;
    flipStrips.forEach(({ strip, front, back }) => {
      strip.style.removeProperty('z-index');
      strip.style.removeProperty('filter');
      strip.style.removeProperty('transform');
      front.style.backgroundImage = `url("${previousSource}")`;
      back.style.backgroundImage = `url("${nextSource}")`;
    });
    flipSheet.classList.remove('flip-next', 'flip-previous', 'active');
    stage.classList.remove('page-turning-next', 'page-turning-previous');
    void flipSheet.offsetWidth;

    const directionClass = direction === 'previous' ? 'flip-previous' : 'flip-next';
    const stageClass = direction === 'previous' ? 'page-turning-previous' : 'page-turning-next';
    const duration = 1120;
    const stripCount = flipStrips.length;
    const frameWidth = frame.getBoundingClientRect().width;
    const stripWidth = frameWidth / stripCount;
    const curlWidth = 0.42;
    const directionSign = direction === 'previous' ? 1 : -1;
    let completed = false;

    const clampUnit = value => Math.min(1, Math.max(0, value));
    const smootherStep = value => {
      const bounded = clampUnit(value);
      return bounded * bounded * bounded * (bounded * (bounded * 6 - 15) + 10);
    };
    const easePaper = value => 0.5 - (Math.cos(Math.PI * clampUnit(value)) / 2);

    const resetPaperSurface = () => {
      flipStrips.forEach(({ strip }) => {
        strip.style.removeProperty('z-index');
        strip.style.removeProperty('filter');
        strip.style.removeProperty('transform');
      });
      if (flipFold) {
        flipFold.style.removeProperty('left');
        flipFold.style.removeProperty('right');
        flipFold.style.removeProperty('opacity');
        flipFold.style.removeProperty('transform');
      }
      if (pageSheen) {
        pageSheen.style.removeProperty('background');
        pageSheen.style.removeProperty('opacity');
      }
    };

    const finishTurn = () => {
      if (completed) return;
      completed = true;
      window.cancelAnimationFrame(turnAnimationFrame);
      flipSheet.classList.remove('active', directionClass);
      stage.classList.remove(stageClass);
      resetPaperSurface();
      onComplete();
    };

    flipSheet.classList.add('active', directionClass);
    stage.classList.add(stageClass);

    let startTime = null;
    const drawPaperFrame = timestamp => {
      if (completed) return;
      if (startTime === null) startTime = timestamp;

      const rawProgress = clampUnit((timestamp - startTime) / duration);
      const progress = easePaper(rawProgress);
      const phase = progress * (1 + curlWidth);
      let crestX = direction === 'previous' ? 0 : frameWidth;
      let crestZ = 0;
      let crestAngle = 0;

      if (direction === 'next') {
        let paperX = 0;
        let paperZ = 0;

        flipStrips.forEach(({ strip, index }) => {
          const distanceFromSpine = (index + 0.5) / stripCount;
          const turnAmount = smootherStep((phase - (1 - distanceFromSpine)) / curlWidth);
          const angle = directionSign * Math.PI * turnAmount;
          const cosine = Math.cos(angle);
          const sine = Math.sin(angle);
          const baseX = index * stripWidth;
          const centerX = paperX + (cosine * stripWidth * 0.5);
          const centerZ = paperZ - (sine * stripWidth * 0.5);
          const lift = Math.abs(Math.sin(angle));

          strip.style.transformOrigin = 'left center';
          strip.style.transform = `translate3d(${paperX - baseX}px, ${-lift * 0.45}px, ${paperZ}px) rotateY(${angle}rad) scaleY(${1 - (lift * 0.003)})`;
          strip.style.filter = `brightness(${1 - (lift * 0.16)}) saturate(${1 - (lift * 0.035)})`;
          strip.style.zIndex = String(20 + Math.round(centerZ));

          if (centerZ > crestZ) {
            crestX = centerX;
            crestZ = centerZ;
            crestAngle = angle;
          }

          paperX += cosine * stripWidth;
          paperZ -= sine * stripWidth;
        });
      } else {
        let paperX = frameWidth;
        let paperZ = 0;

        for (let index = stripCount - 1; index >= 0; index -= 1) {
          const { strip } = flipStrips[index];
          const distanceFromSpine = (stripCount - index - 0.5) / stripCount;
          const turnAmount = smootherStep((phase - (1 - distanceFromSpine)) / curlWidth);
          const angle = directionSign * Math.PI * turnAmount;
          const cosine = Math.cos(angle);
          const sine = Math.sin(angle);
          const baseRight = (index + 1) * stripWidth;
          const centerX = paperX - (cosine * stripWidth * 0.5);
          const centerZ = paperZ + (sine * stripWidth * 0.5);
          const lift = Math.abs(Math.sin(angle));

          strip.style.transformOrigin = 'right center';
          strip.style.transform = `translate3d(${paperX - baseRight}px, ${-lift * 0.45}px, ${paperZ}px) rotateY(${angle}rad) scaleY(${1 - (lift * 0.003)})`;
          strip.style.filter = `brightness(${1 - (lift * 0.16)}) saturate(${1 - (lift * 0.035)})`;
          strip.style.zIndex = String(20 + Math.round(centerZ));

          if (centerZ > crestZ) {
            crestX = centerX;
            crestZ = centerZ;
            crestAngle = angle;
          }

          paperX -= cosine * stripWidth;
          paperZ += sine * stripWidth;
        }
      }

      const shadowStrength = Math.sin(Math.PI * progress);
      const crestPercent = clamp((crestX / frameWidth) * 100, 0, 100);
      const shadowStart = Math.max(0, crestPercent - 14);
      const shadowEnd = Math.min(100, crestPercent + 14);

      if (flipFold) {
        const foldWidth = clamp(frameWidth * 0.105, 38, 78);
        flipFold.style.left = `${crestX - (foldWidth / 2)}px`;
        flipFold.style.right = 'auto';
        flipFold.style.width = `${foldWidth}px`;
        flipFold.style.opacity = String(shadowStrength * 0.72);
        flipFold.style.transform = `translateZ(${crestZ + 5}px) rotateY(${crestAngle}rad) scaleX(${0.72 + (shadowStrength * 0.28)})`;
      }

      if (pageSheen) {
        pageSheen.style.opacity = String(shadowStrength * 0.7);
        pageSheen.style.background = `linear-gradient(90deg, transparent ${shadowStart}%, rgba(4, 24, 49, 0.3) ${crestPercent}%, rgba(255, 255, 255, 0.22) ${Math.min(100, crestPercent + 4)}%, transparent ${shadowEnd}%)`;
      }

      if (rawProgress < 1) {
        turnAnimationFrame = window.requestAnimationFrame(drawPaperFrame);
      } else {
        finishTurn();
      }
    };

    turnAnimationFrame = window.requestAnimationFrame(drawPaperFrame);
  };

  const preloadNearbyPages = () => {
    [currentPage - 1, currentPage + 1]
      .filter(page => page >= 1 && page <= totalPages)
      .forEach(page => {
        const image = new Image();
        image.src = pageSource(page);
      });
  };

  const renderPage = (requestedPage, direction = 'next', animate = true) => {
    const targetPage = clamp(Number(requestedPage) || 1, 1, totalPages);
    if (isBusy || (animate && targetPage === currentPage)) return;

    const requestId = ++pageRequestId;
    const source = pageSource(targetPage);
    const preloader = new Image();
    const previousSource = pageImage.getAttribute('src') || pageSource(currentPage);

    isBusy = true;
    updatePageControls();
    window.clearTimeout(loadingTimer);
    loading?.classList.remove('error');
    if (loading) loading.innerHTML = '<span></span>Memuat halaman...';

    if (animate) {
      loadingTimer = window.setTimeout(() => loading?.classList.add('active'), 220);
    } else {
      loading?.classList.add('active');
      pageImage.classList.add('is-loading');
    }

    preloader.onload = () => {
      if (requestId !== pageRequestId) return;

      window.clearTimeout(loadingTimer);
      currentPage = targetPage;
      pageImage.src = source;
      pageImage.alt = `Halaman ${currentPage} dari Buku Ajar Gambar Teknik Mesin`;
      pageImage.classList.remove('is-loading');
      loading?.classList.remove('active');
      updatePageControls();
      preloadNearbyPages();
      localStorage.setItem('draftlab_book_page', String(currentPage));

      if (animate) {
        animatePaperTurn(direction, previousSource, source, () => {
          isBusy = false;
          updatePageControls();
        });
      } else {
        isBusy = false;
        updatePageControls();
      }
    };

    preloader.onerror = () => {
      if (requestId !== pageRequestId) return;
      window.clearTimeout(loadingTimer);
      isBusy = false;
      pageImage.classList.remove('is-loading');
      if (loading) {
        loading.textContent = 'Halaman tidak dapat dimuat. Coba lagi.';
        loading.classList.add('active', 'error');
      }
      updatePageControls();
    };

    preloader.src = source;
  };

  const movePage = (step) => {
    if (isBusy) return;
    if ((step < 0 && currentPage <= 1) || (step > 0 && currentPage >= totalPages)) return;
    renderPage(currentPage + step, step < 0 ? 'previous' : 'next');
  };

  createFlipStrips();
  createThumbnails();
  updateZoom(100);
  renderPage(currentPage, 'next', false);

  previousButton?.addEventListener('click', () => movePage(-1));
  previousEdge?.addEventListener('click', () => movePage(-1));
  nextButton?.addEventListener('click', () => movePage(1));
  nextEdge?.addEventListener('click', () => movePage(1));

  pageRange?.addEventListener('input', event => {
    const page = Number(event.target.value);
    renderPage(page, page >= currentPage ? 'next' : 'previous');
  });

  zoomRange?.addEventListener('input', event => updateZoom(event.target.value));
  zoomOutButton?.addEventListener('click', () => updateZoom(zoom - 10));
  zoomInButton?.addEventListener('click', () => updateZoom(zoom + 10));

  startReadingButton?.addEventListener('click', () => {
    reader.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => stage.focus({ preventScroll: true }), 450);
  });

  stage.addEventListener('keydown', event => {
    if (event.key === 'PageDown') {
      event.preventDefault();
      movePage(1);
    } else if (event.key === 'PageUp') {
      event.preventDefault();
      movePage(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      renderPage(1, 'previous');
    } else if (event.key === 'End') {
      event.preventDefault();
      renderPage(totalPages, 'next');
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      updateZoom(zoom + 10);
    } else if (event.key === '-') {
      event.preventDefault();
      updateZoom(zoom - 10);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat) return;
    if (!bookSection?.classList.contains('active') && document.fullscreenElement !== reader) return;

    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('input, textarea, select, button, a, [contenteditable="true"], .book-draft-panel')) return;

    event.preventDefault();
    movePage(event.key === 'ArrowRight' ? 1 : -1);
  });

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('button')) return;
    swipeStart = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  });

  stage.addEventListener('pointerup', event => {
    if (!swipeStart || swipeStart.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    swipeStart = null;

    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      movePage(deltaX < 0 ? 1 : -1);
    }
  });

  stage.addEventListener('pointercancel', () => { swipeStart = null; });

  const hideFullscreenControlsLater = (delay = 1600) => {
    window.clearTimeout(fullscreenControlsTimer);
    fullscreenControlsTimer = window.setTimeout(() => {
      if (!pointerOverFullscreenControls) {
        reader.classList.remove('fullscreen-controls-visible');
      }
    }, delay);
  };

  const showFullscreenControls = () => {
    if (document.fullscreenElement !== reader) return;
    reader.classList.add('fullscreen-controls-visible');
    hideFullscreenControlsLater();
  };

  reader.addEventListener('pointermove', event => {
    if (document.fullscreenElement !== reader) return;
    const distanceFromBottom = window.innerHeight - event.clientY;
    if (distanceFromBottom <= 150) {
      showFullscreenControls();
    } else if (!event.target.closest('.book-toolbar')) {
      hideFullscreenControlsLater(650);
    }
  });

  const bookToolbar = reader.querySelector('.book-toolbar');
  bookToolbar?.addEventListener('pointerenter', () => {
    pointerOverFullscreenControls = true;
    window.clearTimeout(fullscreenControlsTimer);
    reader.classList.add('fullscreen-controls-visible');
  });

  bookToolbar?.addEventListener('pointerleave', () => {
    pointerOverFullscreenControls = false;
    if (bookToolbar.contains(document.activeElement)) document.activeElement.blur();
    hideFullscreenControlsLater(650);
  });

  fullscreenButton?.addEventListener('pointerdown', () => {
    fullscreenStartedByPointer = true;
  });

  fullscreenButton?.addEventListener('keydown', () => {
    fullscreenStartedByPointer = false;
  });

  const updateFullscreenControl = () => {
    if (!fullscreenButton) return;
    const isFullscreen = document.fullscreenElement === reader;
    const text = fullscreenButton.querySelector('span');
    if (text) text.textContent = isFullscreen ? 'Keluar layar penuh' : 'Layar penuh';
    fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Keluar dari layar penuh' : 'Buka layar penuh');
    reader.classList.toggle('fullscreen-controls-visible', isFullscreen);
    if (isFullscreen) {
      if (fullscreenStartedByPointer) fullscreenButton.blur();
      fullscreenStartedByPointer = false;
      hideFullscreenControlsLater(2200);
    } else {
      window.clearTimeout(fullscreenControlsTimer);
      pointerOverFullscreenControls = false;
    }
    window.setTimeout(updatePageWidth, 60);
  };

  fullscreenButton?.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === reader) {
        await document.exitFullscreen();
      } else {
        await reader.requestFullscreen();
      }
    } catch (error) {
      console.error('Mode layar penuh tidak tersedia', error);
    }
  });

  document.addEventListener('fullscreenchange', updateFullscreenControl);
  window.addEventListener('resize', updatePageWidth);
  if ('ResizeObserver' in window) {
    const stageResizeObserver = new ResizeObserver(updatePageWidth);
    stageResizeObserver.observe(stage);
  }

  // Multi-book switcher logic
  const switchBook = (bookId) => {
    if (!books[bookId] || bookId === activeBookId) return;
    activeBookId = bookId;
    totalPages = books[activeBookId].totalPages;
    pageBasePath = books[activeBookId].basePath;

    const readerHeading = reader.querySelector('.book-reader-heading h3');
    if (readerHeading) readerHeading.textContent = books[activeBookId].title;

    if (pageRange) {
      pageRange.max = String(totalPages);
      pageRange.value = '1';
    }
    const pageTotalSpan = reader.querySelector('.book-page-counter span:last-child');
    if (pageTotalSpan) pageTotalSpan.textContent = `dari ${totalPages}`;

    document.querySelectorAll('.book-select-tab').forEach(tab => {
      const isActive = tab.dataset.bookId === bookId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    if (thumbnails) {
      thumbnails.innerHTML = '';
      createThumbnails();
    }

    currentPage = 1;
    renderPage(1, 'next');

    if (typeof window.completeModule === 'function') {
      window.completeModule('book');
    }
  };

  document.querySelectorAll('.book-select-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchBook(tab.dataset.bookId);
    });
  });

  const btnReadDraft = document.getElementById('btn-read-book-2');
  if (btnReadDraft) {
    btnReadDraft.addEventListener('click', () => {
      switchBook('garis-huruf');
      reader.scrollIntoView({ behavior: 'smooth' });
    });
  }
});
