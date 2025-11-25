/**
 * VISUAL ENGAGEMENT TRACKER - TensorFlow.js VERSION
 * Real ML face detection using TensorFlow.js Face Landmarks Detection
 * Works directly in content script without offscreen documents
 */

(function() {
  console.log('📹 Visual Tracker (TensorFlow.js) Loading...');

  let isTracking = false;
  let videoElement = null;
  let model = null;
  let canvas = null;
  let ctx = null;

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

  // Tracking state
  let blinkTimes = [];
  let wasEyeClosed = false;
  let wasSmiling = false;
  let previousFaceSize = null;
  let frameCount = 0;

  /**
   * Load TensorFlow.js and Face Detection model
   */
  async function loadModel() {
    console.log('🤖 Loading TensorFlow.js...');

    try {
      // Load TensorFlow.js
      if (typeof window.tf === 'undefined') {
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl');
        console.log('✅ TensorFlow.js loaded');
      }

      // Load Face Landmarks Detection
      if (typeof window.faceLandmarksDetection === 'undefined') {
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection');
        console.log('✅ Face Landmarks Detection loaded');
      }

      // Wait for TF to be ready
      await window.tf.ready();
      console.log('✅ TensorFlow.js backend ready:', window.tf.getBackend());

      // Create detector
      console.log('🔧 Creating face detector...');
      model = await window.faceLandmarksDetection.createDetector(
        window.faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: 'tfjs',
          refineLandmarks: true,
          maxFaces: 1
        }
      );

      console.log('✅ Face detector created!');
      return true;

    } catch (error) {
      console.error('❌ Failed to load model:', error);
      return false;
    }
  }

  /**
   * Load external script
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
        console.error('❌ Failed to load:', url);
        reject(new Error(`Failed to load ${url}`));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Calculate Eye Aspect Ratio for blink detection
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
   * Detect blinks using Eye Aspect Ratio
   */
  function detectBlinks(keypoints) {
    try {
      // Left eye indices: 33, 160, 158, 133, 153, 144
      // Right eye indices: 362, 385, 387, 263, 373, 380
      const leftEye = [
        keypoints[33], keypoints[160], keypoints[158],
        keypoints[133], keypoints[153], keypoints[144]
      ];
      const rightEye = [
        keypoints[362], keypoints[385], keypoints[387],
        keypoints[263], keypoints[373], keypoints[380]
      ];

      const leftEAR = calculateEAR(leftEye);
      const rightEAR = calculateEAR(rightEye);
      const avgEAR = (leftEAR + rightEAR) / 2.0;

      if (avgEAR < 0.2 && !wasEyeClosed) {
        wasEyeClosed = true;
        const now = Date.now();
        blinkTimes.push(now);
        engagementData.blinks.total++;

        // Keep only last minute
        blinkTimes = blinkTimes.filter(t => t > now - 60000);
        engagementData.blinks.perMinute = blinkTimes.length;

        console.log('👁️ REAL BLINK DETECTED! Rate:', engagementData.blinks.perMinute, '/min');
      } else if (avgEAR >= 0.21) {
        wasEyeClosed = false;
      }
    } catch (error) {
      // Keypoint missing, skip
    }
  }

  /**
   * Detect smile from mouth landmarks
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
        console.log('😊 REAL SMILE DETECTED! Total:', engagementData.smile.count);
      }
      wasSmiling = isSmiling;
      engagementData.smile.smiling = isSmiling;
    } catch (error) {
      // Keypoint missing, skip
    }
  }

  /**
   * Detect lean direction from face size
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
    } catch (error) {
      // Keypoint missing, skip
    }
  }

  /**
   * Detect gaze direction
   */
  function detectGaze(keypoints) {
    try {
      // Use iris landmarks if available
      const leftIris = keypoints[468] || keypoints[133];
      const leftOuter = keypoints[33];
      const leftInner = keypoints[133];

      const ratio = (leftIris.x - leftOuter.x) / (leftInner.x - leftOuter.x);
      const stable = ratio > 0.35 && ratio < 0.65;

      engagementData.gaze = { stable, wanderingScore: stable ? 10 : 50 };
      engagementData.screenAttention = { looking: stable, score: stable ? 90 : 50 };
    } catch (error) {
      // Default to stable
      engagementData.gaze = { stable: true, wanderingScore: 10 };
    }
  }

  /**
   * Calculate facial tension
   */
  function calculateTension(keypoints) {
    try {
      const leftBrow = keypoints[70];
      const rightBrow = keypoints[300];
      const leftEye = keypoints[33];
      const rightEye = keypoints[263];

      const avgBrowHeight = (
        Math.abs(leftBrow.y - leftEye.y) +
        Math.abs(rightBrow.y - rightEye.y)
      ) / 2;

      let tensionScore = avgBrowHeight > 0.05 ? 60 : 20;
      let status = tensionScore > 60 ? 'tense' : (tensionScore > 30 ? 'neutral' : 'relaxed');

      engagementData.tension = { level: tensionScore, status };
    } catch (error) {
      // Default relaxed
      engagementData.tension = { level: 30, status: 'relaxed' };
    }
  }

  /**
   * Process video frame with face detection
   */
  async function processFrame() {
    if (!model || !videoElement || !isTracking) return;

    try {
      frameCount++;

      // Detect faces
      const faces = await model.estimateFaces(videoElement, {
        flipHorizontal: false,
        staticImageMode: false
      });

      if (faces && faces.length > 0) {
        const face = faces[0];
        const keypoints = face.keypoints;

        // Run all detections
        detectBlinks(keypoints);
        detectSmile(keypoints);
        detectLean(keypoints);
        detectGaze(keypoints);
        calculateTension(keypoints);

        // Log every 50 frames
        if (frameCount % 50 === 0) {
          console.log('✅ Face detected - Blinks:', engagementData.blinks.perMinute, 'Smiles:', engagementData.smile.count);
        }
      }

    } catch (error) {
      if (frameCount % 100 === 0) {
        console.error('Frame processing error:', error);
      }
    }
  }

  /**
   * Find and setup video element
   */
  async function setupVideo() {
    console.log('🎥 Looking for video element...');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        videoElement = video;
        console.log('✅ Found video:', video.videoWidth, 'x', video.videoHeight);

        // Create hidden canvas
        canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');

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

    console.log('🚀 Starting TensorFlow.js face tracking...');

    // Load model
    const modelLoaded = await loadModel();
    if (!modelLoaded) {
      console.error('❌ Failed to load TensorFlow.js model');
      return;
    }

    // Setup video
    const videoReady = await setupVideo();
    if (!videoReady) {
      console.warn('⚠️ Video not ready, retrying...');
      setTimeout(startTracking, 3000);
      return;
    }

    isTracking = true;

    // Process frames at 5 FPS
    setInterval(() => {
      if (isTracking) {
        processFrame();
      }
    }, 200);

    console.log('✅ TensorFlow.js face tracking started! 🎯');
  }

  /**
   * Stop tracking
   */
  function stopTracking() {
    isTracking = false;
    console.log('🛑 Face tracking stopped');
  }

  /**
   * Get engagement data
   */
  function getEngagementData() {
    return engagementData;
  }

  // Export API
  window.visualTracker = {
    start: startTracking,
    stop: stopTracking,
    getData: getEngagementData
  };

  console.log('✅ Visual Tracker (TensorFlow.js) Ready!');

})();
