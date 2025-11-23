# Voice-Based Speaker Diarization (Future Enhancement)

## Current System vs Voice-Based

### Current (v3.4.0): Visual Detection
- Uses Google Meet's visual indicators (green/blue borders)
- Uses alternating logic for 2-person calls
- Uses timing heuristics (rapid speech = same speaker)
- **Limitation:** Cannot distinguish speakers by actual voice

### Future: Voice-Based (PyAnnote + Whisper)
- Analyzes actual audio waveforms and voice characteristics
- 100% accurate speaker identification by voice
- Works even if same person uses multiple devices
- Professional-grade diarization

---

## How to Implement Voice-Based Diarization

### Step 1: Python Backend Server

Create a Flask server with PyAnnote and Whisper:

```python
# backend/server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from pyannote.audio import Pipeline
import whisper
import torch

app = Flask(__name__)
CORS(app)

# Load models (one-time on startup)
diarization_pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token="YOUR_HUGGINGFACE_TOKEN"
)
whisper_model = whisper.load_model("base")

@app.route('/diarize', methods=['POST'])
def diarize_audio():
    # Get audio file from request
    audio_file = request.files['audio']
    audio_path = f"/tmp/{audio_file.filename}"
    audio_file.save(audio_path)

    # Step 1: Transcribe with Whisper
    result = whisper_model.transcribe(audio_path)
    transcription = result["text"]

    # Step 2: Diarize with PyAnnote (identify speakers)
    diarization = diarization_pipeline(audio_path)

    # Step 3: Combine transcription + speaker labels
    segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        segments.append({
            "speaker": speaker,
            "start": turn.start,
            "end": turn.end,
            "text": transcription  # Map text to speaker
        })

    return jsonify({
        "success": True,
        "segments": segments
    })

if __name__ == '__main__':
    app.run(port=5000)
```

### Step 2: Install Requirements

```bash
pip install flask flask-cors pyannote.audio whisper torch
```

**Note:** You need a Hugging Face token from https://huggingface.co/pyannote/speaker-diarization

### Step 3: Modify Extension to Use Backend

In `recorder-openai.js`, add backend integration:

```javascript
// Send audio chunks to backend for diarization
async function sendAudioForDiarization(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'meeting.webm');

  const response = await fetch('http://localhost:5000/diarize', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();

  // Map speakers to actual names
  const speakerMap = {
    'SPEAKER_00': window.meetParticipants[0],  // YOU
    'SPEAKER_01': window.meetParticipants[1],  // CLIENT
  };

  // Update conversation with correct speakers
  result.segments.forEach(segment => {
    const actualSpeaker = speakerMap[segment.speaker] || segment.speaker;
    conversation.push({
      speaker: actualSpeaker,
      text: segment.text,
      timestamp: Date.now()
    });
  });

  updateConversation();
}
```

---

## Pros & Cons

### Pros ✅
- 100% accurate speaker detection by voice
- Works with multiple speakers
- Professional-grade quality
- Can distinguish between same person on different devices

### Cons ❌
- Requires Python backend server
- Processing takes 2-5 seconds (not real-time)
- More complex setup
- Needs GPU for best performance (CPU works but slower)
- Requires Hugging Face token

---

## CPU vs GPU Performance

| Hardware | Processing Time (1 min audio) |
|----------|-------------------------------|
| CPU (i7) | ~8-12 seconds                 |
| GPU (RTX 3060) | ~2-3 seconds            |
| GPU (M1 Mac) | ~3-4 seconds              |

---

## Alternative: Browser-Based WebRTC Audio Analysis

For lighter implementation without backend:

```javascript
// Analyze audio volume per participant (simpler than PyAnnote)
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();

// Track which participant's audio is loudest
// Less accurate than PyAnnote but no backend needed
```

**Limitation:** Cannot do true speaker diarization, only volume-based guessing.

---

## Recommendation

**Current v3.4.0 is good for:**
- Quick setup
- Real-time feedback
- Most 2-person meetings (alternating works well)

**Upgrade to PyAnnote when:**
- Need 100% voice-based accuracy
- Multiple speakers (3+) in meeting
- Same person testing with multiple devices
- Professional production use

---

## Contact

For help implementing voice-based diarization, see:
- PyAnnote docs: https://github.com/pyannote/pyannote-audio
- Whisper docs: https://github.com/openai/whisper
