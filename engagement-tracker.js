/**
 * MAIN ENGAGEMENT TRACKER
 * Combines visual and audio tracking into unified engagement monitoring
 */

(function() {
  console.log('📊 Main Engagement Tracker Loading...');

  let isActive = false;
  let engagementPanel = null;
  let updateInterval = null;

  /**
   * Create engagement panel UI
   */
  function createEngagementPanel() {
    if (engagementPanel) return;

    engagementPanel = document.createElement('div');
    engagementPanel.id = 'engagement-panel';
    engagementPanel.innerHTML = `
      <style>
        #engagement-panel {
          position: fixed !important;
          top: 20px !important;
          left: 20px !important;
          width: 340px !important;
          background: rgba(15, 12, 41, 0.94) !important;
          backdrop-filter: blur(30px) saturate(150%) !important;
          -webkit-backdrop-filter: blur(30px) saturate(150%) !important;
          border: 1.5px solid rgba(16, 185, 129, 0.3) !important;
          border-radius: 20px !important;
          padding: 20px !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7),
                      0 0 0 1px rgba(16, 185, 129, 0.2) inset !important;
          z-index: 999997 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif !important;
          color: white !important;
          overflow: hidden !important;
        }

        #engagement-panel::before {
          content: '' !important;
          position: absolute !important;
          top: -50% !important;
          left: -50% !important;
          width: 200% !important;
          height: 200% !important;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%) !important;
          animation: engagementGlow 15s linear infinite !important;
          pointer-events: none !important;
        }

        @keyframes engagementGlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .engagement-header {
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          margin-bottom: 18px !important;
          padding-bottom: 16px !important;
          border-bottom: 1px solid rgba(16, 185, 129, 0.2) !important;
        }

        .engagement-icon {
          font-size: 24px !important;
        }

        .engagement-title {
          font-size: 16px !important;
          font-weight: 700 !important;
          background: linear-gradient(135deg, #10b981 0%, #6ee7b7 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          letter-spacing: -0.3px !important;
        }

        #engagement-metrics {
          position: relative !important;
        }

        .engagement-metric {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          padding: 10px 12px !important;
          margin-bottom: 8px !important;
          background: rgba(255, 255, 255, 0.04) !important;
          border-radius: 10px !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          transition: all 0.2s ease !important;
        }

        .engagement-metric:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          transform: translateX(3px) !important;
        }

        .metric-icon {
          font-size: 18px !important;
          width: 28px !important;
          text-align: center !important;
        }

        .metric-label {
          font-size: 12px !important;
          font-weight: 600 !important;
          color: rgba(255, 255, 255, 0.7) !important;
          min-width: 80px !important;
        }

        .metric-value {
          font-size: 13px !important;
          font-weight: 600 !important;
          color: #6ee7b7 !important;
          margin-left: auto !important;
        }

        .section-header {
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          color: rgba(16, 185, 129, 0.8) !important;
          margin: 16px 0 10px 0 !important;
        }

        .status-indicator {
          display: inline-block !important;
          padding: 3px 8px !important;
          border-radius: 6px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
        }

        .status-good {
          background: rgba(16, 185, 129, 0.2) !important;
          color: #6ee7b7 !important;
        }

        .status-medium {
          background: rgba(245, 158, 11, 0.2) !important;
          color: #fbbf24 !important;
        }

        .status-low {
          background: rgba(239, 68, 68, 0.2) !important;
          color: #fca5a5 !important;
        }
      </style>

      <div class="engagement-header">
        <span class="engagement-icon">📊</span>
        <span class="engagement-title">Client Engagement</span>
      </div>

      <div id="engagement-metrics">
        <div class="section-header">👁️ Visual Signals</div>
        <div class="engagement-metric">
          <span class="metric-icon">👤</span>
          <span class="metric-label">Lean:</span>
          <span class="metric-value" id="lean-value">Detecting...</span>
        </div>
        <div class="engagement-metric">
          <span class="metric-icon">👀</span>
          <span class="metric-label">Gaze:</span>
          <span class="metric-value" id="gaze-value">Detecting...</span>
        </div>
        <div class="engagement-metric">
          <span class="metric-icon">👁️</span>
          <span class="metric-label">Blink Rate:</span>
          <span class="metric-value" id="blink-value">0/min</span>
        </div>
        <div class="engagement-metric">
          <span class="metric-icon">😊</span>
          <span class="metric-label">Smiles:</span>
          <span class="metric-value" id="smile-value">0</span>
        </div>
        <div class="engagement-metric">
          <span class="metric-icon">😌</span>
          <span class="metric-label">Tension:</span>
          <span class="metric-value" id="tension-value">Relaxed</span>
        </div>

        <div class="section-header">🎙️ Audio Signals</div>
        <div class="engagement-metric">
          <span class="metric-icon">🗣️</span>
          <span class="metric-label">Speech Rate:</span>
          <span class="metric-value" id="speech-rate-value">0 WPM</span>
        </div>
        <div class="engagement-metric">
          <span class="metric-icon">🎵</span>
          <span class="metric-label">Prosody:</span>
          <span class="metric-value" id="prosody-value">Normal</span>
        </div>
        <div class="engagement-metric">
          <span class="metric-icon">🔊</span>
          <span class="metric-label">Energy:</span>
          <span class="metric-value" id="energy-value">Medium</span>
        </div>
        <div class="engagement-metric">
          <span class="metric-icon">⏸️</span>
          <span class="metric-label">Avg Pause:</span>
          <span class="metric-value" id="pause-value">0s</span>
        </div>

        <div class="section-header">🎯 Overall</div>
        <div class="engagement-metric">
          <span class="metric-icon">🎯</span>
          <span class="metric-label">Attention:</span>
          <span class="metric-value" id="attention-value">100%</span>
        </div>
      </div>
    `;

    document.body.appendChild(engagementPanel);
    console.log('✅ Engagement panel created');
  }

  /**
   * Update engagement panel with latest data
   */
  function updateEngagementPanel() {
    if (!window.visualTracker || !window.audioTracker) return;

    const visualData = window.visualTracker.getData();
    const audioData = window.audioTracker.getData();

    // Update visual metrics
    const leanEl = document.getElementById('lean-value');
    if (leanEl) {
      leanEl.textContent = `${visualData.lean.direction} (${visualData.lean.confidence}%)`;
      leanEl.className = 'metric-value';
      if (visualData.lean.direction === 'forward') {
        leanEl.classList.add('status-good');
      } else if (visualData.lean.direction === 'backward') {
        leanEl.classList.add('status-low');
      }
    }

    const gazeEl = document.getElementById('gaze-value');
    if (gazeEl) {
      gazeEl.textContent = visualData.gaze.stable ? 'Stable ✅' : 'Wandering ⚠️';
      gazeEl.className = 'metric-value ' + (visualData.gaze.stable ? 'status-good' : 'status-low');
    }

    const blinkEl = document.getElementById('blink-value');
    if (blinkEl) {
      blinkEl.textContent = `${visualData.blinks.perMinute}/min`;
      // Normal blink rate: 15-20/min
      const rate = visualData.blinks.perMinute;
      if (rate >= 15 && rate <= 25) {
        blinkEl.className = 'metric-value status-good';
      } else if (rate > 30) {
        blinkEl.className = 'metric-value status-low'; // Stressed
      } else {
        blinkEl.className = 'metric-value status-medium';
      }
    }

    const smileEl = document.getElementById('smile-value');
    if (smileEl) {
      smileEl.textContent = visualData.smile.smiling ?
        `${visualData.smile.count} 😊` :
        `${visualData.smile.count}`;
      smileEl.className = 'metric-value ' + (visualData.smile.smiling ? 'status-good' : '');
    }

    const tensionEl = document.getElementById('tension-value');
    if (tensionEl) {
      tensionEl.textContent = visualData.tension.status;
      tensionEl.className = 'metric-value';
      if (visualData.tension.status === 'relaxed') {
        tensionEl.classList.add('status-good');
      } else if (visualData.tension.status === 'tense') {
        tensionEl.classList.add('status-low');
      } else {
        tensionEl.classList.add('status-medium');
      }
    }

    // Update audio metrics
    const speechRateEl = document.getElementById('speech-rate-value');
    if (speechRateEl) {
      speechRateEl.textContent = `${audioData.speechRate.wordsPerMinute} WPM`;
      speechRateEl.className = 'metric-value';
      if (audioData.speechRate.status === 'normal') {
        speechRateEl.classList.add('status-good');
      } else {
        speechRateEl.classList.add('status-medium');
      }
    }

    const prosodyEl = document.getElementById('prosody-value');
    if (prosodyEl) {
      prosodyEl.textContent = audioData.prosody.status;
      prosodyEl.className = 'metric-value';
      if (audioData.prosody.status === 'expressive') {
        prosodyEl.classList.add('status-good');
      } else if (audioData.prosody.status === 'monotone') {
        prosodyEl.classList.add('status-low');
      } else {
        prosodyEl.classList.add('status-medium');
      }
    }

    const energyEl = document.getElementById('energy-value');
    if (energyEl) {
      energyEl.textContent = `${audioData.energy.energyLevel} (${audioData.energy.volumeDb}dB)`;
      energyEl.className = 'metric-value';
      if (audioData.energy.energyLevel === 'medium' || audioData.energy.energyLevel === 'high') {
        energyEl.classList.add('status-good');
      } else {
        energyEl.classList.add('status-low');
      }
    }

    const pauseEl = document.getElementById('pause-value');
    if (pauseEl) {
      pauseEl.textContent = audioData.pauses.avgDuration > 0 ?
        `${audioData.pauses.avgDuration}s` : '0s';
    }

    const attentionEl = document.getElementById('attention-value');
    if (attentionEl) {
      attentionEl.textContent = `${visualData.screenAttention.score}%`;
      attentionEl.className = 'metric-value';
      if (visualData.screenAttention.score > 70) {
        attentionEl.classList.add('status-good');
      } else if (visualData.screenAttention.score > 40) {
        attentionEl.classList.add('status-medium');
      } else {
        attentionEl.classList.add('status-low');
      }
    }
  }

  /**
   * Start engagement tracking
   */
  async function startTracking() {
    if (isActive) {
      console.log('Already active, skipping');
      return;
    }

    console.log('🚀 Starting engagement tracking...');

    // Create UI panel
    console.log('Creating engagement panel...');
    createEngagementPanel();
    console.log('✅ Panel created!');

    // Wait for trackers to load
    console.log('Waiting for trackers to load...');
    let retries = 0;
    while ((!window.visualTracker || !window.audioTracker) && retries < 10) {
      console.log(`Retry ${retries}/10 - visualTracker: ${!!window.visualTracker}, audioTracker: ${!!window.audioTracker}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    if (!window.visualTracker || !window.audioTracker) {
      console.error('❌ Trackers not loaded after 10 retries!');
      console.error('visualTracker exists:', !!window.visualTracker);
      console.error('audioTracker exists:', !!window.audioTracker);

      // Show panel anyway even if trackers not loaded
      console.log('⚠️ Showing panel anyway with default values');
      isActive = true;
      updateInterval = setInterval(updateEngagementPanel, 1000);
      return;
    }

    console.log('✅ Both trackers loaded!');

    // Start visual tracking
    if (window.visualTracker) {
      await window.visualTracker.start();
    }

    // Start audio tracking
    if (window.audioTracker) {
      await window.audioTracker.start();
    }

    isActive = true;

    // Update UI every second
    updateInterval = setInterval(updateEngagementPanel, 1000);

    console.log('✅ Engagement tracking active!');
  }

  /**
   * Stop engagement tracking
   */
  function stopTracking() {
    if (!isActive) return;

    console.log('🛑 Stopping engagement tracking...');

    if (window.visualTracker) {
      window.visualTracker.stop();
    }

    if (window.audioTracker) {
      window.audioTracker.stop();
    }

    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }

    isActive = false;

    console.log('✅ Engagement tracking stopped');
  }

  /**
   * Get combined engagement data
   */
  function getEngagementData() {
    return {
      visual: window.visualTracker ? window.visualTracker.getData() : null,
      audio: window.audioTracker ? window.audioTracker.getData() : null
    };
  }

  // Export globally
  window.engagementTracker = {
    start: startTracking,
    stop: stopTracking,
    getData: getEngagementData
  };

  // Auto-start ALWAYS after 3 seconds (no need to check for meeting)
  setTimeout(() => {
    console.log('📊 AUTO-STARTING ENGAGEMENT TRACKER...');
    console.log('Creating panel and starting trackers...');
    startTracking();
  }, 3000);

  console.log('✅ Main Engagement Tracker Ready!');

})();
