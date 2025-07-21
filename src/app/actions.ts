
'use server';

import { aiLogisticsAssistant } from '@/ai/flows/logistics-insights';

export async function getAiInsight(query: string) {

  if (!query) {
    return { insight: 'Please provide a query.', query, data: null };
  }

  try {
    const result = await aiLogisticsAssistant({ query });
    return { insight: result.insight, query, data: result.data };
  } catch (error) {
    console.error(error);
    return { insight: 'Sorry, I could not get an insight at this moment.', query, data: null };
  }
}
