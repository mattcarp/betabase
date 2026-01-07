import { chromium } from '@playwright/test';

async function testVoice() {
  const browser = await chromium.launch({
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
    ],
  });
  const context = await browser.newContext({
    permissions: ['microphone'],
  });
  const page = await context.newPage();

  const logs: string[] = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[Page Error] ${err.message}`));

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Wait for the mic button
    // It's in ChatInput, has a Mic icon.
    // In chat-input.tsx, it has a tooltip "Start voice input"
    // and variant is "ghost" initially.
    
    // Let's look for the button by the Mic icon or tooltip
    const micButton = page.locator('button:has(.lucide-mic)');
    await micButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Mic button found.');

    // Click it to start
    console.log('Clicking Mic button...');
    await micButton.click();

    // Check for state change
    // The button should change variant to "destructive" (red) or have "animate-pulse"
    // The input placeholder might change to "Listening..."
    
    await page.waitForTimeout(1000);
    
    const isRecording = await page.evaluate(() => {
      const btn = document.querySelector('button:has(.lucide-stop-circle)'); // Icon changes to StopCircle when recording
      const input = document.querySelector('textarea');
      return {
        stopIconVisible: !!btn,
        placeholder: input?.placeholder
      };
    });

    console.log('Recording State:', isRecording);

    if (isRecording.stopIconVisible) {
      console.log('✅ Recording started successfully (UI updated).');
    } else {
      console.error('❌ Recording failed to start (UI did not update).');
    }

    // Stop recording
    if (isRecording.stopIconVisible) {
      console.log('Stopping recording...');
      await page.locator('button:has(.lucide-stop-circle)').click();
      
      // Wait for transcription API call
      // We can intercept the network request
      const response = await page.waitForResponse(resp => 
        resp.url().includes('/api/groq/transcribe') && resp.status() === 200,
        { timeout: 10000 }
      ).catch(() => null);

      if (response) {
        console.log('✅ Transcription API called successfully.');
        const data = await response.json();
        console.log('Transcription response:', data);
      } else {
        console.error('❌ Transcription API call failed or timed out.');
      }
    }

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    console.log('--- Console Logs ---');
    logs.forEach(l => console.log(l));
    await browser.close();
  }
}

testVoice();
