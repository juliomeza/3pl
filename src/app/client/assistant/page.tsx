
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getAiInsightOpenAI } from '@/app/actions';
import { Bot, User, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';

type Message = {
    role: 'user' | 'assistant';
    content: string;
    data?: any;
    query?: string | null;
};

export default function ClientAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState<any>(null);
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);

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
      const result = await getAiInsightOpenAI(input);
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

  const renderData = () => {
    if (currentData === null) {
      return <p className="text-muted-foreground">Query results will appear here when available.</p>;
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
            {currentData.map((row, index) => (
              <TableRow key={index}>
                {Object.values(row).map((value, cellIndex) => (
                  <TableCell key={cellIndex}>{String(value)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    // For other types, show as JSON
    return <pre className="text-sm bg-muted p-2 rounded">{JSON.stringify(currentData, null, 2)}</pre>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      {/* Chat Interface */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            AI Logistics Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ask me anything about your logistics data!</p>
              <p className="text-sm">Try: "How many orders do we have?" or "Show recent shipments"</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && <Bot className="w-6 h-6 mt-1 text-blue-600" />}
                <div className={`rounded-lg p-3 max-w-[80%] ${
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-muted'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.role === 'user' && <User className="w-6 h-6 mt-1 text-blue-600" />}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-blue-600" />
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your logistics data..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
            </Button>
          </form>
        </CardFooter>
      </Card>

      {/* Data Visualization */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Query Results</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-auto">
            {renderData()}
          </CardContent>
        </Card>

        {currentQuery && (
          <Card>
            <CardHeader>
              <CardTitle>Generated SQL Query</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm bg-muted p-3 rounded overflow-auto">
                {currentQuery}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
