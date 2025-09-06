'use client';

import React, { useState } from 'react';
import { useGPT5Responses } from '@/hooks/useGPT5Responses';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Trash2, Settings } from 'lucide-react';

export default function GPT5Chat() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    reasoningEffort: 'medium' as 'minimal' | 'low' | 'medium' | 'high',
    verbosity: 'medium' as 'low' | 'medium' | 'high',
    temperature: 0.7,
    maxTokens: 4096,
  });

  const {
    messages,
    input,
    isLoading,
    isThinking,
    error,
    conversationId,
    handleInputChange,
    handleSubmit,
    clearConversation,
  } = useGPT5Responses({
    systemPrompt: `You are a helpful AI assistant powered by GPT-5. 
                   You have advanced reasoning capabilities and can handle complex tasks.
                   Be concise but thorough in your responses.`,
    ...settings,
    onError: (error) => {
      console.error('GPT-5 Error:', error);
    },    onFinish: (message) => {
      console.log('Response completed:', message);
    },
  });

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>GPT-5 Chat</CardTitle>
              <Badge variant="secondary">Responses API</Badge>
              {conversationId && (
                <Badge variant="outline" className="text-xs">
                  ID: {conversationId.slice(0, 8)}...
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"                onClick={clearConversation}
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {showSettings && (
          <div className="p-4 border-b bg-muted/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Reasoning</label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={settings.reasoningEffort}
                  onChange={(e) => setSettings({
                    ...settings,
                    reasoningEffort: e.target.value as any
                  })}
                >
                  <option value="minimal">Minimal</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Verbosity</label>                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={settings.verbosity}
                  onChange={(e) => setSettings({
                    ...settings,
                    verbosity: e.target.value as any
                  })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Temperature</label>
                <input
                  type="number"
                  className="w-full mt-1 p-2 border rounded"
                  value={settings.temperature}
                  min="0"
                  max="2"
                  step="0.1"
                  onChange={(e) => setSettings({
                    ...settings,
                    temperature: parseFloat(e.target.value)
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Tokens</label>                <input
                  type="number"
                  className="w-full mt-1 p-2 border rounded"
                  value={settings.maxTokens}
                  min="100"
                  max="128000"
                  step="100"
                  onChange={(e) => setSettings({
                    ...settings,
                    maxTokens: parseInt(e.target.value)
                  })}
                />
              </div>
            </div>
          </div>
        )}

        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>Start a conversation with GPT-5</p>
                <p className="text-sm mt-2">
                  Using the new Responses API with enhanced reasoning capabilities
                </p>
              </div>
            )}
            
            {messages.map((message) => (              <div
                key={message.id}
                className={`mb-4 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-xs font-medium mb-1 opacity-70">
                    {message.role === 'user' ? 'You' : 'GPT-5'}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            
            {isThinking && (
              <div className="mb-4 text-left">
                <div className="inline-block p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">GPT-5 is thinking deeply...</span>
                  </div>
                </div>              </div>
            )}
            
            {isLoading && !isThinking && (
              <div className="mb-4 text-left">
                <div className="inline-block p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating response...</span>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                Error: {error.message}
              </div>
            )}
          </ScrollArea>
        </CardContent>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message here..."
              className="flex-1"              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}