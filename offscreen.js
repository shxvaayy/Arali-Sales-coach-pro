/**
 * OFFSCREEN VISUAL TRACKER
 * Runs MediaPipe Face Mesh in offscreen document to bypass CSP
 * Communicates with content script via chrome.runtime messaging
 */

console.log('📹 Offscreen Visual Tracker Loading...');

let faceMesh = null;
let isProcessing = false;
let canvas = null;
let canvasCtx = null;

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
let previousHeadPose = null;

/**
 * Initialize MediaPipe Face Mesh
 */
async function initFaceMesh() {
  console.log('🔧 Initializing MediaPipe Face Mesh...');

  try {
    // Wait for MediaPipe to be available (check window object)
    let retries = 0;
    while (typeof window.FaceMesh === 'undefined' && retries < 20) {
      console.log(`⏳ Waiting for MediaPipe... (${retries + 1}/20)`);
      await new Promise(resolve => setTimeout(resolve, 300));
      retries++;
    }

    if (typeof window.FaceMesh === 'undefined') {
      console.error('❌ MediaPipe Face Mesh not found on window object');
      console.log('Available on window:', Object.keys(window).filter(k => k.includes('Face') || k.includes('Media')));
      throw new Error('MediaPipe Face Mesh not loaded');
    }

    console.log('✅ MediaPipe Face Mesh found on window!');

    faceMesh = new window.FaceMesh({
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

    faceMesh.onResults(onResults);

    canvas = document.getElementById('canvas');
    canvasCtx = canvas.getContext('2d');

    console.log('✅ MediaPipe Face Mesh initialized!');
    isProcessing = true;

  } catch (error) {
    console.error('❌ Failed to initialize Face Mesh:', error);
  }
}

/**
 * Process results from MediaPipe
 */
function onResults(results) {
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    return;
  }

  const landmarks = results.multiFaceLandmarks[0];

  // Run all detection algorithms
  detectBlinks(landmarks);
  detectSmile(landmarks);
  detectLean(landmarks);
  detectHeadGestures(landmarks);
  calculateTension(landmarks);
  detectGaze(landmarks);

  // Send data back to content script
  chrome.runtime.sendMessage({
    type: 'VISUAL_DATA',
    data: engagementData
  }).catch(() => {
    // Content script might not be ready, ignore
  });
}

/**
 * Calculate Eye Aspect Ratio for blink detection
 */
function calculateEAR(eye) {
  const p1 = eye[0], p2 = eye[1], p3 = eye[2];
  const p4 = eye[3], p5 = eye[4], p6 = eye[5];

  const vertical1 = Math.hypot(p2.x - p6.x, p2.y - p6.y, p2.z - p6.z);
  const vertical2 = Math.hypot(p3.x - p5.x, p3.y - p5.y, p3.z - p5.z);
  const horizontal = Math.hypot(p1.x - p4.x, p1.y - p4.y, p1.z - p4.z);

  return (vertical1 + vertical2) / (2.0 * horizontal);
}

/**
 * Detect blinks using Eye Aspect Ratio
 */
function detectBlinks(landmarks) {
  const leftEye = [
    landmarks[33], landmarks[160], landmarks[158],
    landmarks[133], landmarks[153], landmarks[144]
  ];
  const rightEye = [
    landmarks[362], landmarks[385], landmarks[387],
    landmarks[263], landmarks[373], landmarks[380]
  ];

  const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2.0;

  if (avgEAR < 0.2 && !wasEyeClosed) {
    wasEyeClosed = true;
    const now = Date.now();
    blinkTimes.push(now);
    engagementData.blinks.total++;

    // Keep only last minute
    blinkTimes = blinkTimes.filter(t => t > now - 60000);
    engagementData.blinks.perMinute = blinkTimes.length;

    console.log('👁️ Blink detected! Rate:', engagementData.blinks.perMinute, '/min');
  } else if (avgEAR >= 0.2) {
    wasEyeClosed = false;
  }
}

/**
 * Detect smile from mouth landmarks
 */
function detectSmile(landmarks) {
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];

  const mouthWidth = Math.hypot(rightMouth.x - leftMouth.x, rightMouth.y - leftMouth.y);
  const mouthHeight = Math.hypot(upperLip.x - lowerLip.x, upperLip.y - lowerLip.y);
  const smileRatio = mouthWidth / mouthHeight;

  const isSmiling = smileRatio > 3.0;
  if (isSmiling && !wasSmiling) {
    engagementData.smile.count++;
    console.log('😊 Smile detected! Total:', engagementData.smile.count);
  }
  wasSmiling = isSmiling;
  engagementData.smile.smiling = isSmiling;
}

