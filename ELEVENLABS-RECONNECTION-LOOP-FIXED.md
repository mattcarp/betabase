# ElevenLabs Integration - Reconnection Loop Fixed

**Date**: October 24, 2025, 7:30 PM
**Status**: 🔧 AUTO-RECONNECT DISABLED - Ready for Root Cause Investigation

---

## What Was Fixed

### The Reconnection Loop Issue

**Problem**: The application was stuck in an infinite reconnection loop, generating ~2 signed URL requests per second.

**Root Cause**: `ConversationalAI.tsx` component hardcoded `autoReconnect: true` in THREE places:
- Line 81: `startConversation()` ref function
- Line 96: `toggleConversation()` ref function
- Line 113: `handleToggle()` button handler

**How It Worked (Bad)**:
1. WebSocket connection established
2. Something caused WebSocket to close (within 2-3 seconds)
3. `onDisconnect` handler detected disconnection
4. Because `autoReconnect: true`, automatically retried after 2 seconds
5. New signed URL requested from server
6. Cycle repeated infinitely

**Server Logs Evidence**:
```
🔐 Requesting signed URL for agent: agent_01jz1ar6k2e8tvst14g6cbgc7m
✅ Signed URL generated successfully
 POST /api/elevenlabs/conversation-token 200 in 486ms
[... repeated ~100+ times in logs ...]
```

### The Fix Applied

**Changed**: All three instances of `autoReconnect: true` → `autoReconnect: false`

**Files Modified**:
- `src/components/ConversationalAI.tsx` (lines 81, 96, 113)

**Result**:
- Reconnection loop stopped
- Connection will now fail once without retry
- This allows us to see the actual disconnect error clearly

---

## Next Steps - Finding the Real Problem

Now that auto-reconnect is disabled, we can debug the actual WebSocket disconnection issue. The reconnection loop was masking the root cause error.

### What We Know

**From Agent Configuration** (verified via ElevenLabs API):
- ✅ Agent ID correct: `agent_01jz1ar6k2e8tvst14g6cbgc7m`
- ✅ RAG enabled: `true`
- ✅ Knowledge base document connected: `mnkvIiWiCUxKK5RnQNnF` (AOMA Comprehensive Overview)
- ✅ MCP server connected: `uR5cKaU7GOZQyS04RVXP`
- ✅ AOMA-aware prompt configured correctly
- ✅ Voice settings properly configured
- ✅ Max duration: 600 seconds (10 minutes)
- ✅ Turn timeout: 7.0 seconds

**Configuration is NOT the issue**. The problem is client-side WebSocket handling.

### Possible Root Causes (Still to Investigate)

From ELEVENLABS-TESTING-STATUS.md, the most likely causes are:

1. **Bluetooth Audio Device Incompatibility**
   - Device: Matties XM5 Over-Ear (Bluetooth)
   - Theory: ElevenLabs WebRTC may not be compatible with Bluetooth input
   - **Test**: Use built-in microphone instead of Bluetooth headphones

2. **Browser Security Restrictions**
   - Theory: Safari/Chrome blocking WebRTC for security reasons
   - **Test**: Try different browser, check console for security warnings

3. **Network/Firewall Issue**
   - Theory: Corporate firewall or VPN blocking WebSocket connections
   - **Test**: Check network console for blocked requests, try different network

4. **Volume Monitoring Conflict**
   - Theory: The `getInputVolume()`/`getOutputVolume()` calls (line 144-146 in hook) might be called on a closing WebSocket
   - **Test**: Disable volume monitoring temporarily

5. **ElevenLabs SDK Issue**
   - Theory: The `@elevenlabs/react` SDK might have a bug or incompatibility
   - **Test**: Check SDK version, update if needed

---

## Debugging Instructions (For User)

### Immediate Test (Try This First)

1. **Disconnect Bluetooth headphones (Matties XM5)**
2. **Use MacBook's built-in microphone**
3. **Navigate to**: http://localhost:3000/test-elevenlabs
4. **Click "Start Conversation"**
5. **Observe the connection behavior**

