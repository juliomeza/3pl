'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Loader2, RotateCcw, GripVertical, TableIcon, BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { ChatMessage } from '@/lib/ai/logistics-assistant';
import { DataVisualizer } from '@/components/ui/data-visualizer';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  query?: string | null;
};

type ViewType = 'table' | 'bar' | 'pie' | 'line';

interface SharedAiAssistantProps {
  getAiInsight: (query: string, conversationHistory: ChatMessage[]) => Promise<{
    insight: string;
    query: string | null;
    data: any;
    error?: string;
  }>;
}

export function SharedAiAssistant({ getAiInsight }: SharedAiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState<any>(null);
  const [leftWidth, setLeftWidth] = useState(50); // Percentage for left panel
  const [isResizing, setIsResizing] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('table');
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
      {/* Main Container with Fixed Height */}
      <div 
        ref={containerRef}
        className="flex h-[calc(100vh-144px)] bg-transparent overflow-hidden"
      >
        {/* Left Panel - Data Visualization (Desktop only) */}
        <div 
          className="hidden lg:flex flex-col bg-transparent"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="p-4 bg-transparent">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={viewType === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('table')}
                className="flex items-center gap-1 text-xs"
              >
                <TableIcon className="w-3 h-3" />
                Table
              </Button>

              <Button
                variant={viewType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('bar')}
                className="flex items-center gap-1 text-xs"
              >
                <BarChart3 className="w-3 h-3" />
                Bar
              </Button>

              <Button
                variant={viewType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('pie')}
                className="flex items-center gap-1 text-xs"
              >
                <PieChartIcon className="w-3 h-3" />
                Pie
              </Button>

              <Button
                variant={viewType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('line')}
                className="flex items-center gap-1 text-xs"
              >
                <TrendingUp className="w-3 h-3" />
                Line
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto custom-scrollbar">
            <DataVisualizer data={currentData} viewType={viewType} />
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
          className="flex flex-col bg-transparent w-full lg:w-auto relative"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {/* Fixed New Chat Button */}
          <Button
            onClick={clearChat}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 absolute top-4 right-4 z-30"
          >
            <RotateCcw className="w-4 h-4" />
            New Chat
          </Button>

          {/* Fade out overlay for New Chat button area */}
          <div className="absolute top-0 right-0 w-40 h-16 bg-gradient-to-l from-[#FAFBFD] via-[#FAFBFD]/80 to-transparent pointer-events-none z-20"></div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 pt-16 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${message.role === 'user' ? 'max-w-[80%]' : 'w-full'}`}>
                  <div className={`${
                    message.role === 'user' 
                      ? 'px-4 py-2 rounded-lg bg-gray-100 text-gray-900' 
                      : 'text-gray-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    {message.query && (
                      <div className="mt-3 text-[10px] text-gray-600 font-mono bg-slate-50 border border-slate-200 p-3 rounded-lg">
                        SQL: {message.query}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="w-full">
                  <div className="text-gray-900">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm leading-relaxed">Analyzing your request...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Data Visualization (Mobile) */}
          <div className="lg:hidden">
            <div className="p-4 bg-transparent">
              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  variant={viewType === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewType('table')}
                  className="flex items-center gap-1 text-xs"
                >
                  <TableIcon className="w-3 h-3" />
                  Table
                </Button>

                <Button
                  variant={viewType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewType('bar')}
                  className="flex items-center gap-1 text-xs"
                >
                  <BarChart3 className="w-3 h-3" />
                  Bar
                </Button>

                <Button
                  variant={viewType === 'pie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewType('pie')}
                  className="flex items-center gap-1 text-xs"
                >
                  <PieChartIcon className="w-3 h-3" />
                  Pie
                </Button>

                <Button
                  variant={viewType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewType('line')}
                  className="flex items-center gap-1 text-xs"
                >
                  <TrendingUp className="w-3 h-3" />
                  Line
                </Button>
              </div>
              <div className="max-h-96 overflow-auto">
                <DataVisualizer data={currentData} viewType={viewType} />
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-transparent">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your logistics data..."
                disabled={isLoading}
                className="flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-300 focus-visible:outline-none"
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
