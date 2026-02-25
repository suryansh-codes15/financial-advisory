/**
 * MATH ENGINE DIAGNOSTIC
 * Traces every formula step with real sample inputs and
 * compares against manually-verified expected values.
 */

const { computeDeterministicMath } = require("./utils/goalPlanningInputMapper");

const sep = (t) => console.log(`\n${'─'.repeat(50)}\n${t}\n${'─'.repeat(50)}`);
const row = (label, val, unit = '') => console.log(`  ${label.padEnd(34)} ${String(val).padStart(18)} ${unit}`);

// ─────────────────────────────────────────
// SAMPLE 1: Retirement, Moderate Risk
// Manual Expected Values:
//   timeHorizon: 30 years
//   FV: 50000 * 12 * (1.06^30) * 25 = 86,115,000 approx
//   eq_rm: (1.12)^(1/12) - 1 = 0.009489
//   dt_rm: (1.07)^(1/12) - 1 = 0.005654
//   eqSIP: (FV*0.6 * eq_rm) / ((1+eq_rm)^360 - 1)
// ─────────────────────────────────────────

const req1 = {
    goal: {
        type: "Retirement",
        currentAge: 30,
        retirementAge: 60,
        lifeExpectancy: 85,
        targetMonthlyAmount: 50000,
    },
    finance: {
        monthlyIncome: 150000,
        monthlyExpenses: 60000,
        emi: 20000,
        currentSavings: 500000,
        emergencyFundRequired: 300000,
        // Moderate allocation sent from frontend (as decimals)
        inflationRate: 0.06,
        equityPct: 0.60,
        debtPct: 0.40,
        equityReturnRate: 0.12,
        debtReturnRate: 0.07,
    },
};

sep("SAMPLE 1 — Retirement, Moderate Risk");
const m1 = computeDeterministicMath(req1, "moderate", 0.06);

// Manual cross-check values
const INF = 0.06;
const TH = 30;
const n = TH * 12; // 360
const annExpNow = 50000 * 12;
const annExpFuture = annExpNow * Math.pow(1 + INF, TH);
const FV_expected = annExpFuture * (85 - 60);

const eq_r = 0.12, dt_r = 0.07;
const eq_rm = Math.pow(1 + eq_r, 1 / 12) - 1;
const dt_rm = Math.pow(1 + dt_r, 1 / 12) - 1;

const savings = 500000, emergency = 300000;
const availSavings = savings - emergency; // 200000
const blended = 0.60 * eq_r + 0.40 * dt_r; // 0.10
const fvSavings = availSavings * Math.pow(1 + blended, TH);
const eqGoal_adj = Math.max(0, FV_expected * 0.60 - fvSavings * 0.60);
const dtGoal_adj = Math.max(0, FV_expected * 0.40 - fvSavings * 0.40);

const eqSIP_expected = eqGoal_adj * eq_rm / (Math.pow(1 + eq_rm, n) - 1);
const dtSIP_expected = dtGoal_adj * dt_rm / (Math.pow(1 + dt_rm, n) - 1);
const totalSIP_expected = eqSIP_expected + dtSIP_expected;
const totalInv_expected = totalSIP_expected * n + availSavings;
const gain_expected = FV_expected - totalInv_expected;
const surplus_expected = 150000 - 60000 - 20000; // 70000

console.log("\n MANUAL EXPECTED:");
row("FV (Future Goal Corpus)", `₹${FV_expected.toFixed(0)}`);
row("eqSIP", `₹${eqSIP_expected.toFixed(2)}/mo`);
row("dtSIP", `₹${dtSIP_expected.toFixed(2)}/mo`);
row("Total SIP", `₹${totalSIP_expected.toFixed(2)}/mo`);
row("Total Investment", `₹${totalInv_expected.toFixed(0)}`);
row("Expected Gain", `₹${gain_expected.toFixed(0)}`);
row("Monthly Surplus", `₹${surplus_expected.toFixed(0)}`);
row("Status", totalSIP_expected <= surplus_expected ? "Achievable" : "Not Achievable");

