"use client";

import { useState } from "react";

export default function TestMicPage() {
  const [status, setStatus] = useState<string>("idle");
  const [volume, setVolume] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<string>("");

  const testMicrophone = async () => {
    try {
      setStatus("requesting");
      setError(null);

      console.log("🎤 Requesting microphone access...");

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      console.log("✅ Microphone access granted");
      console.log("Stream tracks:", stream.getTracks());

      // Get device info
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();
      const deviceLabel = track.label || "Unknown Device";
      const deviceId = settings.deviceId || "Unknown ID";

      setDeviceInfo(`${deviceLabel} (${deviceId.substring(0, 20)}...)`);
      console.log("🎤 Active Device:", deviceLabel);
      console.log("🎤 Device ID:", deviceId);
      console.log("🎤 Sample Rate:", settings.sampleRate);

      // List all available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === "audioinput");
      console.log("📋 Available audio input devices:");
      audioInputs.forEach((d, i) => {
        console.log(`  ${i + 1}. ${d.label || "Unknown"}`);
      });

      setStatus("active");

      // Create audio context to analyze volume
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Monitor volume
      const intervalId = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const volumePercent = (average / 255) * 100;
        setVolume(volumePercent);
        console.log(`🎤 Microphone volume: ${volumePercent.toFixed(1)}%`);
      }, 100);

      // Store cleanup
      (window as any)._testMicCleanup = () => {
        clearInterval(intervalId);
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
        setStatus("stopped");
        console.log("🛑 Microphone test stopped");
      };
    } catch (err: any) {
      console.error("❌ Microphone test failed:", err);
      setError(err.message);
      setStatus("error");
    }
  };

  const stopTest = () => {
    if ((window as any)._testMicCleanup) {
      (window as any)._testMicCleanup();
    }
  };

  return (
    <div className="min-h-screen bg-[--mac-bg-primary] p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-light text-[--mac-text-primary]">Microphone Test</h1>

        <div className="mac-card p-6 space-y-4">
          <div>
            <strong>Status:</strong>{" "}
            <span
              className={
                status === "active"
                  ? "text-green-500"
                  : status === "error"
                    ? "text-red-500"
                    : "text-[--mac-text-secondary]"
              }
            >
              {status}
            </span>
          </div>

          {error && (
            <div className="text-red-500">
              <strong>Error:</strong> {error}
            </div>
          )}

          {deviceInfo && (
            <div className="text-sm">
              <strong>Active Device:</strong>{" "}
              <span className="text-[--mac-text-secondary]">{deviceInfo}</span>
            </div>
          )}

          {status === "active" && (
            <div>
              <strong>Volume:</strong> <span className="text-green-500">{volume.toFixed(1)}%</span>
              <div className="mt-2 h-4 bg-[--mac-bg-secondary] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${Math.min(volume, 100)}%` }}
                />
              </div>
              <p className="text-sm text-[--mac-text-secondary] mt-2">
                Try speaking or making noise near your microphone
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={testMicrophone} disabled={status === "active"} className="mac-button">
              Start Microphone Test
            </button>

            {status === "active" && (
              <button onClick={stopTest} className="mac-button">
                Stop Test
              </button>
            )}
          </div>

          <div className="text-sm text-[--mac-text-secondary] space-y-2">
            <p>
              <strong>Instructions:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Start Microphone Test"</li>
              <li>Grant permission when browser prompts</li>
              <li>Speak into your microphone or make noise</li>
              <li>Watch the volume bar - it should move when you speak</li>
              <li>Check browser console for detailed logs</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
