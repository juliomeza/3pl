
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAiInsightOpenAI } from '@/app/actions';
import { Bot, User, Loader2, RotateCcw, GripVertical } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { ChatMessage } from '@/lib/ai/logistics-assistant';
import { DataVisualizer } from '@/components/ui/data-visualizer';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    data?: any;
    query?: string | null;
};

export default function EmployeeAssistantPage() {
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

      const result = await getAiInsightOpenAI(input, conversationHistory);
      if (result.insight) {
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: result.insight, 
          data: result.data, 
          query: result.query 
        };
        setMessages((prev) => [...prev, assistantMessage]);
        if(result.data) {
          setCurrentData(result.data);
        }
      }
    } catch (error) {
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, I encountered an error.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentData(null);
    setInput('');
  };

  const renderData = () => {
    // Always render DataVisualizer - it handles empty/null data internally
    return <DataVisualizer data={currentData} />;
  };


  return (
    <div 
      className="flex flex-col gap-4 overflow-hidden"
      style={{ height: 'calc(100vh - 144px)' }} // Altura fija reducida para eliminar scroll externo
    >
      {/* Header - Only New Chat Button */}
      <div className="flex items-center justify-end flex-shrink-0 h-10">
        <Button 
          onClick={handleNewChat}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div 
        ref={containerRef}
        className="flex gap-0 overflow-hidden"
        style={{ height: 'calc(100% - 56px)' }} // Altura restante después del header
      >
        {/* Data View Panel (Left) - Hidden on mobile */}
        <div 
          className="hidden lg:flex flex-col"
          style={{ width: `${leftWidth}%`, height: '100%' }}
        >
          <div className="flex flex-col h-full overflow-hidden">
            <div 
              className="flex-1 overflow-auto p-6 custom-scrollbar"
            >
              {renderData()}
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          className="hidden lg:flex items-center justify-center w-2 bg-border hover:bg-border/80 cursor-col-resize group transition-colors"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>

        {/* Chat Panel (Right) */}
        <div 
          className="flex flex-col"
          style={{ width: `${100 - leftWidth}%`, height: '100%' }}
        >
          <div className="flex flex-col h-full overflow-hidden">
            <div 
              className="flex-1 overflow-y-auto space-y-6 p-6 custom-scrollbar"
            >
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Start a conversation by asking a question about your logistics data...</p>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={index} className="group">
                  {message.role === 'user' ? (
                    // User message - gray background, right aligned
                    <div className="flex justify-end">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 max-w-[80%]">
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    // Assistant message - no background, left aligned without icon
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0">
                        <div className="prose prose-sm max-w-none">
                          {message.content.split('\n').map((line, i) => (
                            <p key={i} className="text-sm leading-relaxed mb-2 last:mb-0">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your logistics data..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading}>Ask</Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
