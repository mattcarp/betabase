# Lambda MCP Transcription Pipeline Integration

## Overview

This document describes the integration of the **Agent-Lambda MCP workflow** with the **SIAM transcription pipeline**, enabling seamless audio processing through AWS Lambda-deployed MCP servers while maintaining fallback to local processing.

**Task**: 48.6 - Integrate Agent-Lambda MCP Workflow with SIAM Transcription Pipeline

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    SIAM Audio Input Layer                        │
│  (Microphone, File Upload, Real-Time Streaming)                  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│            Lambda MCP Audio Router Service                       │
│  • Route audio to Lambda MCP server                              │
│  • Handle 30-second timeout constraints                          │
│  • Chunk large audio files (>5MB)                                │
│  • Retry logic with exponential backoff                          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│              Lambda MCP Server (AWS Lambda)                      │
│  URL: ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url...            │
│  • Process audio through transcription pipeline                  │
│  • Voice isolation (ElevenLabs)                                  │
│  • Speech-to-text (OpenAI Whisper)                               │
│  • Return transcription + metadata                               │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│         Lambda MCP Transcription Pipeline                        │
│  • Receive transcription from Lambda MCP                         │
│  • Fallback to local processing if Lambda fails                  │
│  • Perform content analysis                                      │
│  • Extract features and metrics                                  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│         Enhanced Audio Processor (Local Fallback)                │
│  • Voice isolation (ElevenLabs API)                              │
│  • Transcription (OpenAI Whisper API)                            │
│  • Content analysis and moderation                               │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                  SIAM UI Components                              │
│  (LiveTranscription, Chat Panel, Audio Visualizations)           │
└──────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Lambda MCP Audio Router (`src/services/lambdaMcpAudioRouter.ts`)

Routes audio processing requests to the Lambda MCP server with intelligent handling of:

