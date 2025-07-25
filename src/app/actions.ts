
'use server';

import { aiLogisticsAssistant } from '@/ai/flows/logistics-insights';
import { processLogisticsQuery } from '@/lib/ai/logistics-assistant';

// OpenAI-powered logistics assistant (new implementation)
export async function getAiInsightOpenAI(query: string) {
  if (!query) {
    return { insight: 'Please provide a query.', query: null, data: null };
  }

  try {
    const result = await processLogisticsQuery(query);
    return { 
      insight: result.insight, 
      query: result.sqlQuery, 
      data: result.data,
      error: result.error
    };
  } catch (error) {
    console.error('OpenAI logistics query failed:', error);
    return { 
      insight: 'Sorry, I could not process your request at this moment.', 
      query: null, 
      data: null,
      error: 'Server error'
    };
  }
}

// Legacy Genkit implementation (kept for fallback)
export async function getAiInsight(query: string) {
  if (!query) {
    return { insight: 'Please provide a query.', query: null, data: null };
  }

  try {
    const result = await aiLogisticsAssistant({ query });
    // Pass the sqlQuery from the AI flow to the UI.
    return { insight: result.insight, query: result.sqlQuery, data: result.data };
  } catch (error) {
    console.error(error);
    return { insight: 'Sorry, I could not get an insight at this moment.', query: null, data: null };
  }
}
