/**
 * @feature Chat
 * @priority p0
 * @tags regression, chat, e2e
 * NOTE: These require authentication - not true smoke tests
 */
import { test, expect } from '../../fixtures/base-test';
import { ChatPage } from "../../__pages__/ChatPage";
import { TestFactory } from "../../__fixtures__/TestFactory";

test.describe("[FEATURE] Chat - Core Functionality", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    // Initialize page object
    chatPage = new ChatPage(page);

    // Navigate to chat
    await chatPage.navigate();

    // Wait for page to be ready
    await chatPage.waitForLoad();
  });

  test("[MUST] send and receive messages @e2e @p0", async () => {
    // Arrange
    const message = TestFactory.createChatMessage({
      text: "Hello, what is 2 + 2?",
      expectResponse: "4",
    });

    // Act
    await chatPage.sendMessage(message.text);

    // Assert
    const response = await chatPage.getLastAIMessage();
    expect(response).toContain(message.expectResponse);
  });
  test("[MUST] clear chat history @e2e @p0", async () => {
    // Arrange - Send a message first
    await chatPage.sendMessage("Test message");
    await chatPage.waitForResponse();

    // Act - Clear the chat
    await chatPage.clearChat();

    // Assert - Messages should be gone
    const messages = await chatPage.getAllMessages();
    expect(messages).toHaveLength(0);
  });

  test("[MUST] maintain conversation context @e2e @p0", async () => {
    // Arrange - Create a conversation
    const conversation = TestFactory.createConversation();

    // Act - Send multiple messages
    for (const msg of conversation) {
      await chatPage.sendMessage(msg.text);
      await chatPage.waitForResponse();

      if (msg.expectResponse) {
        // Assert - Check response contains expected content
        const response = await chatPage.getLastAIMessage();
        expect(response.toLowerCase()).toContain(msg.expectResponse.toLowerCase());
      }
    }

    // Assert - All messages should be in history
    const allMessages = await chatPage.getAllMessages();
    expect(allMessages.length).toBeGreaterThanOrEqual(conversation.length * 2); // User + AI messages
  });

  test("[SHOULD] handle empty messages gracefully @regression @p1", async () => {
    // Act - Try to send empty message
    await chatPage.sendMessage("");

    // Assert - Send button should be disabled or show error
    const hasError = await chatPage.hasError();
    const isInputEnabled = await chatPage.isInputEnabled();

    expect(hasError || !isInputEnabled).toBeTruthy();
  });
});
