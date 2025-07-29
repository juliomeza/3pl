'use client';

import { SharedAiAssistant } from '@/components/ai/shared-ai-assistant';
import { getAiInsightOpenAI } from '@/app/actions';

export default function EmployeeAssistantPage() {
  return (
    <SharedAiAssistant 
      title="Employee AI Assistant"
      getAiInsight={getAiInsightOpenAI}
    />
  );
}
