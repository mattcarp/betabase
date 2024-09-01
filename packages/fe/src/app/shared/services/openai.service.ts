import { Injectable } from '@angular/core';
import { OpenAI as LangChainOpenAI } from '@langchain/openai';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OpenAIService {
  private llm: LangChainOpenAI;

  constructor() {
    this.llm = new LangChainOpenAI({ openAIApiKey: environment.openAIApiKey });
  }

  async generateResponse(prompt: string): Promise<string> {
    const response = await this.llm.call(prompt);
    return response;
  }
}
