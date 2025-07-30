
'use server';

import { processLogisticsQuery, ChatMessage, QueryOptions } from '@/lib/ai/logistics-assistant';
import { db } from '@/lib/db';

// OpenAI-powered logistics assistant for employees (full access)
export async function getAiInsightOpenAI(query: string, conversationHistory: ChatMessage[] = []) {
  if (!query) {
    return { insight: 'Please provide a query.', query: null, data: null };
  }

  try {
    const options: QueryOptions = { role: 'employee' };
    const result = await processLogisticsQuery(query, conversationHistory, options);
    return { 
      insight: result.insight, 
      query: result.sqlQuery, 
      data: result.data,
      error: result.error
    };
  } catch (error) {
    console.error('OpenAI logistics query failed:', error);
    return { 
      insight: 'Sorry, I could not process your request at this moment.', 
      query: null, 
      data: null,
      error: 'Server error'
    };
  }
}

// OpenAI-powered logistics assistant for clients (filtered by owner_id)
export async function getAiInsightOpenAIClient(query: string, ownerId: number, conversationHistory: ChatMessage[] = []) {
  if (!query) {
    return { insight: 'Please provide a query.', query: null, data: null };
  }

  if (!ownerId) {
    return { insight: 'Access denied: Client ID not found.', query: null, data: null };
  }

  try {
    const options: QueryOptions = { role: 'client', ownerId };
    const result = await processLogisticsQuery(query, conversationHistory, options);
    return { 
      insight: result.insight, 
      query: result.sqlQuery, 
      data: result.data,
      error: result.error
    };
  } catch (error) {
    console.error('OpenAI client logistics query failed:', error);
    return { 
      insight: 'Sorry, I could not process your request at this moment.', 
      query: null, 
      data: null,
      error: 'Server error'
    };
  }
}

// Get active orders for client dashboard
export async function getActiveOrders(ownerId: number): Promise<any[]> {
  try {
    const result = await db.query(
      `SELECT 
        order_number,
        shipment_number,
        customer,
        recipient_name,
        recipient_city,
        recipient_state,
        delivery_status,
        order_fulfillment_date,
        estimated_delivery_date,
        order_created_date,
        carrier,
        service_type,
        tracking_numbers
      FROM operations_active_orders 
      WHERE owner_id = $1 
      AND delivery_status NOT IN ('delivered', 'cancelled')
      ORDER BY order_created_date DESC, order_fulfillment_date DESC, estimated_delivery_date DESC`,
      [ownerId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching active orders:', error);
    return [];
  }
}
