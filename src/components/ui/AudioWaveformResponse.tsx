import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  Download,
  Share,
  Mic,
  BarChart3,
  Clock,
  Zap,
} from "lucide-react";

export interface AudioWaveformData {
  id: string;
  filename: string;
  duration: number;
  sampleRate: number;
  channels: number;
  bitRate: string;
  waveformData: number[]; // Amplitude values for visualization
  peaks: number[]; // Peak detection for visualization
  spectralData?: {
    frequencies: number[];
    magnitudes: number[];
    dominantFreq: number;
  };
  analysis: {
    rmsEnergy: number;
    zeroCrossingRate: number;
    spectralCentroid: number;
    snrDb: number;
    dynamicRange: number;
    voiceActivity: boolean;
    emotionScore?: {
      happiness: number;
      sadness: number;
      anger: number;
      surprise: number;
    };
  };
  transcription?: {
    text: string;
    confidence: number;
    language: string;
    speaker: string;
  };
  source: "elevenlabs" | "user_upload" | "live_recording";
  timestamp: Date;
}

export interface AudioWaveformResponseData {
  type: "audio_waveform";
  id: string;
  timestamp: Date;
  source: "elevenlabs" | "aoma" | "system";
  data: AudioWaveformData;
}

const WaveformVisualization: React.FC<{
  waveformData: number[];
  peaks: number[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}> = ({ waveformData, peaks, isPlaying, currentTime, duration }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    const barWidth = width / waveformData.length;
    const progress = currentTime / duration;

    waveformData.forEach((amplitude, index) => {
      const barHeight = (amplitude * height) / 2;
      const x = index * barWidth;
      const isPlayed = index / waveformData.length <= progress;

      // Gradient for played/unplayed sections
      ctx.fillStyle = isPlayed
        ? "#3B82F6" // Blue for played
        : "#4B5563"; // Gray for unplayed

      // Draw waveform bar
      ctx.fillRect(x, (height - barHeight) / 2, barWidth - 1, barHeight);

      // Highlight peaks
      if (peaks.includes(index)) {
        ctx.fillStyle = isPlayed ? "#F59E0B" : "#6B7280";
        ctx.fillRect(x, (height - barHeight) / 2 - 2, barWidth - 1, 2);
      }
    });

    // Draw progress line
    const progressX = progress * width;
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, height);
    ctx.stroke();
  }, [waveformData, peaks, isPlaying, currentTime, duration]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={120}
      className="w-full h-20 bg-gray-900/50 rounded border border-gray-700/50"
    />
  );
};

export const AudioWaveformResponse: React.FC<{
  response: AudioWaveformResponseData;
}> = ({ response }) => {
  const { data } = response;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  const getSourceIcon = () => {
    switch (data.source) {
      case "elevenlabs":
        return <Zap className="w-4 h-4 text-purple-400" />;
      case "user_upload":
        return <Download className="w-4 h-4 text-blue-400" />;
      case "live_recording":
        return <Mic className="w-4 h-4 text-red-400" />;
      default:
        return <Volume2 className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            {getSourceIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">
              {data.filename}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(data.duration)}
              </span>
              <span>{data.sampleRate / 1000}kHz</span>
              <span>{data.channels} ch</span>
              <span>{data.bitRate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
            <Share className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
            <Download className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="mb-6">
        <WaveformVisualization
          waveformData={data.waveformData}
          peaks={data.peaks}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={data.duration}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(data.duration)}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / data.duration) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-blue-500"
          />
        </div>
      </div>

      {/* Audio Analysis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">RMS Energy</div>
          <div
            className={`font-semibold ${getQualityColor(data.analysis.rmsEnergy)}`}
          >
            {(data.analysis.rmsEnergy * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">SNR</div>
          <div
            className={`font-semibold ${getQualityColor(data.analysis.snrDb / 40)}`}
          >
            {data.analysis.snrDb.toFixed(1)} dB
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Dynamic Range</div>
          <div
            className={`font-semibold ${getQualityColor(data.analysis.dynamicRange / 30)}`}
          >
            {data.analysis.dynamicRange.toFixed(1)} dB
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Voice Activity</div>
          <div
            className={`font-semibold ${data.analysis.voiceActivity ? "text-green-400" : "text-red-400"}`}
          >
            {data.analysis.voiceActivity ? "Detected" : "None"}
          </div>
        </div>
      </div>

      {/* Transcription */}
      {data.transcription && (
        <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-gray-300 font-medium">Transcription</h4>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{data.transcription.language}</span>
              <span>•</span>
              <span>
                {(data.transcription.confidence * 100).toFixed(1)}% confidence
              </span>
              <span>•</span>
              <span>{data.transcription.speaker}</span>
            </div>
          </div>
          <p className="text-gray-200 leading-relaxed">
            {data.transcription.text}
          </p>
        </div>
      )}

      {/* Emotion Analysis */}
      {data.analysis.emotionScore && (
        <div className="bg-gray-900/50 rounded-lg p-4">
          <h4 className="text-gray-300 font-medium mb-3">Emotion Analysis</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(data.analysis.emotionScore).map(
              ([emotion, score]) => (
                <div key={emotion} className="text-center">
                  <div className="text-xs text-gray-400 mb-1 capitalize">
                    {emotion}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-300">
                    {(score * 100).toFixed(0)}%
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioWaveformResponse;
