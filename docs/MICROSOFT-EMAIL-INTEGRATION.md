

# Microsoft Teams & Outlook Email Integration

## Overview

**Primary Focus**: This email extraction system is optimized for **Microsoft Teams and Outlook** emails, with specialized parsing for Microsoft-specific features.

The system handles:
- ✅ **Outlook emails** with importance, categories, and flags
- ✅ **Teams channel messages** with @mentions and reactions
- ✅ **Meeting invites** from Outlook Calendar
- ✅ **Teams conversations** with thread context
- ✅ **Microsoft Safe Links** unwrapping
- ✅ **Outlook HTML** cleaning (removes Microsoft-specific markup)

## Quick Start: Sync Microsoft Data

### 1. Get Microsoft Access Token

You'll need a Microsoft Graph API access token with these permissions:
- `Mail.Read` - Read Outlook emails
- `ChannelMessage.Read.All` - Read Teams messages
- `Calendars.Read` - Read calendar events
- `Team.ReadBasic.All` - List teams
- `Channel.ReadBasic.All` - List channels

```typescript
// Example: Get token using @azure/msal-node
import { ConfidentialClientApplication } from "@azure/msal-node";

const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  },
};

const cca = new ConfidentialClientApplication(msalConfig);
const result = await cca.acquireTokenByClientCredential({
  scopes: ["https://graph.microsoft.com/.default"],
});

const accessToken = result.accessToken;
```

### 2. Sync Outlook Emails

```bash
curl -X POST http://localhost:3000/api/microsoft-sync \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_ACCESS_TOKEN",
    "syncOutlook": true,
    "outlookFolder": "inbox",
    "outlookTop": 100
  }'
```

### 3. Sync Teams Messages

```bash
curl -X POST http://localhost:3000/api/microsoft-sync \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_ACCESS_TOKEN",
    "teams": [
      {
        "teamId": "team-id-123",
        "channelId": "channel-id-456",
        "top": 50
      }
    ]
  }'
```

### 4. Sync Calendar Meetings

```bash
curl -X POST http://localhost:3000/api/microsoft-sync \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_ACCESS_TOKEN",
    "syncMeetings": true,
    "meetingsStartDate": "2024-01-01T00:00:00Z",
    "meetingsEndDate": "2024-12-31T23:59:59Z"
  }'
```

## Microsoft-Specific Features

### Outlook Email Metadata

Captured Microsoft-specific fields:
- **Importance**: `low`, `normal`, `high`
- **Sensitivity**: `normal`, `personal`, `private`, `confidential`
- **Categories**: Outlook color categories
- **Flags**: Follow-up flags with due dates
- **Conversation ID**: Email thread tracking
- **Safe Links**: Automatically unwrapped

### Teams Message Metadata

Captured Teams-specific fields:
- **Team Name**: Which team the message belongs to
- **Channel Name**: Which channel (General, etc.)
- **Mentions**: @mentioned users
- **Conversation ID**: Teams thread ID
- **Importance**: Message priority

### Meeting Metadata

Captured meeting details:
- **Start/End Time**: Meeting schedule
- **Location**: Physical or online
- **Join URL**: Teams meeting link
- **Organizer**: Who scheduled it
- **Attendees**: Participant list

### Urgency Scoring

Automatic 0-10 urgency score based on:
- ✅ High importance (+2 points)
- ✅ Flagged for follow-up (+2 points)
- ✅ Meeting within 24 hours (+2 points)
- ✅ Meeting within 2 hours (+2 points)
- ✅ @mentions (+1 point)
- ✅ Urgent keywords in subject (+2 points)
- ✅ Confidential sensitivity (+1 point)

Example:
```json
{
  "metadata": {
    "urgencyScore": 9,
    "importance": "high",
    "isMeeting": true,
    "mentionedUsers": ["John Doe"],
    "hasActionableContent": true
  }
}
```

## Using MicrosoftGraphService

### Programmatic Sync

```typescript
import { getMicrosoftGraphService } from "@/services/microsoftGraphService";

const graphService = getMicrosoftGraphService({
  accessToken: "YOUR_ACCESS_TOKEN",
});

// Sync Outlook emails
const outlookResult = await graphService.syncOutlookEmails({
  folder: "inbox",
  top: 100,
  filter: "receivedDateTime ge 2024-01-01T00:00:00Z",
});

console.log(`Synced ${outlookResult.successful} emails`);

// Sync Teams messages
const teamsResult = await graphService.syncTeamsMessages(
  "team-id",
  "channel-id",
  { top: 50 }
);

console.log(`Synced ${teamsResult.successful} Teams messages`);

// Sync calendar meetings
const meetingsResult = await graphService.syncMeetings({
  startDateTime: "2024-01-01T00:00:00Z",
  endDateTime: "2024-12-31T23:59:59Z",
  top: 100,
});

console.log(`Synced ${meetingsResult.successful} meetings`);
```

