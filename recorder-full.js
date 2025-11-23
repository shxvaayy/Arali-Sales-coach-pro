/**
 * Full Featured Recorder
 * - Auto record
 * - Live speech recognition
 * - Speaker detection
 * - AI suggestions
 * - Auto save everything
 */

(function() {
  console.log('🎙️ Full Recorder Loading...');

  // State
  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];
  let conversation = [];
  let currentSpeaker = null;
  let speechRecognition = null;
  let panel = null;
  let aiPanel = null;

  // Get Gemini API key from storage
  let geminiApiKey = null;
  chrome.storage.local.get(['geminiApiKey', 'openaiApiKey'], (result) => {
    geminiApiKey = result.openaiApiKey || result.geminiApiKey;
    if (geminiApiKey) {
      console.log('✅ AI API Key loaded');
    }
  });

  /**
   * Create main panel
   */
  function createPanel() {
    if (panel) return;

    panel = document.createElement('div');
    panel.id = 'full-recorder-panel';
    panel.innerHTML = `
      <style>
        #full-recorder-panel {
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          width: 350px !important;
          background: rgba(17, 25, 40, 0.95) !important;
          backdrop-filter: blur(20px) !important;
          border: 2px solid rgba(139, 92, 246, 0.5) !important;
          border-radius: 20px !important;
          padding: 24px !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
          z-index: 999998 !important;
          font-family: -apple-system, system-ui, sans-serif !important;
          color: white !important;
        }

        #panel-title {
          font-size: 18px !important;
          font-weight: 700 !important;
          margin-bottom: 16px !important;
          color: #c4b5fd !important;
        }

        .panel-section {
          background: rgba(139, 92, 246, 0.15) !important;
          border-radius: 12px !important;
          padding: 16px !important;
          margin-bottom: 16px !important;
        }

        .section-title {
          font-size: 12px !important;
          font-weight: 600 !important;
          color: rgba(255,255,255,0.7) !important;
          margin-bottom: 8px !important;
          text-transform: uppercase !important;
        }

        #recording-status {
          font-size: 16px !important;
          font-weight: 700 !important;
          text-align: center !important;
          padding: 12px !important;
          background: rgba(99, 102, 241, 0.3) !important;
          border-radius: 10px !important;
        }

        .recording-active {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          animation: pulse 2s infinite !important;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        #participants-list {
          font-size: 13px !important;
        }

        .participant-item {
          padding: 4px 0 !important;
        }

        #conversation-box {
          background: rgba(0,0,0,0.3) !important;
          border-radius: 10px !important;
          padding: 12px !important;
          max-height: 200px !important;
          overflow-y: auto !important;
        }

        #conversation-box::-webkit-scrollbar {
          width: 4px !important;
        }

        #conversation-box::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5) !important;
          border-radius: 2px !important;
        }

        .conv-line {
          font-size: 12px !important;
          margin: 6px 0 !important;
          color: rgba(255,255,255,0.9) !important;
        }

        .conv-speaker {
          font-weight: 700 !important;
          color: #c4b5fd !important;
        }
      </style>

      <div id="panel-title">
        🎙️ Full Recorder
      </div>

      <div class="panel-section">
        <div class="section-title">Status</div>
        <div id="meeting-status">Checking...</div>
        <div id="recording-status">⏸️ NOT RECORDING</div>
      </div>

      <div class="panel-section">
        <div class="section-title">👥 Participants</div>
        <div id="participants-list">Loading...</div>
      </div>

      <div class="panel-section">
        <div class="section-title">💬 Live Conversation</div>
        <div id="conversation-box">
          <div style="opacity: 0.6;">Waiting for speech...</div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    console.log('✅ Main panel created');
  }

  /**
   * Create AI suggestions panel
   */
  function createAIPanel() {
    if (aiPanel) return;

    aiPanel = document.createElement('div');
    aiPanel.id = 'ai-suggestions-panel';
    aiPanel.innerHTML = `
      <style>
        #ai-suggestions-panel {
          position: fixed !important;
          top: 80px !important;
          left: 20px !important;
          width: 400px !important;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          border-radius: 20px !important;
          padding: 24px !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
          z-index: 999999 !important;
          font-family: -apple-system, system-ui, sans-serif !important;
          color: white !important;
        }

        #ai-title {
          font-size: 20px !important;
          font-weight: 700 !important;
          margin-bottom: 16px !important;
        }

        #ai-suggestion-box {
          background: rgba(255,255,255,0.2) !important;
          border-radius: 12px !important;
          padding: 20px !important;
          min-height: 100px !important;
        }

        #ai-label {
          font-size: 12px !important;
          font-weight: 600 !important;
          margin-bottom: 10px !important;
          opacity: 0.8 !important;
        }

        #ai-suggestion-text {
          font-size: 18px !important;
          line-height: 1.6 !important;
          font-weight: 600 !important;
        }

        .ai-loading {
          opacity: 0.7 !important;
          font-style: italic !important;
        }
      </style>

      <div id="ai-title">
        🤖 AI Sales Coach
      </div>

      <div id="ai-suggestion-box">
        <div id="ai-label">💡 WHAT TO SAY NEXT</div>
        <div id="ai-suggestion-text">
          Start speaking in the meeting...
        </div>
      </div>
    `;

    document.body.appendChild(aiPanel);
    console.log('✅ AI panel created');
  }

  /**
   * Update participants display
   */
  function updateParticipants() {
    const listEl = document.getElementById('participants-list');
    if (!listEl) return;

    if (!window.meetParticipants || window.meetParticipants.length === 0) {
      listEl.innerHTML = '<div style="opacity: 0.6;">Detecting...</div>';
      return;
    }

    const html = window.meetParticipants.map((name, i) => `
      <div class="participant-item">
        <span style="opacity: 0.7;">${i + 1}.</span> ${name}
      </div>
    `).join('');

    listEl.innerHTML = html;
  }

  /**
   * Update conversation display
   */
  function updateConversation() {
    const convBox = document.getElementById('conversation-box');
    if (!convBox) return;

    if (conversation.length === 0) {
      convBox.innerHTML = '<div style="opacity: 0.6;">Waiting for speech...</div>';
      return;
    }

    // Show last 5 messages
    const recent = conversation.slice(-5);
    const html = recent.map(msg => `
      <div class="conv-line">
        <span class="conv-speaker">${msg.speaker}:</span> ${msg.text}
      </div>
    `).join('');

    convBox.innerHTML = html;
    convBox.scrollTop = convBox.scrollHeight;
  }

  /**
   * Detect current speaker
   */
  function detectSpeaker() {
    // Find video tile with speaking indicator (green border)
    const videoTiles = document.querySelectorAll('[data-participant-id], [data-requested-participant-id]');

    for (const tile of videoTiles) {
      const style = window.getComputedStyle(tile);

      // Check for green border (speaking indicator)
      if (style.borderColor && style.borderColor.includes('76, 175, 80')) {
        // Extract name from this tile
        const nameEl = tile.querySelector('[data-self-name]') ||
                      tile.querySelector('div[class*="zs"]');

        if (nameEl) {
          const name = nameEl.getAttribute('data-self-name') || nameEl.textContent.trim();
          if (name && window.meetParticipants.includes(name)) {
            return name;
          }
        }
      }
    }

    // Fallback: use first participant (usually you)
    return window.meetParticipants[0] || 'Speaker';
  }

  /**
   * Start speech recognition
   */
  function startSpeechRecognition() {
    if (speechRecognition) return;

    if (!('webkitSpeechRecognition' in window)) {
      console.error('❌ Speech recognition not supported');
      return;
    }

    speechRecognition = new webkitSpeechRecognition();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'en-US';

    speechRecognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const text = result[0].transcript;
        const speaker = detectSpeaker();

        console.log(`🎤 ${speaker}: ${text}`);

        // Add to conversation
        conversation.push({ speaker, text });
        updateConversation();

        // Get AI suggestion
        getAISuggestion();
      }
    };

    speechRecognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
    };

    speechRecognition.start();
    console.log('✅ Speech recognition started');
  }

  /**
   * Get AI suggestion
   */
  async function getAISuggestion() {
    if (!geminiApiKey) {
      console.warn('⚠️ No API key, skipping AI');
      return;
    }

    const suggestionEl = document.getElementById('ai-suggestion-text');
    if (!suggestionEl) return;

    suggestionEl.innerHTML = '<span class="ai-loading">🤔 Analyzing...</span>';

    try {
      // Get recent conversation (last 5 messages)
      const context = conversation.slice(-5)
        .map(msg => `${msg.speaker}: ${msg.text}`)
        .join('\n');

      // Call Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + geminiApiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a sales coach. Based on this conversation, suggest what to say next (max 20 words):

${context}

Suggestion:`
            }]
          }]
        })
      });

      const data = await response.json();
      const suggestion = data.candidates[0]?.content?.parts[0]?.text || 'Keep listening...';

      suggestionEl.textContent = suggestion;
      console.log('💡 AI Suggestion:', suggestion);

    } catch (error) {
      console.error('❌ AI error:', error);
      suggestionEl.textContent = 'AI unavailable';
    }
  }

  /**
   * Start recording
   */
  async function startRecording() {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        saveRecording();
      };

      mediaRecorder.start(1000);
      isRecording = true;

      const statusEl = document.getElementById('recording-status');
      if (statusEl) {
        statusEl.textContent = '🔴 RECORDING';
        statusEl.className = 'recording-active';
      }

      console.log('🎙️ Recording started');

      // Start speech recognition
      startSpeechRecognition();

    } catch (error) {
      console.error('❌ Recording failed:', error);
    }
  }

  /**
   * Stop recording and save
   */
  function stopRecording() {
    if (!isRecording) return;

    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    if (speechRecognition) {
      speechRecognition.stop();
      speechRecognition = null;
    }

    isRecording = false;

    const statusEl = document.getElementById('recording-status');
    if (statusEl) {
      statusEl.textContent = '💾 SAVING...';
      statusEl.className = '';
    }

    console.log('🛑 Recording stopped');
  }

  /**
   * Save recording and transcript
   */
  function saveRecording() {
    const timestamp = Date.now();

    // Save audio
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
    const audioUrl = URL.createObjectURL(audioBlob);
    downloadFile(audioUrl, `meeting-${timestamp}.webm`);

    // Save transcript
    const transcript = conversation
      .map(msg => `${msg.speaker}: ${msg.text}`)
      .join('\n\n');

    const transcriptText = `Meeting Transcript - ${new Date().toLocaleString()}

Participants:
${window.meetParticipants.map((n, i) => `${i + 1}. ${n}`).join('\n')}

---

${transcript}
`;

    const textBlob = new Blob([transcriptText], { type: 'text/plain' });
    const textUrl = URL.createObjectURL(textBlob);
    downloadFile(textUrl, `transcript-${timestamp}.txt`);

    console.log('✅ Files saved!');
    showNotification('✅ Recording & Transcript Saved!');

    const statusEl = document.getElementById('recording-status');
    if (statusEl) {
      statusEl.textContent = '✅ SAVED';
    }
  }

  /**
   * Download file
   */
  function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Show notification
   */
  function showNotification(message) {
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      padding: 24px 40px !important;
      border-radius: 16px !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
      z-index: 9999999 !important;
      font-size: 20px !important;
      font-weight: 700 !important;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => notif.remove(), 2000);
  }

  /**
   * Check meeting status
   */
  function checkMeeting() {
    const statusEl = document.getElementById('meeting-status');
    if (!statusEl) return;

    const micButton = document.querySelector('[data-is-muted]') ||
                      document.querySelector('[aria-label*="microphone" i]');

    if (micButton && !isRecording) {
      statusEl.textContent = '✅ In Meeting';
      // Auto-start recording
      console.log('🎙️ Meeting detected, starting auto-record...');
      setTimeout(() => startRecording(), 2000);
    } else if (!micButton && isRecording) {
      statusEl.textContent = '📴 Meeting ended';
      stopRecording();
    } else if (micButton) {
      statusEl.textContent = '✅ In Meeting';
    } else {
      statusEl.textContent = 'Waiting...';
    }
  }

  // Initialize
  setTimeout(() => {
    console.log('🚀 Initializing full recorder...');
    createPanel();
    createAIPanel();

    // Update participants every 3 seconds
    setInterval(updateParticipants, 3000);
    updateParticipants();

    // Check meeting status every 2 seconds
    setInterval(checkMeeting, 2000);
    checkMeeting();
  }, 2000);

  console.log('✅ Full Recorder Ready!');

})();
