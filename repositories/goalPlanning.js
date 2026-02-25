const getDb = () => global.db;

const createGoal = (data) => {
  const db = getDb();
  if (!db) throw new Error("Database not connected");

  const stmt = db.prepare(`
    INSERT INTO goals (
      userId, goalType, status, timeHorizonYears,
      inflationRate, equityReturnRate, debtReturnRate,
      totalGoalAmountFuture, equityGoalAmount, debtGoalAmount,
      strategyType, equitySip, debtSip, totalSip,
      equityLumpsum, debtLumpsum, totalLumpsum, totalInvestment, expectedGain,
      sipAffordable, shortfall, monthlySurplus,
      aiVersion, formulaVersion
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?
    )
  `);

  const info = stmt.run(
    data.userId, data.goalType, data.status, data.timeHorizonYears,
    data.assumptions?.inflationRate || null, data.assumptions?.equityReturnRate || null, data.assumptions?.debtReturnRate || null,
    data.allocation?.totalGoalAmountFuture || null, data.allocation?.equityGoalAmount || null, data.allocation?.debtGoalAmount || null,
    data.strategy?.type || null, data.strategy?.equitySip || null, data.strategy?.debtSip || null, data.strategy?.totalSip || null,
    data.strategy?.equityLumpsum || null, data.strategy?.debtLumpsum || null, data.strategy?.totalLumpsum || null, data.strategy?.totalInvestment || null, data.strategy?.expectedGain || null,
    data.feasibility?.sipAffordable ? 1 : 0, data.feasibility?.shortfall || 0, data.feasibility?.monthlySurplus || null,
    data.aiVersion || null, data.formulaVersion || null
  );

  return { id: info.lastInsertRowid, ...data };
};

const getGoalsByUserId = (userId) => {
  const db = getDb();
  return db.prepare("SELECT * FROM goals WHERE userId = ?").all(userId);
};

const getGoalById = (goalId) => {
  const db = getDb();
  return db.prepare("SELECT * FROM goals WHERE id = ?").get(goalId) || null;
};

const updateGoal = (goalId, data) => {
  throw new Error("updateGoal not implemented yet for SQLite");
};

const deleteGoal = (goalId) => {
  const db = getDb();
  const info = db.prepare("DELETE FROM goals WHERE id = ?").run(goalId);
  return info.changes > 0;
};

const countGoalsByStatus = (userId, status) => {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) AS count FROM goals WHERE userId = ? AND status = ?").get(userId, status);
  return row ? row.count : 0;
};

const getGoalsForAnalysis = (userId) => {
  return getGoalsByUserId(userId);
};

const getGoalMetrics = (userId) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT 
      COUNT(*) AS totalGoals,
      SUM(CASE WHEN status = 'Achievable' THEN 1 ELSE 0 END) AS achievableGoals,
      SUM(CASE WHEN status = 'Not Achievable' THEN 1 ELSE 0 END) AS notAchievableGoals,
      SUM(shortfall) AS totalShortfall
    FROM goals
    WHERE userId = ?
  `).get(userId);
  return [row]; // Keeping array format for backwards compatibility with mysql2 mapping if any
};

module.exports = {
  createGoal,
  getGoalsByUserId,
  getGoalById,
  updateGoal,
  deleteGoal,
  countGoalsByStatus,
  getGoalsForAnalysis,
  getGoalMetrics
};