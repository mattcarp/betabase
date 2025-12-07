import { Logtail } from "@logtail/browser";

export type ChatLogEvent =
  | {
      type: "chat_inference_start";
      conversationId?: string;
      model?: string;
      prompt?: string;
    }
  | {
      type: "chat_inference_complete";
      conversationId?: string;
      model?: string;
      durationMs?: number;
      sourceCount?: number;
      sources?: string[];
    }
  | {
      type: "chat_inference_error";
      conversationId?: string;
      model?: string;
      durationMs?: number;
      errorMessage: string;
    };

let logtailClient: Logtail | null = null;

const getLogtailClient = () => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!process.env.NEXT_PUBLIC_LOGTAIL_TOKEN) {
    return null;
  }

  if (!logtailClient) {
    logtailClient = new Logtail(process.env.NEXT_PUBLIC_LOGTAIL_TOKEN);
  }

  return logtailClient;
};

export async function logChatEvent(event: ChatLogEvent) {
  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV !== "production") {
    console.info("[MAC Chat][Telemetry]", payload);
  }

  const client = getLogtailClient();
  if (!client) {
    return;
  }

  try {
    if (event.type === "chat_inference_error") {
      await client.error("chat_inference_error", payload);
    } else if (event.type === "chat_inference_complete") {
      await client.info("chat_inference_complete", payload);
    } else {
      await client.info("chat_inference_start", payload);
    }
  } catch (error) {
    console.warn("[MAC Chat][Telemetry] Failed to send logtail event", error);
  }
}
