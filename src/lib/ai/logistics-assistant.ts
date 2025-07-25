import { openai } from './openai-client';
import { db } from '@/lib/db';

export interface SqlQueryResult {
  insight: string;
  data: any[] | null;
  sqlQuery: string | null;
  error?: string;
}

/**
 * Get database schema for logistics tables
 */
async function getDatabaseSchema(): Promise<string> {
  try {
    const query = `
      SELECT table_name, column_name, data_type, is_nullable
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
      const nullable = row.is_nullable === 'YES' ? ' (nullable)' : '';
      tables[row.table_name].push(`${row.column_name} (${row.data_type}${nullable})`);
    });

    const schema = Object.entries(tables)
      .map(([tableName, columns]) => `- Table: ${tableName}\n  Columns: ${columns.join(', ')}`)
      .join('\n');
      
    return schema;
  } catch (error) {
    console.error('Failed to fetch database schema:', error);
    return 'Could not retrieve database schema.';
  }
}

/**
 * Convert natural language to SQL query using OpenAI
 */
async function convertToSql(userQuery: string, schema: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a PostgreSQL expert. Convert natural language questions to PostgreSQL queries.

Database Schema:
${schema}

Rules:
- Return ONLY the SQL query, no explanations or markdown
- Use proper PostgreSQL syntax
- String literals must be in single quotes (e.g., 'value')
- Column names in double quotes if they contain special characters
- Use SELECT statements only
- Handle JOINs appropriately for related tables
- Limit results to reasonable numbers (add LIMIT if appropriate)
- Focus on tables that start with 'logistics_'

Examples:
- "How many orders are there?" → SELECT COUNT(*) FROM logistics_orders;
- "Show recent orders" → SELECT * FROM logistics_orders ORDER BY created_at DESC LIMIT 10;`
        },
        {
          role: "user",
          content: userQuery
        }
      ],
      temperature: 0.1, // Low temperature for more deterministic SQL
      max_tokens: 500
    });

    const sqlQuery = response.choices[0].message.content?.trim() || '';
    
    // Basic validation - ensure it's a SELECT statement
    if (!sqlQuery.toLowerCase().startsWith('select')) {
      throw new Error('Generated query is not a SELECT statement');
    }

    return sqlQuery;
  } catch (error) {
    console.error('Failed to convert to SQL:', error);
    throw new Error('Could not generate SQL query from your request');
  }
}

/**
 * Execute SQL query against the database
 */
async function executeSqlQuery(sqlQuery: string): Promise<any[]> {
  try {
    console.log(`Executing OpenAI-generated query: ${sqlQuery}`);
    const result = await db.query(sqlQuery, []);
    return result.rows;
  } catch (error: any) {
    console.error('Database query failed:', error);
    throw new Error(`Query execution failed: ${error.message}`);
  }
}

/**
 * Generate natural language explanation of the results
 */
async function explainResults(userQuery: string, sqlQuery: string, data: any[]): Promise<string> {
  try {
    const dataPreview = data.length > 0 ? JSON.stringify(data.slice(0, 3), null, 2) : 'No data returned';
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a logistics data analyst. Provide clear, concise explanations of query results.

Guidelines:
- Be conversational and helpful
- Explain what the data shows in business terms
- Mention key insights or patterns
- Keep explanations brief but informative
- If no data is returned, explain why that might be`
        },
        {
          role: "user",
          content: `User asked: "${userQuery}"
SQL executed: ${sqlQuery}
Data returned (${data.length} rows): ${dataPreview}

Please explain what this data shows.`
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    return response.choices[0].message.content || 'Here are your query results.';
  } catch (error) {
    console.error('Failed to generate explanation:', error);
    return 'Here are your query results.';
  }
}

/**
 * Main function to process natural language queries using OpenAI
 */
export async function processLogisticsQuery(userQuery: string): Promise<SqlQueryResult> {
  try {
    // Get database schema
    const schema = await getDatabaseSchema();
    
    // Convert to SQL using OpenAI
    const sqlQuery = await convertToSql(userQuery, schema);
    
    // Execute the query
    const data = await executeSqlQuery(sqlQuery);
    
    // Generate explanation
    const insight = await explainResults(userQuery, sqlQuery, data);
    
    return {
      insight,
      data,
      sqlQuery
    };
  } catch (error: any) {
    console.error('Error processing logistics query:', error);
    
    return {
      insight: `I apologize, but I encountered an error while processing your request: ${error.message}. Please try rephrasing your question or contact support if the issue persists.`,
      data: null,
      sqlQuery: null,
      error: error.message
    };
  }
}
