# Meet Recorder CLEAN v3.0

**Complete meeting recorder with AI sales coaching**

## ✅ Features

### 1. **Auto Record** 🎙️
- Automatically starts recording when you join a meeting
- No manual intervention needed

### 2. **Participant Detection** 👥
- Detects ONLY real participants (filters out UI elements)
- Shows participant list in real-time
- NO "More actions", "Audio settings", etc.

### 3. **Live Speech Recognition** 💬
- Real-time transcription of what's being said
- Detects who is speaking (speaker names)
- Shows conversation in panel

### 4. **AI Sales Coach** 🤖
- Live AI suggestions on what to say next
- Analyzes conversation context
- Provides smart responses (Gemini AI)

### 5. **Auto Save Everything** 💾
- Auto-saves audio recording (.webm)
- Auto-saves transcript with speaker names (.txt)
- Downloads to your Downloads folder

## 🚀 Installation

1. **Load Extension:**
   ```
   Chrome → chrome://extensions/
   Enable "Developer mode"
   Click "Load unpacked"
   Select: /Volumes/SHIVAY DATA/Writory-branch/without ai/chrome-extension-v2
   ```

2. **Setup API Key (for AI):**
   ```
   Click extension icon
   Enter Gemini API key
   Click "Save Settings"
   ```

3. **Get Gemini API Key:**
   - Go to: https://makersuite.google.com/app/apikey
   - Create new key
   - Copy and paste in extension

## 📱 Usage

1. **Join a Google Meet**
2. **Extension auto-starts:**
   - Top-right: Main panel (status, participants, conversation)
   - Top-left: AI Coach panel (suggestions)

3. **Start Speaking:**
   - Recording automatically starts
   - Live transcription appears
   - AI gives suggestions

4. **Leave Meeting:**
   - Recording auto-stops
   - Files auto-download:
     - `meeting-[timestamp].webm` (audio)
     - `transcript-[timestamp].txt` (with speaker names)

## 📊 Panels

### Main Panel (Right)
- **Status:** In meeting / Recording
- **Participants:** List of real people (no UI elements)
- **Live Conversation:** Recent messages with speaker names

### AI Coach Panel (Left)
- **What to Say Next:** AI suggestions
- Updates after each conversation turn

## 🔧 Technical Details

**Files:**
- `manifest.json` - Extension config
- `participants.js` - Participant detection (strict filtering)
- `recorder-full.js` - Recording + AI + Speech recognition
- `popup.html/js` - Settings UI

**APIs Used:**
- Web Speech API - Live transcription
- MediaRecorder API - Audio recording
- Gemini API - AI suggestions

**No Server Required:**
- Everything runs in browser
- No backend/server needed
- No port 3001 errors

## 🐛 Troubleshooting

**No AI suggestions:**
- Make sure you entered Gemini API key
- Click extension icon → Enter key → Save

**Participants not detected:**
- Wait 5-10 seconds after joining
- Make sure you're not on landing page
- Refresh the meeting tab

**Recording not starting:**
- Allow microphone permission
- Check browser console for errors

**"More actions" appearing:**
- This is fixed in v3.0!
- Make sure you loaded chrome-extension-v2 folder

## 📝 Notes

- Works ONLY on Google Meet
- Requires microphone permission
- AI requires Gemini API key (free tier available)
- Transcript saves with exact speaker names
- All processing happens locally in browser

---

**Version:** 3.0.0
**Status:** Production Ready ✅
