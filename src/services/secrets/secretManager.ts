/**
 * Thin wrapper around environment variables injected by Infisical.
 * Provides a consistent async/sync interface for server-only secret access.
 */
class SecretManager {
  async getSecret(key: string): Promise<string | undefined> {
    return this.getEnvVar(key);
  }

  getSecretSync(key: string): string | undefined {
    return this.getEnvVar(key);
  }

  clearCache(): void {
    // No caching is performed; Infisical injects env vars at runtime.
  }

  private getEnvVar(key: string): string | undefined {
    return process.env[key];
  }
}

export const secretManager = new SecretManager();

