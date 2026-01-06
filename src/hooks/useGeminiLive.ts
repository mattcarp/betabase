import { useState, useEffect, useRef, useCallback } from "react";
// @ts-ignore - types might not be ready immediately after install
// import { GoogleGenAI, Modality } from "@google/genai"; // Static import removed to prevent SSR/Bundling issues

// Audio configuration
const AUDIO_CONFIG = {
  sampleRate: 24000, // Gemini Live preferred output
  inputSampleRate: 16000,
  channels: 1,
};

export interface UseGeminiLiveOptions {
  apiKey?: string;
  model?: string;
  systemInstruction?: string;
  voiceName?: string;
  onConnectionStatusChange?: (status: "connected" | "disconnected" | "error") => void;
  onError?: (error: Error) => void;
}

export function useGeminiLive({
  apiKey, // Should be an ephemeral token for production safety
  model = "gemini-2.5-flash-native-audio-preview-12-2025",
  systemInstruction = "You are a helpful AI assistant.",
  voiceName = "Aoede", // Example voice
  onConnectionStatusChange,
  onError,
}: UseGeminiLiveOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null); // TODO: Limit use or migrate to AudioWorklet
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null);

  // Audio queue for playback
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  // Initialize Gemini API
  const connect = useCallback(async () => {
    console.log("🔌 Live: Attempting to connect...");
    let currentKey = apiKey;

    if (!currentKey) {
        try {
            console.log("🔌 Live: Fetching credentials...");
            const res = await fetch('/api/gemini/credentials');
            if (res.ok) {
                const data = await res.json();
                if (data.apiKey) {
                    currentKey = data.apiKey;
                    console.log("🔌 Live: Credentials fetched successfully.");
                }
            } else {
                console.warn("🔌 Live: Failed to fetch credentials:", res.statusText);
            }
        } catch (e) {
            console.error("🔌 Live: Error fetching credentials:", e);
        }
    }

    if (!currentKey) {
      const error = new Error("API Key is required. Set NEXT_PUBLIC_GEMINI_API_KEY in .env.local");
      console.error(error);
      onError?.(error);
      return;
    }


    try {
      console.log("🔌 Live: Importing GoogleGenAI SDK...");
      // Dynamic import to avoid SSR/bundling issues with Node-centric libraries
      const { GoogleGenAI, Modality } = await import("@google/genai");

      // Fallback for Gemini 3.0 models which might not have public Live API endpoints yet
      // We map them to the stable Gemini 2.5 Live preview model for the audio session
      let liveModel = model;
      if (model.includes("gemini-3")) {
          console.log("🔌 Live: Using Gemini 2.5 Flash Live for audio session (fallback from Gemini 3)");
          liveModel = "gemini-2.5-flash-native-audio-preview-12-2025";
      }

      const ai = new GoogleGenAI({ apiKey: currentKey });
      
      const config = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
        },
        systemInstruction,
      };

      console.log("🔌 Live: Connecting to Gemini session...", liveModel);
      // Connect to Gemini Live
      sessionRef.current = await ai.live.connect({
        model: liveModel,
        config,
        callbacks: {
          onopen: () => {
            console.log("🔌 Live: WebSocket Session Opened!");
            setIsConnected(true);
            onConnectionStatusChange?.("connected");
          },
          onmessage: async (message: any) => {
            // console.log("🔌 Live: Message received", Object.keys(message)); // Too spammy?
            
            // Handle incoming audio
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  // Decode base64 and queue
                //   console.log("🔌 Live: Received audio chunk");
                  const audioData = base64ToArrayBuffer(part.inlineData.data);
                  queueAudio(audioData);
                }
                if (part.text) {
                    console.log("🔌 Live: Received text:", part.text);
                }
              }
            }
            
             if (message.serverContent?.interrupted) {
                console.log("🔌 Live: Interrupted");
                clearAudioQueue();
             }
          },
          onerror: (err: any) => {
            console.error("🔌 Live: Session Error:", err);
            onError?.(new Error(err.message || "Unknown Gemini Live error"));
            onConnectionStatusChange?.("error");
          },
          onclose: (e: any) => {
            console.log("🔌 Live: Session Closed:", e);
            setIsConnected(false);
            onConnectionStatusChange?.("disconnected");
          },
        },
      });

    } catch (err: any) {
        console.error("🔌 Live: Connection Exception:", err);
        onError?.(err);
        onConnectionStatusChange?.("error");
    }
  }, [apiKey, model, systemInstruction, voiceName, onConnectionStatusChange, onError]);

  const disconnect = useCallback(async () => {
    console.log("🔌 Live: Disconnecting...");
    if (sessionRef.current) {
    //   await sessionRef.current.close(); // Check if close is async in SDK
      sessionRef.current = null;
    }
    stopRecording();
    setIsConnected(false);
    onConnectionStatusChange?.("disconnected");
  }, []);

  // Audio Capture
  const startRecording = useCallback(async () => {
    console.log("🎙️ Live: startRecording called");
    if (!sessionRef.current) {
        console.warn("🎙️ Live: Not connected to session, cannot start recording.");
        return;
    }

    try {
      console.log("🎙️ Live: Requesting Mic Access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: AUDIO_CONFIG.inputSampleRate,
        channelCount: 1,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true
      } });
      
      console.log("🎙️ Live: Mic Access Granted");
      mediaStreamRef.current = stream;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: AUDIO_CONFIG.inputSampleRate
        });
      }
      
      const ctx = audioContextRef.current;
      
      // Resume if suspended
      if (ctx.state === 'suspended') {
        console.log("🎙️ Live: Resuming AudioContext...");
        await ctx.resume();
      }

      sourceRef.current = ctx.createMediaStreamSource(stream);
      
      // Use ScriptProcessor for legacy browser support
      const bufferSize = 4096; 
      processorRef.current = ctx.createScriptProcessor(bufferSize, 1, 1);

      let chunkCount = 0;
      processorRef.current.onaudioprocess = (e) => {
        if (!sessionRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Simple silence detection for logging
        if (chunkCount % 50 === 0) {
            let sum = 0;
            for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
            const rms = Math.sqrt(sum / inputData.length);
            // console.log(`🎙️ Live: Audio Process Active. RMS: ${rms.toFixed(4)}`);
        }
        chunkCount++;

        // Convert float32 [-1, 1] to PCM 16-bit
        const pcmData = float32ToInt16(inputData);
        
        // Send to Gemini
        const base64Audio = arrayBufferToBase64(pcmData);
        
        try {
            sessionRef.current.sendRealtimeInput({
                audio: {
                    data: base64Audio,
                    mimeType: `audio/pcm;rate=${AUDIO_CONFIG.inputSampleRate}`
                }
            });
        } catch (e) {
            console.error("🎙️ Live: Error sending audio input:", e);
        }
      };

      sourceRef.current.connect(processorRef.current);
      // Connect to mute node to prevent feedback but keep processor running
      const muteNode = ctx.createGain();
      muteNode.gain.value = 0;
      processorRef.current.connect(muteNode);
      muteNode.connect(ctx.destination);

      setIsRecording(true);
      console.log("🎙️ Live: Recording Started (Processor connected)");

    } catch (err: any) {
      console.error("🎙️ Live: Mic Error:", err);
      onError?.(err);
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
     if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
     }
     if (processorRef.current && sourceRef.current) {
        sourceRef.current.disconnect();
        processorRef.current.disconnect();
        processorRef.current = null;
        sourceRef.current = null;
     }
     setIsRecording(false);
  }, []);

  // Audio Playback Helpers
  const queueAudio = (buffer: ArrayBuffer) => {
    audioQueueRef.current.push(buffer);
    if (!isPlayingRef.current) {
        playNextChunk();
    }
  };
  
  const clearAudioQueue = () => {
    audioQueueRef.current = [];
  };

  const playNextChunk = async () => {
    if (audioQueueRef.current.length === 0) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        return;
    }

    // If muted, just drain the queue without playing
    if (isMuted) {
        audioQueueRef.current.shift();
        // Immediately try next chunk to drain quickly
        playNextChunk();
        return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    
    const chunk = audioQueueRef.current.shift();
    if (!chunk) return;

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: AUDIO_CONFIG.inputSampleRate 
        });
    }
    
    const ctx = audioContextRef.current;
    
    // 16-bit PCM @ 24kHz (default)
    const float32Data = int16ToFloat32(new Int16Array(chunk));
    
    const audioBuffer = ctx.createBuffer(1, float32Data.length, AUDIO_CONFIG.sampleRate);
    audioBuffer.getChannelData(0).set(float32Data);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    // Scheduling
    const currentTime = ctx.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
    
    source.onended = () => {
        playNextChunk();
    };
  };

  return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    isRecording,
    isPlaying,
    isConnected,
    isMuted,
    setIsMuted
  };
}

// Utils
function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}

function int16ToFloat32(int16: Int16Array): Float32Array {
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
        const int = int16[i];
        float32[i] = int16[i] / (int16[i] < 0 ? 32768 : 32767);
    }
    return float32;
}

function base64ToArrayBuffer(base64: string) {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
