# ElevenLabs Conversational AI WebSocket Integration Architecture

## Overview

This document outlines the architecture for integrating ElevenLabs Conversational AI WebSocket API into SIAM for real-time, full-duplex voice conversations with AI agents.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         ConversationalAI Component                   │  │
│  │  - Push-to-talk UI controls                          │  │
│  │  - Live transcription display                        │  │
│  │  - Speaker indicators (User/AI)                      │  │
│  │  - Audio waveform visualization                      │  │
│  │  - Interrupt detection indicators                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────┐
│                     React Hooks Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    useElevenLabsConversation (Custom Hook)           │  │
│  │  - Wraps @elevenlabs/react useConversation           │  │
│  │  - Adds interrupt detection logic                    │  │
│  │  - Implements turn-taking state machine              │  │
│  │  - Manages conversation state                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                              ↓↑                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         @elevenlabs/react SDK                        │  │
│  │  - Official ElevenLabs React hook                    │  │
│  │  - WebSocket connection management                   │  │
│  │  - Audio encoding/decoding                           │  │
│  │  - WebRTC fallback support                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────┐
│                   Audio Processing Layer                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     RealTimeAudioProcessor Service                   │  │
│  │  - Voice Activity Detection (VAD)                    │  │
│  │  - Sound Pressure Level (SPL) monitoring             │  │
│  │  - Audio feature extraction                          │  │
│  │  - Frequency analysis                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    Network/WebSocket Layer                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  wss://api.elevenlabs.io/v1/convai/conversation      │  │
│  │  - Full-duplex WebSocket connection                  │  │
│  │  - Bidirectional audio streaming                     │  │
│  │  - Event-based message protocol                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. ConversationalAI Component

**File**: `src/components/ConversationalAI.tsx`

**Responsibilities**:

- Render conversation UI
- Display live transcription
- Show speaker indicators (User vs AI)
- Visualize audio activity
- Provide push-to-talk controls
- Handle interrupt feedback

**Props**:

```typescript
interface ConversationalAIProps {
  agentId?: string;
  className?: string;
  onTranscriptionUpdate?: (transcription: string) => void;
  onConversationStateChange?: (state: ConversationState) => void;
  mode?: "push-to-talk" | "voice-activated";
}
```

### 2. useElevenLabsConversation Hook

**File**: `src/hooks/useElevenLabsConversation.ts`

**Purpose**: Custom hook that wraps the official `@elevenlabs/react` SDK and adds SIAM-specific features.

**Key Features**:

- **Interrupt Detection**: Uses VAD from `realTimeAudioProcessor` to detect when user speaks
- **Turn-Taking State Machine**: Manages conversation state (idle, user-speaking, ai-speaking, transitioning)
- **Audio Activity Monitoring**: Tracks both user and AI audio levels
- **Reconnection Logic**: Handles WebSocket disconnects and reconnects

**API**:

```typescript
interface UseElevenLabsConversationReturn {
  // Connection state
  status: ConversationStatus; // 'disconnected' | 'connecting' | 'connected' | 'interrupted'
  isConnected: boolean;

  // Conversation control
  startConversation: (config: ConversationConfig) => Promise<void>;
  stopConversation: () => Promise<void>;
  pauseConversation: () => void;
  resumeConversation: () => void;

  // Turn-taking
  conversationState: "idle" | "user-speaking" | "ai-speaking" | "transitioning";
  interruptAgent: () => void; // Manually interrupt AI

  // Transcription
  userTranscript: string;
  aiTranscript: string;

  // Audio monitoring
  userAudioLevel: number;
  aiAudioLevel: number;
  isUserSpeaking: boolean;
  isAISpeaking: boolean;

  // Error handling
  error: Error | null;
  reconnect: () => Promise<void>;
}
```

### 3. Conversation State Machine

**States**:

1. **idle**: No one is speaking, waiting for input
2. **user-speaking**: User is actively speaking (VAD detected voice)
3. **ai-speaking**: AI is generating/playing response
4. **transitioning**: Brief state between turns
5. **interrupted**: User interrupted AI mid-response

**Transitions**:

```
idle → user-speaking (VAD detects voice)
user-speaking → transitioning (VAD detects silence)
transitioning → ai-speaking (AI starts response)
ai-speaking → idle (AI finishes response)
ai-speaking → interrupted (User starts speaking)
interrupted → user-speaking (Interrupt confirmed)
```

### 4. Interrupt Handling Logic

**Detection**:

- Monitor user audio via `realTimeAudioProcessor`
- If VAD detects voice while AI is speaking → trigger interrupt
- Use audio level thresholds to prevent false positives

**Response**:

- Immediately pause AI audio playback
- Send interrupt signal to WebSocket
- Clear AI audio buffer
- Transition to `user-speaking` state
- Resume user audio input

**Implementation**:

```typescript
// In useElevenLabsConversation.ts
const handleInterruptDetection = useCallback(() => {
  if (conversationState === "ai-speaking" && audioFeatures.voiceActivity) {
    // User started speaking while AI is talking
    console.log("🚨 Interrupt detected - user speaking over AI");

    // Pause AI playback
    audioElement.current?.pause();

    // Send interrupt signal to WebSocket
    conversation.interrupt?.();

    // Update state
    setConversationState("interrupted");
    setIsUserSpeaking(true);

    // Clear AI audio buffer
    clearAudioBuffer();
  }
}, [conversationState, audioFeatures]);
```

## Audio Format Specifications

### Input Audio (User → ElevenLabs)

