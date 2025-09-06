/**
 * Test ElevenLabs API Capabilities
 *
 * This script tests various ElevenLabs API endpoints to understand
 * what features are available with your current API key.
 */

import dotenv from "dotenv";
dotenv.config();

async function testElevenLabsCapabilities() {
  console.log("🔍 Testing ElevenLabs API Capabilities...");
  console.log("=".repeat(60));

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  if (!apiKey) {
    console.error("❌ ELEVENLABS_API_KEY not found in environment");
    return;
  }

  console.log(`🔑 API Key: ${apiKey.substring(0, 15)}...`);
  console.log(`🤖 Agent ID: ${agentId}`);

  const baseUrl = "https://api.elevenlabs.io/v1";

  // Test 1: User info
  console.log("\n📋 Test 1: User Information");
  try {
    const response = await fetch(`${baseUrl}/user`, {
      headers: { "xi-api-key": apiKey },
    });

    if (response.ok) {
      const userData = await response.json();
      console.log("✅ User data retrieved successfully");
      console.log(`   - Name: ${userData.first_name} ${userData.last_name}`);
      console.log(`   - Email: ${userData.email}`);
      console.log(
        `   - Subscription: ${userData.subscription?.tier || "Unknown"}`,
      );
      console.log(
        `   - Character count: ${userData.subscription?.character_count || 0}`,
      );
      console.log(
        `   - Character limit: ${userData.subscription?.character_limit || 0}`,
      );
      console.log(
        `   - Can extend character limit: ${userData.subscription?.can_extend_character_limit || false}`,
      );
      console.log(
        `   - Can use instant voice cloning: ${userData.subscription?.can_use_instant_voice_cloning || false}`,
      );
      console.log(
        `   - Can use professional voice cloning: ${userData.subscription?.can_use_professional_voice_cloning || false}`,
      );
    } else {
      console.log(
        `❌ Failed to get user data: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.log("❌ Error getting user data:", error);
  }

  // Test 2: Available voices
  console.log("\n🎵 Test 2: Available Voices");
  try {
    const response = await fetch(`${baseUrl}/voices`, {
      headers: { "xi-api-key": apiKey },
    });

    if (response.ok) {
      const voicesData = await response.json();
      console.log(`✅ Found ${voicesData.voices.length} available voices`);
      voicesData.voices.slice(0, 3).forEach((voice: any) => {
        console.log(`   - ${voice.name} (${voice.voice_id})`);
      });
    } else {
      console.log(
        `❌ Failed to get voices: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.log("❌ Error getting voices:", error);
  }

  // Test 3: Conversational AI agents
  console.log("\n🤖 Test 3: Conversational AI Agents");
  try {
    const response = await fetch(`${baseUrl}/convai/agents`, {
      headers: { "xi-api-key": apiKey },
    });

    if (response.ok) {
      const agentsData = await response.json();
      console.log(
        `✅ Found ${agentsData.agents?.length || 0} conversational AI agents`,
      );
      if (agentsData.agents) {
        agentsData.agents.forEach((agent: any) => {
          console.log(`   - ${agent.name} (${agent.agent_id})`);
        });
      }
    } else {
      console.log(
        `❌ Failed to get agents: ${response.status} ${response.statusText}`,
      );
      const errorText = await response.text();
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log("❌ Error getting agents:", error);
  }

  // Test 4: MCP servers endpoint availability
  console.log("\n🔌 Test 4: MCP Servers Endpoint");
  try {
    const response = await fetch(`${baseUrl}/convai/mcp-servers`, {
      headers: { "xi-api-key": apiKey },
    });

    console.log(
      `📊 MCP endpoint response: ${response.status} ${response.statusText}`,
    );
    const responseText = await response.text();

    if (response.ok) {
      console.log("✅ MCP servers endpoint is accessible");
      const mcpData = JSON.parse(responseText);
      console.log(`   Found ${mcpData.mcp_servers?.length || 0} MCP servers`);
    } else {
      console.log("❌ MCP servers endpoint not accessible");
      console.log(`   Response: ${responseText}`);

      if (responseText.includes("convai_mcp_servers_disabled")) {
        console.log(
          "   🔒 MCP server registration is disabled for your account",
        );
      }
    }
  } catch (error) {
    console.log("❌ Error checking MCP endpoint:", error);
  }

  // Test 5: Agent-specific info
  if (agentId) {
    console.log("\n🎯 Test 5: Specific Agent Details");
    try {
      const response = await fetch(`${baseUrl}/convai/agents/${agentId}`, {
        headers: { "xi-api-key": apiKey },
      });

      if (response.ok) {
        const agentData = await response.json();
        console.log("✅ Agent details retrieved successfully");
        console.log(`   - Name: ${agentData.name}`);
        console.log(`   - Language: ${agentData.language}`);
        console.log(`   - Voice ID: ${agentData.voice_id}`);
        console.log(`   - LLM: ${agentData.llm?.type || "Unknown"}`);
        console.log(`   - Tools enabled: ${agentData.tools?.length || 0}`);
      } else {
        console.log(
          `❌ Failed to get agent details: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.log("❌ Error getting agent details:", error);
    }
  }

  console.log("\n✨ Capability test completed!");
  console.log("\n💡 Next Steps:");
  console.log(
    "1. If MCP servers are disabled, contact ElevenLabs support to enable them",
  );
  console.log("2. Consider upgrading your subscription if needed");
  console.log(
    "3. Alternatively, use direct MCP integration without ElevenLabs registration",
  );
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testElevenLabsCapabilities().catch(console.error);
}

export { testElevenLabsCapabilities };
