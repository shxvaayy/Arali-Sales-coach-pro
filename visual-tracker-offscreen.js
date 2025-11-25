/**
 * VISUAL ENGAGEMENT TRACKER - OFFSCREEN VERSION
 * Captures video frames and sends to offscreen document for ML processing
 * This bypasses CSP restrictions
 */

(function() {
  console.log('📹 Visual Tracker (Offscreen) Loading...');

  let isTracking = false;
  let videoElement = null;
  let offscreenCanvas = null;
  let offscreenCtx = null;
  let processingInterval = null;

  // Latest engagement data
  let engagementData = {
    lean: { direction: 'neutral', confidence: 50 },
    gaze: { stable: true, wanderingScore: 0 },
    blinks: { perMinute: 0, total: 0 },
    headGestures: { nods: 0, shakes: 0 },
    tension: { level: 30, status: 'relaxed' },
    smile: { smiling: false, count: 0 },
    screenAttention: { looking: true, score: 85 }
  };

  /**
   * Create offscreen document for ML processing
   */
  async function createOffscreenDocument() {
    try {
      // Try to create offscreen document
      const response = await chrome.runtime.sendMessage({
        type: 'CREATE_OFFSCREEN_DOCUMENT'
      });

      if (response && response.success) {
        console.log('✅ Offscreen document created');
        return true;
      } else {
        console.log('⚠️ Offscreen document creation failed:', response?.error);
        return response?.alreadyExists || false;
      }
    } catch (error) {
      console.error('❌ Failed to create offscreen document:', error);
      return false;
    }
  }

  /**
   * Find and setup video element
   */
  async function setupVideo() {
    console.log('🎥 Looking for video element...');

    // Wait a bit for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        videoElement = video;
        console.log('✅ Found video:', video.videoWidth, 'x', video.videoHeight);

        // Create canvas for frame capture
        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = 640;
        offscreenCanvas.height = 480;
        offscreenCanvas.style.display = 'none';
        document.body.appendChild(offscreenCanvas);
        offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

        return true;
      }
    }

    console.warn('⚠️ No video found');
    return false;
  }

  /**
   * Capture and send frame to offscreen document
   */
  async function captureAndProcessFrame() {
    if (!videoElement || !offscreenCtx) return;

    try {
      // Draw current video frame to canvas
      offscreenCtx.drawImage(videoElement, 0, 0, 640, 480);

      // Get image data
      const imageData = offscreenCtx.getImageData(0, 0, 640, 480);

      // Send to offscreen document for processing
      chrome.runtime.sendMessage({
        type: 'PROCESS_FRAME',
        imageData: {
          data: Array.from(imageData.data),
          width: imageData.width,
          height: imageData.height
        }
      }).catch(err => {
        // Silently ignore if offscreen document not ready
      });

    } catch (error) {
      console.error('Frame capture error:', error);
    }
  }

  /**
   * Fetch latest data from offscreen document
   */
  async function fetchEngagementData() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_VISUAL_DATA'
      });

      if (response && response.data) {
        engagementData = response.data;
      }
    } catch (error) {
      // Silently ignore
    }
  }

  /**
   * Start tracking
   */
  async function startTracking() {
    if (isTracking) return;

    console.log('🚀 Starting visual tracking with offscreen document...');

    // Create offscreen document
    const offscreenReady = await createOffscreenDocument();
    if (!offscreenReady) {
      console.error('❌ Could not create offscreen document');
      return;
    }

    // Setup video
    const videoReady = await setupVideo();
    if (!videoReady) {
      console.warn('⚠️ Video not ready, retrying in 3s...');
      setTimeout(startTracking, 3000);
      return;
    }

    // Tell offscreen document to start
    try {
      await chrome.runtime.sendMessage({
        type: 'START_VISUAL_TRACKING'
      });
    } catch (error) {
      console.error('Failed to start offscreen tracking:', error);
    }

    isTracking = true;

    // Process frames at 5 FPS
    processingInterval = setInterval(() => {
      captureAndProcessFrame();
      fetchEngagementData();
    }, 200);

    console.log('✅ Visual tracking started!');
  }

  /**
   * Stop tracking
   */
  function stopTracking() {
    if (!isTracking) return;

    console.log('🛑 Stopping visual tracking...');

    if (processingInterval) {
      clearInterval(processingInterval);
      processingInterval = null;
    }

    // Tell offscreen document to stop
    chrome.runtime.sendMessage({
      type: 'STOP_VISUAL_TRACKING'
    }).catch(() => {});

    isTracking = false;
    console.log('✅ Visual tracking stopped');
  }

  /**
   * Get current engagement data
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

  console.log('✅ Visual Tracker (Offscreen) Ready!');

})();
