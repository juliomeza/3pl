/**
 * Automated Chat Testing Suite for Logistics AI Assistant
 * 
 * This test suite validates:
 * 1. Conversational vs Data Query Detection
 * 2. SQL Generation Accuracy
 * 3. Conversation Context Handling
 * 4. Real Database Integration
 * 
 * Run with: npm test -- chat-assistant.test.ts
 */

import { processLogisticsQuery, ChatMessage, SqlQueryResult } from '../../src/lib/ai/logistics-assistant';
import { chatTestCases, ChatTestCase, getTestCasesByType } from './chat-test-cases';

// Test configuration
const TEST_CONFIG = {
  // Set to false to skip actual OpenAI/DB calls during development
  RUN_REAL_TESTS: true,
  // Timeout for each test (OpenAI can be slow)
  TEST_TIMEOUT: 30000, // 30 seconds
  // Whether to log detailed results
  VERBOSE_LOGGING: true
};

describe('Logistics AI Chat Assistant - Automated Testing Suite', () => {
  
  // ===== CONVERSATIONAL DETECTION TESTS =====
  describe('Conversational Query Detection', () => {
    const conversationalTests = getTestCasesByType('conversational');
    
    test.each(conversationalTests)('$id: $description', async (testCase: ChatTestCase) => {
      if (!TEST_CONFIG.RUN_REAL_TESTS) {
        console.log(`Skipping real test: ${testCase.id}`);
        return;
      }

      const result = await processLogisticsQuery(
        testCase.userQuery, 
        testCase.conversationContext || []
      );

      // Conversational queries should NOT generate SQL
      expect(result.sqlQuery).toBeNull();
      expect(result.data).toBeNull();
      expect(result.insight).toBeDefined();
      expect(result.insight.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();

      if (TEST_CONFIG.VERBOSE_LOGGING) {
        console.log(`✅ ${testCase.id}: "${testCase.userQuery}" → Conversational Response`);
        console.log(`   Response: "${result.insight.substring(0, 100)}..."`);
      }
    }, TEST_CONFIG.TEST_TIMEOUT);
  });

  // ===== DATA QUERY TESTS =====
  describe('Data Query Processing', () => {
    const dataQueryTests = getTestCasesByType('data-query');
    
    test.each(dataQueryTests)('$id: $description', async (testCase: ChatTestCase) => {
      if (!TEST_CONFIG.RUN_REAL_TESTS) {
        console.log(`Skipping real test: ${testCase.id}`);
        return;
      }

      const result = await processLogisticsQuery(
        testCase.userQuery, 
        testCase.conversationContext || []
      );

      // Data queries should generate SQL
      expect(result.sqlQuery).toBeDefined();
      expect(result.sqlQuery).not.toBeNull();
      expect(result.insight).toBeDefined();
      expect(result.error).toBeUndefined();

      // Validate SQL expectations
      if (testCase.expectedSQL) {
        const sql = result.sqlQuery!.toLowerCase();
        
        // Check required SQL content
        if (testCase.expectedSQL.shouldContain) {
          testCase.expectedSQL.shouldContain.forEach(expectedContent => {
            expect(sql).toContain(expectedContent.toLowerCase());
          });
        }

        // Check prohibited SQL content
        if (testCase.expectedSQL.shouldNotContain) {
          testCase.expectedSQL.shouldNotContain.forEach(prohibitedContent => {
            expect(sql).not.toContain(prohibitedContent.toLowerCase());
          });
        }

        // Check SQL starts with expected pattern
        if (testCase.expectedSQL.shouldStartWith) {
          expect(sql).toMatch(new RegExp(`^\\s*${testCase.expectedSQL.shouldStartWith.toLowerCase()}`));
        }
      }

      // Validate data expectations
      if (testCase.expectedData) {
        if (testCase.expectedData.shouldHaveResults !== undefined) {
          if (testCase.expectedData.shouldHaveResults) {
            expect(result.data).toBeDefined();
            expect(result.data).not.toBeNull();
            if (result.data) {
              expect(Array.isArray(result.data)).toBe(true);
            }
          } else {
            expect(result.data).toBeNull();
          }
        }

        if (testCase.expectedData.minimumRows !== undefined && result.data) {
          expect(result.data.length).toBeGreaterThanOrEqual(testCase.expectedData.minimumRows);
        }

        if (testCase.expectedData.maximumRows !== undefined && result.data) {
          expect(result.data.length).toBeLessThanOrEqual(testCase.expectedData.maximumRows);
        }
      }

      if (TEST_CONFIG.VERBOSE_LOGGING) {
        console.log(`✅ ${testCase.id}: "${testCase.userQuery}"`);
        console.log(`   SQL: ${result.sqlQuery}`);
        console.log(`   Data: ${result.data ? result.data.length : 0} rows`);
        console.log(`   Insight: "${result.insight.substring(0, 100)}..."`);
      }
    }, TEST_CONFIG.TEST_TIMEOUT);
  });

  // ===== PERFORMANCE TESTS =====
  describe('Performance Testing', () => {
    test('Response time should be reasonable', async () => {
      if (!TEST_CONFIG.RUN_REAL_TESTS) return;

      const startTime = Date.now();
      const result = await processLogisticsQuery('how many orders?');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(15000); // Should respond in less than 15 seconds
      expect(result.sqlQuery).toBeDefined();

      console.log(`⏱️  Performance: Query processed in ${responseTime}ms`);
    });

    test('Conversation context performance', async () => {
      if (!TEST_CONFIG.RUN_REAL_TESTS) return;

      const conversationHistory: ChatMessage[] = [
        { role: 'user', content: 'show me recent orders' },
        { role: 'assistant', content: 'Here are recent orders...', sqlQuery: 'SELECT * FROM logistics_orders ORDER BY date DESC LIMIT 10' },
        { role: 'user', content: 'how many were from Abbott?' },
        { role: 'assistant', content: 'Found orders from Abbott...', sqlQuery: 'SELECT COUNT(*) FROM logistics_orders WHERE customer ILIKE \'%Abbott%\'' }
      ];

      const startTime = Date.now();
      const result = await processLogisticsQuery('show me those orders from warehouse 10', conversationHistory);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(20000); // Context queries might be slightly slower
      expect(result.sqlQuery).toBeDefined();

      console.log(`⏱️  Context Performance: Query with history processed in ${responseTime}ms`);
    });
  });

  // ===== EDGE CASE TESTS =====
  describe('Edge Cases and Error Handling', () => {
    test('Empty query should handle gracefully', async () => {
      if (!TEST_CONFIG.RUN_REAL_TESTS) return;

      const result = await processLogisticsQuery('');
      
      // Should return some response, not crash
      expect(result.insight).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    test('Very long query should handle gracefully', async () => {
      if (!TEST_CONFIG.RUN_REAL_TESTS) return;

      const longQuery = 'show me orders for customer ' + 'very '.repeat(100) + 'long customer name';
      const result = await processLogisticsQuery(longQuery);
      
      // Should return some response, not crash
      expect(result.insight).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    test('Query with special characters', async () => {
      if (!TEST_CONFIG.RUN_REAL_TESTS) return;

      const result = await processLogisticsQuery('orders for customer "Special & Co."');
      
      // Should handle special characters properly
      expect(result.insight).toBeDefined();
      if (result.sqlQuery) {
        // Should not break SQL syntax
        expect(result.sqlQuery).toContain('SELECT');
      }
    });
  });

  // ===== REGRESSION TESTS =====
  describe('Critical Business Logic Regression Tests', () => {
    test('Customer name partial matching (Abbott case)', async () => {
      if (!TEST_CONFIG.RUN_REAL_TESTS) return;

      const result = await processLogisticsQuery('orders for Abbott');
      
      expect(result.sqlQuery).toBeDefined();
      expect(result.sqlQuery!.toLowerCase()).toContain('ilike');
      expect(result.sqlQuery!.toLowerCase()).toContain('%abbott%');
      expect(result.sqlQuery!.toLowerCase()).not.toContain('customer =');
    });

    test('Warehouse number exact matching', async () => {
      if (!TEST_CONFIG.RUN_REAL_TESTS) return;

      const result = await processLogisticsQuery('warehouse 10');
      
      expect(result.sqlQuery).toBeDefined();
      expect(result.sqlQuery!.toLowerCase()).toContain('warehouse');
      expect(result.sqlQuery!.toLowerCase()).toContain("'10'");
      expect(result.sqlQuery!.toLowerCase()).not.toContain('ilike');
    });

    test('Order class intelligent matching', async () => {
      if (!TEST_CONFIG.RUN_REAL_TESTS) return;

      const result = await processLogisticsQuery('sales orders');
      
      expect(result.sqlQuery).toBeDefined();
      expect(result.sqlQuery!.toLowerCase()).toContain('order_class');
      expect(result.sqlQuery!.toLowerCase()).toContain('ilike');
      expect(result.sqlQuery!.toLowerCase()).toContain('%sales order%');
    });
  });
});

// ===== UTILITY FUNCTIONS FOR MANUAL TESTING =====

/**
 * Run a single test case manually - useful for debugging
 */
export async function runSingleTest(testId: string): Promise<void> {
  const testCase = chatTestCases.find(tc => tc.id === testId);
  if (!testCase) {
    console.error(`Test case ${testId} not found`);
    return;
  }

  console.log(`\n🧪 Running test: ${testCase.id} - ${testCase.description}`);
  console.log(`📝 Query: "${testCase.userQuery}"`);
  
  if (testCase.conversationContext) {
    console.log(`💬 Context: ${testCase.conversationContext.length} messages`);
  }

  try {
    const result = await processLogisticsQuery(
      testCase.userQuery, 
      testCase.conversationContext || []
    );

    console.log(`\n✅ Result:`);
    console.log(`   Type: ${result.sqlQuery ? 'Data Query' : 'Conversational'}`);
    console.log(`   SQL: ${result.sqlQuery || 'None'}`);
    console.log(`   Data: ${result.data ? result.data.length + ' rows' : 'None'}`);
    console.log(`   Insight: "${result.insight}"`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error(`❌ Test failed:`, error);
  }
}

/**
 * Run all tests of a specific type
 */
export async function runTestsByType(type: 'conversational' | 'data-query'): Promise<void> {
  const tests = getTestCasesByType(type);
  console.log(`\n🎯 Running ${tests.length} ${type} tests...\n`);

  for (const testCase of tests) {
    await runSingleTest(testCase.id);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between tests
  }
}
