# Client Engagement Tracking - Implementation Plan

## 12 Features to Implement

### 🎥 Visual/Video Features (1-6, 12)

#### 1. **Lean Direction (Forward/Backward)**
- **What:** Detect if client is leaning forward (engaged) or backward (disengaged)
- **How:** Use face size in video frame - bigger = forward, smaller = backward
- **Library:** MediaPipe Face Detection or TensorFlow.js PoseNet
- **Output:** `{ lean: 'forward' | 'backward' | 'neutral', confidence: 0-100 }`

#### 2. **Gaze Stability / Gaze Wandering**
- **What:** Track if client is looking at screen or looking away
- **How:** Eye landmarks tracking + pupil position
- **Library:** MediaPipe Face Mesh (468 facial landmarks)
- **Output:** `{ gazeStable: boolean, wanderingScore: 0-100 }`

#### 3. **Blink Rate**
- **What:** Count blinks per minute (normal: 15-20, stressed: 30+)
- **How:** Track eye aspect ratio (EAR) - when eyes close, EAR drops
- **Library:** MediaPipe Face Mesh
- **Output:** `{ blinksPerMinute: number, status: 'normal' | 'high' | 'low' }`

#### 4. **Head Nods/Shakes**
- **What:** Detect agreement (nods) or disagreement (shakes)
- **How:** Track head pitch (nod) and yaw (shake) angles
- **Library:** MediaPipe Face Mesh with head pose estimation
- **Output:** `{ nods: number, shakes: number, lastGesture: 'nod' | 'shake' | null }`

#### 5. **Facial Tension Index**
- **What:** Measure stress/tension in facial muscles
- **How:** Analyze eyebrow position, jaw tightness, forehead wrinkles
- **Library:** MediaPipe Face Mesh + custom calculations
- **Output:** `{ tensionLevel: 0-100, status: 'relaxed' | 'neutral' | 'tense' }`

#### 6. **Smile Onset Events**
- **What:** Detect when client smiles (positive engagement)
- **How:** Track mouth corner positions - smile = corners go up
- **Library:** MediaPipe Face Mesh
- **Output:** `{ smiling: boolean, smileCount: number, lastSmileTime: timestamp }`

#### 12. **Screen Attention (via gaze + slide context)**
- **What:** Check if client is looking at shared screen/slides
- **How:** Combine gaze direction + check if screen sharing active
- **Library:** MediaPipe Face Mesh + Google Meet DOM detection
- **Output:** `{ lookingAtScreen: boolean, attentionScore: 0-100 }`

---

### 🎙️ Audio Features (7-11)

#### 7. **Speech Rate**
- **What:** Words per minute (fast = excited, slow = bored)
- **How:** Use Web Speech API transcript + word count / time
- **Library:** Web Speech API (already implemented)
- **Output:** `{ wordsPerMinute: number, status: 'slow' | 'normal' | 'fast' }`

#### 8. **Prosody Variation**
- **What:** Voice pitch variation (monotone = bored, varied = engaged)
- **How:** Analyze audio frequency using Web Audio API
- **Library:** Web Audio API with AnalyserNode
- **Output:** `{ pitchVariation: 0-100, status: 'monotone' | 'normal' | 'expressive' }`

#### 9. **Energy Levels (Loudness)**
- **What:** Voice volume (loud = confident, quiet = uncertain)
- **How:** Measure audio amplitude/decibels
- **Library:** Web Audio API
- **Output:** `{ volumeDb: number, energyLevel: 'low' | 'medium' | 'high' }`

#### 10. **Pauses Duration**
- **What:** Track silence gaps between speech
- **How:** Detect silence periods in audio stream
- **Library:** Web Audio API + silence detection
- **Output:** `{ avgPauseDuration: seconds, longestPause: seconds }`

#### 11. **Interruption Patterns**
- **What:** Detect when client interrupts you (shows engagement)
- **How:** Track speaker changes + overlap detection
- **Library:** Web Speech API + speaker detection logic
- **Output:** `{ interruptionCount: number, overlapDuration: seconds }`

---

## Technical Architecture

### Libraries to Add
```json
{
  "dependencies": {
    "@mediapipe/face_mesh": "^0.4.1633559619",
    "@tensorflow/tfjs": "^4.10.0",
    "@tensorflow-models/pose-detection": "^2.1.0"
  }
}
```

### File Structure
```
chrome-extension-v2/
├── engagement-tracker.js       (Main engagement tracking logic)
├── visual-tracker.js           (Features 1-6, 12)
├── audio-tracker.js            (Features 7-11)
├── models/                     (ML models cache)
└── manifest.json              (Add permissions for camera/audio)
```

---

## Implementation Plan (Step-by-Step)

### Phase 1: Setup (Day 1)
- [ ] Add MediaPipe and TensorFlow.js to project
- [ ] Create engagement-tracker.js skeleton
- [ ] Update manifest.json permissions
- [ ] Test basic face detection

### Phase 2: Visual Features (Day 2-3)
- [ ] Feature 1: Lean direction
- [ ] Feature 3: Blink rate (easiest to start)
- [ ] Feature 6: Smile detection
- [ ] Feature 4: Head nods/shakes
- [ ] Feature 2: Gaze tracking
- [ ] Feature 5: Facial tension
- [ ] Feature 12: Screen attention

### Phase 3: Audio Features (Day 4)
- [ ] Feature 7: Speech rate (already have transcript)
- [ ] Feature 9: Energy/loudness
- [ ] Feature 10: Pause duration
- [ ] Feature 8: Prosody variation
- [ ] Feature 11: Interruption patterns

### Phase 4: Integration (Day 5)
- [ ] Add engagement panel to UI
- [ ] Create real-time dashboard
- [ ] Add data storage/logging
- [ ] Performance optimization
- [ ] Testing on real meetings

---

## Performance Considerations

### Optimization Strategies
1. **Run ML models at 5 FPS** (not 30 FPS) to save CPU
2. **Use Web Workers** for heavy processing
3. **Lazy load models** (only when meeting starts)
4. **Cache results** for 200ms to avoid re-calculation
5. **Use offscreen canvas** for video processing

### Target Performance
- CPU usage: < 15%
- Memory: < 200MB
- No frame drops in video
- No audio lag

---

## UI Display

### Engagement Panel (New)
```
┌─────────────────────────────┐
│ 📊 CLIENT ENGAGEMENT        │
├─────────────────────────────┤
│ 😊 Smile Events: 5          │
│ 👀 Gaze: Stable ✅          │
│ 💬 Speech Rate: Normal      │
│ 🎯 Attention: 85%           │
│ 😌 Tension: Low             │
│ 🔊 Energy: Medium           │
└─────────────────────────────┘
```

---

## API Key Requirements

### MediaPipe (Free)
- No API key needed
- Runs locally in browser
- Models: ~10MB download

### TensorFlow.js (Free)
- No API key needed
- Open source models

---

## Error Handling

### Graceful Degradation
- If camera permission denied → Skip visual features, keep audio
- If face not detected → Show "Waiting for face..."
- If model fails to load → Use fallback detection
- If performance drops → Reduce FPS automatically

---

## Testing Checklist

- [ ] Works with camera on/off
- [ ] Works with multiple participants
- [ ] No performance impact on Google Meet
- [ ] Accurate detection (>85%)
- [ ] UI updates smoothly
- [ ] Data exports correctly

---

## Version Planning

- **v3.7.0:** Visual features (1-6, 12)
- **v3.8.0:** Audio features (7-11)
- **v3.9.0:** Full integration + dashboard

---

**Current Status:** Planning Complete ✅
**Next Step:** Start Phase 1 - Setup
