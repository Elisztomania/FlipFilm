
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const colorShift = document.getElementById('colorShift');
    const shiftValue = document.getElementById('shiftValue');
    const redSlider = document.getElementById('red');
    const greenSlider = document.getElementById('green');
    const blueSlider = document.getElementById('blue');
    const brightnessSlider = document.getElementById('brightness');
    const contrastSlider = document.getElementById('contrast');
    const saturationSlider = document.getElementById('saturation');
    const bwMode = document.getElementById('bwMode');

    colorShift.addEventListener('input', () => {
      shiftValue.textContent = colorShift.value;
    });

    document.getElementById('captureBtn').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flipfilm-preview.png';  // Nom auto avec timestamp si tu veux
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png', 0.95);  // Qualité haute PNG pour couleurs
});

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video.play();
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          drawFrame();
        };
      } catch (err) {
        alert("Erreur d'accès à la caméra : " + err.message);
      }
    }

    function drawFrame() {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      let frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = frame.data;
      let shift = parseInt(colorShift.value);
      let toBW = bwMode.checked;

      let redAdjustment = parseInt(redSlider.value);
      let greenAdjustment = parseInt(greenSlider.value);
      let blueAdjustment = parseInt(blueSlider.value);

      let brightness = parseInt(brightnessSlider.value);
      let contrast = parseInt(contrastSlider.value);
      let saturation = parseInt(saturationSlider.value);

      for (let i = 0; i < data.length; i += 4) {
        let r = 255 - data[i] + shift + redAdjustment;
        let g = 255 - data[i+1] + shift + greenAdjustment;
        let b = 255 - data[i+2] + shift + blueAdjustment;
        
        // Masque orange C41: boost magenta (R+B)/G
        let mask = (r + b - g) * 0.3;  // Ajuste 0.3 si trop/ pas assez
        r = Math.min(255, r + mask);
        b = Math.min(255, b + mask);
        
        // Brightness/contrast/sat comme avant
        r = (r / 255 - 0.5) * (contrast / 100 + 1) + 0.5 + brightness / 100;
        g = (g / 255 - 0.5) * (contrast / 100 + 1) + 0.5 + brightness / 100;
        b = (b / 255 - 0.5) * (contrast / 100 + 1) + 0.5 + brightness / 100;
        
        if (toBW) {
          let gray = (r * 0.3 + g * 0.59 + b * 0.11);
          r = g = b = gray;
        }
        if (saturation !== 0) {
          let avg = (r + g + b) / 3;
          r = avg + (r - avg) * (1 + saturation / 100);
          g = avg + (g - avg) * (1 + saturation / 100);
          b = avg + (b - avg) * (1 + saturation / 100);
        }
        
        data[i] = Math.min(255, Math.max(0, r));
        data[i+1] = Math.min(255, Math.max(0, g));
        data[i+2] = Math.min(255, Math.max(0, b));
      }

      ctx.putImageData(frame, 0, 0);
      requestAnimationFrame(drawFrame);
    }

    startCamera();