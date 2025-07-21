
import { Pool } from 'pg';

// This creates a connection pool.
// The connection details are automatically read from environment variables.
// You need to set POSTGRES_URL in your .env file.
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = {
  query: (text: string, params: any[]) => pool.query(text, params),
};
