/**
 * WOAH COLLETION — CHECKOUT & AUDIO TEST STUDIO
 * Advanced Web Audio API Engine, 4-Band Parametric EQ, Mixer & Checkout
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. STATE & AUDIO CONFIGURATION
  // =========================================================================
  const state = {
    isPlaying: false,
    isLooping: true,
    currentTime: 0,
    duration: 192, // 3:12 in seconds
    volume: 0.85,
    mixMode: 'mix', // 'beat', 'user', 'mix'
    userTrackLoaded: true,
    userFileName: 'MinhaMusica.mp3',
    userFileSize: '5.2 MB • MP3',
    couponCode: '',
    discount: 0,
    basePrice: 149.90,
    selectedPaymentMethod: 'pix',
    
    // Equalizer Band Defaults (Reference Specs)
    bands: [
      { id: 1, name: 'BAND 1', color: '#E91E3F', type: 'lowshelf', freq: 85, q: 0.7, gain: -1.5, bypass: false },
      { id: 2, name: 'BAND 2', color: '#E91E3F', type: 'peaking', freq: 750, q: 1.0, gain: -2.4, bypass: false },
      { id: 3, name: 'BAND 3', color: '#E91E3F', type: 'peaking', freq: 4500, q: 1.0, gain: 3.2, bypass: false },
      { id: 4, name: 'BAND 4', color: '#E91E3F', type: 'highshelf', freq: 12000, q: 1.0, gain: 0.0, bypass: false }
    ]
  };

  const defaultBands = JSON.parse(JSON.stringify(state.bands));

  // Audio Context & Nodes
  let audioCtx = null;
  let beatSource = null;
  let userSource = null;
  let beatGain = null;
  let userGain = null;
  let masterGain = null;
  let analyser = null;
  let filterNodes = [];
  let animFrameId = null;
  let playbackStartTime = 0;
  let startOffsetTime = 0;

  // Audio Buffers
  let beatAudioBuffer = null;
  let userAudioBuffer = null;

  // =========================================================================
  // 2. INITIALIZE AUDIO CONTEXT & SYNTHESIS
  // =========================================================================
  function initAudioContext() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    // Master Gain & Analyser
    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(state.volume, audioCtx.currentTime);

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.85;

    // Connect Master to Analyser to Destination
    masterGain.connect(analyser);
    analyser.connect(audioCtx.destination);

    // Mixer Bus Gains
    beatGain = audioCtx.createGain();
    userGain = audioCtx.createGain();

    updateMixGains();

    // Setup 4 EQ Biquad Filter Nodes
    filterNodes = state.bands.map(band => {
      const filter = audioCtx.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.setValueAtTime(band.freq, audioCtx.currentTime);
      filter.Q.setValueAtTime(band.q, audioCtx.currentTime);
      filter.gain.setValueAtTime(band.gain, audioCtx.currentTime);
      return filter;
    });

    // Chain: Beat Source -> Filter 1 -> Filter 2 -> Filter 3 -> Filter 4 -> Beat Gain -> Master Gain
    for (let i = 0; i < filterNodes.length - 1; i++) {
      filterNodes[i].connect(filterNodes[i + 1]);
    }
    filterNodes[filterNodes.length - 1].connect(beatGain);
    beatGain.connect(masterGain);

    // User track goes into userGain -> Master Gain
    userGain.connect(masterGain);

    // Generate Audio Buffers
    generateRealisticTrapBeatBuffer();
    generateRealisticDemoVocalBuffer();
  }

  // Realistic Trap Beat Generation (808 Sub, Crisp Hihat Rolls, Trap Snare & Cm Melody)
  function generateRealisticTrapBeatBuffer() {
    const sampleRate = audioCtx.sampleRate;
    const bpm = 90;
    const barSeconds = (60 / bpm) * 4; // 1 bar = 2.66s
    const totalBars = 4;
    const bufferLength = Math.floor(sampleRate * barSeconds * totalBars);
    const buffer = audioCtx.createBuffer(2, bufferLength, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const stepSeconds = (60 / bpm) / 4; // 16th note

    for (let bar = 0; bar < totalBars; bar++) {
      const barOffset = Math.floor(bar * barSeconds * sampleRate);

      // 1. Kick & 808 Sub Bass (on beats 1, 2.5, 3, etc.)
      const kickHits = [0, 6, 8, 10, 14];
      kickHits.forEach(step => {
        const hitSample = barOffset + Math.floor(step * stepSeconds * sampleRate);
        const hitLen = Math.floor(sampleRate * 0.45);
        for (let i = 0; i < hitLen && (hitSample + i) < bufferLength; i++) {
          const t = i / sampleRate;
          const pitch = 55 * Math.exp(-t * 12) + 38; // 808 envelope
          const env = Math.exp(-t * 5.5);
          const val = Math.sin(2 * Math.PI * pitch * t) * env * 0.7;
          left[hitSample + i] += val;
          right[hitSample + i] += val;
        }
      });

      // 2. Snare / Clap on beats 2 and 4 (steps 4 and 12)
      [4, 12].forEach(step => {
        const hitSample = barOffset + Math.floor(step * stepSeconds * sampleRate);
        const hitLen = Math.floor(sampleRate * 0.22);
        for (let i = 0; i < hitLen && (hitSample + i) < bufferLength; i++) {
          const t = i / sampleRate;
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 22);
          const tone = Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 30) * 0.4;
          const val = (noise + tone) * 0.45;
          left[hitSample + i] += val;
          right[hitSample + i] += val;
        }
      });

      // 3. Crisp Hi-Hats (16th notes with 32nd roll on step 14)
      for (let s = 0; s < 16; s++) {
        const isRoll = (s === 14 || s === 15);
        const subSteps = isRoll ? 2 : 1;
        for (let sub = 0; sub < subSteps; sub++) {
          const hatTime = barOffset + Math.floor((s * stepSeconds + (sub * stepSeconds / 2)) * sampleRate);
          const hitLen = Math.floor(sampleRate * 0.045);
          for (let i = 0; i < hitLen && (hatTime + i) < bufferLength; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() * 2 - 1) * Math.exp(-t * 85) * (isRoll ? 0.18 : 0.22);
            left[hatTime + i] += noise * 0.9;
            right[hatTime + i] += noise * 1.1; // stereo width
          }
        }
      }

      // 4. Dark Minor Melodic Chords (Cm, Ab, Fm, G)
      const chordFreqs = [
        [130.81, 155.56, 196.00], // Cm
        [116.54, 155.56, 174.61], // Bb
        [103.83, 130.81, 155.56], // Ab
        [98.00, 123.47, 146.83]   // G
      ][bar % 4];

      const chordLen = Math.floor(sampleRate * barSeconds);
      for (let i = 0; i < chordLen && (barOffset + i) < bufferLength; i++) {
        const t = i / sampleRate;
        let chordVal = 0;
        chordFreqs.forEach(freq => {
          chordVal += Math.sin(2 * Math.PI * freq * t) * 0.08;
          chordVal += Math.sin(2 * Math.PI * (freq * 2) * t) * 0.03; // overtone
        });
        const envelope = Math.sin((i / chordLen) * Math.PI) * 0.6;
        left[barOffset + i] += chordVal * envelope;
        right[barOffset + i] += chordVal * envelope;
      }
    }

    beatAudioBuffer = buffer;
  }

  // Realistic Demo Vocal / Melody Buffer for "Sua Música"
  function generateRealisticDemoVocalBuffer() {
    const sampleRate = audioCtx.sampleRate;
    const duration = (60 / 90) * 4 * 4;
    const bufferLength = Math.floor(sampleRate * duration);
    const buffer = audioCtx.createBuffer(2, bufferLength, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const notes = [261.63, 311.13, 349.23, 392.00, 466.16]; // C minor pentatonic
    const noteDuration = 0.66; // seconds

    let currentPos = 0;
    while (currentPos < duration) {
      const noteFreq = notes[Math.floor(Math.random() * notes.length)];
      const startSample = Math.floor(currentPos * sampleRate);
      const noteSamples = Math.floor(noteDuration * sampleRate);

      for (let i = 0; i < noteSamples && (startSample + i) < bufferLength; i++) {
        const t = i / sampleRate;
        const env = Math.sin((i / noteSamples) * Math.PI) * 0.25;
        // Warm vocal formant approximation
        const val = (Math.sin(2 * Math.PI * noteFreq * t) +
                     0.5 * Math.sin(2 * Math.PI * (noteFreq * 2) * t) +
                     0.25 * Math.sin(2 * Math.PI * (noteFreq * 3) * t)) * env;
        left[startSample + i] += val;
        right[startSample + i] += val * 0.95;
      }
      currentPos += noteDuration;
    }

    userAudioBuffer = buffer;
  }

  // Mixer Gain Balance
  function updateMixGains() {
    if (!beatGain || !userGain || !audioCtx) return;
    const t = audioCtx.currentTime;
    if (state.mixMode === 'beat') {
      beatGain.gain.setTargetAtTime(1.0, t, 0.05);
      userGain.gain.setTargetAtTime(0.0, t, 0.05);
    } else if (state.mixMode === 'user') {
      beatGain.gain.setTargetAtTime(0.0, t, 0.05);
      userGain.gain.setTargetAtTime(1.0, t, 0.05);
    } else {
      // Mix
      beatGain.gain.setTargetAtTime(0.85, t, 0.05);
      userGain.gain.setTargetAtTime(0.85, t, 0.05);
    }
  }

  // Play / Pause Transport
  function playAudio() {
    initAudioContext();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    stopSources();

    if (!beatAudioBuffer) return;

    // Create Buffer Sources
    beatSource = audioCtx.createBufferSource();
    beatSource.buffer = beatAudioBuffer;
    beatSource.loop = state.isLooping;
    beatSource.connect(filterNodes[0]);

    if (state.userTrackLoaded && userAudioBuffer) {
      userSource = audioCtx.createBufferSource();
      userSource.buffer = userAudioBuffer;
      userSource.loop = state.isLooping;
      userSource.connect(userGain);
    }

    const offset = startOffsetTime % beatAudioBuffer.duration;
    playbackStartTime = audioCtx.currentTime - offset;

    beatSource.start(0, offset);
    if (userSource) {
      userSource.start(0, offset % userAudioBuffer.duration);
    }

    state.isPlaying = true;
    updatePlayPauseUI();
    startAnimationLoop();
  }

  function pauseAudio() {
    if (audioCtx && state.isPlaying) {
      startOffsetTime = (audioCtx.currentTime - playbackStartTime);
      stopSources();
    }
    state.isPlaying = false;
    updatePlayPauseUI();
  }

  function stopSources() {
    if (beatSource) {
      try { beatSource.stop(); } catch (e) {}
      beatSource.disconnect();
      beatSource = null;
    }
    if (userSource) {
      try { userSource.stop(); } catch (e) {}
      userSource.disconnect();
      userSource = null;
    }
  }

  function togglePlayPause() {
    if (state.isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  function updatePlayPauseUI() {
    const playBtn = document.getElementById('transport-play-btn');
    const heroPlayBtn = document.getElementById('hero-play-btn');
    const playIcon = state.isPlaying ? '❚❚' : '▶';
    
    if (playBtn) playBtn.innerHTML = playIcon;
    if (heroPlayBtn) heroPlayBtn.innerHTML = playIcon;
  }

  // =========================================================================
  // 3. PARAMETRIC EQUALIZER ENGINE (4 BANDS)
  // =========================================================================
  function updateFilterNode(index) {
    if (!audioCtx || !filterNodes[index]) return;
    const band = state.bands[index];
    const node = filterNodes[index];
    const t = audioCtx.currentTime;

    node.frequency.setTargetAtTime(band.freq, t, 0.03);
    node.Q.setTargetAtTime(band.q, t, 0.03);
    node.gain.setTargetAtTime(band.bypass ? 0 : band.gain, t, 0.03);
  }

  function resetEqualizer() {
    state.bands = JSON.parse(JSON.stringify(defaultBands));
    state.bands.forEach((_, idx) => {
      updateFilterNode(idx);
      updateKnobsUI(idx);
    });
    drawEqualizerCanvas();
  }

  // =========================================================================
  // 4. CANVAS DRAWING (EQ CURVE & FFT ANALYZER)
  // =========================================================================
  const eqCanvas = document.getElementById('eq-canvas');
  let eqCtx = null;
  if (eqCanvas) eqCtx = eqCanvas.getContext('2d');

  let draggedBandIndex = -1;

  function resizeCanvas() {
    if (!eqCanvas) return;
    const rect = eqCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    eqCanvas.width = rect.width * dpr;
    eqCanvas.height = rect.height * dpr;
    if (eqCtx) eqCtx.scale(dpr, dpr);
    drawEqualizerCanvas();
  }

  // Map frequency to Canvas X (Logarithmic from 20Hz to 20kHz)
  function freqToX(freq, width) {
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const log = Math.log10(Math.max(20, Math.min(20000, freq)));
    return ((log - minLog) / (maxLog - minLog)) * width;
  }

  function xToFreq(x, width) {
    const minLog = Math.log10(20);
    const maxLog = Math.log10(20000);
    const log = minLog + (x / width) * (maxLog - minLog);
    return Math.pow(10, log);
  }

  // Map gain to Canvas Y (+18dB to -18dB)
  function gainToY(gain, height) {
    const minGain = -18;
    const maxGain = 18;
    const clamped = Math.max(minGain, Math.min(maxGain, gain));
    return height - ((clamped - minGain) / (maxGain - minGain)) * height;
  }

  function yToGain(y, height) {
    const minGain = -18;
    const maxGain = 18;
    return maxGain - (y / height) * (maxGain - minGain);
  }

  function drawEqualizerCanvas() {
    if (!eqCanvas || !eqCtx) return;
    const width = eqCanvas.getBoundingClientRect().width;
    const height = eqCanvas.getBoundingClientRect().height;

    eqCtx.clearRect(0, 0, width, height);

    // 1. Draw Grid Lines
    eqCtx.lineWidth = 1;
    eqCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';

    // Vertical Frequency Grid Lines
    const freqMarkers = [
      { f: 20, label: '20Hz' },
      { f: 50, label: '50' },
      { f: 100, label: '100' },
      { f: 200, label: '200' },
      { f: 500, label: '500' },
      { f: 1000, label: '1k' },
      { f: 2000, label: '2k' },
      { f: 5000, label: '5k' },
      { f: 10000, label: '10k' },
      { f: 20000, label: '20k' }
    ];

    eqCtx.fillStyle = '#475569';
    eqCtx.font = '9px "Space Grotesk", sans-serif';
    eqCtx.textAlign = 'center';

    freqMarkers.forEach(item => {
      const x = freqToX(item.f, width);
      eqCtx.beginPath();
      eqCtx.moveTo(x, 0);
      eqCtx.lineTo(x, height - 14);
      eqCtx.stroke();
      eqCtx.fillText(item.label, x, height - 4);
    });

    // Horizontal Gain Grid Lines (+12, +6, 0, -6, -12)
    const gainMarkers = [12, 6, 0, -6, -12];
    eqCtx.textAlign = 'left';
    gainMarkers.forEach(g => {
      const y = gainToY(g, height);
      eqCtx.beginPath();
      if (g === 0) {
        eqCtx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        eqCtx.setLineDash([4, 4]);
      } else {
        eqCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        eqCtx.setLineDash([]);
      }
      eqCtx.moveTo(0, y);
      eqCtx.lineTo(width, y);
      eqCtx.stroke();
      eqCtx.setLineDash([]);

      eqCtx.fillStyle = g === 0 ? '#94a3b8' : '#475569';
      eqCtx.fillText((g > 0 ? '+' : '') + g, 6, y - 3);
    });

    // 2. Real-Time FFT Spectrum in background
    if (analyser && state.isPlaying) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      eqCtx.fillStyle = 'rgba(233, 30, 63, 0.12)';
      const barWidth = width / 64;
      for (let i = 0; i < 64; i++) {
        const binIndex = Math.floor(Math.pow(i / 64, 1.8) * bufferLength);
        const val = dataArray[binIndex] || 0;
        const barHeight = (val / 255) * (height * 0.7);
        eqCtx.fillRect(i * barWidth, height - barHeight - 16, barWidth - 1, barHeight);
      }
    }

    // 3. Draw EQ Curve
    const pointsCount = 128;
    const curvePoints = [];
    const freqsArray = new Float32Array(pointsCount);

    for (let i = 0; i < pointsCount; i++) {
      const x = (i / (pointsCount - 1)) * width;
      freqsArray[i] = xToFreq(x, width);
    }

    let magResponse = new Float32Array(pointsCount).fill(1.0);
    let phaseResponse = new Float32Array(pointsCount);

    if (audioCtx && filterNodes.length === 4) {
      const tempMag = new Float32Array(pointsCount);
      filterNodes.forEach(filter => {
        filter.getFrequencyResponse(freqsArray, tempMag, phaseResponse);
        for (let i = 0; i < pointsCount; i++) {
          magResponse[i] *= tempMag[i];
        }
      });
    }

    for (let i = 0; i < pointsCount; i++) {
      const x = (i / (pointsCount - 1)) * width;
      const db = 20 * Math.log10(magResponse[i] || 1);
      const y = gainToY(db, height);
      curvePoints.push({ x, y });
    }

    // Gradient Fill Under Curve (Crimson Red)
    const gradient = eqCtx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0.0, 'rgba(233, 30, 63, 0.22)');
    gradient.addColorStop(0.7, 'rgba(233, 30, 63, 0.05)');
    gradient.addColorStop(1.0, 'rgba(233, 30, 63, 0.0)');

    eqCtx.beginPath();
    eqCtx.moveTo(curvePoints[0].x, gainToY(0, height));
    curvePoints.forEach(pt => eqCtx.lineTo(pt.x, pt.y));
    eqCtx.lineTo(curvePoints[curvePoints.length - 1].x, gainToY(0, height));
    eqCtx.closePath();
    eqCtx.fillStyle = gradient;
    eqCtx.fill();

    // Spline Stroke Line (Crimson Red)
    eqCtx.beginPath();
    eqCtx.moveTo(curvePoints[0].x, curvePoints[0].y);
    curvePoints.forEach(pt => eqCtx.lineTo(pt.x, pt.y));
    eqCtx.lineWidth = 2.5;

    eqCtx.strokeStyle = '#E91E3F';
    eqCtx.shadowColor = 'rgba(233, 30, 63, 0.5)';
    eqCtx.shadowBlur = 8;
    eqCtx.stroke();
    eqCtx.shadowBlur = 0;

    // 4. Draw Draggable Interactive Band Nodes
    state.bands.forEach((band, idx) => {
      const x = freqToX(band.freq, width);
      const y = gainToY(band.gain, height);

      // Outer glow circle
      eqCtx.beginPath();
      eqCtx.arc(x, y, 10, 0, Math.PI * 2);
      eqCtx.fillStyle = band.color + '44';
      eqCtx.fill();

      // Inner solid node
      eqCtx.beginPath();
      eqCtx.arc(x, y, 6, 0, Math.PI * 2);
      eqCtx.fillStyle = band.color;
      eqCtx.shadowColor = band.color;
      eqCtx.shadowBlur = 8;
      eqCtx.fill();
      eqCtx.shadowBlur = 0;

      // Node number badge
      eqCtx.fillStyle = '#ffffff';
      eqCtx.font = 'bold 8px "Inter", sans-serif';
      eqCtx.textAlign = 'center';
      eqCtx.fillText(band.id, x, y + 2.5);
    });
  }

  // Canvas Mouse & Touch Interaction (Drag EQ Nodes)
  function initCanvasInteractions() {
    if (!eqCanvas) return;

    function getCanvasCoordinates(e) {
      const rect = eqCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        width: rect.width,
        height: rect.height
      };
    }

    function onPointerDown(e) {
      const { x, y, width, height } = getCanvasCoordinates(e);
      // Check hit on any of the 4 nodes (radius ~15px)
      for (let i = 0; i < state.bands.length; i++) {
        const band = state.bands[i];
        const bx = freqToX(band.freq, width);
        const by = gainToY(band.gain, height);
        const dist = Math.hypot(x - bx, y - by);
        if (dist <= 18) {
          draggedBandIndex = i;
          e.preventDefault();
          break;
        }
      }
    }

    function onPointerMove(e) {
      if (draggedBandIndex === -1) return;
      const { x, y, width, height } = getCanvasCoordinates(e);

      const newFreq = Math.round(xToFreq(x, width));
      const newGain = parseFloat(yToGain(y, height).toFixed(1));

      const band = state.bands[draggedBandIndex];
      band.freq = Math.max(20, Math.min(20000, newFreq));
      band.gain = Math.max(-18, Math.min(18, newGain));

      updateFilterNode(draggedBandIndex);
      updateKnobsUI(draggedBandIndex);
      drawEqualizerCanvas();
    }

    function onPointerUp() {
      draggedBandIndex = -1;
    }

    eqCanvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    eqCanvas.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  }

  // =========================================================================
  // 5. KNOBS INTERACTIVITY & SYNC
  // =========================================================================
  function formatFreqDisplay(freq) {
    if (freq >= 1000) {
      return (freq / 1000).toFixed(freq % 1000 === 0 ? 0 : 2) + ' kHz';
    }
    return Math.round(freq) + ' Hz';
  }

  function updateKnobsUI(bandIndex) {
    const band = state.bands[bandIndex];

    // Update compact EQ band display (Reference Spec)
    const bFreqEl = document.getElementById(`eq-b${band.id}-freq`);
    const bQEl = document.getElementById(`eq-b${band.id}-q`);
    const bGainEl = document.getElementById(`eq-b${band.id}-gain`);
    if (bFreqEl) bFreqEl.textContent = formatFreqDisplay(band.freq);
    if (bQEl) bQEl.textContent = band.q.toFixed(1);
    if (bGainEl) bGainEl.textContent = (band.gain > 0 ? '+' : '') + band.gain.toFixed(1) + ' dB';

    const card = document.querySelector(`.band-card.band-${band.id}`);
    if (!card) return;

    // Freq Knob
    const freqVal = card.querySelector('[data-param="freq-val"]');
    const freqPointer = card.querySelector('[data-knob="freq"] .knob-pointer-line');
    if (freqVal) freqVal.textContent = formatFreqDisplay(band.freq);
    if (freqPointer) {
      // Map freq to angle (-135deg to +135deg)
      const minLog = Math.log10(20);
      const maxLog = Math.log10(20000);
      const ratio = (Math.log10(band.freq) - minLog) / (maxLog - minLog);
      const angle = -135 + ratio * 270;
      freqPointer.style.transform = `rotate(${angle}deg)`;
    }

    // Q Knob
    const qVal = card.querySelector('[data-param="q-val"]');
    const qPointer = card.querySelector('[data-knob="q"] .knob-pointer-line');
    if (qVal) qVal.textContent = band.q.toFixed(1);
    if (qPointer) {
      const qRatio = Math.min(1, Math.max(0, (band.q - 0.2) / 4.8));
      const angle = -135 + qRatio * 270;
      qPointer.style.transform = `rotate(${angle}deg)`;
    }

    // Gain Knob
    const gainVal = card.querySelector('[data-param="gain-val"]');
    const gainPointer = card.querySelector('[data-knob="gain"] .knob-pointer-line');
    if (gainVal) gainVal.textContent = (band.gain > 0 ? '+' : '') + band.gain.toFixed(1) + ' dB';
    if (gainPointer) {
      const gainRatio = (band.gain + 18) / 36;
      const angle = -135 + gainRatio * 270;
      gainPointer.style.transform = `rotate(${angle}deg)`;
    }
  }

  function initKnobsInteractions() {
    document.querySelectorAll('.knob-element').forEach(knob => {
      let isDragging = false;
      let startY = 0;
      let startVal = 0;

      const bandIndex = parseInt(knob.dataset.bandIndex, 10);
      const param = knob.dataset.param; // 'freq', 'q', 'gain'

      function onDown(e) {
        isDragging = true;
        startY = e.touches ? e.touches[0].clientY : e.clientY;
        const band = state.bands[bandIndex];
        startVal = band[param];
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
      }

      function onMove(e) {
        if (!isDragging) return;
        const currentY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaY = startY - currentY; // Up is positive
        const band = state.bands[bandIndex];

        if (param === 'gain') {
          band.gain = Math.max(-18, Math.min(18, parseFloat((startVal + deltaY * 0.25).toFixed(1))));
        } else if (param === 'q') {
          band.q = Math.max(0.2, Math.min(5.0, parseFloat((startVal + deltaY * 0.03).toFixed(1))));
        } else if (param === 'freq') {
          const factor = Math.pow(1.015, deltaY);
          band.freq = Math.max(20, Math.min(20000, Math.round(startVal * factor)));
        }

        updateFilterNode(bandIndex);
        updateKnobsUI(bandIndex);
        drawEqualizerCanvas();
      }

      function onUp() {
        if (isDragging) {
          isDragging = false;
          document.body.style.cursor = '';
        }
      }

      knob.addEventListener('mousedown', onDown);
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);

      knob.addEventListener('touchstart', onDown, { passive: false });
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    });
  }

  // =========================================================================
  // 6. OUTPUT VU METER & REAL-TIME ANIMATION LOOP
  // =========================================================================
  const meterFill = document.getElementById('meter-fill');
  const meterNum = document.getElementById('meter-num');
  const waveformCanvas = document.getElementById('waveform-canvas');
  let waveCtx = waveformCanvas ? waveformCanvas.getContext('2d') : null;

  function drawWaveform() {
    if (!waveformCanvas || !waveCtx) return;
    const w = waveformCanvas.getBoundingClientRect().width;
    const h = waveformCanvas.getBoundingClientRect().height;

    waveformCanvas.width = w * (window.devicePixelRatio || 1);
    waveformCanvas.height = h * (window.devicePixelRatio || 1);
    waveCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    waveCtx.clearRect(0, 0, w, h);

    // Render Audio Waveform Bars (Crimson Red & Dark Gray)
    const bars = 80;
    const barWidth = w / bars;
    const progress = state.currentTime / state.duration;

    for (let i = 0; i < bars; i++) {
      const ratio = i / bars;
      const played = ratio <= progress;
      const env = Math.sin((i / bars) * Math.PI);
      const rand = Math.sin(i * 0.45) * 0.4 + Math.cos(i * 0.8) * 0.3 + 0.5;
      const barH = Math.max(4, (h * 0.85) * env * rand);
      const x = i * barWidth + 1;
      const y = (h - barH) / 2;

      waveCtx.fillStyle = played ? '#E91E3F' : '#333333';
      waveCtx.fillRect(x, y, barWidth - 1.5, barH);
    }
  }

  function startAnimationLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    function tick() {
      // 1. Output VU Meter Calculation
      if (analyser && state.isPlaying) {
        const pcmData = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(pcmData);

        let sumSquares = 0.0;
        for (const amplitude of pcmData) {
          sumSquares += amplitude * amplitude;
        }
        const rms = Math.sqrt(sumSquares / pcmData.length);
        let db = 20 * Math.log10(rms || 0.0001);
        db = Math.max(-48, Math.min(0, db));

        if (meterNum) {
          meterNum.textContent = db.toFixed(1) + ' dB';
        }

        if (meterFill) {
          const pct = ((db + 48) / 48) * 100;
          meterFill.style.height = `${pct}%`;
        }

        // 2. Playback progress and waveform scrubber update
        if (audioCtx && beatAudioBuffer) {
          const elapsed = (audioCtx.currentTime - playbackStartTime) % beatAudioBuffer.duration;
          state.currentTime = elapsed;
          updatePlaybackProgressUI();
        }

        drawEqualizerCanvas();
      } else {
        if (meterFill) meterFill.style.height = '0%';
        if (meterNum) meterNum.textContent = '-∞ dB';
      }

      animFrameId = requestAnimationFrame(tick);
    }

    tick();
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function updatePlaybackProgressUI() {
    const cursor = document.getElementById('waveform-cursor');
    const bubble = document.getElementById('waveform-bubble');
    const timeDisplay = document.getElementById('track-time-display');

    const totalSeconds = 192; // 3:12
    const currentProgress = (state.currentTime % 10.66) / 10.66; // loop progress
    const simulatedElapsed = (currentProgress * totalSeconds);

    if (cursor) cursor.style.left = `${currentProgress * 100}%`;
    if (bubble) {
      bubble.style.left = `${currentProgress * 100}%`;
      bubble.textContent = formatTime(simulatedElapsed);
    }
    if (timeDisplay) {
      timeDisplay.textContent = `${formatTime(simulatedElapsed)} / 03:12`;
    }
  }

  // =========================================================================
  // 7. FILE UPLOAD & DRAG AND DROP
  // =========================================================================
  function initFileUpload() {
    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('audio-file-input');
    const demoBtn = document.getElementById('btn-load-demo');
    const removeBtn = document.getElementById('btn-remove-track');
    const trackCard = document.getElementById('track-playback-card');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', e => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleUserAudioFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', e => {
      if (e.target.files && e.target.files.length > 0) {
        handleUserAudioFile(e.target.files[0]);
      }
    });

    if (demoBtn) {
      demoBtn.addEventListener('click', e => {
        e.stopPropagation();
        loadDemoTrack();
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        state.userTrackLoaded = false;
        if (trackCard) trackCard.style.display = 'none';
        if (dropzone) dropzone.style.display = 'flex';
      });
    }
  }

  function handleUserAudioFile(file) {
    if (!file.type.includes('audio') && !file.name.match(/\.(mp3|wav|m4a|ogg)$/i)) {
      alert('Por favor, selecione um arquivo de áudio válido (MP3, WAV, M4A).');
      return;
    }

    initAudioContext();
    const reader = new FileReader();
    reader.onload = function (evt) {
      audioCtx.decodeAudioData(evt.target.result, function (buffer) {
        userAudioBuffer = buffer;
        state.userTrackLoaded = true;
        state.userFileName = file.name;
        state.userFileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB • ' + file.name.split('.').pop().toUpperCase();
        
        updateTrackCardUI();
        if (state.isPlaying) playAudio();
      }, function (err) {
        console.error('Erro ao decodificar áudio:', err);
        alert('Não foi possível ler este arquivo de áudio no navegador.');
      });
    };
    reader.readAsArrayBuffer(file);
  }

  function loadDemoTrack() {
    initAudioContext();
    generateRealisticDemoVocalBuffer();
    state.userTrackLoaded = true;
    state.userFileName = 'Vocal_Demo_Cm.mp3';
    state.userFileSize = '4.8 MB • MP3';
    updateTrackCardUI();
  }

  function updateTrackCardUI() {
    const trackCard = document.getElementById('track-playback-card');
    const dropzone = document.getElementById('upload-dropzone');
    const nameEl = document.getElementById('user-track-name');
    const metaEl = document.getElementById('user-track-meta');

    if (trackCard && dropzone) {
      trackCard.style.display = 'flex';
      nameEl.textContent = state.userFileName;
      metaEl.textContent = state.userFileSize;
    }
  }

  // =========================================================================
  // 8. PAYMENT & CHECKOUT LOGIC
  // =========================================================================
  function initPaymentSystem() {
    const pixChoice = document.getElementById('method-pix');
    const cardChoice = document.getElementById('method-card');
    const cardFields = document.getElementById('card-fields-box');
    const finalizeBtn = document.getElementById('btn-finalize-purchase');
    const couponInput = document.getElementById('coupon-code-input');
    const couponBtn = document.getElementById('btn-apply-coupon');
    const couponFeedback = document.getElementById('coupon-feedback');

    // Payment method selector
    if (pixChoice && cardChoice) {
      pixChoice.addEventListener('click', () => {
        state.selectedPaymentMethod = 'pix';
        pixChoice.classList.add('selected');
        cardChoice.classList.remove('selected');
        if (cardFields) cardFields.classList.remove('active');
      });

      cardChoice.addEventListener('click', () => {
        state.selectedPaymentMethod = 'card';
        cardChoice.classList.add('selected');
        pixChoice.classList.remove('selected');
        if (cardFields) cardFields.classList.add('active');
      });
    }

    // Coupon discount logic
    if (couponBtn && couponInput) {
      couponBtn.addEventListener('click', () => {
        const code = couponInput.value.trim().toUpperCase();
        if (code === 'WOAH20') {
          state.discount = 20.00;
          showCouponFeedback('Cupom WOAH20 aplicado! Desconto de R$ 20,00', true);
        } else if (code === 'PROD10' || code === 'BEAT10') {
          state.discount = state.basePrice * 0.10;
          showCouponFeedback(`Cupom ${code} aplicado! 10% de desconto`, true);
        } else if (code === '') {
          state.discount = 0;
          showCouponFeedback('Digite um código de cupom.', false);
        } else {
          state.discount = 0;
          showCouponFeedback('Cupom inválido ou expirado.', false);
        }
        updatePriceSummary();
      });
    }

    function showCouponFeedback(msg, isSuccess) {
      if (!couponFeedback) return;
      couponFeedback.textContent = msg;
      couponFeedback.className = 'coupon-feedback ' + (isSuccess ? 'success' : 'error');
    }

    function updatePriceSummary() {
      const discountRow = document.getElementById('summary-discount-row');
      const discountVal = document.getElementById('summary-discount-val');
      const totalVal = document.getElementById('summary-total-val');
      const finalPrice = Math.max(0, state.basePrice - state.discount);

      if (state.discount > 0) {
        if (discountRow) discountRow.style.display = 'flex';
        if (discountVal) discountVal.textContent = `-R$ ${state.discount.toFixed(2).replace('.', ',')}`;
      } else {
        if (discountRow) discountRow.style.display = 'none';
      }

      if (totalVal) {
        totalVal.textContent = `R$ ${finalPrice.toFixed(2).replace('.', ',')}`;
      }
    }

    // Card Input Masking
    const cardNumInput = document.getElementById('card-number-input');
    if (cardNumInput) {
      cardNumInput.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '').substring(0, 16);
        v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
        e.target.value = v;
      });
    }

    const cardExpiryInput = document.getElementById('card-expiry-input');
    if (cardExpiryInput) {
      cardExpiryInput.addEventListener('input', e => {
        let v = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2);
        e.target.value = v;
      });
    }

    // Finalize purchase button action
    if (finalizeBtn) {
      finalizeBtn.addEventListener('click', () => {
        finalizeBtn.classList.add('loading');
        finalizeBtn.innerHTML = 'Processando...';

        setTimeout(() => {
          finalizeBtn.classList.remove('loading');
          finalizeBtn.innerHTML = '🔒 Finalizar compra';
          openCheckoutModal();
        }, 600);
      });
    }
  }

  // Checkout Modal (PIX QR Code & Confirmation)
  function openCheckoutModal() {
    const modalBackdrop = document.getElementById('checkout-modal');
    if (!modalBackdrop) return;
    modalBackdrop.classList.add('active');

    // Countdown Timer 15:00
    let timerSeconds = 15 * 60;
    const timerDisplay = document.getElementById('pix-timer-num');
    const interval = setInterval(() => {
      timerSeconds--;
      if (timerSeconds <= 0) {
        clearInterval(interval);
      }
      const m = Math.floor(timerSeconds / 60);
      const s = timerSeconds % 60;
      if (timerDisplay) {
        timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
    }, 1000);

    // Copy Pix Code Button
    const copyBtn = document.getElementById('btn-copy-pix');
    const copyInput = document.getElementById('pix-copia-cola-input');
    if (copyBtn && copyInput) {
      copyBtn.addEventListener('click', () => {
        copyInput.select();
        navigator.clipboard.writeText(copyInput.value);
        copyBtn.textContent = 'Copiado!';
        setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 2000);
      });
    }

    // Simulate Payment Confirmation
    const simBtn = document.getElementById('btn-simulate-confirm');
    const initialBlock = document.getElementById('pix-modal-initial-block');
    const successBlock = document.getElementById('pix-modal-success-block');

    if (simBtn) {
      simBtn.addEventListener('click', () => {
        if (initialBlock) initialBlock.style.display = 'none';
        if (successBlock) successBlock.style.display = 'flex';
      });
    }

    // Close Modal Button
    const closeBtn = document.getElementById('btn-close-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modalBackdrop.classList.remove('active');
        clearInterval(interval);
      });
    }
  }

  // =========================================================================
  // 9. EVENT LISTENERS & DOM HOOKS
  // =========================================================================
  function initDOMBindings() {
    // Play/Pause transport buttons
    const playBtn = document.getElementById('transport-play-btn');
    if (playBtn) playBtn.addEventListener('click', togglePlayPause);

    const heroPlayBtn = document.getElementById('hero-play-btn');
    if (heroPlayBtn) heroPlayBtn.addEventListener('click', togglePlayPause);

    // Mobile Navigation Drawer Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');
    const mobileCloseBtn = document.getElementById('mobile-nav-close');
    if (mobileMenuBtn && mobileDrawer) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileDrawer.classList.add('open');
      });
    }
    if (mobileCloseBtn && mobileDrawer) {
      mobileCloseBtn.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
      });
    }
    if (mobileDrawer) {
      mobileDrawer.addEventListener('click', e => {
        if (e.target === mobileDrawer) {
          mobileDrawer.classList.remove('open');
        }
      });
    }

    // Reset EQ Button
    const resetBtn = document.getElementById('btn-reset-eq');
    if (resetBtn) resetBtn.addEventListener('click', resetEqualizer);

    // Mix Mode Toggles
    const mixBtns = document.querySelectorAll('.mix-toggle-btn');
    mixBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        mixBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.mixMode = btn.dataset.mixMode;
        updateMixGains();
      });
    });

    // Volume Slider
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', e => {
        state.volume = parseFloat(e.target.value);
        if (masterGain && audioCtx) {
          masterGain.gain.setValueAtTime(state.volume, audioCtx.currentTime);
        }
      });
    }

    // Waveform click seeking
    const waveContainer = document.getElementById('waveform-container');
    if (waveContainer) {
      waveContainer.addEventListener('click', e => {
        const rect = waveContainer.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        if (beatAudioBuffer) {
          startOffsetTime = ratio * beatAudioBuffer.duration;
          if (state.isPlaying) {
            playAudio();
          } else {
            state.currentTime = startOffsetTime;
            updatePlaybackProgressUI();
          }
        }
      });
    }

    // Loop toggle
    const loopBtn = document.getElementById('btn-loop-toggle');
    if (loopBtn) {
      loopBtn.addEventListener('click', () => {
        state.isLooping = !state.isLooping;
        loopBtn.classList.toggle('active', state.isLooping);
        if (beatSource) beatSource.loop = state.isLooping;
        if (userSource) userSource.loop = state.isLooping;
      });
    }

    // Window Resize for Canvas
    window.addEventListener('resize', () => {
      resizeCanvas();
      drawWaveform();
    });

    // Parse URL Parameters (support dynamic beat loading from loja-de-beats.html)
    const urlParams = new URLSearchParams(window.location.search);
    const beatName = urlParams.get('beat');
    const beatPrice = urlParams.get('price');
    if (beatName) {
      const titleEl = document.getElementById('beat-title-display');
      const summaryTitle = document.getElementById('summary-beat-title-display');
      if (titleEl) titleEl.textContent = beatName;
      if (summaryTitle) summaryTitle.textContent = beatName;
    }
    if (beatPrice) {
      const num = parseFloat(beatPrice);
      if (!isNaN(num)) {
        state.basePrice = num;
        const priceEl = document.getElementById('beat-price-display');
        const summaryPrice = document.getElementById('summary-beat-price-display');
        const subtotal = document.getElementById('summary-subtotal-val');
        const total = document.getElementById('summary-total-val');
        const formatted = `R$ ${num.toFixed(2).replace('.', ',')}`;
        if (priceEl) priceEl.textContent = formatted;
        if (summaryPrice) summaryPrice.textContent = formatted;
        if (subtotal) subtotal.textContent = formatted;
        if (total) total.textContent = formatted;
      }
    }
  }

  // =========================================================================
  // 10. DOM READY BOOTSTRAP
  // =========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    initDOMBindings();
    initFileUpload();
    initPaymentSystem();
    initKnobsInteractions();
    initCanvasInteractions();

    // Initial Knobs & Canvas Render
    state.bands.forEach((_, idx) => updateKnobsUI(idx));
    resizeCanvas();
    drawWaveform();
    startAnimationLoop();
  });

})();
