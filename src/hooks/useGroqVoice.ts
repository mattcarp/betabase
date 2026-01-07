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
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
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
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");

          const response = await fetch("/api/groq/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Transcription failed");
          }

          const data = await response.json();
          if (data.text) {
            setTranscript(data.text);
          }
        } catch (err) {
          console.error("Transcription error:", err);
          setError("Failed to transcribe audio");
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
