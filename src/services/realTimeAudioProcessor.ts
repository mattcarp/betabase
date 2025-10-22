/**
 * Enhanced Real-Time Audio Processing Service
 *
 * Provides advanced audio processing capabilities including:
 * - Real-time frequency analysis
 * - Audio feature extraction with SPL calculations
 * - Voice activity detection with rolling averages
 * - Audio quality monitoring
 * - ElevenLabs integration support
 */

export interface AudioFeatures {
  pitch: number;
  energy: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  rms: number;
  voiceActivity: boolean;
  silenceRatio: number;
  spl: number; // Sound Pressure Level in dB
  splRollingAverage: number; // Rolling average SPL
}

export interface AudioMetrics {
  peakLevel: number;
  averageLevel: number;
  signalToNoiseRatio: number;
  clippingDetected: boolean;
  frequencyPeaks: number[];
  dominantFrequency: number;
  vadConfidence: number; // Voice Activity Detection confidence
  audioQuality: number; // Overall audio quality score (0-100)
}

export interface ProcessingConfig {
  sampleRate: number;
  fftSize: number;
  hopSize: number;
  enableVAD: boolean;
  enableFeatureExtraction: boolean;
  noiseGate: number; // dB
  splReferenceLevel: number; // Reference level for SPL calculation
  rollingAverageWindow: number; // Window size for rolling averages
  vadSensitivity: number; // VAD sensitivity (0-1)
  preferredDeviceId?: string; // Preferred audio input device ID
}

export class RealTimeAudioProcessor {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isProcessing = false;
  private processingInterval: number | null = null;
  private config: ProcessingConfig = {
    sampleRate: 44100,
    fftSize: 2048,
    hopSize: 512,
    enableVAD: true,
    enableFeatureExtraction: true,
    noiseGate: -40, // dB
    splReferenceLevel: 94, // Standard SPL reference (94 dB SPL = 1 Pa)
    rollingAverageWindow: 20, // 20 frames for rolling average
    vadSensitivity: 0.5, // Medium sensitivity
  };

  private frequencyData: Uint8Array = new Uint8Array(0);
  private timeData: Uint8Array = new Uint8Array(0);
  private previousFrames: number[][] = [];
  private vadThreshold = 0.01;
  private silenceCounter = 0;

  // Rolling average buffers
  private splBuffer: number[] = [];
  private rmsBuffer: number[] = [];
  private vadBuffer: boolean[] = [];

  // Performance optimization
  private lastProcessTime = 0;
  private processingStats = {
    averageProcessTime: 0,
    maxProcessTime: 0,
    frameCount: 0,
  };

  /**
   * Initialize the audio processor with enhanced configuration
   */
  async initialize(config?: Partial<ProcessingConfig>): Promise<void> {
    if (this.audioContext) {
      console.log("Real-time audio processor already initialized");
      return;
    }

    this.config = { ...this.config, ...config };

    try {
      // Detect Electron environment for platform-specific optimizations
      const isElectron = (window as any).isElectron || false;
      console.log(`🎵 Initializing audio processor (Electron: ${isElectron})`);

      // Create audio context with platform-specific optimizations
      const audioContextOptions: AudioContextOptions = {
        sampleRate: this.config.sampleRate,
        latencyHint: isElectron ? "playback" : "interactive", // Electron: optimize for stability over latency
      };

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(
        audioContextOptions
      );

      // Enhanced Electron lifecycle handling
      if (isElectron) {
        this.setupElectronLifecycleHandlers();
      }

      // Resume context if suspended (common in Electron apps)
      if (this.audioContext.state === "suspended") {
        console.log("🔄 Resuming suspended audio context...");
        await this.audioContext.resume();
        console.log("✅ Audio context resumed successfully");
      }

      // Listen for state changes
      this.audioContext.addEventListener("statechange", () => {
        console.log(`🎵 Audio context state changed to: ${this.audioContext?.state}`);
        if (this.audioContext?.state === "suspended" && this.isProcessing) {
          console.warn("⚠️ Audio context suspended during processing - attempting resume");
          this.audioContext
            .resume()
            .catch((err) => console.error("Failed to resume audio context:", err));
        }
      });

      console.log("🎵 Real-time audio processor initialized with enhanced features");
      console.log(`   Platform: ${isElectron ? "Electron" : "Web"}`);
      console.log(`   Sample Rate: ${this.audioContext.sampleRate}Hz`);
      console.log(`   FFT Size: ${this.config.fftSize}`);
      console.log(`   SPL Reference: ${this.config.splReferenceLevel}dB`);
      console.log(`   Rolling Window: ${this.config.rollingAverageWindow} frames`);
      console.log(`   Audio Context State: ${this.audioContext.state}`);
    } catch (error) {
      console.error("Failed to initialize audio processor:", error);
      throw error;
    }
  }

