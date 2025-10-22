/**
 * OpenAI Embedding Generation Utility
 *
 * Generates vector embeddings for text using OpenAI's embedding models.
 * Used for semantic search in JIRA tickets, documents, and code.
 *
 * @module utils/embeddings/openai
 */

const OpenAI = require("openai");

/**
 * Generate embedding for a single text
 *
 * @param {string} text - Text to embed
 * @param {string} model - OpenAI embedding model (default: text-embedding-3-small)
 * @returns {Promise<number[]>} - Embedding vector
 */
async function generateEmbedding(text, model = "text-embedding-3-small") {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set in environment!");
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty text");
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.embeddings.create({
      model,
      input: text.substring(0, 8000), // Limit to 8k chars to stay under token limit
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("❌ Failed to generate embedding:", error.message);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 *
 * Processes texts in batches to avoid rate limits.
 *
 * @param {string[]} texts - Array of texts to embed
 * @param {Object} options - Options
 * @param {string} options.model - OpenAI embedding model
 * @param {number} options.batchSize - Number of texts to process at once (default: 100)
 * @param {number} options.delayMs - Delay between batches in milliseconds (default: 1000)
 * @param {Function} options.onProgress - Progress callback (optional)
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
async function generateEmbeddingsBatch(texts, options = {}) {
  const {
    model = "text-embedding-3-small",
    batchSize = 100,
    delayMs = 1000,
    onProgress = null,
  } = options;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not set in environment!");
  }

  const openai = new OpenAI({ apiKey });
  const embeddings = [];
  const totalBatches = Math.ceil(texts.length / batchSize);

  console.log(`\n📊 Generating embeddings for ${texts.length} texts in ${totalBatches} batches...`);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    console.log(`   Processing batch ${batchNum}/${totalBatches} (${batch.length} items)...`);

    try {
      // Truncate texts to avoid token limits
      const truncatedBatch = batch.map((text) =>
        typeof text === "string" ? text.substring(0, 8000) : ""
      );

      const response = await openai.embeddings.create({
        model,
        input: truncatedBatch,
      });

      const batchEmbeddings = response.data.map((item) => item.embedding);
      embeddings.push(...batchEmbeddings);

      if (onProgress) {
        onProgress({
          processed: embeddings.length,
          total: texts.length,
          batchNum,
          totalBatches,
        });
      }

      // Rate limiting delay between batches
      if (i + batchSize < texts.length) {
        console.log(`   Waiting ${delayMs}ms before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`❌ Failed to process batch ${batchNum}:`, error.message);
      throw error;
    }
  }

  console.log(`✅ Generated ${embeddings.length} embeddings`);
  return embeddings;
}

/**
 * Prepare text for embedding
 *
 * Cleans and formats text to optimize embedding quality.
 *
 * @param {string} text - Raw text
 * @param {Object} options - Options
 * @param {number} options.maxLength - Maximum text length (default: 8000)
 * @param {boolean} options.removeNewlines - Remove newlines (default: true)
 * @param {boolean} options.removeExtraSpaces - Remove extra spaces (default: true)
 * @returns {string} - Cleaned text
 */
function prepareTextForEmbedding(text, options = {}) {
  const { maxLength = 8000, removeNewlines = true, removeExtraSpaces = true } = options;

  if (!text || typeof text !== "string") {
    return "";
  }

  let cleaned = text;

  // Remove newlines if requested
  if (removeNewlines) {
    cleaned = cleaned.replace(/\n+/g, " ");
  }

  // Remove extra spaces if requested
  if (removeExtraSpaces) {
    cleaned = cleaned.replace(/\s+/g, " ");
  }

  // Trim
  cleaned = cleaned.trim();

  // Truncate to max length
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Create combined text for JIRA ticket embedding
 *
 * Combines key, summary, and description into optimized text for embedding.
 *
 * @param {Object} ticket - JIRA ticket object
 * @param {string} ticket.key - Ticket key (e.g., PROJ-123)
 * @param {string} ticket.summary - Ticket summary/title
 * @param {string} ticket.description - Ticket description
 * @param {string} ticket.status - Ticket status (optional)
 * @param {string} ticket.priority - Ticket priority (optional)
 * @returns {string} - Combined text for embedding
 */
function createJiraEmbeddingText(ticket) {
  const parts = [];

  if (ticket.key) {
    parts.push(`Ticket: ${ticket.key}`);
  }

  if (ticket.summary) {
    parts.push(`Summary: ${ticket.summary}`);
  }

  if (ticket.status) {
    parts.push(`Status: ${ticket.status}`);
  }

  if (ticket.priority) {
    parts.push(`Priority: ${ticket.priority}`);
  }

  if (ticket.description) {
    // Limit description to avoid token limits
    const desc = ticket.description.substring(0, 5000);
    parts.push(`Description: ${desc}`);
  }

  const combined = parts.join(" | ");
  return prepareTextForEmbedding(combined);
}

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  prepareTextForEmbedding,
  createJiraEmbeddingText,
};
