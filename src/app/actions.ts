
'use server';

import { aiLogisticsAssistant } from '@/ai/flows/logistics-insights';

export async function getAiInsight(prevState: any, formData: FormData) {
  const query = formData.get('query') as string;

  if (!query) {
    return { insight: 'Please provide a query.', query };
  }

  try {
    const result = await aiLogisticsAssistant({ query });
    return { insight: result.insight, query };
  } catch (error) {
    console.error(error);
    return { insight: 'Sorry, I could not get an insight at this moment.', query };
  }
}
