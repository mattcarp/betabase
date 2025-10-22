# Email Context Extraction System

## Overview

The Email Context Extraction System enables intelligent processing of email data by extracting relevant context, generating embeddings, and storing them in a vector database for semantic search capabilities.

**Task Reference**: Task 70 - Develop Email Context Extraction
**Dependencies**: Task 66 (Data Ingestion Framework) ✅ Complete

## Architecture

### Components

1. **Email Parser** (`src/utils/emailParser.ts`)
   - Extracts context from email headers and bodies
   - Handles HTML and plain text content
   - Cleans and normalizes text (removes signatures, quotes, HTML tags)
   - Extracts metadata (participants, attachments, threading)

2. **Email Context Service** (`src/services/emailContextService.ts`)
   - Coordinates parsing and vectorization
   - Uses OpenAI embeddings via Vercel AI SDK
   - Stores vectors in Supabase with pgvector
   - Provides search and management operations

3. **API Endpoints** (`app/api/email-context/`)
   - `POST /api/email-context` - Ingest single email
   - `POST /api/email-context/batch` - Ingest multiple emails
   - `POST /api/email-context/search` - Search emails by similarity
   - `GET /api/email-context` - Get email statistics
   - `DELETE /api/email-context?messageId=xxx` - Delete email

4. **Tests**
   - Unit tests: `tests/unit/emailParser.test.ts`
   - Integration tests: `tests/integration/emailContext.test.ts`
   - API tests: `tests/integration/emailContextApi.test.ts`

## Data Flow

```
Raw Email Data
    ↓
Email Parser (extract context)
    ↓
Parsed Email Context (content + metadata)
    ↓
OpenAI Embeddings (text-embedding-3-small)
    ↓
Vector Storage (Supabase pgvector)
    ↓
Semantic Search & Retrieval
```

## Usage

### Ingesting Emails

#### Single Email

```typescript
import { getEmailContextService } from "@/services/emailContextService";

const service = getEmailContextService();

const email = {
  messageId: "unique-message-id",
  from: "sender@example.com",
  to: ["recipient@example.com"],
  subject: "Project Update",
  body: "Email content here...",
  date: new Date(),
};

const result = await service.ingestEmail(email);
// result: { success: true, messageId: "...", vectorId: "..." }
```

#### Batch Ingestion

```typescript
const emails = [email1, email2, email3];

const result = await service.ingestEmailBatch(emails);
// result: { total: 3, successful: 3, failed: 0, results: [...] }
```

### Searching Emails

```typescript
// Basic search
const results = await service.searchEmails("project deadline");

// Advanced search with filters
const results = await service.searchEmails("budget approval", {
  matchThreshold: 0.8, // Similarity threshold (0-1)
  matchCount: 10, // Max results
  dateFrom: "2024-01-01", // Filter by date range
  dateTo: "2024-12-31",
  participants: ["alice@example.com"], // Filter by participants
});
```

### Using the API

#### Ingest Email via API

```bash
curl -X POST http://localhost:3000/api/email-context \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "msg-123",
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "Test Email",
    "body": "This is a test email",
    "date": "2024-01-15T10:00:00Z"
  }'
```

#### Search Emails via API

```bash
curl -X POST http://localhost:3000/api/email-context/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "project deadline",
    "matchThreshold": 0.75,
    "matchCount": 5
  }'
```

## Email Data Structure

### Input Format (EmailData)

```typescript
interface EmailData {
  messageId: string; // Required: Unique identifier
  from: string; // Required: Sender email
  to: string[]; // Required: Recipient emails
  cc?: string[]; // Optional: CC recipients
  bcc?: string[]; // Optional: BCC recipients
  subject: string; // Required: Email subject
  body: string; // Email plain text (required if no htmlBody)
  htmlBody?: string; // HTML email content
  date: Date | string; // Required: Email date
  threadId?: string; // Optional: Conversation thread ID
  inReplyTo?: string; // Optional: Parent message ID
  references?: string[]; // Optional: Reference message IDs
  attachments?: Array<{
    // Optional: Attachment metadata
    filename: string;
    contentType: string;
    size: number;
  }>;
  headers?: Record<string, string>; // Optional: Additional headers
}
```

