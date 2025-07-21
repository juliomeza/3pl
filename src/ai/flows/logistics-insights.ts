
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
  prompt: `You are an expert logistics AI assistant. Your role is to answer questions about logistics data by querying a PostgreSQL database.

When the user asks a question, you must:
1. Formulate a precise PostgreSQL query to retrieve the necessary data. For example, if the user asks for orders, you should query the 'data_orders' table.
2. Use the 'executeDbQuery' tool to run the query.
3. Analyze the results from the tool.
4. Provide a concise, natural language answer to the user's original question based on the data.
5. Set the 'data' field in the output to the raw data you received from the tool.

Important: If a query fails, inform the user that there was an issue and provide the error details. Do not try to make up an answer.

Here are some example table schemas you can use:
- data_orders (order_id, customer_name, order_date, status, total_amount)
- data_inventory (product_id, product_name, quantity, location)
- data_shipments (shipment_id, order_id, carrier, tracking_number, status)

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
    const output = llmResponse.output();

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
