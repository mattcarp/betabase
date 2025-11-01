#!/usr/bin/env node

/**
 * Get Actual AOMA Response
 * Simple test to see real AI responses
 */

async function getResponse(query) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`❓ Query: "${query}"`);
  console.log(`${"=".repeat(70)}\n`);

  const startTime = Date.now();

  const response = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: query }],
      model: "gpt-4o-mini",
    }),
  });

  let fullText = "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "text-delta" && data.delta) {
            fullText += data.delta;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }

  const duration = Date.now() - startTime;

  console.log(`⏱️  Duration: ${duration}ms`);
  console.log(`📏 Length: ${fullText.length} chars\n`);
  console.log(`📝 RESPONSE:`);
  console.log(`${"─".repeat(70)}`);
  console.log(fullText);
  console.log(`${"─".repeat(70)}\n`);

  return { query, response: fullText, duration };
}

async function main() {
  const queries = [
    "How do I upload assets to AOMA?",
    "What metadata fields are required for audio assets?",
    "How does AOMA registration workflow work?",
  ];

  console.log("🚀 AOMA Response Quality - Manual Test\n");

  for (const query of queries) {
    await getResponse(query);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("✨ Test complete!\n");
}

main().catch(console.error);

