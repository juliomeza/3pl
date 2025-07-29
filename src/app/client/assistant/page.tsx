'use client';

import { SharedAiAssistant } from '@/components/ai/shared-ai-assistant';
import { getAiInsightOpenAIClient } from '@/app/actions';
import { useClientInfo } from '@/hooks/use-client-info';
import { ChatMessage } from '@/lib/ai/logistics-assistant';
import { Loader2 } from 'lucide-react';

export default function ClientAssistantPage() {
  const { ownerId, loading, error } = useClientInfo();

  // Show loading state while fetching client info
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-144px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading your client information...</p>
        </div>
      </div>
    );
  }

  // Show error if client info couldn't be loaded
  if (error || !ownerId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-144px)]">
        <div className="text-center">
          <p className="text-red-600 mb-2">Access Error</p>
          <p className="text-gray-600">{error || 'Unable to access client data. Please contact support.'}</p>
        </div>
      </div>
    );
  }

  // Wrapper function to pass ownerId to the AI function
  const getClientAiInsight = async (query: string, conversationHistory: ChatMessage[]) => {
    return await getAiInsightOpenAIClient(query, ownerId, conversationHistory);
  };

  return (
    <SharedAiAssistant 
      getAiInsight={getClientAiInsight}
    />
  );
}
