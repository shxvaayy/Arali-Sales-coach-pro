/**
 * SALES COACH - OpenAI Powered
 * - Listens to BOTH speakers (you + client)
 * - INSTANT AI suggestions
 * - Sales-focused coaching
 */

(function() {
  console.log('🤖 SALES COACH (OpenAI) Loading...');

  // State
  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];
  let conversation = [];
  let speechRecognition = null;
  let panel = null;
  let aiPanel = null;
  let lastAIUpdate = 0;

  // OpenAI API key
  let openaiApiKey = null;
  chrome.storage.local.get(['openaiApiKey', 'geminiApiKey'], (result) => {
    openaiApiKey = result.openaiApiKey || result.geminiApiKey;
    if (openaiApiKey) {
      console.log('✅ OpenAI API Key loaded');
    } else {
      console.warn('⚠️ No API key found! Click extension icon to add.');
    }
  });

  // Track current speaker
  let myName = null; // Your name
  let clientName = null; // Client's name

  /**
   * Create main panel
   */
  function createPanel() {
    if (panel) return;

    // Get icon URL properly
    const iconUrl = chrome.runtime.getURL('icons/icon.png');
    console.log('📷 Main Panel Icon URL:', iconUrl);

    panel = document.createElement('div');
    panel.id = 'sales-panel';
    panel.innerHTML = `
      <style>
        #sales-panel {
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          width: 360px !important;
          background: rgba(15, 12, 41, 0.92) !important;
          backdrop-filter: blur(30px) saturate(150%) !important;
          -webkit-backdrop-filter: blur(30px) saturate(150%) !important;
          border: 1.5px solid rgba(139, 92, 246, 0.3) !important;
          border-radius: 20px !important;
          padding: 24px !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.7),
                      0 0 0 1px rgba(139, 92, 246, 0.2) inset !important;
          z-index: 999998 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif !important;
          color: white !important;
          overflow: hidden !important;
        }

        /* Animated glow effect */
        #sales-panel::before {
          content: '' !important;
          position: absolute !important;
          top: -50% !important;
          left: -50% !important;
          width: 200% !important;
          height: 200% !important;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%) !important;
          animation: panelGlow 15s linear infinite !important;
          pointer-events: none !important;
        }

        @keyframes panelGlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Company Branding - Premium Look */
        .company-branding {
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          margin-bottom: 20px !important;
          padding: 16px !important;
          background: rgba(255, 255, 255, 0.06) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 14px !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
        }

        .company-logo {
          width: 32px !important;
          height: 32px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4) !important;
          border: 1.5px solid rgba(139, 92, 246, 0.3) !important;
        }

        .company-name {
          font-size: 18px !important;
          font-weight: 800 !important;
          background: linear-gradient(135deg, #fff 0%, #c4b5fd 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          letter-spacing: -0.3px !important;
        }

        .panel-title {
          font-size: 14px !important;
          font-weight: 700 !important;
          margin-bottom: 18px !important;
          color: #c4b5fd !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          opacity: 0.9 !important;
        }

        /* Status Box - Modern Card */
        .status-box {
          position: relative !important;
          background: rgba(139, 92, 246, 0.12) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(139, 92, 246, 0.25) !important;
          border-radius: 14px !important;
          padding: 16px !important;
          margin-bottom: 16px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
        }

        .status-label {
          font-size: 10px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          color: rgba(196, 181, 253, 0.8) !important;
          margin-bottom: 8px !important;
        }

        #recording-status {
          font-size: 15px !important;
          font-weight: 700 !important;
          text-align: center !important;
          padding: 12px !important;
          background: rgba(99, 102, 241, 0.25) !important;
          border-radius: 10px !important;
          border: 1px solid rgba(99, 102, 241, 0.3) !important;
          color: rgba(255, 255, 255, 0.95) !important;
          transition: all 0.3s ease !important;
        }

        .recording-active {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          border-color: rgba(239, 68, 68, 0.5) !important;
          animation: recordingPulse 1.5s ease-in-out infinite !important;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.5) !important;
        }

        @keyframes recordingPulse {
          0%, 100% {
            opacity: 1 !important;
            transform: scale(1) !important;
          }
          50% {
            opacity: 0.9 !important;
            transform: scale(1.02) !important;
          }
        }

        /* Participants Box */
        .participants-box {
          position: relative !important;
          background: rgba(255, 255, 255, 0.04) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 14px !important;
          padding: 14px !important;
          margin-bottom: 16px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }

        .participant-item {
          padding: 8px !important;
          font-size: 13px !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          margin-bottom: 4px !important;
          border-radius: 8px !important;
          transition: background 0.2s ease !important;
        }

        .participant-item:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .participant-dot {
          display: inline-block !important;
          width: 10px !important;
          height: 10px !important;
          border-radius: 50% !important;
          flex-shrink: 0 !important;
          box-shadow: 0 0 8px currentColor !important;
          animation: dotPulse 2s ease-in-out infinite !important;
        }

        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* Conversation Box - Chat-like */
        #conversation-box {
          position: relative !important;
          background: rgba(0, 0, 0, 0.35) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 12px !important;
          padding: 12px !important;
          max-height: 200px !important;
          overflow-y: auto !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) inset !important;
        }

        #conversation-box::-webkit-scrollbar {
          width: 6px !important;
        }

        #conversation-box::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2) !important;
          border-radius: 3px !important;
        }

        #conversation-box::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5) !important;
          border-radius: 3px !important;
          transition: background 0.2s ease !important;
        }

        #conversation-box::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7) !important;
        }

        .conv-line {
          font-size: 12px !important;
          margin: 8px 0 !important;
          padding: 10px 12px !important;
          background: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(5px) !important;
          border-left: 3px solid !important;
          border-radius: 8px !important;
          line-height: 1.5 !important;
          transition: all 0.2s ease !important;
        }

        .conv-line:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          transform: translateX(2px) !important;
        }

        .conv-line.you {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.08) !important;
        }

        .conv-line.client {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.08) !important;
        }

        .conv-speaker {
          font-weight: 700 !important;
          margin-right: 6px !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
        }

        .conv-speaker.you {
          color: #6ee7b7 !important;
        }

        .conv-speaker.client {
          color: #fbbf24 !important;
        }
      </style>

      <div class="company-branding">
        <img src="${iconUrl}" class="company-logo" alt="Arali.ai" />
        <span class="company-name">Arali.ai</span>
      </div>

      <div class="panel-title">
        🎙️ Sales Coach
      </div>

      <div class="status-box">
        <div class="status-label">STATUS</div>
        <div id="recording-status">⏸️ NOT RECORDING</div>
      </div>

      <div class="participants-box">
        <div class="status-label">👥 PARTICIPANTS</div>
        <div id="participants-list">Loading...</div>
      </div>

      <div class="status-box">
        <div class="status-label">💬 LIVE CONVERSATION</div>
        <div id="conversation-box">
          <div style="opacity: 0.6; font-size: 12px;">Waiting for speech...</div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    console.log('✅ Main panel created');
  }

  /**
   * Create AI Coach panel - LEFT SIDE, BIG
   */
  function createAIPanel() {
    if (aiPanel) return;

    // Get icon URL properly
    const iconUrl = chrome.runtime.getURL('icons/icon.png');
    console.log('📷 AI Panel Icon URL:', iconUrl);

    aiPanel = document.createElement('div');
    aiPanel.id = 'ai-coach-panel';
    aiPanel.innerHTML = `
      <style>
        #ai-coach-panel {
          position: fixed !important;
          bottom: 100px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 500px !important;
          background: rgba(0, 0, 0, 0.4) !important;
          backdrop-filter: blur(25px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(25px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 20px !important;
          padding: 24px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
                      0 0 0 1px rgba(255, 255, 255, 0.15) inset !important;
          z-index: 999999 !important;
          font-family: -apple-system, system-ui, sans-serif !important;
          color: white !important;
        }

        #ai-header {
          font-size: 14px !important;
          font-weight: 700 !important;
          margin-bottom: 16px !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          opacity: 0.7 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          color: rgba(255, 255, 255, 0.8) !important;
        }

        #ai-header img {
          width: 24px !important;
          height: 24px !important;
          border-radius: 5px !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4) !important;
          opacity: 0.9 !important;
        }

        .ai-pulse {
          width: 8px !important;
          height: 8px !important;
          background: #ffffff !important;
          border-radius: 50% !important;
          animation: aiPulse 1.5s infinite !important;
        }

        @keyframes aiPulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
          }
          50% {
            opacity: 0.5;
            box-shadow: 0 0 16px rgba(255, 255, 255, 1);
          }
        }

        #ai-suggestion-box {
          background: rgba(0, 0, 0, 0.6) !important;
          border-radius: 16px !important;
          padding: 20px !important;
          min-height: 100px !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
        }

        #ai-label {
          font-size: 11px !important;
          font-weight: 700 !important;
          margin-bottom: 10px !important;
          opacity: 0.7 !important;
          letter-spacing: 1px !important;
          text-transform: uppercase !important;
          color: rgba(255, 255, 255, 0.6) !important;
        }

        #ai-suggestion {
          font-size: 18px !important;
          line-height: 1.6 !important;
          font-weight: 600 !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9) !important;
          color: #ffffff !important;
        }

        .ai-loading {
          opacity: 0.7 !important;
          font-style: italic !important;
          animation: fadeInOut 1.5s infinite !important;
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        /* PROFESSIONAL LOADING ANIMATION */
        .ai-loading-container {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 16px !important;
          padding: 20px 0 !important;
        }

        .loading-dots {
          display: flex !important;
          gap: 8px !important;
        }

        .loading-dot {
          width: 12px !important;
          height: 12px !important;
          border-radius: 50% !important;
          background: #ffffff !important;
          animation: loadingBounce 1.4s infinite ease-in-out both !important;
        }

        .loading-dot:nth-child(1) {
          animation-delay: -0.32s !important;
        }

        .loading-dot:nth-child(2) {
          animation-delay: -0.16s !important;
        }

        @keyframes loadingBounce {
          0%, 80%, 100% {
            transform: scale(0.6) !important;
            opacity: 0.5 !important;
          }
          40% {
            transform: scale(1.2) !important;
            opacity: 1 !important;
          }
        }

        .loading-text {
          font-size: 14px !important;
          font-weight: 600 !important;
          opacity: 0.8 !important;
          animation: fadeInOut 1.5s infinite !important;
          color: #ffffff !important;
        }

        .ai-shimmer {
          background: linear-gradient(90deg,
            rgba(255,255,255,0.1) 0%,
            rgba(255,255,255,0.3) 50%,
            rgba(255,255,255,0.1) 100%) !important;
          background-size: 200% 100% !important;
          animation: shimmer 2s infinite !important;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        #last-client-msg {
          background: rgba(0, 0, 0, 0.5) !important;
          border-radius: 12px !important;
          padding: 12px 14px !important;
          margin-top: 12px !important;
          font-size: 13px !important;
          border-left: 3px solid #f59e0b !important;
          border: 1px solid rgba(245, 158, 11, 0.3) !important;
          backdrop-filter: blur(10px) !important;
        }

        .client-name {
          font-weight: 700 !important;
          color: #fbbf24 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
        }
      </style>

      <div id="ai-header">
        <img src="${iconUrl}" alt="Arali.ai" />
        <span class="ai-pulse"></span>
        <span>AI SALES COACH</span>
      </div>

      <div id="ai-suggestion-box">
        <div id="ai-label">💡 WHAT YOU SHOULD SAY</div>
        <div id="ai-suggestion">
          Join a sales call and start speaking...<br>
          <span style="font-size: 14px; opacity: 0.8; line-height: 1.5;">
            ✓ AI listens to CLIENT's questions<br>
            ✓ Suggests perfect sales responses<br>
            ✓ Real-time coaching for YOU
          </span>
        </div>
      </div>

      <div id="last-client-msg" style="display: none;">
        <div style="font-size: 11px; opacity: 0.8; margin-bottom: 6px; letter-spacing: 0.5px;">⚡ CLIENT JUST SAID:</div>
        <div id="client-msg-text"></div>
      </div>
    `;

    document.body.appendChild(aiPanel);
    console.log('✅ AI Coach panel created');
  }

  /**
   * Update participants
   */
  function updateParticipants() {
    const listEl = document.getElementById('participants-list');
    if (!listEl) return;

    if (!window.meetParticipants || window.meetParticipants.length === 0) {
      listEl.innerHTML = '<div style="opacity: 0.6; font-size: 12px;">Detecting...</div>';
      return;
    }

    // Filter out UI elements ONE MORE TIME (double check)
    const validParticipants = window.meetParticipants.filter(name => {
      const lower = name.toLowerCase();
      return !lower.includes('more') &&
             !lower.includes('info') &&
             !lower.includes('details') &&
             !lower.includes('apps') &&
             !lower.includes('tools') &&
             !lower.includes('options') &&
             !lower.includes('menu') &&
             !lower.includes('admit') &&
             !lower.includes('device') &&
             name.length >= 3 &&
             name.length <= 50;
    });

    console.log('👥 Valid participants after filtering:', validParticipants);

    if (validParticipants.length === 0) {
      listEl.innerHTML = '<div style="opacity: 0.6; font-size: 12px;">No valid participants...</div>';
      return;
    }

    // FIRST IS ALWAYS YOU (extension user), REST ARE CLIENTS
    myName = validParticipants[0];
    clientName = validParticipants[1] || 'Client';

    console.log('✅ YOU (Sales Person / Extension User):', myName);
    console.log('✅ CLIENT (Others):', clientName);
    console.log('🎯 AI will listen to CLIENT and suggest responses for YOU');

    const html = `
      <div class="participant-item">
        <span class="participant-dot" style="background: #10b981;"></span>
        <strong>${myName}</strong> (You)
      </div>
      ${validParticipants.slice(1).map(name => `
        <div class="participant-item">
          <span class="participant-dot" style="background: #f59e0b;"></span>
          ${name}
        </div>
      `).join('')}
    `;

    listEl.innerHTML = html;

    // Update global with filtered list
    window.meetParticipants = validParticipants;
  }

  /**
   * Update conversation display
   */
  function updateConversation() {
    const convBox = document.getElementById('conversation-box');
    if (!convBox) return;

    if (conversation.length === 0) {
      convBox.innerHTML = '<div style="opacity: 0.6; font-size: 12px;">Waiting for speech...</div>';
      return;
    }

    // Show last 6 messages
    const recent = conversation.slice(-6);
    const html = recent.map(msg => {
      const isYou = msg.speaker === myName;
      const className = isYou ? 'you' : 'client';

      return `
        <div class="conv-line ${className}">
          <span class="conv-speaker ${className}">${msg.speaker}:</span>
          <span>${msg.text}</span>
        </div>
      `;
    }).join('');

    convBox.innerHTML = html;
    convBox.scrollTop = convBox.scrollHeight;
  }

  /**
   * Detect current speaker - IMPROVED with multiple methods
   */
  function detectSpeaker() {
    // If no participants detected yet, return default
    if (!window.meetParticipants || window.meetParticipants.length === 0) {
      return 'Speaker';
    }

    console.log('🔍 Detecting speaker...');

    // METHOD 1: Check for speaking indicators (green/blue border + animations)
    const videoTiles = document.querySelectorAll('[data-participant-id], [data-requested-participant-id], [data-allocation-index]');

    for (const tile of videoTiles) {
      const style = window.getComputedStyle(tile);
      const parentStyle = tile.parentElement ? window.getComputedStyle(tile.parentElement) : null;
      const grandParentStyle = tile.parentElement?.parentElement ? window.getComputedStyle(tile.parentElement.parentElement) : null;

      // Check for speaking indicators (multiple levels)
      const hasSpeakingBorder =
        (style.borderColor?.includes('76, 175, 80')) || // green
        (style.borderColor?.includes('66, 133, 244')) || // blue
        (style.borderColor?.includes('rgb(26, 115, 232)')) || // Google blue
        (style.boxShadow && style.boxShadow !== 'none') || // Shadow when speaking
        (style.borderWidth && parseInt(style.borderWidth) > 2); // Thick border

      const hasParentSpeakingBorder =
        (parentStyle?.borderColor?.includes('76, 175, 80')) ||
        (parentStyle?.borderColor?.includes('66, 133, 244')) ||
        (parentStyle?.borderColor?.includes('rgb(26, 115, 232)')) ||
        (parentStyle?.boxShadow && parentStyle.boxShadow !== 'none');

      const hasGrandParentSpeakingBorder =
        (grandParentStyle?.borderColor?.includes('76, 175, 80')) ||
        (grandParentStyle?.borderColor?.includes('66, 133, 244')) ||
        (grandParentStyle?.boxShadow && grandParentStyle.boxShadow !== 'none');

      // Check for "speaking" class or animation
      const hasSpeakingClass =
        tile.className.toLowerCase().includes('speaking') ||
        tile.className.toLowerCase().includes('active') ||
        tile.parentElement?.className.toLowerCase().includes('speaking');

      if (hasSpeakingBorder || hasParentSpeakingBorder || hasGrandParentSpeakingBorder || hasSpeakingClass) {
        // Extract name from this tile
        const nameEl = tile.querySelector('[data-self-name]') ||
                      tile.querySelector('div[class*="zs"]') ||
                      tile.querySelector('span[class*="zs"]') ||
                      tile.querySelector('[aria-label]');

        if (nameEl) {
          let name = nameEl.getAttribute('data-self-name') ||
                    nameEl.textContent?.trim() ||
                    nameEl.getAttribute('aria-label')?.trim();

          // Clean name
          if (name) {
            name = name.replace(/\s*\(You\)\s*$/i, '').trim();

            // Verify this is a real participant
            const matchingParticipant = window.meetParticipants.find(p =>
              p.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(p.toLowerCase())
            );

            if (matchingParticipant) {
              console.log('🎤 ✅ DETECTED (visual indicator):', matchingParticipant);
              return matchingParticipant;
            }
          }
        }
      }
    }

    // Fallback: Try to detect from largest video tile (main speaker)
    let largestTile = null;
    let largestSize = 0;

    videoTiles.forEach(tile => {
      const rect = tile.getBoundingClientRect();
      const size = rect.width * rect.height;
      if (size > largestSize) {
        largestSize = size;
        largestTile = tile;
      }
    });

    if (largestTile && largestSize > 10000) { // Only if reasonably large
      const nameEl = largestTile.querySelector('[data-self-name]') ||
                    largestTile.querySelector('div[class*="zs"]') ||
                    largestTile.querySelector('[aria-label]');

      if (nameEl) {
        let name = nameEl.getAttribute('data-self-name') ||
                  nameEl.textContent?.trim() ||
                  nameEl.getAttribute('aria-label')?.trim();

        if (name) {
          name = name.replace(/\s*\(You\)\s*$/i, '').trim();

          const matchingParticipant = window.meetParticipants.find(p =>
            p.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(p.toLowerCase())
          );

          if (matchingParticipant) {
            console.log('🎤 Detected speaker (largest tile):', matchingParticipant);
            return matchingParticipant;
          }
        }
      }
    }

    // Final fallback: return first participant (usually you)
    const defaultSpeaker = myName || window.meetParticipants[0] || 'Speaker';
    console.log('🎤 Using default speaker:', defaultSpeaker);
    return defaultSpeaker;
  }

  /**
   * Start speech recognition - BOTH speakers
   */
  function startSpeechRecognition() {
    if (speechRecognition) return;

    if (!('webkitSpeechRecognition' in window)) {
      console.error('❌ Speech recognition not supported');
      return;
    }

    speechRecognition = new webkitSpeechRecognition();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true; // TRUE for INSTANT real-time feedback
    speechRecognition.lang = 'en-US';
    speechRecognition.maxAlternatives = 1;

    console.log('🎤 Speech recognition initialized - REAL-TIME mode activated!');

    let lastSpeaker = null; // Track last speaker for alternating
    let interimTranscript = ''; // Track live/interim text

    speechRecognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript.trim();

      // INTERIM RESULTS (live as speaking) - for instant preview
      if (!result.isFinal) {
        interimTranscript = text;
        console.log('🎙️ LIVE (interim):', text);

        // Show interim text in UI (optional - for live feedback)
        const convBox = document.getElementById('conversation-box');
        if (convBox && text.length > 3) {
          // Show preview but don't save to conversation yet
          const previewHtml = `<div class="conv-line" style="opacity: 0.6; font-style: italic;">
            <span class="conv-speaker">🎙️ Live:</span> ${text}...
          </div>`;
          // Keep last messages + preview
          const recentMsgs = conversation.slice(-5).map(msg => {
            const isYou = msg.speaker === myName;
            const className = isYou ? 'you' : 'client';
            return `<div class="conv-line ${className}">
              <span class="conv-speaker ${className}">${msg.speaker}:</span>
              <span>${msg.text}</span>
            </div>`;
          }).join('');
          convBox.innerHTML = recentMsgs + previewHtml;
          convBox.scrollTop = convBox.scrollHeight;
        }
        return; // Don't process interim results
      }

      // FINAL RESULT - Process and save
      if (result.isFinal && text.length > 0) {
        interimTranscript = ''; // Clear interim
        console.log('✅ FINAL speech:', text);

        // Detect speaker with improved logic
        let speaker = detectSpeaker();

        // SMART FALLBACK: If 2 participants, use alternating logic
        if (window.meetParticipants && window.meetParticipants.length === 2) {
          // If speaker detection failed or returned generic name
          if (!speaker || speaker === 'Speaker' || speaker === 'You') {
            // Alternate: if last was first participant, current is second
            if (lastSpeaker === window.meetParticipants[0]) {
              speaker = window.meetParticipants[1];
              console.log('🔄 Alternating to:', speaker, '(was:', lastSpeaker, ')');
            } else {
              speaker = window.meetParticipants[0];
              console.log('🔄 Alternating to:', speaker, '(was:', lastSpeaker || 'none', ')');
            }
          }
        }

        // If STILL no speaker detected, check if we can guess from timing
        // (If multiple rapid messages, likely same person)
        if ((!speaker || speaker === 'Speaker') && conversation.length > 0) {
          const lastMsg = conversation[conversation.length - 1];
          const timeSinceLastMsg = Date.now() - lastMsg.timestamp;

          // If less than 3 seconds since last message, likely same speaker
          if (timeSinceLastMsg < 3000) {
            speaker = lastMsg.speaker;
            console.log('⏱️ Same speaker (rapid speech):', speaker);
          }
        }

        // Ensure speaker has a value
        if (!speaker || speaker === 'Speaker' || speaker === 'You') {
          speaker = myName || window.meetParticipants[0] || 'Unknown';
        }

        console.log(`🎤 FINAL SPEAKER: ${speaker}: ${text}`);
        lastSpeaker = speaker;

        // Add to conversation
        conversation.push({ speaker, text, timestamp: Date.now() });
        updateConversation();

        // Determine if CLIENT spoke (anyone other than YOU/extension user)
        const isClient = speaker !== myName && speaker !== window.meetParticipants[0];

        if (isClient) {
          console.log('🔥🔥🔥 CLIENT SPOKE! Getting AI suggestion IMMEDIATELY...');
          console.log('   ↳ CLIENT said:', text);
          console.log('   ↳ AI will suggest what YOU should say next');

          // Show client's message
          const clientMsgBox = document.getElementById('last-client-msg');
          const clientMsgText = document.getElementById('client-msg-text');
          if (clientMsgBox && clientMsgText) {
            clientMsgBox.style.display = 'block';
            clientMsgText.innerHTML = `<span class="client-name">${speaker}:</span> "${text}"`;
          }

          // Get AI suggestion IMMEDIATELY (no delay!)
          getAISuggestion(true);
        } else {
          console.log('✅ YOU spoke:', text);
          console.log('   ↳ AI will analyze context...');

          // You spoke - get quick AI update (reduced from 5s to 2s)
          const now = Date.now();
          if (now - lastAIUpdate > 2000) { // Update every 2 seconds (faster!)
            setTimeout(() => getAISuggestion(false), 500); // Reduced delay to 500ms
          }
        }
      }
    };

    speechRecognition.onerror = (event) => {
      console.error('❌ Speech error:', event.error);
      if (event.error === 'no-speech') {
        // Ignore no-speech errors
        return;
      }
    };

    speechRecognition.onend = () => {
      // Auto-restart INSTANTLY if still recording (for continuous listening)
      if (isRecording) {
        console.log('🔄 Restarting speech recognition (instant)...');
        setTimeout(() => {
          if (speechRecognition && isRecording) {
            try {
              speechRecognition.start();
              console.log('✅ Restarted - listening...');
            } catch (e) {
              // Ignore "already started" errors
              if (e.message.includes('already started')) {
                console.log('⚠️ Already active');
              } else {
                console.error('❌ Restart error:', e);
              }
            }
          }
        }, 10); // Reduced to 10ms for INSTANT restart!
      }
    };

    speechRecognition.start();
    console.log('✅ Speech recognition started');
  }

  /**
   * Get AI suggestion - SALES-FOCUSED for sales person
   */
  async function getAISuggestion(isUrgent = false) {
    console.log('🤖 getAISuggestion called, isUrgent:', isUrgent);

    if (!openaiApiKey) {
      console.error('❌ No OpenAI API key found');
      const suggestionEl = document.getElementById('ai-suggestion');
      if (suggestionEl) {
        suggestionEl.innerHTML = '<span style="opacity: 0.7; font-size: 14px;">⚠️ No API key - click extension icon to add</span>';
      }
      return;
    }

    console.log('✅ API key exists:', openaiApiKey.substring(0, 10) + '...');

    const suggestionEl = document.getElementById('ai-suggestion');
    if (!suggestionEl) {
      console.error('❌ AI suggestion element not found');
      return;
    }

    // Throttle updates (reduced for faster responses)
    const now = Date.now();
    if (!isUrgent && (now - lastAIUpdate < 1500)) { // Reduced from 3000ms to 1500ms
      console.log('⏭️ Skipping - too soon since last update');
      return; // Skip if updated recently
    }
    lastAIUpdate = now;

    console.log('⚡ AI CALL STARTED at', new Date().toLocaleTimeString());

    // PROFESSIONAL LOADING ANIMATION
    suggestionEl.innerHTML = `
      <div class="ai-loading-container">
        <div class="loading-dots">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
        <div class="loading-text">🤖 AI Analyzing...</div>
      </div>
    `;

    // Add shimmer effect to the box
    const suggestionBox = document.getElementById('ai-suggestion-box');
    if (suggestionBox) {
      suggestionBox.classList.add('ai-shimmer');
    }

    try {
      console.log('📊 Conversation length:', conversation.length);

      if (conversation.length === 0) {
        console.log('⚠️ No conversation yet');
        suggestionEl.textContent = 'Start speaking to get AI suggestions...';
        if (suggestionBox) {
          suggestionBox.classList.remove('ai-shimmer');
        }
        return;
      }
      // Get recent context (reduced from 8 to 5 messages for speed)
      const recentConv = conversation.slice(-5);

      // Separate sales person vs client messages
      const salesPersonName = myName || (window.meetParticipants && window.meetParticipants[0]) || 'You';
      const clientNameInConv = clientName || (window.meetParticipants && window.meetParticipants[1]) || 'Client';

      // Format conversation (ultra-compact for speed)
      const context = recentConv
        .map(msg => {
          const role = msg.speaker === salesPersonName ? 'S' : 'C'; // Shortened!
          return `${role}: ${msg.text}`;
        })
        .join('\n');

      // Get last client message
      const lastClientMsg = recentConv
        .filter(m => m.speaker !== salesPersonName)
        .slice(-1)[0];

      const clientLastMsg = lastClientMsg ? lastClientMsg.text : 'Hello';

      // ULTRA-COMPACT PROMPT (minimal tokens = faster response)
      const prompt = `Sales coach. Client: "${clientLastMsg}"

Context:
${context}

What to say (10 words max):`;

      console.log('📡 Calling OpenAI API...');
      console.log('📝 Prompt preview:', prompt.substring(0, 200) + '...');

      const startTime = Date.now(); // Track response time

      // Call OpenAI API - faster model for speed
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Fastest OpenAI model
          messages: [
            {
              role: 'system',
              content: 'Sales coach. 10 words max. Natural.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 30, // Reduced from 40 to 30 for speed
          temperature: 0.6, // Reduced for faster, more predictable responses
          top_p: 0.9, // Added for faster sampling
          presence_penalty: 0.3,
          frequency_penalty: 0.1,
          stream: false // Set to false for simplicity (could enable for even faster perceived speed)
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API error data:', errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime; // Calculate response time

      console.log('✅ API response received:', data);
      console.log(`⚡ Response time: ${responseTime}ms (${(responseTime / 1000).toFixed(2)}s)`);

      const suggestion = data.choices[0]?.message?.content?.trim() || 'Keep listening...';

      // Clean up suggestion - remove any prefix labels
      const cleanSuggestion = suggestion
        .replace(/^(Suggestion:|SUGGESTION:|SAY:|Response:)/i, '')
        .replace(/^["']|["']$/g, '')
        .replace(/^\*\*|\*\*$/g, '') // Remove markdown bold
        .trim();

      // Remove shimmer effect and show suggestion
      if (suggestionBox) {
        suggestionBox.classList.remove('ai-shimmer');
      }

      suggestionEl.textContent = cleanSuggestion;
      console.log('💡 AI SALES SUGGESTION:', cleanSuggestion);
      console.log('   ↳ In response to CLIENT:', clientLastMsg);
      console.log(`   ↳ Total processing time: ${responseTime}ms`);

    } catch (error) {
      console.error('❌ AI error:', error);

      // Remove shimmer on error
      if (suggestionBox) {
        suggestionBox.classList.remove('ai-shimmer');
      }

      suggestionEl.innerHTML = `<span style="opacity: 0.7; font-size: 14px;">❌ AI error - check console & API key</span>`;
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

      // Show notification
      showNotification('🔴 Recording Started!');

    } catch (error) {
      console.error('❌ Recording failed:', error);
      showNotification('❌ Mic permission denied!');
    }
  }

  /**
   * Stop recording
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
    downloadFile(audioUrl, `sales-meeting-${timestamp}.webm`);

    // Save transcript with speaker names
    const transcript = conversation
      .map(msg => `${msg.speaker}: ${msg.text}`)
      .join('\n\n');

    const transcriptText = `SALES MEETING TRANSCRIPT
Date: ${new Date().toLocaleString()}

PARTICIPANTS:
${window.meetParticipants.map((n, i) => `${i + 1}. ${n}${i === 0 ? ' (You)' : ''}`).join('\n')}

---

CONVERSATION:

${transcript}

---
Total messages: ${conversation.length}
Recording: sales-meeting-${timestamp}.webm
`;

    const textBlob = new Blob([transcriptText], { type: 'text/plain' });
    const textUrl = URL.createObjectURL(textBlob);
    downloadFile(textUrl, `sales-transcript-${timestamp}.txt`);

    console.log('✅ Files saved!');
    showNotification('✅ Recording & Transcript Saved!');

    const statusEl = document.getElementById('recording-status');
    if (statusEl) {
      statusEl.textContent = '✅ SAVED';
      setTimeout(() => {
        statusEl.textContent = '⏸️ NOT RECORDING';
      }, 3000);
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
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      color: white !important;
      padding: 24px 40px !important;
      border-radius: 16px !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important;
      z-index: 9999999 !important;
      font-size: 20px !important;
      font-weight: 700 !important;
      text-align: center !important;
    `;
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => notif.remove(), 2000);
  }

  /**
   * Check meeting status - INSTANT start
   */
  function checkMeeting() {
    const micButton = document.querySelector('[data-is-muted]') ||
                      document.querySelector('[aria-label*="microphone" i]');

    if (micButton && !isRecording) {
      console.log('🎙️ Meeting detected, auto-starting INSTANTLY...');
      setTimeout(() => startRecording(), 500); // Reduced from 2000ms to 500ms!
    } else if (!micButton && isRecording) {
      console.log('📴 Meeting ended, stopping...');
      stopRecording();
    }
  }

  /**
   * Keyboard shortcuts to hide/show UI
   * Ctrl = Hide/Show BOTH panels
   * Shift = Hide/Show ONLY Sales Coach panel (right side)
   */
  let isUIVisible = true;
  let isSalesCoachVisible = true;

  document.addEventListener('keydown', (e) => {
    // CTRL KEY - Hide/Show BOTH panels
    if (e.key === 'Control' && !e.shiftKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      isUIVisible = !isUIVisible;

      // Toggle BOTH panels
      if (panel) {
        panel.style.display = isUIVisible ? 'block' : 'none';
      }
      if (aiPanel) {
        aiPanel.style.display = isUIVisible ? 'block' : 'none';
      }

      console.log(isUIVisible ? '👁️ All UI Shown' : '🙈 All UI Hidden');
      showNotification(isUIVisible ? '👁️ All UI Shown' : '🙈 All UI Hidden');
    }

    // SHIFT KEY - Hide/Show ONLY Sales Coach panel (right side)
    if (e.key === 'Shift' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      isSalesCoachVisible = !isSalesCoachVisible;

      // Toggle ONLY Sales Coach panel (right side)
      if (panel) {
        panel.style.display = isSalesCoachVisible ? 'block' : 'none';
      }
      // AI panel stays visible!

      console.log(isSalesCoachVisible ? '📊 Sales Coach Shown' : '🙈 Sales Coach Hidden');
      showNotification(isSalesCoachVisible ? '📊 Sales Coach Shown' : '🙈 Sales Coach Hidden (AI Still Active)');
    }
  });

  // Initialize FASTER
  setTimeout(() => {
    console.log('🚀 Initializing Sales Coach (FAST MODE)...');

    createPanel();
    createAIPanel();

    // Update participants every 2 seconds (faster!)
    setInterval(updateParticipants, 2000);
    setTimeout(updateParticipants, 1000); // Start after 1s instead of 2s

    // Check meeting every 1 second (faster detection!)
    setInterval(checkMeeting, 1000);
    checkMeeting();

    console.log('⌨️ Keyboard Shortcuts:');
    console.log('   → Ctrl: Hide/Show ALL panels');
    console.log('   → Shift: Hide/Show Sales Coach panel only');
    console.log('⚡ FAST MODE: Real-time speech + instant AI suggestions!');

  }, 2000); // Reduced from 3s to 2s

  console.log('✅ Sales Coach Ready!');

})();
