'use client';

import { SharedAiAssistant } from '@/components/ai/shared-ai-assistant';
import { getAiInsightOpenAI, getAiInsightOpenAIClient } from '@/app/actions';
import { useClientInfo } from '@/hooks/use-client-info';
import { ChatMessage } from '@/lib/ai/logistics-assistant';
import { Loader2 } from 'lucide-react';

interface SharedAssistantPageProps {
  role: 'client' | 'employee';
  onLeftContentChange: (content: React.ReactNode) => void;
  onRightContentChange: (content: React.ReactNode) => void;
}

export default function SharedAssistantPage({
  role,
  onLeftContentChange,
  onRightContentChange
}: SharedAssistantPageProps) {
  const { ownerId, loading, error } = role === 'client' ? useClientInfo() : { ownerId: null, loading: false, error: null };

  // Show loading state while fetching client info (only for client role)
  if (role === 'client' && loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-144px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading your client information...</p>
        </div>
      </div>
    );
  }

  // Show error if client info couldn't be loaded (only for client role)
  if (role === 'client' && (error || !ownerId)) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-144px)]">
        <div className="text-center">
          <p className="text-red-600 mb-2">Access Error</p>
          <p className="text-gray-600">{error || 'Unable to access client data. Please contact support.'}</p>
        </div>
      </div>
    );
  }

  // Get the appropriate AI function based on role
  const getAiInsight = role === 'client' 
    ? async (query: string, conversationHistory: ChatMessage[]) => {
        return await getAiInsightOpenAIClient(query, ownerId!, conversationHistory);
      }
    : getAiInsightOpenAI;

  return (
    <SharedAiAssistant 
      getAiInsight={getAiInsight}
      onLeftContentChange={onLeftContentChange}
      onRightContentChange={onRightContentChange}
    />
  );
}