import { elevenLabsMCPService } from "./src/services/elevenLabsMCPService";

async function runIntegration() {
  console.log("🚀 Starting ElevenLabs MCP Integration...\n");
  console.log("=".repeat(60));

  // Get configuration summary
  const config = elevenLabsMCPService.getConfigSummary();
  console.log("\n📋 Configuration:");
  console.log(`   API Key: ${config.apiKey}`);
  console.log(`   Agent ID: ${config.agentId}`);
  console.log(`   Lambda URL: ${config.lambdaUrl}`);

  try {
    // Step 1: Validate credentials
    console.log("\n🔐 Step 1: Validating ElevenLabs credentials...");
    const validation = await elevenLabsMCPService.validateCredentials();

    if (!validation.valid) {
      console.error("❌ Credential validation failed:", validation.error);
      return;
    }

    console.log("✅ Credentials validated successfully");
    if (validation.userInfo) {
      console.log(`   User: ${validation.userInfo.first_name} ${validation.userInfo.last_name}`);
      console.log(`   Email: ${validation.userInfo.email}`);
    }

    // Step 2: List existing MCP servers
    console.log("\n📋 Step 2: Checking existing MCP servers...");
    const serverList = await elevenLabsMCPService.listMcpServers();

    if (serverList.success && serverList.servers && Array.isArray(serverList.servers)) {
      console.log(`   Found ${serverList.servers.length} existing MCP server(s)`);
      serverList.servers.forEach((server: any) => {
        console.log(`   - ${server.name} (ID: ${server.id})`);
      });
    } else {
      console.log(`   Found 0 existing MCP servers`);
    }

    // Step 3: Get agent details
    console.log("\n🤖 Step 3: Getting agent details...");
    const agentDetails = await elevenLabsMCPService.getAgentDetails();

    if (agentDetails.success && agentDetails.agent) {
      console.log("✅ Agent details retrieved");
      console.log(`   Name: ${agentDetails.agent.name || "N/A"}`);
      console.log(`   Associated MCP servers: ${agentDetails.agent.mcp_servers?.length || 0}`);
    }

    // Step 4: Complete registration (register + associate)
    console.log("\n🔧 Step 4: Registering and associating MCP server...");
    const result = await elevenLabsMCPService.completeRegistration();

    if (result.success) {
      console.log("\n✅ MCP SERVER INTEGRATION SUCCESSFUL!");
      console.log(`   Server ID: ${result.serverId}`);
      console.log(`   Associated with agent: ${result.associated ? "YES ✅" : "NO ❌"}`);

      if (result.details?.registration) {
        console.log("\n📊 Registration Details:");
        console.log(`   Name: ${result.details.registration.name}`);
        console.log(`   URL: ${result.details.registration.url}`);
        console.log(`   Transport: ${result.details.registration.transport}`);
        console.log(`   Status: ${result.details.registration.status}`);
      }

      if (result.details?.association) {
        console.log("\n🔗 Association Details:");
        console.log(`   Agent ID: ${result.details.association.agent_id}`);
        console.log(`   MCP Server ID: ${result.details.association.mcp_server_id}`);
        console.log(`   Associated at: ${result.details.association.associated_at}`);
      }
    } else {
      console.error("\n❌ MCP SERVER INTEGRATION FAILED");
      console.error(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error("\n❌ Integration error:", error);
    throw error;
  }
}

// Run the integration
runIntegration()
  .then(() => {
    console.log("\n" + "=".repeat(60));
    console.log("✨ Integration process completed!\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
