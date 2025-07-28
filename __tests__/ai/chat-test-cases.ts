/**
 * Test cases for the Logistics AI Chat Assistant
 * Add new test cases here to expand your automated testing
 */

export interface ChatTestCase {
  id: string;
  description: string;
  userQuery: string;
  expectedType: 'conversational' | 'data-query';
  expectedSQL?: {
    shouldContain?: string[];  // SQL must contain these strings
    shouldNotContain?: string[]; // SQL must NOT contain these
    shouldStartWith?: string; // SQL should start with this
  };
  expectedData?: {
    shouldHaveResults?: boolean; // true if data should be returned
    minimumRows?: number; // minimum number of rows expected
    maximumRows?: number; // maximum number of rows expected
  };
  conversationContext?: Array<{
    role: 'user' | 'assistant';
    content: string;
    sqlQuery?: string | null;
  }>;
}

export const chatTestCases: ChatTestCase[] = [
  // ===== CONVERSATIONAL TESTS =====
  {
    id: 'conv-001',
    description: 'Simple greeting should be conversational',
    userQuery: 'hello',
    expectedType: 'conversational'
  },
  {
    id: 'conv-002',
    description: 'Personal introduction should be conversational',
    userQuery: 'my name is John',
    expectedType: 'conversational'
  },
  {
    id: 'conv-003',
    description: 'Casual question should be conversational',
    userQuery: 'how are you?',
    expectedType: 'conversational'
  },
  {
    id: 'conv-004',
    description: 'System capabilities question should be conversational',
    userQuery: 'what can you do?',
    expectedType: 'conversational'
  },

  // ===== BASIC DATA QUERIES =====
  {
    id: 'data-001',
    description: 'Simple count query',
    userQuery: 'how many orders?',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['SELECT COUNT(*)', 'FROM logistics_orders'],
      shouldStartWith: 'SELECT'
    },
    expectedData: {
      shouldHaveResults: true,
      minimumRows: 1
    }
  },
  {
    id: 'data-002',
    description: 'Recent orders query',
    userQuery: 'show me recent orders',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['SELECT', 'FROM logistics_orders', 'ORDER BY', 'DESC', 'LIMIT'],
      shouldStartWith: 'SELECT'
    },
    expectedData: {
      shouldHaveResults: true,
      minimumRows: 1,
      maximumRows: 100
    }
  },

  // ===== CUSTOMER QUERIES =====
  {
    id: 'data-003',
    description: 'Customer partial match query',
    userQuery: 'orders for customer Abbott',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['customer', 'ILIKE', '%Abbott%'],
      shouldNotContain: ['customer ='],
      shouldStartWith: 'SELECT'
    }
  },
  {
    id: 'data-004',
    description: 'Sales orders for specific customer',
    userQuery: 'how many sales orders for Abbott?',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['COUNT(*)', 'customer', 'ILIKE', '%Abbott%', 'order_class', 'ILIKE', '%Sales Order%'],
      shouldStartWith: 'SELECT'
    }
  },

  // ===== WAREHOUSE QUERIES =====
  {
    id: 'data-005',
    description: 'Specific warehouse number',
    userQuery: 'orders for warehouse 10',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['warehouse', '=', "'10'"],
      shouldNotContain: ['ILIKE'],
      shouldStartWith: 'SELECT'
    }
  },
  {
    id: 'data-006',
    description: 'Warehouse by location',
    userQuery: 'orders from Lockbourne warehouse',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['warehouse_city_state', 'ILIKE', '%Lockbourne%'],
      shouldStartWith: 'SELECT'
    }
  },

  // ===== ORDER TYPE QUERIES =====
  {
    id: 'data-007',
    description: 'Inbound orders query',
    userQuery: 'show me inbound orders',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['order_type', '=', "'Inbound'"],
      shouldStartWith: 'SELECT'
    }
  },
  {
    id: 'data-008',
    description: 'Outbound shipments query',
    userQuery: 'outbound shipments',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['order_type', '=', "'Outbound'"],
      shouldStartWith: 'SELECT'
    }
  },

  // ===== ORDER CLASS QUERIES =====
  {
    id: 'data-009',
    description: 'Serialized orders query',
    userQuery: 'show serialized orders',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['order_class', 'ILIKE', '%Serialized%'],
      shouldStartWith: 'SELECT'
    }
  },
  {
    id: 'data-010',
    description: 'Return orders query',
    userQuery: 'return orders',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['order_class', 'ILIKE', '%Return Authorization%'],
      shouldStartWith: 'SELECT'
    }
  },
  {
    id: 'data-011',
    description: 'International shipments',
    userQuery: 'international orders',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['order_class', 'ILIKE', '%International%'],
      shouldStartWith: 'SELECT'
    }
  },
  {
    id: 'data-012',
    description: 'LTL shipments',
    userQuery: 'LTL orders',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['order_class', 'ILIKE', '%LTL%'],
      shouldStartWith: 'SELECT'
    }
  },

  // ===== LOCATION QUERIES =====
  {
    id: 'data-013',
    description: 'Orders from specific state',
    userQuery: 'orders from Florida',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['source_state', 'ILIKE', '%Florida%'],
      shouldStartWith: 'SELECT'
    }
  },
  {
    id: 'data-014',
    description: 'Orders to specific state',
    userQuery: 'orders to California',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['destination_state', 'ILIKE', '%California%'],
      shouldStartWith: 'SELECT'
    }
  },
  {
    id: 'data-015',
    description: 'Shipped from state',
    userQuery: 'shipped from Texas',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['source_state', 'ILIKE', '%Texas%'],
      shouldStartWith: 'SELECT'
    }
  },

  // ===== COMPLEX QUERIES =====
  {
    id: 'data-016',
    description: 'Complex multi-filter query',
    userQuery: 'serialized orders from warehouse in Lockbourne',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: [
        'order_class', 'ILIKE', '%Serialized%',
        'warehouse_city_state', 'ILIKE', '%Lockbourne%'
      ],
      shouldStartWith: 'SELECT'
    }
  },
  {
    id: 'data-017',
    description: 'International orders to specific state',
    userQuery: 'international orders to Florida',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: [
        'order_class', 'ILIKE', '%International%',
        'destination_state', 'ILIKE', '%Florida%'
      ],
      shouldStartWith: 'SELECT'
    }
  },

  // ===== CONVERSATION CONTEXT TESTS =====
  {
    id: 'context-001',
    description: 'Follow-up question with context reference',
    userQuery: 'how many orders from warehouse 10?',
    expectedType: 'data-query',
    conversationContext: [
      {
        role: 'user',
        content: 'show me recent orders'
      },
      {
        role: 'assistant',
        content: 'Here are your recent orders...',
        sqlQuery: 'SELECT * FROM logistics_orders ORDER BY date DESC LIMIT 10'
      }
    ],
    expectedSQL: {
      shouldContain: ['warehouse', '10'],
      shouldStartWith: 'SELECT'
    }
  },
  {
    id: 'context-002',
    description: 'Reference to previous results with "those"',
    userQuery: 'show me those orders',
    expectedType: 'data-query',
    conversationContext: [
      {
        role: 'user',
        content: 'sales orders for Abbott'
      },
      {
        role: 'assistant',
        content: 'Found sales orders for Abbott...',
        sqlQuery: 'SELECT * FROM logistics_orders WHERE customer ILIKE \'%Abbott%\' AND order_class ILIKE \'%Sales Order%\''
      }
    ],
    expectedSQL: {
      shouldStartWith: 'SELECT'
    }
  },

  // ===== DATE/TIME QUERIES =====
  {
    id: 'data-018',
    description: 'Orders this year',
    userQuery: 'orders this year',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['year', '='],
      shouldStartWith: 'SELECT'
    }
  },
  {
    id: 'data-019',
    description: 'Orders in specific month',
    userQuery: 'orders in June',
    expectedType: 'data-query',
    expectedSQL: {
      shouldContain: ['month_name', '=', "'June'"],
      shouldStartWith: 'SELECT'
    }
  }
];

// Helper function to get test cases by type
export function getTestCasesByType(type: 'conversational' | 'data-query'): ChatTestCase[] {
  return chatTestCases.filter(testCase => testCase.expectedType === type);
}

// Helper function to get test cases by ID pattern
export function getTestCasesById(pattern: string): ChatTestCase[] {
  return chatTestCases.filter(testCase => testCase.id.includes(pattern));
}
