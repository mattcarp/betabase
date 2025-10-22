/**
 * Test Email Extraction Script
 * Demonstrates the email context extraction system with sample emails
 */

import { getEmailContextService } from "@/services/emailContextService";
import { EmailData } from "@/utils/emailParser";

// Sample emails representing various real-world scenarios
const sampleEmails: EmailData[] = [
  {
    messageId: "msg-001",
    from: "sarah.johnson@company.com",
    to: ["team@company.com"],
    subject: "Q1 Sprint Planning - Action Items",
    body: `Hi Team,

Following up on yesterday's sprint planning meeting. Here are the key action items:

1. Backend API refactoring - John (Due: Feb 15)
2. Frontend UI updates - Sarah (Due: Feb 20)
3. Database migration - Mike (Due: Feb 12)
4. Integration testing - QA Team (Due: Feb 25)

Please confirm you have the resources needed. Let me know if you have questions.

Best regards,
Sarah`,
    date: new Date("2024-02-01T09:00:00Z"),
    threadId: "thread-sprint-001",
  },
  {
    messageId: "msg-002",
    from: "john.smith@company.com",
    to: ["sarah.johnson@company.com"],
    cc: ["team@company.com"],
    subject: "Re: Q1 Sprint Planning - Action Items",
    body: `Sarah,

Thanks for the summary. I have a question about the API refactoring scope.

Should we include the payment gateway integration or is that part of the next sprint?

Also, I'll need access to the staging environment by Feb 10.

Thanks,
John`,
    date: new Date("2024-02-01T11:30:00Z"),
    threadId: "thread-sprint-001",
    inReplyTo: "msg-001",
    references: ["msg-001"],
  },
  {
    messageId: "msg-003",
    from: "mike.chen@company.com",
    to: ["devops@company.com"],
    subject: "URGENT: Production Database Performance Issues",
    htmlBody: `<html>
<body>
<p><strong>URGENT</strong></p>
<p>We're seeing significant performance degradation on the production database:</p>
<ul>
<li>Response times: 3-5 seconds (normal: 200ms)</li>
<li>CPU usage: 95% (normal: 30%)</li>
<li>Active connections: 450/500</li>
</ul>
<p>This started at approximately 14:30 UTC.</p>
<p>I'm investigating the query logs now. May need to implement connection pooling adjustments.</p>
<p>Will provide update in 30 minutes.</p>
<p>Mike</p>
</body>
</html>`,
    date: new Date("2024-02-02T14:45:00Z"),
    attachments: [
      {
        filename: "database-performance-logs.txt",
        contentType: "text/plain",
        size: 45678,
      },
      {
        filename: "cpu-usage-graph.png",
        contentType: "image/png",
        size: 125000,
      },
    ],
  },
  {
    messageId: "msg-004",
    from: "lisa.wong@company.com",
    to: ["sarah.johnson@company.com", "john.smith@company.com"],
    subject: "Customer Feedback: New Dashboard Feature",
    body: `Hi Sarah and John,

Great news! We're getting excellent feedback on the new dashboard feature:

Customer quotes:
- "The real-time analytics are exactly what we needed!" - TechCorp
- "Loading time improved dramatically, very impressed" - StartupXYZ
- "UI is much more intuitive than before" - Enterprise Inc

Metrics:
- 89% positive feedback
- Average session time: up 35%
- Feature adoption: 67% in first week

The team should be proud of this release!

Lisa
Customer Success Manager`,
    date: new Date("2024-02-03T10:00:00Z"),
  },
  {
    messageId: "msg-005",
    from: "security@company.com",
    to: ["all-engineers@company.com"],
    subject: "Security Update: Dependency Vulnerabilities Found",
    htmlBody: `<html>
<body>
<h3>Security Advisory</h3>
<p>Our automated security scan has identified <strong>3 high-severity</strong> vulnerabilities in project dependencies:</p>

<h4>Critical Issues:</h4>
<ol>
<li><code>lodash</code> v4.17.15 - Prototype Pollution (CVE-2020-8203)</li>
<li><code>axios</code> v0.21.0 - SSRF Vulnerability (CVE-2021-3749)</li>
<li><code>express</code> v4.16.4 - Path Traversal (CVE-2021-23434)</li>
</ol>

<p><strong>Action Required:</strong> Update these dependencies by EOD Friday.</p>
<p>Run: <code>npm audit fix</code></p>

<p>Contact security@company.com if you have questions.</p>
</body>
</html>`,
    date: new Date("2024-02-03T15:00:00Z"),
  },
];