**Expected Result**:
- Connection should establish once
- If it disconnects, it will NOT auto-reconnect
- Check browser console for the actual error message
- Note how long the connection stays open

### What to Report

When testing, please report:

1. **How long does the connection stay open?**
   - Less than 5 seconds?
   - 5-30 seconds?
   - Over 30 seconds?

2. **What error appears in browser console?**
   - Look for messages starting with "❌"
   - Look for "WebSocket" errors
   - Look for "MediaStream" or "getUserMedia" errors

3. **Do you see any audio levels?**
   - Input volume (user audio): X%
   - Output volume (AI audio): X%

4. **Does the microphone indicator appear?**
   - Check System Preferences → Sound → Input
   - Is the input level meter moving when you speak?

---

## Code Changes Summary

### Before (Broken - Infinite Loop)

```typescript
await startConv({
  agentId: effectiveAgentId,
  mode,
  vadSensitivity,
  interruptThreshold,
  autoReconnect: true,  // ❌ Causes infinite reconnection loop
});
```

### After (Fixed - Single Connection Attempt)

```typescript
await startConv({
  agentId: effectiveAgentId,
  mode,
  vadSensitivity,
  interruptThreshold,
  autoReconnect: false,  // ✅ Disabled to debug WebSocket disconnect issue
});
```

---

## Investigation Plan

Once we have test results with autoReconnect disabled:

### If connection stays open longer than 3 seconds:
- **Progress!** The Bluetooth device was likely the issue
- Test with Bluetooth again to confirm
- If stable with built-in mic, document Bluetooth incompatibility

### If connection still disconnects immediately:
- **Next steps**:
  1. Disable volume monitoring temporarily (comment out lines 140-154 in hook)
  2. Check browser console Network tab for WebSocket upgrade failure
  3. Try different browser (Firefox vs Safari vs Chrome)
  4. Check network firewall settings

### If connection succeeds and stays open:
- **Test AOMA knowledge**:
  1. Ask: "What is AOMA?"
  2. Ask: "What does AOMA stand for?"
  3. Ask: "Tell me about AOMA2 vs AOMA3"
  4. Verify agent responds with accurate information from knowledge base

---

## Technical Notes

### Auto-Reconnect Logic (Now Disabled)

The auto-reconnect logic in `useElevenLabsConversation.ts` (lines 116-126):

```typescript
onDisconnect: () => {
  console.log("🔌 ElevenLabs: Disconnected from conversation");
  setStatus("disconnected");
  setConversationState("idle");

  // Auto-reconnect if enabled
  if (configRef.current?.autoReconnect) {
    console.log("🔄 Auto-reconnecting...");
    setTimeout(() => reconnect(), 2000);
  }
},
```

This will no longer trigger because `autoReconnect` is now `false`.

### Re-enabling Auto-Reconnect (Future)

Once the root cause is fixed, we can make auto-reconnect **configurable** via props:

```typescript
interface ConversationalAIProps {
  // ... existing props
  enableAutoReconnect?: boolean;  // Optional, defaults to false
}
```

This allows:
- Development: `enableAutoReconnect={false}` for easier debugging
- Production: `enableAutoReconnect={true}` for better UX

But we should NOT re-enable it until we understand why the connection drops.

---

## Related Documentation

- `ELEVENLABS-TESTING-STATUS.md` - Current blocked status (pre-fix)
- `ELEVENLABS-FINAL-STATUS.md` - Working configuration (before WebSocket issues)
- `ELEVENLABS-ISSUES-TO-RESOLVE.md` - Original problem description
- `tmp/AOMA-Knowledge-Base-Overview.md` - AOMA knowledge that should be accessible

---

## Conclusion

**The reconnection loop has been eliminated**. This was a symptom, not the root cause.

**Next critical step**: User must test with:
1. Built-in microphone (not Bluetooth)
2. Auto-reconnect disabled
3. Report actual error messages from browser console

Once we have clean error output without reconnection noise, we can identify and fix the actual WebSocket disconnection issue.
