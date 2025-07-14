
'use client';

import { useActionState, useState, useOptimistic, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAiInsight } from '@/app/actions';
import { Bot, User, Loader } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const initialState: { insight: string; query?: string } = {
  insight: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Getting Insight...</> : 'Get Insight'}
    </Button>
  );
}

export function AiAssistant() {
  const [history, setHistory] = useState<Message[]>([
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
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.query && state.insight) {
      setHistory(prev => [
        ...prev,
        { role: 'user', content: state.query! },
        { role: 'assistant', content: state.insight }
      ]);
    }
  }, [state]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline"><Bot /> AI Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-lg mb-4 space-y-4 min-h-[200px] max-h-[300px] overflow-y-auto">
          {history.map((message, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              {message.role === 'user' ? (
                <>
                  <User className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <p className="bg-background p-3 rounded-lg max-w-[85%]">{message.content}</p>
                </>
              ) : (
                <>
                   <Bot className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-1" />
                   <p className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[85%]">{message.content}</p>
                </>
              )}
            </div>
          ))}
        </div>
        <form 
          ref={formRef}
          action={(formData) => {
            formAction(formData);
            formRef.current?.reset();
          }} 
          className="flex flex-col gap-4"
        >
          <Textarea
            name="query"
            placeholder="Ask about your logistics..."
            className="w-full"
            required
          />
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
