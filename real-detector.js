/**
 * REAL DETECTOR - Camera OFF = NO DETECTION
 * Only detects when camera is actually ON and showing video
 */

(function() {
  console.log('🎯 REAL Detector Loading...');

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
  let smileTimes = [];
  let previousBrightness = null;
  let consecutiveBlackFrames = 0;

  /**
   * Check if camera is actually ON
   * Returns true only if video is playing and not black
   */
  function isCameraOn(imageData) {
    const pixels = imageData.data;
    let totalBrightness = 0;
    let nonZeroPixels = 0;

    // Sample every 10th pixel for speed
    for (let i = 0; i < pixels.length; i += 40) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      totalBrightness += brightness;
      if (brightness > 10) {
        nonZeroPixels++;
      }
    }

    const avgBrightness = totalBrightness / (pixels.length / 40);
    const nonZeroRatio = nonZeroPixels / (pixels.length / 40);

    // Camera is ON if:
    // 1. Average brightness > 20 (not completely black)
    // 2. At least 30% pixels are non-black
    const cameraOn = avgBrightness > 20 && nonZeroRatio > 0.3;

    if (!cameraOn) {
      consecutiveBlackFrames++;
    } else {
      consecutiveBlackFrames = 0;
    }

    return cameraOn;
  }

  /**
   * Process video frame with CAMERA CHECK
   */
  function processFrame() {
    if (!videoElement || !ctx || !isTracking) return;

    try {
      frameCount++;

      // Check if video is actually playing
      if (videoElement.paused || videoElement.ended) {
        if (frameCount % 50 === 0) {
          console.log('⚠️ Video is paused/ended - not processing');
        }
        return;
      }

      // Draw frame
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // CHECK IF CAMERA IS ON
      const cameraIsOn = isCameraOn(imageData);

      if (!cameraIsOn) {
        if (frameCount % 50 === 0) {
          console.log('📷 CAMERA OFF - No detection!', 'Black frames:', consecutiveBlackFrames);
        }
        return; // STOP PROCESSING - CAMERA IS OFF!
      }

      // Camera is ON - log occasionally
      if (frameCount % 100 === 0) {
        console.log('✅ Camera ON - Processing frame', frameCount);
      }

      const pixels = imageData.data;

      // Calculate brightness
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

          if (x >= faceLeft && x < faceRight && y >= faceTop && y < faceBottom) {
            faceRegionBrightness += brightness;
            facePixelCount++;
          }
        }
      }

      const avgBrightness = totalBrightness / (canvas.width * canvas.height);
      const avgFaceBrightness = faceRegionBrightness / facePixelCount;

      // BLINK DETECTION
      if (previousBrightness !== null) {
        const brightnessDelta = Math.abs(avgFaceBrightness - previousBrightness);

        // Significant brightness change = blink
        if (brightnessDelta > 8) {
          const now = Date.now();
          // Debounce: at least 150ms between blinks
          if (blinkTimes.length === 0 || now - blinkTimes[blinkTimes.length - 1] > 150) {
            blinkTimes.push(now);
            engagementData.blinks.total++;
            blinkTimes = blinkTimes.filter(t => t > now - 60000);
            engagementData.blinks.perMinute = blinkTimes.length;

            console.log('👁️ BLINK! Total:', engagementData.blinks.total, 'Rate:', engagementData.blinks.perMinute, '/min');
          }
        }
      }

      previousBrightness = avgFaceBrightness;

      // SMILE DETECTION
      // Only count as smile if face brightness is high (teeth showing)
      // AND brightness increased from previous state
      const isSmiling = avgFaceBrightness > 130;

      if (isSmiling && previousBrightness && avgFaceBrightness > previousBrightness + 5) {
        const now = Date.now();
        // Debounce: at least 1 second between smiles
        if (smileTimes.length === 0 || now - smileTimes[smileTimes.length - 1] > 1000) {
          smileTimes.push(now);
          engagementData.smile.count++;
          console.log('😊 SMILE! Total:', engagementData.smile.count);
        }
      }

      engagementData.smile.smiling = isSmiling;

      // LEAN DETECTION - based on face brightness (closer = brighter usually)
      if (avgFaceBrightness > 140) {
        engagementData.lean.direction = 'forward';
        engagementData.lean.confidence = Math.min(100, (avgFaceBrightness - 140) * 5);
      } else if (avgFaceBrightness < 100) {
        engagementData.lean.direction = 'backward';
        engagementData.lean.confidence = Math.min(100, (100 - avgFaceBrightness) * 5);
      } else {
        engagementData.lean.direction = 'neutral';
        engagementData.lean.confidence = 50;
      }

      // GAZE - assume stable if camera is on
      engagementData.gaze.stable = true;
      engagementData.screenAttention.looking = true;
      engagementData.screenAttention.score = 85;

      // LOG SUMMARY every 100 frames
      if (frameCount % 100 === 0) {
        console.log('═══════════════════════════════════');
        console.log('📊 DETECTION SUMMARY (Camera ON):');
        console.log('Blinks:', engagementData.blinks.perMinute, '/min (Total:', engagementData.blinks.total, ')');
        console.log('Smiles:', engagementData.smile.count);
        console.log('Lean:', engagementData.lean.direction);
        console.log('Avg Brightness:', avgBrightness.toFixed(2));
        console.log('═══════════════════════════════════');
      }

    } catch (error) {
      if (frameCount % 100 === 0) {
        console.error('❌ Frame error:', error);
      }
    }
  }

  /**
   * Setup video
   */
  async function setupVideo() {
    console.log('🎥 Searching for video...');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const videos = document.querySelectorAll('video');
    console.log(`Found ${videos.length} video elements`);

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      console.log(`Video ${i}: readyState=${video.readyState}, width=${video.videoWidth}, paused=${video.paused}`);

      if (video.readyState >= 2 && video.videoWidth > 0) {
        videoElement = video;
        console.log('✅ VIDEO SELECTED:', video.videoWidth, 'x', video.videoHeight);

        // Create canvas
        canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d', { willReadFrequently: true });

        console.log('✅ Canvas created');
        return true;
      }
    }

    console.warn('⚠️ No video found');
    return false;
  }

  /**
   * Start tracking
   */
  async function startTracking() {
    if (isTracking) return;

    console.log('🚀 Starting REAL detector (Camera check enabled)...');

    const videoReady = await setupVideo();
    if (!videoReady) {
      console.warn('⚠️ Retrying in 3s...');
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

    console.log('✅ REAL detector ACTIVE!');
    console.log('🔥 CAMERA OFF = NO DETECTION! 🔥');
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

  console.log('✅ REAL Detector Ready!');

})();
