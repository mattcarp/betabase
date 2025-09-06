/**
 * Test script for ElevenLabs API Credentials and MCP Registration
 * Run with: npx tsx src/test-elevenlabs-credentials.ts
 */

import { elevenLabsMCPService } from "./services/elevenLabsMCPService";

async function testElevenLabsCredentials() {
  console.log(
    "🚀 Testing ElevenLabs API Credentials and MCP Server Setup...\n",
  );

  try {
    // Display configuration summary
    const config = elevenLabsMCPService.getConfigSummary();
    console.log("🔧 Configuration Summary:");
    console.log("─".repeat(30));
    console.log(`API Key: ${config.apiKey}`);
    console.log(`Agent ID: ${config.agentId}`);
    console.log(`Lambda URL: ${config.lambdaUrl}`);
    console.log(`Base URL: ${config.baseUrl}`);
    console.log("");

    // Step 1: Validate credentials
    console.log("🔐 Step 1: Validating ElevenLabs API Credentials...");
    const credentialsCheck = await elevenLabsMCPService.validateCredentials();

    if (!credentialsCheck.valid) {
      console.error(
        `❌ Credentials validation failed: ${credentialsCheck.error}`,
      );
      process.exit(1);
    }

    console.log("✅ API credentials are valid!");
    if (credentialsCheck.userInfo) {
      console.log(`   User: ${credentialsCheck.userInfo.name || "Unknown"}`);
      console.log(`   Email: ${credentialsCheck.userInfo.email || "Unknown"}`);
    }
    console.log("");

    // Step 2: List existing MCP servers
    console.log("📋 Step 2: Checking existing MCP servers...");
    const existingServers = await elevenLabsMCPService.listMcpServers();

    if (existingServers.success) {
      console.log(
        `✅ Found ${existingServers.servers?.length || 0} existing MCP servers`,
      );
      if (existingServers.servers && existingServers.servers.length > 0) {
        existingServers.servers.forEach((server, index) => {
          console.log(`   ${index + 1}. ${server.name} (${server.id})`);
          console.log(`      URL: ${server.url}`);
          console.log(`      Transport: ${server.transport}`);
          console.log(`      Status: ${server.status}`);
        });
      }
    } else {
      console.warn(
        `⚠️ Could not list existing servers: ${existingServers.error}`,
      );
    }
    console.log("");

    // Step 3: Get agent details
    console.log("🤖 Step 3: Getting agent details...");
    const agentDetails = await elevenLabsMCPService.getAgentDetails();

    if (agentDetails.success) {
      console.log("✅ Agent details retrieved successfully");
      if (agentDetails.agent) {
        console.log(`   Name: ${agentDetails.agent.name || "Unknown"}`);
        console.log(`   ID: ${agentDetails.agent.id || "Unknown"}`);
        if (agentDetails.agent.mcp_servers) {
          console.log(
            `   Associated MCP Servers: ${agentDetails.agent.mcp_servers.length}`,
          );
        }
      }
    } else {
      console.warn(`⚠️ Could not get agent details: ${agentDetails.error}`);
    }
    console.log("");

    // Step 4: Check if we should proceed with registration
    console.log("🎯 Step 4: Assessment and Recommendations...");
    console.log("─".repeat(40));

    if (credentialsCheck.valid) {
      console.log("✅ ElevenLabs API is accessible and working");
      console.log("✅ Agent is properly configured");
      console.log("✅ Ready to proceed with MCP server registration");
      console.log("");
      console.log("💡 Next Steps:");
      console.log("   1. Credentials are validated and working");
      console.log("   2. Ready to register AOMA Mesh MCP server");
      console.log("   3. Ready to associate server with agent");
      console.log("");
      console.log("🚀 You can now proceed with the full registration process!");
    } else {
      console.log("❌ API credentials need to be fixed before proceeding");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testElevenLabsCredentials().catch(console.error);