console.log("\n ENGINE OUTPUT:");
row("FV (totalGoalAmountFuture)", `₹${m1.totalGoalAmountFuture}`);
row("equityGoalAmount", `₹${m1.equityGoalAmount}`);
row("debtGoalAmount", `₹${m1.debtGoalAmount}`);
row("equitySip", `₹${m1.equitySip}/mo`);
row("debtSip", `₹${m1.debtSip}/mo`);
row("Total SIP", `₹${m1.totalSip}/mo`);
row("Total Investment", `₹${m1.totalInvestmentAmount}`);
row("Expected Gain", `₹${m1.expectedGain}`);
row("Monthly Surplus", `₹${m1.monthlySurplus}`);
row("Status", m1.status);
row("sipAffordable", m1.sipAffordable);
row("Shortfall", `₹${m1.shortfall}`);
row("Equity %", `${m1.equityPercentage}%`);
row("Debt %", `${m1.debtPercentage}%`);
row("Equity Return Rate", `${m1.equityReturnRate}%`);
row("Debt Return Rate", `${m1.debtReturnRate}%`);
row("Inflation Rate (in output)", `${m1.inflationRate}%`);

// Verify
console.log("\n VERIFICATION:");
const fvDiff = Math.abs(m1.totalGoalAmountFuture - FV_expected);
console.log(`  FV match:   ${fvDiff < 1 ? '✅' : '❌'} (diff: ${fvDiff.toFixed(2)})`);
const sipDiff = Math.abs(m1.totalSip - totalSIP_expected);
console.log(`  SIP match:  ${sipDiff < 0.01 ? '✅' : '❌'} (diff: ${sipDiff.toFixed(4)})`);
const gainDiff = Math.abs(m1.expectedGain - gain_expected);
console.log(`  Gain match: ${gainDiff < 1 ? '✅' : '❌'} (diff: ${gainDiff.toFixed(2)})`);
const surplusDiff = Math.abs(m1.monthlySurplus - surplus_expected);
console.log(`  Surplus match: ${surplusDiff < 0.01 ? '✅' : '❌'} (diff: ${surplusDiff.toFixed(4)})`);

// ─────────────────────────────────────────
// SAMPLE 2: Other Goal, Aggressive Risk
// ─────────────────────────────────────────
sep("SAMPLE 2 — Other Goal (Home), Aggressive Risk, 10 Years");

const req2 = {
    goal: { type: "other", timeHorizonYears: 10, targetAmount: 5000000 },
    finance: {
        monthlyIncome: 200000,
        monthlyExpenses: 80000,
        emi: 30000,
        currentSavings: 1000000,
        emergencyFundRequired: 600000,
        inflationRate: 0.06,
        equityPct: 0.80,
        debtPct: 0.20,
        equityReturnRate: 0.15,
        debtReturnRate: 0.09,
    },
};

const m2 = computeDeterministicMath(req2, "aggressive", 0.06);

const FV2 = 5000000 * Math.pow(1.06, 10);
const surp2 = 200000 - 80000 - 30000;
console.log("\n MANUAL EXPECTED:");
row("FV", `₹${FV2.toFixed(0)}`);
row("Monthly Surplus", `₹${surp2}`);

console.log("\n ENGINE OUTPUT:");
row("FV", `₹${m2.totalGoalAmountFuture}`);
row("Equity SIP", `₹${m2.equitySip}/mo`);
row("Debt SIP", `₹${m2.debtSip}/mo`);
row("Total SIP", `₹${m2.totalSip}/mo`);
row("Monthly Surplus", `₹${m2.monthlySurplus}`);
row("Status", m2.status);
row("Equity %", `${m2.equityPercentage}%`);

const fv2Diff = Math.abs(m2.totalGoalAmountFuture - FV2);
console.log(`\n  FV match: ${fv2Diff < 1 ? '✅' : '❌'} (diff: ${fv2Diff.toFixed(2)})`);

console.log("\n✅ Diagnostic complete.\n");
