// ============================================================
// DETERMINISTIC FINANCIAL ENGINE - v2
// Accepts user-provided inflation rate, allocation %, and return rates.
// All financial calculations are performed here in Node.js.
// AI cannot influence these values.
// ============================================================

const RISK_PROFILES = {
  conservative: { eq_w: 0.30, dt_w: 0.70, eq_r: 0.08, dt_r: 0.05 },
  moderate: { eq_w: 0.60, dt_w: 0.40, eq_r: 0.12, dt_r: 0.07 },
  aggressive: { eq_w: 0.80, dt_w: 0.20, eq_r: 0.15, dt_r: 0.09 },
};

const resolveRiskProfile = (riskProfileName) => {
  return RISK_PROFILES[riskProfileName?.toLowerCase()] || RISK_PROFILES.moderate;
};

const mapGoalData = (goal) => {
  const type = goal.type.trim().toLowerCase();
  if (type === "retirement") {
    return {
      goal_type: "retirement",
      goal_name: "Retirement",
      current_age: Number(goal.currentAge) || 30,
      retirement_age: Number(goal.retirementAge) || 60,
      life_expectancy: Number(goal.lifeExpectancy) || 85,
      target_monthly_amount: Number(goal.targetMonthlyAmount) || 50000,
    };
  }
  return {
    goal_type: "other",
    goal_name: goal.name || "Financial Goal",
    time_horizon_years: Number(goal.timeHorizonYears) || 5,
    target_goal_amount: Number(goal.targetAmount) || 100000,
  };
};

const mapFinanceData = (finance) => ({
  monthlyIncome: Number(finance.monthlyIncome) || 0,
  monthlyExpenses: Number(finance.monthlyExpenses) || 0,
  emi: Number(finance.emi) || 0,
  currentSavings: Number(finance.currentSavings) || 0,
  emergencyFund: Number(finance.emergencyFundRequired) || 0,
});

