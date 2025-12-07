import { secretManager } from "@/services/secrets/secretManager";

type SecretKey =
  | "OPENAI_API_KEY"
  | "ELEVENLABS_API_KEY"
  | "ELEVENLABS_AGENT_ID"
  | "VECTOR_STORE_ID"
  | "MCP_LAMBDA_URL"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "SUPABASE_URL";

async function requireSecret(key: SecretKey): Promise<string> {
  const value = await secretManager.getSecret(key);
  if (!value) {
    throw new Error(`Missing required secret: ${key}`);
  }
  return value;
}

function requireSecretSync(key: SecretKey): string {
  const value = secretManager.getSecretSync(key);
  if (!value) {
    throw new Error(`Missing required secret: ${key}`);
  }
  return value;
}

export async function getOpenAIApiKey(): Promise<string> {
  return requireSecret("OPENAI_API_KEY");
}

export function getOpenAIApiKeySync(): string {
  return requireSecretSync("OPENAI_API_KEY");
}

export async function getElevenLabsApiKey(): Promise<string> {
  return requireSecret("ELEVENLABS_API_KEY");
}

export function getElevenLabsApiKeySync(): string {
  return requireSecretSync("ELEVENLABS_API_KEY");
}

export async function getElevenLabsAgentId(): Promise<string | undefined> {
  return secretManager.getSecret("ELEVENLABS_AGENT_ID");
}

export function getElevenLabsAgentIdSync(): string | undefined {
  return secretManager.getSecretSync("ELEVENLABS_AGENT_ID");
}

export async function getVectorStoreId(): Promise<string> {
  return requireSecret("VECTOR_STORE_ID");
}

export function getVectorStoreIdSync(): string {
  return requireSecretSync("VECTOR_STORE_ID");
}

export async function getMcpLambdaUrl(): Promise<string> {
  return requireSecret("MCP_LAMBDA_URL");
}

export function getMcpLambdaUrlSync(): string {
  return requireSecretSync("MCP_LAMBDA_URL");
}

export async function getSupabaseServiceRoleKey(): Promise<string> {
  return requireSecret("SUPABASE_SERVICE_ROLE_KEY");
}

export function getSupabaseServiceRoleKeySync(): string {
  return requireSecretSync("SUPABASE_SERVICE_ROLE_KEY");
}

export function getSupabaseUrlSync(): string {
  return requireSecretSync("SUPABASE_URL");
}
