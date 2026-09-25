/**
 * BEAT STORE — Audio State & Player
 * Máquina de estado global para reprodução de áudio.
 * Eventos emitidos: audio:play, audio:pause, audio:ended, audio:progress, audio:error
 */

let _audio = null;
let _currentBeat = null;
let _isPlaying = false;
let _progressInterval = null;

function getAudio() {
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = 'metadata';
    _bindEvents();
  }
  return _audio;
}

function emit(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function _bindEvents() {
  _audio.addEventListener('ended', () => {
    _isPlaying = false;
    emit('audio:ended', { beat: _currentBeat });
    emit('audio:statechange', { beat: _currentBeat, isPlaying: false });
    _stopProgressTracking();
  });

  _audio.addEventListener('error', () => {
    _isPlaying = false;
    emit('audio:error', { beat: _currentBeat });
    _stopProgressTracking();
  });

  _audio.addEventListener('loadedmetadata', () => {
    emit('audio:loaded', { beat: _currentBeat, duration: _audio.duration });
  });
}

function _startProgressTracking() {
  _stopProgressTracking();
  _progressInterval = setInterval(() => {
    if (!_audio || _audio.paused) return;
    emit('audio:progress', {
      beat: _currentBeat,
      currentTime: _audio.currentTime,
      duration: _audio.duration || 0,
      progress: _audio.duration ? (_audio.currentTime / _audio.duration) * 100 : 0,
    });
  }, 250);
}

function _stopProgressTracking() {
  if (_progressInterval) {
    clearInterval(_progressInterval);
    _progressInterval = null;
  }
}

// ─── API Pública ─────────────────────────────────────────────────────────────

/**
 * Reproduz um beat. Se for o mesmo beat, faz toggle play/pause.
 * @param {Beat} beat
 */
export async function play(beat) {
  const audio = getAudio();

  // Toggle se for o mesmo beat
  if (_currentBeat?.id === beat.id) {
    if (_isPlaying) {
      return pause();
    } else {
      await audio.play();
      _isPlaying = true;
      emit('audio:play', { beat });
      emit('audio:statechange', { beat, isPlaying: true });
      _startProgressTracking();
      return;
    }
  }

  // Novo beat
  _currentBeat = beat;
  audio.src = beat.preview || ''; // Se não houver preview, ficará mudo mas não quebrará

  try {
    await audio.play();
    _isPlaying = true;
    emit('audio:play', { beat });
    emit('audio:statechange', { beat, isPlaying: true });
    _startProgressTracking();
  } catch (err) {
    console.warn('[AudioState] Reprodução bloqueada pelo navegador:', err);
    emit('audio:error', { beat, err });
  }
}

/**
 * Pausa a reprodução
 */
export function pause() {
  if (!_audio) return;
  _audio.pause();
  _isPlaying = false;
  emit('audio:pause', { beat: _currentBeat });
  emit('audio:statechange', { beat: _currentBeat, isPlaying: false });
  _stopProgressTracking();
}

/**
 * Para e limpa o player
 */
export function stop() {
  if (!_audio) return;
  _audio.pause();
  _audio.currentTime = 0;
  _isPlaying = false;
  _currentBeat = null;
  emit('audio:statechange', { beat: null, isPlaying: false });
  _stopProgressTracking();
}

/**
 * Vai para um tempo específico (segundos)
 * @param {number} time
 */
export function seek(time) {
  if (!_audio) return;
  _audio.currentTime = Math.max(0, Math.min(time, _audio.duration || 0));
}

/**
 * Ajusta o volume (0 a 1)
 * @param {number} vol
 */
export function setVolume(vol) {
  if (!_audio) return;
  _audio.volume = Math.max(0, Math.min(1, vol));
}

/**
 * Retorna o beat atual
 * @returns {Beat|null}
 */
export function getCurrentBeat() { return _currentBeat; }

/**
 * Retorna se está tocando
 * @returns {boolean}
 */
export function isPlaying() { return _isPlaying; }

/**
 * Retorna se um beat específico está tocando
 * @param {string} beatId
 * @returns {boolean}
 */
export function isBeatPlaying(beatId) {
  return _isPlaying && _currentBeat?.id === beatId;
}
