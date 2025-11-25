/**
 * AUDIO ENGAGEMENT TRACKER
 * Tracks client engagement using audio analysis
 * Features: Speech Rate, Prosody, Energy, Pauses, Interruptions
 */

(function() {
  console.log('🎙️ Audio Engagement Tracker Loading...');

  // State
  let audioContext = null;
  let analyser = null;
  let isTracking = false;
  let audioStream = null;

  // Audio metrics
  let audioData = {
    speechRate: { wordsPerMinute: 0, status: 'normal' },
    prosody: { pitchVariation: 0, status: 'normal' },
    energy: { volumeDb: 0, energyLevel: 'medium' },
    pauses: { avgDuration: 0, longestPause: 0, pauseCount: 0 },
    interruptions: { count: 0, overlapDuration: 0 }
  };

  // Speech tracking
  let speechStartTime = null;
  let totalWords = 0;
  let speechSegments = [];

  // Pause tracking
  let lastSpeechTime = null;
  let pauseStartTime = null;
  let pauseDurations = [];

  // Prosody tracking
  let pitchValues = [];
  let pitchHistorySize = 50; // Keep last 50 pitch values

  // Energy tracking
  let volumeHistory = [];

  // Interruption tracking
  let lastSpeaker = null;
  let speakingOverlapStart = null;

  /**
   * Feature 7: Calculate speech rate (words per minute)
   */
  function calculateSpeechRate(text, speaker) {
    if (!text || text.length === 0) return;

    // Count words
    const words = text.trim().split(/\s+/).length;
    totalWords += words;

    // Track speech time
    const now = Date.now();
    if (!speechStartTime) {
      speechStartTime = now;
    }

    const elapsedMinutes = (now - speechStartTime) / 60000;

    if (elapsedMinutes > 0) {
      audioData.speechRate.wordsPerMinute = Math.round(totalWords / elapsedMinutes);

      // Categorize speech rate
      const wpm = audioData.speechRate.wordsPerMinute;
      if (wpm < 100) {
        audioData.speechRate.status = 'slow';
      } else if (wpm > 160) {
        audioData.speechRate.status = 'fast';
      } else {
        audioData.speechRate.status = 'normal';
      }

      console.log(`🗣️ Speech rate: ${wpm} WPM (${audioData.speechRate.status})`);
    }

    return audioData.speechRate;
  }

  /**
   * Feature 10: Track pauses duration
   */
  function trackPauseDuration(isSpeaking) {
    const now = Date.now();

    if (isSpeaking) {
      // Speech detected
      if (pauseStartTime) {
        // End of pause
        const pauseDuration = (now - pauseStartTime) / 1000; // seconds
        if (pauseDuration > 0.5) { // Only count pauses > 0.5s
          pauseDurations.push(pauseDuration);
          console.log(`⏸️ Pause detected: ${pauseDuration.toFixed(2)}s`);

          // Keep only recent pauses (last minute)
          const oneMinuteAgo = now - 60000;
          pauseDurations = pauseDurations.filter(p => p.timestamp > oneMinuteAgo);

          // Calculate statistics
          if (pauseDurations.length > 0) {
            const sum = pauseDurations.reduce((a, b) => a + b, 0);
            audioData.pauses.avgDuration = (sum / pauseDurations.length).toFixed(2);
            audioData.pauses.longestPause = Math.max(...pauseDurations).toFixed(2);
            audioData.pauses.pauseCount = pauseDurations.length;
          }
        }
        pauseStartTime = null;
      }
      lastSpeechTime = now;
    } else {
      // Silence detected
      if (lastSpeechTime && !pauseStartTime) {
        pauseStartTime = now;
      }
    }

    return audioData.pauses;
  }

  /**
   * Feature 8: Analyze prosody (pitch variation)
   */
  function analyzeProsody() {
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);

    // Detect pitch using autocorrelation
    let pitch = detectPitch(dataArray, audioContext.sampleRate);

    if (pitch > 0) {
      pitchValues.push(pitch);

      // Keep only recent values
      if (pitchValues.length > pitchHistorySize) {
        pitchValues.shift();
      }

      // Calculate pitch variation (standard deviation)
      if (pitchValues.length > 10) {
        const mean = pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length;
        const variance = pitchValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pitchValues.length;
        const stdDev = Math.sqrt(variance);

        // Normalize to 0-100 scale
        const variation = Math.min(100, (stdDev / mean) * 100);

        audioData.prosody.pitchVariation = Math.round(variation);

        // Categorize
        if (variation < 10) {
          audioData.prosody.status = 'monotone';
        } else if (variation > 30) {
          audioData.prosody.status = 'expressive';
        } else {
          audioData.prosody.status = 'normal';
        }
      }
    }

    return audioData.prosody;
  }

  /**
   * Detect pitch using autocorrelation
   */
  function detectPitch(buffer, sampleRate) {
    // Autocorrelation algorithm for pitch detection
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;

    // Calculate RMS (root mean square) for volume threshold
    for (let i = 0; i < SIZE; i++) {
      const val = (buffer[i] - 128) / 128;
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // Not enough signal
    if (rms < 0.01) return -1;

    // Find the best correlation
    let lastCorrelation = 1;
    for (let offset = 1; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;

      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(((buffer[i] - 128) / 128) - ((buffer[i + offset] - 128) / 128));
      }

      correlation = 1 - (correlation / MAX_SAMPLES);

      if (correlation > 0.9 && correlation > lastCorrelation) {
        const foundGoodCorrelation = correlation > best_correlation;
        if (foundGoodCorrelation) {
          best_correlation = correlation;
          best_offset = offset;
        }
      }

      lastCorrelation = correlation;
    }

    if (best_correlation > 0.01 && best_offset > -1) {
      const pitch = sampleRate / best_offset;
      return pitch;
    }

    return -1;
  }

  /**
   * Feature 9: Measure energy levels (loudness)
   */
  function measureEnergyLevel() {
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;

    // Convert to decibels (approximate)
    const volumeDb = Math.round((average / 255) * 100);

    audioData.energy.volumeDb = volumeDb;

    // Categorize energy level
    if (volumeDb < 30) {
      audioData.energy.energyLevel = 'low';
    } else if (volumeDb > 60) {
      audioData.energy.energyLevel = 'high';
    } else {
      audioData.energy.energyLevel = 'medium';
    }

    return audioData.energy;
  }

  /**
   * Feature 11: Detect interruption patterns
   */
  function detectInterruption(speaker, isSpeaking) {
    const now = Date.now();

    if (!speaker) return;

    // Check if speaker changed while previous speaker was still talking
    if (lastSpeaker && speaker !== lastSpeaker && isSpeaking) {
      // Interruption detected!
      if (!speakingOverlapStart) {
        speakingOverlapStart = now;
        audioData.interruptions.count++;
        console.log(`🔥 Interruption detected! ${speaker} interrupted ${lastSpeaker}`);
      }
    }

    // Track overlap duration
    if (speakingOverlapStart && !isSpeaking) {
      const overlapDuration = (now - speakingOverlapStart) / 1000;
      audioData.interruptions.overlapDuration += overlapDuration;
      speakingOverlapStart = null;
    }

    if (isSpeaking) {
      lastSpeaker = speaker;
    }

    return audioData.interruptions;
  }

  /**
   * Process audio frame continuously
   */
  function processAudioFrame() {
    if (!isTracking || !analyser) return;

    // Analyze prosody (pitch variation)
    analyzeProsody();

    // Measure energy level
    measureEnergyLevel();

    // Continue processing
    requestAnimationFrame(processAudioFrame);
  }

  /**
   * Initialize Web Audio API
   */
  async function initializeAudioAnalysis() {
    try {
      console.log('🔧 Initializing Web Audio API...');

      // Create audio context
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Get audio stream from microphone
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create analyser
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyser);

      console.log('✅ Audio analysis initialized');
      return true;
    } catch (error) {
      console.error('❌ Audio initialization failed:', error);
      return false;
    }
  }

  /**
   * Start audio tracking
   */
  async function startTracking() {
    if (isTracking) return;

    console.log('🎙️ Starting audio engagement tracking...');

    const initialized = await initializeAudioAnalysis();
    if (!initialized) {
      console.error('❌ Could not initialize audio analysis');
      return;
    }

    isTracking = true;

    // Start continuous processing
    processAudioFrame();

    console.log('✅ Audio tracking started');
  }

  /**
   * Stop tracking
   */
  function stopTracking() {
    isTracking = false;

    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      audioStream = null;
    }

    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }

    console.log('🛑 Audio tracking stopped');
  }

  /**
   * Update from speech recognition
   */
  function onSpeechDetected(text, speaker, isFinal) {
    if (isFinal) {
      // Calculate speech rate
      calculateSpeechRate(text, speaker);

      // Track pauses
      trackPauseDuration(true);

      // Detect interruptions
      detectInterruption(speaker, true);
    }
  }

  /**
   * Update from silence detection
   */
  function onSilenceDetected() {
    trackPauseDuration(false);
  }

  /**
   * Get current audio data
   */
  function getAudioData() {
    return audioData;
  }

  // Export functions globally
  window.audioTracker = {
    start: startTracking,
    stop: stopTracking,
    getData: getAudioData,
    onSpeech: onSpeechDetected,
    onSilence: onSilenceDetected
  };

  console.log('✅ Audio Engagement Tracker Ready!');

})();
