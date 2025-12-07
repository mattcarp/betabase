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
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");
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
      // Check if microphone is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error = new Error(
          "Microphone not available. Please ensure you're using a secure connection (HTTPS) and your browser supports audio recording."
        );
        options.onError?.(error);
        return;
      }

      // Request microphone permission with helpful error messages
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permissionError: any) {
        let errorMessage = "Failed to access microphone. ";

        if (
          permissionError.name === "NotAllowedError" ||
          permissionError.name === "PermissionDeniedError"
        ) {
          errorMessage +=
            "Please grant microphone permission in your browser settings and try again.";
        } else if (permissionError.name === "NotFoundError") {
          errorMessage += "No microphone found. Please connect a microphone and try again.";
        } else if (permissionError.name === "NotReadableError") {
          errorMessage += "Microphone is already in use by another application.";
        } else if (permissionError.name === "SecurityError") {
          errorMessage += "Please ensure you're using HTTPS or localhost.";
        } else {
          errorMessage += permissionError.message || "Unknown error occurred.";
        }

        const error = new Error(errorMessage);
        error.name = permissionError.name;
        options.onError?.(error);
        return;
      }

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
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscript("");
      setInterimTranscript("");
      options.onStart?.();
    } catch (error) {
      console.error("Failed to start recording:", error);
      const friendlyError = new Error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while starting recording."
      );
      options.onError?.(friendlyError);
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

  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check if permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
        setPermissionState(result.state);
        return result.state === "granted";
      }

      // Fallback: try to get a stream (will prompt if needed)
      // This is only for checking, so we immediately release it
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setPermissionState("granted");
        return true;
      } catch {
        setPermissionState("denied");
        return false;
      }
    } catch (error) {
      console.error("Failed to check microphone permission:", error);
      return false;
    }
  }, []);

  return {
    isRecording,
    transcript,
    interimTranscript,
    permissionState,
    startRecording,
    stopRecording,
    toggleRecording,
    clearTranscript,
    checkPermission,
    fullTranscript: transcript + interimTranscript,
  };
}