- **Format**: PCM (Pulse-Code Modulation)
- **Sample Rate**: 16 kHz (recommended) or 44.1 kHz
- **Bit Depth**: 16-bit
- **Channels**: Mono (1 channel)
- **Encoding**: Base64 (for WebSocket transmission)
- **Chunk Size**: 250ms recommended for optimal latency

### Output Audio (ElevenLabs → User)

- **Format**: PCM
- **Sample Rates**: 8 kHz / 16 kHz / 22.05 kHz / 24 kHz / 44.1 kHz
- **Encoding**: Base64 decoded to PCM
- **Playback**: Web Audio API AudioContext

## WebSocket Message Protocol

### Client → Server Messages

1. **Audio Input**:

```json
{
  "type": "audio",
  "audio": "<base64-encoded-pcm>",
  "timestamp": 1234567890
}
```

2. **Interrupt Signal**:

```json
{
  "type": "interrupt",
  "timestamp": 1234567890
}
```

3. **Context Update** (non-interrupting):

```json
{
  "type": "context",
  "data": {
    "key": "value"
  }
}
```

### Server → Client Messages

1. **User Transcript**:

```json
{
  "type": "user_transcript",
  "text": "transcribed text",
  "isFinal": true
}
```

2. **Agent Response (Text)**:

```json
{
  "type": "agent_response",
  "text": "agent response text"
}
```

3. **Agent Audio**:

```json
{
  "type": "audio",
  "audio": "<base64-encoded-pcm>",
  "timestamp": 1234567890
}
```

4. **Conversation Metadata**:

```json
{
  "type": "conversation_initiation_metadata",
  "conversationId": "conv_123",
  "agentId": "agent_123"
}
```

## Security Considerations

### API Key Management

- **Never expose API key in client code**
- Use server-side endpoint to generate signed URLs
- Signed URLs are time-limited and conversation-specific

### Authentication Flow

```
Client → Server: Request conversation token
Server → ElevenLabs: Get signed URL with API key
ElevenLabs → Server: Return signed URL
Server → Client: Return signed URL
Client → WebSocket: Connect with signed URL
```

**Implementation**:

```typescript
// app/api/elevenlabs/conversation-token/route.ts
export async function POST(req: Request) {
  const { agentId } = await req.json();

  // Server-side only - API key never exposed
  const apiKey = process.env.ELEVENLABS_API_KEY;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    {
      headers: { "xi-api-key": apiKey },
    }
  );

  const { signed_url } = await response.json();

  return Response.json({ signedUrl: signed_url });
}
```

## Environment Variables

```env
# ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_01jz1ar6k2e8tvst14g6cbgc7m
ELEVENLABS_API_KEY=sk_3bdf311f445bb15d57306a7171b31c7257faf5acd69322df

# Audio Configuration
NEXT_PUBLIC_AUDIO_SAMPLE_RATE=16000
NEXT_PUBLIC_VAD_SENSITIVITY=0.5
NEXT_PUBLIC_INTERRUPT_THRESHOLD=0.02
```

## Testing Strategy

### Unit Tests

- Hook state transitions
- Interrupt detection logic
- Audio encoding/decoding
- Error handling

### Integration Tests

```typescript
// tests/elevenlabs-websocket-integration.spec.ts
test("should establish WebSocket connection", async () => {
  const { result } = renderHook(() => useElevenLabsConversation());

  await act(async () => {
    await result.current.startConversation({ agentId: TEST_AGENT_ID });
  });

  expect(result.current.isConnected).toBe(true);
  expect(result.current.status).toBe("connected");
});

test("should detect user interrupt during AI speech", async () => {
  // Simulate AI speaking
  // Trigger VAD with user audio
  // Verify interrupt signal sent
  // Verify state transition to 'interrupted'
});
```

### E2E Tests

- Full conversation flow
- Interrupt handling
- Reconnection scenarios
- Cross-browser compatibility

## Performance Optimization

### Audio Buffering

- Use ring buffer for smooth playback
- Pre-buffer 500ms of audio
- Handle network jitter

### Latency Reduction

- Send audio chunks every 250ms
- Use WebRTC fallback for lower latency
- Monitor round-trip time with ping/pong

### Resource Management

- Clean up audio contexts on unmount
- Release microphone when not in use
- Implement connection pooling

## Browser Compatibility

### Required Features

- WebSocket API
- Web Audio API
- MediaDevices API (getUserMedia)
- AudioContext

### Fallback Strategy

- Detect feature support
- Graceful degradation
- Inform user of limitations

## Deployment Checklist

- [ ] Install `@elevenlabs/react` package
- [ ] Configure environment variables
- [ ] Implement server-side signed URL endpoint
- [ ] Create `useElevenLabsConversation` hook
- [ ] Update `ConversationalAI` component
- [ ] Add interrupt detection logic
- [ ] Implement turn-taking state machine
- [ ] Add audio visualizations
- [ ] Write comprehensive tests
- [ ] Test cross-browser compatibility
- [ ] Document API usage
- [ ] Monitor WebSocket performance

## Future Enhancements

1. **Multi-agent support**: Switch between different AI agents
2. **Conversation history**: Store and replay past conversations
3. **Custom voices**: Allow user to select AI voice
4. **Sentiment analysis**: Detect user emotion from voice
5. **Multi-language support**: Support conversations in multiple languages
6. **Mobile optimization**: Optimize for mobile browsers
7. **Offline mode**: Queue messages when offline

---

**Created**: 2025-10-22
**Task**: #86 - ElevenLabs Conversational AI WebSocket Integration
**Status**: In Progress
