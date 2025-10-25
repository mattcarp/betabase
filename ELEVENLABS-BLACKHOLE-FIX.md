# ElevenLabs BlackHole Audio Fix

**Date**: October 25, 2025
**Issue**: Microphone input stuck at 0% - BlackHole virtual audio device interference
**Status**: ✅ RESOLVED

## Problem

After installing BlackHole 2ch (virtual audio loopback), Chrome began using it as the default audio input device instead of the MacBook Air Microphone. BlackHole doesn't capture real audio - it's designed to route audio between apps, so all microphone tests showed 0% input.

## Root Cause

1. **BlackHole 2ch installed** - Virtual audio device for app-to-app audio routing
2. **Chrome cached BlackHole as default** - Browser selected wrong device
3. **Low input volume (23%)** - System microphone gain was too low
4. **ElevenLabs SDK used browser default** - No explicit device selection

## Diagnostic Steps

### 1. System Audio Check
```bash
system_profiler SPAudioDataType
# Showed BlackHole 2ch + MacBook Air Microphone

osascript -e 'get volume settings'
# Showed input volume:23 (too low!)
```

### 2. Browser Permission Check
```javascript
navigator.permissions.query({name: 'microphone'})
// Result: "granted" ✅

navigator.mediaDevices.getUserMedia({ audio: true })
// Got stream, but 0% volume - wrong device!
```

### 3. Manual Device Selection Test
Created `/app/test-mic-select/page.tsx` to manually select devices.
**Result**: MacBook Air Microphone worked perfectly at 75% input volume!

## Solution

### Fix 1: Increase System Input Volume
```bash
osascript -e 'set volume input volume 75'
# Increased from 23% → 75%
```

### Fix 2: Auto-Select Correct Microphone in Code

Updated `/src/hooks/useElevenLabsConversation.ts`:

```typescript
// NEW: Device selection helper
const getCorrectMicrophone = async (): Promise<string | null> => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audioInputs = devices.filter((d) => d.kind === "audioinput");

  // Priority: MacBook mic > Built-in mic > Non-BlackHole
  const preferredDevice =
    audioInputs.find((d) => d.label.toLowerCase().includes("macbook")) ||
    audioInputs.find((d) => d.label.toLowerCase().includes("built-in")) ||
    audioInputs.find((d) => !d.label.toLowerCase().includes("blackhole"));

  return preferredDevice?.deviceId || null;
};

// In startConversation():
const microphoneDeviceId = await getCorrectMicrophone();

if (microphoneDeviceId) {
  // Pre-request correct device to prime Chrome's cache
  const testStream = await navigator.mediaDevices.getUserMedia({
    audio: { deviceId: { exact: microphoneDeviceId } },
  });
  testStream.getTracks().forEach((track) => track.stop());
}

// ElevenLabs SDK now uses the cached device ✅
```

## Files Modified

1. `/src/hooks/useElevenLabsConversation.ts` - Device selection logic
2. `/app/test-mic/page.tsx` - Basic mic test (created)
3. `/app/test-mic-select/page.tsx` - Device selector test (created)
4. `ELEVENLABS-WEBRTC-SUCCESS.md` - Updated success documentation

## Verification

**Before Fix**:
- Input levels: **0.0%** (stuck)
- Device used: **BlackHole 2ch** (wrong)
- System volume: **23%** (too low)

**After Fix**:
- Input levels: **0.5-5%** when speaking ✅
- Device used: **MacBook Air Microphone** ✅
- System volume: **75%** ✅
- Full bidirectional conversation working ✅

## Test Pages

- `/test-mic` - Basic microphone test with volume visualization
- `/test-mic-select` - Manual device selection for troubleshooting
- `/test-elevenlabs` - Full ElevenLabs WebRTC conversation test

## Alternative Solutions

### Option A: Uninstall BlackHole
```bash
brew uninstall blackhole-2ch
```

### Option B: Set Chrome Default Device
1. Go to `chrome://settings/content/microphone`
2. Select "MacBook Air Microphone" as default
3. Restart browser

### Option C: macOS System Default (Already Done)
```bash
# MacBook Air Microphone is already the system default
system_profiler SPAudioDataType | grep "Default Input"
# Result: Default Input Device: Yes (MacBook Air Microphone)
```

## Key Learnings

1. **Virtual audio devices can hijack browser defaults** - BlackHole, Loopback, etc.
2. **Low system input volume causes 0% readings** - Need 50%+ for reliable capture
3. **ElevenLabs SDK doesn't expose device selection** - Must pre-request correct device
4. **Chrome caches last-used device for WebRTC** - Pre-requesting primes the cache
5. **macOS system default ≠ browser default** - Apps can override

## Prevention

**Before installing virtual audio devices:**
1. Note current default microphone in System Settings
2. After installation, verify browser is still using correct device
3. Test microphone in browser with `navigator.mediaDevices.getUserMedia()`
4. Set explicit device in browser settings if needed

## Related Documentation

- `ELEVENLABS-WEBRTC-SUCCESS.md` - WebSocket → WebRTC migration
- `ELEVENLABS-WEBRTC-FIX.md` - Original migration guide
- ElevenLabs SDK: https://github.com/elevenlabs/elevenlabs-js
- WebRTC: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

## Conclusion

**BlackHole virtual audio device was intercepting microphone input.** By explicitly selecting the MacBook Air Microphone and pre-requesting it before starting the ElevenLabs session, we ensured Chrome uses the correct device for WebRTC audio capture.

**Status**: Full bidirectional voice conversation now working! 🎉
