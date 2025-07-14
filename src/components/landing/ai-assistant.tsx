import { Bot, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const history: Message[] = [
  {
    role: 'user',
    content: 'What are my biggest shipping costs this month?',
  },
  {
    role: 'assistant',
    content:
      'Your biggest shipping costs are international deliveries ($12,450), followed by express shipping ($8,230). I recommend optimizing routes for 15% savings.',
  },
];

export function AiAssistant() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline"><Bot /> AI Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-lg space-y-4 min-h-[200px]">
          {history.map((message, index) => (
            <div key={index} className="flex items-start gap-3 text-sm">
              {message.role === 'user' ? (
                <>
                  <User className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <p className="bg-background p-3 rounded-lg max-w-[85%]">{message.content}</p>
                </>
              ) : (
                <>
                   <Bot className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-1" />
                   <p className="bg-foreground text-background p-3 rounded-lg max-w-[85%]">{message.content}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
