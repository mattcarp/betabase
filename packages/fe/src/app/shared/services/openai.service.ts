import { Injectable } from '@angular/core';
import { OpenAI as LangChainOpenAI, OpenAICallOptions } from '@langchain/openai';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

interface Callbacks {
  handleLLMNewToken?: (token: string) => void;
  handleLLMEnd?: () => void;
  handleLLMError?: (error: any) => void;
}

@Injectable({
  providedIn: 'root',
})
export class OpenAIService {
  private llm: LangChainOpenAI;

  constructor() {
    this.llm = new LangChainOpenAI({
      apiKey: environment.openAIApiKey,
    });
  }

  generateResponse(prompt: string): Observable<string> {
    return new Observable<string>((observer) => {
      const callbacks: Callbacks = {
        handleLLMNewToken: (token: string) => {
          observer.next(token); // Emit each token as it arrives
        },
        handleLLMEnd: () => {
          observer.complete(); // Complete the stream when done
        },
        handleLLMError: (error: any) => {
          observer.error(error); // Handle errors
        },
      };

      const messages: BaseMessageLike[] = [
        {
          role: 'system',
          content: 'Assistant ID: asst_pFV8MnhvpmLHZ58I8n73z9qC', // Include assistant ID
        },
        {
          role: 'user',
          content: prompt,
        }
      ];
      const options: OpenAICallOptions = {
        callbacks: callbacks as any, // Bypass type error
      };

      this.llm.invoke(messages as any, options)
        .catch(error => {
          observer.error(error);
        });
    });
  }
}

interface BaseMessageLike {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
