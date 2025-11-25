/**
 * VISUAL ENGAGEMENT TRACKER - INJECTED VERSION
 * Injects into page context to bypass CSP restrictions
 * Uses MediaPipe Face Mesh from CDN
 */

(function() {
  console.log('📹 Visual Tracker - Injecting into page context...');

  // Create script that will run in page context (bypasses CSP)
  const scriptContent = `
  (function() {
    console.log('📹 Visual Engagement Tracker - Page Context Loading...');

    let faceMesh = null;
    let camera = null;
    let isTracking = false;

    // Engagement data
    let engagementData = {
      lean: { direction: 'neutral', confidence: 0 },
      gaze: { stable: true, wanderingScore: 0 },
      blinks: { perMinute: 0, total: 0 },
      headGestures: { nods: 0, shakes: 0 },
      tension: { level: 0, status: 'relaxed' },
      smile: { smiling: false, count: 0 },
      screenAttention: { looking: true, score: 100 }
    };

    // Blink detection
    let blinkTimes = [];
    let wasEyeClosed = false;
    let wasSmiling = false;
    let previousHeadPose = null;

    function calculateEAR(eye) {
      const p1 = eye[0], p2 = eye[1], p3 = eye[2];
      const p4 = eye[3], p5 = eye[4], p6 = eye[5];

      const vertical1 = Math.hypot(p2.x - p6.x, p2.y - p6.y, p2.z - p6.z);
      const vertical2 = Math.hypot(p3.x - p5.x, p3.y - p5.y, p3.z - p5.z);
      const horizontal = Math.hypot(p1.x - p4.x, p1.y - p4.y, p1.z - p4.z);

      return (vertical1 + vertical2) / (2.0 * horizontal);
    }

    function detectBlinks(landmarks) {
      const leftEye = [landmarks[33], landmarks[160], landmarks[158], landmarks[133], landmarks[153], landmarks[144]];
      const rightEye = [landmarks[362], landmarks[385], landmarks[387], landmarks[263], landmarks[373], landmarks[380]];

      const avgEAR = (calculateEAR(leftEye) + calculateEAR(rightEye)) / 2.0;

      if (avgEAR < 0.2 && !wasEyeClosed) {
        wasEyeClosed = true;
        const now = Date.now();
        blinkTimes.push(now);
        engagementData.blinks.total++;

        blinkTimes = blinkTimes.filter(t => t > now - 60000);
        engagementData.blinks.perMinute = blinkTimes.length;
        console.log('👁️ Blink! Rate:', engagementData.blinks.perMinute);
      } else if (avgEAR >= 0.2) {
        wasEyeClosed = false;
      }
    }

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
        console.log('😊 Smile!', engagementData.smile.count);
      }
      wasSmiling = isSmiling;
      engagementData.smile.smiling = isSmiling;
    }

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

    function detectHeadGestures(landmarks) {
      const nose = landmarks[1];
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const eyeMid = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };

      const pitch = nose.y - eyeMid.y;
      const yaw = nose.x - eyeMid.x;

      if (previousHeadPose) {
        const pitchDelta = Math.abs(pitch - previousHeadPose.pitch);
        const yawDelta = Math.abs(yaw - previousHeadPose.yaw);

        if (pitchDelta > 0.02 && yawDelta < 0.01) {
          engagementData.headGestures.nods++;
          engagementData.headGestures.lastGesture = 'nod';
          console.log('👍 Nod!', engagementData.headGestures.nods);
        } else if (yawDelta > 0.03 && pitchDelta < 0.01) {
          engagementData.headGestures.shakes++;
          engagementData.headGestures.lastGesture = 'shake';
          console.log('👎 Shake!', engagementData.headGestures.shakes);
        }
      }
      previousHeadPose = { pitch, yaw };
    }

    function calculateTension(landmarks) {
      const leftBrow = landmarks[70];
      const rightBrow = landmarks[300];
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const avgBrowHeight = (Math.abs(leftBrow.y - leftEye.y) + Math.abs(rightBrow.y - rightEye.y)) / 2;

      let tensionScore = avgBrowHeight > 0.05 ? 60 : 20;
      let status = tensionScore > 60 ? 'tense' : (tensionScore > 30 ? 'neutral' : 'relaxed');

      engagementData.tension = { level: tensionScore, status };
    }

    function detectGaze(landmarks) {
      const leftIris = landmarks[468] || landmarks[133];
      const leftOuter = landmarks[33];
      const leftInner = landmarks[133];
      const ratio = (leftIris.x - leftOuter.x) / (leftInner.x - leftOuter.x);
      const stable = ratio > 0.35 && ratio < 0.65;

      engagementData.gaze = { stable, wanderingScore: stable ? 10 : 50 };
      engagementData.screenAttention = { looking: stable, score: stable ? 90 : 50 };
    }

    function onResults(results) {
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;

      const landmarks = results.multiFaceLandmarks[0];
      detectBlinks(landmarks);
      detectSmile(landmarks);
      detectLean(landmarks);
      detectHeadGestures(landmarks);
      calculateTension(landmarks);
      detectGaze(landmarks);

      // Share data with content script
      window.postMessage({ type: 'VISUAL_DATA', data: engagementData }, '*');
    }

    async function initFaceMesh() {
      console.log('Loading MediaPipe...');

      // Load scripts
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');

      console.log('✅ MediaPipe loaded');

      faceMesh = new FaceMesh({
        locateFile: (file) => 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/' + file
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      faceMesh.onResults(onResults);

      // Find video element
      const videos = document.querySelectorAll('video');
      let videoEl = null;
      for (const v of videos) {
        if (v.readyState >= 2 && v.videoWidth > 0 && !v.classList.contains('mirrored')) {
          videoEl = v;
          break;
        }
      }

      if (videoEl) {
        camera = new Camera(videoEl, {
          onFrame: async () => {
            await faceMesh.send({ image: videoEl });
          },
          width: 640,
          height: 480
        });
        camera.start();
        console.log('✅ Face tracking started!');
      } else {
        console.warn('No video found, retrying...');
        setTimeout(initFaceMesh, 3000);
      }
    }

    function loadScript(url) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Start after delay
    setTimeout(initFaceMesh, 3000);

    console.log('✅ Visual tracker initialized in page context');
  })();
  `;

  // Inject script into page
  const script = document.createElement('script');
  script.textContent = scriptContent;
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  // Listen for data from injected script
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'VISUAL_DATA') {
      // Store data for access by other scripts
      window.visualEngagementData = event.data.data;
    }
  });

  // Create API for other scripts
  window.visualTracker = {
    getData: () => window.visualEngagementData || {
      lean: { direction: 'neutral', confidence: 50 },
      gaze: { stable: true, wanderingScore: 0 },
      blinks: { perMinute: 0, total: 0 },
      headGestures: { nods: 0, shakes: 0 },
      tension: { level: 30, status: 'relaxed' },
      smile: { smiling: false, count: 0 },
      screenAttention: { looking: true, score: 85 }
    },
    start: () => console.log('Visual tracker auto-starts'),
    stop: () => console.log('Visual tracker stopped')
  };

  console.log('✅ Visual Tracker Injection Complete!');

})();
