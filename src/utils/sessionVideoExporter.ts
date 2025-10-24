/**
 * Session Video Exporter
 * Exports session playback as video file
 */

interface ExportOptions {
  format: "webm" | "mp4";
  quality: "low" | "medium" | "high";
  fps: number;
  includeAudio: boolean;
}

interface ExportProgress {
  phase: "preparing" | "recording" | "encoding" | "complete";
  progress: number;
  message: string;
}

export class SessionVideoExporter {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;

  /**
   * Export session playback as video
   */
  async exportSession(
    viewportElement: HTMLElement,
    options: Partial<ExportOptions> = {},
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> {
    const defaultOptions: ExportOptions = {
      format: "webm",
      quality: "medium",
      fps: 30,
      includeAudio: false,
      ...options,
    };

    try {
      // Phase 1: Preparing
      onProgress?.({
        phase: "preparing",
        progress: 0,
        message: "Preparing video export...",
      });

      // Create canvas for recording
      await this.setupCanvas(viewportElement);

      // Phase 2: Recording
      onProgress?.({
        phase: "recording",
        progress: 25,
        message: "Recording session playback...",
      });

      // Start recording
      await this.startRecording(defaultOptions);

      // Simulate recording process (in real implementation, this would be the actual playback)
      await this.simulateRecording(onProgress);

      // Stop recording
      const videoBlob = await this.stopRecording();

      // Phase 3: Encoding
      onProgress?.({
        phase: "encoding",
        progress: 90,
        message: "Encoding video...",
      });

      // Process final encoding (if needed for format conversion)
      const finalBlob = await this.processEncoding(videoBlob, defaultOptions);

      // Phase 4: Complete
      onProgress?.({
        phase: "complete",
        progress: 100,
        message: "Video export complete!",
      });

      return finalBlob;
    } catch (error) {
      console.error("Video export failed:", error);
      throw new Error(
        `Failed to export video: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      this.cleanup();
    }
  }

  /**
   * Setup canvas for recording
   */
  private async setupCanvas(viewportElement: HTMLElement): Promise<void> {
    this.canvas = document.createElement("canvas");
    const rect = viewportElement.getBoundingClientRect();

    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    this.context = this.canvas.getContext("2d");
    if (!this.context) {
      throw new Error("Failed to get canvas context");
    }
  }

  /**
   * Start recording from canvas stream
   */
  private async startRecording(options: ExportOptions): Promise<void> {
    if (!this.canvas) {
      throw new Error("Canvas not initialized");
    }

    // Get stream from canvas
    const stream = this.canvas.captureStream(options.fps);

    // Setup media recorder
    const mimeType = this.getMimeType(options.format, options.quality);
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: this.getBitrate(options.quality),
    });

    this.recordedChunks = [];

    // Collect chunks
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
  }

  /**
   * Simulate recording process (in real implementation, this would capture actual playback)
   */
  private async simulateRecording(onProgress?: (progress: ExportProgress) => void): Promise<void> {
    // In a real implementation, this would:
    // 1. Play back each step of the session
    // 2. Render each frame to the canvas
    // 3. Apply interaction overlays
    // 4. Capture the canvas stream

    // For now, we'll simulate with a delay
    const duration = 3000; // 3 seconds simulation
    const steps = 10;
    const stepDelay = duration / steps;

    for (let i = 0; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDelay));

      const progress = 25 + (i / steps) * 65; // 25% to 90%
      onProgress?.({
        phase: "recording",
        progress,
        message: `Recording: ${Math.round(progress)}%`,
      });

      // Render frame to canvas (simulated)
      if (this.context && this.canvas) {
        this.context.fillStyle = `hsl(${i * 36}, 70%, 50%)`;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillStyle = "white";
        this.context.font = "24px sans-serif";
        this.context.textAlign = "center";
        this.context.fillText(`Frame ${i}/${steps}`, this.canvas.width / 2, this.canvas.height / 2);
      }
    }
  }

  /**
   * Stop recording and return video blob
   */
  private async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("MediaRecorder not initialized"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder!.mimeType,
        });
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Process final encoding (format conversion if needed)
   */
  private async processEncoding(blob: Blob, _options: ExportOptions): Promise<Blob> {
    // In a real implementation, this would handle:
    // - Format conversion (WebM to MP4)
    // - Quality adjustments
    // - Adding metadata
    // - Optimizing file size

    // For now, return the blob as-is
    return blob;
  }

  /**
   * Get MIME type based on format and quality
   */
  private getMimeType(format: string, _quality: string): string {
    if (format === "webm") {
      return "video/webm;codecs=vp9";
    } else if (format === "mp4") {
      // Note: MP4 recording may not be supported in all browsers
      // May need to record as WebM and convert
      return "video/mp4;codecs=h264";
    }
    return "video/webm";
  }

  /**
   * Get bitrate based on quality setting
   */
  private getBitrate(quality: string): number {
    switch (quality) {
      case "low":
        return 1_000_000; // 1 Mbps
      case "medium":
        return 2_500_000; // 2.5 Mbps
      case "high":
        return 5_000_000; // 5 Mbps
      default:
        return 2_500_000;
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.canvas = null;
    this.context = null;
  }

  /**
   * Download exported video
   */
  static downloadVideo(blob: Blob, filename: string = "session-playback.webm"): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get estimated file size
   */
  static estimateFileSize(durationSeconds: number, quality: ExportOptions["quality"]): string {
    const bitrates = {
      low: 1_000_000,
      medium: 2_500_000,
      high: 5_000_000,
    };

    const bitrate = bitrates[quality];
    const bytes = (bitrate / 8) * durationSeconds;

    return this.formatBytes(bytes);
  }

  /**
   * Format bytes to human-readable string
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

/**
 * Example usage:
 *
 * const exporter = new SessionVideoExporter();
 * const viewportElement = document.getElementById('viewport');
 *
 * const videoBlob = await exporter.exportSession(
 *   viewportElement,
 *   {
 *     format: 'webm',
 *     quality: 'medium',
 *     fps: 30,
 *   },
 *   (progress) => {
 *     console.log(`${progress.phase}: ${progress.progress}%`);
 *   }
 * );
 *
 * SessionVideoExporter.downloadVideo(videoBlob, 'my-session.webm');
 */
