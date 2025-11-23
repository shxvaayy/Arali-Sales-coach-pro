// Popup settings script

// Load saved API key
chrome.storage.local.get(['openaiApiKey', 'geminiApiKey'], (result) => {
  const key = result.openaiApiKey || result.geminiApiKey;
  if (key) {
    document.getElementById('apiKey').value = key;
  }
});

// Save button
document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();

  if (!apiKey) {
    showStatus('Please enter an API key', false);
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    showStatus('⚠️ Invalid OpenAI key (should start with sk-)', false);
    return;
  }

  // Save to storage
  chrome.storage.local.set({
    openaiApiKey: apiKey,
    geminiApiKey: apiKey // For compatibility
  }, () => {
    showStatus('✅ OpenAI key saved!', true);

    // Reload all Google Meet tabs to apply new key
    chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.reload(tab.id);
      });
    });
  });
});

function showStatus(message, success) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.style.display = 'block';

  if (success) {
    statusEl.className = 'success';
  } else {
    statusEl.className = '';
  }

  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}