### List User's Teams and Channels

```typescript
// Get all teams
const teams = await graphService.getUserTeams();
console.log("Teams:", teams);
// [{ id: "team-123", displayName: "Engineering Team" }, ...]

// Get channels in a team
const channels = await graphService.getTeamChannels("team-123");
console.log("Channels:", channels);
// [{ id: "channel-456", displayName: "General" }, ...]
```

## Using MicrosoftEmailParser

For custom parsing of Microsoft emails:

```typescript
import { MicrosoftEmailParser, MicrosoftEmailData } from "@/utils/microsoftEmailParser";

const email: MicrosoftEmailData = {
  messageId: "msg-123",
  from: "John Doe <john@company.com>",
  to: ["jane@company.com"],
  subject: "URGENT: Production Issue",
  htmlBody: "<p>Critical bug found!</p>",
  date: new Date(),
  importance: "high",
  categories: ["Urgent", "Engineering"],
  mentions: [{ id: "1", displayName: "Jane Smith" }],
  isTeamsMessage: true,
  teamName: "DevOps",
  teamsChannelName: "Incidents",
};

const parsed = MicrosoftEmailParser.parseMicrosoftEmail(email);

console.log("Urgency Score:", parsed.metadata.urgencyScore); // 9
console.log("Actionable:", parsed.metadata.hasActionableContent); // true
console.log("Teams Channel:", parsed.metadata.teamsChannel); // "Incidents"
console.log("Mentioned:", parsed.metadata.mentionedUsers); // ["Jane Smith"]
```

## Search with Microsoft Filters

### Find High-Priority Outlook Emails

```typescript
const results = await emailContextService.searchEmails(
  "quarterly budget review",
  {
    matchThreshold: 0.75,
    matchCount: 10,
  }
);

// Filter for high urgency
const urgentEmails = results.filter(
  (r) => r.metadata.urgencyScore >= 8
);
```

### Find Teams Messages in Specific Channel

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

  const meetingTime = new Date(r.metadata.meetingTime?.start || "");
  const now = new Date();
  const hoursUntil = (meetingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntil > 0 && hoursUntil < 24; // Next 24 hours
});
```

### Find Emails Where You're Mentioned

```typescript
const userEmail = "john@company.com";
const mentionedEmails = results.filter(
  (r) =>
    r.metadata.mentionedUsers?.includes("John Doe") ||
    r.metadata.to?.includes(userEmail)
);
```

## Complete Sync Workflow

### Automated Daily Sync

```typescript
// scripts/sync-microsoft-daily.ts
import { getMicrosoftGraphService } from "@/services/microsoftGraphService";

async function dailySync(accessToken: string) {
  const graphService = getMicrosoftGraphService({ accessToken });

  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = yesterday.toISOString();

  // Sync yesterday's Outlook emails
  const outlookResult = await graphService.syncOutlookEmails({
    folder: "inbox",
    filter: `receivedDateTime ge ${yesterdayISO}`,
    top: 200,
  });

  console.log(`✅ Synced ${outlookResult.successful} Outlook emails`);

  // Sync all Teams channels
  const teams = await graphService.getUserTeams();

  for (const team of teams) {
    const channels = await graphService.getTeamChannels(team.id);

    for (const channel of channels) {
      const teamsResult = await graphService.syncTeamsMessages(
        team.id,
        channel.id,
        { since: yesterdayISO, top: 100 }
      );

      console.log(
        `✅ Synced ${teamsResult.successful} messages from ${team.displayName} > ${channel.displayName}`
      );
    }
  }

  // Sync this week's meetings
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const meetingsResult = await graphService.syncMeetings({
    startDateTime: new Date().toISOString(),
    endDateTime: nextWeek.toISOString(),
  });

  console.log(`✅ Synced ${meetingsResult.successful} upcoming meetings`);
}

