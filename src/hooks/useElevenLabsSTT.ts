"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseElevenLabsSTTOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
  language?: string;
  continuous?: boolean;
}

export function useElevenLabsSTT(options: UseElevenLabsSTTOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Initialize Web Speech API for real-time transcription
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = options.continuous ?? false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = options.language || "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) {
          setTranscript((prev) => prev + final);
          options.onTranscript?.(final, true);
        }
        
        setInterimTranscript(interim);
        if (interim) {
          options.onTranscript?.(interim, false);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        // Suppress network errors in development (happens on HTTP)
        if (event.error === "network") {
          // Silently ignore - this is expected on localhost without HTTPS
          return;
        }
        
        // Log and handle other errors
        console.error("Speech recognition error:", event.error);
        options.onError?.(new Error(`Speech recognition error: ${event.error}`));
        
        if (event.error === "not-allowed") {
          options.onError?.(new Error("Microphone permission denied"));
        }
      };

      recognitionRef.current.onend = () => {
        if (isRecording && options.continuous) {
          // Restart if continuous mode
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.error("Failed to restart recognition:", e);
          }
        }
      };
    } else {
      console.warn("Web Speech API not supported, falling back to ElevenLabs API");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [options, isRecording]);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start Web Speech API recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Failed to start recognition:", e);
        }
      }

      // Also set up MediaRecorder for potential server-side processing
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        
        // Here we could send to ElevenLabs API for server-side transcription
        // For now, we rely on Web Speech API
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscript("");
      setInterimTranscript("");
      options.onStart?.();
    } catch (error) {
      console.error("Failed to start recording:", error);
      options.onError?.(error as Error);
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Failed to stop recognition:", e);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    options.onEnd?.();
  }, [options]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
    isRecording,
    transcript,
    interimTranscript,
    startRecording,
    stopRecording,
    toggleRecording,
    clearTranscript,
    fullTranscript: transcript + interimTranscript,
  };
}