/**
 * SENSITIVE DETECTOR - Better blink/smile detection
 * User says lean works but blink/smile not detecting
 */

(function() {
  console.log('🎯 SENSITIVE Detector Loading...');

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

  // Track pixel changes for blink detection
  let previousEyeRegionPixels = null;
  let previousMouthRegionPixels = null;
  let previousFaceBrightness = null;

  /**
   * Check if camera is ON
   */
  function isCameraOn(imageData) {
    const pixels = imageData.data;
    let totalBrightness = 0;
    let nonZeroPixels = 0;

    for (let i = 0; i < pixels.length; i += 40) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      totalBrightness += brightness;
      if (brightness > 10) nonZeroPixels++;
    }

    const avgBrightness = totalBrightness / (pixels.length / 40);
    const nonZeroRatio = nonZeroPixels / (pixels.length / 40);

    return avgBrightness > 20 && nonZeroRatio > 0.3;
  }

  /**
   * Extract region pixels
   */
  function getRegionBrightness(pixels, width, height, region) {
    let totalBrightness = 0;
    let pixelCount = 0;

    for (let y = region.top; y < region.bottom; y++) {
      for (let x = region.left; x < region.right; x++) {
        const idx = (y * width + x) * 4;
        const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        totalBrightness += brightness;
        pixelCount++;
      }
    }

    return totalBrightness / pixelCount;
  }

  /**
   * IMPROVED BLINK DETECTION
   * Detects ANY brightness change in eye region
   */
  function detectBlinks(pixels, width, height) {
    // Eye region - upper middle of frame
    const eyeRegion = {
      left: Math.floor(width * 0.35),
      right: Math.floor(width * 0.65),
      top: Math.floor(height * 0.3),
      bottom: Math.floor(height * 0.45)
    };

    const eyeBrightness = getRegionBrightness(pixels, width, height, eyeRegion);

    if (previousEyeRegionPixels !== null) {
      const brightnessDelta = Math.abs(eyeBrightness - previousEyeRegionPixels);

      // VERY SENSITIVE - even small changes
      if (brightnessDelta > 3) {
        const now = Date.now();

        // Debounce 100ms
        if (blinkTimes.length === 0 || now - blinkTimes[blinkTimes.length - 1] > 100) {
          blinkTimes.push(now);
          engagementData.blinks.total++;
          blinkTimes = blinkTimes.filter(t => t > now - 60000);
          engagementData.blinks.perMinute = blinkTimes.length;

          console.log('👁️👁️👁️ BLINK DETECTED!', 'Total:', engagementData.blinks.total, 'Rate:', engagementData.blinks.perMinute, '/min', 'Delta:', brightnessDelta.toFixed(2));
        }
      }

      // Log brightness changes for debugging
      if (frameCount % 20 === 0) {
        console.log('Eyes delta:', brightnessDelta.toFixed(2), 'Current:', eyeBrightness.toFixed(2));
      }
    }

    previousEyeRegionPixels = eyeBrightness;
  }

  /**
   * IMPROVED SMILE DETECTION
   * Detects mouth opening/widening
   */
  function detectSmile(pixels, width, height) {
    // Mouth region - lower middle of frame
    const mouthRegion = {
      left: Math.floor(width * 0.4),
      right: Math.floor(width * 0.6),
      top: Math.floor(height * 0.6),
      bottom: Math.floor(height * 0.75)
    };

    const mouthBrightness = getRegionBrightness(pixels, width, height, mouthRegion);

    if (previousMouthRegionPixels !== null) {
      const brightnessDelta = mouthBrightness - previousMouthRegionPixels;

      // Mouth brighter = teeth showing = smile
      // OR significant brightness increase
      if (mouthBrightness > 120 || brightnessDelta > 5) {
        const now = Date.now();

        // Debounce 500ms for smiles
        if (smileTimes.length === 0 || now - smileTimes[smileTimes.length - 1] > 500) {
          smileTimes.push(now);
          engagementData.smile.count++;
          engagementData.smile.smiling = true;

          console.log('😊😊😊 SMILE DETECTED!', 'Total:', engagementData.smile.count, 'Brightness:', mouthBrightness.toFixed(2), 'Delta:', brightnessDelta.toFixed(2));
        }
      } else {
        engagementData.smile.smiling = false;
      }

      // Log mouth brightness for debugging
      if (frameCount % 20 === 0) {
        console.log('Mouth brightness:', mouthBrightness.toFixed(2), 'Delta:', brightnessDelta.toFixed(2));
      }
    }

    previousMouthRegionPixels = mouthBrightness;
  }

  /**
   * LEAN DETECTION (already working)
   */
  function detectLean(pixels, width, height) {
    // Face region brightness
    const faceRegion = {
      left: Math.floor(width * 0.3),
      right: Math.floor(width * 0.7),
      top: Math.floor(height * 0.2),
      bottom: Math.floor(height * 0.7)
    };

    const faceBrightness = getRegionBrightness(pixels, width, height, faceRegion);

    if (previousFaceBrightness !== null) {
      const diff = faceBrightness - previousFaceBrightness;

      if (diff > 5) {
        engagementData.lean.direction = 'forward';
        engagementData.lean.confidence = Math.min(100, Math.abs(diff) * 10);
      } else if (diff < -5) {
        engagementData.lean.direction = 'backward';
        engagementData.lean.confidence = Math.min(100, Math.abs(diff) * 10);
      } else {
        engagementData.lean.direction = 'neutral';
        engagementData.lean.confidence = 50;
      }
    }

    previousFaceBrightness = previousFaceBrightness ? previousFaceBrightness * 0.9 + faceBrightness * 0.1 : faceBrightness;
  }

  /**
   * Process frame
   */
  function processFrame() {
    if (!videoElement || !ctx || !isTracking) return;

    try {
      frameCount++;

      // Check if video playing
      if (videoElement.paused || videoElement.ended) {
        if (frameCount % 50 === 0) {
          console.log('⚠️ Video paused/ended');
        }
        return;
      }

      // Draw frame
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Check camera ON
      if (!isCameraOn(imageData)) {
        if (frameCount % 50 === 0) {
          console.log('📷 CAMERA OFF');
        }
        return;
      }

      const pixels = imageData.data;

      // Run detections
      detectBlinks(pixels, canvas.width, canvas.height);
      detectSmile(pixels, canvas.width, canvas.height);
      detectLean(pixels, canvas.width, canvas.height);

      // Summary every 50 frames
      if (frameCount % 50 === 0) {
        console.log('═══════════════════════════════════');
        console.log('📊 DETECTION STATUS:');
        console.log('Blinks:', engagementData.blinks.perMinute, '/min (Total:', engagementData.blinks.total, ')');
        console.log('Smiles:', engagementData.smile.count, 'Smiling:', engagementData.smile.smiling);
        console.log('Lean:', engagementData.lean.direction, '(' + engagementData.lean.confidence + '%)');
        console.log('═══════════════════════════════════');
      }

    } catch (error) {
      console.error('Frame error:', error);
    }
  }

  /**
   * Setup video
   */
  async function setupVideo() {
    console.log('🎥 Finding video...');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const videos = document.querySelectorAll('video');
    console.log('Videos found:', videos.length);

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      if (video.readyState >= 2 && video.videoWidth > 0) {
        videoElement = video;
        console.log('✅ VIDEO:', video.videoWidth, 'x', video.videoHeight);

        canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d', { willReadFrequently: true });

        return true;
      }
    }

    console.warn('⚠️ No video');
    return false;
  }

  /**
   * Start tracking
   */
  async function startTracking() {
    if (isTracking) return;

    console.log('🚀 Starting SENSITIVE detector...');
    console.log('Blink threshold: 3 (very sensitive)');
    console.log('Smile threshold: 120 brightness OR +5 delta');

    const videoReady = await setupVideo();
    if (!videoReady) {
      setTimeout(startTracking, 3000);
      return;
    }

    isTracking = true;

    // Process at 10 FPS
    setInterval(() => {
      if (isTracking) processFrame();
    }, 100);

    console.log('✅ SENSITIVE detector ACTIVE!');
    console.log('🔥 BLINK KARO - Console mai "👁️👁️👁️ BLINK DETECTED!" dikhega!');
    console.log('🔥 SMILE KARO - Console mai "😊😊😊 SMILE DETECTED!" dikhega!');
  }

  /**
   * Stop tracking
   */
  function stopTracking() {
    isTracking = false;
  }

  /**
   * Get data
   */
  function getData() {
    return engagementData;
  }

  // Export
  window.visualTracker = {
    start: startTracking,
    stop: stopTracking,
    getData: getData
  };

  console.log('✅ SENSITIVE Detector Ready!');

})();
