
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

// This variable will hold the last query executed by the tool.
let lastExecutedQuery: string | null | undefined = null;

const AiLogisticsAssistantInputSchema = z.object({
  query: z.string().describe('The question about logistics data.'),
});
export type AiLogisticsAssistantInput = z.infer<
  typeof AiLogisticsAssistantInputSchema
>;

// Define a new, extended output schema for our flow that includes the SQL query.
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
  sqlQuery: z
    .string()
    .optional()
    .nullable()
    .describe('The SQL query that was executed to get the data.'),
});
export type AiLogisticsAssistantOutput = z.infer<
  typeof AiLogisticsAssistantOutputSchema
>;

// Define the original, simpler output schema that the AI prompt will use.
// This ensures the AI is not burdened with generating the sqlQuery property.
const AiPromptOutputSchema = z.object({
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
    // Store the query in our module-scoped variable.
    lastExecutedQuery = input.query;
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
 * Fetches the schema of the public tables in the PostgreSQL database that start with 'logistics_'.
 * @returns A string describing the relevant database schema.
 */
async function getDatabaseSchema(): Promise<string> {
  try {
    const query = `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name LIKE 'logistics_%'
      ORDER BY table_name, ordinal_position;
    `;
    const result = await db.query(query, []);
    
    if (result.rows.length === 0) {
      return "No tables starting with 'logistics_' found in the database.";
    }

    const tables: Record<string, string[]> = {};
    result.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(row.column_name);
    });

    const schema = Object.entries(tables)
      .map(([tableName, columns]) => `- Table: ${tableName} (${columns.join(', ')})`)
      .join('\n');
      
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
  output: { schema: AiPromptOutputSchema }, // Use the simpler AI-facing schema
  tools: [executeDbQuery],
  config: {
    temperature: 0,
  },
  prompt: `You are an expert logistics AI assistant. Your role is to answer user questions by generating and executing PostgreSQL queries against a database.

You will be provided with the database schema.

When a user asks to filter by a value (e.g., "for warehouse 10"), you MUST construct the WHERE clause using the exact column name from the schema. For example, if the schema has a 'warehouse' column, your query must use 'WHERE warehouse = '10'', NOT 'WHERE warehouse_id = 10'.

Use the 'executeDbQuery' tool to get the data required to answer the user's question.

Database Schema:
{{{dbSchema}}}

User's question:
{{{query}}}`,
});

const aiLogisticsAssistantFlow = ai.defineFlow(
  {
    name: 'aiLogisticsAssistantFlow',
    inputSchema: AiLogisticsAssistantInputSchema,
    outputSchema: AiLogisticsAssistantOutputSchema, // The flow returns the extended schema
  },
  async (input) => {
    // Reset the last query at the beginning of each flow run.
    lastExecutedQuery = null;
    
    const dbSchema = await getDatabaseSchema();
    const llmResponse = await prompt({
      query: input.query,
      dbSchema: dbSchema,
    });
    
    // Corrected the error: .output is a property, not a function.
    const output = llmResponse.output; 
    const sqlQuery = lastExecutedQuery; // Get the query from our variable.
    
    if (!output) {
      return {
        insight: 'I could not generate a response. Please try again.',
        data: null,
        sqlQuery: sqlQuery,
      };
    }

    const history = (llmResponse as any).history;
    let toolResponseData = null;

    if (history) {
        // We still need to get the data from the tool response.
        const toolResponse = history.find((m: any) => m.role === 'tool');
        if (toolResponse) {
            toolResponseData = toolResponse.content[0]?.part.data;
        }
    }
    
    if (Array.isArray(output) && output.length > 0) {
        return {
            insight: "Here is the data you requested.",
            data: output,
            sqlQuery: sqlQuery,
        }
    }
    
    if (output.insight) {
        if (typeof output.insight === 'string') {
            output.insight = output.insight.replace(/in the logistics_orders table/g, '');
        }
        return {
            insight: output.insight,
            data: toolResponseData || output.data,
            sqlQuery: sqlQuery,
        };
    }

    return {
        insight: 'I received a response, but it was not in the expected format. Here is the raw data.',
        data: toolResponseData || output,
        sqlQuery: sqlQuery,
    };
  }
);
