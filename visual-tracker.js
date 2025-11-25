/**
 * VISUAL ENGAGEMENT TRACKER
 * Tracks client engagement using facial landmarks and video analysis
 * Features: Lean, Gaze, Blinks, Nods, Tension, Smiles, Screen Attention
 */

(function() {
  console.log('📹 Visual Engagement Tracker Loading...');

  // State
  let faceMesh = null;
  let isTracking = false;
  let videoElement = null;
  let canvasElement = null;
  let canvasCtx = null;

  // Engagement metrics
  let engagementData = {
    lean: { direction: 'neutral', confidence: 0 },
    gaze: { stable: true, wanderingScore: 0 },
    blinks: { perMinute: 0, total: 0, lastBlinkTime: 0 },
    headGestures: { nods: 0, shakes: 0, lastGesture: null },
    tension: { level: 0, status: 'relaxed' },
    smile: { smiling: false, count: 0, lastSmileTime: 0 },
    screenAttention: { looking: true, score: 100 }
  };

  // Blink detection variables
  let blinkThreshold = 0.2;
  let wasEyeClosed = false;
  let blinkTimes = [];

  // Smile detection variables
  let wasSmiling = false;

  // Head pose tracking
  let previousHeadPose = null;
  let nodCount = 0;
  let shakeCount = 0;

  /**
   * Calculate Eye Aspect Ratio (EAR) for blink detection
   */
  function calculateEAR(eye) {
    // eye should have 6 landmarks: [p1, p2, p3, p4, p5, p6]
    // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)

    const p1 = eye[0];
    const p2 = eye[1];
    const p3 = eye[2];
    const p4 = eye[3];
    const p5 = eye[4];
    const p6 = eye[5];

    const vertical1 = Math.hypot(p2.x - p6.x, p2.y - p6.y, p2.z - p6.z);
    const vertical2 = Math.hypot(p3.x - p5.x, p3.y - p5.y, p3.z - p5.z);
    const horizontal = Math.hypot(p1.x - p4.x, p1.y - p4.y, p1.z - p4.z);

    const ear = (vertical1 + vertical2) / (2.0 * horizontal);
    return ear;
  }

  /**
   * Feature 3: Detect blinks
   */
  function detectBlinks(landmarks) {
    // Left eye landmarks (MediaPipe indices)
    const leftEye = [
      landmarks[33],  // outer corner
      landmarks[160], // top
      landmarks[158], // top inner
      landmarks[133], // inner corner
      landmarks[153], // bottom inner
      landmarks[144]  // bottom
    ];

    // Right eye landmarks
    const rightEye = [
      landmarks[362], // outer corner
      landmarks[385], // top
      landmarks[387], // top inner
      landmarks[263], // inner corner
      landmarks[373], // bottom inner
      landmarks[380]  // bottom
    ];

    const leftEAR = calculateEAR(leftEye);
    const rightEAR = calculateEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2.0;

    // Detect blink (EAR drops below threshold)
    if (avgEAR < blinkThreshold && !wasEyeClosed) {
      wasEyeClosed = true;
      const now = Date.now();
      blinkTimes.push(now);
      engagementData.blinks.total++;
      engagementData.blinks.lastBlinkTime = now;

      // Calculate blinks per minute (last 60 seconds)
      const oneMinuteAgo = now - 60000;
      blinkTimes = blinkTimes.filter(t => t > oneMinuteAgo);
      engagementData.blinks.perMinute = blinkTimes.length;

      console.log('👁️ Blink detected! Total:', engagementData.blinks.total, 'Rate:', engagementData.blinks.perMinute, '/min');
    } else if (avgEAR >= blinkThreshold && wasEyeClosed) {
      wasEyeClosed = false;
    }

    return engagementData.blinks;
  }

  /**
   * Feature 6: Detect smile
   */
  function detectSmile(landmarks) {
    // Mouth corner landmarks
    const leftMouthCorner = landmarks[61];
    const rightMouthCorner = landmarks[291];
    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];

    // Calculate mouth width and height
    const mouthWidth = Math.hypot(
      rightMouthCorner.x - leftMouthCorner.x,
      rightMouthCorner.y - leftMouthCorner.y
    );

    const mouthHeight = Math.hypot(
      upperLip.x - lowerLip.x,
      upperLip.y - lowerLip.y
    );

    // Smile ratio: wider mouth = smiling
    const smileRatio = mouthWidth / mouthHeight;
    const smileThreshold = 3.0; // Adjust based on testing

    const isSmiling = smileRatio > smileThreshold;

    if (isSmiling && !wasSmiling) {
      // Smile onset event!
      wasSmiling = true;
      engagementData.smile.count++;
      engagementData.smile.lastSmileTime = Date.now();
      console.log('😊 Smile detected! Total:', engagementData.smile.count);
    } else if (!isSmiling && wasSmiling) {
      wasSmiling = false;
    }

    engagementData.smile.smiling = isSmiling;
    return engagementData.smile;
  }

  /**
   * Feature 1: Detect lean direction (forward/backward)
   */
  function detectLeanDirection(landmarks) {
    // Use nose tip (landmark 1) as reference
    const noseTip = landmarks[1];

    // Calculate face size (distance between temples)
    const leftTemple = landmarks[234];
    const rightTemple = landmarks[454];
    const faceWidth = Math.hypot(
      rightTemple.x - leftTemple.x,
      rightTemple.y - leftTemple.y
    );

    // Larger face = closer to camera (leaning forward)
    // Smaller face = farther from camera (leaning backward)

    // Baseline: normalized face width around 0.15-0.25
    const forwardThreshold = 0.22;
    const backwardThreshold = 0.18;

    let direction = 'neutral';
    let confidence = 0;

    if (faceWidth > forwardThreshold) {
      direction = 'forward';
      confidence = Math.min(100, ((faceWidth - forwardThreshold) / 0.05) * 100);
    } else if (faceWidth < backwardThreshold) {
      direction = 'backward';
      confidence = Math.min(100, ((backwardThreshold - faceWidth) / 0.05) * 100);
    } else {
      direction = 'neutral';
      confidence = 50;
    }

    engagementData.lean = { direction, confidence: Math.round(confidence) };
    return engagementData.lean;
  }

  /**
   * Feature 4: Detect head nods and shakes
   */
  function detectHeadGestures(landmarks) {
    // Get head pose using nose and eye landmarks
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    // Calculate pitch (nod) and yaw (shake)
    const eyeMidpoint = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2,
      z: (leftEye.z + rightEye.z) / 2
    };

    const pitch = nose.y - eyeMidpoint.y; // Vertical movement (nod)
    const yaw = nose.x - eyeMidpoint.x;   // Horizontal movement (shake)

    if (previousHeadPose) {
      const pitchDelta = pitch - previousHeadPose.pitch;
      const yawDelta = yaw - previousHeadPose.yaw;

      const nodThreshold = 0.02;
      const shakeThreshold = 0.03;

      // Detect nod (up-down movement)
      if (Math.abs(pitchDelta) > nodThreshold && Math.abs(yawDelta) < shakeThreshold) {
        engagementData.headGestures.nods++;
        engagementData.headGestures.lastGesture = 'nod';
        console.log('👍 Head nod detected! Total:', engagementData.headGestures.nods);
      }

      // Detect shake (left-right movement)
      if (Math.abs(yawDelta) > shakeThreshold && Math.abs(pitchDelta) < nodThreshold) {
        engagementData.headGestures.shakes++;
        engagementData.headGestures.lastGesture = 'shake';
        console.log('👎 Head shake detected! Total:', engagementData.headGestures.shakes);
      }
    }

    previousHeadPose = { pitch, yaw };
    return engagementData.headGestures;
  }

  /**
   * Feature 5: Calculate facial tension index
   */
  function calculateFacialTension(landmarks) {
    // Measure tension using:
    // 1. Eyebrow height (raised = tense)
    // 2. Jaw openness (clenched = tense)
    // 3. Eye squinting

    const leftEyebrow = landmarks[70];
    const rightEyebrow = landmarks[300];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];

    // Eyebrow distance from eyes (higher = raised = tense)
    const leftBrowHeight = Math.abs(leftEyebrow.y - leftEye.y);
    const rightBrowHeight = Math.abs(rightEyebrow.y - rightEye.y);
    const avgBrowHeight = (leftBrowHeight + rightBrowHeight) / 2;

    // Jaw tension (mouth closed tight)
    const jawDistance = Math.abs(upperLip.y - lowerLip.y);

    // Calculate tension score (0-100)
    let tensionScore = 0;

    // High eyebrows = tension
    if (avgBrowHeight > 0.05) {
      tensionScore += 40;
    }

    // Tight jaw = tension
    if (jawDistance < 0.02) {
      tensionScore += 30;
    }

    // Eye squinting (small eye opening) = tension
    const leftEyeOpening = calculateEAR([
      landmarks[33], landmarks[160], landmarks[158],
      landmarks[133], landmarks[153], landmarks[144]
    ]);
    if (leftEyeOpening < 0.15) {
      tensionScore += 30;
    }

    // Determine status
    let status = 'relaxed';
    if (tensionScore > 60) {
      status = 'tense';
    } else if (tensionScore > 30) {
      status = 'neutral';
    }

    engagementData.tension = { level: tensionScore, status };
    return engagementData.tension;
  }

  /**
   * Feature 2: Detect gaze stability / wandering
   */
  function detectGazeStability(landmarks) {
    // Use iris landmarks (if available) or pupil estimation
    const leftIris = landmarks[468]; // Approximate iris center
    const rightIris = landmarks[473];

    const leftEyeOuter = landmarks[33];
    const leftEyeInner = landmarks[133];
    const rightEyeOuter = landmarks[362];
    const rightEyeInner = landmarks[263];

    // Calculate gaze direction based on iris position relative to eye corners
    const leftGazeRatio = (leftIris.x - leftEyeOuter.x) / (leftEyeInner.x - leftEyeOuter.x);
    const rightGazeRatio = (rightIris.x - rightEyeOuter.x) / (rightEyeInner.x - rightEyeOuter.x);

    const avgGazeRatio = (leftGazeRatio + rightGazeRatio) / 2;

    // Centered gaze = 0.4 to 0.6 (looking at screen)
    // Outside this range = looking away
    const isLookingCenter = avgGazeRatio > 0.35 && avgGazeRatio < 0.65;

    const wanderingScore = isLookingCenter ? 0 : Math.abs(avgGazeRatio - 0.5) * 200;

    engagementData.gaze = {
      stable: isLookingCenter,
      wanderingScore: Math.min(100, Math.round(wanderingScore))
    };

    return engagementData.gaze;
  }

  /**
   * Feature 12: Screen attention (combined with gaze)
   */
  function detectScreenAttention() {
    // Check if screen sharing is active in Google Meet
    const screenShareActive = document.querySelector('[aria-label*="presenting" i]') !== null;

    // Combine gaze stability with screen share status
    const gazeScore = engagementData.gaze.stable ? 100 : (100 - engagementData.gaze.wanderingScore);

    let attentionScore = gazeScore;
    if (screenShareActive) {
      // If presenting, gaze should be more stable
      attentionScore = gazeScore * 1.2; // Boost importance
    }

    engagementData.screenAttention = {
      looking: engagementData.gaze.stable,
      score: Math.min(100, Math.round(attentionScore))
    };

    return engagementData.screenAttention;
  }

  /**
   * Process facial landmarks from MediaPipe
   */
  function processFaceLandmarks(results) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      console.log('⚠️ No face detected');
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];

    // Run all visual feature detectors
    detectBlinks(landmarks);
    detectSmile(landmarks);
    detectLeanDirection(landmarks);
    detectHeadGestures(landmarks);
    calculateFacialTension(landmarks);
    detectGazeStability(landmarks);
    detectScreenAttention();

    // Update UI with engagement data
    updateEngagementUI();
  }

  /**
   * Update engagement UI panel
   */
  function updateEngagementUI() {
    const engagementPanel = document.getElementById('engagement-panel');
    if (!engagementPanel) return;

    const html = `
      <div class="engagement-metric">
        <span class="metric-icon">👤</span>
        <span class="metric-label">Lean:</span>
        <span class="metric-value">${engagementData.lean.direction} (${engagementData.lean.confidence}%)</span>
      </div>
      <div class="engagement-metric">
        <span class="metric-icon">👀</span>
        <span class="metric-label">Gaze:</span>
        <span class="metric-value">${engagementData.gaze.stable ? 'Stable ✅' : 'Wandering ⚠️'}</span>
      </div>
      <div class="engagement-metric">
        <span class="metric-icon">👁️</span>
        <span class="metric-label">Blinks:</span>
        <span class="metric-value">${engagementData.blinks.perMinute}/min</span>
      </div>
      <div class="engagement-metric">
        <span class="metric-icon">😊</span>
        <span class="metric-label">Smiles:</span>
        <span class="metric-value">${engagementData.smile.count} times</span>
      </div>
      <div class="engagement-metric">
        <span class="metric-icon">😌</span>
        <span class="metric-label">Tension:</span>
        <span class="metric-value">${engagementData.tension.status}</span>
      </div>
      <div class="engagement-metric">
        <span class="metric-icon">🎯</span>
        <span class="metric-label">Attention:</span>
        <span class="metric-value">${engagementData.screenAttention.score}%</span>
      </div>
    `;

    document.getElementById('engagement-metrics').innerHTML = html;
  }

  /**
   * Initialize MediaPipe Face Mesh
   */
  async function initializeFaceMesh() {
    console.log('🔧 Loading MediaPipe Face Mesh...');

    try {
      // Load MediaPipe Face Mesh from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      document.head.appendChild(script);

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });

      // Also load camera utils
      const cameraScript = document.createElement('script');
      cameraScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
      document.head.appendChild(cameraScript);

      await new Promise((resolve, reject) => {
        cameraScript.onload = resolve;
        cameraScript.onerror = reject;
      });

      console.log('✅ MediaPipe scripts loaded');

      // Initialize Face Mesh
      faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults(processFaceLandmarks);

      console.log('✅ Face Mesh initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Face Mesh:', error);
      return false;
    }
  }

  /**
   * Start tracking client video
   */
  async function startTracking() {
    if (isTracking) return;

    console.log('🎥 Starting visual engagement tracking...');

    // Initialize Face Mesh
    const initialized = await initializeFaceMesh();
    if (!initialized) {
      console.error('❌ Could not initialize Face Mesh');
      return;
    }

    // Find client's video element in Google Meet
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      // Skip your own video (usually has "mirrored" or specific attributes)
      if (!video.classList.contains('mirrored')) {
        videoElement = video;
        break;
      }
    }

    if (!videoElement) {
      console.warn('⚠️ Client video not found, will retry...');
      setTimeout(startTracking, 3000);
      return;
    }

    console.log('✅ Client video found:', videoElement);

    // Create hidden canvas for processing
    canvasElement = document.createElement('canvas');
    canvasElement.width = 640;
    canvasElement.height = 480;
    canvasElement.style.display = 'none';
    document.body.appendChild(canvasElement);
    canvasCtx = canvasElement.getContext('2d');

    // Process video frames
    isTracking = true;
    processVideoFrame();
  }

  /**
   * Process video frames
   */
  async function processVideoFrame() {
    if (!isTracking || !videoElement || !faceMesh) return;

    try {
      // Draw video frame to canvas
      canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

      // Send to Face Mesh
      await faceMesh.send({ image: canvasElement });
    } catch (error) {
      console.error('❌ Frame processing error:', error);
    }

    // Process at 5 FPS (200ms interval) to save CPU
    setTimeout(processVideoFrame, 200);
  }

  /**
   * Stop tracking
   */
  function stopTracking() {
    isTracking = false;
    console.log('🛑 Visual tracking stopped');
  }

  /**
   * Get current engagement data
   */
  function getEngagementData() {
    return engagementData;
  }

  // Export functions globally
  window.visualTracker = {
    start: startTracking,
    stop: stopTracking,
    getData: getEngagementData
  };

  console.log('✅ Visual Engagement Tracker Ready!');

})();
