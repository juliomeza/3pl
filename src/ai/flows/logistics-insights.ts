
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
    .optional()
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
      .optional()
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
      SELECT table_name, column_name, data_type
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
      tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
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
    temperature: 1.0,
  },
  prompt: `You are an expert logistics AI assistant. Your role is to answer user questions by generating and executing PostgreSQL queries against a database.

You will be provided with the database schema.

IMPORTANT: When constructing a WHERE clause, string literals MUST be enclosed in single quotes (e.g., 'value'). Column names must be enclosed in double quotes (e.g., "column_name").

Database Schema:
{{{dbSchema}}}

Examples:
- Question: How many orders are there?
- Tool call: \`executeDbQuery({ query: 'SELECT count(*) FROM logistics_orders;' })\`

- Question: How many orders for customer "some-customer-name"?
- Tool call: \`executeDbQuery({ query: 'SELECT count(*) FROM logistics_orders WHERE "customer" = 'some-customer-name';' })\`

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
    
    const output = llmResponse.output;
    
    // This is our safeguard.
    // If we have an insight but no SQL query was executed, it's a hallucination.
    if (output?.insight && !lastExecutedQuery) {
      return {
        insight: "I'm sorry, I cannot answer that question at this moment.",
        data: null,
        sqlQuery: null,
      };
    }
    
    if (!output) {
      return {
        insight: 'I could not generate a response. Please try again.',
        data: null,
        sqlQuery: lastExecutedQuery,
      };
    }

    const history = (llmResponse as any).history;
    let toolResponseData = null;
    let sqlQuery = lastExecutedQuery;

    if (history) {
        const toolRequest = history.find((m: any) => m.role === 'model' && m.content[0]?.part.toolRequest);
        if (toolRequest) {
            sqlQuery = toolRequest.content[0].part.toolRequest.input.query;
        }
        
        const toolResponse = history.find((m: any) => m.role === 'tool');
        if (toolResponse) {
            toolResponseData = toolResponse.content[0]?.part.data;
        }
    }
    
    if (toolResponseData) {
        return {
            insight: output.insight || "Here is the data you requested.",
            data: toolResponseData,
            sqlQuery: sqlQuery,
        };
    }

    return {
        insight: output.insight || 'I received a response, but it was not in the expected format. Here is the raw data.',
        data: output.data || output,
        sqlQuery: sqlQuery,
    };
  }
);
