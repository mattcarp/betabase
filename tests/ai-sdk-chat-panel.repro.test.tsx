
// import { render } from '@testing-library/react'; // Not available
import { AiSdkChatPanel } from '../src/components/ai/ai-sdk-chat-panel';
import { describe, it } from 'vitest';

describe('AiSdkChatPanel', () => {
  it('imports without crashing', () => {
    // Just importing the module should trigger top-level errors
    console.log('AiSdkChatPanel imported successfully:', !!AiSdkChatPanel);
  });
});
