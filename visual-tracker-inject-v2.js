/**
 * VISUAL TRACKER - INJECTION WRAPPER
 * Injects TensorFlow.js tracker into page context to bypass CSP
 */

(function() {
  console.log('📹 Visual Tracker Injector Loading...');

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
   * Inject tracker script into page context
   */
  function injectTracker() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected-tracker.js');
    script.onload = () => {
      console.log('✅ Tracker script injected into page context');
      script.remove();
    };
    script.onerror = () => {
      console.error('❌ Failed to inject tracker script');
    };
    (document.head || document.documentElement).appendChild(script);
  }

  /**
   * Listen for data from injected script
   */
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'VISUAL_DATA') {
      engagementData = event.data.data;
    }
  });

  /**
   * Export API for engagement tracker
   */
  window.visualTracker = {
    start: () => {
      console.log('Visual tracker auto-starts after injection');
    },
    stop: () => {
      console.log('Visual tracker stop requested');
    },
    getData: () => engagementData
  };

  // Inject immediately
  injectTracker();

  console.log('✅ Visual Tracker Injector Ready!');

})();
