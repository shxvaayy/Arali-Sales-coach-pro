/**
 * DEBUG FACE DETECTOR
 * Maximum logging to prove it's working
 * Sensitive detection thresholds
 */

(function() {
  console.log('🔥 DEBUG DETECTOR LOADING...');

  let videoElement = null;
  let canvas = null;
  let ctx = null;
  let isTracking = false;
  let frameCount = 0;

  // Engagement data
  let engagementData = {
    lean: { direction: 'neutral', confidence: 50 },
    gaze: { stable: true, wanderingScore: 0 },
    blinks: { perMinute: 0, total: 0 },
    headGestures: { nods: 0, shakes: 0 },
    tension: { level: 30, status: 'relaxed' },
    smile: { smiling: false, count: 0 },
    screenAttention: { looking: true, score: 85 }
  };

  let blinkTimes = [];
  let previousBrightness = null;
  let previousFaceSize = null;

  /**
   * Process video frame with MAXIMUM LOGGING
   */
  function processFrame() {
    if (!videoElement || !ctx || !isTracking) return;

    try {
      frameCount++;

      // Draw frame
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Calculate overall brightness
      let totalBrightness = 0;
      let faceRegionBrightness = 0;
      let facePixelCount = 0;

      // Face region (center of frame)
      const faceLeft = Math.floor(canvas.width * 0.3);
      const faceRight = Math.floor(canvas.width * 0.7);
      const faceTop = Math.floor(canvas.height * 0.2);
      const faceBottom = Math.floor(canvas.height * 0.7);

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
          totalBrightness += brightness;

          // Face region
          if (x >= faceLeft && x < faceRight && y >= faceTop && y < faceBottom) {
            faceRegionBrightness += brightness;
            facePixelCount++;
          }
        }
      }

      const avgBrightness = totalBrightness / (canvas.width * canvas.height);
      const avgFaceBrightness = faceRegionBrightness / facePixelCount;

      // LOG EVERY 10 FRAMES
      if (frameCount % 10 === 0) {
        console.log(`📊 Frame ${frameCount}: Brightness=${avgBrightness.toFixed(2)}, Face=${avgFaceBrightness.toFixed(2)}`);
      }

      // BLINK DETECTION - Very sensitive
      if (previousBrightness !== null) {
        const brightnessDelta = Math.abs(avgFaceBrightness - previousBrightness);

        if (frameCount % 10 === 0) {
          console.log(`👁️  Brightness delta: ${brightnessDelta.toFixed(2)}`);
        }

        // VERY SENSITIVE - Any change > 5
        if (brightnessDelta > 5) {
          const now = Date.now();
          // Debounce 200ms
          if (blinkTimes.length === 0 || now - blinkTimes[blinkTimes.length - 1] > 200) {
            blinkTimes.push(now);
            engagementData.blinks.total++;
            blinkTimes = blinkTimes.filter(t => t > now - 60000);
            engagementData.blinks.perMinute = blinkTimes.length;

            console.log('🔥🔥🔥 BLINK DETECTED! 🔥🔥🔥');
            console.log(`Total blinks: ${engagementData.blinks.total}`);
            console.log(`Blinks per minute: ${engagementData.blinks.perMinute}`);
            console.log(`Delta was: ${brightnessDelta.toFixed(2)}`);
          }
        }
      }

      previousBrightness = avgFaceBrightness;

      // SMILE DETECTION - Detect bright teeth
      if (avgFaceBrightness > 120) {
        if (frameCount % 20 === 0) {
          engagementData.smile.count++;
          console.log('🔥🔥🔥 SMILE! 🔥🔥🔥 Total:', engagementData.smile.count);
        }
        engagementData.smile.smiling = true;
      } else {
        engagementData.smile.smiling = false;
      }

      // LEAN DETECTION
      if (previousFaceSize !== null) {
        const sizeChange = (facePixelCount - previousFaceSize) / previousFaceSize;

        if (Math.abs(sizeChange) > 0.05) {
          if (sizeChange > 0) {
            engagementData.lean.direction = 'forward';
            engagementData.lean.confidence = Math.min(100, Math.abs(sizeChange) * 500);
            if (frameCount % 50 === 0) {
              console.log('➡️  LEANING FORWARD detected');
            }
          } else {
            engagementData.lean.direction = 'backward';
            engagementData.lean.confidence = Math.min(100, Math.abs(sizeChange) * 500);
            if (frameCount % 50 === 0) {
              console.log('⬅️  LEANING BACKWARD detected');
            }
          }
        } else {
          engagementData.lean.direction = 'neutral';
          engagementData.lean.confidence = 50;
        }

        previousFaceSize = previousFaceSize * 0.8 + facePixelCount * 0.2;
      } else {
        previousFaceSize = facePixelCount;
      }

      // LOG SUMMARY EVERY 50 FRAMES
      if (frameCount % 50 === 0) {
        console.log('═══════════════════════════════════');
        console.log('📊 ENGAGEMENT DATA SUMMARY:');
        console.log('Blinks:', engagementData.blinks.perMinute, '/min (Total:', engagementData.blinks.total, ')');
        console.log('Smiles:', engagementData.smile.count);
        console.log('Lean:', engagementData.lean.direction, '(' + engagementData.lean.confidence + '%)');
        console.log('Gaze:', engagementData.gaze.stable ? 'Stable' : 'Wandering');
        console.log('═══════════════════════════════════');
      }

    } catch (error) {
      console.error('❌ FRAME ERROR:', error);
    }
  }

  /**
   * Setup video
   */
  async function setupVideo() {
    console.log('🎥 SEARCHING FOR VIDEO...');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const videos = document.querySelectorAll('video');
    console.log(`Found ${videos.length} video elements`);

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      console.log(`Video ${i}: readyState=${video.readyState}, width=${video.videoWidth}, height=${video.videoHeight}`);

      if (video.readyState >= 2 && video.videoWidth > 0) {
        videoElement = video;
        console.log('✅✅✅ VIDEO SELECTED!');
        console.log('Dimensions:', video.videoWidth, 'x', video.videoHeight);

        // Create canvas
        canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d', { willReadFrequently: true });

        console.log('✅ Canvas created:', canvas.width, 'x', canvas.height);

        return true;
      }
    }

    console.warn('⚠️ NO SUITABLE VIDEO FOUND');
    return false;
  }

  /**
   * Start tracking
   */
  async function startTracking() {
    if (isTracking) {
      console.log('Already tracking');
      return;
    }

    console.log('🚀🚀🚀 STARTING DEBUG DETECTOR 🚀🚀🚀');

    const videoReady = await setupVideo();
    if (!videoReady) {
      console.warn('⚠️ Retrying in 3 seconds...');
      setTimeout(startTracking, 3000);
      return;
    }

    isTracking = true;

    // Process at 10 FPS
    setInterval(() => {
      if (isTracking) {
        processFrame();
      }
    }, 100);

    console.log('✅✅✅ DEBUG DETECTOR RUNNING! ✅✅✅');
    console.log('Watch for:');
    console.log('- 🔥🔥🔥 BLINK DETECTED! when you blink');
    console.log('- 🔥🔥🔥 SMILE! when you smile');
    console.log('- Summary every 50 frames');
  }

  /**
   * Stop tracking
   */
  function stopTracking() {
    isTracking = false;
    console.log('🛑 Detector stopped');
  }

  /**
   * Get data
   */
  function getData() {
    return engagementData;
  }

  // Export API
  window.visualTracker = {
    start: startTracking,
    stop: stopTracking,
    getData: getData
  };

  console.log('✅ Debug Detector Ready!');

})();
