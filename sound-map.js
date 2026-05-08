const soundCanvas = document.getElementById('soundCanvas');
const soundWrap = document.getElementById('soundCanvasWrap');
const soundCursor = document.getElementById('soundCursor');
const unlockButton = document.getElementById('soundUnlock');
const soundStatus = document.getElementById('soundStatus');
const soundCaption = document.getElementById('soundCaption');
const hotspotElements = Array.from(document.querySelectorAll('.sound-hotspots path'));

const soundImage = new Image();
soundImage.src = 'img/full/emergence.jpg';
const soundContext = soundCanvas.getContext('2d');
const hotspotPaths = hotspotElements.map(path => ({
  element: path,
  shape: new Path2D(path.getAttribute('d'))
}));

let soundEnabled = false;
let activeHotspot = null;
let hoverTimer = null;
let lastPoint = null;
let pendingOrigin = null;
let currentAudio = null;

const sounds = new Map(
  hotspotElements.map(path => [
    path,
    new Audio(path.dataset.sound)
  ])
);

sounds.forEach(audio => {
  audio.preload = 'auto';
  audio.volume = 0.78;
});

function drawSoundImage() {
  soundContext.clearRect(0, 0, soundCanvas.width, soundCanvas.height);
  soundContext.drawImage(soundImage, 0, 0, soundCanvas.width, soundCanvas.height);
}

soundImage.addEventListener('load', drawSoundImage);

function getImagePoint(event) {
  const rect = soundCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * soundCanvas.width,
    y: ((event.clientY - rect.top) / rect.height) * soundCanvas.height,
    clientX: event.clientX,
    clientY: event.clientY
  };
}

function findHotspot(point) {
  for (let i = hotspotPaths.length - 1; i >= 0; i -= 1) {
    const hotspot = hotspotPaths[i];
    if (soundContext.isPointInPath(hotspot.shape, point.x, point.y)) {
      return hotspot.element;
    }
  }

  return null;
}

function setCaption(path) {
  if (!soundCaption || !path) return;

  const label = document.documentElement.lang === 'en' ? path.dataset.labelEn : path.dataset.labelPl;
  soundCaption.textContent = label ? `${label}` : soundCaption.dataset[document.documentElement.lang];
}

function clearHover() {
  window.clearTimeout(hoverTimer);
  hoverTimer = null;
  activeHotspot?.classList.remove('is-waiting');
  activeHotspot = null;
  pendingOrigin = null;
  soundCursor?.classList.remove('loading');
}

function playHotspot(path) {
  const audio = sounds.get(path);
  if (!audio || !soundEnabled) return;

  if (currentAudio && currentAudio !== audio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = audio;
  audio.currentTime = 0;
  audio.play().catch(() => {
    soundEnabled = false;
    if (soundStatus) {
      soundStatus.textContent = document.documentElement.lang === 'en'
        ? 'Click Enable sound again to let the browser play audio.'
        : 'Kliknij ponownie Włącz dźwięk, żeby przeglądarka pozwoliła odtwarzać audio.';
    }
  });
}

function scheduleHotspot(path) {
  if (!path || path === activeHotspot) return;

  clearHover();
  activeHotspot = path;
  pendingOrigin = lastPoint;
  path.classList.add('is-waiting');
  soundCursor?.classList.add('loading');
  setCaption(path);

  hoverTimer = window.setTimeout(() => {
    soundCursor?.classList.remove('loading');
    path.classList.remove('is-waiting');
    path.classList.remove('is-playing');
    void path.getBoundingClientRect();
    path.classList.add('is-playing');
    playHotspot(path);
  }, 1000);
}

hotspotElements.forEach(path => {
  path.addEventListener('animationend', () => {
    path.classList.remove('is-playing');
  });
});

soundWrap?.addEventListener('pointermove', event => {
  lastPoint = getImagePoint(event);

  if (soundCursor) {
    const wrapRect = soundWrap.getBoundingClientRect();
    soundCursor.style.left = `${event.clientX - wrapRect.left}px`;
    soundCursor.style.top = `${event.clientY - wrapRect.top}px`;
  }

  const hotspot = findHotspot(lastPoint);
  if (hotspot) {
    if (hotspot === activeHotspot && pendingOrigin) {
      const moved = Math.hypot(lastPoint.clientX - pendingOrigin.clientX, lastPoint.clientY - pendingOrigin.clientY);
      if (moved > 5) {
        activeHotspot = null;
        scheduleHotspot(hotspot);
      }
      return;
    }

    scheduleHotspot(hotspot);
  } else {
    clearHover();
  }
});

soundWrap?.addEventListener('pointerleave', clearHover);

unlockButton?.addEventListener('click', async () => {
  soundEnabled = true;

  for (const audio of sounds.values()) {
    audio.load();
  }

  if (soundStatus) {
    soundStatus.textContent = document.documentElement.lang === 'en'
      ? 'Sound is enabled. Hold still over the painting.'
      : 'Dźwięk jest włączony. Zatrzymaj kursor nad obrazem.';
  }

  unlockButton.textContent = document.documentElement.lang === 'en' ? 'Sound enabled' : 'Dźwięk włączony';
});
