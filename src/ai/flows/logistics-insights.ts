
'use server'

/**
 * @fileOverview AI agent that provides insights from logistics data.
 *
 * - aiLogisticsAssistant - A function that handles logistics data analysis and provides insights.
 * - AiLogisticsAssistantInput - The input type for the aiLogisticsAssistant function.
 * - AiLogisticsAssistantOutput - The return type for the aiLogisticsAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { db } from '@/lib/db';

const AiLogisticsAssistantInputSchema = z.object({
  query: z.string().describe('The question about logistics data.'),
});
export type AiLogisticsAssistantInput = z.infer<typeof AiLogisticsAssistantInputSchema>;

const AiLogisticsAssistantOutputSchema = z.object({
  insight: z.string().describe('The insight or answer to the question about logistics data.'),
  data: z.any().optional().describe('The data retrieved to answer the question, if any.'),
});
export type AiLogisticsAssistantOutput = z.infer<typeof AiLogisticsAssistantOutputSchema>;

export async function aiLogisticsAssistant(input: AiLogisticsAssistantInput): Promise<AiLogisticsAssistantOutput> {
  return aiLogisticsAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiLogisticsAssistantPrompt',
  input: {schema: AiLogisticsAssistantInputSchema},
  output: {schema: AiLogisticsAssistantOutputSchema},
  prompt: `You are a logistics expert AI assistant. Analyze the logistics data and provide insights to the user based on their questions.

Question: {{{query}}}`,
});

const aiLogisticsAssistantFlow = ai.defineFlow(
  {
    name: 'aiLogisticsAssistantFlow',
    inputSchema: AiLogisticsAssistantInputSchema,
    outputSchema: AiLogisticsAssistantOutputSchema,
  },
  async (input) => {
    try {
      const result = await db.query('SELECT NOW()', []);
      const time = result.rows[0].now;
      return {
        insight: `Successfully connected to the database! The current database time is: ${time}. We can now proceed with the next steps.`,
        data: null,
      };
    } catch (error: any) {
      console.error('Database connection test failed:', error);
      return {
        insight: `Database connection failed. Please check your POSTGRES_URL in the .env file. Error: ${error.message}`,
        data: null,
      };
    }
  }
);
