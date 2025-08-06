
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
export async function getShipmentTrends(ownerId: number, period: 'last30days' | 'thisMonth' | 'thisYear' | 'last6months' = 'last6months'): Promise<any[]> {
  try {
    const { startDate, endDate } = getDateRange(period);
    
    const result = await db.query(
      `SELECT 
        TO_CHAR(DATE(order_created_date), 'YYYY-MM') as month,
        TO_CHAR(DATE(order_created_date), 'Mon') as month_name,
        COUNT(*) as shipment_count
       FROM operations_active_orders 
       WHERE owner_id = $1 
       AND DATE(order_created_date) BETWEEN $2 AND $3
       AND order_type = 'Outbound'
       AND LOWER(order_class) LIKE '%sales order%'
       GROUP BY month, month_name
       ORDER BY month ASC`,
      [ownerId, startDate, endDate]
    );

    return result.rows.map(row => ({
      month_name: row.month_name,
      shipment_count: parseInt(row.shipment_count)
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

// Get top shipping destinations data
export async function getTopDestinations(ownerId: number, period: 'last90days' = 'last90days'): Promise<any[]> {
  try {
    const { startDate, endDate } = getDateRange(period);

    const query = `
      WITH DestinationCounts AS (
        SELECT
          recipient_state,
          COUNT(*) AS shipment_count
        FROM
          operations_active_orders
        WHERE
          owner_id = $1
          AND DATE(order_created_date) BETWEEN $2 AND $3
          AND order_type = 'Outbound'
          AND recipient_state IS NOT NULL
        GROUP BY
          recipient_state
      ), TotalShipments AS (
        SELECT COUNT(*) AS total_count 
        FROM operations_active_orders 
        WHERE owner_id = $1 
        AND DATE(order_created_date) BETWEEN $2 AND $3
        AND order_type = 'Outbound'
      )
      SELECT
        dc.recipient_state AS destination,
        dc.shipment_count,
        CASE
          WHEN ts.total_count > 0 THEN ROUND((dc.shipment_count * 100.0 / ts.total_count), 2)
          ELSE 0
        END AS percentage
      FROM
        DestinationCounts dc, TotalShipments ts
      ORDER BY
        dc.shipment_count DESC
      LIMIT 5;
    `;

    const result = await db.query(query, [ownerId, startDate, endDate]);

    return result.rows.map(row => ({
      destination: row.destination,
      shipment_count: parseInt(row.shipment_count),
      percentage: parseFloat(row.percentage)
    }));
  } catch (error) {
    console.error('Error fetching top destinations:', error);
    return [];
  }
}

// Get materials data for reports
export async function getMaterialsData(ownerId: number): Promise<{
  lookupCode: string;
  statusId: number;
  materialGroupId: string;
  name: string;
  description: string;
}[]> {
  try {
    const result = await db.query(
      `SELECT m.lookupcode, m.statusid, m.materialgroupid, m.name, m.description
       FROM wms_materials m
       JOIN wms_projects p ON p.id = m.projectid
       WHERE p.ownerid = $1
       ORDER BY m.lookupcode`,
      [ownerId]
    );

    return result.rows.map(row => ({
      lookupCode: row.lookupcode,
      statusId: row.statusid,
      materialGroupId: row.materialgroupid,
      name: row.name,
      description: row.description
    }));
  } catch (error) {
    console.error('Error fetching materials data:', error);
    throw new Error('Failed to fetch materials data');
  }
}

// Get projects for order creation (filtered by owner_id)
export async function getProjectsForOrders(ownerId: number): Promise<{id: string, name: string}[]> {
  try {
    const result = await db.query(
      `SELECT id, name
       FROM wms_projects
       WHERE ownerid = $1
       ORDER BY name`,
      [ownerId]
    );

    return result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name
    }));
  } catch (error) {
    console.error('Error fetching projects for orders:', error);
    throw new Error('Failed to fetch projects');
  }
}

// Get carriers for order creation (no restrictions for now)
export async function getCarriersForOrders(): Promise<{id: string, name: string}[]> {
  try {
    const result = await db.query(
      `SELECT id, name
       FROM wms_carriers
       ORDER BY name`,
      []
    );

    return result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name
    }));
  } catch (error) {
    console.error('Error fetching carriers for orders:', error);
    throw new Error('Failed to fetch carriers');
  }
}

