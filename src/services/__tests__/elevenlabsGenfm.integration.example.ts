/**
 * Example integration usage of ElevenLabs GenFM Service
 *
 * This file demonstrates how to use the service in a real application.
 * It's not meant to be run as a test, but as a reference for implementation.
 */

import {
  createElevenLabsGenfmService,
  createPodcastRequest,
  ElevenLabsGenfmError,
} from "../elevenlabsGenfm";

// Example usage of the ElevenLabs GenFM service
async function exampleUsage() {
  // Initialize the service with configuration
  const service = createElevenLabsGenfmService({
    apiKey: process.env.ELEVENLABS_GENFM_API_KEY || "your-api-key-here",
    timeout: 60000, // 60 seconds for longer operations
  });

  try {
    // 1. Validate authentication
    console.log("Validating API authentication...");
    const isValidAuth = await service.validateAuth();
    if (!isValidAuth) {
      throw new Error("Invalid API key");
    }
    console.log("✓ Authentication valid");

    // 2. Check quota before creating podcast
    console.log("Checking account quota...");
    const quota = await service.getQuota();
    console.log(`Characters remaining: ${quota.characters_remaining}/${quota.character_limit}`);

    if (quota.characters_remaining < 1000) {
      console.warn("⚠️ Low character quota remaining");
    }

    // 3. Create a podcast request
    const podcastRequest = createPodcastRequest(
      "SIAM Meeting Summary",
      "Create an engaging podcast summarizing the key insights from today's meeting about AI integration in productivity tools. Focus on the technical challenges discussed and potential solutions.",
      process.env.PODCAST_HOST_VOICE_ID || "mock-host-voice-id",
      process.env.PODCAST_GUEST_VOICE_ID || "mock-guest-voice-id",
      {
        duration: 300, // 5 minutes
        style: "conversational",
        language: "en",
        intro_music: true,
        outro_music: true,
      }
    );

    // 4. Create the podcast
    console.log("Creating podcast...");
    const creationResponse = await service.createPodcast(podcastRequest);
    console.log(`✓ Podcast creation started. ID: ${creationResponse.podcast_id}`);
    console.log(`Status: ${creationResponse.status}`);

    // 5. Wait for completion with progress updates
    console.log("Waiting for podcast completion...");
    const completedPodcast = await service.waitForCompletion(creationResponse.podcast_id, {
      pollInterval: 10000, // Check every 10 seconds
      maxWaitTime: 600000, // Wait up to 10 minutes
      onProgress: (status) => {
        console.log(`Progress: ${status.progress_percentage}% - ${status.status}`);
      },
    });

    console.log("✓ Podcast completed successfully!");
    console.log(`Duration: ${completedPodcast.duration} seconds`);
    console.log(`Audio URL: ${completedPodcast.audio_url}`);

    // 6. Download the podcast
    if (completedPodcast.audio_url) {
      console.log("Downloading podcast audio...");
      const audioData = await service.downloadPodcast(creationResponse.podcast_id);
      console.log(`✓ Downloaded ${audioData.byteLength} bytes of audio data`);

      // In a real application, you would save this to a file:
      // const fs = require('fs');
      // fs.writeFileSync(`podcast-${creationResponse.podcast_id}.mp3`, Buffer.from(audioData));
    }

    // 7. Display final results
    console.log("\n=== Final Podcast Summary ===");
    console.log(`Name: ${completedPodcast.name}`);
    console.log(`Status: ${completedPodcast.status}`);
    console.log(`Created: ${completedPodcast.created_at}`);
    console.log(`Completed: ${completedPodcast.completed_at}`);
    console.log(`Duration: ${completedPodcast.duration} seconds`);
    if (completedPodcast.transcript) {
      console.log(`Transcript preview: ${completedPodcast.transcript.substring(0, 200)}...`);
    }
  } catch (error) {
    if (error instanceof ElevenLabsGenfmError) {
      console.error(`ElevenLabs API Error (${error.statusCode}): ${error.message}`);
      if (error.response) {
        console.error("Response details:", error.response);
      }
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

// Example environment variable setup
export const exampleEnvSetup = {
  ELEVENLABS_GENFM_API_KEY: "sk-your-elevenlabs-api-key-here",
  PODCAST_HOST_VOICE_ID: "voice-id-for-host-speaker",
  PODCAST_GUEST_VOICE_ID: "voice-id-for-guest-speaker",
};

// Example configuration for different environments
export const configExamples = {
  development: {
    apiKey: process.env.ELEVENLABS_GENFM_API_KEY!,
    baseUrl: "https://api.elevenlabs.io",
    timeout: 30000,
  },
  production: {
    apiKey: process.env.ELEVENLABS_GENFM_API_KEY!,
    baseUrl: "https://api.elevenlabs.io",
    timeout: 120000, // Longer timeout for production
  },
  testing: {
    apiKey: "mock-api-key",
    baseUrl: "https://api.elevenlabs.io",
    timeout: 5000,
  },
};

// Export the example function for potential testing
export { exampleUsage };

/*
To use this in your application:

1. Set up environment variables:
   - ELEVENLABS_GENFM_API_KEY: Your ElevenLabs API key
   - PODCAST_HOST_VOICE_ID: Voice ID for the podcast host
   - PODCAST_GUEST_VOICE_ID: Voice ID for the podcast guest

2. Import and use the service:
   ```typescript
   import { createElevenLabsGenfmService } from './services/elevenlabsGenfm';
   
   const service = createElevenLabsGenfmService({
     apiKey: process.env.ELEVENLABS_GENFM_API_KEY!,
   });
   ```

3. Handle errors appropriately:
   ```typescript
   try {
     const podcast = await service.createPodcast(request);
   } catch (error) {
     if (error instanceof ElevenLabsGenfmError) {
       // Handle API-specific errors
     }
   }
   ```
*/