// Run with access token
dailySync(process.env.MICROSOFT_ACCESS_TOKEN!);
```

## API Endpoints

### POST /api/microsoft-sync

Sync Outlook, Teams, and Calendar data in one request.

**Request Body**:
```json
{
  "accessToken": "required",
  "syncOutlook": true,
  "outlookFolder": "inbox",
  "outlookTop": 100,
  "outlookFilter": "receivedDateTime ge 2024-01-01T00:00:00Z",
  "teams": [
    {
      "teamId": "team-123",
      "channelId": "channel-456",
      "top": 50,
      "since": "2024-01-01T00:00:00Z"
    }
  ],
  "syncMeetings": true,
  "meetingsStartDate": "2024-01-01T00:00:00Z",
  "meetingsEndDate": "2024-12-31T23:59:59Z",
  "meetingsTop": 100
}
```

**Response**:
```json
{
  "success": true,
  "summary": {
    "totalSuccessful": 250,
    "totalFailed": 5
  },
  "details": {
    "outlook": {
      "total": 100,
      "successful": 98,
      "failed": 2
    },
    "teams": [
      {
        "teamId": "team-123",
        "channelId": "channel-456",
        "total": 50,
        "successful": 50,
        "failed": 0
      }
    ],
    "meetings": {
      "total": 100,
      "successful": 97,
      "failed": 3
    }
  }
}
```

### GET /api/microsoft-sync?accessToken=xxx

List all teams the user is a member of.

**Response**:
```json
{
  "success": true,
  "teams": [
    { "id": "team-123", "displayName": "Engineering Team" },
    { "id": "team-456", "displayName": "Marketing Team" }
  ]
}
```

### GET /api/microsoft-sync/channels?accessToken=xxx&teamId=xxx

List all channels in a team.

**Response**:
```json
{
  "success": true,
  "teamId": "team-123",
  "channels": [
    { "id": "channel-456", "displayName": "General" },
    { "id": "channel-789", "displayName": "Engineering" }
  ]
}
```

## Microsoft-Specific HTML Cleaning

The parser automatically handles:

1. **Outlook XML Elements**: Removes `<o:p>`, `<v:*>` tags
2. **Safe Links**: Unwraps Microsoft Safe Links to original URLs
3. **Tracking Pixels**: Removes Microsoft tracking images
4. **Conditional Comments**: Strips `<!--[if...]>` blocks
5. **Signature Separators**: Removes Outlook signature dividers

Example:
```html
<!-- Before -->
<html xmlns:o="urn:schemas-microsoft-com:office:office">
  <p>Check this: <a href="https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com">link</a></p>
  <o:p>Extra content</o:p>
</html>

<!-- After (parsed) -->
"Check this: example.com"
```

## Best Practices

### 1. Token Management

```typescript
// Refresh token before it expires
import { RefreshingAuthProvider } from "@azure/msal-node";

const authProvider = new RefreshingAuthProvider(msalConfig);
const accessToken = await authProvider.getAccessToken();
```

### 2. Incremental Sync

```typescript
// Store last sync time
const lastSync = await getLastSyncTime();

await graphService.syncOutlookEmails({
  filter: `receivedDateTime ge ${lastSync}`,
});

await saveLastSyncTime(new Date().toISOString());
```

### 3. Error Handling

```typescript
try {
  const result = await graphService.syncOutlookEmails({ top: 100 });

  if (result.failed > 0) {
    console.warn("Some emails failed to sync:", result.errors);
  }
} catch (error) {
  if (error.message.includes("401")) {
    // Token expired, refresh and retry
  } else if (error.message.includes("429")) {
    // Rate limited, wait and retry
  }
}
```

### 4. Batch Processing

```typescript
// Sync in smaller batches to avoid rate limits
for (let skip = 0; skip < 1000; skip += 50) {
  await graphService.syncOutlookEmails({
    top: 50,
    skip,
  });

  // Wait between batches
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

## Troubleshooting

### Issue: Access Token Invalid

**Solution**: Ensure your token has the required permissions and hasn't expired.

```typescript
// Check token expiration
const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
const expiresAt = new Date(tokenPayload.exp * 1000);
console.log("Token expires:", expiresAt);
```

### Issue: Teams Messages Not Syncing

**Solution**: Verify the Teams channel exists and you have access.

```typescript
// List available channels first
const channels = await graphService.getTeamChannels(teamId);
console.log("Available channels:", channels);
```

### Issue: Safe Links Not Unwrapping

**Solution**: The parser handles most Safe Link patterns. If some aren't unwrapping, check the URL format:

```typescript
// Manual Safe Link parsing
const safeUrl = "https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com";
const match = safeUrl.match(/url=([^&]+)/);
if (match) {
  const originalUrl = decodeURIComponent(match[1]);
  console.log("Original URL:", originalUrl);
}
```

## Environment Variables

```bash
# .env.local
MICROSOFT_CLIENT_ID=your-app-client-id
MICROSOFT_TENANT_ID=your-tenant-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_ACCESS_TOKEN=your-access-token  # For testing
```

## Microsoft Graph API Quotas

Be aware of Microsoft's rate limits:
- **Outlook Mail**: 10,000 requests per 10 minutes
- **Teams Messages**: 500 requests per 10 minutes per app
- **Calendar Events**: 1,500 requests per 30 seconds

Implement backoff strategies:

```typescript
async function syncWithBackoff(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes("429") && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Rate limited, waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}
```

## Next Steps

1. **Set up Azure AD app** with required permissions
2. **Get access token** using MSAL or your auth library
3. **Run initial sync** of historical data
4. **Set up scheduled sync** (daily/hourly) via cron
5. **Enable real-time sync** via Microsoft Graph webhooks (future enhancement)

---

**For general email extraction documentation**, see [EMAIL-CONTEXT-EXTRACTION.md](./EMAIL-CONTEXT-EXTRACTION.md)

**Status**: ✅ Production-ready for Microsoft Teams & Outlook
**Last Updated**: January 2025
