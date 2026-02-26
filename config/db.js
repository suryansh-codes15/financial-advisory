const path = require('path');

const connectDB = async () => {
  if (process.env.NODE_ENV === 'production' || process.env.POSTGRES_URL) {
    const { createPool } = require('@vercel/postgres');
    try {
      const pool = createPool({
        connectionString: process.env.POSTGRES_URL
      });
      console.log('✅ Vercel Postgres Connected');
      global.db = pool;
      return pool;
    } catch (error) {
      console.error('❌ Vercel Postgres Connection Failed:', error.message);
      process.exit(1);
    }
  } else {
    const Database = require('better-sqlite3');
    try {
      const dbPath = path.resolve(__dirname, '../goalplanning.db');
      const db = new Database(dbPath, { verbose: console.log });
      console.log(`✅ SQLite Connected at ${dbPath} `);
      global.db = db;
      return db;
    } catch (error) {
      console.error("❌ SQLite Connection Failed:", error.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;