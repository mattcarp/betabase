/**
 * Inngest API Route
 * 
 * This route serves your Inngest functions to the dev server.
 * The dev server will automatically discover this endpoint.
 * 
 * Make sure your Next.js dev server is running on port 3000
 * and the Inngest dev server can reach it.
 */
import { serve } from 'inngest/next';
import {
  inngest,
  echoFunction,
  aomaCrawlOrchestrator,
  pageScraperWorker,
  documentProcessorWorker,
} from '../../../../inngest';

// Create and export the serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    echoFunction,
    aomaCrawlOrchestrator,
    pageScraperWorker,
    documentProcessorWorker,
  ],
});
