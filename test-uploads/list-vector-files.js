// List files in the assistant's vector store
const { OpenAI } = require('openai');

const apiKey = process.env.OPENAI_API_KEY;
const client = new OpenAI({ apiKey });

async function listVectorStoreFiles() {
  try {
    const assistantId = 'asst_VvOHL1c4S6YapYKun4mY29fM';
    
    // Get assistant
    const assistant = await client.beta.assistants.retrieve(assistantId);
    console.log('Assistant ID:', assistant.id);
    console.log('Assistant Name:', assistant.name);
    
    // Get vector store ID
    const vectorStoreId = assistant.tool_resources?.file_search?.vector_store_ids?.[0];
    console.log('Vector Store ID:', vectorStoreId);
    
    if (vectorStoreId) {
      // List files in vector store
      const files = await client.beta.vectorStores.files.list(vectorStoreId);
      console.log('\nFiles in vector store:');
      console.log('Total files:', files.data.length);
      
      for (const file of files.data) {
        const fileDetails = await client.files.retrieve(file.id);
        console.log(`\n- ${fileDetails.filename}`);
        console.log(`  ID: ${file.id}`);
        console.log(`  Status: ${file.status}`);
        console.log(`  Size: ${fileDetails.bytes} bytes`);
        console.log(`  Created: ${new Date(fileDetails.created_at * 1000).toLocaleString()}`);
      }
    } else {
      console.log('No vector store found for this assistant');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listVectorStoreFiles();