  /**
   * Setup Electron-specific lifecycle handlers
   */
  private setupElectronLifecycleHandlers(): void {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      // Handle app focus/blur events for audio context management
      window.addEventListener("focus", () => {
        if (this.audioContext?.state === "suspended") {
          console.log("🔄 App focused - resuming audio context");
          this.audioContext
            .resume()
            .catch((err) => console.error("Failed to resume audio context on focus:", err));
        }
      });

      window.addEventListener("blur", () => {
        // Optionally suspend audio context when app loses focus to save resources
        // Disabled by default to maintain real-time processing
        // if (this.audioContext?.state === 'running') {
        //   console.log('⏸️ App blurred - suspending audio context')
        //   this.audioContext.suspend()
        // }
      });

      // Handle before unload to cleanup properly
      window.addEventListener("beforeunload", () => {
        console.log("🧹 Cleaning up audio processor before unload");
        this.cleanup();
      });
    }
  }

  /**
   * Start real-time audio processing with enhanced monitoring
   */
  async startProcessing(
    onAudioFeatures?: (features: AudioFeatures) => void,
    onAudioMetrics?: (metrics: AudioMetrics) => void,
    onFrequencyData?: (data: Uint8Array) => void
  ): Promise<void> {
    if (!this.audioContext) {
      throw new Error("Audio processor not initialized");
    }

    if (this.isProcessing) {
      console.log("Audio processing already running");
      return;
    }

    try {
      // Enhanced Electron-specific microphone access with permission handling
      const isElectron = (window as any).isElectron || false;
      console.log(`🎤 Requesting microphone access (Electron: ${isElectron})`);

      // Electron-optimized audio constraints
      const audioConstraints: MediaTrackConstraints = {
        sampleRate: this.config.sampleRate,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // Use preferred device if specified
        ...(this.config.preferredDeviceId && {
          deviceId: { exact: this.config.preferredDeviceId },
        }),
        // Electron-specific optimizations
        ...(isElectron && {
          latency: 0.01, // 10ms target latency for real-time processing
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googBeamforming: true,
        }),
      };

      // Handle getUserMedia with Electron-specific error handling
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });

        // Log successful audio track details for debugging
        const audioTracks = this.mediaStream.getAudioTracks();
        if (audioTracks.length > 0) {
          const track = audioTracks[0];
          const settings = track.getSettings();
          console.log("🎤 Audio track acquired:", {
            deviceId: settings.deviceId,
            sampleRate: settings.sampleRate,
            channelCount: settings.channelCount,
            echoCancellation: settings.echoCancellation,
            noiseSuppression: settings.noiseSuppression,
            autoGainControl: settings.autoGainControl,
          });
        }
      } catch (micError: any) {
        // Electron-specific error handling for permissions
        if (micError.name === "NotAllowedError") {
          throw new Error(
            isElectron
              ? "Microphone access denied. Please check Electron app permissions in System Preferences."
              : "Microphone access denied. Please allow microphone access and try again."
          );
        } else if (micError.name === "NotFoundError") {
          throw new Error("No microphone found. Please connect a microphone and try again.");
        } else if (micError.name === "NotReadableError") {
          throw new Error(
            "Microphone is in use by another application. Please close other apps using the microphone."
          );
        }
        throw micError;
      }

      // Create audio nodes with optimized settings
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();

      this.analyser.fftSize = this.config.fftSize;
      this.analyser.smoothingTimeConstant = 0.3; // Faster response for real-time
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      // Connect nodes
      this.sourceNode.connect(this.analyser);

      // Initialize data arrays
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.fftSize);

      // Reset buffers
      this.splBuffer = [];
      this.rmsBuffer = [];
      this.vadBuffer = [];
      this.previousFrames = [];

      this.isProcessing = true;

      // Start processing loop with performance monitoring
      this.processingInterval = window.setInterval(
        () => {
          const startTime = performance.now();
          this.processAudioFrame(onAudioFeatures, onAudioMetrics, onFrequencyData);
          const endTime = performance.now();

          // Update performance stats
          const processTime = endTime - startTime;
          this.processingStats.frameCount++;
          this.processingStats.averageProcessTime =
            (this.processingStats.averageProcessTime * (this.processingStats.frameCount - 1) +
              processTime) /
            this.processingStats.frameCount;
          this.processingStats.maxProcessTime = Math.max(
            this.processingStats.maxProcessTime,
            processTime
          );

          // Log performance warnings
          if (processTime > 10) {
            // More than 10ms processing time
            console.warn(`⚠️ Slow audio processing: ${processTime.toFixed(2)}ms`);
          }
        },
        (this.config.hopSize / this.config.sampleRate) * 1000
      ); // Convert to milliseconds

      console.log("🎤 Enhanced real-time audio processing started");
      console.log(
        `   Processing interval: ${((this.config.hopSize / this.config.sampleRate) * 1000).toFixed(1)}ms`
      );
    } catch (error) {
      console.error("Failed to start audio processing:", error);
      throw error;
    }
  }

  /**
   * Stop audio processing and cleanup resources
   */
  stopProcessing(): void {
    this.isProcessing = false;

    if (this.processingInterval) {
      window.clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop();
        console.log("🎤 Audio track stopped:", track.label || "Unknown");
      });
      this.mediaStream = null;
    }

    // Clear buffers
    this.splBuffer = [];
    this.rmsBuffer = [];
    this.vadBuffer = [];
    this.previousFrames = [];

    // Log final performance stats
    console.log("🛑 Real-time audio processing stopped");
    console.log(`   Processed ${this.processingStats.frameCount} frames`);
    console.log(
      `   Average processing time: ${this.processingStats.averageProcessTime.toFixed(2)}ms`
    );
    console.log(`   Max processing time: ${this.processingStats.maxProcessTime.toFixed(2)}ms`);
  }

  /**
   * Complete cleanup of all resources (Electron-optimized)
   */
  cleanup(): void {
    console.log("🧹 Performing complete audio processor cleanup");

    // Stop processing if active
    if (this.isProcessing) {
      this.stopProcessing();
    }

    // Close audio context (Electron-safe)
    if (this.audioContext) {
      try {
        // In Electron, we may want to keep the context for future use
        // Only close if specifically requested
        if (this.audioContext.state !== "closed") {
          // Suspend instead of close for faster restart
          this.audioContext.suspend();
          console.log("🔇 Audio context suspended for cleanup");
        }
      } catch (error) {
        console.warn("Warning during audio context cleanup:", error);
      }
    }

    // Reset performance stats
    this.processingStats = {
      averageProcessTime: 0,
      maxProcessTime: 0,
      frameCount: 0,
    };
  }

  /**
   * Dispose method for complete teardown
   */
  dispose(): void {
    console.log("🗑️ Disposing audio processor");
    this.cleanup();

    // Close audio context completely
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Process a single audio frame with enhanced analysis
   */
  private processAudioFrame(
    onAudioFeatures?: (features: AudioFeatures) => void,
    onAudioMetrics?: (metrics: AudioMetrics) => void,
    onFrequencyData?: (data: Uint8Array) => void
  ): void {
    if (!this.analyser || !this.isProcessing) return;

    // Get frequency and time domain data
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeData);

    // Callback with raw frequency data
    if (onFrequencyData) {
      onFrequencyData(this.frequencyData);
    }

    // Extract enhanced audio features
    if (this.config.enableFeatureExtraction && onAudioFeatures) {
      const features = this.extractEnhancedAudioFeatures();
      onAudioFeatures(features);
    }

    // Calculate enhanced metrics
    if (onAudioMetrics) {
      const metrics = this.calculateEnhancedAudioMetrics();
      onAudioMetrics(metrics);
    }

    // Store frame for temporal analysis
    const normalizedFrame = Array.from(this.frequencyData).map((val) => val / 255);
    this.previousFrames.push(normalizedFrame);
    if (this.previousFrames.length > this.config.rollingAverageWindow) {
      this.previousFrames.shift();
    }
  }

  /**
   * Extract enhanced audio features with SPL and rolling averages
   */
  private extractEnhancedAudioFeatures(): AudioFeatures {
    const timeDataFloat = Array.from(this.timeData).map((val) => (val - 128) / 128);
    const freqDataFloat = Array.from(this.frequencyData).map((val) => val / 255);

    // Calculate RMS energy
    const rms = Math.sqrt(
      timeDataFloat.reduce((sum, val) => sum + val * val, 0) / timeDataFloat.length
    );

    // Calculate SPL (Sound Pressure Level)
    const spl = this.calculateSPL(rms);

    // Update rolling buffers
    this.splBuffer.push(spl);
    this.rmsBuffer.push(rms);
    if (this.splBuffer.length > this.config.rollingAverageWindow) {
      this.splBuffer.shift();
      this.rmsBuffer.shift();
    }

    // Calculate rolling averages
    const splRollingAverage =
      this.splBuffer.reduce((sum, val) => sum + val, 0) / this.splBuffer.length;
    const rmsRollingAverage =
      this.rmsBuffer.reduce((sum, val) => sum + val, 0) / this.rmsBuffer.length;

    // Zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < timeDataFloat.length; i++) {
      if (timeDataFloat[i] >= 0 !== timeDataFloat[i - 1] >= 0) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / timeDataFloat.length;

    // Spectral centroid (brightness)
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < freqDataFloat.length; i++) {
      const frequency = (i * this.config.sampleRate) / (2 * freqDataFloat.length);
      weightedSum += frequency * freqDataFloat[i];
      magnitudeSum += freqDataFloat[i];
    }
    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // Enhanced fundamental frequency (pitch) estimation
    const pitch = this.estimateEnhancedPitch(timeDataFloat);

    // Enhanced voice activity detection with rolling average
    const voiceActivity = this.detectEnhancedVoiceActivity(
      rmsRollingAverage,
      spectralCentroid,
      zeroCrossingRate
    );

    // Update VAD buffer
    this.vadBuffer.push(voiceActivity);
    if (this.vadBuffer.length > this.config.rollingAverageWindow) {
      this.vadBuffer.shift();
    }

    // Energy calculation
    const energy = freqDataFloat.reduce((sum, val) => sum + val * val, 0);

    // Enhanced silence ratio calculation
    const silenceRatio = this.calculateEnhancedSilenceRatio();

    return {
      pitch,
      energy,
      spectralCentroid,
      zeroCrossingRate,
      rms,
      voiceActivity,
      silenceRatio,
      spl,
      splRollingAverage,
    };
  }

  /**
   * Calculate SPL (Sound Pressure Level) in decibels
   */
  private calculateSPL(rms: number): number {
    if (rms <= 0) return -Infinity;

    // Convert RMS to SPL using reference level
    // SPL = 20 * log10(RMS / Reference) + Reference_dB
    const referencePressure = 0.00002; // 20 µPa (threshold of hearing)
    const spl = 20 * Math.log10(rms / referencePressure) + this.config.splReferenceLevel;

    // Clamp to reasonable range
    return Math.max(-80, Math.min(140, spl));
  }

  /**
   * Enhanced pitch estimation with harmonic analysis
   */
  private estimateEnhancedPitch(timeData: number[]): number {
    // Autocorrelation-based pitch detection
    const sampleRate = this.config.sampleRate;
    const minPeriod = Math.floor(sampleRate / 800); // ~800 Hz max
    const maxPeriod = Math.floor(sampleRate / 80); // ~80 Hz min

    let bestPeriod = 0;
    let bestCorrelation = 0;

    for (let period = minPeriod; period < maxPeriod && period < timeData.length / 2; period++) {
      let correlation = 0;
      for (let i = 0; i < timeData.length - period; i++) {
        correlation += timeData[i] * timeData[i + period];
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  /**
   * Enhanced voice activity detection with multiple features
   */
  private detectEnhancedVoiceActivity(
    rms: number,
    spectralCentroid: number,
    zeroCrossingRate: number
  ): boolean {
    // Multi-feature VAD algorithm
    const energyThreshold = this.config.vadSensitivity * 0.02;
    const spectralThreshold = 1000; // Hz
    const zcrThreshold = 0.1;

    // Energy-based detection
    const energyVAD = rms > energyThreshold;

    // Spectral-based detection (voice typically has lower spectral centroid)
    const spectralVAD = spectralCentroid > 200 && spectralCentroid < spectralThreshold;

    // Zero-crossing rate based detection (voice has moderate ZCR)
    const zcrVAD = zeroCrossingRate > 0.01 && zeroCrossingRate < zcrThreshold;

    // Combine features with weights
    const vadScore = (energyVAD ? 0.5 : 0) + (spectralVAD ? 0.3 : 0) + (zcrVAD ? 0.2 : 0);

    return vadScore > 0.6; // Threshold for voice activity
  }

  /**
   * Calculate enhanced silence ratio with temporal smoothing
   */
  private calculateEnhancedSilenceRatio(): number {
    if (this.vadBuffer.length === 0) return 1.0;

    const silentFrames = this.vadBuffer.filter((vad) => !vad).length;
    return silentFrames / this.vadBuffer.length;
  }

  /**
   * Calculate enhanced audio quality metrics
   */
  private calculateEnhancedAudioMetrics(): AudioMetrics {
    const freqDataFloat = Array.from(this.frequencyData).map((val) => val / 255);
    const timeDataFloat = Array.from(this.timeData).map((val) => (val - 128) / 128);

    // Peak and average levels
    const peakLevel = Math.max(...timeDataFloat.map(Math.abs));
    const averageLevel =
      timeDataFloat.reduce((sum, val) => sum + Math.abs(val), 0) / timeDataFloat.length;

    // Enhanced signal to noise ratio estimation
    const signal = freqDataFloat.slice(0, Math.floor(freqDataFloat.length * 0.7));
    const noise = freqDataFloat.slice(Math.floor(freqDataFloat.length * 0.8));
    const signalPower = signal.reduce((sum, val) => sum + val * val, 0) / signal.length;
    const noisePower = noise.reduce((sum, val) => sum + val * val, 0) / noise.length;
    const signalToNoiseRatio = noisePower > 0 ? 10 * Math.log10(signalPower / noisePower) : 0;

    // Enhanced clipping detection
    const clippingDetected = timeDataFloat.some((val) => Math.abs(val) > 0.95);

    // Find frequency peaks with better peak detection
    const frequencyPeaks: number[] = [];
    const smoothedFreqData = this.smoothArray(freqDataFloat, 3); // Smooth for better peak detection

    for (let i = 2; i < smoothedFreqData.length - 2; i++) {
      if (
        smoothedFreqData[i] > smoothedFreqData[i - 1] &&
        smoothedFreqData[i] > smoothedFreqData[i + 1] &&
        smoothedFreqData[i] > smoothedFreqData[i - 2] &&
        smoothedFreqData[i] > smoothedFreqData[i + 2] &&
        smoothedFreqData[i] > 0.1
      ) {
        const frequency = (i * this.config.sampleRate) / (2 * freqDataFloat.length);
        frequencyPeaks.push(frequency);
      }
    }

    // Dominant frequency with better accuracy
    const maxIndex = freqDataFloat.indexOf(Math.max(...freqDataFloat));
    const dominantFrequency = (maxIndex * this.config.sampleRate) / (2 * freqDataFloat.length);

    // VAD confidence based on recent history
    const vadConfidence =
      this.vadBuffer.length > 0
        ? this.vadBuffer.filter((vad) => vad).length / this.vadBuffer.length
        : 0;

    // Overall audio quality score (0-100)
    const audioQuality = this.calculateAudioQualityScore(
      signalToNoiseRatio,
      clippingDetected,
      vadConfidence
    );

    return {
      peakLevel,
      averageLevel,
      signalToNoiseRatio,
      clippingDetected,
      frequencyPeaks: frequencyPeaks.slice(0, 5), // Top 5 peaks
      dominantFrequency,
      vadConfidence,
      audioQuality,
    };
  }

  /**
   * Calculate overall audio quality score
   */
  private calculateAudioQualityScore(
    snr: number,
    clipping: boolean,
    vadConfidence: number
  ): number {
    let score = 50; // Base score

    // SNR contribution (0-40 points)
    score += Math.min(40, Math.max(0, snr * 2));

    // Clipping penalty (-20 points)
    if (clipping) score -= 20;

    // VAD confidence contribution (0-30 points)
    score += vadConfidence * 30;

    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Smooth an array using moving average
   */
  private smoothArray(data: number[], windowSize: number): number[] {
    const smoothed: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;

      for (
        let j = Math.max(0, i - halfWindow);
        j <= Math.min(data.length - 1, i + halfWindow);
        j++
      ) {
        sum += data[j];
        count++;
      }

      smoothed[i] = sum / count;
    }

    return smoothed;
  }

  /**
   * Get current processing statistics
   */
  getProcessingStats() {
    return {
      ...this.processingStats,
      isProcessing: this.isProcessing,
      bufferSizes: {
        spl: this.splBuffer.length,
        rms: this.rmsBuffer.length,
        vad: this.vadBuffer.length,
        frames: this.previousFrames.length,
      },
    };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(newConfig: Partial<ProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔧 Audio processor configuration updated:", newConfig);
  }

  /**
   * Get available audio input devices (Electron-optimized)
   */
  async getAvailableAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((device) => device.kind === "audioinput");

      console.log(
        "🎤 Available audio input devices:",
        audioInputs.map((d) => ({
          deviceId: d.deviceId,
          label: d.label || "Unknown Device",
          groupId: d.groupId,
        }))
      );

      return audioInputs;
    } catch (error) {
      console.error("Failed to enumerate audio devices:", error);
      return [];
    }
  }

  /**
   * Set preferred audio input device
   */
  setPreferredAudioDevice(deviceId: string): void {
    this.config = {
      ...this.config,
      preferredDeviceId: deviceId,
    } as ProcessingConfig;
    console.log("🎤 Preferred audio device set to:", deviceId);
  }

  /**
   * Test audio device capabilities
   */
  async testAudioDevice(deviceId?: string): Promise<{
    success: boolean;
    sampleRate?: number;
    channelCount?: number;
    error?: string;
  }> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          ...(deviceId && { deviceId: { exact: deviceId } }),
          sampleRate: this.config.sampleRate,
          channelCount: 1,
        },
      };

      const testStream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioTracks = testStream.getAudioTracks();

      if (audioTracks.length > 0) {
        const settings = audioTracks[0].getSettings();
        testStream.getTracks().forEach((track) => track.stop());

        return {
          success: true,
          sampleRate: settings.sampleRate,
          channelCount: settings.channelCount,
        };
      }

      return { success: false, error: "No audio tracks available" };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Unknown error testing audio device",
      };
    }
  }

  /**
   * Get current audio levels for UI display
   */
  getCurrentLevels() {
    if (this.splBuffer.length === 0 || this.rmsBuffer.length === 0) {
      return {
        spl: -Infinity,
        splAverage: -Infinity,
        rms: 0,
        rmsAverage: 0,
        vadActive: false,
      };
    }

    return {
      spl: this.splBuffer[this.splBuffer.length - 1],
      splAverage: this.splBuffer.reduce((sum, val) => sum + val, 0) / this.splBuffer.length,
      rms: this.rmsBuffer[this.rmsBuffer.length - 1],
      rmsAverage: this.rmsBuffer.reduce((sum, val) => sum + val, 0) / this.rmsBuffer.length,
      vadActive: this.vadBuffer.length > 0 ? this.vadBuffer[this.vadBuffer.length - 1] : false,
    };
  }
}

// Export singleton instance
export const audioProcessor = new RealTimeAudioProcessor();

export default audioProcessor;
