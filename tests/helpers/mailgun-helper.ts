/**
 * Mailgun Helper for SIAM Test Automation
 *
 * This helper provides utilities for retrieving magic link emails
 * sent through AWS Cognito/SES to a Mailgun domain for testing.
 *
 * Setup Requirements:
 * 1. Create a Mailgun domain (e.g., mg.siam-test.com)
 * 2. Set up a route to catch all test emails: match_recipient(".*@mg.siam-test.com")
 * 3. Configure the route to store() emails
 * 4. Add Mailgun API credentials to .env.test
 */

import axios, { AxiosInstance } from "axios";

interface MailgunConfig {
  apiKey: string;
  domain: string;
  region?: "us" | "eu";
}

interface EmailEvent {
  id: string;
  timestamp: number;
  event: string;
  recipient: string;
  storage?: {
    url: string;
    key: string;
  };
  message?: {
    headers: {
      from: string;
      to: string;
      subject: string;
    };
  };
}

interface EmailMessage {
  subject: string;
  from: string;
  to: string | string[];
  bodyPlain: string;
  bodyHtml: string;
  strippedText?: string;
  strippedHtml?: string;
}

export class MailgunTestHelper {
  private apiKey: string;
  private domain: string;
  private baseUrl: string;
  private axiosClient: AxiosInstance;

  constructor(config?: MailgunConfig) {
    // Load from environment if not provided
    this.apiKey = config?.apiKey || process.env.MAILGUN_API_KEY || "";
    this.domain = config?.domain || process.env.MAILGUN_TEST_DOMAIN || "";
    const region = config?.region || (process.env.MAILGUN_REGION as "us" | "eu") || "us";

    if (!this.apiKey || !this.domain) {
      throw new Error(
        "Mailgun API key and domain are required. Set MAILGUN_API_KEY and MAILGUN_TEST_DOMAIN in .env.test"
      );
    }

    this.baseUrl = region === "eu" ? "https://api.eu.mailgun.net/v3" : "https://api.mailgun.net/v3";

    // Create axios instance with auth
    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: "api",
        password: this.apiKey,
      },
    });
  }

  /**
   * Generate a unique test email address
   */
  generateTestEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test-${timestamp}-${random}@${this.domain}`;
  }

  /**
   * Wait for a magic link email and return its content
   */
  async waitForMagicLinkEmail(
    recipientEmail: string,
    options: {
      timeout?: number;
      pollInterval?: number;
      sinceTimestamp?: number;
    } = {}
  ): Promise<EmailMessage> {
    const {
      timeout = 30000,
      pollInterval = 2000,
      sinceTimestamp = Math.floor(Date.now() / 1000) - 60,
    } = options;

    const startTime = Date.now();

    console.log(`⏳ Waiting for magic link email to: ${recipientEmail}`);

    while (Date.now() - startTime < timeout) {
      try {
        // Query Events API for stored messages
        const events = await this.getEvents({
          recipient: recipientEmail,
          event: "stored",
          begin: sinceTimestamp,
        });

        // Look for SIAM magic link email
        const magicLinkEvent = events.find((e) => {
          const subject = e.message?.headers?.subject || "";
          return (
            subject.includes("Magic Link") ||
            subject.includes("Verification Code") ||
            subject.includes("Sign In to SIAM")
          );
        });

        if (magicLinkEvent && magicLinkEvent.storage) {
          console.log("✅ Magic link email found!");
          const message = await this.getMessage(magicLinkEvent.storage.url);
          return message;
        }
      } catch (error) {
        console.log("⏳ Still waiting for email...");
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Magic link email not received within ${timeout}ms timeout`);
  }

  /**
   * Get events from Mailgun Events API
   */
  private async getEvents(params: {
    recipient?: string;
    event?: string;
    begin?: number;
    limit?: number;
  }): Promise<EmailEvent[]> {
    try {
      const response = await this.axiosClient.get(`/${this.domain}/events`, {
        params: {
          ...params,
          limit: params.limit || 10,
        },
      });

      return response.data.items || [];
    } catch (error) {
      console.error("Error fetching events:", error);
      return [];
    }
  }

  /**
   * Retrieve message content from storage URL
   */
  private async getMessage(storageUrl: string): Promise<EmailMessage> {
    const response = await axios.get(storageUrl, {
      auth: {
        username: "api",
        password: this.apiKey,
      },
      headers: {
        Accept: "application/json",
      },
    });

    return {
      subject: response.data.subject,
      from: response.data.from,
      to: response.data.To,
      bodyPlain: response.data["body-plain"] || "",
      bodyHtml: response.data["body-html"] || "",
      strippedText: response.data["stripped-text"],
      strippedHtml: response.data["stripped-html"],
    };
  }

  /**
   * Extract magic link code from SIAM email
   */
  extractMagicLinkCode(emailBody: string): string | null {
    // Pattern for 6-digit verification code
    const codePatterns = [
      /verification code[:\s]+(\d{6})/gi,
      /magic link code[:\s]+(\d{6})/gi,
      /code[:\s]+(\d{6})/gi,
      /\b(\d{6})\b/g, // Fallback: any 6-digit number
    ];

    for (const pattern of codePatterns) {
      const match = emailBody.match(pattern);
      if (match) {
        // Extract just the digits
        const code = match[0].match(/\d{6}/);
        if (code) {
          return code[0];
        }
      }
    }

    return null;
  }

  /**
   * Extract magic link URL from email (if using URL-based magic links)
   */
  extractMagicLinkUrl(emailBody: string): string | null {
    const urlPatterns = [
      /https?:\/\/[^\s]+\/auth\/verify\?[^\s\"]+/gi,
      /https?:\/\/[^\s]+\/magic-link\?[^\s\"]+/gi,
      /<a[^>]+href="([^"]+(?:verify|magic)[^"]+)"[^>]*>/gi,
    ];

    for (const pattern of urlPatterns) {
      const match = emailBody.match(pattern);
      if (match) {
        // If it's an anchor tag, extract the href
        if (match[0].startsWith("<a")) {
          const hrefMatch = match[0].match(/href="([^"]+)"/);
          return hrefMatch ? hrefMatch[1] : null;
        }
        return match[0];
      }
    }

    return null;
  }

  /**
   * Clean up test emails (optional - Mailgun auto-deletes after 3 days)
   */
  async cleanupTestEmails(recipientEmail: string): Promise<void> {
    // This is optional as Mailgun automatically deletes stored messages after 3 days
    // You could implement this if you want immediate cleanup
    console.log(`Test emails for ${recipientEmail} will be auto-deleted by Mailgun in 3 days`);
  }
}

// Export singleton instance for convenience (lazy-loaded to avoid import-time errors)
let _mailgunHelper: MailgunTestHelper | null = null;

export function getMailgunHelper(): MailgunTestHelper {
  if (!_mailgunHelper) {
    _mailgunHelper = new MailgunTestHelper();
  }
  return _mailgunHelper;
}

// Backwards compatibility - will throw only when accessed
export const mailgunHelper = new Proxy({} as MailgunTestHelper, {
  get(_target, prop) {
    return getMailgunHelper()[prop as keyof MailgunTestHelper];
  },
});
