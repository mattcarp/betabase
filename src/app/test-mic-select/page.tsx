"use client";

import { useState, useEffect } from "react";

export default function TestMicSelectPage() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [status, setStatus] = useState<string>("idle");
  const [volume, setVolume] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // List all available microphones
    navigator.mediaDevices
      .enumerateDevices()
      .then((allDevices) => {
        const audioInputs = allDevices.filter((d) => d.kind === "audioinput");
        setDevices(audioInputs);
        console.log("📋 Available microphones:", audioInputs);

        // Auto-select MacBook mic if available
        const macbookMic = audioInputs.find((d) => d.label.toLowerCase().includes("macbook"));
        if (macbookMic) {
          setSelectedDevice(macbookMic.deviceId);
          console.log("✅ Auto-selected:", macbookMic.label);
        }
      })
      .catch((err) => console.error("Failed to list devices:", err));
  }, []);

  const testMicrophone = async () => {
    try {
      setStatus("requesting");
      setError(null);

      console.log("🎤 Requesting device:", selectedDevice);

      // Request specific microphone
      const constraints = selectedDevice
        ? { audio: { deviceId: { exact: selectedDevice } } }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const track = stream.getAudioTracks()[0];
      console.log("✅ Using device:", track.label);

      setStatus("active");

      // Monitor volume
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const intervalId = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const volumePercent = (average / 255) * 100;
        setVolume(volumePercent);

        if (volumePercent > 0.1) {
          console.log(`🎤 Volume: ${volumePercent.toFixed(1)}%`);
        }
      }, 100);

      // Store cleanup
      (window as any)._testMicCleanup = () => {
        clearInterval(intervalId);
        stream.getTracks().forEach((track) => track.stop());
        audioContext.close();
        setStatus("stopped");
        console.log("🛑 Stopped");
      };
    } catch (err: any) {
      console.error("❌ Failed:", err);
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
        <h1 className="mac-heading text-3xl font-light text-[--mac-text-primary]">
          Microphone Device Selector
        </h1>

        <div className="mac-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-normal mb-2">Select Microphone Device:</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full mac-input"
              disabled={status === "active"}
            >
              <option value="">Default Device</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Device ${device.deviceId.substring(0, 10)}`}
                </option>
              ))}
            </select>
          </div>

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

          {status === "active" && (
            <div>
              <strong>Volume:</strong>{" "}
              <span className={volume > 1 ? "text-green-500" : "text-yellow-500"}>
                {volume.toFixed(1)}%
              </span>
              <div className="mt-2 h-4 bg-[--mac-bg-secondary] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    volume > 1 ? "bg-green-500" : "bg-yellow-500"
                  }`}
                  style={{ width: `${Math.min(volume, 100)}%` }}
                />
              </div>
              <p className="text-sm text-[--mac-text-secondary] mt-2">
                Speak into your microphone - the bar should move!
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={testMicrophone} disabled={status === "active"} className="mac-button">
              Test Selected Device
            </button>

            {status === "active" && (
              <button onClick={stopTest} className="mac-button">
                Stop Test
              </button>
            )}
          </div>

          <div className="text-sm text-[--mac-text-secondary] space-y-2">
            <p>
              <strong>Troubleshooting:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Select "MacBook Air Microphone"</strong> (NOT BlackHole!)
              </li>
              <li>BlackHole is a virtual loopback - it won't capture your voice</li>
              <li>If volume is still 0%, check System Settings → Sound → Input</li>
              <li>Make sure input volume is at 75% or higher</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
