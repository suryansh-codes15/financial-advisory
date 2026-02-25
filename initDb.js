require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

const initDatabase = () => {
  try {
    const dbPath = path.resolve(__dirname, 'goalplanning.db');
    const db = new Database(dbPath, { verbose: console.log });

    console.log("Creating Users table (SQLite)...");

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        monthlyIncome REAL NOT NULL CHECK(monthlyIncome >= 0),
        monthlyExpenses REAL NOT NULL CHECK(monthlyExpenses >= 0),
        emi REAL DEFAULT 0 CHECK(emi >= 0),
        riskProfile TEXT NOT NULL CHECK(riskProfile IN ('conservative', 'moderate', 'aggressive')),
        emergencyFundAmount REAL CHECK(emergencyFundAmount >= 0),
        dateOfBirth TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Creating Goals table (SQLite)...");

    db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        goalType TEXT NOT NULL CHECK(goalType IN ('retirement', 'house', 'education', 'marriage', 'car', 'other')),
        status TEXT NOT NULL CHECK(status IN ('Achievable', 'Not Achievable', 'Partially Achievable')),
        timeHorizonYears INTEGER NOT NULL CHECK(timeHorizonYears >= 1),
        
        -- Assumptions
        inflationRate REAL NOT NULL,
        equityReturnRate REAL NOT NULL,
        debtReturnRate REAL NOT NULL,

        -- Allocation
        totalGoalAmountFuture REAL NOT NULL,
        equityGoalAmount REAL NOT NULL,
        debtGoalAmount REAL NOT NULL,

        -- Strategy
        strategyType TEXT NOT NULL CHECK(strategyType IN ('sip', 'lumpsum', 'hybrid')),
        equitySip REAL,
        debtSip REAL,
        totalSip REAL,
        equityLumpsum REAL,
        debtLumpsum REAL,
        totalLumpsum REAL,
        totalInvestment REAL NOT NULL,
        expectedGain REAL NOT NULL,

        -- Feasibility
        sipAffordable INTEGER,
        shortfall REAL DEFAULT 0,
        monthlySurplus REAL,

        aiVersion TEXT,
        formulaVersion TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("✅ SQLite Tables Initialized Successfully");
    db.close();
    process.exit(0);

  } catch (error) {
    console.error("❌ Database Initialization Failed:", error.message);
    process.exit(1);
  }
};

initDatabase();
