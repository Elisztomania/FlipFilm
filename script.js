
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
        let g = 255 - data[i + 1] + shift + greenAdjustment;
        let b = 255 - data[i + 2] + shift + blueAdjustment;

        r = r * (contrast / 100 + 1) + brightness;
        g = g * (contrast / 100 + 1) + brightness;
        b = b * (contrast / 100 + 1) + brightness;

        if (toBW) {
          let gray = (r + g + b) / 3;
          r = g = b = gray;
        }

        if (saturation !== 0) {
          let avg = (r + g + b) / 3;
          r = avg + (r - avg) * (saturation / 100);
          g = avg + (g - avg) * (saturation / 100);
          b = avg + (b - avg) * (saturation / 100);
        }

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }

      ctx.putImageData(frame, 0, 0);
      requestAnimationFrame(drawFrame);
    }

    startCamera();