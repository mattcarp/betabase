/**
 * Secret Manager Stub
 * TODO: Implement actual secret management when needed
 */

class SecretManager {
  private cache = new Map<string, string>();

  async getSecret(key: string): Promise<string | undefined> {
    // First check cache
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Fall back to environment variables
    const value = process.env[key];
    if (value) {
      this.cache.set(key, value);
    }

    return value;
  }

  getSecretSync(key: string): string | undefined {
    // First check cache
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Fall back to environment variables
    const value = process.env[key];
    if (value) {
      this.cache.set(key, value);
    }

    return value;
  }

  async setSecret(key: string, value: string): Promise<void> {
    this.cache.set(key, value);
    console.warn("secretManager.setSecret: Using in-memory stub");
  }
}

export const secretManager = new SecretManager();
