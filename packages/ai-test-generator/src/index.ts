import { OpenAI } from 'openai';
import { Browser, chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { OpenAI as LangChainOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

class AITestGenerator {
  private openai: OpenAI;
  private browser: Browser | null = null;
  private llm: LangChainOpenAI;
  private prompt: PromptTemplate;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.llm = new LangChainOpenAI({ openAIApiKey: apiKey });
    this.prompt = PromptTemplate.fromTemplate(
      "You are an AI test generator. Generate a test case for the following scenario: {scenario}"
    );
  }

  async generateTest(scenario: string): Promise<string> {
    const chain = this.prompt.pipe(this.llm);
    const result = await chain.invoke({ scenario });
    return result.toString();
  }

  // ... rest of the code remains unchanged ...
}

export default AITestGenerator;