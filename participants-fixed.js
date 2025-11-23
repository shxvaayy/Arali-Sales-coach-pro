/**
 * Participant Detection - FIXED & WORKING
 * Detects EXACT names from Google Meet
 */

(function() {
  console.log('👥 Participant Detector FIXED - Loading...');

  // Global storage
  window.meetParticipants = [];

  // LOCK first participant - this is YOU and NEVER changes
  let firstParticipantLocked = null;

  // Complete UI blocklist - EXPANDED
  const UI_BLOCKLIST = [
    'more actions', 'more action', 'more options', 'more option',
    'audio settings', 'video settings', 'share screen', 'skin tone',
    'mood', 'mic', 'camera', 'mute', 'unmute', 'settings',
    'send a reaction', 'raise hand', 'lower hand', 'leave call',
    'end call', 'turn on', 'turn off', 'pin', 'unpin',
    'show more info', 'hide more info', 'error', 'recording',
    'captions', 'chat', 'people', 'activities', 'whiteboard',
    'breakout', 'polls', 'q&a', 'effects', 'blur', 'background',
    'hand', 'reactions', 'add people', 'search', 'in the meeting',
    'contributors', 'meeting host', 'you', 'host', 'co-host',
    'presenting', 'screenshare', 'share', 'stop sharing',
    'info', 'details', 'meeting details', 'apps', 'tools',
    'meeting tools', 'call tools', 'options', 'menu',
    'status', 'participants', 'conversation', 'live', 'coach',
    // Common UI button labels
    'timer', 'reframe', 'back', 'close', 'next', 'previous', 'skip',
    'save', 'cancel', 'submit', 'send', 'delete', 'edit', 'done',
    'ok', 'yes', 'no', 'confirm', 'retry', 'refresh', 'reload',
    'start', 'stop', 'pause', 'resume', 'continue', 'finish',
    'open', 'view', 'hide', 'show', 'toggle', 'enable', 'disable',
    // Meeting join notifications
    'admit', 'waiting', 'joined', 'left', 'knock', 'request'
  ];

  function isValidName(name) {
    if (!name || name.length < 2 || name.length > 50) return false;

    const lower = name.toLowerCase();

    // SUPER AGGRESSIVE blocklist check
    if (UI_BLOCKLIST.some(blocked => lower.includes(blocked))) {
      console.log(`❌ BLOCKED (blocklist): "${name}"`);
      return false;
    }

    // Block common menu terms even if not in blocklist
    const menuTerms = ['meeting', 'details', 'option', 'action', 'menu', 'tool',
                       'setting', 'button', 'control', 'panel', 'info', 'information',
                       'device', 'notification', 'alert', 'message', 'warning'];
    if (menuTerms.some(term => lower.includes(term))) {
      console.log(`❌ BLOCKED (menu term): "${name}"`);
      return false;
    }

    // Block meeting codes (abc-defg-hij)
    if (/^[a-z]{3,4}-[a-z]{4,5}-[a-z]{3,4}$/i.test(name)) {
      console.log(`❌ BLOCKED (meeting code): "${name}"`);
      return false;
    }

    // Must have letters
    if (!/[a-zA-Z]/.test(name)) {
      console.log(`❌ BLOCKED (no letters): "${name}"`);
      return false;
    }

    // Block single generic words
    const genericWords = ['you', 'me', 'user', 'guest', 'host', 'participant', 'speaker'];
    if (genericWords.includes(lower)) {
      console.log(`❌ BLOCKED (generic): "${name}"`);
      return false;
    }

    // Block single ALL-CAPS words (UI labels like "STATUS", "RECORDING")
    if (name === name.toUpperCase() && name.length > 1) {
      console.log(`❌ BLOCKED (all caps UI label): "${name}"`);
      return false;
    }

    // Block duplicate concatenations like "WritoryWritory"
    const half = Math.floor(name.length / 2);
    if (name.length >= 6 && name.length % 2 === 0) {
      const firstHalf = name.substring(0, half);
      const secondHalf = name.substring(half);
      if (firstHalf === secondHalf) {
        console.log(`❌ BLOCKED (duplicate concatenation): "${name}"`);
        return false;
      }
    }

    // Word validation - names should be 1-3 words typically
    const words = name.split(/\s+/);
    if (words.length > 3) {
      console.log(`❌ BLOCKED (too many words): "${name}"`);
      return false;
    }

    // For single-word names, must be at least 3 characters (real names)
    if (words.length === 1 && name.length < 3) {
      console.log(`❌ BLOCKED (single word too short): "${name}"`);
      return false;
    }

    // Block common single English words that aren't names
    const commonWords = ['timer', 'reframe', 'back', 'close', 'next', 'start',
                         'stop', 'view', 'edit', 'save', 'open', 'help'];
    if (words.length === 1 && commonWords.includes(lower)) {
      console.log(`❌ BLOCKED (common word, not name): "${name}"`);
      return false;
    }

    // Each word must be valid (letters, hyphens, apostrophes, dots only)
    for (const word of words) {
      if (!/^[a-zA-Z\-'\.]+$/.test(word)) {
        console.log(`❌ BLOCKED (invalid characters): "${name}"`);
        return false;
      }
    }

    // At least one word should be 2+ characters (real names have substance)
    if (!words.some(w => w.length >= 2)) {
      console.log(`❌ BLOCKED (too short): "${name}"`);
      return false;
    }

    console.log(`✅ VALID NAME: "${name}"`);
    return true;
  }

  /**
   * Extract participants - MULTIPLE METHODS
   */
  function extractParticipants() {
    const found = new Set();

    console.log('🔍 Extracting participants (multi-method)...');

    // METHOD 0: SUPER AGGRESSIVE - Search all aria-labels for names
    console.log('🔍 METHOD 0: Searching all aria-labels...');
    const allAriaLabels = document.querySelectorAll('[aria-label]');
    allAriaLabels.forEach(el => {
      const label = el.getAttribute('aria-label');
      if (label) {
        // Look for patterns like "Name (You)" or just "Name"
        const nameMatch = label.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:\(You\))?$/);
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1].trim();
          if (isValidName(name)) {
            found.add(name);
            console.log('✅ Found (aria-label):', name);
          }
        }
      }
    });

    // Also check for participant badges/chips
    const badges = document.querySelectorAll('[data-participant-id] [role="button"], [data-participant-id] span');
    badges.forEach(badge => {
      const text = badge.textContent?.trim();
      if (text && text.length > 2 && text.length < 50) {
        const cleaned = text.replace(/\s*\(You\)\s*$/i, '').trim();
        if (isValidName(cleaned) && !found.has(cleaned)) {
          found.add(cleaned);
          console.log('✅ Found (badge):', cleaned);
        }
      }
    });

    if (found.size > 0) {
      console.log(`✅ METHOD 0 SUCCESS: Found ${found.size} participants`);
    }

    // METHOD 1: From participant panel - Click "People" button area
    const peopleButton = document.querySelector('[aria-label*="Show everyone" i], [aria-label*="People" i]');

    if (peopleButton) {
      console.log('✅ Found people button');

      // Find the people panel
      const peoplePanel = peopleButton.closest('[role="complementary"]') ||
                         document.querySelector('[role="complementary"]');

      if (peoplePanel) {
        // Get all participant elements within panel
        const participantItems = peoplePanel.querySelectorAll('[data-participant-id]');
        console.log('📊 Found participant items:', participantItems.length);

        participantItems.forEach(item => {
          // Try to get name from data attribute first
          const dataName = item.getAttribute('data-self-name');
          if (dataName) {
            const cleaned = dataName.replace(/\s*\(You\)\s*$/i, '').trim();
            if (isValidName(cleaned)) {
              found.add(cleaned);
              console.log('✅ Found (data-attr):', cleaned);
              return;
            }
          }

          // Get text content
          const text = item.textContent || item.innerText;
          if (text) {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);

            // First line is usually the name
            if (lines.length > 0) {
              let name = lines[0].replace(/\s*\(You\)\s*$/i, '').trim();

              if (isValidName(name)) {
                found.add(name);
                console.log('✅ Found (text):', name);
              }
            }
          }
        });
      }
    }

    // METHOD 2: From page body text - Contributors section
    if (found.size === 0) {
      console.log('⚠️ Method 1 failed, trying body text...');

      const bodyText = document.body.innerText;
      const match = bodyText.match(/Contributors[\s\S]{0,800}?(?=Add people|Search|Your meeting|$)/);

      if (match) {
        console.log('📋 Found Contributors section');
        const lines = match[0].split('\n').map(l => l.trim()).filter(l => l);

        for (const line of lines) {
          // Skip headers and numbers
          if (line === 'Contributors' || line === 'IN THE MEETING' ||
              line === 'Meeting host' || /^\d+$/.test(line)) {
            continue;
          }

          // Clean name
          let name = line.replace(/\s*\(You\)\s*$/i, '').trim();

          if (isValidName(name)) {
            found.add(name);
            console.log('✅ Found (body text):', name);
          }
        }
      }
    }

    // METHOD 3: From video tiles with names
    if (found.size === 0) {
      console.log('⚠️ Method 2 failed, trying video tiles...');

      const videoContainers = document.querySelectorAll('[data-participant-id], [data-requested-participant-id]');

      videoContainers.forEach(container => {
        // Look for name elements
        const nameEl = container.querySelector('[data-self-name]') ||
                      container.querySelector('div[class*="zs"]') ||
                      container.querySelector('[aria-label]');

        if (nameEl) {
          const name = (nameEl.getAttribute('data-self-name') ||
                       nameEl.textContent ||
                       nameEl.getAttribute('aria-label')).trim();

          const cleaned = name.replace(/\s*\(You\)\s*$/i, '').trim();

          if (isValidName(cleaned)) {
            found.add(cleaned);
            console.log('✅ Found (video tile):', cleaned);
          }
        }
      });
    }

    // METHOD 4: Fallback - get from title or URL
    if (found.size === 0) {
      console.log('⚠️ All methods failed, using fallback...');

      // Try to get your name from Google Account
      const profileBtn = document.querySelector('[aria-label*="Google Account" i]');
      if (profileBtn) {
        const label = profileBtn.getAttribute('aria-label');
        const match = label?.match(/Google Account:\s*([^(]+)/);
        if (match && match[1]) {
          const name = match[1].trim();
          if (isValidName(name)) {
            found.add(name);
            console.log('✅ Found (Google Account):', name);
          }
        }
      }
    }

    // Convert to array
    let participantsArray = Array.from(found);

    // LOCK FIRST PARTICIPANT - this is YOU (the extension user)
    if (!firstParticipantLocked && participantsArray.length > 0) {
      // First time detection - lock the first participant as YOU
      // This is whoever is using the extension (already in meeting)
      firstParticipantLocked = participantsArray[0];
      console.log('🔒 LOCKED AS YOU (extension user):', firstParticipantLocked);
      console.log('   ↳ This person will ALWAYS be "You", others will be "Client"');
    }

    if (firstParticipantLocked) {
      // Remove locked participant from current detections (if present)
      participantsArray = participantsArray.filter(p => p !== firstParticipantLocked);

      // ALWAYS add locked participant FIRST
      participantsArray.unshift(firstParticipantLocked);
      console.log('✅ YOU (locked):', firstParticipantLocked);
      console.log('✅ Others:', participantsArray.slice(1));
    }

    // Update global
    window.meetParticipants = participantsArray;

    if (window.meetParticipants.length > 0) {
      console.log('👥 ✅ FINAL PARTICIPANTS:', window.meetParticipants);
    } else {
      console.warn('⚠️ NO PARTICIPANTS DETECTED - using defaults');
      // Use placeholder names that will pass validation
      window.meetParticipants = ['Sales Rep', 'Client'];
    }

    return window.meetParticipants;
  }

  // Initial extraction after delay (wait for page to load)
  setTimeout(() => {
    console.log('🚀 Starting initial extraction...');
    extractParticipants();
  }, 5000); // 5 second delay

  // Re-extract every 8 seconds
  setInterval(() => {
    const before = window.meetParticipants.length;
    extractParticipants();
    const after = window.meetParticipants.length;

    if (before !== after) {
      console.log(`👥 Participants updated: ${before} → ${after}`);
    }
  }, 8000);

  // Watch for DOM changes
  const observer = new MutationObserver(() => {
    // Only re-extract if participants list is empty
    if (window.meetParticipants.length === 0) {
      extractParticipants();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('✅ Participant Detector FIXED - Ready!');

})();
