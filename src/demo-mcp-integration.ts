/**
 * DEMO: ElevenLabs MCP Integration with AOMA Mesh
 *
 * This demo script shows how to:
 * 1. Register the AOMA Mesh MCP server with ElevenLabs
 * 2. Test server health and functionality
 * 3. List registered servers
 * 4. Associate server with conversational AI agent
 */

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

import { createElevenLabsMCPService } from "./services/elevenlabsMcpRegistration";

async function demoMCPIntegration() {
  console.log("🚀 Starting ElevenLabs MCP Integration Demo...");
  console.log("=".repeat(60));

  // Use existing ElevenLabs configuration
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  if (!apiKey) {
    console.error("❌ ELEVENLABS_API_KEY not found in environment");
    return;
  }

  console.log(`🔑 Using existing ElevenLabs setup:`);
  console.log(`   Agent ID: ${agentId}`);
  console.log(`   API Key: ${apiKey.substring(0, 10)}...`);

  // Create MCP service instance
  const mcpService = createElevenLabsMCPService(apiKey);

  try {
    // Step 1: Check AOMA Mesh server health
    console.log("\n📋 Step 1: Checking AOMA Mesh Server Health...");
    const healthCheck = await mcpService.checkAomaMeshHealth();

    if (healthCheck.healthy) {
      console.log(
        `✅ AOMA Mesh server is healthy (${Math.round(healthCheck.responseTime)}ms)`,
      );
      console.log("📊 Health details:", healthCheck.details);
    } else {
      console.log(
        `❌ AOMA Mesh server is unhealthy (${Math.round(healthCheck.responseTime)}ms)`,
      );
      console.log("📊 Error details:", healthCheck.details);
      return;
    }

    // Step 2: Test AOMA Mesh tools
    console.log("\n🧪 Step 2: Testing AOMA Mesh Tools...");
    const toolTest = await mcpService.testAomaMeshTools();

    if (toolTest.success) {
      console.log("✅ All AOMA Mesh tools working correctly");
      console.log("🔧 Available tools:");

      if (toolTest.results.tools_list?.result?.tools) {
        toolTest.results.tools_list.result.tools.forEach((tool: any) => {
          console.log(`   - ${tool.name}: ${tool.description}`);
        });
      }

      if (toolTest.results.aoma_query?.result?.content?.[0]?.text) {
        const queryResult = JSON.parse(
          toolTest.results.aoma_query.result.content[0].text,
        );
        console.log(
          "💬 Sample AOMA query result:",
          queryResult.response.substring(0, 100) + "...",
        );
      }
    } else {
      console.log("❌ Some AOMA Mesh tools failed:", toolTest.results.error);
    }

    // Step 3: List existing MCP servers
    console.log("\n📋 Step 3: Checking Existing MCP Servers...");
    const existingServers = await mcpService.listMcpServers();

    console.log(
      `📊 Found ${existingServers.mcp_servers.length} registered MCP servers:`,
    );
    existingServers.mcp_servers.forEach((server) => {
      console.log(`   - ${server.config.name} (${server.id})`);
      console.log(`     URL: ${server.config.url}`);
      console.log(`     Transport: ${server.config.transport}`);
      console.log(
        `     Tools: ${server.config.tool_approval_hashes?.length || 0}`,
      );
    });

    // Step 4: Register/ensure AOMA Mesh server
    console.log("\n🔧 Step 4: Ensuring AOMA Mesh Server Registration...");
    const registeredServer = await mcpService.ensureAomaMeshServerRegistered();

    console.log("✅ AOMA Mesh MCP Server Details:");
    console.log(`   Server ID: ${registeredServer.id}`);
    console.log(`   Name: ${registeredServer.config.name}`);
    console.log(`   URL: ${registeredServer.config.url}`);
    console.log(`   Transport: ${registeredServer.config.transport}`);
    console.log(
      `   Approval Policy: ${registeredServer.config.approval_policy}`,
    );
    console.log(
      `   Tools: ${registeredServer.config.tool_approval_hashes?.length || 0}`,
    );

    // Log server ID for environment configuration
    console.log("\n💡 Configuration Update Required:");
    console.log("Add this to your .env file:");
    console.log(`NEXT_PUBLIC_ELEVENLABS_MCP_SERVER_ID=${registeredServer.id}`);

    // Step 5: Integration instructions
    console.log("\n🎯 Next Steps for Complete Integration:");
    console.log("1. ✅ MCP Server registered successfully");
    console.log("2. 📝 Update your .env file with the server ID above");
    console.log("3. 🔗 Associate this MCP server with your ElevenLabs agent:");
    console.log("   - Go to https://elevenlabs.io/app/conversational-ai");
    console.log("   - Edit your agent configuration");
    console.log("   - Add the registered MCP server");
    console.log("4. 🧪 Test the integration by asking your agent about AOMA");

    console.log("\n✨ Demo completed successfully!");
  } catch (error) {
    console.error("❌ Demo failed:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("401") ||
        error.message.includes("unauthorized")
      ) {
        console.log("🔑 Authentication issue - check your ElevenLabs API key");
      } else if (
        error.message.includes("403") ||
        error.message.includes("forbidden")
      ) {
        console.log("🚫 Permission issue - ensure your API key has MCP access");
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        console.log("🌐 Network issue - check internet connection");
      }
    }
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demoMCPIntegration().catch(console.error);
}

export { demoMCPIntegration };
