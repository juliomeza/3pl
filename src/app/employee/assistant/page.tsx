
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getAiInsight } from '@/app/actions';
import { Bot, User, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export default function EmployeeAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    const formData = new FormData();
    formData.append('query', input);

    try {
      const result = await getAiInsight(null, formData);
      if (result.insight) {
        const assistantMessage: Message = { role: 'assistant', content: result.insight };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, I encountered an error.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <h1 className="text-3xl font-bold font-headline mb-4">AI Logistics Assistant</h1>
      
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4 p-6">
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

      <div className="mt-8">
        <h2 className="text-2xl font-bold font-headline mb-4">Data View</h2>
        <Card>
            <CardContent className="p-6">
                <p className="text-muted-foreground">The data table corresponding to your query will appear here.</p>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
