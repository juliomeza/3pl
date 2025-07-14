'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
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
  const [state, formAction] = useFormState(getAiInsight, initialState);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setQuery(formData.get('query') as string);
    formAction(formData);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline"><Bot /> AI Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-lg mb-4 space-y-4 min-h-[120px]">
          {query && (
             <div className="flex items-start gap-2 text-sm">
                <User className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <p className="bg-background p-3 rounded-lg max-w-[85%]">{query}</p>
             </div>
          )}
          {state.insight && (
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
