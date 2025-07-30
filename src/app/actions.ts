
'use server';

import { processLogisticsQuery, ChatMessage, QueryOptions } from '@/lib/ai/logistics-assistant';
import { db } from '@/lib/db';
import { getDateRange, getSqlDateFilter } from '@/lib/date-utils';

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
      AND LOWER(delivery_status) NOT IN ('delivered', 'cancelled')
      ORDER BY order_created_date DESC, order_fulfillment_date DESC, estimated_delivery_date DESC`,
      [ownerId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching active orders:', error);
    return [];
  }
}

// Get dashboard metrics for client
export async function getDashboardMetrics(ownerId: number): Promise<{
  activeShipments: number;
  pendingOrders: number;
  thisMonthVolume: number;
  averageDeliveryTime: number;
}> {
  try {
    const { startDate: thisMonthStart } = getDateRange('thisMonth');
    
    // Get active shipments count
    const activeShipmentsResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM operations_active_orders 
       WHERE owner_id = $1 
       AND LOWER(delivery_status) NOT IN ('delivered', 'cancelled')`,
      [ownerId]
    );

    // Get pending orders count (assuming pending status)
    const pendingOrdersResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM operations_active_orders 
       WHERE owner_id = $1 
       AND LOWER(delivery_status) IN ('pending', 'processing', 'ready to ship')`,
      [ownerId]
    );

    // Get this month's volume
    const thisMonthVolumeResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM operations_active_orders 
       WHERE owner_id = $1 
       AND DATE(order_created_date) >= $2`,
      [ownerId, thisMonthStart]
    );

    // Get average delivery time (simplified calculation)
    const avgDeliveryTimeResult = await db.query(
      `SELECT AVG(
         EXTRACT(EPOCH FROM (
           COALESCE(estimated_delivery_date, NOW())::date - order_created_date::date
         )) / 86400
       ) as avg_days
       FROM operations_active_orders 
       WHERE owner_id = $1 
       AND order_created_date >= $2`,
      [ownerId, thisMonthStart]
    );

    return {
      activeShipments: parseInt(activeShipmentsResult.rows[0]?.count || '0'),
      pendingOrders: parseInt(pendingOrdersResult.rows[0]?.count || '0'),
      thisMonthVolume: parseInt(thisMonthVolumeResult.rows[0]?.count || '0'),
      averageDeliveryTime: Math.round(parseFloat(avgDeliveryTimeResult.rows[0]?.avg_days || '0'))
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      activeShipments: 0,
      pendingOrders: 0,
      thisMonthVolume: 0,
      averageDeliveryTime: 0
    };
  }
}

// Get shipment trends data for charts
export async function getShipmentTrends(ownerId: number, period: 'last30days' | 'thisMonth' | 'thisYear' = 'last30days'): Promise<any[]> {
  try {
    const { startDate, endDate } = getDateRange(period);
    
    const result = await db.query(
      `SELECT 
        DATE(order_created_date) as date,
        COUNT(*) as orders
       FROM operations_active_orders 
       WHERE owner_id = $1 
       AND DATE(order_created_date) BETWEEN $2 AND $3
       GROUP BY DATE(order_created_date)
       ORDER BY date ASC`,
      [ownerId, startDate, endDate]
    );

    return result.rows.map(row => ({
      date: row.date,
      orders: parseInt(row.orders)
    }));
  } catch (error) {
    console.error('Error fetching shipment trends:', error);
    return [];
  }
}

// Get delivery performance data
export async function getDeliveryPerformance(ownerId: number): Promise<any[]> {
  try {
    const result = await db.query(
      `SELECT 
        delivery_status,
        COUNT(*) as count
       FROM operations_active_orders 
       WHERE owner_id = $1 
       GROUP BY delivery_status
       ORDER BY count DESC`,
      [ownerId]
    );

    return result.rows.map(row => ({
      status: row.delivery_status,
      count: parseInt(row.count)
    }));
  } catch (error) {
    console.error('Error fetching delivery performance:', error);
    return [];
  }
}
