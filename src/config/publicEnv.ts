type PublicEnvKey =
  | "NEXT_PUBLIC_ELEVENLABS_AGENT_ID"
  | "NEXT_PUBLIC_MCP_URL"
  | "NEXT_PUBLIC_APP_VERSION"
  | "NEXT_PUBLIC_BUILD_TIMESTAMP";

function readPublicEnv(key: PublicEnvKey): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[key];
}

export function getPublicElevenLabsAgentId(): string | undefined {
  return readPublicEnv("NEXT_PUBLIC_ELEVENLABS_AGENT_ID");
}

export function getPublicMcpUrl(): string | undefined {
  return readPublicEnv("NEXT_PUBLIC_MCP_URL");
}

export function getPublicAppVersion(): string | undefined {
  return readPublicEnv("NEXT_PUBLIC_APP_VERSION");
}

export function getPublicBuildTimestamp(): string | undefined {
  return readPublicEnv("NEXT_PUBLIC_BUILD_TIMESTAMP");
}

