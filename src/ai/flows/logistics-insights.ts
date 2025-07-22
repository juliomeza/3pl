
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
      return { error: `Query failed: ${error.message}` };
    }
  }
);

/**
 * Fetches the schema of the public tables in the PostgreSQL database that start with 'data_'.
 * @returns A string describing the relevant database schema as CREATE TABLE statements.
 */
async function getDatabaseSchema(): Promise<string> {
  try {
    const query = `
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name LIKE 'data_%'
      ORDER BY table_name, ordinal_position;
    `;
    const result = await db.query(query, []);
    
    if (result.rows.length === 0) {
      return "No tables starting with 'data_' found in the database.";
    }

    const tables: Record<string, { column_name: string, data_type: string }[]> = {};
    result.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push({ column_name: row.column_name, data_type: row.data_type });
    });

    const schema = Object.entries(tables)
      .map(([tableName, columns]) => {
        const columnDefinitions = columns
          .map(col => `  "${col.column_name}" ${col.data_type}`)
          .join(',\n');
        return `CREATE TABLE "${tableName}" (\n${columnDefinitions}\n);`;
      })
      .join('\n\n');
      
    return schema;
  } catch (error) {
    console.error('Failed to fetch database schema:', error);
    return 'Could not retrieve database schema.';
  }
}

const prompt = ai.definePrompt({
  name: 'aiLogisticsAssistantPrompt',
  input: { schema: z.object({
    query: z.string(),
    dbSchema: z.string(),
  })},
  output: { schema: AiLogisticsAssistantOutputSchema },
  tools: [executeDbQuery],
  config: {
    temperature: 0,
  },
  prompt: `You are an expert logistics AI assistant. Your role is to answer user questions by generating and executing PostgreSQL queries against a database.

You will be provided with a database schema in the format of CREATE TABLE statements.

RULES:
1. You MUST use the 'executeDbQuery' tool to get the data required to answer the user's question. Do not answer based on prior knowledge.
2. You MUST NOT invent columns that are not present in the provided schema.
3. You MUST use double quotes around table and column names in your queries to ensure correct casing (e.g., SELECT "columnName" FROM "tableName").
4. Formulate your final answer in natural, conversational language. Do not mention that you are querying a table. For example, instead of "There are 5 orders in the data_orders table", say "There are 5 orders."

DATABASE SCHEMA:
{{{dbSchema}}}

Based on the schema and rules above, answer the following user question.

User's question: {{{query}}}`,
});

const aiLogisticsAssistantFlow = ai.defineFlow(
  {
    name: 'aiLogisticsAssistantFlow',
    inputSchema: AiLogisticsAssistantInputSchema,
    outputSchema: AiLogisticsAssistantOutputSchema,
  },
  async (input) => {
    // Dynamically fetch the schema
    const dbSchema = await getDatabaseSchema();

    const llmResponse = await prompt({
      query: input.query,
      dbSchema: dbSchema,
    });
    
    const output = llmResponse.output;

    if (!output) {
      return {
        insight: 'I could not generate a response. Please try again.',
        data: null,
      };
    }

    // Check if the LLM decided to return data directly without an insight
    if (Array.isArray(output) && output.length > 0) {
        return {
            insight: "Here is the data you requested.",
            data: output,
        }
    }
    
    // Check if the output has the expected structure
    if (output.insight) {
        return {
            insight: output.insight,
            data: output.data,
        };
    }

    // Fallback for unexpected LLM output formats
    return {
        insight: 'I received a response, but it was not in the expected format. Here is the raw data.',
        data: output
    };
  }
);
