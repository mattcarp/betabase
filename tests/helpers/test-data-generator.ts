import * as fs from "fs";
import * as path from "path";

export class TestDataGenerator {
  private tempFiles: string[] = [];

  /**
   * Generate a text file with specified content
   */
  generateTextFile(filename: string, content?: string): string {
    const filePath = path.join(process.cwd(), "test-data", filename);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fileContent = content || this.generateLoremIpsum();
    fs.writeFileSync(filePath, fileContent);
    this.tempFiles.push(filePath);

    return filePath;
  }

  /**
   * Generate a JSON file with test data
   */
  generateJSONFile(filename: string, data?: any): string {
    const filePath = path.join(process.cwd(), "test-data", filename);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const jsonData = data || {
      testId: Date.now(),
      name: "Test Data",
      description: "Generated test data for SIAM",
      items: [
        { id: 1, value: "Item 1" },
        { id: 2, value: "Item 2" },
        { id: 3, value: "Item 3" },
      ],
    };

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    this.tempFiles.push(filePath);

    return filePath;
  }

  /**
   * Generate a CSV file
   */
  generateCSVFile(filename: string, rows?: string[][]): string {
    const filePath = path.join(process.cwd(), "test-data", filename);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const csvData = rows || [
      ["Name", "Email", "Role"],
      ["John Doe", "john@example.com", "Admin"],
      ["Jane Smith", "jane@example.com", "User"],
      ["Bob Wilson", "bob@example.com", "User"],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    fs.writeFileSync(filePath, csvContent);
    this.tempFiles.push(filePath);

    return filePath;
  }

  /**
   * Generate a markdown file
   */
  generateMarkdownFile(filename: string, content?: string): string {
    const filePath = path.join(process.cwd(), "test-data", filename);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const mdContent =
      content ||
      `# Test Document

## Overview
This is a test document generated for SIAM testing.

### Features
- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

### Code Example
\`\`\`javascript
function testFunction() {
  console.log("Hello from test!");
}
\`\`\`

### Table
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |
`;

    fs.writeFileSync(filePath, mdContent);
    this.tempFiles.push(filePath);

    return filePath;
  }

  /**
   * Generate a large file for testing upload limits
   */
  generateLargeFile(filename: string, sizeMB: number): string {
    const filePath = path.join(process.cwd(), "test-data", filename);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const chunkSize = 1024 * 1024; // 1MB
    const chunks = sizeMB;

    const stream = fs.createWriteStream(filePath);
    for (let i = 0; i < chunks; i++) {
      const chunk = Buffer.alloc(chunkSize, "x");
      stream.write(chunk);
    }
    stream.end();

    this.tempFiles.push(filePath);

    return filePath;
  }

  /**
   * Generate Lorem Ipsum text
   */
  private generateLoremIpsum(paragraphs: number = 3): string {
    const loremParagraph =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

    const result = [];
    for (let i = 0; i < paragraphs; i++) {
      result.push(loremParagraph);
    }

    return result.join("\n\n");
  }

  /**
   * Generate random email
   */
  generateRandomEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@example.com`;
  }

  /**
   * Generate random text
   */
  generateRandomText(length: number = 100): string {
    const chars = "abcdefghijklmnopqrstuvwxyz ";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Clean up all generated test files
   */
  cleanup(): void {
    for (const file of this.tempFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }

    // Clean up test-data directory if empty
    const testDataDir = path.join(process.cwd(), "test-data");
    if (fs.existsSync(testDataDir)) {
      const files = fs.readdirSync(testDataDir);
      if (files.length === 0) {
        fs.rmdirSync(testDataDir);
      }
    }

    this.tempFiles = [];
  }
}
