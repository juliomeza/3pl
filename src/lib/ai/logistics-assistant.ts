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
          content: `You are a PostgreSQL expert specializing in logistics data analysis. Convert natural language questions to PostgreSQL queries.

Database Schema:
${schema}

CRITICAL RULES for logistics_orders table:
- customer: Use ILIKE for partial matching (e.g., "Abbott" should match "Abbott Nutrition")
- warehouse: Use exact match or ILIKE if user seems to want partial matching
- warehouse_city_state: Use ILIKE for city/state searches
- order_number, shipment_number: Use exact match or ILIKE for partial matches
- order_type: Common values are "Outbound", "Inbound" 
- date: Handle date ranges and comparisons properly
- order_class: Use ILIKE for partial matching
- destination_state, source_state: Use ILIKE for state matching
- month_name: Use exact match for month names
- year, month, quarter, week, day: Use numeric comparisons

SQL SYNTAX RULES:
- Return ONLY the SQL query, no explanations or markdown
- Use proper PostgreSQL syntax
- String literals in single quotes (e.g., 'value')
- Column names in double quotes if they contain special characters
- Use ILIKE '%pattern%' for partial text matching (case-insensitive)
- Use = only for exact matches when explicitly requested
- Handle JOINs appropriately for related tables
- Add LIMIT for large result sets (default LIMIT 100 unless user specifies)
- Focus on tables that start with 'logistics_'

PATTERN MATCHING EXAMPLES:
- "How many orders for customer Abbott" → WHERE "customer" ILIKE '%Abbott%'
- "Orders from Florida" → WHERE "source_state" ILIKE '%Florida%' OR "destination_state" ILIKE '%Florida%'
- "Show orders for warehouse 10" → WHERE "warehouse" = '10'
- "Orders in June" → WHERE "month_name" = 'June'
- "Recent orders" → ORDER BY "date" DESC LIMIT 10
- "Orders this year" → WHERE "year" = 2025

SPECIFIC EXAMPLES:
- "How many orders are there?" → SELECT COUNT(*) FROM logistics_orders;
- "How many orders for customer Abbott?" → SELECT COUNT(*) FROM logistics_orders WHERE "customer" ILIKE '%Abbott%';
- "Show recent orders for Methapharm" → SELECT * FROM logistics_orders WHERE "customer" ILIKE '%Methapharm%' ORDER BY "date" DESC LIMIT 10;
- "Orders by state" → SELECT "destination_state", COUNT(*) FROM logistics_orders GROUP BY "destination_state" ORDER BY COUNT(*) DESC;`
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
