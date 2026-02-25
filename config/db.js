const Database = require('better-sqlite3');
const path = require('path');

const connectDB = () => {
  try {
    const dbPath = path.resolve(__dirname, '../goalplanning.db');
    const db = new Database(dbPath, { verbose: console.log });

    console.log(`✅ SQLite Connected at ${dbPath}`);

    // Store globally for services/repositories to access easily
    global.db = db;
    return db;

  } catch (error) {
    console.error("❌ SQLite Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;