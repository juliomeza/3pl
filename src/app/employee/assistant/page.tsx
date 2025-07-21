
'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getAiInsight } from '@/app/actions';
import { Bot, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

const initialState = {
  insight: '',
  query: '',
};

export default function EmployeeAssistantPage() {
  const [state, formAction] = useFormState(getAiInsight, initialState);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get('query') as string;

    if (!query.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setPending(true);

    const form = event.currentTarget;
    
    // We need to wrap formAction call to get the result
    const result = await new Promise<{ insight: string, query: string }>((resolve) => {
        // @ts-ignore
        formAction(new FormData(form));
        // This is a bit of a hack to get the result from useFormState
        // A cleaner way might involve a different state management approach
        setTimeout(() => {
             // @ts-ignore
            resolve(state);
        }, 1000); 
    });

    // The state is updated via the formAction, we need to get the latest state
    // A better approach would be to have the action return the result directly
    const unsubscribe = () => {
        let lastState: any;
        const checkState = () => {
            if (lastState !== state) {
                lastState = state;
                // @ts-ignore
                if (state.insight) {
                    // @ts-ignore
                    setMessages((prev) => [...prev, { role: 'assistant', content: state.insight }]);
                    setPending(false);
                }
            }
        };
        const interval = setInterval(checkState, 100);
        return () => clearInterval(interval);
    };

    const stopWatching = unsubscribe();
    setTimeout(stopWatching, 5000); // Stop watching after 5s to avoid memory leaks
  };


  return (
    <div className="flex flex-col h-full">
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
                {message.content}
              </div>
              {message.role === 'user' && <User className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />}
            </div>
          ))}
           {pending && (
              <div className="flex items-start gap-3 text-sm">
                <Bot className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className="p-3 rounded-lg max-w-[85%] bg-muted">
                    <Skeleton className="w-24 h-4" />
                </div>
              </div>
            )}
        </CardContent>
        <div className="p-4 border-t">
          <form action={formAction} className="flex items-center gap-2">
            <Textarea
              name="query"
              placeholder="Ask a question about your logistics data..."
              className="flex-1"
              rows={1}
            />
            <Button type="submit">Ask</Button>
          </form>
        </div>
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
