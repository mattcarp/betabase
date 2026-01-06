
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AiSdkChatPanel } from '../src/components/ai/ai-sdk-chat-panel';
import * as XYFlow from '@xyflow/react';

describe('Runtime Check', () => {
  it('should import external libs correctly', () => {
    console.log('XYFlow keys:', Object.keys(XYFlow));
    expect(XYFlow).toBeDefined();
    // Check specific exports used in AiSdkChatPanel
    expect(XYFlow.ReactFlowProvider).toBeDefined();
  });

  it('should construct AiSdkChatPanel', () => {
    // We just instantiate the element, not render fully if it relies on context
    const element = <AiSdkChatPanel />;
    expect(element).toBeDefined();
    // If we dare, render it. It will fail due to missing Contexts probably.
    try {
        renderToStaticMarkup(element); 
    } catch (e: any) {
        console.log('Render failed as expected (missing context/env), but checking message:', e.message);
        // If message is "Cannot read properties of undefined (reading 'call')", we reproduced it!
        if (e.message.includes("reading 'call'") || e.message.includes("undefined is not a function")) {
            throw new Error("REPRODUCED: " + e.message);
        }
    }
  });
});