### Output Format (ParsedEmailContext)

```typescript
interface ParsedEmailContext {
  messageId: string;
  threadId?: string;
  content: string; // Vectorized content
  metadata: {
    from: string;
    to: string[];
    cc?: string[];
    subject: string;
    date: string;
    hasAttachments: boolean;
    attachmentCount: number;
    isReply: boolean;
    threadParticipants: string[];
    contentLength: number;
    extractedAt: string;
  };
}
```

## Features

### Email Parser Features

- ✅ **HTML Parsing**: Strips tags, converts to clean text
- ✅ **HTML Entity Decoding**: Handles `&amp;`, `&quot;`, etc.
- ✅ **Signature Removal**: Removes common email signature patterns
- ✅ **Quote Removal**: Filters out quoted replies (>)
- ✅ **Whitespace Normalization**: Cleans excessive spaces/newlines
- ✅ **Attachment Metadata**: Includes filenames in context
- ✅ **Thread Detection**: Identifies reply chains
- ✅ **Participant Extraction**: Tracks all email participants

### Search Features

- ✅ **Semantic Search**: Vector similarity using OpenAI embeddings
- ✅ **Date Filtering**: Search within specific date ranges
- ✅ **Participant Filtering**: Find emails involving specific people
- ✅ **Configurable Threshold**: Adjust similarity requirements
- ✅ **Result Limiting**: Control number of results returned

### Management Features

- ✅ **Batch Processing**: Efficient multi-email ingestion
- ✅ **Re-indexing**: Update existing email vectors
- ✅ **Statistics**: Track email corpus metrics
- ✅ **Deletion**: Remove individual or all emails
- ✅ **Error Handling**: Graceful failure with detailed errors

## Testing

### Run Unit Tests

```bash
npm test tests/unit/emailParser.test.ts
```

Tests cover:

- Email parsing and content extraction
- HTML parsing and entity decoding
- Signature and quote removal
- Date normalization
- Validation logic
- Edge cases and error handling

### Run Integration Tests

```bash
npm test tests/integration/emailContext.test.ts
npm test tests/integration/emailContextApi.test.ts
```

Tests cover:

- End-to-end email ingestion
- Vector generation and storage
- Semantic search accuracy
- API endpoint functionality
- Batch processing
- Error recovery

### Run Sample Test Script

```bash
npm run dev  # Start the development server

# In another terminal:
tsx scripts/test-email-extraction.ts
```

This demonstrates:

- Ingesting realistic sample emails
- Various search scenarios
- Date filtering
- Participant filtering
- Statistics retrieval

## Environment Variables

Required environment variables:

```bash
# OpenAI for embeddings
OPENAI_API_KEY=sk-...

# Supabase for vector storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Batch processing configuration
EMAIL_BATCH_SIZE=10              # Parallel processing batch size
MAX_EMAIL_BATCH_SIZE=100         # Maximum batch size for API
VECTOR_BATCH_SIZE=5              # Vector upsert batch size
```

## Database Schema

The system uses the existing `aoma_unified_vectors` table with source_type='email':

```sql
CREATE TABLE aoma_unified_vectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  source_type TEXT NOT NULL,  -- 'email' for email vectors
  source_id TEXT NOT NULL,    -- messageId
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_aoma_vectors(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.78,
  match_count INT DEFAULT 10,
  filter_source_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_type TEXT,
  source_id TEXT,
  metadata JSONB,
  similarity FLOAT
)
```

## Performance Considerations

### Embedding Generation

- Uses OpenAI's `text-embedding-3-small` model (1536 dimensions)
- Average processing time: ~200-500ms per email
- Batch processing reduces total time through parallelization

### Vector Search

- Sub-second search queries via pgvector indexing
- Recommended threshold: 0.75-0.85 for email similarity
- Higher thresholds = more precise, fewer results
- Lower thresholds = more recall, more results

### Scaling

