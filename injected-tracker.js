/**
 * INJECTED VISUAL TRACKER
 * Runs in page context (not content script) to bypass CSP
 * Loads TensorFlow.js and does real face detection
 */

console.log('🚀 Injected Visual Tracker Loading in PAGE context...');

(async function() {
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
  let wasEyeClosed = false;
  let wasSmiling = false;
  let model = null;
  let isTracking = false;

  /**
   * Load script dynamically
   */
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log('✅ Loaded:', url.split('/').pop());
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed:', url);
        reject();
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Load TensorFlow.js
   */
  async function loadTensorFlow() {
    console.log('📦 Loading TensorFlow.js from CDN...');

    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.11.0/dist/tf-core.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.11.0/dist/tf-converter.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.11.0/dist/tf-backend-webgl.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@1.0.2/dist/face-landmarks-detection.min.js');

      console.log('✅ All TensorFlow.js scripts loaded!');

      await window.tf.ready();
      console.log('✅ TensorFlow.js backend:', window.tf.getBackend());

      return true;
    } catch (error) {
      console.error('❌ Failed to load TensorFlow.js:', error);
      return false;
    }
  }

  /**
   * Create face detector
   */
  async function createDetector() {
    console.log('🔧 Creating face detector...');

    try {
      model = await window.faceLandmarksDetection.createDetector(
        window.faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        }
      );

      console.log('✅ Face detector ready!');
      return true;
    } catch (error) {
      console.error('❌ Failed to create detector:', error);
      return false;
    }
  }

  /**
   * Calculate Eye Aspect Ratio
   */
  function calculateEAR(eye) {
    const p1 = eye[0], p2 = eye[1], p3 = eye[2];
    const p4 = eye[3], p5 = eye[4], p6 = eye[5];

    const vertical1 = Math.hypot(p2.x - p6.x, p2.y - p6.y);
    const vertical2 = Math.hypot(p3.x - p5.x, p3.y - p5.y);
    const horizontal = Math.hypot(p1.x - p4.x, p1.y - p4.y);

    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  /**
   * Detect blinks
   */
  function detectBlinks(keypoints) {
    try {
      const leftEye = [
        keypoints[33], keypoints[160], keypoints[158],
        keypoints[133], keypoints[153], keypoints[144]
      ];
      const rightEye = [
        keypoints[362], keypoints[385], keypoints[387],
        keypoints[263], keypoints[373], keypoints[380]
      ];

      const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2.0;

      if (avgEAR < 0.2 && !wasEyeClosed) {
        wasEyeClosed = true;
        const now = Date.now();
        blinkTimes.push(now);
        engagementData.blinks.total++;
        blinkTimes = blinkTimes.filter(t => t > now - 60000);
        engagementData.blinks.perMinute = blinkTimes.length;
        console.log('👁️ BLINK! Rate:', engagementData.blinks.perMinute);
      } else if (avgEAR >= 0.21) {
        wasEyeClosed = false;
      }
    } catch (e) {}
  }

  /**
   * Detect smile
   */
  function detectSmile(keypoints) {
    try {
      const leftMouth = keypoints[61];
      const rightMouth = keypoints[291];
      const upperLip = keypoints[13];
      const lowerLip = keypoints[14];

      const mouthWidth = Math.hypot(rightMouth.x - leftMouth.x, rightMouth.y - leftMouth.y);
      const mouthHeight = Math.hypot(upperLip.x - lowerLip.x, upperLip.y - lowerLip.y);
      const smileRatio = mouthWidth / mouthHeight;

      const isSmiling = smileRatio > 3.2;
      if (isSmiling && !wasSmiling) {
        engagementData.smile.count++;
        console.log('😊 SMILE! Total:', engagementData.smile.count);
      }
      wasSmiling = isSmiling;
      engagementData.smile.smiling = isSmiling;
    } catch (e) {}
  }

  /**
   * Detect lean
   */
  function detectLean(keypoints) {
    try {
      const leftTemple = keypoints[234];
      const rightTemple = keypoints[454];
      const faceWidth = Math.hypot(rightTemple.x - leftTemple.x, rightTemple.y - leftTemple.y);

      let direction = 'neutral', confidence = 50;
      if (faceWidth > 0.22) {
        direction = 'forward';
        confidence = Math.min(100, ((faceWidth - 0.22) / 0.05) * 100);
      } else if (faceWidth < 0.18) {
        direction = 'backward';
        confidence = Math.min(100, ((0.18 - faceWidth) / 0.05) * 100);
      }
      engagementData.lean = { direction, confidence: Math.round(confidence) };
    } catch (e) {}
  }

  /**
   * Detect gaze
   */
  function detectGaze(keypoints) {
    try {
      const leftIris = keypoints[468] || keypoints[133];
      const leftOuter = keypoints[33];
      const leftInner = keypoints[133];
      const ratio = (leftIris.x - leftOuter.x) / (leftInner.x - leftOuter.x);
      const stable = ratio > 0.35 && ratio < 0.65;
      engagementData.gaze = { stable, wanderingScore: stable ? 10 : 50 };
      engagementData.screenAttention = { looking: stable, score: stable ? 90 : 50 };
    } catch (e) {}
  }

  /**
   * Calculate tension
   */
  function calculateTension(keypoints) {
    try {
      const leftBrow = keypoints[70];
      const rightBrow = keypoints[300];
      const leftEye = keypoints[33];
      const rightEye = keypoints[263];
      const avgBrowHeight = (Math.abs(leftBrow.y - leftEye.y) + Math.abs(rightBrow.y - rightEye.y)) / 2;
      let tensionScore = avgBrowHeight > 0.05 ? 60 : 20;
      let status = tensionScore > 60 ? 'tense' : (tensionScore > 30 ? 'neutral' : 'relaxed');
      engagementData.tension = { level: tensionScore, status };
    } catch (e) {}
  }

  /**
   * Process frame
   */
  async function processFrame() {
    if (!model || !isTracking) return;

    try {
      const videos = document.querySelectorAll('video');
      let videoEl = null;

      for (const v of videos) {
        if (v.readyState >= 2 && v.videoWidth > 0 && !v.classList.contains('mirrored')) {
          videoEl = v;
          break;
        }
      }

      if (!videoEl) return;

      const faces = await model.estimateFaces(videoEl, { flipHorizontal: false });

      if (faces && faces.length > 0) {
        const keypoints = faces[0].keypoints;
        detectBlinks(keypoints);
        detectSmile(keypoints);
        detectLean(keypoints);
        detectGaze(keypoints);
        calculateTension(keypoints);

        // Share data with content script
        window.postMessage({ type: 'VISUAL_DATA', data: engagementData }, '*');
      }
    } catch (e) {
      console.error('Frame error:', e);
    }
  }

  /**
   * Start tracking
   */
  async function start() {
    if (isTracking) return;

    console.log('🎬 Starting face tracking...');

    // Load TensorFlow
    const loaded = await loadTensorFlow();
    if (!loaded) {
      console.error('❌ Could not load TensorFlow.js');
      return;
    }

    // Create detector
    const created = await createDetector();
    if (!created) {
      console.error('❌ Could not create detector');
      return;
    }

    isTracking = true;

    // Process at 5 FPS
    setInterval(processFrame, 200);

    console.log('✅ Face tracking ACTIVE! 🎯');
  }

  // Auto-start after 3 seconds
  setTimeout(start, 3000);

  // Export data getter
  window.getVisualEngagementData = () => engagementData;

})();
