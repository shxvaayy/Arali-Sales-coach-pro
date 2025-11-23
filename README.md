# Arali.ai - AI Sales Coach PRO v3.6.4

**Premium AI-powered sales coaching extension for Google Meet**

## ✨ Features

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
- Provides smart responses (OpenAI GPT-4o-mini)
- Ultra-fast response times

### 5. **Keyboard Shortcuts** ⌨️
- **Ctrl:** Hide/Show ALL panels
- **Shift:** Hide/Show Sales Coach panel only
- Perfect for screen sharing

### 6. **Auto Save Everything** 💾
- Auto-saves audio recording (.webm)
- Auto-saves transcript with speaker names (.txt)
- Downloads to your Downloads folder

## 🚀 Installation

1. **Load Extension:**
   ```
   Chrome → chrome://extensions/
   Enable "Developer mode"
   Click "Load unpacked"
   Select the chrome-extension-v2 folder
   ```

2. **Setup API Key (for AI):**
   ```
   Click extension icon
   Enter OpenAI API key
   Click "Save Configuration"
   ```

3. **Get OpenAI API Key:**
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy and paste in extension

## 📱 Usage

1. **Join a Google Meet**
2. **Extension auto-starts:**
   - Top-right: Sales Coach panel (status, participants, conversation)
   - Bottom-center: AI Coach panel (suggestions)

3. **Start Speaking:**
   - Recording automatically starts
   - Live transcription appears
   - AI gives instant suggestions

4. **Use Keyboard Shortcuts:**
   - Press **Ctrl** to hide all panels (screen sharing)
   - Press **Shift** to hide only Sales Coach panel

5. **Leave Meeting:**
   - Recording auto-stops
   - Files auto-download:
     - `sales-meeting-[timestamp].webm` (audio)
     - `sales-transcript-[timestamp].txt` (with speaker names)

## 📊 Panels

### Sales Coach Panel (Right Side)
- **Status:** Recording status with pulse animation
- **Participants:** List of real people with colored dots
- **Live Conversation:** Recent messages with speaker names
- **Premium Design:** Glassmorphism with animated effects

### AI Coach Panel (Bottom Center)
- **What to Say Next:** AI suggestions in real-time
- **Client's Last Message:** Shows what client just said
- **Translucent Design:** See screen content behind panel
- **Fast Updates:** Instant AI responses

## 🔧 Technical Details

**Files:**
- `manifest.json` - Extension config (v3.6.4)
- `participants-fixed.js` - Participant detection (strict filtering)
- `recorder-openai.js` - Recording + AI + Speech recognition
- `popup.html/js` - Premium settings UI

**APIs Used:**
- Web Speech API - Real-time transcription with interim results
- MediaRecorder API - Audio recording
- OpenAI API - AI suggestions (GPT-4o-mini for speed)

**No Server Required:**
- Everything runs in browser
- No backend/server needed
- Direct OpenAI API calls

## 🐛 Troubleshooting

**No AI suggestions:**
- Make sure you entered OpenAI API key
- Click extension icon → Enter key → Save Configuration
- Check console for API errors

**Participants not detected:**
- Wait 5-10 seconds after joining
- Make sure you're not on landing page
- Refresh the meeting tab

**Recording not starting:**
- Allow microphone permission
- Check browser console for errors

**Keyboard shortcuts not working:**
- Make sure Google Meet tab is focused
- Click on the page first
- Check console logs for key press events

## 📝 Notes

- Works ONLY on Google Meet
- Requires microphone permission
- AI requires OpenAI API key (paid, but very affordable)
- Uses GPT-4o-mini for fast responses (~$0.15 per 1M tokens)
- Transcript saves with exact speaker names
- All processing happens in browser
- Premium SaaS-style UI design

## 🎨 Design Features

- **Glassmorphism:** Translucent panels with blur effects
- **Animations:** Smooth transitions and pulse effects
- **Dark Theme:** Modern gradient backgrounds
- **Responsive:** Works on all screen sizes
- **Professional:** Inspired by Vercel, Linear, Stripe

---

**Version:** 3.6.4
**Status:** Production Ready ✅
**Design:** Premium SaaS 💎
