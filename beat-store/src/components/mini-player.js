/**
 * BEAT STORE — MiniPlayer Component
 * Player global fixado no rodapé. Persiste durante a navegação.
 * Reage ao AudioState via eventos.
 */

import { pause, play, seek, setVolume, getCurrentBeat, isPlaying } from '../state/audio.state.js';

let _playerEl = null;
let _progressFill = null;
let _currentTimeEl = null;
let _durationEl = null;
let _playBtn = null;
let _coverEl = null;
let _titleEl = null;
let _genreEl = null;

export function renderMiniPlayer(containerSelector = '#mini-player-container') {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = `
    <div class="mini-player" id="mini-player" role="region" aria-label="Player de áudio">
      <!-- Capa + Info -->
      <img
        src=""
        alt=""
        class="mini-player-cover"
        id="mini-player-cover"
        aria-hidden="true"
      />
      <div class="mini-player-info">
        <div class="mini-player-title" id="mini-player-title">—</div>
        <div class="mini-player-genre" id="mini-player-genre">—</div>
      </div>

      <!-- Waveform (decorativo) -->
      <div class="waveform" aria-hidden="true">
        <span class="waveform-bar"></span>
        <span class="waveform-bar"></span>
        <span class="waveform-bar"></span>
        <span class="waveform-bar"></span>
        <span class="waveform-bar"></span>
      </div>

      <!-- Controles -->
      <div class="mini-player-controls">
        <button type="button" class="mini-player-btn" id="mini-prev-btn" aria-label="Beat anterior" title="Anterior">⏮</button>

        <button
          type="button"
          class="mini-player-play-btn"
          id="mini-play-btn"
          aria-label="Reproduzir / Pausar"
        >▶</button>

        <button type="button" class="mini-player-btn" id="mini-next-btn" aria-label="Próximo beat" title="Próximo">⏭</button>
      </div>

      <!-- Progresso -->
      <div class="mini-player-progress" role="group" aria-label="Progresso da reprodução">
        <div
          class="progress-bar-track"
          id="mini-progress-track"
          role="slider"
          aria-label="Progresso"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="0"
          tabindex="0"
        >
          <div class="progress-bar-fill" id="mini-progress-fill"></div>
        </div>
        <div class="progress-bar-times">
          <span id="mini-current-time">0:00</span>
          <span id="mini-duration">0:00</span>
        </div>
      </div>

      <!-- Volume -->
      <div class="mini-player-volume">
        <span aria-hidden="true">🔊</span>
        <input
          type="range"
          class="volume-slider"
          id="mini-volume-slider"
          min="0"
          max="1"
          step="0.05"
          value="0.8"
          aria-label="Volume"
        />
      </div>

      <!-- Fechar -->
      <button type="button" class="mini-player-btn" id="mini-close-btn" aria-label="Fechar player">✕</button>
    </div>
  `;

  _playerEl     = container.querySelector('#mini-player');
  _progressFill = container.querySelector('#mini-progress-fill');
  _currentTimeEl = container.querySelector('#mini-current-time');
  _durationEl   = container.querySelector('#mini-duration');
  _playBtn      = container.querySelector('#mini-play-btn');
  _coverEl      = container.querySelector('#mini-player-cover');
  _titleEl      = container.querySelector('#mini-player-title');
  _genreEl      = container.querySelector('#mini-player-genre');

  _bindEvents(container);
  _bindAudioEvents();

  // Restaurar estado se já houver beat tocando (ex: navegação entre páginas)
  const current = getCurrentBeat();
  if (current) {
    _updateBeatInfo(current);
    _playerEl.classList.add('is-active');
    if (isPlaying()) {
      _playerEl.classList.add('is-playing');
      _playBtn.textContent = '⏸';
    }
  }
}

// ─── UI Updates ───────────────────────────────────────────────────────────────

function _updateBeatInfo(beat) {
  if (!_playerEl) return;
  if (_coverEl) { _coverEl.src = beat.cover; _coverEl.alt = beat.title; }
  if (_titleEl) _titleEl.textContent = beat.title;
  if (_genreEl) _genreEl.textContent = `${beat.genre} · ${beat.bpm} BPM`;
}

function _updateProgress(currentTime, duration, progress) {
  if (_progressFill) _progressFill.style.width = `${progress}%`;
  const track = _playerEl?.querySelector('#mini-progress-track');
  if (track) track.setAttribute('aria-valuenow', Math.round(progress));
  if (_currentTimeEl) _currentTimeEl.textContent = _formatTime(currentTime);
  if (_durationEl && duration) _durationEl.textContent = _formatTime(duration);
}

function _formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Event Binding ────────────────────────────────────────────────────────────

function _bindEvents(container) {
  // Play/Pause
  const playBtn = container.querySelector('#mini-play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      const current = getCurrentBeat();
      if (current) play(current);
    });
  }

  // Fechar player
  const closeBtn = container.querySelector('#mini-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      pause();
      _playerEl?.classList.remove('is-active', 'is-playing');
    });
  }

  // Clique na barra de progresso
  const track = container.querySelector('#mini-progress-track');
  if (track) {
    track.addEventListener('click', (e) => {
      const rect = track.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const audio = document.querySelector('audio');
      if (audio?.duration) seek(audio.duration * ratio);
    });

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') seek((window._audioCurrentTime || 0) + 5);
      if (e.key === 'ArrowLeft')  seek(Math.max(0, (window._audioCurrentTime || 0) - 5));
    });
  }

  // Volume
  const volumeSlider = container.querySelector('#mini-volume-slider');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      setVolume(parseFloat(volumeSlider.value));
    });
  }
}

function _bindAudioEvents() {
  window.addEventListener('audio:play', ({ detail }) => {
    if (!_playerEl) return;
    _updateBeatInfo(detail.beat);
    _playerEl.classList.add('is-active', 'is-playing');
    if (_playBtn) _playBtn.textContent = '⏸';
    if (_playBtn) _playBtn.setAttribute('aria-label', 'Pausar');
  });

  window.addEventListener('audio:pause', () => {
    if (!_playerEl) return;
    _playerEl.classList.remove('is-playing');
    if (_playBtn) _playBtn.textContent = '▶';
    if (_playBtn) _playBtn.setAttribute('aria-label', 'Reproduzir');
  });

  window.addEventListener('audio:ended', () => {
    if (!_playerEl) return;
    _playerEl.classList.remove('is-playing');
    if (_playBtn) _playBtn.textContent = '▶';
    _updateProgress(0, null, 0);
  });

  window.addEventListener('audio:progress', ({ detail }) => {
    window._audioCurrentTime = detail.currentTime;
    _updateProgress(detail.currentTime, detail.duration, detail.progress);
  });
}
