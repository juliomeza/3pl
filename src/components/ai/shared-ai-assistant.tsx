'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Loader2, RotateCcw, GripVertical } from 'lucide-react';
import { ChatMessage } from '@/lib/ai/logistics-assistant';
import { DataVisualizer } from '@/components/ui/data-visualizer';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  query?: string | null;
};

interface SharedAiAssistantProps {
  title: string;
  getAiInsight: (query: string, conversationHistory: ChatMessage[]) => Promise<{
    insight: string;
    query: string | null;
    data: any;
    error?: string;
  }>;
}

export function SharedAiAssistant({ title, getAiInsight }: SharedAiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState<any>(null);
  const [leftWidth, setLeftWidth] = useState(50); // Percentage for left panel
  const [isResizing, setIsResizing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Keep focus on input after sending message
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Handle mouse resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 20% and 80%
    const constrainedWidth = Math.min(Math.max(newLeftWidth, 20), 80);
    setLeftWidth(constrainedWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentData(null);
    setInput('');

    try {
      // Convert messages to ChatMessage format for conversation history
      const conversationHistory: ChatMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        sqlQuery: msg.query || null,
        data: msg.data
      }));

      const response = await getAiInsight(input, conversationHistory);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.insight,
        data: response.data,
        query: response.query
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setCurrentData(response.data);
      } else {
        setCurrentData(null);
      }
    } catch (error) {
      console.error('AI query failed:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentData(null);
    setInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {/* Main Container with Fixed Height */}
      <div 
        ref={containerRef}
        className="flex h-[calc(100vh-144px)] bg-white rounded-lg border overflow-hidden"
      >
        {/* Left Panel - Data Visualization (Desktop only) */}
        <div 
          className="hidden lg:flex flex-col bg-gray-50"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="p-4 border-b bg-white">
            <h2 className="font-semibold text-gray-900">Data Visualization</h2>
          </div>
          <div className="flex-1 p-4 overflow-auto custom-scrollbar">
            <DataVisualizer data={currentData} />
          </div>
        </div>

        {/* Resize Handle (Desktop only) */}
        <div 
          className="hidden lg:flex items-center justify-center w-2 bg-gray-200 cursor-col-resize hover:bg-gray-300 transition-colors"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Right Panel - Chat Interface */}
        <div 
          className="flex flex-col bg-white w-full lg:w-auto"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 relative">
            <h2 className="font-semibold text-gray-900">AI Assistant</h2>
            <Button
              onClick={clearChat}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 absolute top-4 right-4 z-10"
            >
              <RotateCcw className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Ask me about your logistics data!</p>
                <p className="text-sm mt-1">Try: "How many orders this month?" or "Show recent shipments"</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'bg-white text-gray-900 border'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.query && (
                      <div className="mt-2 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded border">
                        SQL: {message.query}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white text-gray-900 border px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analyzing your request...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Data Visualization (Mobile) */}
          <div className="lg:hidden border-t">
            <div className="p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">Data Visualization</h3>
              <div className="max-h-96 overflow-auto">
                <DataVisualizer data={currentData} />
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t bg-gray-50">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your logistics data..."
                disabled={isLoading}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
