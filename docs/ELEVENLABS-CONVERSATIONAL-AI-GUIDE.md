# ElevenLabs Conversational AI Integration Guide

## Overview

SIAM now includes full integration with ElevenLabs Conversational AI, enabling real-time, full-duplex voice conversations with AI agents.

## Features

### Core Capabilities

✅ **Full-Duplex Communication**: Simultaneous send/receive audio streaming
✅ **Interrupt Handling**: Users can interrupt the AI mid-response
✅ **Turn-Taking Logic**: Intelligent conversation state management
✅ **Voice Activity Detection (VAD)**: Automatic speech detection
✅ **Live Transcription**: Real-time display of user and AI speech
✅ **Audio Visualization**: Visual feedback of audio levels
✅ **Multiple Modes**: Push-to-talk and voice-activated options
✅ **Auto-Reconnection**: Automatic recovery from disconnects
✅ **Secure Authentication**: Server-side API key management

### UI Features

- **Connection Status**: Visual indicator of WebSocket connection state
- **Conversation State**: Shows who is speaking (User/AI/Idle/Interrupted)
- **Audio Levels**: Real-time user and AI audio level indicators
- **Live Transcription**: Separate displays for user speech and AI responses
- **Interrupt Button**: Manual interrupt when AI is speaking
- **Mode Selection**: Choose between push-to-talk and voice-activated
- **Error Handling**: Clear error messages and recovery options
- **Debug Info**: Development mode shows detailed audio metrics

## Quick Start

### Prerequisites

