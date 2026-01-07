/**
 * Mem0 Memory Service
 *
 * Provides long-term memory for AI conversations using Mem0's memory layer.
 * Memories persist across conversations and sessions, enabling the AI to remember
 * user preferences, past discussions, and context.
 *
 * @see https://docs.mem0.ai/
 */

import { MemoryClient } from "mem0ai";

// Singleton instance
let mem0Client: MemoryClient | null = null;

/**
 * Get or create the Mem0 client instance
 */
function getClient(): MemoryClient | null {
  if (!process.env.MEM0_API_KEY) {
    console.warn("[Mem0] MEM0_API_KEY not configured - memory features disabled");
    return null;
  }

  if (!mem0Client) {
    mem0Client = new MemoryClient({
      apiKey: process.env.MEM0_API_KEY,
    });
    console.log("[Mem0] Client initialized");
  }

  return mem0Client;
}

/**
 * Memory entry structure
 */
export interface Memory {
  id: string;
  memory: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Add memories from a conversation exchange
 *
 * @param messages - Array of conversation messages
 * @param userId - User identifier for memory association
 * @param metadata - Optional metadata to attach to memories
 */
export async function addMemories(
  messages: Array<{ role: string; content: string }>,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    // Format messages for Mem0
    const formattedMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    await client.add(formattedMessages, {
      user_id: userId,
      metadata: {
        app: "siam",
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    });

    console.log(`[Mem0] Added memories for user ${userId}`);
  } catch (error) {
    console.error("[Mem0] Error adding memories:", error);
    // Don't throw - memory is non-critical
  }
}

/**
 * Retrieve relevant memories for a query
 *
 * @param query - The query to search for relevant memories
 * @param userId - User identifier
 * @param limit - Maximum number of memories to return
 * @returns Array of relevant memories
 */
export async function retrieveMemories(
  query: string,
  userId: string,
  limit: number = 10
): Promise<Memory[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const result = await client.search(query, {
      user_id: userId,
      limit,
    });

    console.log(`[Mem0] Retrieved ${result.length} memories for user ${userId}`);
    return result as Memory[];
  } catch (error) {
    console.error("[Mem0] Error retrieving memories:", error);
    return [];
  }
}

/**
 * Get all memories for a user
 *
 * @param userId - User identifier
 * @returns Array of all memories for the user
 */
export async function getAllMemories(userId: string): Promise<Memory[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const result = await client.getAll({
      user_id: userId,
    });

    console.log(`[Mem0] Got ${result.length} total memories for user ${userId}`);
    return result as Memory[];
  } catch (error) {
    console.error("[Mem0] Error getting all memories:", error);
    return [];
  }
}

/**
 * Delete a specific memory
 *
 * @param memoryId - ID of the memory to delete
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    await client.delete(memoryId);
    console.log(`[Mem0] Deleted memory ${memoryId}`);
  } catch (error) {
    console.error("[Mem0] Error deleting memory:", error);
  }
}

/**
 * Format memories for injection into system prompt
 *
 * @param memories - Array of memories to format
 * @returns Formatted string for system prompt
 */
export function formatMemoriesForPrompt(memories: Memory[]): string {
  if (!memories || memories.length === 0) {
    return "";
  }

  const memoryLines = memories.map((m) => `- ${m.memory}`).join("\n");

  return `
## User Context (from previous conversations)
The following information was remembered from past interactions with this user:

${memoryLines}

Use this context to provide more personalized and relevant responses. Reference these memories naturally when relevant, but don't explicitly mention that you "remembered" them.
`;
}

/**
 * Check if Mem0 is configured and available
 */
export function isMemoryEnabled(): boolean {
  return !!process.env.MEM0_API_KEY;
}