/**
 * Detect lean direction from face size
 */
function detectLean(landmarks) {
  const leftTemple = landmarks[234];
  const rightTemple = landmarks[454];
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
}

/**
 * Detect head gestures (nods and shakes)
 */
function detectHeadGestures(landmarks) {
  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const eyeMid = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2
  };

  const pitch = nose.y - eyeMid.y;
  const yaw = nose.x - eyeMid.x;

  if (previousHeadPose) {
    const pitchDelta = Math.abs(pitch - previousHeadPose.pitch);
    const yawDelta = Math.abs(yaw - previousHeadPose.yaw);

    if (pitchDelta > 0.02 && yawDelta < 0.01) {
      engagementData.headGestures.nods++;
      console.log('👍 Nod detected!', engagementData.headGestures.nods);
    } else if (yawDelta > 0.03 && pitchDelta < 0.01) {
      engagementData.headGestures.shakes++;
      console.log('👎 Shake detected!', engagementData.headGestures.shakes);
    }
  }
  previousHeadPose = { pitch, yaw };
}

/**
 * Calculate facial tension from eyebrow position
 */
function calculateTension(landmarks) {
  const leftBrow = landmarks[70];
  const rightBrow = landmarks[300];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  const avgBrowHeight = (
    Math.abs(leftBrow.y - leftEye.y) +
    Math.abs(rightBrow.y - rightEye.y)
  ) / 2;

  let tensionScore = avgBrowHeight > 0.05 ? 60 : 20;
  let status = tensionScore > 60 ? 'tense' : (tensionScore > 30 ? 'neutral' : 'relaxed');

  engagementData.tension = { level: tensionScore, status };
}

/**
 * Detect gaze direction and stability
 */
function detectGaze(landmarks) {
  const leftIris = landmarks[468] || landmarks[133];
  const leftOuter = landmarks[33];
  const leftInner = landmarks[133];

  const ratio = (leftIris.x - leftOuter.x) / (leftInner.x - leftOuter.x);
  const stable = ratio > 0.35 && ratio < 0.65;

  engagementData.gaze = { stable, wanderingScore: stable ? 10 : 50 };
  engagementData.screenAttention = { looking: stable, score: stable ? 90 : 50 };
}

/**
 * Process video frame
 */
async function processFrame(imageData) {
  if (!faceMesh || !isProcessing) return;

  try {
    // Draw image to canvas
    const imageBitmap = await createImageBitmap(imageData);
    canvasCtx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    // Send to MediaPipe
    await faceMesh.send({ image: canvas });
  } catch (error) {
    console.error('Frame processing error:', error);
  }
}

/**
 * Listen for messages from content script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROCESS_FRAME') {
    processFrame(message.imageData).then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'GET_VISUAL_DATA') {
    sendResponse({ data: engagementData });
    return true;
  }

  if (message.type === 'START_VISUAL_TRACKING') {
    if (!isProcessing) {
      initFaceMesh().then(() => {
        sendResponse({ success: true, message: 'Tracking started' });
      });
    } else {
      sendResponse({ success: true, message: 'Already tracking' });
    }
    return true;
  }

  if (message.type === 'STOP_VISUAL_TRACKING') {
    isProcessing = false;
    sendResponse({ success: true });
    return true;
  }
});

// Initialize after a short delay to ensure DOM is ready
setTimeout(() => {
  console.log('⏰ Starting initialization...');
  initFaceMesh();
}, 1000);

console.log('✅ Offscreen Visual Tracker Script Loaded!');
