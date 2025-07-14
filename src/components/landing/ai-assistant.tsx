'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAiInsight } from '@/app/actions';
import { Bot, User, Loader } from 'lucide-react';

const initialState = {
  insight: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Getting Insight...</> : 'Get Insight'}
    </Button>
  );
}

export function AiAssistant() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([
    {
      role: 'user',
      content: 'What are my biggest shipping costs this month?',
    },
    {
      role: 'assistant',
      content:
        'Your biggest shipping costs are international deliveries ($12,450), followed by express shipping ($8,230). I recommend optimizing routes for 15% savings.',
    },
  ]);
  const [state, formAction] = useActionState(getAiInsight, initialState);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userQuery = formData.get('query') as string;

    if (!userQuery) return;
    
    setHistory((prev) => [
        ...prev,
        { role: 'user', content: userQuery }
    ]);
    
    formAction(formData);
    
    // This is a little trick to await the result from the server action
    // and then update the history with the assistant's response.
    const form = event.currentTarget;
    const insightPromise = new Promise<{ insight: string }>((resolve) => {
        const checkInterval = setInterval(() => {
            if (form.getAttribute('data-state-insight')) {
                clearInterval(checkInterval);
                resolve({ insight: form.getAttribute('data-state-insight')! });
                form.removeAttribute('data-state-insight');
            }
        }, 100);
    });

    const { insight } = await getAiInsight(initialState, formData);

    if (insight) {
        setHistory((prev) => [
            ...prev,
            { role: 'assistant', content: insight }
        ]);
    }

    event.currentTarget.reset();
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline"><Bot /> AI Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-lg mb-4 space-y-4 min-h-[120px]">
          {history.map((message, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              {message.role === 'user' ? (
                <>
                  <User className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <p className="bg-background p-3 rounded-lg max-w-[85%]">{message.content}</p>
                </>
              ) : (
                <>
                   <Bot className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                   <p className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[85%]">{message.content}</p>
                </>
              )}
            </div>
          ))}
          {state.insight && history.length === 0 && (
             <div className="flex items-start gap-2 text-sm">
                <Bot className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                <p className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[85%]">{state.insight}</p>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Textarea
            name="query"
            placeholder="What are my biggest shipping costs this month?"
            className="w-full"
            required
          />
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