// Get carrier service types for order creation (filtered by carrier)
export async function getCarrierServiceTypesForOrders(carrierId: string): Promise<{id: string, name: string}[]> {
  try {
    const result = await db.query(
      `SELECT id, name
       FROM wms_carrierservicetypes
       WHERE carrierid = $1
       ORDER BY name`,
      [carrierId]
    );

    return result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name
    }));
  } catch (error) {
    console.error('Error fetching carrier service types for orders:', error);
    throw new Error('Failed to fetch carrier service types');
  }
}

// Get lots for a specific material (filtered by owner_id and project)
export async function getLotsForMaterial(ownerId: number, materialCode: string, projectId?: string): Promise<{
  lot_code: string;
  total_available_amount: number;
  uom: string;
  uom_short: string;
}[]> {
  try {
    let query = `
      SELECT
        l.lookupcode AS lot_code,
        imu.name AS uom,
        imu.shortname AS uom_short,
        SUM(lpc.amount) AS total_available_amount
      FROM
        wms_licenseplatecontents lpc
        INNER JOIN wms_licenseplates lp ON lp.id = lpc.licenseplateid
        INNER JOIN wms_lots l ON l.id = lpc.lotid
        INNER JOIN wms_materials m ON m.id = l.materialid
        INNER JOIN wms_projects p ON p.id = m.projectid
        INNER JOIN wms_owners o ON o.id = p.ownerid
        INNER JOIN wms_inventorymeasurementunits imu ON imu.id = lpc.packagedid
      WHERE
        lp.statusid = 1
        AND lp.archived = false
        AND l.statusid = 1
        AND lpc.amount > 0
        AND o.id = $1
        AND m.lookupcode = $2`;
    
    const params = [ownerId, materialCode];
    
    if (projectId) {
      query += ` AND p.id = $3`;
      params.push(parseInt(projectId));
    }
    
    query += ` 
      GROUP BY l.lookupcode, imu.name, imu.shortname
      ORDER BY l.lookupcode`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      lot_code: row.lot_code,
      total_available_amount: parseFloat(row.total_available_amount || '0'),
      uom: row.uom,
      uom_short: row.uom_short
    }));
  } catch (error) {
    console.error('Error fetching lots for material:', error);
    throw new Error('Failed to fetch lots for material');
  }
}

// Get license plates for a specific material and lot (filtered by owner_id and project)
export async function getLicensePlatesForMaterial(ownerId: number, materialCode: string, lotCode?: string, projectId?: string): Promise<{
  license_plate_code: string;
  total_available_amount: number;
  uom: string;
  uom_short: string;
}[]> {
  try {
    let query = `
      SELECT
        lp.lookupcode AS license_plate_code,
        imu.name AS uom,
        imu.shortname AS uom_short,
        SUM(lpc.amount) AS total_available_amount
      FROM
        wms_licenseplatecontents lpc
        INNER JOIN wms_licenseplates lp ON lp.id = lpc.licenseplateid
        INNER JOIN wms_lots l ON l.id = lpc.lotid
        INNER JOIN wms_materials m ON m.id = l.materialid
        INNER JOIN wms_projects p ON p.id = m.projectid
        INNER JOIN wms_owners o ON o.id = p.ownerid
        INNER JOIN wms_inventorymeasurementunits imu ON imu.id = lpc.packagedid
      WHERE
        lp.statusid = 1
        AND lp.archived = false
        AND l.statusid = 1
        AND lpc.amount > 0
        AND o.id = $1
        AND m.lookupcode = $2`;
    
    const params = [ownerId, materialCode];
    
    if (lotCode) {
      query += ` AND l.lookupcode = $${params.length + 1}`;
      params.push(lotCode);
    }
    
    if (projectId) {
      query += ` AND p.id = $${params.length + 1}`;
      params.push(parseInt(projectId));
    }
    
    query += ` 
      GROUP BY lp.lookupcode, imu.name, imu.shortname
      ORDER BY lp.lookupcode`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      license_plate_code: row.license_plate_code,
      total_available_amount: parseFloat(row.total_available_amount || '0'),
      uom: row.uom,
      uom_short: row.uom_short
    }));
  } catch (error) {
    console.error('Error fetching license plates for material:', error);
    throw new Error('Failed to fetch license plates for material');
  }
}

