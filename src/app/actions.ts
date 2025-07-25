
'use server';

import { processLogisticsQuery } from '@/lib/ai/logistics-assistant';

// OpenAI-powered logistics assistant
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
