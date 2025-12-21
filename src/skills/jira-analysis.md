# Jira Analysis Skill

When the knowledge mentions Jira tickets:

## CRITICAL: Ticket Link Formatting (MANDATORY)

**YOU MUST format ALL ticket references as markdown hyperlinks. NEVER show tickets as plain text.**

For ANY ticket (AOMA-*, ITSM-*, DPSA-*, etc.), use this EXACT format:
```
[TICKET-KEY](https://jira.sonymusic.com/browse/TICKET-KEY) - Ticket Title
```

Example - ALWAYS format like this:
- [ITSM-54132](https://jira.sonymusic.com/browse/ITSM-54132) - Asset Cover Art Issue
- [AOMA-1234](https://jira.sonymusic.com/browse/AOMA-1234) - Upload timeout on large files

WRONG (never do this):
- ITSM-54132 - Asset Cover Art Issue
- AOMA-1234 - Upload timeout

## Response Guidelines

1. Mention 2-4 specific ticket numbers with their titles
2. **ALWAYS** format tickets as markdown hyperlinks `[KEY](url) - title`
3. Summarize themes rather than dumping raw data
4. If asked about counts or specific numbers you don't have, say so briefly

## Ticket Display Format

Display tickets in a visually appealing format with ticket key as a clickable link:

**Related Tickets:**
- [AOMA-1234](https://jira.sonymusic.com/browse/AOMA-1234) - Asset ingestion timeout on large files
- [AOMA-5678](https://jira.sonymusic.com/browse/AOMA-5678) - Upload progress indicator not updating
- [ITSM-9012](https://jira.sonymusic.com/browse/ITSM-9012) - Memory spike during batch processing

The markdown link format `[TICKET-KEY](url)` makes tickets appear clickable, even if the user needs VPN access.

## Good Example
"I found several related tickets in JIRA:

**Related Tickets:**
- [AOMA-1234](https://jira.sonymusic.com/browse/AOMA-1234) - Asset ingestion timeout on large files
- [AOMA-5678](https://jira.sonymusic.com/browse/AOMA-5678) - Upload progress stuck at 90%

These suggest the issue is related to the chunked upload handler. The timeout seems to occur when processing files over 500MB."

## Bad Example
"Here are all the tickets I found: AOMA-1234, AOMA-1235, AOMA-1236, AOMA-1237..."

## Ticket References
- Always use the ticket key format (PROJECT-NUMBER)
- Always include the ticket title after the link
- Use the JIRA URL format: `https://jira.sonymusic.com/browse/TICKET-KEY`
- For sprint status queries, focus on blockers and progress

## Troubleshooting Flow

When a user reports a problem:

1. **Acknowledge the problem** - Show you understand
2. **Surface relevant tickets** - Display 2-4 related JIRA tickets with titles as links
3. **Summarize the issue** - Explain what the tickets reveal about the root cause
4. **Offer code context** - If you have relevant code in knowledge, offer to show it:
   - "I can see where this might be happening in the codebase. Would you like me to show you the relevant code?"
   - "The implementation is in the upload handler. Want me to show the specific function?"

## Code Display Integration

When showing code related to a JIRA issue, use the `language:filepath` format:

```typescript:src/services/uploadHandler.ts
// Show the relevant code snippet here
```

This enables:
- Syntax highlighting (Tokyo Night theme)
- File path header
- Line numbers
- Copy button

## Demo Mode

When user mentions "demo" or "showing this to someone":
- Make ticket links extra prominent
- Keep explanations concise but informative
- Offer code display proactively if relevant
