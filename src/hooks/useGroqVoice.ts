"use client";

import { useState, useCallback, useRef } from "react";

interface UseGroqVoiceReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  resetTranscript: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

/**
 * Convert AudioBuffer to WAV format
 * WAV is more universally supported by transcription APIs
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, bufferLength - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  // Write audio data
  const channelData: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channelData.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export function useGroqVoice(): UseGroqVoiceReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try to use a format that Groq supports well
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : undefined;

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      console.log("[useGroqVoice] Recording with mimeType:", mediaRecorder.mimeType);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Request data every 100ms for better quality
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Could not access microphone");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        setIsRecording(false);
        setIsTranscribing(true);
        
        // Stop all tracks to release microphone
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

        try {
          // Use the actual mimeType from the recorder
          const actualMimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
          const webmBlob = new Blob(chunksRef.current, { type: actualMimeType });

          console.log("[useGroqVoice] Original blob:", {
            size: webmBlob.size,
            type: webmBlob.type,
          });

          // Convert webm to WAV for better Groq compatibility
          let audioBlob: Blob;
          let filename: string;

          try {
            // Create AudioContext to decode the webm (local variable - no need for ref)
            const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

            const arrayBuffer = await webmBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Convert to WAV
            audioBlob = audioBufferToWav(audioBuffer);
            filename = "recording.wav";

            console.log("[useGroqVoice] Converted to WAV:", {
              size: audioBlob.size,
              type: audioBlob.type,
            });

            // Clean up
            await audioContext.close();
          } catch (conversionError) {
            console.warn("[useGroqVoice] WAV conversion failed, using original format:", conversionError);
            audioBlob = webmBlob;
            filename = "recording.webm";
          }

          const formData = new FormData();
          formData.append("file", audioBlob, filename);

          console.log("[useGroqVoice] Sending to Groq API...");

          const response = await fetch("/api/groq/transcribe", {
            method: "POST",
            body: formData,
          });

          console.log("[useGroqVoice] Groq API response status:", response.status);

          const data = await response.json();
          console.log("[useGroqVoice] Groq API response data:", data);

          if (!response.ok) {
            const errorMessage = data.error || `Transcription failed (${response.status})`;
            console.error("[useGroqVoice] Transcription error:", errorMessage);
            throw new Error(errorMessage);
          }

          if (data.text) {
            setTranscript(data.text);
          }
        } catch (err) {
          console.error("[useGroqVoice] Transcription error:", err);
          const message = err instanceof Error ? err.message : "Failed to transcribe audio";
          setError(message);
        } finally {
          setIsTranscribing(false);
          resolve();
        }
      };

      mediaRecorderRef.current!.stop();
    });
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis not supported");
      return;
    }

    // Cancel any current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find a good voice
    const voices = window.speechSynthesis.getVoices();
    // Prefer Google US English, or any US English, or default
    const preferredVoice = voices.find(v => v.name.includes("Google US English")) || 
                           voices.find(v => v.lang === "en-US") ||
                           voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
    speak,
    stopSpeaking,
    isSpeaking
  };
}
