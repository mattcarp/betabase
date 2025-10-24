/**
 * Mailinator Helper for Automated Testing
 *
 * Uses Mailinator's public inbox system to receive verification emails
 * No authentication required - all public inboxes are accessible
 *
 * Test email format: claude-test-{timestamp}@mailinator.com
 */

interface MailinatorEmail {
  id: string;
  from: string;
  subject: string;
  time: number;
  seconds_ago: number;
}

// Removed unused interface _MailinatorMessage

export class MailinatorHelper {
  private static readonly BASE_URL = "https://www.mailinator.com";
  // Removed unused constant _API_BASE

  /**
   * Generate a unique test email address
   */
  static generateTestEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `claude-test-${timestamp}-${random}@mailinator.com`;
  }

  /**
   * Get the inbox name from an email address
   */
  static getInboxName(email: string): string {
    return email.split("@")[0];
  }

  /**
   * Fetch emails from a public Mailinator inbox
   * Note: This uses the public web interface, not the paid API
   */
  static async fetchInbox(email: string): Promise<MailinatorEmail[]> {
    const inbox = this.getInboxName(email);

    try {
      // Use the public web endpoint (no auth required)
      const response = await fetch(`${this.BASE_URL}/v3/public/inboxes/?inbox=${inbox}`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch inbox: ${response.status}`);
      }

      const data = await response.json();
      return data.msgs || [];
    } catch (error) {
      console.error("Error fetching Mailinator inbox:", error);
      return [];
    }
  }

  /**
   * Get a specific email message content
   */
  static async getEmailContent(email: string, messageId: string): Promise<string | null> {
    const inbox = this.getInboxName(email);

    try {
      // Fetch the email content from public endpoint
      const response = await fetch(
        `${this.BASE_URL}/v3/public/inboxes/?inbox=${inbox}&msgid=${messageId}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch message: ${response.status}`);
      }

      const data = await response.json();

      // Extract text content
      if (data.data?.text) {
        return data.data.text;
      } else if (data.data?.parts?.[0]?.body) {
        return data.data.parts[0].body;
      } else if (data.data?.html) {
        // Strip HTML tags for verification code extraction
        return data.data.html.replace(/<[^>]*>/g, "");
      }

      return null;
    } catch (error) {
      console.error("Error fetching email content:", error);
      return null;
    }
  }

  /**
   * Extract verification code from email content
   * Looks for 6-digit codes in the email
   */
  static extractVerificationCode(content: string): string | null {
    // Common patterns for verification codes
    const patterns = [
      /\b(\d{6})\b/, // 6 digits
      /code[:\s]+(\d{6})/i, // "code: 123456"
      /verification[:\s]+(\d{6})/i, // "verification: 123456"
      /\b(\d{3}[-\s]?\d{3})\b/, // "123-456" or "123 456"
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        // Remove any dashes or spaces
        return match[1].replace(/[-\s]/g, "");
      }
    }

    return null;
  }

  /**
   * Wait for an email with verification code
   * Polls the inbox for up to 60 seconds
   */
  static async waitForVerificationCode(
    email: string,
    maxWaitMs: number = 60000,
    pollIntervalMs: number = 2000
  ): Promise<string | null> {
    const startTime = Date.now();

    console.log(`Waiting for verification email at: ${email}`);
    console.log(
      `Public inbox URL: https://www.mailinator.com/v4/public/inboxes.jsp?to=${this.getInboxName(email)}`
    );

    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Fetch inbox
        const emails = await this.fetchInbox(email);

        if (emails.length > 0) {
          // Get the most recent email
          const latestEmail = emails[0];

          // Check if it's recent (within last 5 minutes)
          if (latestEmail.seconds_ago < 300) {
            console.log(`Found email from ${latestEmail.from}: ${latestEmail.subject}`);

            // Get email content
            const content = await this.getEmailContent(email, latestEmail.id);

            if (content) {
              // Extract verification code
              const code = this.extractVerificationCode(content);

              if (code) {
                console.log(`Extracted verification code: ${code}`);
                return code;
              }
            }
          }
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      } catch (error) {
        console.error("Error polling for email:", error);
      }
    }

    console.log("Timeout waiting for verification email");
    return null;
  }

  /**
   * Get the public inbox URL for manual checking
   */
  static getPublicInboxUrl(email: string): string {
    const inbox = this.getInboxName(email);
    return `https://www.mailinator.com/v4/public/inboxes.jsp?to=${inbox}`;
  }
}

// Export for use in tests
export default MailinatorHelper;
