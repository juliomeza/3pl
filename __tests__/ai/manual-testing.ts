/**
 * Manual Chat Testing Utilities
 * 
 * Use these functions to test specific scenarios manually:
 * 
 * ```typescript
 * import { runSingleTest, runTestsByType } from './__tests__/ai/manual-testing';
 * 
 * // Test a specific case
 * await runSingleTest('data-001');
 * 
 * // Test all conversational cases
 * await runTestsByType('conversational');
 * ```
 */

import { processLogisticsQuery } from '@/lib/ai/logistics-assistant';
import { chatTestCases, getTestCasesByType } from './chat-test-cases';

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

    // Validate against expectations
    if (testCase.expectedType === 'conversational' && result.sqlQuery) {
      console.log(`⚠️  WARNING: Expected conversational but got SQL query`);
    }
    
    if (testCase.expectedType === 'data-query' && !result.sqlQuery) {
      console.log(`⚠️  WARNING: Expected data query but got conversational response`);
    }

    if (testCase.expectedSQL?.shouldContain && result.sqlQuery) {
      const sql = result.sqlQuery.toLowerCase();
      testCase.expectedSQL.shouldContain.forEach(expected => {
        if (!sql.includes(expected.toLowerCase())) {
          console.log(`⚠️  WARNING: SQL should contain "${expected}" but doesn't`);
        }
      });
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

  let passed = 0;
  let failed = 0;

  for (const testCase of tests) {
    try {
      console.log(`Testing ${testCase.id}: ${testCase.userQuery}`);
      
      const result = await processLogisticsQuery(
        testCase.userQuery, 
        testCase.conversationContext || []
      );

      // Basic validation
      let testPassed = true;
      
      if (type === 'conversational' && result.sqlQuery) {
        console.log(`❌ ${testCase.id}: Expected conversational but got SQL`);
        testPassed = false;
      }
      
      if (type === 'data-query' && !result.sqlQuery) {
        console.log(`❌ ${testCase.id}: Expected SQL but got conversational`);
        testPassed = false;
      }

      if (testPassed) {
        console.log(`✅ ${testCase.id}: PASSED`);
        passed++;
      } else {
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ ${testCase.id}: FAILED -`, error);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
}

/**
 * Quick test for specific business scenarios
 */
export async function quickBusinessTest(): Promise<void> {
  const businessQueries = [
    'hello',
    'how many orders?',
    'orders for Abbott',
    'warehouse 10',
    'serialized orders',
    'orders from Florida'
  ];

  console.log('\n🏢 Quick Business Scenario Test\n');

  for (const query of businessQueries) {
    try {
      console.log(`Testing: "${query}"`);
      const result = await processLogisticsQuery(query);
      
      console.log(`   Type: ${result.sqlQuery ? 'SQL' : 'Chat'}`);
      if (result.sqlQuery) {
        console.log(`   SQL: ${result.sqlQuery.substring(0, 80)}...`);
      }
      console.log(`   Response: ${result.insight.substring(0, 100)}...`);
      console.log('');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`   Error: ${error}`);
    }
  }
}

/**
 * Test conversation context handling
 */
export async function testConversationContext(): Promise<void> {
  console.log('\n💬 Testing Conversation Context\n');

  // First query
  console.log('1. Initial query: "show me recent orders"');
  const result1 = await processLogisticsQuery('show me recent orders');
  console.log(`   SQL: ${result1.sqlQuery}`);
  
  // Build conversation history
  const history = [
    {
      role: 'user' as const,
      content: 'show me recent orders'
    },
    {
      role: 'assistant' as const,
      content: result1.insight,
      sqlQuery: result1.sqlQuery
    }
  ];

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Follow-up query with context
  console.log('\n2. Follow-up query: "how many of those were from Abbott?"');
  const result2 = await processLogisticsQuery('how many of those were from Abbott?', history);
  console.log(`   SQL: ${result2.sqlQuery}`);
  console.log(`   Should contain: customer ILIKE '%Abbott%'`);
  
  if (result2.sqlQuery?.toLowerCase().includes('abbott')) {
    console.log('   ✅ Context reference working correctly');
  } else {
    console.log('   ❌ Context reference not working');
  }
}
