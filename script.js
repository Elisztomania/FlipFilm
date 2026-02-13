const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });  // Fix warning

const colorShift = document.getElementById('colorShift');
const shiftValue = document.getElementById('shiftValue');
const redSlider = document.getElementById('red');
const greenSlider = document.getElementById('green');
const blueSlider = document.getElementById('blue');
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');
const bwMode = document.getElementById('bwMode');

colorShift.addEventListener('input', () => shiftValue.textContent = colorShift.value);

// SAVE BUTTON - Ajouté
document.getElementById('captureBtn').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flipfilm.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
});

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      drawFrame();
    };
  } catch (err) {
    console.error('Cam err:', err);
    alert("Cam fail: " + err.message + " - Check HTTPS/permissions");
  }
}

function drawFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  let frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let data = frame.data;
  let shift = parseInt(colorShift.value || 0);
  let toBW = bwMode.checked;
  let redAdjustment = parseInt(redSlider.value || 0);
  let greenAdjustment = parseInt(greenSlider.value || 0);
  let blueAdjustment = parseInt(blueSlider.value || 0);
  let brightness = parseInt(brightnessSlider.value || 0);
  let contrast = parseInt(contrastSlider.value || 0);
  let saturation = parseInt(saturationSlider.value || 0);

  for (let i = 0; i < data.length; i += 4) {
    let r = 255 - data[i] + shift + redAdjustment;
    let g = 255 - data[i + 1] + shift + greenAdjustment;
    let b = 255 - data[i + 2] + shift + blueAdjustment;

    // MASQUE ORANGE C41
    let mask = (r + b - g) * 0.3;
    r = Math.min(255, r + mask);
    b = Math.min(255, b + mask);

    r = r * (contrast / 100 + 1) + brightness;
    g = g * (contrast / 100 + 1) + brightness;
    b = b * (contrast / 100 + 1) + brightness;

    if (toBW) {
      let gray = (r + g + b) / 3;
      r = g = b = gray;
    }
    if (saturation !== 0) {
      let avg = (r + g + b) / 3;
      r = avg + (r - avg) * (1 + saturation / 100);
      g = avg + (g - avg) * (1 + saturation / 100);
      b = avg + (b - avg) * (1 + saturation / 100);
    }

    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(frame, 0, 0);
  requestAnimationFrame(drawFrame);
}

startCamera();[file:12]
