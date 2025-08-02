'use client';

import { SharedAiAssistant } from '@/components/ai/shared-ai-assistant';
import { getAiInsightOpenAI } from '@/app/actions';
import { useHeaderControls } from '../layout';

export default function EmployeeAssistantPage() {
  const { setLeftContent, setRightContent } = useHeaderControls();

  return (
    <SharedAiAssistant 
      getAiInsight={getAiInsightOpenAI}
      onLeftContentChange={setLeftContent}
      onRightContentChange={setRightContent}
    />
  );
}
