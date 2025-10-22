/**
 * OpenAI Vector Store Service
 * Handles document uploads and management for the AOMA knowledge base
 */

export interface VectorStoreFile {
  id: string;
  filename: string;
  status: "uploading" | "processing" | "completed" | "error";
  bytes: number;
  created_at: number;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  filename?: string;
  error?: string;
  status?: string;
}

export class VectorStoreService {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";
  private vectorStoreId: string;

  constructor(apiKey: string, vectorStoreId: string = "vs_wJF8HgBFrYtdNaXUbUC2nfM") {
    this.apiKey = apiKey;
    this.vectorStoreId = vectorStoreId;
  }

  /**
   * Upload a file to the OpenAI vector store
   */
  async uploadFile(file: File): Promise<UploadResult> {
    try {
      // Step 1: Upload file to OpenAI
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "assistants");

      const uploadResponse = await fetch(`${this.baseUrl}/files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        console.error("File upload failed:", error);
        return {
          success: false,
          error: `Upload failed: ${uploadResponse.statusText}`,
        };
      }

      const uploadData = await uploadResponse.json();
      const fileId = uploadData.id;

      // Step 2: Add file to vector store
      const addToVectorStoreResponse = await fetch(
        `${this.baseUrl}/vector_stores/${this.vectorStoreId}/files`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_id: fileId,
          }),
        }
      );

      if (!addToVectorStoreResponse.ok) {
        const error = await addToVectorStoreResponse.text();
        console.error("Adding to vector store failed:", error);
        return {
          success: false,
          error: `Failed to add to vector store: ${addToVectorStoreResponse.statusText}`,
        };
      }

      const vectorStoreData = await addToVectorStoreResponse.json();

      return {
        success: true,
        fileId: fileId,
        filename: file.name,
        status: vectorStoreData.status,
      };
    } catch (error) {
      console.error("Vector store upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Check the status of a file in the vector store
   */
  async getFileStatus(fileId: string): Promise<VectorStoreFile | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/vector_stores/${this.vectorStoreId}/files/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to get file status:", response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting file status:", error);
      return null;
    }
  }

  /**
   * List all files in the vector store
   */
  async listFiles(): Promise<VectorStoreFile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/vector_stores/${this.vectorStoreId}/files`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to list files:", response.statusText);
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error listing files:", error);
      return [];
    }
  }

  /**
   * Delete a file from the vector store
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/vector_stores/${this.vectorStoreId}/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  /**
   * Get vector store information
   */
  async getVectorStoreInfo() {
    try {
      const response = await fetch(`${this.baseUrl}/vector_stores/${this.vectorStoreId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to get vector store info:", response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting vector store info:", error);
      return null;
    }
  }
}

// Singleton instance for the app
let vectorStoreService: VectorStoreService | null = null;

export const getVectorStoreService = (apiKey?: string): VectorStoreService => {
  if (!vectorStoreService) {
    if (!apiKey) {
      throw new Error("OpenAI API key required to initialize VectorStoreService");
    }
    // Get the vector store ID from config
    const { getVectorStoreId } = require("../config/apiKeys");
    const vectorStoreId = getVectorStoreId();

    vectorStoreService = new VectorStoreService(apiKey, vectorStoreId);
  }
  return vectorStoreService;
};

export default VectorStoreService;
