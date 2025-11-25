/**
 * BACKGROUND SERVICE WORKER
 * Handles offscreen document creation and message routing
 */

console.log('🔧 Background Service Worker Loading...');

/**
 * Check if offscreen document exists
 */
async function hasOffscreenDocument() {
  try {
    // Try to get all offscreen documents
    const offscreenUrl = chrome.runtime.getURL('offscreen.html');
    const matchedClients = await clients.matchAll();

    for (const client of matchedClients) {
      if (client.url === offscreenUrl) {
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Create offscreen document for ML processing
 */
async function createOffscreenDocument() {
  try {
    // Check if already exists
    const exists = await hasOffscreenDocument();
    if (exists) {
      console.log('✅ Offscreen document already exists');
      return { success: true, alreadyExists: true };
    }

    // Create new offscreen document
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['DOM_SCRAPING'],
      justification: 'Run MediaPipe Face Mesh for engagement tracking'
    });

    console.log('✅ Offscreen document created successfully');
    return { success: true, alreadyExists: false };
  } catch (error) {
    // If error is "Only a single offscreen document may be created"
    if (error.message && error.message.includes('single offscreen')) {
      console.log('✅ Offscreen document already exists (caught error)');
      return { success: true, alreadyExists: true };
    }

    console.error('❌ Failed to create offscreen document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Request to create offscreen document
  if (message.type === 'CREATE_OFFSCREEN_DOCUMENT') {
    createOffscreenDocument().then((result) => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open
  }

  // Forward messages to offscreen document
  if (message.type === 'PROCESS_FRAME' ||
      message.type === 'GET_VISUAL_DATA' ||
      message.type === 'START_VISUAL_TRACKING' ||
      message.type === 'STOP_VISUAL_TRACKING') {

    // Message will be received by offscreen.js
    // Just acknowledge here
    return true;
  }

  // Forward visual data from offscreen to content script
  if (message.type === 'VISUAL_DATA') {
    // Broadcast to all tabs running the extension
    chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      });
    });
  }
});

/**
 * Create offscreen document when extension starts
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension started, creating offscreen document...');
  createOffscreenDocument();
});

/**
 * Create offscreen document when extension is installed/updated
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated, creating offscreen document...');
  createOffscreenDocument();
});

console.log('✅ Background Service Worker Ready!');
