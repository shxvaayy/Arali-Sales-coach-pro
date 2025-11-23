/**
 * Simple Recorder with UI Panel
 */

(function() {
  console.log('🎙️ Recorder CLEAN - Loading...');

  let panel = null;

  function createPanel() {
    if (panel) return;

    panel = document.createElement('div');
    panel.id = 'clean-recorder-panel';
    panel.innerHTML = `
      <style>
        #clean-recorder-panel {
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          width: 320px !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border-radius: 20px !important;
          padding: 24px !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
          z-index: 999999 !important;
          font-family: -apple-system, system-ui, sans-serif !important;
          color: white !important;
        }

        #recorder-title {
          font-size: 20px !important;
          font-weight: 700 !important;
          margin-bottom: 20px !important;
        }

        #recorder-status {
          background: rgba(255,255,255,0.2) !important;
          border-radius: 12px !important;
          padding: 16px !important;
          margin-bottom: 16px !important;
        }

        #status-text {
          font-size: 14px !important;
          font-weight: 600 !important;
          margin-bottom: 8px !important;
        }

        #recording-state {
          font-size: 16px !important;
          font-weight: 700 !important;
          text-align: center !important;
          padding: 10px !important;
          background: rgba(255,255,255,0.3) !important;
          border-radius: 8px !important;
        }

        #participants-box {
          background: rgba(0,0,0,0.2) !important;
          border-radius: 12px !important;
          padding: 12px !important;
        }

        #participants-title {
          font-size: 12px !important;
          font-weight: 600 !important;
          margin-bottom: 8px !important;
          opacity: 0.8 !important;
        }

        #participants-list {
          font-size: 14px !important;
        }

        .participant-item {
          padding: 4px 0 !important;
        }
      </style>

      <div id="recorder-title">
        🎙️ Meet Recorder CLEAN
      </div>

      <div id="recorder-status">
        <div id="status-text">Checking meeting...</div>
        <div id="recording-state">⏸️ NOT RECORDING</div>
      </div>

      <div id="participants-box">
        <div id="participants-title">👥 PARTICIPANTS</div>
        <div id="participants-list">Loading...</div>
      </div>
    `;

    document.body.appendChild(panel);
    console.log('✅ Panel created');

    // Update participants display
    setInterval(updateParticipantsDisplay, 3000);
    setTimeout(updateParticipantsDisplay, 1000);
  }

  function updateParticipantsDisplay() {
    const listEl = document.getElementById('participants-list');
    if (!listEl) return;

    if (!window.meetParticipants || window.meetParticipants.length === 0) {
      listEl.innerHTML = '<div style="opacity: 0.6;">No participants yet...</div>';
      return;
    }

    const html = window.meetParticipants.map((name, i) => `
      <div class="participant-item">
        <span style="opacity: 0.7;">${i + 1}.</span> ${name}
      </div>
    `).join('');

    listEl.innerHTML = html;

    console.log('✅ Participants displayed:', window.meetParticipants);
  }

  function checkMeeting() {
    const statusEl = document.getElementById('status-text');
    if (!statusEl) return;

    // Check if in meeting
    const micButton = document.querySelector('[data-is-muted]') ||
                      document.querySelector('[aria-label*="microphone" i]');

    if (micButton) {
      statusEl.textContent = '✅ In Meeting';
    } else {
      statusEl.textContent = 'Waiting for meeting...';
    }
  }

  // Initialize
  setTimeout(() => {
    console.log('🚀 Initializing recorder...');
    createPanel();
    setInterval(checkMeeting, 2000);
    checkMeeting();
  }, 2000);

  console.log('✅ Recorder CLEAN - Ready!');

})();
