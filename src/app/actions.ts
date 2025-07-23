
'use server';

import { aiLogisticsAssistant } from '@/ai/flows/logistics-insights';

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
