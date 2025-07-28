#!/usr/bin/env node

/**
 * Chat Test Runner - Easy execution of chat assistant tests
 * 
 * Usage:
 *   npm run test:chat                    # Run all chat tests
 *   node scripts/run-chat-tests.js      # Interactive mode
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function runCommand(command) {
  try {
    console.log(`\n🚀 Running: ${command}\n`);
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
  }
}

function showMenu() {
  console.log('\n📊 Chat AI Testing Options:');
  console.log('1. Run ALL chat tests (conversational + data queries)');
  console.log('2. Run ONLY conversational tests');
  console.log('3. Run ONLY data query tests');
  console.log('4. Run specific test by ID');
  console.log('5. Run performance tests');
  console.log('6. Run with verbose output');
  console.log('0. Exit');
  console.log('\nChoose an option (0-6):');
}

function handleMenuChoice(choice) {
  switch (choice.trim()) {
    case '1':
      runCommand('npm run test:chat');
      break;
    case '2':
      runCommand('npx jest --testNamePattern="Conversational Query Detection"');
      break;
    case '3':
      runCommand('npx jest --testNamePattern="Data Query Processing"');
      break;
    case '4':
      rl.question('Enter test ID (e.g., data-001, conv-002): ', (testId) => {
        runCommand(`npx jest --testNamePattern="${testId}"`);
        showMenu();
        rl.prompt();
      });
      return;
    case '5':
      runCommand('npx jest --testNamePattern="Performance Testing"');
      break;
    case '6':
      runCommand('npm run test:chat:verbose');
      break;
    case '0':
      console.log('👋 Goodbye!');
      rl.close();
      return;
    default:
      console.log('❌ Invalid option. Please choose 0-6.');
  }
  
  if (choice.trim() !== '4') {
    setTimeout(() => {
      showMenu();
      rl.prompt();
    }, 1000);
  }
}

// Main execution
console.log('🤖 Logistics AI Chat Test Runner\n');
console.log('This tool helps you run automated tests for your chat assistant.');
console.log('Make sure you have OPENAI_API_KEY and POSTGRES_URL configured in your environment.');

showMenu();
rl.prompt();

rl.on('line', handleMenuChoice);
rl.on('close', () => {
  process.exit(0);
});
