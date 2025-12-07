/**
 * Simple Echo Function - For Testing MCP Integration
 * 
 * Use this to verify your Inngest MCP setup is working.
 * 
 * From Claude Code, you can:
 * 1. List functions: "Show me all registered Inngest functions"
 * 2. Trigger: "Send a test/echo event with message 'Hello from Claude'"
 * 3. Monitor: "Poll the status of that run"
 */
import { inngest } from '../client';

export const echoFunction = inngest.createFunction(
  {
    id: 'test-echo',
    name: 'Test Echo Function',
  },
  { event: 'test/echo' },
  async ({ event, step }) => {
    const message = event.data.message;
    
    // Step 1: Log receipt
    const receipt = await step.run('log-receipt', async () => {
      console.log(`[Echo] Received message: ${message}`);
      return {
        receivedAt: new Date().toISOString(),
        originalMessage: message,
      };
    });

    // Step 2: Simulate some async work
    await step.sleep('think-about-it', '2s');

    // Step 3: Transform the message
    const transformed = await step.run('transform-message', async () => {
      return {
        echo: message.toUpperCase(),
        reversed: message.split('').reverse().join(''),
        length: message.length,
      };
    });

    // Step 4: Final response
    return {
      success: true,
      receipt,
      transformed,
      completedAt: new Date().toISOString(),
    };
  }
);
