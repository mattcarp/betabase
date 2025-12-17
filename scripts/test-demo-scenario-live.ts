/**
 * Live Test: Demo Scenario 1 - Asset Upload Sorting Failed
 * 
 * Tests the full RAG pipeline with intent classification to ensure
 * the AI finds the JIRA ticket and uses code knowledge appropriately.
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/test-demo-scenario-live.ts
 */

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  🧪 LIVE TEST: Demo Scenario - "Asset Upload Sorting Failed"       ║
║  Testing full RAG pipeline with intent classification              ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  const queries = [
    {
      name: "Primary Demo Query",
      query: "I'm getting an 'Asset Upload Sorting Failed' error when uploading files. What's going on?",
    },
    {
      name: "Aspera Error Query", 
      query: "I got an Aspera error code 36 - disk write failed. What does this mean?",
    },
    {
      name: "360RA Error Query",
      query: "I'm trying to register a 360 Reality Audio track and getting 'UploadPublishFailed'. Help!",
    },
    {
      name: "Code Request Follow-up",
      query: "Can you show me where in the code this upload sorting happens?",
    },
  ];

  for (const { name, query } of queries) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📝 ${name}`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`\nUser: "${query}"\n`);
    console.log('─'.repeat(70));
    console.log('AI Response:');
    console.log('─'.repeat(70));

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
          model: 'gemini-2.0-flash',
          temperature: 0.3,
          mode: 'full',
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        let fullResponse = '';
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = new TextDecoder().decode(value);
            fullResponse += chunk;
          }
          
          // Parse SSE stream - AI SDK v6 uses multiple formats
          // Text chunks: 0:"text" or just plain text after data:
          let extractedText = '';
          
          // Try to extract text from various SSE formats
          // Format 1: 0:"escaped text"
          const textMatches = fullResponse.match(/0:"([^"]*)"/g);
          if (textMatches) {
            extractedText = textMatches.map(m => {
              const inner = m.slice(3, -1);
              return inner
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            }).join('');
          }
          
          // Format 2: Look for readable text patterns
          if (!extractedText) {
            // Extract any readable content from the response
            const readable = fullResponse
              .replace(/[0-9a-f]:"[^"]*"/g, '') // Remove metadata chunks
              .replace(/d:\{[^}]+\}/g, '') // Remove data chunks
              .replace(/\n+/g, ' ')
              .trim();
            if (readable.length > 50) {
              extractedText = 'Raw content detected (length: ' + fullResponse.length + ')';
            }
          }
          
          // Show what we got
          if (extractedText && extractedText.length > 20) {
            console.log('\n' + extractedText.substring(0, 1500));
            if (extractedText.length > 1500) {
              console.log('\n... [truncated] ...');
            }
          } else {
            // Show raw response for debugging
            console.log('\nRaw response (first 800 chars):');
            console.log(fullResponse.substring(0, 800));
          }
          
          // Check if it mentions JIRA tickets
          const mentionsJira = /ITSM-|DPSA-|AOMA-|AOMA2-/i.test(fullResponse);
          const mentionsCode = /\.ts|reducers|\.component|lines?\s*\d+/i.test(fullResponse);
          
          console.log('\n' + '─'.repeat(70));
          console.log('Analysis:');
          console.log(`  • Mentions JIRA ticket: ${mentionsJira ? '✅ Yes' : '❌ No'}`);
          console.log(`  • Mentions code files: ${mentionsCode ? '✅ Yes' : '❌ No'}`);
          console.log(`  • Response length: ${fullResponse.length} chars`);
        }
      } else {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Error body:', text.substring(0, 500));
      }
    } catch (error: any) {
      console.log(`❌ Request failed: ${error.message}`);
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  ✅ Live Test Complete!                                            ║
║  Review responses above for demo quality                           ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
}

main().catch(console.error);

