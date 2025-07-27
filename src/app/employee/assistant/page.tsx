
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getAiInsightOpenAI } from '@/app/actions';
import { Bot, User, Loader2, RotateCcw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { ChatMessage } from '@/lib/ai/logistics-assistant';

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
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on input after sending message
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentData(null);
    setCurrentQuery(null);
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
        if (result.query) {
          setCurrentQuery(result.query);
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
    setCurrentQuery(null);
    setInput('');
  };

  const renderData = () => {
    if (currentData === null) {
      return <p className="text-muted-foreground">The data table corresponding to your query will appear here.</p>;
    }

    if (Array.isArray(currentData) && currentData.length === 0) {
      return <p className="text-muted-foreground">No data found for this query.</p>;
    }
    
    // If it's an array of objects, render a table
    if (Array.isArray(currentData) && currentData.length > 0 && typeof currentData[0] === 'object') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              {Object.keys(currentData[0]).map(key => <TableHead key={key}>{key}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((row: any, rowIndex: number) => (
              <TableRow key={rowIndex}>
                {Object.values(row).map((cell: any, cellIndex: number) => <TableCell key={cellIndex}>{String(cell)}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    
    // Otherwise, stringify the data and show it in a preformatted block
    return (
      <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
        <code>{JSON.stringify(currentData, null, 2)}</code>
      </pre>
    );
  };


  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] gap-4">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline">AI Logistics Assistant</h1>
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
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 p-6">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Start a conversation by asking a question about your logistics data...</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 text-sm ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && <Bot className="w-5 h-5 text-primary flex-shrink-0 mt-1" />}
                <div className={`p-3 rounded-lg max-w-[85%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {message.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
                {message.role === 'user' && <User className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />}
              </div>
            ))}
            {isLoading && (
                <div className="flex items-start gap-3 text-sm">
                  <Bot className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div className="p-3 rounded-lg max-w-[85%] bg-muted flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Thinking...</span>
                  </div>
                </div>
              )}
          </CardContent>
          <CardFooter className="p-4 border-t">
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
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[40%]">
        <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold font-headline">SQL Query</h2>
            <Card className="flex-1 overflow-auto">
                <CardContent className="p-6">
                {currentQuery ? (
                    <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto"><code>{currentQuery}</code></pre>
                ) : (
                    <p className="text-muted-foreground">The SQL query will appear here.</p>
                )}
                </CardContent>
            </Card>
        </div>
        <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold font-headline">Data View</h2>
            <Card className="flex-1 overflow-auto">
                <CardContent className="p-6">
                 {renderData()}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
