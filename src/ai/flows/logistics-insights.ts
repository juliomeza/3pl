
'use server';

/**
 * @fileOverview AI agent that provides insights from logistics data by querying a PostgreSQL database.
 *
 * - aiLogisticsAssistant - A function that handles logistics data analysis and provides insights.
 * - AiLogisticsAssistantInput - The input type for the aiLogisticsAssistant function.
 * - AiLogisticsAssistantOutput - The return type for the aiLogisticsAssistant function.
 */

import { ai } from '@/ai/genkit';
import { db } from '@/lib/db';
import { z } from 'genkit';

const AiLogisticsAssistantInputSchema = z.object({
  query: z.string().describe('The question about logistics data.'),
});
export type AiLogisticsAssistantInput = z.infer<
  typeof AiLogisticsAssistantInputSchema
>;

const AiLogisticsAssistantOutputSchema = z.object({
  insight: z
    .string()
    .describe(
      'The insight or answer to the question about logistics data, in natural language.'
    ),
  data: z
    .any()
    .optional()
    .describe('The data retrieved to answer the question, if any.'),
});
export type AiLogisticsAssistantOutput = z.infer<
  typeof AiLogisticsAssistantOutputSchema
>;

export async function aiLogisticsAssistant(
  input: AiLogisticsAssistantInput
): Promise<AiLogisticsAssistantOutput> {
  return aiLogisticsAssistantFlow(input);
}

const executeDbQuery = ai.defineTool(
  {
    name: 'executeDbQuery',
    description: 'Executes a PostgreSQL query and returns the result.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'The PostgreSQL query to execute. Should be a SELECT statement.'
        ),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    try {
      console.log(`Executing query: ${input.query}`);
      const result = await db.query(input.query, []);
      return result.rows;
    } catch (error: any) {
      console.error('Database query failed:', error);
      // Return a descriptive error message to the model so it can retry or notify the user.
      return { error: `Query failed: ${error.message}` };
    }
  }
);

const prompt = ai.definePrompt({
  name: 'aiLogisticsAssistantPrompt',
  input: { schema: AiLogisticsAssistantInputSchema },
  output: { schema: AiLogisticsAssistantOutputSchema },
  tools: [executeDbQuery],
  prompt: `You are an expert logistics AI assistant. You answer user questions about logistics by generating and executing PostgreSQL queries against a database.

Respond to the user's question based on the provided database schema. Use the 'executeDbQuery' tool to get the data.

Database schema:
- Table: data_orders (order_id, customer_name, order_date, status, total_amount)

User's question: {{{query}}}`,
});

const aiLogisticsAssistantFlow = ai.defineFlow(
  {
    name: 'aiLogisticsAssistantFlow',
    inputSchema: AiLogisticsAssistantInputSchema,
    outputSchema: AiLogisticsAssistantOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    const output = llmResponse.output;

    if (!output) {
      return {
        insight: 'I could not generate a response. Please try again.',
        data: null,
      };
    }

    return {
      insight: output.insight,
      data: output.data,
    };
  }
);