// Get available inventory for outbound orders (filtered by owner_id and project)
export async function getOutboundInventory(ownerId: number, projectId?: string): Promise<{
  owner_id: number;
  project_id: number;
  material_name: string;
  material_description: string;
  material_code: string;
  total_available_amount: number;
  uom: string;
  uom_short: string;
}[]> {
  try {
    let query = `
      SELECT
        o.id AS owner_id,
        p.id AS project_id,
        m.name AS material_name,
        m.description AS material_description,
        m.lookupcode AS material_code,
        imu.name AS uom,
        imu.shortname AS uom_short,
        SUM(lpc.amount) AS total_available_amount
      FROM
        wms_licenseplatecontents lpc
        INNER JOIN wms_licenseplates lp ON lp.id = lpc.licenseplateid
        INNER JOIN wms_lots l ON l.id = lpc.lotid
        INNER JOIN wms_materials m ON m.id = l.materialid
        INNER JOIN wms_projects p ON p.id = m.projectid
        INNER JOIN wms_owners o ON o.id = p.ownerid
        INNER JOIN wms_inventorymeasurementunits imu ON imu.id = lpc.packagedid
      WHERE
        lp.statusid = 1
        AND lp.archived = false
        AND l.statusid = 1
        AND lpc.amount > 0
        AND o.id = $1`;
    
    const params = [ownerId];
    
    if (projectId) {
      query += ` AND p.id = $2`;
      params.push(parseInt(projectId));
    }
    
    query += ` 
      GROUP BY o.id, p.id, m.name, m.description, m.lookupcode, imu.name, imu.shortname
      ORDER BY m.name`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      owner_id: row.owner_id,
      project_id: row.project_id,
      material_name: row.material_name,
      material_description: row.material_description,
      material_code: row.material_code,
      total_available_amount: parseFloat(row.total_available_amount || '0'),
      uom: row.uom,
      uom_short: row.uom_short
    }));
  } catch (error) {
    console.error('Error fetching outbound inventory:', error);
    throw new Error('Failed to fetch outbound inventory');
  }
}

