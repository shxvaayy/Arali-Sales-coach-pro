/**
 * Participant Detection - CLEAN & SIMPLE
 * Only detects REAL people, blocks ALL UI elements
 */

(function() {
  console.log('👥 Participant Detector CLEAN - Loading...');

  // Global storage
  window.meetParticipants = [];

  // COMPLETE blocklist of UI elements
  const UI_BLOCKLIST = [
    'more actions', 'more action', 'audio settings', 'video settings',
    'share screen', 'skin tone', 'mood', 'mic', 'camera', 'mute',
    'unmute', 'settings', 'send a reaction', 'raise hand', 'lower hand',
    'leave call', 'end call', 'turn on', 'turn off', 'pin', 'unpin',
    'show more info', 'hide more info', 'error', 'recording',
    'captions', 'chat', 'people', 'activities', 'whiteboard',
    'breakout', 'polls', 'q&a', 'effects', 'blur', 'background',
    'hand', 'reactions', 'add people', 'search', 'in the meeting',
    'contributors', 'meeting host', 'you', 'host', 'co-host'
  ];

  function isValidName(name) {
    if (!name || name.length < 3 || name.length > 50) return false;

    const lower = name.toLowerCase();

    // Check blocklist
    if (UI_BLOCKLIST.some(blocked => lower.includes(blocked))) {
      console.log('❌ Blocked UI element:', name);
      return false;
    }

    // Block meeting codes (abc-defg-hij)
    if (/^[a-z]{3,4}-[a-z]{4,5}-[a-z]{3,4}$/i.test(name)) {
      console.log('❌ Blocked meeting code:', name);
      return false;
    }

    // Must have letters
    if (!/[a-zA-Z]/.test(name)) return false;

    // Word validation
    const words = name.split(/\s+/);
    if (words.length > 4) return false;

    for (const word of words) {
      if (!/^[a-zA-Z\-'\.]+$/.test(word)) return false;
    }

    return true;
  }

  function extractParticipants() {
    const found = new Set();

    console.log('🔍 Extracting participants...');

    // Method 1: From page text - Contributors section
    const bodyText = document.body.innerText;
    const match = bodyText.match(/Contributors[\s\S]{0,500}?(?=Add people|Search|$)/);

    if (match) {
      const lines = match[0].split('\n').map(l => l.trim()).filter(l => l);

      for (const line of lines) {
        // Skip headers
        if (line === 'Contributors' || line === 'IN THE MEETING' || /^\d+$/.test(line)) {
          continue;
        }

        // Clean name
        let name = line.replace(/\s*\(You\)\s*$/i, '').trim();

        if (isValidName(name)) {
          found.add(name);
          console.log('✅ Valid participant:', name);
        }
      }
    }

    // Update global
    window.meetParticipants = Array.from(found);
    console.log('👥 Total participants:', window.meetParticipants);

    return window.meetParticipants;
  }

  // Extract on load
  setTimeout(() => {
    extractParticipants();
    console.log('📊 Initial extraction complete');
  }, 3000);

  // Re-extract every 10 seconds
  setInterval(() => {
    const before = window.meetParticipants.length;
    extractParticipants();
    const after = window.meetParticipants.length;

    if (before !== after) {
      console.log(`👥 Participants updated: ${before} → ${after}`);
    }
  }, 10000);

  console.log('✅ Participant Detector CLEAN - Ready!');

})();
