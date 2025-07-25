import { openai } from './openai-client';
import { db } from '@/lib/db';

export interface SqlQueryResult {
  insight: string;
  data: any[] | null;
  sqlQuery: string | null;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sqlQuery?: string | null;
  data?: any;
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
 * Convert natural language to SQL query using OpenAI with conversation context
 */
async function convertToSql(userQuery: string, schema: string, conversationHistory: ChatMessage[] = []): Promise<string> {
  try {
    // Build messages array with conversation context
    const messages: any[] = [
      {
        role: "system",
        content: `You are a PostgreSQL expert specializing in logistics data analysis. Convert natural language questions to PostgreSQL queries.

Database Schema:
${schema}

CRITICAL RULES for logistics_orders table:
- customer: Use ILIKE for partial matching (e.g., "Abbott" should match "Abbott Nutrition")
- warehouse: Use exact match for warehouse numbers (e.g., "warehouse 10" → warehouse = '10')
- warehouse_city_state: Use ILIKE for city/state/location searches (e.g., "Lockbourne", "Boca Raton FL")
- order_number, shipment_number: Use exact match or ILIKE for partial matches
- order_type: Use exact match for "Outbound"/"Inbound" (case-sensitive)
- order_class: Use ILIKE for intelligent matching based on business context:
  * "sales orders" → ILIKE '%Sales Order%'
  * "serialized" → ILIKE '%Serialized%'
  * "returns" → ILIKE '%Return Authorization%'
  * "transfers" → ILIKE '%Transfer%'
  * "purchase orders" → ILIKE '%Purchase Order%'
  * "international" → ILIKE '%International%'
  * "LTL" → ILIKE '%LTL%'
  * "pickup" → ILIKE '%Pickup%'
  * "hazardous" → ILIKE '%Hazardous%'
- date: Handle date ranges and comparisons properly
- destination_state: Use for "to state", "shipping to", "destination"
- source_state: Use for "from state", "origin state", "source"
- month_name: Use exact match for month names
- year, month, quarter, week, day: Use numeric comparisons

COLUMN SELECTION INTELLIGENCE:
- "warehouse 10" → warehouse = '10'
- "warehouse in Lockbourne" → warehouse_city_state ILIKE '%Lockbourne%'
- "from Florida" → source_state ILIKE '%Florida%'
- "to California" → destination_state ILIKE '%California%'
- "shipped from Texas" → source_state ILIKE '%Texas%'
- "delivered to New York" → destination_state ILIKE '%New York%'
- "inbound orders" → order_type = 'Inbound'
- "outbound shipments" → order_type = 'Outbound'
- "sales orders" → order_class ILIKE '%Sales Order%'
- "serialized orders" → order_class ILIKE '%Serialized%'
- "returns" → order_class ILIKE '%Return Authorization%'
- "transfers" → order_class ILIKE '%Transfer%'
- "purchase orders" → order_class ILIKE '%Purchase Order%'
- "international orders" → order_class ILIKE '%International%'
- "LTL shipments" → order_class ILIKE '%LTL%'
- "pickup orders" → order_class ILIKE '%Pickup%'
- "hazardous materials" → order_class ILIKE '%Hazardous%'

SQL SYNTAX RULES:
- Return ONLY the SQL query, no explanations or markdown
- Do NOT include code block formatting with backticks
- Do NOT include any explanatory text before or after the query
- Use proper PostgreSQL syntax
- String literals in single quotes (e.g., 'value')
- Column names in double quotes if they contain special characters
- Use ILIKE '%pattern%' for partial text matching (case-insensitive)
- Use = only for exact matches when explicitly requested
- Handle JOINs appropriately for related tables
- Add LIMIT for large result sets (default LIMIT 100 unless user specifies)
- Focus on tables that start with 'logistics_'
- RESPONSE FORMAT: Just the SQL query starting with SELECT

PATTERN MATCHING EXAMPLES:
- "How many orders for customer Abbott" → WHERE "customer" ILIKE '%Abbott%'
- "Orders from Florida" → WHERE "source_state" ILIKE '%Florida%'
- "Orders to California" → WHERE "destination_state" ILIKE '%California%'
- "Show orders for warehouse 10" → WHERE "warehouse" = '10'
- "Orders from Lockbourne warehouse" → WHERE "warehouse_city_state" ILIKE '%Lockbourne%'
- "Inbound orders" → WHERE "order_type" = 'Inbound'
- "Outbound shipments" → WHERE "order_type" = 'Outbound'
- "Sales orders" → WHERE "order_class" ILIKE '%Sales Order%'
- "Serialized orders" → WHERE "order_class" ILIKE '%Serialized%'
- "Return orders" → WHERE "order_class" ILIKE '%Return Authorization%'
- "Transfer orders" → WHERE "order_class" ILIKE '%Transfer%'
- "International shipments" → WHERE "order_class" ILIKE '%International%'
- "LTL orders" → WHERE "order_class" ILIKE '%LTL%'
- "Orders in June" → WHERE "month_name" = 'June'
- "Recent orders" → ORDER BY "date" DESC LIMIT 10
- "Orders this year" → WHERE "year" = 2025

SPECIFIC EXAMPLES:
- "How many orders are there?" → SELECT COUNT(*) FROM logistics_orders;
- "How many sales orders for Abbott?" → SELECT COUNT(*) FROM logistics_orders WHERE "customer" ILIKE '%Abbott%' AND "order_class" ILIKE '%Sales Order%';
- "Show serialized orders from warehouse in Lockbourne" → SELECT * FROM logistics_orders WHERE "order_class" ILIKE '%Serialized%' AND "warehouse_city_state" ILIKE '%Lockbourne%' ORDER BY "date" DESC LIMIT 10;
- "International orders to Florida" → SELECT * FROM logistics_orders WHERE "order_class" ILIKE '%International%' AND "destination_state" ILIKE '%Florida%' LIMIT 10;
- "Return orders this month" → SELECT * FROM logistics_orders WHERE "order_class" ILIKE '%Return Authorization%' AND "month" = EXTRACT(MONTH FROM CURRENT_DATE) LIMIT 10;

CONVERSATION CONTEXT:
When the user refers to "those", "that", "them", "these results", or similar references, use the conversation history to understand what they're referring to. Look at previous queries and results to maintain context.`
      }
    ];

    // Add conversation history (last 4 messages to keep context manageable and clear)
    const recentHistory = conversationHistory.slice(-4);
    recentHistory.forEach(msg => {
      if (msg.role === 'user') {
        messages.push({
          role: "user",
          content: msg.content
        });
      } else if (msg.role === 'assistant' && msg.sqlQuery) {
        // Only include the SQL query, not the full explanation to keep it focused
        messages.push({
          role: "assistant",
          content: msg.sqlQuery
        });
      }
    });

    // Add current user query
    messages.push({
      role: "user",
      content: userQuery
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      temperature: 0.1, // Low temperature for more deterministic SQL
      max_tokens: 500
    });

    let sqlQuery = response.choices[0].message.content?.trim() || '';
    
    // Debug logging
    console.log('OpenAI Raw Response:', sqlQuery);
    console.log('Messages sent to OpenAI:', JSON.stringify(messages.slice(-3), null, 2)); // Last 3 messages for debugging
    
    // Clean up the response - sometimes OpenAI adds explanations or formatting
    if (sqlQuery.includes('```sql')) {
      const sqlMatch = sqlQuery.match(/```sql\s*([\s\S]*?)\s*```/);
      if (sqlMatch) {
        sqlQuery = sqlMatch[1].trim();
      }
    } else if (sqlQuery.includes('```')) {
      const sqlMatch = sqlQuery.match(/```\s*([\s\S]*?)\s*```/);
      if (sqlMatch) {
        sqlQuery = sqlMatch[1].trim();
      }
    }
    
    // Remove any leading explanatory text and keep only the SQL
    const lines = sqlQuery.split('\n');
    let sqlStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().toLowerCase().startsWith('select')) {
        sqlStartIndex = i;
        break;
      }
    }
    
