// ============================================================
// STRICT OUTPUT SCHEMA VALIDATOR
// Validates the MERGED final object (after backend force-merge).
// All numbers should already be backend-controlled.
// This is a final safety net, not a primary validation mechanism.
// ============================================================

/**
 * Check a value is a non-negative finite number.
 */
const isNonNegNumber = (v) => typeof v === "number" && isFinite(v) && v >= 0;

/**
 * Check a value is a positive finite number.
 */
const isPosNumber = (v) => typeof v === "number" && isFinite(v) && v > 0;

/**
 * Check a value is a non-empty string.
 */
const isString = (v) => typeof v === "string" && v.trim().length > 0;

/**
 * Main schema validation for the final merged AI+backend response object.
 * Returns { valid: boolean, errors: string[] }
 */
const validateGoalPlanningOutput = (output) => {
  const errors = [];

  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return { valid: false, errors: ["Output must be a non-null object"] };
  }

  const { goal, strategy, allocation, feasibility } = output;

  // ── GOAL ──────────────────────────────────────────────────
  if (!goal || typeof goal !== "object") {
    errors.push("goal block is missing or invalid");
  } else {
    if (!isString(goal.name))
      errors.push("goal.name must be a non-empty string");
    if (!["retirement", "other"].includes(goal.type))
      errors.push(`goal.type must be 'retirement' or 'other', got: ${goal.type}`);
    if (!["Achievable", "Not Achievable"].includes(goal.status))
      errors.push(`goal.status must be 'Achievable' or 'Not Achievable', got: ${goal.status}`);
    if (!isPosNumber(goal.horizonYears))
      errors.push(`goal.horizonYears must be a positive number, got: ${goal.horizonYears}`);
    if (!isString(goal.suggest))
      errors.push("goal.suggest must be a non-empty string");
  }

  // ── STRATEGY ──────────────────────────────────────────────
  if (!strategy || typeof strategy !== "object") {
    errors.push("strategy block is missing or invalid");
  } else {
    if (!["sip", "lumpsum", "hybrid"].includes(strategy.type))
      errors.push(`strategy.type must be sip/lumpsum/hybrid, got: ${strategy.type}`);
    if (!isNonNegNumber(strategy.totalSip))
      errors.push(`strategy.totalSip must be >= 0, got: ${strategy.totalSip}`);
    if (!isNonNegNumber(strategy.requiredSip))
      errors.push(`strategy.requiredSip must be >= 0, got: ${strategy.requiredSip}`);
    if (!isNonNegNumber(strategy.expectedGain))
      errors.push(`strategy.expectedGain must be >= 0, got: ${strategy.expectedGain}`);
  }

  // ── ALLOCATION ────────────────────────────────────────────
  if (!allocation || typeof allocation !== "object") {
    errors.push("allocation block is missing or invalid");
  } else {
    if (!isNonNegNumber(allocation.totalGoalAmountFuture))
      errors.push(`allocation.totalGoalAmountFuture must be >= 0, got: ${allocation.totalGoalAmountFuture}`);
    if (!isNonNegNumber(allocation.equityPercentage))
      errors.push(`allocation.equityPercentage must be >= 0, got: ${allocation.equityPercentage}`);
    if (!isNonNegNumber(allocation.debtPercentage))
      errors.push(`allocation.debtPercentage must be >= 0, got: ${allocation.debtPercentage}`);
    if (
      typeof allocation.equityPercentage === "number" &&
      typeof allocation.debtPercentage === "number" &&
      Math.abs(allocation.equityPercentage + allocation.debtPercentage - 100) > 0.01
    ) {
      errors.push(
        `Allocation must sum to 100%, got: ${allocation.equityPercentage}+${allocation.debtPercentage}=${allocation.equityPercentage + allocation.debtPercentage}`
      );
    }
  }

  // ── FEASIBILITY ───────────────────────────────────────────
  if (!feasibility || typeof feasibility !== "object") {
    errors.push("feasibility block is missing or invalid");
  } else {
    if (typeof feasibility.sipAffordable !== "boolean")
      errors.push("feasibility.sipAffordable must be a boolean");
    if (!isNonNegNumber(feasibility.shortfall))
      errors.push(`feasibility.shortfall must be >= 0, got: ${feasibility.shortfall}`);
    if (!isNonNegNumber(feasibility.monthlySurplus))
      errors.push(`feasibility.monthlySurplus must be >= 0, got: ${feasibility.monthlySurplus}`);
  }

  // ── CROSS-FIELD INTEGRITY ─────────────────────────────────
  if (goal && strategy && feasibility && errors.length === 0) {
    const expectedAffordable = strategy.requiredSip <= feasibility.monthlySurplus;
    if (feasibility.sipAffordable !== expectedAffordable) {
      errors.push(
        `sipAffordable mismatch: requiredSip=${strategy.requiredSip} vs monthlySurplus=${feasibility.monthlySurplus} → should be ${expectedAffordable}`
      );
    }

    const expectedStatus = feasibility.sipAffordable ? "Achievable" : "Not Achievable";
    if (goal.status !== expectedStatus) {
      errors.push(`goal.status mismatch: expected=${expectedStatus}, got=${goal.status}`);
    }

    if (feasibility.sipAffordable && feasibility.shortfall !== 0) {
      errors.push(`shortfall must be 0 when sipAffordable=true, got: ${feasibility.shortfall}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = { validateGoalPlanningOutput };