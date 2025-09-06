/**
 * Vector Store Migration Service
 * Migrates all data from OpenAI Vector Store to Supabase
 * THIS IS THE BIG ONE! 🚀
 */

import OpenAI from "openai";
import { getSupabaseVectorService } from "./supabaseVectorService";
import { getVectorStoreService } from "./vectorStoreService";

export interface MigrationResult {
  totalFiles: number;
  successfulMigrations: number;
  failedMigrations: number;
  errors: Array<{ fileId: string; filename: string; error: string }>;
  duration: number;
}

export class VectorStoreMigrationService {
  private openai: OpenAI;
  private supabaseVector: ReturnType<typeof getSupabaseVectorService>;
  private vectorStoreId: string;

  constructor(openaiApiKey?: string, vectorStoreId?: string) {
    this.openai = new OpenAI({
      apiKey: openaiApiKey || process.env.OPENAI_API_KEY!,
    });
    this.supabaseVector = getSupabaseVectorService();
    this.vectorStoreId =
      vectorStoreId ||
      process.env.VECTOR_STORE_ID ||
      "vs_3dqHL3Wcmt1WrUof0qS4UQqo"; // The actual AOMA Agent vector store
  }

  /**
   * List all files in the OpenAI vector store
   */
  async listOpenAIVectorStoreFiles(): Promise<any[]> {
    try {
      console.log(
        "📋 Listing files from OpenAI vector store:",
        this.vectorStoreId,
      );

      // First verify the vector store exists (now at top level)
      try {
        const vectorStore = await this.openai.vectorStores.retrieve(
          this.vectorStoreId,
        );
        console.log(
          `✅ Vector store found: ${vectorStore.name || "Unnamed"} (${vectorStore.file_counts?.total || 0} files)`,
        );
      } catch (error) {
        console.error("❌ Vector store not found:", this.vectorStoreId);
        throw new Error(`Vector store ${this.vectorStoreId} not found`);
      }

      // List files in the vector store (now at top level)
      const vectorStoreFiles = await this.openai.vectorStores.files.list(
        this.vectorStoreId,
      );

      const files = [];
      for await (const file of vectorStoreFiles) {
        files.push(file);
      }

      console.log(`Found ${files.length} files in OpenAI vector store`);
      return files;
    } catch (error) {
      console.error("Failed to list vector store files:", error);
      throw error;
    }
  }

