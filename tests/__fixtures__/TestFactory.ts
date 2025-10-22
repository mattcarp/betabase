/**
 * Test Data Factory
 * Centralized test data generation
 */

interface User {
  email: string;
  password: string;
  name: string;
  role?: "user" | "admin";
}

interface TestFile {
  name: string;
  content: string;
  type: string;
}

interface ChatMessage {
  text: string;
  expectResponse?: string;
}

export class TestFactory {
  private static counter = 0;

  /**
   * Create a test user
   */
  static createUser(overrides?: Partial<User>): User {
    this.counter++;
    return {
      email: `test-${this.counter}-${Date.now()}@siam.ai`,
      password: "Test123!@#",
      name: `Test User ${this.counter}`,
      role: "user",
      ...overrides,
    };
  }

  /**
   * Create an admin user
   */
  static createAdmin(): User {
    return this.createUser({
      role: "admin",
      email: `admin-${this.counter}@siam.ai`,
    });
  }
  /**
   * Create a Sony Music email (for allowed domains)
   */
  static createSonyUser(): User {
    return this.createUser({
      email: `test-${this.counter}@sonymusic.com`,
    });
  }

  /**
   * Create test file data
   */
  static createFile(overrides?: Partial<TestFile>): TestFile {
    this.counter++;
    return {
      name: `test-file-${this.counter}.txt`,
      content: `Test content ${this.counter}\n${new Date().toISOString()}`,
      type: "text/plain",
      ...overrides,
    };
  }

  /**
   * Create PDF test file
   */
  static createPDF(): TestFile {
    return this.createFile({
      name: `document-${this.counter}.pdf`,
      type: "application/pdf",
      content: "PDF content would go here",
    });
  }

  /**
   * Create CSV test file
   */
  static createCSV(): TestFile {
    return this.createFile({
      name: `data-${this.counter}.csv`,
      type: "text/csv",
      content: "header1,header2,header3\nvalue1,value2,value3",
    });
  }
  /**
   * Create chat message
   */
  static createChatMessage(overrides?: Partial<ChatMessage>): ChatMessage {
    this.counter++;
    return {
      text: `Test message ${this.counter}: What is the capital of France?`,
      expectResponse: "Paris",
      ...overrides,
    };
  }

  /**
   * Create complex chat conversation
   */
  static createConversation(): ChatMessage[] {
    return [
      { text: "Hello, can you help me?", expectResponse: "help" },
      { text: "What can you do?", expectResponse: "assist" },
      { text: "Tell me a joke", expectResponse: undefined }, // Don't check specific response
    ];
  }

  /**
   * Generate random string
   */
  static randomString(length = 10): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate test email with custom domain
   */
  static createEmailForDomain(domain: string): string {
    return `test-${this.counter}-${Date.now()}@${domain}`;
  }

  /**
   * Reset counter (useful between test suites)
   */
  static reset(): void {
    this.counter = 0;
  }
}
