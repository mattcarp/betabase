/**
 * Migration Script: Add context field to existing conversations
 * FEAT-018 Phase 4 (P4-006)
 *
 * This script migrates existing conversations in localStorage to include
 * the 'context' field, defaulting to 'chat' for backwards compatibility.
 *
 * Usage:
 *   - Run in browser console, OR
 *   - Import and call migrateConversationContext()
 *
 * Safe to run multiple times (idempotent)
 */

interface LegacyConversation {
  id: string;
  title?: string;
  messages?: Array<{ role: string; content: string }>;
  createdAt?: string;
  updatedAt?: string;
  // May or may not have context field
  context?: "chat" | "test" | "fix";
}

interface MigrationResult {
  success: boolean;
  totalConversations: number;
  migratedCount: number;
  alreadyMigratedCount: number;
  errors: string[];
}

/**
 * Migrate conversations to include context field
 * @returns MigrationResult with details of the migration
 */
export function migrateConversationContext(): MigrationResult {
  const result: MigrationResult = {
    success: true,
    totalConversations: 0,
    migratedCount: 0,
    alreadyMigratedCount: 0,
    errors: [],
  };

  try {
    // Check if we're in a browser environment
    if (typeof localStorage === "undefined") {
      result.success = false;
      result.errors.push("localStorage not available - must run in browser");
      return result;
    }

    // Get the conversation store from localStorage
    const storeKey = "siam-conversations";
    const stored = localStorage.getItem(storeKey);

    if (!stored) {
      console.log("[Migration] No conversation store found - nothing to migrate");
      return result;
    }

    let storeData: {
      state?: {
        conversations?: LegacyConversation[];
        activeConversationId?: string | null;
        activeConversationByContext?: {
          chat: string | null;
          test: string | null;
          fix: string | null;
        };
      };
      version?: number;
    };

    try {
      storeData = JSON.parse(stored);
    } catch (parseError) {
      result.success = false;
      result.errors.push(`Failed to parse store data: ${parseError}`);
      return result;
    }

    const conversations = storeData.state?.conversations || [];
    result.totalConversations = conversations.length;

    if (conversations.length === 0) {
      console.log("[Migration] No conversations found - nothing to migrate");
      return result;
    }

    // Migrate each conversation
    const migratedConversations = conversations.map((conv) => {
      if (conv.context) {
        // Already has context - no migration needed
        result.alreadyMigratedCount++;
        return conv;
      } else {
        // Add default context of 'chat'
        result.migratedCount++;
        return {
          ...conv,
          context: "chat" as const,
        };
      }
    });

    // Ensure activeConversationByContext exists
    const activeByContext = storeData.state?.activeConversationByContext || {
      chat: storeData.state?.activeConversationId || null,
      test: null,
      fix: null,
    };

    // Update the store
    const updatedStore = {
      ...storeData,
      state: {
        ...storeData.state,
        conversations: migratedConversations,
        activeConversationByContext: activeByContext,
      },
    };

    localStorage.setItem(storeKey, JSON.stringify(updatedStore));

    console.log(
      `[Migration] Complete: ${result.migratedCount} migrated, ${result.alreadyMigratedCount} already had context`
    );

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    return result;
  }
}

/**
 * Verify migration was successful
 * @returns true if all conversations have a context field
 */
export function verifyMigration(): boolean {
  try {
    const stored = localStorage.getItem("siam-conversations");
    if (!stored) return true; // No data = nothing to verify

    const storeData = JSON.parse(stored);
    const conversations = storeData.state?.conversations || [];

    for (const conv of conversations) {
      if (!conv.context) {
        console.error(`[Verify] Conversation ${conv.id} missing context field`);
        return false;
      }
    }

    console.log(`[Verify] All ${conversations.length} conversations have context field`);
    return true;
  } catch (error) {
    console.error(`[Verify] Failed: ${error}`);
    return false;
  }
}

/**
 * Run migration and verification
 * For use in browser console
 */
export function runMigration(): void {
  console.log("[Migration] Starting conversation context migration...");
  const result = migrateConversationContext();

  if (result.success) {
    console.log("[Migration] Migration successful!");
    console.log(`  Total conversations: ${result.totalConversations}`);
    console.log(`  Migrated: ${result.migratedCount}`);
    console.log(`  Already had context: ${result.alreadyMigratedCount}`);

    console.log("[Migration] Verifying...");
    const verified = verifyMigration();
    if (verified) {
      console.log("[Migration] Verification passed!");
    } else {
      console.error("[Migration] Verification failed!");
    }
  } else {
    console.error("[Migration] Migration failed!");
    console.error("  Errors:", result.errors);
  }
}

// Export for use in browser console
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).migrateConversationContext = migrateConversationContext;
  (window as unknown as Record<string, unknown>).verifyMigration = verifyMigration;
  (window as unknown as Record<string, unknown>).runMigration = runMigration;
}

export default runMigration;