// ============================================================
// CORE DETERMINISTIC MATH ENGINE
// Implements exact 7-step formula sequence as specified.
// ============================================================
const computeDeterministicMath = (requestBody, riskProfileName, inflationRateFallback = 0.06) => {
  const { goal, finance } = requestBody;
  const mappedGoal = mapGoalData(goal);
  const mappedFinance = mapFinanceData(finance);

  // ── User-provided rates (or fall back to risk profile) ──
  const profileDefaults = resolveRiskProfile(riskProfileName);

  const inflationRate = (finance.inflationRate != null)
    ? Number(finance.inflationRate)
    : inflationRateFallback;

  const eq_w = (finance.equityPct != null)
    ? Number(finance.equityPct)
    : profileDefaults.eq_w;

  const dt_w = (finance.debtPct != null)
    ? Number(finance.debtPct)
    : profileDefaults.dt_w;

  const eq_r = (finance.equityReturnRate != null)
    ? Number(finance.equityReturnRate)
    : profileDefaults.eq_r;

  const dt_r = (finance.debtReturnRate != null)
    ? Number(finance.debtReturnRate)
    : profileDefaults.dt_r;

  // ── STEP 1 — Time Horizon & Future Value (Inflate Goal Amount) ──
  let timeHorizon = 0;
  let FV = 0;

  if (mappedGoal.goal_type === "retirement") {
    timeHorizon = mappedGoal.retirement_age - mappedGoal.current_age;
    const durationYears = mappedGoal.life_expectancy - mappedGoal.retirement_age;
    // Monthly expense inflated to retirement date
    const monthlyExpAtRetirement = mappedGoal.target_monthly_amount * Math.pow(1 + inflationRate, timeHorizon);
    // Post-retirement: use conservative 4% nominal return on the corpus
    // PV of annuity formula: PMT × [1 - (1+r)^-n] / r (monthly)
    const postRetR = 0.04 / 12; // conservative post-retirement monthly return
    const postRetN = durationYears * 12;
    if (postRetR > 0) {
      FV = monthlyExpAtRetirement * (1 - Math.pow(1 + postRetR, -postRetN)) / postRetR;
    } else {
      FV = monthlyExpAtRetirement * postRetN;
    }
  } else {
    timeHorizon = mappedGoal.time_horizon_years;
    FV = mappedGoal.target_goal_amount * Math.pow(1 + inflationRate, timeHorizon);
  }

  // ── STEP 2 — Asset Split ──
  const eqGoal = FV * eq_w;  // Equity Goal Amount
  const dtGoal = FV * dt_w;  // Debt Goal Amount

  // ── STEP 3 — Monthly Return Conversion ──
  const eq_rm = Math.pow(1 + eq_r, 1 / 12) - 1;  // Monthly equity return
  const dt_rm = Math.pow(1 + dt_r, 1 / 12) - 1;  // Monthly debt return
  const totalMonths = timeHorizon * 12;

  // ── STEP 3b — Savings Credit (reduce required corpus) ──
  const availableSavings = Math.max(0, mappedFinance.currentSavings - mappedFinance.emergencyFund);
  const blendedReturn = eq_w * eq_r + dt_w * dt_r;
  const futureValueOfSavings = timeHorizon > 0
    ? availableSavings * Math.pow(1 + blendedReturn, timeHorizon)
    : availableSavings;

  const eqGoalAdj = Math.max(0, eqGoal - futureValueOfSavings * eq_w);
  const dtGoalAdj = Math.max(0, dtGoal - futureValueOfSavings * dt_w);

  // ── STEP 4 — SIP Calculation ──
  let eqSip = 0;
  let dtSip = 0;

  if (totalMonths > 0 && eq_rm > 0 && eqGoalAdj > 0) {
    eqSip = (eqGoalAdj * eq_rm) / (Math.pow(1 + eq_rm, totalMonths) - 1);
  }
  if (totalMonths > 0 && dt_rm > 0 && dtGoalAdj > 0) {
    dtSip = (dtGoalAdj * dt_rm) / (Math.pow(1 + dt_rm, totalMonths) - 1);
  }

  const totalSip = eqSip + dtSip;

  // ── STEP 5 — Total Investment ──
  const totalInvestment = totalSip * totalMonths + availableSavings;

  // ── STEP 6 — Expected Gain ──
  const expectedGain = Math.max(0, FV - totalInvestment);

  // ── STEP 7 — Feasibility ──
  const monthlySurplus = Math.max(
    0, mappedFinance.monthlyIncome - mappedFinance.monthlyExpenses - mappedFinance.emi
  );
  const sipAffordable = totalSip <= monthlySurplus;
  const shortfall = sipAffordable ? 0 : Math.max(0, totalSip - monthlySurplus);
  const status = sipAffordable ? "Achievable" : "Not Achievable";

  const equityPercentage = Math.round(eq_w * 100);
  const debtPercentage = Math.round(dt_w * 100);

  return {
    // Goal identifiers
    goalName: mappedGoal.goal_name,
    goalType: mappedGoal.goal_type,
    horizonYears: timeHorizon,
    status,

    // Full financial breakdown
    inflationRate: parseFloat((inflationRate * 100).toFixed(2)),  // as %
    equityReturnRate: parseFloat((eq_r * 100).toFixed(2)),          // as %
    debtReturnRate: parseFloat((dt_r * 100).toFixed(2)),          // as %
    equityPercentage,
    debtPercentage,

    // Step 1
    totalGoalAmountFuture: parseFloat(FV.toFixed(2)),
    // Step 2
    equityGoalAmount: parseFloat(eqGoal.toFixed(2)),
    debtGoalAmount: parseFloat(dtGoal.toFixed(2)),
    // Step 4
    equitySip: parseFloat(eqSip.toFixed(2)),
    debtSip: parseFloat(dtSip.toFixed(2)),
    totalSip: parseFloat(totalSip.toFixed(2)),
    requiredSip: parseFloat(totalSip.toFixed(2)),
    // Step 5
    totalInvestmentAmount: parseFloat(totalInvestment.toFixed(2)),
    // Step 6
    expectedGain: parseFloat(expectedGain.toFixed(2)),
    // Step 7
    monthlySurplus: parseFloat(monthlySurplus.toFixed(2)),
    sipAffordable,
    shortfall: parseFloat(shortfall.toFixed(2)),

    // Prompt context (for AI text advisory)
    _promptInput: {
      ...mappedGoal,
      ...mappedFinance,
      risk_profile: riskProfileName,
      inflation_rate: inflationRate,
      equityPercentage, debtPercentage,
      PRE_CALCULATED_FUTURE_VALUE: FV.toFixed(2),
      PRE_CALCULATED_REQUIRED_SIP: totalSip.toFixed(2),
      PRE_CALCULATED_EXPECTED_GAIN: expectedGain.toFixed(2),
      PRE_CALCULATED_MONTHLY_SURPLUS: monthlySurplus.toFixed(2),
      PRE_CALCULATED_SIP_AFFORDABLE: sipAffordable,
      PRE_CALCULATED_SHORTFALL: shortfall.toFixed(2),
      PRE_CALCULATED_STATUS: status,
    }
  };
};

const buildPromptInput = (requestBody, riskProfileName, currentInflation) => {
  const math = computeDeterministicMath(requestBody, riskProfileName, currentInflation);
  return Object.entries(math._promptInput)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
};

module.exports = { buildPromptInput, computeDeterministicMath };
