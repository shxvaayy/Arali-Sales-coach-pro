# AI Sales Coach PRO - Installation Guide

## ✅ What's Fixed in v3.1:

### 🎯 Participant Detection - WORKING
- **Multiple detection methods** (4 fallback layers)
- Detects EXACT names from Google Meet
- NO UI elements (filters out "More actions", etc.)
- 5-second initial delay for page load
- Auto-refresh every 8 seconds

### 🎤 Speaker Detection - WORKING
- Detects who is speaking by name
- Green/blue border detection
- Largest video tile fallback
- Assigns actual participant names (no more "You: ...")

### ⌨️ Ctrl Key - UI Toggle
- Press **Ctrl** to hide ALL panels
- Press **Ctrl** again to show panels
- Perfect for screen sharing!

### 🤖 AI - WORKING PERFECTLY
- OpenAI GPT-4o-mini (FAST!)
- Real-time suggestions
- Sales-focused coaching
- ~2 second response time

---

## 🚀 Installation (5 Steps):

### 1. Load Extension
```
1. Chrome → chrome://extensions/
2. Enable "Developer mode" (top-right)
3. Remove OLD extension if exists
4. Click "Load unpacked"
5. Select folder: chrome-extension-v2
```

### 2. Get OpenAI API Key
```
1. Go to: https://platform.openai.com/api-keys
2. Sign up / Login
3. Click "Create new secret key"
4. Copy the key (starts with sk-...)
```

### 3. Save API Key
```
1. Click extension icon (puzzle piece)
2. Paste OpenAI key: sk-...
3. Click "Save Settings"
4. Extension will reload Meet tabs
```

### 4. Join Google Meet
```
1. Join or create a meeting
2. Allow microphone permission
3. Wait 5 seconds for participant detection
```

### 5. Start Speaking!
```
- Recording auto-starts
- Panels appear (right + left)
- Speak naturally
- AI suggestions appear when client speaks
```

---

## 📱 Usage:

### Main Panel (Right - Purple)
- **STATUS:** Recording status
- **PARTICIPANTS:** Real participant names
- **LIVE CONVERSATION:** Who said what

### AI Panel (Left - Green)
- **WHAT TO SAY NEXT:** AI suggestions
- **LAST CLIENT MESSAGE:** Highlighted

### Keyboard Shortcut
- **Ctrl:** Hide/show ALL panels

---

## 🧪 Testing Participant Detection:

### Console Check:
```javascript
// Open browser console (Cmd+Option+J)
// Type:
window.meetParticipants

// Should show:
["Your Name", "Client Name"]
```

### If participants not showing:
1. Wait 10 seconds after joining
2. Make sure you're in the meeting (not lobby)
3. Check console for logs: "✅ PARTICIPANTS DETECTED"
4. Reload tab if needed

---

## 🎯 How Speaker Detection Works:

1. **Visual Detection:** Green/blue border on video tiles
2. **Size Detection:** Largest video (main speaker)
3. **Participant Match:** Maps detected name to participant list
4. **Fallback:** Uses first participant if unclear

### Console Logs:
```
🎤 Detected speaker (visual): Shivay Mehra
🎤 Detected speaker (largest tile): Ravi Pandey
🎤 Using default speaker: Shivay Mehra
```

---

## 💾 Files Saved:

### Audio Recording:
```
sales-meeting-1732368000000.webm
```

### Transcript:
```
SALES MEETING TRANSCRIPT
Date: 11/23/2025, 7:45 PM

PARTICIPANTS:
1. Shivay Mehra (You)
2. Ravi Pandey

---

CONVERSATION:

Shivay Mehra: Hello, how can I help you today?
Ravi Pandey: I'm looking for a solution...
Shivay Mehra: Great! Let me explain...
```

---

## 🐛 Troubleshooting:

### "Detecting..." never changes:
- Wait 10 seconds
- Check if you're actually in the meeting
- Open console and check for errors
- Reload the tab

### All speakers show as "You":
- Make sure participants are detected first
- Wait for visual speaking indicators (green border)
- Check console: "🎤 Detected speaker: [name]"

### AI not working:
- Make sure you entered OpenAI API key
- Check console for API errors
- Verify key starts with "sk-"
- Check OpenAI account has credits

### UI won't hide with Ctrl:
- Make sure no input field is focused
- Try clicking on the video area first
- Then press Ctrl

---

## 🔧 Advanced Settings:

### Change AI Update Speed:
Edit `recorder-openai.js` line ~540:
```javascript
if (!isUrgent && (now - lastAIUpdate < 3000)) {
  // Change 3000 to 1000 for faster updates (1 second)
```

### Change Participant Detection Interval:
Edit `participants-fixed.js` line ~153:
```javascript
}, 8000); // Change to 5000 for faster updates
```

---

## 📊 System Requirements:

- Chrome browser (latest version)
- Microphone access
- OpenAI API key (paid account recommended)
- Internet connection
- Google Meet account

---

## ✅ Version Info:

**Version:** 3.1.0
**Release Date:** Nov 23, 2025
**Status:** Production Ready

**Changes in 3.1:**
- ✅ Fixed participant detection (4 methods)
- ✅ Fixed speaker detection (actual names)
- ✅ Added Ctrl key UI toggle
- ✅ Improved AI speed
- ✅ Better console logging

---

**Need help? Check console logs for detailed debugging info!**
