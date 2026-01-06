
// import { render } from '@testing-library/react';
import { ChatPage } from '../src/components/ui/pages/ChatPage';
import { describe, it } from 'vitest';

describe('ChatPage', () => {
  it('imports without crashing', () => {
    console.log('ChatPage imported successfully:', !!ChatPage);
  });
});
