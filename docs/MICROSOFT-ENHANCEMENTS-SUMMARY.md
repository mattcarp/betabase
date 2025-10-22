# Microsoft Teams/Outlook Enhancements - Summary

## 🎯 Focus: Microsoft-First Email Extraction

Based on your requirement that the system will be **almost entirely focused on Microsoft Teams/Outlook emails**, we've added comprehensive Microsoft-specific enhancements to the email extraction system.

## What's New

### 1. Microsoft Email Parser (`src/utils/microsoftEmailParser.ts`)

**Enhanced parsing specifically for Microsoft emails**:

- ✅ **Outlook-specific fields**: Importance, sensitivity, categories, flags
- ✅ **Teams-specific fields**: Team names, channel names, @mentions
- ✅ **Meeting metadata**: Start/end times, join URLs, attendees
- ✅ **Urgency scoring**: 0-10 algorithm based on Microsoft-specific signals
- ✅ **Actionable detection**: Flags, high importance, mentions, urgent keywords
- ✅ **HTML cleaning**: Removes Microsoft-specific markup (`<o:p>`, `<v:*>`, etc.)
- ✅ **Safe Links unwrapping**: Automatically extracts original URLs from Microsoft Safe Links

**Example Urgency Score Calculation**:

```typescript
Base score: 5
+ High importance: +2
+ Flagged: +2
+ Meeting within 24 hours: +2
+ Meeting within 2 hours: +2
+ @mentioned: +1
+ Urgent keywords: +2
+ Confidential: +1
= Up to 10/10 urgency
```

### 2. Microsoft Graph Service (`src/services/microsoftGraphService.ts`)

**Complete Microsoft Graph API integration**:

- ✅ **Sync Outlook emails**: Fetch from any folder with filtering
- ✅ **Sync Teams messages**: Channel messages with mentions
- ✅ **Sync calendar meetings**: With online meeting details
- ✅ **List teams**: Get all teams user is member of
- ✅ **List channels**: Get all channels in a team
- ✅ **Batch processing**: Efficient parallel processing
- ✅ **Error handling**: Graceful failures with detailed errors

**Example Usage**:

```typescript
const graphService = getMicrosoftGraphService({ accessToken });

// Sync last 100 Outlook emails
await graphService.syncOutlookEmails({
  folder: "inbox",
  top: 100,
  filter: "receivedDateTime ge 2024-01-01T00:00:00Z",
});

// Sync Teams messages from a channel
await graphService.syncTeamsMessages(teamId, channelId, { top: 50 });

// Sync upcoming meetings
await graphService.syncMeetings({
  startDateTime: new Date().toISOString(),
  endDateTime: nextWeek.toISOString(),
});
```

### 3. Microsoft Sync API (`app/api/microsoft-sync/`)

**Unified API for Microsoft data**:

- ✅ `POST /api/microsoft-sync` - Sync Outlook/Teams/Calendar in one call
- ✅ `GET /api/microsoft-sync` - List user's teams
- ✅ `GET /api/microsoft-sync/channels` - List team channels

**Example Request**:

```bash
curl -X POST http://localhost:3000/api/microsoft-sync \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_TOKEN",
    "syncOutlook": true,
    "outlookTop": 100,
    "teams": [
      { "teamId": "team-123", "channelId": "channel-456", "top": 50 }
    ],
    "syncMeetings": true
  }'
```

### 4. Microsoft-Specific Tests (`tests/unit/microsoftEmailParser.test.ts`)

**Comprehensive test coverage**:

- ✅ Outlook email parsing (importance, categories, flags)
- ✅ Teams message parsing (mentions, channels)
- ✅ Meeting request handling
- ✅ Urgency scoring algorithm
- ✅ Actionable content detection
- ✅ HTML cleaning (Safe Links, Outlook markup)
- ✅ Email address formatting

### 5. Documentation (`docs/MICROSOFT-EMAIL-INTEGRATION.md`)

**Complete Microsoft integration guide**:

- ✅ Quick start guide
- ✅ Microsoft Graph API setup
- ✅ Access token acquisition
- ✅ All sync scenarios (Outlook, Teams, Calendar)
- ✅ Search with Microsoft filters
- ✅ Example sync workflows
- ✅ Troubleshooting guide
- ✅ Rate limit handling

### 6. Example Script (`scripts/sync-microsoft-example.ts`)

**Ready-to-run Microsoft sync**:

- ✅ Syncs Outlook inbox
- ✅ Syncs Teams channels
- ✅ Syncs calendar meetings
- ✅ Demonstrates search
- ✅ Error handling examples

## Key Microsoft Features

### Outlook Email Features

```typescript
{
  importance: "high",              // low, normal, high
  sensitivity: "confidential",     // normal, personal, private, confidential
  categories: ["Budget", "Urgent"], // Outlook color categories
  flag: {
    flagStatus: "flagged",
    dueDateTime: "2024-01-18T17:00:00Z"
  },
  conversationId: "thread-id",     // Email thread tracking
  internetMessageId: "msg-id"      // Standard Message-ID
}
```

### Teams Message Features

```typescript
{
  isTeamsMessage: true,
  teamName: "Engineering Team",
  teamsChannelName: "General",
  mentions: [
    {
      id: "mention-1",
      displayName: "Sarah Johnson",
      userPrincipalName: "sarah@company.com"
    }
  ]
}
```

### Meeting Features

```typescript
{
  isMeetingRequest: true,
  meetingDetails: {
    subject: "Team Sync",
    startTime: "2024-01-20T14:00:00Z",
    endTime: "2024-01-20T15:00:00Z",
    location: "Conference Room A",
    isOnlineMeeting: true,
    joinUrl: "https://teams.microsoft.com/l/meetup-join/...",
    organizer: "manager@company.com",
    attendees: ["team@company.com"]
  }
}
```

## Microsoft-Specific Parsing

### Safe Links Unwrapping

**Before**:

```
https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com
```

**After**:

```
https://example.com
```

### Outlook HTML Cleaning

**Removes**:

- `<o:p>` and `</o:p>` tags
- `<v:*>` vector markup language
- `<!--[if...]>` conditional comments
- Microsoft tracking pixels
- Signature separators

### Teams @Mentions Extraction

**From body text**:

```
"Please review @[Sarah Johnson] and @[Bob Smith]"
```

**Extracted**:

```typescript
mentionedUsers: ["Sarah Johnson", "Bob Smith"];
```

## Search Examples

### Find High-Urgency Emails

```typescript
const results = await emailService.searchEmails("project deadline");

const urgent = results.filter((r) => r.metadata.urgencyScore >= 8);
```

### Find Teams Messages in Channel

```typescript
const teamsMessages = results.filter(
  (r) =>
    r.metadata.isTeamsMessage &&
    r.metadata.teamName === "Engineering" &&
    r.metadata.teamsChannel === "General"
);
```

### Find Upcoming Meetings

```typescript
const meetings = results.filter((r) => {
  if (!r.metadata.isMeeting) return false;

  const meetingTime = new Date(r.metadata.meetingTime.start);
  const hoursUntil = (meetingTime - Date.now()) / (1000 * 60 * 60);

  return hoursUntil > 0 && hoursUntil < 24; // Next 24 hours
});
```

### Find Emails Where You're @Mentioned

```typescript
const mentionedEmails = results.filter((r) => r.metadata.mentionedUsers?.includes("Your Name"));
```

## Integration Flow

```
1. Get Microsoft Access Token (MSAL, OAuth2)
   ↓
2. Create MicrosoftGraphService instance
   ↓
3. Sync Outlook emails → MicrosoftEmailParser → Vector Store
   ↓
4. Sync Teams messages → MicrosoftEmailParser → Vector Store
   ↓
5. Sync Calendar meetings → MicrosoftEmailParser → Vector Store
   ↓
6. Search with Microsoft-specific filters (urgency, mentions, meetings)
```