- **Timeout Management**: 28-second timeout (2s buffer for Lambda's 30s limit)
- **Retry Logic**: Exponential backoff (1s, 2s, 4s) with max 3 retries
- **Audio Chunking**: Splits large files (>5MB) into processable chunks
- **Cancellation Support**: Abort controller for graceful cancellation

**Key Methods**:
```typescript
processAudio(request: AudioProcessingRequest): Promise<AudioProcessingResponse>
healthCheck(): Promise<{ healthy: boolean; latency?: number }>
cancelProcessing(): void
```

### 2. Lambda MCP Transcription Pipeline (`src/services/lambdaMcpTranscriptionPipeline.ts`)

Integration layer that orchestrates audio processing through Lambda MCP with automatic fallback to local processing.

**Features**:
- **Hybrid Processing**: Attempts Lambda MCP first, falls back to local on failure
- **Content Analysis**: Performs local content analysis on transcriptions
- **Metrics Tracking**: Comprehensive performance and success rate monitoring
- **Real-time Callbacks**: Progress updates during processing

**Key Methods**:
```typescript
processAudio(audioData: Blob | ArrayBuffer): Promise<PipelineResult>
healthCheck(): Promise<{ healthy: boolean; stats: any }>
getStats(): PipelineStatistics
```

### 3. API Endpoint (`app/api/lambda-mcp/transcribe/route.ts`)

Server-side Next.js API route for processing audio requests.

**Endpoints**:
- `POST /api/lambda-mcp/transcribe` - Process audio file
- `GET /api/lambda-mcp/transcribe` - Health check and statistics

**Request Format**:
```typescript
FormData {
  audio: Blob,
  options: {
    enableVoiceIsolation?: boolean,
    transcriptionModel?: 'whisper-1' | 'gpt-4o-transcribe',
    language?: string
  }
}
```

**Response Format**:
```typescript
{
  success: boolean,
  transcription: {
    text: string,
    confidence?: number,
    language?: string
  },
  voiceIsolation: {
    applied: boolean
  },
  contentAnalysis: {
    isExplicit: boolean,
    contentType: string,
    sentiment: string,
    keywords: string[]
  },
  metadata: {
    processingMode: 'lambda-mcp' | 'local' | 'hybrid',
    lambdaAttempted: boolean,
    lambdaSuccess: boolean,
    fallbackUsed: boolean,
    processingTime: number
  }
}
```

### 4. React Hook (`src/hooks/useLambdaMcpTranscription.ts`)

Frontend React hook for easy integration with UI components.

**Usage Example**:
```typescript
import { useLambdaMcpTranscription } from '@/hooks/useLambdaMcpTranscription';

function MyComponent() {
  const {
    isTranscribing,
    transcription,
    contentAnalysis,
    metadata,
    error,
    transcribeAudio,
    clearTranscription,
    cancelTranscription,
  } = useLambdaMcpTranscription();

  const handleAudioRecord = async (audioBlob: Blob) => {
    await transcribeAudio(audioBlob);
  };

  return (
    <div>
      {isTranscribing && <div>Transcribing...</div>}
      {transcription && <div>{transcription.text}</div>}
      {error && <div>Error: {error}</div>}
    </div>
  );
}
```

## Configuration

### Lambda MCP Server

**URL**: `https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws`

**Configured in**: `src/config/apiKeys.ts`

```typescript
export const getMcpLambdaUrl = () =>
  process.env.MCP_LAMBDA_URL ||
  'https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws';
```

### Environment Variables

```bash
# Lambda MCP Configuration
MCP_LAMBDA_URL=https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws

# API Keys (for local fallback)
ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=your_openai_key
```

### Pipeline Configuration

```typescript
const pipeline = new LambdaMcpTranscriptionPipeline({
  useLambdaMcp: true,              // Enable Lambda MCP
  fallbackToLocal: true,           // Enable fallback
  lambdaTimeout: 28000,            // 28-second timeout
  enableVoiceIsolation: true,      // Voice isolation
  transcriptionModel: 'gpt-4o-transcribe',
  contentModerationLevel: 'moderate',
  enableMetrics: true,             // Track performance
});
```

## Lambda Timeout Handling

AWS Lambda has a maximum execution time of **30 seconds** for HTTP requests. The integration handles this with:

### 1. Aggressive Timeout (28 seconds)
Abort requests after 28 seconds to leave 2-second buffer for Lambda overhead.

### 2. Exponential Backoff Retry
- **Attempt 1**: Immediate
- **Attempt 2**: Wait 1 second
- **Attempt 3**: Wait 2 seconds
- **Attempt 4**: Wait 4 seconds

### 3. Audio Chunking
Large audio files (>5MB) are automatically split into chunks and processed sequentially.

```typescript
// Chunk size: 5MB (well under Lambda limits)
const chunkSize = 5 * 1024 * 1024;
```

### 4. Local Fallback
If Lambda processing fails after retries, automatically fall back to local processing:

```typescript
if (lambdaFailed && config.fallbackToLocal) {
  console.log('🔄 Falling back to local processing...');
  const result = await localProcessor.processAudio(audioData);
  return { ...result, processingMode: 'hybrid' };
}
```

## Data Flow

### Successful Lambda MCP Flow

```
1. User records audio → audioBlob
2. Frontend calls transcribeAudio(audioBlob)
3. POST /api/lambda-mcp/transcribe with FormData
4. Lambda MCP Audio Router processes request
5. Lambda MCP Server transcribes audio
6. Lambda MCP Transcription Pipeline enriches results
7. Content analysis performed locally
8. Results returned to frontend
9. UI displays transcription with metadata
```

### Fallback Flow (Lambda Timeout/Failure)

```
1. User records audio → audioBlob
2. Frontend calls transcribeAudio(audioBlob)
3. POST /api/lambda-mcp/transcribe with FormData
4. Lambda MCP Audio Router attempts Lambda
5. Lambda request times out after 28 seconds
6. Retry with exponential backoff (up to 3 times)
7. All Lambda attempts fail
8. Pipeline falls back to local processing
9. Enhanced Audio Processor handles transcription
10. Results returned with processingMode: 'hybrid'
11. UI displays transcription with fallback indicator
```

## Testing

### Test Suite: `tests/lambda-mcp-transcription.spec.ts`

Comprehensive Playwright tests covering:

1. **Health Check Test**: Verify API endpoint availability
2. **Audio Processing Test**: Submit audio and verify transcription
3. **Timeout Handling Test**: Test Lambda timeout with fallback
4. **Metrics Tracking Test**: Verify performance metrics
5. **Content Analysis Test**: Validate content moderation
6. **Statistics Test**: Check health and usage statistics
7. **Chunking Test**: Test large file processing

### Run Tests

```bash
# Run all Lambda MCP transcription tests
npx playwright test tests/lambda-mcp-transcription.spec.ts

# Run specific test
npx playwright test tests/lambda-mcp-transcription.spec.ts -g "should process audio"

# Run with UI
npx playwright test tests/lambda-mcp-transcription.spec.ts --ui

# Run in headed mode (see browser)
npx playwright test tests/lambda-mcp-transcription.spec.ts --headed
```

### Test Audio Samples

For realistic testing, use actual audio files:

```typescript
// Load real audio file for testing
const audioFile = fs.readFileSync('./test-audio/sample.webm');
const audioBlob = new Blob([audioFile], { type: 'audio/webm' });

const response = await request.post('/api/lambda-mcp/transcribe', {
  multipart: {
    audio: {
      name: 'sample.webm',
      mimeType: 'audio/webm',
      buffer: audioFile,
    },
  },
});
```

## Performance Metrics

The pipeline tracks comprehensive metrics:

```typescript
{
  totalProcessed: number,
  lambdaSuccessCount: number,
  lambdaFailureCount: number,
  fallbackCount: number,
  averageLambdaLatency: number,    // milliseconds
  averageLocalLatency: number,     // milliseconds
  lambdaSuccessRate: number,       // 0-1
  fallbackRate: number             // 0-1
}
```

**Access metrics**:
```typescript
const stats = lambdaMcpTranscriptionPipeline.getStats();
console.log(`Lambda success rate: ${(stats.lambdaSuccessRate * 100).toFixed(1)}%`);
```

## Monitoring & Debugging

### Health Check

```bash
# Check Lambda MCP health
curl http://localhost:3000/api/lambda-mcp/transcribe

# Response
{
  "status": "healthy",
  "lambdaMcp": {
    "healthy": true,
    "latency": 250
  },
  "statistics": {
    "totalProcessed": 42,
    "lambdaSuccessCount": 38,
    "lambdaFailureCount": 4,
    "fallbackCount": 4,
    "lambdaSuccessRate": 0.9047619047619048
  }
}
```

### Console Logs

The integration provides detailed logging:

```
🎤 Lambda MCP Audio Router: Starting audio processing...
   Audio size: 245.3KB
📤 Processing audio in single request...
🔄 Sending audio to Lambda MCP server (attempt 1/4)...
✅ Lambda MCP processing completed in 1250ms
🔍 Performing local content analysis on Lambda transcription...
✅ Pipeline processing completed in 1305ms
   Mode: lambda-mcp
   Lambda success: ✅
   Fallback used: ❌
```

### Error Handling

All errors are caught and logged with context:

```typescript
try {
  const result = await lambdaMcpTranscriptionPipeline.processAudio(audioBlob);
} catch (error) {
  console.error('❌ Transcription failed:', error);
  // Error includes:
  // - Error message
  // - Processing mode attempted
  // - Retry count
  // - Fallback status
}
```

## Best Practices

### 1. Always Enable Fallback in Production

```typescript
const pipeline = new LambdaMcpTranscriptionPipeline({
  useLambdaMcp: true,
  fallbackToLocal: true,  // CRITICAL for reliability
});
```

### 2. Handle Processing Modes in UI

```typescript
if (metadata.processingMode === 'lambda-mcp') {
  // Pure Lambda MCP processing
  showSuccessIndicator();
} else if (metadata.processingMode === 'hybrid') {
  // Lambda failed, fallback used
  showWarningIndicator('Processed locally due to server issues');
} else {
  // Local processing only
  showInfoIndicator('Processed locally');
}
```

### 3. Monitor Lambda Success Rate

```typescript
const stats = await fetch('/api/lambda-mcp/transcribe').then(r => r.json());

if (stats.statistics.lambdaSuccessRate < 0.8) {
  console.warn('⚠️ Lambda MCP success rate below 80%');
  // Alert ops team
}
```

### 4. Optimize Audio Before Processing

```typescript
// Compress audio before sending to Lambda
const compressedAudio = await compressAudio(audioBlob, {
  bitrate: 96,      // 96kbps (balance quality vs. size)
  sampleRate: 16000, // 16kHz (sufficient for speech)
});

await transcribeAudio(compressedAudio);
```

### 5. Show Progress Indicators

```typescript
const { isTranscribing } = useLambdaMcpTranscription();

return (
  <div>
    {isTranscribing && (
      <div className="flex items-center gap-2">
        <Spinner />
        <span>Transcribing via Lambda MCP...</span>
      </div>
    )}
  </div>
);
```

## Troubleshooting

### Lambda MCP Server Not Responding

**Symptoms**: All requests timeout, fallback always used

**Solutions**:
1. Check Lambda URL is correct
2. Verify Lambda function is deployed and active
3. Check Lambda CloudWatch logs for errors
4. Verify network connectivity

```bash
# Test Lambda health directly
curl https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws/health
```

### High Fallback Rate

**Symptoms**: Most requests fall back to local processing

**Solutions**:
1. Increase Lambda timeout configuration
2. Optimize Lambda function performance
3. Check Lambda memory allocation
4. Review audio file sizes (enable chunking)

### Inconsistent Transcription Quality

**Symptoms**: Transcription accuracy varies

**Solutions**:
1. Use consistent audio format (webm recommended)
2. Ensure adequate sample rate (16kHz minimum)
3. Apply voice isolation before transcription
4. Check audio quality metrics

## Migration Guide

### Migrating Existing Code

**Before** (Direct Enhanced Audio Processor):
```typescript
import { enhancedAudioProcessor } from '@/services/enhancedAudioProcessor';

const result = await enhancedAudioProcessor.processAudio(audioBlob);
```

**After** (Lambda MCP Pipeline):
```typescript
import { lambdaMcpTranscriptionPipeline } from '@/services/lambdaMcpTranscriptionPipeline';

const result = await lambdaMcpTranscriptionPipeline.processAudio(audioBlob);
// Result format is compatible, adds metadata.processingMode
```

**Or** (React Hook):
```typescript
import { useLambdaMcpTranscription } from '@/hooks/useLambdaMcpTranscription';

const { transcribeAudio, transcription } = useLambdaMcpTranscription();

await transcribeAudio(audioBlob);
// transcription.text contains the result
```

## Future Enhancements

1. **WebSocket Streaming**: Real-time transcription updates
2. **Multi-Language Support**: Dynamic language detection
3. **Speaker Diarization**: Identify multiple speakers
4. **Sentiment Analysis**: Real-time emotion detection
5. **Custom Models**: Fine-tuned transcription models
6. **Batch Processing**: Process multiple files concurrently
7. **Cost Optimization**: Intelligent routing based on audio characteristics

## Related Documentation

- [ElevenLabs MCP Integration Guide](./ELEVENLABS-MCP-INTEGRATION-GUIDE.md)
- [Enhanced Audio Processor](../src/services/enhancedAudioProcessor.ts)
- [Testing Fundamentals](./TESTING_FUNDAMENTALS.md)
- [Production Testing](./PRODUCTION_TESTING.md)

## Support

For issues or questions about the Lambda MCP transcription integration:

1. Check CloudWatch logs for Lambda errors
2. Review browser console for client-side errors
3. Run health check: `GET /api/lambda-mcp/transcribe`
4. Check metrics for success rates
5. Test with sample audio files

## Conclusion

The Lambda MCP Transcription Pipeline provides a robust, production-ready solution for processing audio through AWS Lambda-deployed MCP servers with automatic fallback to local processing. The integration respects Lambda timeout constraints, handles errors gracefully, and provides comprehensive metrics and monitoring.

**Key Benefits**:
- ✅ Seamless Lambda MCP integration
- ✅ Automatic fallback for reliability
- ✅ Intelligent timeout handling
- ✅ Audio chunking for large files
- ✅ Comprehensive metrics tracking
- ✅ Production-ready error handling

---

**Last Updated**: January 2025
**Task**: 48.6 - Integrate Agent-Lambda MCP Workflow with SIAM Transcription Pipeline
**Status**: ✅ Complete
