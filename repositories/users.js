const getDb = () => global.db;

const createUser = (data) => {
  const db = getDb();
  if (!db) throw new Error("Database not connected");

  const stmt = db.prepare(`
    INSERT INTO users (
      name, email, monthlyIncome, monthlyExpenses, emi, riskProfile, emergencyFundAmount, dateOfBirth
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    data.name, data.email, data.monthlyIncome, data.monthlyExpenses, data.emi || 0,
    data.riskProfile, data.emergencyFundAmount || null, data.dateOfBirth
  );

  return { id: info.lastInsertRowid, ...data };
};

const getUserById = (id) => {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) || null;
};

const getUserByEmail = (email) => {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) || null;
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail
};