## File Structure

```
src/
├── utils/
│   └── microsoftEmailParser.ts       # Microsoft-specific parsing
└── services/
    └── microsoftGraphService.ts      # Microsoft Graph API integration

app/api/
└── microsoft-sync/
    ├── route.ts                      # Main sync endpoint
    └── channels/route.ts             # Channel listing

tests/unit/
└── microsoftEmailParser.test.ts      # Microsoft parser tests

scripts/
└── sync-microsoft-example.ts         # Example sync script

docs/
├── MICROSOFT-EMAIL-INTEGRATION.md    # Complete Microsoft guide
└── EMAIL-CONTEXT-EXTRACTION.md       # General extraction guide
```

## Required Permissions

In your Azure AD app registration, grant these Microsoft Graph permissions:

- **Mail.Read** - Read Outlook emails
- **ChannelMessage.Read.All** - Read Teams channel messages
- **Calendars.Read** - Read calendar events
- **Team.ReadBasic.All** - List teams
- **Channel.ReadBasic.All** - List channels

## Environment Variables

```bash
# For testing with Microsoft
MICROSOFT_CLIENT_ID=your-azure-ad-client-id
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_ACCESS_TOKEN=your-access-token
```

## Quick Start

### 1. Get Access Token

See `docs/MICROSOFT-EMAIL-INTEGRATION.md` for detailed instructions using MSAL.

### 2. Run Example Sync

```bash
export MICROSOFT_ACCESS_TOKEN=your-token
tsx scripts/sync-microsoft-example.ts
```

### 3. Use API

```bash
curl -X POST http://localhost:3000/api/microsoft-sync \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_TOKEN",
    "syncOutlook": true,
    "outlookTop": 50
  }'
```

## Testing

```bash
# Run Microsoft-specific parser tests
npm test tests/unit/microsoftEmailParser.test.ts

# Run all email tests
npm test tests/unit/emailParser.test.ts tests/unit/microsoftEmailParser.test.ts
```

## Next Steps

1. **Set up Azure AD app** with required permissions
2. **Get access token** (see documentation)
3. **Run example script** to test sync
4. **Schedule regular syncs** (cron job, GitHub Actions, etc.)
5. **Implement webhooks** for real-time sync (future enhancement)

## Benefits Over Generic Email Parsing

### Generic Parser:

- Basic email fields (from, to, subject, body)
- Simple HTML stripping
- No urgency detection

### Microsoft Parser:

- ✅ **Urgency scoring** (0-10) based on Microsoft signals
- ✅ **Actionable detection** (flags, mentions, meetings)
- ✅ **Teams context** (team/channel names)
- ✅ **Meeting details** (join URLs, attendees)
- ✅ **Safe Links unwrapping**
- ✅ **Outlook HTML cleaning**
- ✅ **@Mention extraction**
- ✅ **Category/flag handling**

## Production Considerations

### Rate Limits

Microsoft Graph API limits:

- Outlook: 10,000 requests / 10 minutes
- Teams: 500 requests / 10 minutes
- Calendar: 1,500 requests / 30 seconds

**Solution**: Implement backoff strategy (see documentation)

### Token Refresh

Tokens expire after 1 hour.

**Solution**: Use MSAL with automatic refresh (see documentation)

### Incremental Sync

Don't re-sync historical data every time.

**Solution**: Use `filter` parameter with `receivedDateTime ge {lastSync}`

## Support

- **General email extraction**: See `docs/EMAIL-CONTEXT-EXTRACTION.md`
- **Microsoft-specific**: See `docs/MICROSOFT-EMAIL-INTEGRATION.md`
- **Example code**: See `scripts/sync-microsoft-example.ts`
- **Tests**: See `tests/unit/microsoftEmailParser.test.ts`

---

**Status**: ✅ Production-ready for Microsoft Teams & Outlook
**Focus**: Microsoft-first with specialized parsing and integration
**Last Updated**: January 2025