  /**
   * Download file content from OpenAI
   */
  async downloadFileContent(fileId: string): Promise<string> {
    try {
      console.log(`📥 Downloading file ${fileId} from OpenAI...`);

      // Get file metadata
      const file = await this.openai.files.retrieve(fileId);

      // Download file content
      const response = await this.openai.files.content(fileId);

      // Convert response to text
      const text = await response.text();

      console.log(`✅ Downloaded ${file.filename} (${text.length} characters)`);
      return text;
    } catch (error) {
      console.error(`Failed to download file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Migrate a single file from OpenAI to Supabase
   */
  async migrateFile(vectorStoreFile: any): Promise<void> {
    const fileId = vectorStoreFile.id;

    try {
      // Get file details
      const file = await this.openai.files.retrieve(fileId);

      // Download content
      const content = await this.downloadFileContent(fileId);

      // Prepare metadata
      const metadata = {
        openai_file_id: fileId,
        filename: file.filename,
        bytes: file.bytes,
        created_at: new Date(file.created_at * 1000).toISOString(),
        purpose: file.purpose,
        vector_store_file_status: vectorStoreFile.status,
        migrated_at: new Date().toISOString(),
      };

      // Upsert to Supabase
      await this.supabaseVector.upsertVector(
        content,
        "openai_import",
        fileId,
        metadata,
      );

      console.log(`✅ Migrated ${file.filename} successfully!`);
    } catch (error) {
      console.error(`❌ Failed to migrate file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * THE MAIN MIGRATION FUNCTION - THIS IS WHERE THE MAGIC HAPPENS! 🎉
   */
  async migrateAllFiles(): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: Array<{ fileId: string; filename: string; error: string }> =
      [];

    try {
      console.log("🚀 STARTING EPIC VECTOR STORE MIGRATION!");
      console.log("================================================");

      // Update migration status
      await this.supabaseVector.updateMigrationStatus(
        "openai_import",
        "in_progress",
      );

      // List all files
      const files = await this.listOpenAIVectorStoreFiles();
      const totalFiles = files.length;

      if (totalFiles === 0) {
        console.log("No files found in OpenAI vector store");
        return {
          totalFiles: 0,
          successfulMigrations: 0,
          failedMigrations: 0,
          errors: [],
          duration: 0,
        };
      }

      console.log(
        `\n🎯 Migrating ${totalFiles} files from OpenAI to Supabase...`,
      );
      console.log("================================================\n");

      let successCount = 0;
      let failedCount = 0;

      // Process files with progress tracking
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = Math.round(((i + 1) / totalFiles) * 100);

        console.log(
          `\n[${i + 1}/${totalFiles}] (${progress}%) Processing file...`,
        );

        try {
          await this.migrateFile(file);
          successCount++;

          // Update migration status periodically
          if ((i + 1) % 5 === 0 || i === files.length - 1) {
            await this.supabaseVector.updateMigrationStatus(
              "openai_import",
              "in_progress",
              {
                totalCount: totalFiles,
                migratedCount: successCount,
              },
            );
          }
        } catch (error) {
          failedCount++;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          // Try to get filename for error reporting
          let filename = "unknown";
          try {
            const fileDetails = await this.openai.files.retrieve(file.id);
            filename = fileDetails.filename;
          } catch {}

          errors.push({
            fileId: file.id,
            filename,
            error: errorMessage,
          });

          console.error(
            `❌ Failed to migrate file ${file.id}: ${errorMessage}`,
          );
        }
      }

      const duration = Date.now() - startTime;
      const durationSeconds = (duration / 1000).toFixed(2);

      // Update final migration status
      const finalStatus = failedCount === 0 ? "completed" : "completed";
      await this.supabaseVector.updateMigrationStatus(
        "openai_import",
        finalStatus,
        {
          totalCount: totalFiles,
          migratedCount: successCount,
          errorMessage:
            failedCount > 0
              ? `${failedCount} files failed to migrate`
              : undefined,
        },
      );

      console.log("\n================================================");
      console.log("🎉 MIGRATION COMPLETE!");
      console.log("================================================");
      console.log(
        `✅ Successfully migrated: ${successCount}/${totalFiles} files`,
      );
      if (failedCount > 0) {
        console.log(`❌ Failed: ${failedCount} files`);
      }
      console.log(`⏱️  Duration: ${durationSeconds} seconds`);
      console.log("================================================\n");

      return {
        totalFiles,
        successfulMigrations: successCount,
        failedMigrations: failedCount,
        errors,
        duration,
      };
    } catch (error) {
      console.error("Migration failed:", error);

      await this.supabaseVector.updateMigrationStatus(
        "openai_import",
        "failed",
        {
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      );

      throw error;
    }
  }

  /**
   * Verify migration by comparing counts
   */
  async verifyMigration(): Promise<{
    openaiCount: number;
    supabaseCount: number;
    match: boolean;
  }> {
    try {
      // Count OpenAI files
      const openaiFiles = await this.listOpenAIVectorStoreFiles();
      const openaiCount = openaiFiles.length;

      // Count Supabase vectors
      const stats = await this.supabaseVector.getVectorStats();
      const supabaseCount =
        stats.find((s: any) => s.source_type === "openai_import")
          ?.document_count || 0;

      const match = openaiCount === supabaseCount;

      console.log("\n📊 Migration Verification:");
      console.log(`   OpenAI files: ${openaiCount}`);
      console.log(`   Supabase vectors: ${supabaseCount}`);
      console.log(`   Status: ${match ? "✅ MATCH!" : "⚠️ MISMATCH"}`);

      return { openaiCount, supabaseCount, match };
    } catch (error) {
      console.error("Verification failed:", error);
      throw error;
    }
  }
}

// Export a ready-to-use instance
export const migrationService = new VectorStoreMigrationService();