1. **ElevenLabs Account**: Sign up at [elevenlabs.io](https://elevenlabs.io)
2. **Conversational AI Agent**: Create an agent in the ElevenLabs dashboard
3. **API Key**: Get your API key from account settings
4. **Agent ID**: Note your agent ID from the agent configuration

### Environment Setup

Add to `.env.local`:

```env
# Server-side (NEVER expose in client code)
ELEVENLABS_API_KEY=sk_your_api_key_here

# Client-side (public)
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_your_agent_id_here
```

### Basic Usage

```typescript
import ConversationalAI from "@/components/ConversationalAI";

function MyComponent() {
  const handleTranscriptionUpdate = (text: string) => {
    console.log("User said:", text);
  };

  const handleStateChange = (state: ConversationState) => {
    console.log("Conversation state:", state);
  };

  return (
    <ConversationalAI
      mode="push-to-talk"
      onTranscriptionUpdate={handleTranscriptionUpdate}
      onConversationStateChange={handleStateChange}
    />
  );
}
```

### Advanced Usage with Ref

```typescript
import { useRef } from "react";
import ConversationalAI from "@/components/ConversationalAI";
import type { ConversationalAIRef } from "@/components/ConversationalAI";

function MyComponent() {
  const conversationRef = useRef<ConversationalAIRef>(null);

  const startConversation = async () => {
    await conversationRef.current?.startConversation();
  };

  const stopConversation = async () => {
    await conversationRef.current?.stopConversation();
  };

  const interruptAI = () => {
    conversationRef.current?.interruptAgent();
  };

  return (
    <>
      <ConversationalAI ref={conversationRef} mode="voice-activated" />

      <button onClick={startConversation}>Start</button>
      <button onClick={stopConversation}>Stop</button>
      <button onClick={interruptAI}>Interrupt</button>
    </>
  );
}
```

## Component API

### Props

#### `agentId` (optional)
- **Type**: `string`
- **Default**: `process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID`
- **Description**: The ElevenLabs agent ID to connect to

#### `className` (optional)
- **Type**: `string`
- **Default**: `""`
- **Description**: Additional CSS classes for the component

#### `onTranscriptionUpdate` (optional)
- **Type**: `(text: string) => void`
- **Description**: Callback when user transcription updates

#### `onConversationStateChange` (optional)
- **Type**: `(state: ConversationState) => void`
- **Description**: Callback when conversation state changes
- **States**: `'idle' | 'user-speaking' | 'ai-speaking' | 'transitioning' | 'interrupted'`

#### `mode` (optional)
- **Type**: `'push-to-talk' | 'voice-activated'`
- **Default**: `'push-to-talk'`
- **Description**: Conversation mode
  - **push-to-talk**: Click button to start/stop
  - **voice-activated**: Automatic speech detection

#### `vadSensitivity` (optional)
- **Type**: `number` (0-1)
- **Default**: `0.5`
- **Description**: Voice Activity Detection sensitivity (voice-activated mode only)
  - Lower = more sensitive (triggers easier)
  - Higher = less sensitive (requires louder voice)

#### `interruptThreshold` (optional)
- **Type**: `number`
- **Default**: `0.02`
- **Description**: Audio level threshold for interrupt detection
  - Higher = requires louder voice to interrupt
  - Lower = easier to interrupt

### Ref Methods

#### `startConversation()`
- **Returns**: `Promise<void>`
- **Description**: Start the conversation

#### `stopConversation()`
- **Returns**: `Promise<void>`
- **Description**: Stop the conversation

#### `toggleConversation()`
- **Returns**: `Promise<void>`
- **Description**: Toggle conversation on/off

#### `interruptAgent()`
- **Returns**: `void`
- **Description**: Manually interrupt the AI agent

## Conversation Modes

### Push-to-Talk Mode

**Best for**: Controlled conversations, noisy environments

```typescript
<ConversationalAI mode="push-to-talk" />
```

**How it works**:
1. Click "Start Conversation" to connect
2. Click "Stop Conversation" to disconnect
3. User controls when to speak

**Pros**:
- No false triggers from background noise
- Clear start/stop control
- Lower resource usage

**Cons**:
- Less natural conversation flow
- Requires manual control

### Voice-Activated Mode

**Best for**: Natural conversations, hands-free operation

```typescript
<ConversationalAI
  mode="voice-activated"
  vadSensitivity={0.5}
  interruptThreshold={0.02}
/>
```

**How it works**:
1. Click "Start Conversation" to connect
2. AI automatically detects when you speak (VAD)
3. AI automatically stops when you're silent
4. Can interrupt AI by speaking while it talks

**Pros**:
- Natural, hands-free conversation
- Automatic turn-taking
- Can interrupt AI naturally

**Cons**:
- May trigger from background noise
- Requires careful sensitivity tuning
- Higher resource usage

## Conversation States

The component manages conversation state with a state machine:

### States

1. **`idle`**
   - No one is speaking
   - Waiting for input
   - Display: Gray indicator

2. **`user-speaking`**
   - User is actively speaking
   - VAD detected voice activity
   - Display: Blue indicator with mic icon

3. **`ai-speaking`**
   - AI is generating/playing response
   - Display: Green indicator with radio icon
   - Interrupt button visible

4. **`transitioning`**
   - Brief state between turns
   - Switching from user to AI or vice versa
   - Display: Yellow indicator

5. **`interrupted`**
   - User interrupted AI mid-response
   - AI playback paused
   - Display: Orange indicator with alert icon

### State Transitions

```
idle → user-speaking (VAD detects voice)
user-speaking → transitioning (VAD detects silence)
transitioning → ai-speaking (AI starts response)
ai-speaking → idle (AI finishes response)
ai-speaking → interrupted (User starts speaking)
interrupted → user-speaking (Interrupt confirmed)
```

## Interrupt Handling

### Automatic Interrupts (Voice-Activated Mode)

The system automatically detects when the user speaks while the AI is talking:

1. **Detection**: VAD monitors user audio while AI speaks
2. **Threshold**: Audio level must exceed `interruptThreshold`
3. **Action**: AI playback pauses immediately
4. **State**: Changes to `interrupted` → `user-speaking`
5. **Resume**: User speech is processed normally

### Manual Interrupts (All Modes)

Click the "Interrupt" button when AI is speaking:

```typescript
conversationRef.current?.interruptAgent();
```

### Tuning Interrupt Sensitivity

```typescript
<ConversationalAI
  mode="voice-activated"
  interruptThreshold={0.02}  // Adjust this value
  vadSensitivity={0.5}
/>
```

**interruptThreshold values**:
- `0.01`: Very sensitive - easy to interrupt
- `0.02`: Default - balanced
- `0.05`: Less sensitive - requires louder voice
- `0.10`: Very insensitive - hard to interrupt

## Audio Configuration

### Sample Rate

The default sample rate is 16 kHz, which is optimal for voice:

```typescript
// In src/services/realTimeAudioProcessor.ts
config: {
  sampleRate: 16000,  // 16 kHz for voice
  fftSize: 2048,
  // ...
}
```

### VAD (Voice Activity Detection)

VAD uses multiple audio features to detect speech:

- **Energy**: RMS (Root Mean Square) level
- **Spectral Centroid**: Frequency distribution
- **Zero-Crossing Rate**: Signal changes
- **Rolling Averages**: Smoothed over time

### Audio Quality Monitoring

The system provides real-time audio quality metrics:

```typescript
audioMetrics: {
  audioQuality: number;        // 0-100 score
  signalToNoiseRatio: number;  // dB
  clippingDetected: boolean;   // Distortion detection
  vadConfidence: number;       // 0-1 VAD confidence
}
```

## Security

### API Key Management

**CRITICAL**: Never expose your ElevenLabs API key in client code!

✅ **Correct** (Server-Side):
```env
ELEVENLABS_API_KEY=sk_your_key_here
```

```typescript
// app/api/elevenlabs/conversation-token/route.ts
import { getElevenLabsApiKey } from "@/config/apiKeys";

export async function POST(request: NextRequest) {
  const apiKey = getElevenLabsApiKey(); // Server-side only
  // ...
}
```

❌ **WRONG** (Client-Side):
```env
NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_your_key_here  # NEVER DO THIS!
```

### Signed URLs

The component uses server-side signed URLs for authentication:

1. **Client** requests conversation token from `/api/elevenlabs/conversation-token`
2. **Server** uses API key to get signed URL from ElevenLabs
3. **Server** returns signed URL to client
4. **Client** uses signed URL to connect to WebSocket

This ensures the API key is never exposed to the browser.

### Permissions

The component requires microphone access:

```typescript
// Browser will prompt for permission
await navigator.mediaDevices.getUserMedia({ audio: true });
```

Handle permission denials gracefully:

```typescript
<ConversationalAI
  onConversationStateChange={(state) => {
    if (error?.message.includes("permission")) {
      alert("Please grant microphone access to use voice chat");
    }
  }}
/>
```

## Troubleshooting

### Connection Issues

**Problem**: "Failed to get conversation token"

**Solutions**:
1. Check `ELEVENLABS_API_KEY` is set in `.env.local`
2. Verify API key is valid in ElevenLabs dashboard
3. Check server logs for detailed error

**Problem**: "Agent ID is required"

**Solutions**:
1. Set `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` in `.env.local`
2. Pass `agentId` prop to component
3. Create an agent in ElevenLabs dashboard if you don't have one

### Audio Issues

**Problem**: No audio / VAD not detecting voice

**Solutions**:
1. Check microphone permissions in browser
2. Verify microphone is working in system settings
3. Lower `vadSensitivity` for easier detection
4. Check audio levels in debug info

**Problem**: Too many false triggers (voice-activated mode)

**Solutions**:
1. Increase `vadSensitivity` value
2. Use push-to-talk mode instead
3. Move to quieter environment

### Interrupt Issues

**Problem**: Can't interrupt AI

**Solutions**:
1. Use voice-activated mode (not push-to-talk)
2. Lower `interruptThreshold` value
3. Speak louder to exceed threshold
4. Use manual interrupt button

### Browser Compatibility

**Supported Browsers**:
- ✅ Chrome 89+
- ✅ Edge 89+
- ✅ Firefox 90+
- ✅ Safari 15+

**Required Features**:
- WebSocket API
- Web Audio API
- MediaDevices getUserMedia
- AudioContext

**Check Support**:
```javascript
const supported =
  'WebSocket' in window &&
  'AudioContext' in window &&
  'mediaDevices' in navigator;
```

## Performance Optimization

### Reducing Latency

1. **Use WebRTC**: ElevenLabs SDK automatically uses WebRTC when available
2. **Optimize Audio Chunks**: 250ms chunks are optimal
3. **Server Location**: Use geo-distributed servers
4. **Network**: Use wired connection if possible

### Resource Management

```typescript
// Clean up on unmount
useEffect(() => {
  return () => {
    conversationRef.current?.stopConversation();
  };
}, []);
```

### Memory Leaks Prevention

The hook automatically cleans up:
- Audio contexts
- WebSocket connections
- Audio processors
- Event listeners

## Testing

### Manual Testing

1. **Basic Connection**:
   - Click "Start Conversation"
   - Verify "Connected" status
   - Check console for errors

2. **User Speech**:
   - Speak into microphone
   - Verify transcription appears
   - Check audio level indicator

3. **AI Response**:
   - Wait for AI response
   - Verify AI transcription appears
   - Check audio playback

4. **Interrupts**:
   - Wait for AI to speak
   - Click "Interrupt" or speak over AI
   - Verify immediate pause

### Automated Testing

```bash
# Run integration tests
npm run test:e2e tests/elevenlabs-conversation-integration.spec.ts

# Run with specific browser
npx playwright test tests/elevenlabs-conversation-integration.spec.ts --project=chromium
```

### Test with Mock Agent

```typescript
// For development/testing without real API
<ConversationalAI
  agentId="test-agent-id"
  onConversationStateChange={(state) => {
    console.log("Test state:", state);
  }}
/>
```

## Examples

### Complete Integration Example

```typescript
"use client";

import { useRef, useState } from "react";
import ConversationalAI from "@/components/ConversationalAI";
import type { ConversationalAIRef } from "@/components/ConversationalAI";
import type { ConversationState } from "@/hooks/useElevenLabsConversation";

export default function VoiceChatPage() {
  const conversationRef = useRef<ConversationalAIRef>(null);
  const [mode, setMode] = useState<"push-to-talk" | "voice-activated">(
    "push-to-talk",
  );
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [currentState, setCurrentState] = useState<ConversationState>("idle");

  const handleTranscription = (text: string) => {
    setTranscripts((prev) => [...prev, `User: ${text}`]);
  };

  const handleStateChange = (state: ConversationState) => {
    setCurrentState(state);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Voice Chat with AI</h1>

      {/* Mode Toggle */}
      <div className="mb-4">
        <button
          onClick={() =>
            setMode(
              mode === "push-to-talk" ? "voice-activated" : "push-to-talk",
            )
          }
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Switch to {mode === "push-to-talk" ? "Voice-Activated" : "Push-to-Talk"}
        </button>
      </div>

      {/* Conversational AI Component */}
      <ConversationalAI
        ref={conversationRef}
        mode={mode}
        vadSensitivity={0.5}
        interruptThreshold={0.02}
        onTranscriptionUpdate={handleTranscription}
        onConversationStateChange={handleStateChange}
      />

      {/* Transcript History */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Conversation History</h2>
        <div className="bg-gray-800 rounded p-4 max-h-96 overflow-y-auto">
          {transcripts.map((transcript, i) => (
            <p key={i} className="text-sm text-gray-300 mb-1">
              {transcript}
            </p>
          ))}
        </div>
      </div>

      {/* Current State Display */}
      <div className="mt-4 text-sm text-gray-400">
        Current State: <span className="font-medium">{currentState}</span>
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Always Handle Permissions

```typescript
try {
  await conversationRef.current?.startConversation();
} catch (error) {
  if (error.message.includes("permission")) {
    alert("Please grant microphone access");
  }
}
```

### 2. Clean Up on Unmount

```typescript
useEffect(() => {
  return () => {
    conversationRef.current?.stopConversation();
  };
}, []);
```

### 3. Monitor Conversation State

```typescript
const handleStateChange = (state: ConversationState) => {
  if (state === "error") {
    // Handle error
  } else if (state === "interrupted") {
    // User interrupted AI
  }
};
```

### 4. Tune for Your Use Case

- **Customer support**: Higher `interruptThreshold` (less interrupts)
- **Casual conversation**: Lower `interruptThreshold` (more natural)
- **Noisy environment**: Push-to-talk mode
- **Hands-free**: Voice-activated mode

### 5. Provide Visual Feedback

Always show:
- Connection status
- Who is speaking
- Audio levels
- Transcriptions

### 6. Handle Network Issues

```typescript
<ConversationalAI
  onConversationStateChange={(state) => {
    if (state === "disconnected") {
      // Show reconnection UI
    }
  }}
/>
```

## Further Reading

- [ElevenLabs Conversational AI Docs](https://elevenlabs.io/docs/conversational-ai/overview)
- [WebSocket Integration Guide](https://elevenlabs.io/docs/conversational-ai/api-reference/websocket)
- [React SDK Documentation](https://elevenlabs.io/docs/conversational-ai/libraries/react)
- [Architecture Documentation](./elevenlabs-websocket-architecture.md)

## Support

For issues or questions:
1. Check this guide and architecture docs
2. Review error messages in browser console
3. Test with minimal configuration
4. Check ElevenLabs service status
5. Open an issue on GitHub

---

**Version**: 1.0.0
**Last Updated**: 2025-10-22
**Task**: #86 - ElevenLabs Conversational AI WebSocket Integration
