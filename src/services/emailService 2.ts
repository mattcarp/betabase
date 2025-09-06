import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const REGION = "us-east-2";
const FROM_EMAIL = "noreply@siam.sonymusic.com";

// Initialize SES client
const sesClient = new SESClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export class EmailService {
  private static instance: EmailService;
  private verificationCodes: Map<string, { code: string; expires: number }> =
    new Map();

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Generate a 6-digit verification code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send magic link email with verification code
   */
  async sendMagicLink(email: string): Promise<string> {
    const code = this.generateCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store the code
    this.verificationCodes.set(email.toLowerCase(), { code, expires });

    // For development/testing, just return the code without sending email
    if (
      process.env.NODE_ENV === "development" ||
      !process.env.AWS_ACCESS_KEY_ID
    ) {
      console.log(`[EMAIL] Magic link code for ${email}: ${code}`);
      return code;
    }

    // In production, send actual email
    const params = {
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: "Your SIAM Login Code",
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: `Your SIAM verification code is: ${code}\n\nThis code will expire in 10 minutes.`,
            Charset: "UTF-8",
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      await sesClient.send(command);
      console.log(`[EMAIL] Verification email sent to ${email}`);
      return code;
    } catch (error) {
      console.error("[EMAIL] Failed to send email:", error);
      // Fallback - still return the code even if email fails
      return code;
    }
  }

  /**
   * Verify a magic link code
   */
  verifyCode(email: string, code: string): boolean {
    const stored = this.verificationCodes.get(email.toLowerCase());

    if (!stored) {
      return false;
    }

    // Check if expired
    if (Date.now() > stored.expires) {
      this.verificationCodes.delete(email.toLowerCase());
      return false;
    }

    // Check if code matches
    if (stored.code !== code) {
      return false;
    }

    // Valid - remove the code so it can't be reused
    this.verificationCodes.delete(email.toLowerCase());
    return true;
  }

  /**
   * Clean up expired codes
   */
  cleanupExpiredCodes(): void {
    const now = Date.now();
    for (const [email, data] of this.verificationCodes.entries()) {
      if (now > data.expires) {
        this.verificationCodes.delete(email);
      }
    }
  }
}

export const emailService = EmailService.getInstance();

// Clean up expired codes every minute
setInterval(() => {
  emailService.cleanupExpiredCodes();
}, 60000);
