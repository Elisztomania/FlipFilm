const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const colorShift    = document.getElementById('colorShift');
const shiftValue    = document.getElementById('shiftValue');
const redSlider     = document.getElementById('red');
const greenSlider   = document.getElementById('green');
const blueSlider    = document.getElementById('blue');
const brightnessSlider = document.getElementById('brightness');
const contrastSlider   = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');
const bwMode        = document.getElementById('bwMode');
const settingsPanel = document.getElementById('settingsPanel');
const settingsBtn   = document.getElementById('settingsBtn');
const resetBtn      = document.getElementById('resetBtn');
const captureBtn    = document.getElementById('captureBtn');
const flipBtn       = document.getElementById('flipBtn');

// Mise à jour label balance
colorShift.addEventListener('input', () => shiftValue.textContent = colorShift.value);

// ── Toggle panneau réglages ──
settingsBtn.addEventListener('click', () => {
  const open = settingsPanel.classList.toggle('open');
  settingsBtn.classList.toggle('active', open);
});

// Fermer en cliquant à l'extérieur du panneau
document.addEventListener('pointerdown', (e) => {
  if (settingsPanel.classList.contains('open') &&
      !settingsPanel.contains(e.target) &&
      e.target !== settingsBtn && !settingsBtn.contains(e.target)) {
    settingsPanel.classList.remove('open');
    settingsBtn.classList.remove('active');
  }
});

// ── Reset sliders ──
resetBtn.addEventListener('click', () => {
  [colorShift, redSlider, greenSlider, blueSlider,
   brightnessSlider, contrastSlider, saturationSlider].forEach(s => s.value = 0);
  shiftValue.textContent = '0';
  bwMode.checked = false;
});

// ── Capture avec flash visuel ──
captureBtn.addEventListener('click', async () => {
  // Flash feedback
  const flash = document.createElement('div');
  flash.className = 'flash-overlay';
  document.body.appendChild(flash);
  flash.addEventListener('animationend', () => flash.remove());

  canvas.toBlob(async (blob) => {
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], 'flipfilm.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'FlipFilm' });
          return;
        } catch (e) {
          if (e.name !== 'AbortError') console.warn('Share error:', e);
          return;
        }
      }
    }
    // Fallback desktop
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flipfilm.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png', 0.95);
});

// ── Caméra ──
let facingMode = 'environment';
let currentStream = null;

async function startCamera() {
  if (currentStream) currentStream.getTracks().forEach(t => t.stop());
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode } },
      audio: false
    });
    currentStream = stream;
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play().catch(e => console.log('Play:', e));
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };
  } catch (err) {
    console.error('Cam err:', err);
    alert("Erreur caméra : " + err.message);
  }
}

flipBtn.addEventListener('click', () => {
  facingMode = facingMode === 'environment' ? 'user' : 'environment';
  startCamera();
});

// ── Render loop ──
function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function drawFrame() {
  if (video.readyState >= 2) {
    // Adapter le canvas si la vidéo change de taille (rotation mobile)
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.drawImage(video, 0, 0);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data  = frame.data;

    const shift         = parseInt(colorShift.value)     || 0;
    const toBW          = bwMode.checked;
    const redAdj        = parseInt(redSlider.value)       || 0;
    const greenAdj      = parseInt(greenSlider.value)     || 0;
    const blueAdj       = parseInt(blueSlider.value)      || 0;
    const brightness    = parseInt(brightnessSlider.value)|| 0;
    const contrast      = parseInt(contrastSlider.value)  || 0;
    const saturation    = parseInt(saturationSlider.value)|| 0;
    const contrastFactor  = contrast / 100 + 1;
    const saturationFactor = 1 + saturation / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = 255 - data[i]   + shift + redAdj;
      let g = 255 - data[i+1] + shift + greenAdj;
      let b = 255 - data[i+2] + shift + blueAdj;

      // Masque orange C41
      const mask = (r + b - g) * 0.3;
      r += mask;
      b += mask;

      r = clamp(r * contrastFactor + brightness, 0, 255);
      g = clamp(g * contrastFactor + brightness, 0, 255);
      b = clamp(b * contrastFactor + brightness, 0, 255);

      if (toBW) {
        const gray = (r + g + b) / 3;
        r = g = b = gray;
      }

      if (saturation !== 0) {
        const avg = (r + g + b) / 3;
        r = clamp(avg + (r - avg) * saturationFactor, 0, 255);
        g = clamp(avg + (g - avg) * saturationFactor, 0, 255);
        b = clamp(avg + (b - avg) * saturationFactor, 0, 255);
      }

      data[i]   = r;
      data[i+1] = g;
      data[i+2] = b;
    }

    ctx.putImageData(frame, 0, 0);
  }

  requestAnimationFrame(drawFrame);
}

startCamera();
drawFrame();