// Save order as draft or submit order
export async function saveOrder(
  orderData: any,
  lineItems: any[],
  ownerId: number,
  status: 'draft' | 'submitted' = 'draft',
  userName: string = 'system'
): Promise<{ success: boolean; orderId?: number; error?: string }> {
  try {
    let orderId = orderData.id;

    if (orderId) {
      // UPDATE existing order
      console.log(`Updating existing order ${orderId} with status: ${status}`);
      
      // Get owner and project lookupcode, carrier and service type names for UPDATE too
      const lookupDataQuery = `
        SELECT 
          o.lookupcode as owner_lookupcode,
          p.lookupcode as project_lookupcode,
          c.name as carrier_name,
          cs.name as service_type_name
        FROM wms_owners o
        LEFT JOIN wms_projects p ON p.ownerid = o.id AND p.id = $2
        LEFT JOIN wms_carriers c ON c.id = $3
        LEFT JOIN wms_carrierservicetypes cs ON cs.id = $4
        WHERE o.id = $1
      `;
      
      const lookupResult = await db.query(lookupDataQuery, [
        ownerId, 
        parseInt(orderData.projectId), 
        parseInt(orderData.carrierId),
        parseInt(orderData.carrierServiceTypeId)
      ]);
      
      const lookupData = lookupResult.rows[0] || {};
      
      const orderUpdateQuery = `
        UPDATE portal_orders SET
          order_type = $2, project_id = $3, project_lookupcode = $4, reference_number = $5,
          estimated_delivery_date = $6, recipient_name = $7,
          addr1 = $8, addr2 = $9, city = $10, state = $11, zip = $12, country = $13,
          account_name = $14, billing_addr1 = $15, billing_addr2 = $16,
          billing_city = $17, billing_state = $18, billing_zip = $19, billing_country = $20,
          carrier = $21, service_type = $22, carrier_id = $23, service_type_id = $24, 
          status = $25, updated_by = $26, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND owner_id = $27
        RETURNING id
      `;

      const orderValues = [
        orderId, // $1
        orderData.orderType, // $2
        orderData.projectId, // $3
        lookupData.project_lookupcode || null, // $4
        orderData.referenceNumber || null, // $5
        orderData.estimatedDeliveryDate || null, // $6
        orderData.recipientName, // $7
        orderData.recipientAddress.line1, // $8
        orderData.recipientAddress.line2 || null, // $9
        orderData.recipientAddress.city, // $10
        orderData.recipientAddress.state, // $11
        orderData.recipientAddress.zipCode, // $12
        orderData.recipientAddress.country || 'US', // $13
        orderData.billingAccountName, // $14
        orderData.billingAddress.line1, // $15
        orderData.billingAddress.line2 || null, // $16
        orderData.billingAddress.city, // $17
        orderData.billingAddress.state, // $18
        orderData.billingAddress.zipCode, // $19
        orderData.billingAddress.country || 'US', // $20
        lookupData.carrier_name || null, // $21
        lookupData.service_type_name || null, // $22
        orderData.carrierId, // $23
        orderData.carrierServiceTypeId, // $24
        status, // $25
        userName, // $26
        ownerId // $27
      ];

      const orderResult = await db.query(orderUpdateQuery, orderValues);
      
      if (orderResult.rows.length === 0) {
        throw new Error('Order not found or access denied');
      }

      // Delete existing line items and re-insert
      await db.query('DELETE FROM portal_order_lines WHERE order_id = $1', [orderId]);

    } else {
      // CREATE new order
      console.log(`Creating new order with status: ${status}`);
      
      // Generate order number if not provided
      let orderNumber = orderData.orderNumber;
      if (!orderNumber) {
        const result = await db.query(
          'SELECT COUNT(*) + 1 as next_number FROM portal_orders WHERE owner_id = $1',
          [ownerId]
        );
        const nextNumber = result.rows[0].next_number;
        const prefix = orderData.orderType === 'outbound' ? 'OUT' : 'IN';
        orderNumber = `${prefix}-${ownerId}-${String(nextNumber).padStart(4, '0')}`;
      }

      // Get owner and project lookupcode, carrier and service type names
      const lookupDataQuery = `
        SELECT 
          o.lookupcode as owner_lookupcode,
          p.lookupcode as project_lookupcode,
          c.name as carrier_name,
          cs.name as service_type_name
        FROM wms_owners o
        LEFT JOIN wms_projects p ON p.ownerid = o.id AND p.id = $2
        LEFT JOIN wms_carriers c ON c.id = $3
        LEFT JOIN wms_carrierservicetypes cs ON cs.id = $4
        WHERE o.id = $1
      `;
      
      const lookupResult = await db.query(lookupDataQuery, [
        ownerId, 
        parseInt(orderData.projectId), 
        parseInt(orderData.carrierId),
        parseInt(orderData.carrierServiceTypeId)
      ]);
      
      const lookupData = lookupResult.rows[0] || {};

      const orderInsertQuery = `
        INSERT INTO portal_orders (
          order_number, order_date, order_type, status, owner_id, owner_lookupcode,
          project_id, project_lookupcode, reference_number, estimated_delivery_date, 
          recipient_name, addr1, addr2, city, state, zip, country,
          account_name, billing_addr1, billing_addr2, billing_city, billing_state,
          billing_zip, billing_country, carrier, service_type, carrier_id, service_type_id,
          created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
        ) RETURNING id
      `;

      const orderValues = [
        orderNumber, // $1
        new Date(), // $2
        orderData.orderType, // $3
        status, // $4
        ownerId, // $5
        lookupData.owner_lookupcode || null, // $6
        orderData.projectId, // $7
        lookupData.project_lookupcode || null, // $8
        orderData.referenceNumber || null, // $9
        orderData.estimatedDeliveryDate || null, // $10
        orderData.recipientName, // $11
        orderData.recipientAddress.line1, // $12
        orderData.recipientAddress.line2 || null, // $13
        orderData.recipientAddress.city, // $14
        orderData.recipientAddress.state, // $15
        orderData.recipientAddress.zipCode, // $16
        orderData.recipientAddress.country || 'US', // $17
        orderData.billingAccountName, // $18
        orderData.billingAddress.line1, // $19
        orderData.billingAddress.line2 || null, // $20
        orderData.billingAddress.city, // $21
        orderData.billingAddress.state, // $22
        orderData.billingAddress.zipCode, // $23
        orderData.billingAddress.country || 'US', // $24
        lookupData.carrier_name || null, // $25
        lookupData.service_type_name || null, // $26
        orderData.carrierId, // $27
        orderData.carrierServiceTypeId, // $28
        userName, // $29 - created_by
        userName  // $30 - updated_by
      ];

      const orderResult = await db.query(orderInsertQuery, orderValues);
      orderId = orderResult.rows[0].id;
    }

    // Insert line items (for both new and updated orders)
    if (lineItems && lineItems.length > 0) {
      const lineInsertQuery = `
        INSERT INTO portal_order_lines (
          order_id, line_number, material_code, material_description,
          quantity, uom, lot, license_plate, serial_number, batch_number,
          created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        const lineValues = [
          orderId,
          i + 1, // line_number
          item.materialCode,
          item.materialName,
          item.quantity,
          item.uomShort || item.uom,
          item.batchNumber || item.lot || null,
          item.licensePlate || null,
          item.serialNumber || null,
          item.batchNumber || null,
          userName, // created_by
          userName  // updated_by
        ];

        await db.query(lineInsertQuery, lineValues);
      }
    }

    return {
      success: true,
      orderId: orderId
    };

  } catch (error) {
    console.error('Error saving order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
