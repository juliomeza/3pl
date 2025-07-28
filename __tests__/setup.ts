/**
 * Jest setup file for global test configuration
 */

// Load environment variables from .env file for tests
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envFile = readFileSync(join(process.cwd(), '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      const value = values.join('=').trim();
      if (value && !process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
} catch (error) {
  console.warn('Could not load .env file for tests');
}

// Extend Jest matchers
import '@testing-library/jest-dom';

// Set longer timeout for integration tests
jest.setTimeout(30000);

// Mock console methods in tests if needed
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress expected errors in tests
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test configuration
if (!process.env.NODE_ENV) {
  (process.env as any).NODE_ENV = 'test';
}