    if (sqlStartIndex !== -1) {
      sqlQuery = lines.slice(sqlStartIndex).join('\n').trim();
    }
    
    // Final validation - ensure it's a SELECT statement
    if (!sqlQuery.toLowerCase().startsWith('select')) {
      console.error('Invalid SQL generated. Raw response was:', response.choices[0].message.content);
      throw new Error(`Generated query is not a SELECT statement. Got: ${sqlQuery.substring(0, 100)}...`);
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
 * Generate natural language explanation of the results with conversation context
 */
async function explainResults(userQuery: string, sqlQuery: string, data: any[], conversationHistory: ChatMessage[] = []): Promise<string> {
  try {
    const dataPreview = data.length > 0 ? JSON.stringify(data.slice(0, 3), null, 2) : 'No data returned';
    
    // Build conversation context for the explanation
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-4); // Last 4 messages for context
      conversationContext = 'Previous conversation context:\n';
      recentHistory.forEach((msg, index) => {
        if (msg.role === 'user') {
          conversationContext += `User: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          conversationContext += `Assistant: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}\n`;
        }
      });
      conversationContext += '\n';
    }
    
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
- If no data is returned, explain why that might be
- Use conversation context to provide more relevant explanations
- When the user asks follow-up questions, reference previous results appropriately`
        },
        {
          role: "user",
          content: `${conversationContext}Current user query: "${userQuery}"
SQL executed: ${sqlQuery}
Data returned (${data.length} rows): ${dataPreview}

Please explain what this data shows, considering the conversation context.`
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
 * Main function to process natural language queries using OpenAI with conversation memory
 */
export async function processLogisticsQuery(userQuery: string, conversationHistory: ChatMessage[] = []): Promise<SqlQueryResult> {
  try {
    // Get database schema
    const schema = await getDatabaseSchema();
    
    // Convert to SQL using OpenAI with conversation context
    const sqlQuery = await convertToSql(userQuery, schema, conversationHistory);
    
    // Execute the query
    const data = await executeSqlQuery(sqlQuery);
    
    // Generate explanation with conversation context
    const insight = await explainResults(userQuery, sqlQuery, data, conversationHistory);
    
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
