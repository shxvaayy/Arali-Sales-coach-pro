/**
 * BACKGROUND SERVICE WORKER
 * Handles offscreen document creation and message routing
 */

console.log('🔧 Background Service Worker Loading...');

let offscreenDocumentCreated = false;

/**
 * Create offscreen document for ML processing
 */
async function createOffscreenDocument() {
  if (offscreenDocumentCreated) {
    console.log('Offscreen document already exists');
    return;
  }

  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['WORKERS'],
      justification: 'Run MediaPipe Face Mesh for engagement tracking'
    });

    offscreenDocumentCreated = true;
    console.log('✅ Offscreen document created successfully');
  } catch (error) {
    console.error('❌ Failed to create offscreen document:', error);
  }
}

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Request to create offscreen document
  if (message.type === 'CREATE_OFFSCREEN_DOCUMENT') {
    createOffscreenDocument().then(() => {
      sendResponse({ success: true });
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