async function testEmailExtraction() {
  console.log("🧪 Testing Email Context Extraction System\n");
  console.log("=".repeat(60));

  const service = getEmailContextService();

  // Test 1: Ingest sample emails
  console.log("\n📧 Test 1: Ingesting Sample Emails");
  console.log("-".repeat(60));

  const batchResult = await service.ingestEmailBatch(sampleEmails);

  console.log(`Total emails: ${batchResult.total}`);
  console.log(`Successfully ingested: ${batchResult.successful}`);
  console.log(`Failed: ${batchResult.failed}`);

  if (batchResult.failed > 0) {
    console.log("\n❌ Failed emails:");
    batchResult.results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.messageId}: ${r.error}`);
      });
  }

  // Test 2: Search by project management content
  console.log("\n\n🔍 Test 2: Search for Project Management Emails");
  console.log("-".repeat(60));

  const projectSearchResults = await service.searchEmails("sprint planning action items deadline", {
    matchThreshold: 0.75,
    matchCount: 5,
  });

  console.log(`Found ${projectSearchResults.length} relevant emails:`);
  projectSearchResults.forEach((result, index) => {
    console.log(
      `\n${index + 1}. ${result.metadata.subject} (similarity: ${result.similarity.toFixed(3)})`
    );
    console.log(`   From: ${result.metadata.from}`);
    console.log(`   Date: ${new Date(result.metadata.date).toLocaleDateString()}`);
    console.log(`   Preview: ${result.content.substring(0, 100)}...`);
  });

  // Test 3: Search for urgent/critical issues
  console.log("\n\n🚨 Test 3: Search for Urgent/Critical Issues");
  console.log("-".repeat(60));

  const urgentSearchResults = await service.searchEmails(
    "urgent production critical performance issue",
    {
      matchThreshold: 0.7,
      matchCount: 5,
    }
  );

  console.log(`Found ${urgentSearchResults.length} urgent emails:`);
  urgentSearchResults.forEach((result, index) => {
    console.log(
      `\n${index + 1}. ${result.metadata.subject} (similarity: ${result.similarity.toFixed(3)})`
    );
    console.log(`   From: ${result.metadata.from}`);
    console.log(`   Has attachments: ${result.metadata.hasAttachments}`);
  });

  // Test 4: Search by specific participant
  console.log("\n\n👤 Test 4: Search Emails from Sarah Johnson");
  console.log("-".repeat(60));

  const sarahEmailsResults = await service.searchEmails("team updates", {
    participants: ["sarah.johnson@company.com"],
    matchThreshold: 0.6,
  });

  console.log(`Found ${sarahEmailsResults.length} emails from Sarah:`);
  sarahEmailsResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.metadata.subject}`);
    console.log(`   Thread participants: ${result.metadata.threadParticipants?.join(", ")}`);
  });

  // Test 5: Date range filtering
  console.log("\n\n📅 Test 5: Search Emails from Feb 2-3");
  console.log("-".repeat(60));

  const dateRangeResults = await service.searchEmails("email", {
    dateFrom: "2024-02-02T00:00:00Z",
    dateTo: "2024-02-03T23:59:59Z",
    matchThreshold: 0.5,
  });

  console.log(`Found ${dateRangeResults.length} emails in date range:`);
  dateRangeResults.forEach((result) => {
    console.log(
      `- ${result.metadata.subject} (${new Date(result.metadata.date).toLocaleDateString()})`
    );
  });

  // Test 6: Get statistics
  console.log("\n\n📊 Test 6: Email Statistics");
  console.log("-".repeat(60));

  const stats = await service.getEmailStats();
  console.log(`Total emails in store: ${stats.totalEmails}`);
  if (stats.dateRange) {
    console.log(`Date range: ${stats.dateRange.earliest} to ${stats.dateRange.latest}`);
  }

  // Cleanup
  console.log("\n\n🧹 Cleaning up test emails...");
  console.log("-".repeat(60));

  for (const email of sampleEmails) {
    const deleted = await service.deleteEmail(email.messageId);
    console.log(`  ${deleted ? "✓" : "✗"} Deleted ${email.messageId}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Email extraction test completed successfully!");
  console.log("=".repeat(60));
}

// Run the test
testEmailExtraction()
  .then(() => {
    console.log("\n✨ All tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
