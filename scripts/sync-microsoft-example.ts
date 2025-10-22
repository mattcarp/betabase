/**
 * Example Microsoft Teams/Outlook Sync Script
 * Demonstrates syncing emails from Outlook and Teams
 */

import { getMicrosoftGraphService } from "@/services/microsoftGraphService";

// CONFIGURATION
const ACCESS_TOKEN = process.env.MICROSOFT_ACCESS_TOKEN || "";

if (!ACCESS_TOKEN) {
  console.error("❌ MICROSOFT_ACCESS_TOKEN environment variable is required");
  console.error("\nTo get an access token:");
  console.error("1. Register app in Azure AD: https://portal.azure.com");
  console.error("2. Grant permissions: Mail.Read, ChannelMessage.Read.All, Calendars.Read");
  console.error("3. Get token using MSAL or OAuth2");
  console.error("\nExample with MSAL:");
  console.error("  npm install @azure/msal-node");
  console.error("  // See docs/MICROSOFT-EMAIL-INTEGRATION.md for code example");
  process.exit(1);
}

async function syncMicrosoftData() {
  console.log("🚀 Microsoft Teams/Outlook Sync");
  console.log("=" .repeat(60));

  const graphService = getMicrosoftGraphService({
    accessToken: ACCESS_TOKEN,
  });

  try {
    // Step 1: Sync Outlook Inbox
    console.log("\n📧 Step 1: Syncing Outlook Inbox");
    console.log("-".repeat(60));

    const outlookResult = await graphService.syncOutlookEmails({
      folder: "inbox",
      top: 50, // Fetch last 50 emails
      orderBy: "receivedDateTime desc",
    });

    console.log(`✅ Outlook: ${outlookResult.successful} emails synced`);
    if (outlookResult.failed > 0) {
      console.log(`⚠️  ${outlookResult.failed} emails failed`);
      outlookResult.errors.forEach((err) => {
        console.log(`   - ${err.messageId}: ${err.error}`);
      });
    }

    // Step 2: List and sync Teams
    console.log("\n🤝 Step 2: Syncing Teams Messages");
    console.log("-".repeat(60));

    const teams = await graphService.getUserTeams();
    console.log(`Found ${teams.length} teams:`);
    teams.forEach((team) => {
      console.log(`  - ${team.displayName} (${team.id})`);
    });

    if (teams.length > 0) {
      // Sync first team's channels (as example)
      const firstTeam = teams[0];
      console.log(`\nSyncing channels from: ${firstTeam.displayName}`);

      const channels = await graphService.getTeamChannels(firstTeam.id);
      console.log(`Found ${channels.length} channels:`);

      for (const channel of channels.slice(0, 2)) {
        // Sync first 2 channels
        console.log(`\n  📱 Syncing: ${channel.displayName}`);

        const teamsResult = await graphService.syncTeamsMessages(
          firstTeam.id,
          channel.id,
          { top: 20 }
        );

        console.log(
          `  ✅ ${teamsResult.successful} messages synced from ${channel.displayName}`
        );
        if (teamsResult.failed > 0) {
          console.log(`  ⚠️  ${teamsResult.failed} messages failed`);
        }
      }
    }

    // Step 3: Sync upcoming meetings
    console.log("\n📅 Step 3: Syncing Calendar Meetings");
    console.log("-".repeat(60));

    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const meetingsResult = await graphService.syncMeetings({
      startDateTime: now.toISOString(),
      endDateTime: nextWeek.toISOString(),
      top: 20,
    });

    console.log(`✅ Meetings: ${meetingsResult.successful} synced`);
    if (meetingsResult.failed > 0) {
      console.log(`⚠️  ${meetingsResult.failed} meetings failed`);
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ Microsoft Sync Complete!");
    console.log("=".repeat(60));

    const totalSuccessful =
      outlookResult.successful +
      (teams.length > 0 ? 20 : 0) + // Rough estimate from Teams
      meetingsResult.successful;

    const totalFailed =
      outlookResult.failed +
      (teams.length > 0 ? 0 : 0) +
      meetingsResult.failed;

    console.log(`\n📊 Summary:`);
    console.log(`   Total synced: ${totalSuccessful}`);
    console.log(`   Total failed: ${totalFailed}`);

    // Demonstrate search
    console.log("\n🔍 Testing Search...");
    console.log("-".repeat(60));

    const { getEmailContextService } = await import(
      "@/services/emailContextService"
    );
    const emailService = getEmailContextService();

    const searchResults = await emailService.searchEmails(
      "meeting project update",
      {
        matchThreshold: 0.7,
        matchCount: 5,
      }
    );

    console.log(`Found ${searchResults.length} relevant items:`);
    searchResults.slice(0, 3).forEach((result, index) => {
      console.log(
        `\n${index + 1}. ${result.metadata.subject} (similarity: ${result.similarity.toFixed(3)})`
      );
      console.log(`   From: ${result.metadata.from}`);
      console.log(`   Date: ${new Date(result.metadata.date).toLocaleDateString()}`);
      if (result.metadata.isTeamsMessage) {
        console.log(`   📱 Teams: ${result.metadata.teamName} > ${result.metadata.teamsChannel}`);
      }
      if (result.metadata.isMeeting) {
        console.log(`   📅 Meeting at ${result.metadata.meetingTime?.start}`);
      }
      if (result.metadata.urgencyScore >= 7) {
        console.log(`   ⚠️  High urgency: ${result.metadata.urgencyScore}/10`);
      }
    });

    console.log("\n✨ Sync and search completed successfully!");
  } catch (error) {
    console.error("\n❌ Error during sync:", error);
    if (error instanceof Error) {
      if (error.message.includes("401")) {
        console.error("\n🔑 Authentication failed. Please check:");
        console.error("   - Access token is valid and not expired");
        console.error("   - Token has required permissions");
        console.error("   - Token is for the correct tenant");
      } else if (error.message.includes("403")) {
        console.error("\n🚫 Permission denied. Please ensure:");
        console.error("   - App has Mail.Read permission");
        console.error("   - App has ChannelMessage.Read.All permission");
        console.error("   - App has Calendars.Read permission");
        console.error("   - Permissions are granted by admin");
      } else if (error.message.includes("429")) {
        console.error("\n⏱️  Rate limit exceeded. Please:");
        console.error("   - Wait a few minutes before retrying");
        console.error("   - Reduce the 'top' parameter");
        console.error("   - Implement backoff strategy");
      }
    }
    process.exit(1);
  }
}

// Run the sync
syncMicrosoftData()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