- Batch ingestion recommended for large email datasets
- Configure `EMAIL_BATCH_SIZE` based on API rate limits
- Use date range filtering for focused searches
- Monitor vector store size and performance

## Error Handling

The system handles various error scenarios gracefully:

- **Invalid email data**: Returns validation errors
- **Missing required fields**: Clear error messages
- **API failures**: Retries with exponential backoff
- **Vector storage errors**: Detailed error logging
- **Malformed HTML**: Robust parsing with fallbacks

Example error response:

```json
{
  "success": false,
  "messageId": "msg-123",
  "error": "Invalid email data format"
}
```

## Integration Examples

### Gmail API Integration

```typescript
// Fetch emails from Gmail and ingest
async function ingestGmailEmails(gmail: any, query: string) {
  const messages = await gmail.users.messages.list({
    userId: "me",
    q: query,
  });

  const emails: EmailData[] = await Promise.all(
    messages.data.messages.map(async (msg) => {
      const email = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      return {
        messageId: email.data.id,
        from: extractFrom(email.data.payload.headers),
        to: extractTo(email.data.payload.headers),
        subject: extractSubject(email.data.payload.headers),
        body: extractBody(email.data.payload),
        date: new Date(parseInt(email.data.internalDate)),
      };
    })
  );

  const service = getEmailContextService();
  return await service.ingestEmailBatch(emails);
}
```

### Microsoft Graph API Integration

```typescript
// Fetch emails from Outlook and ingest
async function ingestOutlookEmails(client: any, folderId: string) {
  const messages = await client
    .api(`/me/mailFolders/${folderId}/messages`)
    .select("id,from,toRecipients,subject,body,receivedDateTime")
    .top(50)
    .get();

  const emails: EmailData[] = messages.value.map((msg: any) => ({
    messageId: msg.id,
    from: msg.from.emailAddress.address,
    to: msg.toRecipients.map((r: any) => r.emailAddress.address),
    subject: msg.subject,
    htmlBody: msg.body.content,
    date: new Date(msg.receivedDateTime),
  }));

  const service = getEmailContextService();
  return await service.ingestEmailBatch(emails);
}
```

## Best Practices

1. **Always include messageId**: Use unique identifiers for deduplication
2. **Batch when possible**: More efficient than individual ingestion
3. **Include thread context**: Set threadId and inReplyTo for conversations
4. **Use appropriate thresholds**: Start with 0.78, adjust based on results
5. **Filter by date**: Improves search performance and relevance
6. **Monitor statistics**: Track corpus size and search quality
7. **Clean up test data**: Use delete operations in development
8. **Handle errors gracefully**: Check result.success in production code

## Troubleshooting

### Common Issues

**Issue**: Emails not being found in search

- Check similarity threshold (try lowering to 0.6)
- Verify email was successfully ingested (check result.success)
- Wait a moment after ingestion for indexing

**Issue**: Slow ingestion

- Use batch operations instead of individual ingests
- Check OpenAI API rate limits
- Verify network connectivity

**Issue**: HTML not parsing correctly

- Email parser handles most HTML gracefully
- Check console for specific parsing errors
- HTML entities are automatically decoded

**Issue**: Memory issues with large batches

- Reduce EMAIL_BATCH_SIZE in environment
- Process emails in smaller chunks
- Monitor server memory usage

## Future Enhancements

Potential improvements for future iterations:

- [ ] Email deduplication logic
- [ ] Attachment content extraction (PDF, DOC)
- [ ] Multi-language support
- [ ] Email classification (categories/labels)
- [ ] Sentiment analysis
- [ ] Automated thread summarization
- [ ] Real-time email streaming ingestion
- [ ] Email importance scoring

## Support

For issues or questions:

- Review test files for usage examples
- Check API error messages for debugging hints
- Run verification script: `./scripts/verify-email-system.sh`
- Consult Supabase logs for vector storage issues

## References

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Supabase Vector Documentation](https://supabase.com/docs/guides/ai/vector-search)
- [pgvector Extension](https://github.com/pgvector/pgvector)

---

**Status**: ✅ Complete - Ready for production use
**Last Updated**: January 2025
**Version**: 1.0.0
