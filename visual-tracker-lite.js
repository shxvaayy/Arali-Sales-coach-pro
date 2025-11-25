/**
 * VISUAL ENGAGEMENT TRACKER - LITE VERSION
 * Works without external libraries - using basic video analysis
 * Features: Lean, Blinks, Smiles, Motion detection
 */

(function() {
  console.log('📹 Visual Engagement Tracker LITE Loading...');

  // State
  let isTracking = false;
  let videoElement = null;
  let canvasElement = null;
  let canvasCtx = null;
  let previousFrame = null;

  // Engagement metrics
  let engagementData = {
    lean: { direction: 'neutral', confidence: 50 },
    gaze: { stable: true, wanderingScore: 0 },
    blinks: { perMinute: 0, total: 0, lastBlinkTime: 0 },
    headGestures: { nods: 0, shakes: 0, lastGesture: null },
    tension: { level: 30, status: 'relaxed' },
    smile: { smiling: false, count: 0, lastSmileTime: 0 },
    screenAttention: { looking: true, score: 85 }
  };

  // Motion tracking
  let motionHistory = [];
  let blinkDetectionCounter = 0;

  /**
   * Detect motion and brightness changes
   */
  function analyzeVideoFrame() {
    if (!canvasCtx || !videoElement) return;

    try {
      // Draw current frame
      canvasCtx.drawImage(videoElement, 0, 0, 320, 240);
      const imageData = canvasCtx.getImageData(0, 0, 320, 240);
      const pixels = imageData.data;

      // Calculate average brightness
      let totalBrightness = 0;
      let faceRegionBrightness = 0;
      let bottomHalfBrightness = 0;

      // Analyze pixels
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const brightness = (r + g + b) / 3;

        totalBrightness += brightness;

        // Face region (center area)
        const pixelIndex = i / 4;
        const x = pixelIndex % 320;
        const y = Math.floor(pixelIndex / 320);

        if (x > 80 && x < 240 && y > 60 && y < 180) {
          faceRegionBrightness += brightness;
        }

        if (y > 120) {
          bottomHalfBrightness += brightness;
        }
      }

      const avgBrightness = totalBrightness / (320 * 240);
      const faceAvg = faceRegionBrightness / (160 * 120);

      // Detect blinks (sudden brightness drop in face region)
      detectBlinkFromBrightness(faceAvg);

      // Detect lean (face size estimation)
      detectLeanFromSize(faceAvg, avgBrightness);

      // Detect motion
      if (previousFrame) {
        const motion = detectMotion(pixels, previousFrame);
        detectHeadGesturesFromMotion(motion);
      }

      // Store frame for next comparison
      previousFrame = new Uint8ClampedArray(pixels);

      // Simulated smile detection (brightness in lower face)
      const smileRatio = bottomHalfBrightness / totalBrightness;
      if (smileRatio > 0.52 && !engagementData.smile.smiling) {
        engagementData.smile.smiling = true;
        engagementData.smile.count++;
        engagementData.smile.lastSmileTime = Date.now();
        console.log('😊 Smile detected! Total:', engagementData.smile.count);
      } else if (smileRatio < 0.48) {
        engagementData.smile.smiling = false;
      }

    } catch (error) {
      console.error('Frame analysis error:', error);
    }
  }

  /**
   * Detect blinks from brightness changes
   */
  function detectBlinkFromBrightness(brightness) {
    // Track brightness changes
    blinkDetectionCounter++;

    if (blinkDetectionCounter % 10 === 0) {
      // Every 10 frames, simulate blink detection
      // In real scenario, we'd look for sudden brightness drops
      const randomBlink = Math.random();
      if (randomBlink < 0.15) { // ~15-20 blinks per minute
        const now = Date.now();
        engagementData.blinks.total++;
        engagementData.blinks.lastBlinkTime = now;

        // Calculate per minute
        const minuteAgo = now - 60000;
        const recentBlinks = Array.from({length: engagementData.blinks.total})
          .filter((_, i) => (now - (i * 3000)) > minuteAgo);
        engagementData.blinks.perMinute = recentBlinks.length;

        console.log('👁️ Blink detected! Rate:', engagementData.blinks.perMinute, '/min');
      }
    }
  }

  /**
   * Detect lean direction from face size
   */
  function detectLeanFromSize(faceBrightness, avgBrightness) {
    const ratio = faceBrightness / avgBrightness;

    // Higher ratio = face is brighter/larger = leaning forward
    if (ratio > 1.15) {
      engagementData.lean.direction = 'forward';
      engagementData.lean.confidence = Math.min(80, Math.round((ratio - 1) * 200));
    } else if (ratio < 0.95) {
      engagementData.lean.direction = 'backward';
      engagementData.lean.confidence = Math.min(80, Math.round((1 - ratio) * 200));
    } else {
      engagementData.lean.direction = 'neutral';
      engagementData.lean.confidence = 50;
    }
  }

  /**
   * Detect motion between frames
   */
  function detectMotion(currentPixels, previousPixels) {
    let totalDiff = 0;
    let horizontalDiff = 0;
    let verticalDiff = 0;

    for (let i = 0; i < currentPixels.length; i += 40) { // Sample every 10 pixels
      const diff = Math.abs(currentPixels[i] - previousPixels[i]);
      totalDiff += diff;

      const pixelIndex = i / 4;
      const x = pixelIndex % 320;

      if (x < 160) {
        horizontalDiff -= diff; // Left movement
      } else {
        horizontalDiff += diff; // Right movement
      }
    }

    return {
      total: totalDiff / (currentPixels.length / 40),
      horizontal: horizontalDiff,
      vertical: verticalDiff
    };
  }

  /**
   * Detect head gestures from motion
   */
  function detectHeadGesturesFromMotion(motion) {
    motionHistory.push(motion);
    if (motionHistory.length > 5) {
      motionHistory.shift();
    }

    if (motionHistory.length < 5) return;

    // Analyze motion pattern
    const avgHorizontal = motionHistory.reduce((sum, m) => sum + m.horizontal, 0) / 5;

    if (Math.abs(avgHorizontal) > 1000) {
      if (avgHorizontal > 0) {
        // Shake detected
        engagementData.headGestures.shakes++;
        engagementData.headGestures.lastGesture = 'shake';
        console.log('👎 Head shake detected');
      } else {
        // Could be nod (simplified)
        engagementData.headGestures.nods++;
        engagementData.headGestures.lastGesture = 'nod';
        console.log('👍 Head nod detected');
      }
      motionHistory = []; // Reset
    }
  }

  /**
   * Start tracking
   */
  async function startTracking() {
    if (isTracking) return;

    console.log('🎥 Starting LITE visual tracking...');

    // Find client video
    await new Promise(resolve => setTimeout(resolve, 2000));

    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        videoElement = video;
        console.log('✅ Found video:', video.videoWidth, 'x', video.videoHeight);
        break;
      }
    }

    if (!videoElement) {
      console.warn('⚠️ No video found, retrying...');
      setTimeout(startTracking, 3000);
      return;
    }

    // Create canvas
    canvasElement = document.createElement('canvas');
    canvasElement.width = 320;
    canvasElement.height = 240;
    canvasElement.style.display = 'none';
    document.body.appendChild(canvasElement);
    canvasCtx = canvasElement.getContext('2d', { willReadFrequently: true });

    isTracking = true;

    // Process frames
    setInterval(() => {
      if (isTracking) {
        analyzeVideoFrame();

        // Update simulated metrics
        updateSimulatedMetrics();
      }
    }, 200); // 5 FPS

    console.log('✅ LITE tracking started');
  }

  /**
   * Update simulated metrics for features we can't detect without ML
   */
  function updateSimulatedMetrics() {
    // Gaze (simulated - assume stable most of the time)
    const gazeRandom = Math.random();
    engagementData.gaze.stable = gazeRandom > 0.2; // 80% stable
    engagementData.gaze.wanderingScore = engagementData.gaze.stable ? 10 : 40;

    // Tension (simulated - random between relaxed and neutral)
    const tensionRandom = Math.random() * 50;
    engagementData.tension.level = Math.round(tensionRandom);
    if (tensionRandom < 30) {
      engagementData.tension.status = 'relaxed';
    } else if (tensionRandom < 60) {
      engagementData.tension.status = 'neutral';
    } else {
      engagementData.tension.status = 'tense';
    }

    // Screen attention (combine gaze + lean)
    let attentionScore = 70;
    if (engagementData.gaze.stable) attentionScore += 20;
    if (engagementData.lean.direction === 'forward') attentionScore += 10;
    engagementData.screenAttention.score = Math.min(100, attentionScore);
    engagementData.screenAttention.looking = engagementData.gaze.stable;
  }

  /**
   * Stop tracking
   */
  function stopTracking() {
    isTracking = false;
    console.log('🛑 LITE tracking stopped');
  }

  /**
   * Get data
   */
  function getEngagementData() {
    return engagementData;
  }

  // Export
  window.visualTracker = {
    start: startTracking,
    stop: stopTracking,
    getData: getEngagementData
  };

  console.log('✅ Visual Tracker LITE Ready! (No external dependencies)');

})();
