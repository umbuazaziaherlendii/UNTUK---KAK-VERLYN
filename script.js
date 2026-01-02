// script.js (edits: video messages quiz accepts approximate time answers like "1 tahun 5 bulan", "2 tahun setengah", "lebih dari 1 tahun")
// - Keperluan lain tetap dipertahankan.

const $ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', () => {
  // Activate JS CSS states
  document.body.classList.remove('no-js');
  document.body.classList.add('js');

  // Basic elements
  const pagesEl = document.getElementById('pages');
  const sections = Array.from(document.querySelectorAll('.page'));
  const dotsNav = document.getElementById('dots-nav');

  // Build dots nav
  sections.forEach((sec, idx) => {
    const btn = document.createElement('button');
    btn.className = 'dot';
    btn.type = 'button';
    btn.setAttribute('aria-label', `Halaman ${idx + 1}: ${sec.dataset.title || sec.id || 'section'}`);
    btn.addEventListener('click', () => sec.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    dotsNav.appendChild(btn);
  });
  const dots = Array.from(dotsNav.querySelectorAll('.dot'));

  // IntersectionObserver for sections
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      const sec = ent.target;
      if (ent.isIntersecting && ent.intersectionRatio >= 0.5) {
        sec.classList.add('is-active');
        sec.setAttribute('aria-hidden', 'false');
        const i = sections.indexOf(sec);
        dots.forEach(d => d.classList.remove('active'));
        if (i >= 0) dots[i].classList.add('active');
      } else {
        sec.classList.remove('is-active');
        sec.setAttribute('aria-hidden', 'true');
      }
    });
  }, { threshold: [0.5] });
  sections.forEach(s => observer.observe(s));

  // Keyboard nav between sections
  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); scrollToNeighbor(1); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); scrollToNeighbor(-1); }
  });
  function scrollToNeighbor(direction) {
    const activeIndex = sections.findIndex(s => s.classList.contains('is-active'));
    let target = activeIndex;
    if (direction === 1) target = Math.min(sections.length - 1, activeIndex + 1);
    else target = Math.max(0, activeIndex - 1);
    if (target !== activeIndex && target >= 0) sections[target].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Hero buttons linking to timeline
  const startBtn = document.getElementById('start-journey');
  const heroNext = document.getElementById('hero-next');
  const timelineSection = document.getElementById('timeline');
  if (startBtn && timelineSection) startBtn.addEventListener('click', () => timelineSection.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  if (heroNext && timelineSection) heroNext.addEventListener('click', () => timelineSection.scrollIntoView({ behavior: 'smooth', block: 'start' }));

  // -----------------------
  // Shared audio logic (unchanged)
  // -----------------------
  const sharedAudio = document.getElementById('shared-audio');
  let currentAudioSrc = null;
  let lastFocusedPlayBtn = null;

  const momentCards = Array.from(document.querySelectorAll('.moment'));
  momentCards.forEach(card => {
    const audioSrc = card.dataset.audio;
    const playBtn = card.querySelector('.play-btn');
    const statusEl = card.querySelector('.audio-status');
    if (!playBtn || !statusEl) return;
    let durationEl = card.querySelector('.audio-duration');
    if (!durationEl) {
      durationEl = document.createElement('span');
      durationEl.className = 'audio-duration';
      durationEl.style.marginLeft = '6px';
      statusEl.after(durationEl);
    }
    if (!audioSrc) {
      playBtn.disabled = true;
      playBtn.setAttribute('aria-disabled', 'true');
      statusEl.textContent = '';
      durationEl.textContent = '';
      return;
    }
    playBtn.addEventListener('click', (e) => {
      lastFocusedPlayBtn = e.currentTarget;
      if (currentAudioSrc !== audioSrc) {
        currentAudioSrc = audioSrc;
        sharedAudio.src = audioSrc;
        sharedAudio.currentTime = 0;
        sharedAudio.play().catch(err => console.warn('Audio play prevented:', err));
        updateAllPlayButtons();
        return;
      }
      if (sharedAudio.paused) sharedAudio.play().catch(err => console.warn('Audio play prevented:', err));
      else sharedAudio.pause();
      updateAllPlayButtons();
    });
    const onLoadedMeta = () => {
      if (sharedAudio.duration && currentAudioSrc === audioSrc) {
        durationEl.textContent = ` / ${formatTime(sharedAudio.duration)}`;
      }
    };
    sharedAudio.addEventListener('loadedmetadata', onLoadedMeta);
    sharedAudio.addEventListener('timeupdate', () => {
      if (currentAudioSrc === audioSrc) {
        statusEl.textContent = formatTime(sharedAudio.currentTime);
        if (sharedAudio.duration) durationEl.textContent = ` / ${formatTime(sharedAudio.duration)}`;
      }
    });
    sharedAudio.addEventListener('ended', () => {
      if (currentAudioSrc === audioSrc) {
        sharedAudio.currentTime = 0;
        updateAllPlayButtons();
      }
    });
    sharedAudio.addEventListener('error', (ev) => {
      if (currentAudioSrc === audioSrc) {
        playBtn.disabled = true;
        statusEl.textContent = 'Audio error';
        durationEl.textContent = '';
        console.warn('Failed to load audio:', audioSrc, ev);
      }
    });
    sharedAudio.addEventListener('pause', updateAllPlayButtons);
    sharedAudio.addEventListener('play', updateAllPlayButtons);
  });

  function updateAllPlayButtons() {
    momentCards.forEach(card => {
      const audioSrc = card.dataset.audio;
      const playBtn = card.querySelector('.play-btn');
      const statusEl = card.querySelector('.audio-status');
      const durationEl = card.querySelector('.audio-duration');
      if (!playBtn || !statusEl) return;
      if (audioSrc && audioSrc === currentAudioSrc) {
        if (sharedAudio.paused) { playBtn.textContent = 'Play ▶'; playBtn.setAttribute('aria-pressed', 'false'); }
        else { playBtn.textContent = 'Pause ⏸'; playBtn.setAttribute('aria-pressed', 'true'); }
        statusEl.textContent = formatTime(sharedAudio.currentTime || 0);
        if (sharedAudio.duration) durationEl.textContent = ` / ${formatTime(sharedAudio.duration)}`;
      } else {
        playBtn.textContent = 'Play ▶';
        playBtn.setAttribute('aria-pressed', 'false');
        statusEl.textContent = formatTime(0);
      }
    });
  }
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
  window.addEventListener('pagehide', () => { if (!sharedAudio.paused) sharedAudio.pause(); });
  updateAllPlayButtons();

  // -----------------------
  // Gallery modal (unchanged)
  // -----------------------
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modal-img');
  const modalCaption = document.getElementById('modal-caption');
  const modalClose = document.getElementById('modal-close');
  let lastFocusedImage = null;
  document.querySelectorAll('.gallery-item img').forEach(img => {
    img.addEventListener('click', (e) => {
      lastFocusedImage = e.currentTarget;
      openModal(e.currentTarget.src, e.currentTarget.alt || '', e.currentTarget.dataset.caption || '');
    });
  });
  function openModal(src, alt, caption) {
    modalImg.src = src; modalImg.alt = alt; modalCaption.textContent = caption;
    modal.setAttribute('aria-hidden', 'false');
    if (!sharedAudio.paused) sharedAudio.pause();
    updateAllPlayButtons();
    if (modalClose) modalClose.focus();
  }
  function closeModal() {
    modal.setAttribute('aria-hidden', 'true'); modalImg.src = ''; modalCaption.textContent = '';
    if (lastFocusedImage) lastFocusedImage.focus();
  }
  if (modalClose) modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal(); });

  // -----------------------
  // Overlay creation for moment cards (same approach)
  // -----------------------
  momentCards.forEach(card => {
    if (card.querySelector('.moment-overlay')) return;
    card.classList.add('overlay-on');

    const media = card.querySelector('.moment-media');
    const titleEl = card.querySelector('.moment-title');
    const dateEl = card.querySelector('.moment-date');
    const descEl = card.querySelector('.moment-desc');
    const playBtn = card.querySelector('.play-btn');

    const overlay = document.createElement('div');
    overlay.className = 'moment-overlay';
    overlay.setAttribute('role', 'button');
    overlay.setAttribute('tabindex', '0');
    overlay.setAttribute('aria-label', 'Buka moment untuk melihat dan memutar audio');

    const overlayTitle = document.createElement('div');
    overlayTitle.className = 'overlay-title';
    overlayTitle.textContent = titleEl ? titleEl.textContent : '';

    const overlayBy = document.createElement('div');
    overlayBy.className = 'overlay-by';
    overlayBy.textContent = dateEl ? dateEl.textContent : '';

    const overlayDesc = document.createElement('div');
    overlayDesc.className = 'overlay-desc';
    overlayDesc.textContent = descEl ? descEl.textContent : '';

    overlay.appendChild(overlayTitle);
    overlay.appendChild(overlayBy);
    overlay.appendChild(overlayDesc);

    if (media) media.appendChild(overlay);
    else card.appendChild(overlay);

    function closeOtherOpenedCards() {
      const opened = Array.from(document.querySelectorAll('.moment.opened'));
      opened.forEach(o => {
        if (o === card) return;
        o.classList.remove('opened');
        o.classList.remove('overlay-hidden');
        o.classList.add('overlay-on');
      });
      if (!sharedAudio.paused) sharedAudio.pause();
      currentAudioSrc = null;
      updateAllPlayButtons();
    }

    const openAndPlay = () => {
      if (card.classList.contains('opened')) return;
      closeOtherOpenedCards();
      card.classList.add('overlay-hidden');
      card.classList.remove('overlay-on');
      card.classList.add('opened');
      if (playBtn) {
        playBtn.click();
        try { playBtn.focus({ preventScroll: true }); } catch (e) { playBtn.focus(); }
      }
    };

    overlay.addEventListener('click', (e) => { e.stopPropagation(); openAndPlay(); });
    overlay.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAndPlay(); } });
  });

  // -----------------------
  // Slider + adaptive bg for moments (preserved)
  // -----------------------
  const timelineEl = document.querySelector('.timeline');
  if (timelineEl && momentCards.length) {
    timelineEl.classList.add('has-slider');
    momentCards.forEach(c => c.classList.remove('opened'));
    const slideObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const card = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          timelineEl.querySelectorAll('.card').forEach(c => c.classList.remove('is-slide-active'));
          card.classList.add('is-slide-active');
          const img = card.querySelector('img');
          if (img && img.complete) applyDominantColorToTimeline(img);
          else if (img) img.addEventListener('load', () => applyDominantColorToTimeline(img), { once: true });
        }
      });
    }, { root: timelineEl, rootMargin: '0px', threshold: [0.6] });
    momentCards.forEach(card => slideObserver.observe(card));
    timelineEl.tabIndex = 0;
    timelineEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') timelineEl.scrollBy({ left: -Math.round(timelineEl.clientWidth * 0.8), behavior: 'smooth' });
      else if (e.key === 'ArrowRight') timelineEl.scrollBy({ left: Math.round(timelineEl.clientWidth * 0.8), behavior: 'smooth' });
    });
    let snapTimer = null;
    timelineEl.addEventListener('scroll', () => {
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(() => centerNearestSlide(), 150);
    });
    function centerNearestSlide() {
      const centerX = timelineEl.scrollLeft + timelineEl.clientWidth / 2;
      let nearest = null, minDist = Infinity;
      momentCards.forEach(card => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - centerX);
        if (dist < minDist) { minDist = dist; nearest = card; }
      });
      if (nearest) {
        const scrollTo = nearest.offsetLeft - (timelineEl.clientWidth - nearest.clientWidth) / 2;
        timelineEl.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    }
    function applyDominantColorToTimeline(imgEl) {
      try {
        const color = getDominantColorFromImage(imgEl, 20);
        if (color) {
          const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;
          const darker = `rgb(${Math.max(0,color.r-25)}, ${Math.max(0,color.g-20)}, ${Math.max(0,color.b-20)})`;
          timelineEl.style.setProperty('--timeline-bg', `linear-gradient(120deg, ${rgb}22, ${darker}44)`);
        }
      } catch (e) { console.warn('Dominant color extraction failed:', e); }
    }
    function getDominantColorFromImage(img, sampleSize = 20) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = sampleSize; canvas.height = sampleSize;
      try { ctx.drawImage(img, 0, 0, sampleSize, sampleSize); }
      catch (e) { console.warn('Unable to draw image for color sampling (CORS?).', e); return null; }
      const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
      let r=0,g=0,b=0,count=0;
      for (let i=0;i<data.length;i+=4) {
        const alpha = data[i+3];
        if (alpha < 125) continue;
        r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++;
      }
      if (count===0) return null;
      return { r: Math.round(r/count), g: Math.round(g/count), b: Math.round(b/count) };
    }
    window.requestAnimationFrame(() => {
      if (momentCards[0]) {
        const scrollTo = momentCards[0].offsetLeft - (timelineEl.clientWidth - momentCards[0].clientWidth) / 2;
        timelineEl.scrollTo({ left: scrollTo });
        momentCards[0].classList.add('is-slide-active');
        const img = momentCards[0].querySelector('img');
        if (img && img.complete) applyDominantColorToTimeline(img);
        else if (img) img.addEventListener('load', () => applyDominantColorToTimeline(img), { once: true });
      }
    });
  }

  // -----------------------
  // Background music player (static HTML under gallery)
  // -----------------------
  const vmAudio = document.getElementById('vm-audio');
  const vmPlay = document.getElementById('vm-play');
  const vmMute = document.getElementById('vm-mute');
  const vmVolume = document.getElementById('vm-volume');
  const vmFile = document.getElementById('vm-file');
  const vmTitle = document.getElementById('vm-title');

  // optional default audio path (change if you have a file)
  const defaultMusicPath = 'assets/audio/video-music.mp3';
  if (vmAudio) {
    // try to set default source; if file missing it's ok => user can load file
    vmAudio.src = defaultMusicPath;
    vmAudio.volume = Number(vmVolume?.value || 80) / 100;
  }

  if (vmPlay && vmAudio) {
    vmPlay.addEventListener('click', () => {
      if (vmAudio.paused) {
        vmAudio.play().then(() => {
          vmPlay.textContent = 'Pause';
          vmPlay.classList.add('playing');
          vmPlay.setAttribute('aria-pressed', 'true');
        }).catch(err => {
          console.warn('Music play prevented:', err);
          if (!vmAudio.src) alert('Please load an audio file to play (or check assets/audio/video-music.mp3).');
        });
      } else {
        vmAudio.pause();
        vmPlay.textContent = 'Play';
        vmPlay.classList.remove('playing');
        vmPlay.setAttribute('aria-pressed', 'false');
      }
    });
  }

  if (vmMute && vmAudio) {
    vmMute.addEventListener('click', () => {
      vmAudio.muted = !vmAudio.muted;
      vmMute.setAttribute('aria-pressed', String(vmAudio.muted));
      vmMute.textContent = vmAudio.muted ? 'Unmute' : 'Mute';
    });
  }

  if (vmVolume && vmAudio) {
    vmVolume.addEventListener('input', (e) => {
      const v = Number(e.currentTarget.value);
      vmAudio.volume = v / 100;
      if (v === 0) {
        vmAudio.muted = true;
        vmMute.setAttribute('aria-pressed', 'true');
        vmMute.textContent = 'Unmute';
      } else {
        if (vmAudio.muted) {
          vmAudio.muted = false;
          vmMute.setAttribute('aria-pressed', 'false');
          vmMute.textContent = 'Mute';
        }
      }
    });
  }

  if (vmFile && vmAudio) {
    vmFile.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      vmAudio.pause();
      try { vmAudio.removeAttribute('src'); } catch (err) {}
      vmAudio.src = url;
      vmTitle.textContent = f.name;
      vmAudio.load();
      vmAudio.play().then(() => {
        vmPlay.textContent = 'Pause';
        vmPlay.classList.add('playing');
        vmPlay.setAttribute('aria-pressed', 'true');
      }).catch(err => {
        console.warn('Play after file load prevented:', err);
      });
    });
  }

  if (vmAudio && vmPlay) {
    vmAudio.addEventListener('ended', () => {
      vmPlay.textContent = 'Play';
      vmPlay.classList.remove('playing');
      vmPlay.setAttribute('aria-pressed', 'false');
    });
    vmAudio.addEventListener('play', () => {
      vmPlay.textContent = 'Pause';
      vmPlay.classList.add('playing');
      vmPlay.setAttribute('aria-pressed', 'true');
    });
    vmAudio.addEventListener('pause', () => {
      vmPlay.textContent = 'Play';
      vmPlay.classList.remove('playing');
      vmPlay.setAttribute('aria-pressed', 'false');
    });
  }

  // -----------------------
  // Video Messages QUIZ (new)
  // - Uses data attributes on section#video-messages:
  //   data-drive  => the Drive link to open when answer is correct
  //   data-question => the text of the question to show
  //   data-answer => the canonical answer (kept for fallback)
  // - Accepts approximate time answers by parsing numbers like "1 tahun 5 bulan", "2 tahun setengah", "lebih dari 1 tahun".
  // - Matching rule used here: consider answer correct if parsed total months is >= 12 (i.e. "1 tahun lebih").
  // -----------------------
  (function setupVideoQuiz() {
    const videoSection = document.getElementById('video-messages');
    if (!videoSection) return;

    const driveLink = videoSection.dataset.drive || 'https://drive.google.com/drive/folders/YOUR_DRIVE_FOLDER_ID';
    const questionText = videoSection.dataset.question || 'Jawab pertanyaan berikut:';
    const canonicalAnswerRaw = (videoSection.dataset.answer || '').trim().toLowerCase();

    const qEl = videoSection.querySelector('#quiz-question');
    const form = document.getElementById('video-quiz-form');
    const input = document.getElementById('quiz-answer');
    const feedback = document.getElementById('quiz-feedback');

    if (qEl) qEl.textContent = questionText;

    // helper: parse indonesian small-number words
    const WORD_NUM = {
      'nol': 0, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
      'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
      'sebelas': 11, 'dua belas': 12
    };

    function wordToNumber(word) {
      const w = word.trim().toLowerCase();
      if (WORD_NUM.hasOwnProperty(w)) return WORD_NUM[w];
      // try single token
      const parts = w.split(/\s+/);
      if (parts.length === 1 && WORD_NUM.hasOwnProperty(parts[0])) return WORD_NUM[parts[0]];
      return NaN;
    }

    // parse textual durations like "1 tahun 5 bulan", "2.5 tahun", "2 tahun setengah", "1 tahun lebih", "1 tahun 5 bulan"
    function parseDurationToMonths(text) {
      if (!text || typeof text !== 'string') return null;
      const s = text.toLowerCase();

      // quick checks
      // if phrase contains 'lebih dari' or 'lebih' with year, treat as year >= number found (so >= that)
      // We'll aim to extract explicit numbers first.

      // match decimal years like "2.5 tahun"
      let years = 0;
      let months = 0;
      let matched = false;

      // handle patterns like "2 tahun setengah" or "2 tahun setegah" (setengah = 0.5 year)
      const halfPattern = /(\d+(?:[\.,]\d+)?)\s*tahun\s*(?:setengah|setegah|setengahnya)/i;
      const halfMatch = s.match(halfPattern);
      if (halfMatch) {
        matched = true;
        years = parseFloat(halfMatch[1].replace(',', '.'));
        months = Math.round(years * 12 + 6); // add half-year
        return months;
      }

      // match number of years with optional decimal: "2.5 tahun" or "2,5 tahun"
      const yearDecimal = s.match(/(\d+(?:[.,]\d+)?)\s*tahun/i);
      if (yearDecimal) {
        matched = true;
        const y = parseFloat(yearDecimal[1].replace(',', '.'));
        if (!isNaN(y)) {
          years = Math.floor(y);
          const frac = y - years;
          months = Math.round(y * 12);
        }
      }

      // match spelled-out year like "satu tahun"
      if (!matched) {
        const wordYear = s.match(/([a-zA-Z\u00C0-\u017F\s]+)\s*tahun/i);
        if (wordYear) {
          const wn = wordYear[1].trim();
          const num = wordToNumber(wn) || parseFloat(wn.replace(',', '.'));
          if (!isNaN(num)) {
            matched = true;
            months = Math.round(num * 12);
          }
        }
      }

      // match explicit years digits (integer) e.g. "2 tahun"
      if (!matched) {
        const yearInt = s.match(/(\d+)\s*tahun/i);
        if (yearInt) {
          matched = true;
          years = parseInt(yearInt[1], 10);
          months = years * 12;
        }
      }

      // match months like "5 bulan"
      const monthMatch = s.match(/(\d+)\s*bulan/i);
      if (monthMatch) {
        matched = true;
        const m = parseInt(monthMatch[1], 10);
        // if there are years also, add
        if (months) months += m;
        else months = m;
      }

      // handle "setengah tahun" (0.5 year)
      if (!matched && s.includes('setengah tahun')) {
        matched = true;
        months = 6;
      }

      // handle "lebih dari X tahun" or "lebih X tahun" -> treat as at least X years
      if (!matched) {
        const moreMatch = s.match(/(\d+)\s*tahun\s*(lebih|keatas|lebih dari)/i) || s.match(/lebih\s*(?:dari\s*)?(\d+)\s*tahun/i);
        if (moreMatch) {
          matched = true;
          const y = parseInt(moreMatch[1], 10);
          months = y * 12; // treat as at least that
        }
      }

      // if nothing matched but the string contains 'tahun' and 'lebih', accept as >=1 year
      if (!matched && /tahun/.test(s) && /lebih/.test(s)) {
        matched = true;
        months = 12;
      }

      // if we parsed something, return months; otherwise null
      if (matched) return months;
      return null;
    }

    // If no correct answer configured, show hint
    if (!canonicalAnswerRaw) {
      if (feedback) {
        feedback.textContent = 'Catatan: jawaban benar belum dikonfigurasi. Hubungi pembuat halaman untuk mengatur data-answer pada section#video-messages.';
        feedback.className = 'quiz-feedback warning';
      }
    }

    if (!form || !input || !feedback) return;

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const raw = (input.value || '').trim();
      const val = raw.toLowerCase();

      if (!val) {
        feedback.textContent = 'Mohon masukkan jawaban dulu.';
        feedback.className = 'quiz-feedback wrong';
        input.focus();
        return;
      }

      // Primary parsing: try to interpret as a duration and check if it's >= 12 months (1 tahun)
      const parsedMonths = parseDurationToMonths(val);

      let isCorrect = false;

      if (parsedMonths !== null) {
        // Accept answers that indicate >= 12 months (i.e. "1 tahun lebih")
        if (parsedMonths >= 12) isCorrect = true;
      } else {
        // Fallback checks if user typed something close to canonicalAnswerRaw (simple substring / token checks)
        if (canonicalAnswerRaw) {
          const canon = canonicalAnswerRaw.toLowerCase();
          // Exact match trimmed
          if (val === canon) isCorrect = true;
          // If canonical contains "1 tahun" allow answers containing "1 tahun" or "satu tahun" or "lebih"
          if (!isCorrect && /1|satu/.test(canon) && (/1 tahun/.test(val) || /satu tahun/.test(val) || /lebih/.test(val) || /tahun lebih/.test(val))) {
            isCorrect = true;
          }
        }
      }

      // Final decision
      if (isCorrect) {
        feedback.textContent = 'Jawaban benar! Membuka link Drive...';
        feedback.className = 'quiz-feedback correct';
        try {
          window.open(driveLink, '_blank', 'noopener');
        } catch (e) {
          window.location.href = driveLink;
        }
      } else {
        feedback.textContent = 'Jawaban salah. Coba lagi ya 🙂';
        feedback.className = 'quiz-feedback wrong';
        input.focus();
      }
    });

    // allow Enter key on text input to submit (form already handles it)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        // let form submit normally
      }
    });
  })();

  // -----------------------
  // Simplified "close opened" behavior (moments only)
  // -----------------------
  function closeAllOpenedCards() {
    const opened = Array.from(document.querySelectorAll('.moment.opened'));
    opened.forEach(o => {
      o.classList.remove('opened');
      o.classList.remove('overlay-hidden');
      o.classList.add('overlay-on');
    });
    if (!sharedAudio.paused) sharedAudio.pause();
    currentAudioSrc = null;
    updateAllPlayButtons();
  }

  // click outside any card closes opened (moments)
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.card')) {
      closeAllOpenedCards();
    }
  });

  // Pause music on pagehide as well
  window.addEventListener('pagehide', () => {
    try { if (vmAudio && !vmAudio.paused) vmAudio.pause(); } catch (e) {}
  });

  // initial hash scroll
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) target.scrollIntoView();
  } else {
    if (sections[0]) sections[0].scrollIntoView();
  }
});