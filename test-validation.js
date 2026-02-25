/**
 * VALIDATION LAYER STRESS TEST
 * Tests the schema validator, force-merge, and integrity checks
 * with deliberately malformed / hallucinated AI payloads.
 */

const { validateGoalPlanningOutput } = require("./utils/validateGoalPlanningOutput");
const { computeDeterministicMath } = require("./utils/goalPlanningInputMapper");

let passed = 0;
let failed = 0;

const assert = (label, val, expected) => {
    const ok = typeof expected === "boolean" ? val === expected : val;
    if (ok) {
        console.log(`  ✅ [PASS] ${label}`);
        passed++;
    } else {
        console.log(`  ❌ [FAIL] ${label}`);
        failed++;
    }
};

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 1: Schema Validator Unit Tests
// ──────────────────────────────────────────────────────────────────────────────
console.log("\n=== SECTION 1: Schema Validator Unit Tests ===\n");

// 1a. Valid merged object
console.log("Test 1a — Valid merged object should PASS:");
const validObj = {
    goal: { name: "Retirement", type: "retirement", status: "Achievable", horizonYears: 30, suggest: "Stay the course." },
    strategy: { type: "sip", totalSip: 20000, requiredSip: 20000, expectedGain: 5000000 },
    allocation: { totalGoalAmountFuture: 8000000, equityPercentage: 60, debtPercentage: 40 },
    feasibility: { sipAffordable: true, shortfall: 0, monthlySurplus: 50000 },
};
const r1 = validateGoalPlanningOutput(validObj);
assert("Valid object: valid===true", r1.valid, true);
assert("Valid object: errors is empty", r1.errors.length === 0, true);

// 1b. Missing goal block
console.log("\nTest 1b — Missing goal block should FAIL:");
const r2 = validateGoalPlanningOutput({ strategy: validObj.strategy, allocation: validObj.allocation, feasibility: validObj.feasibility });
assert("Missing goal: valid===false", r2.valid, false);
assert("Missing goal: has error msg", r2.errors.length > 0, true);

// 1c. Allocation doesn't sum to 100
console.log("\nTest 1c — Allocation sums to 70 (not 100) should FAIL:");
const bad3 = { ...validObj, allocation: { ...validObj.allocation, equityPercentage: 50, debtPercentage: 20 } };
const r3 = validateGoalPlanningOutput(bad3);
assert("Allocation 70%: valid===false", r3.valid, false);
assert("Allocation 70%: error mentions sum", r3.errors.some(e => e.includes("sum")), true);

// 1d. sipAffordable=true but requiredSip > monthlySurplus (inconsistent)
console.log("\nTest 1d — sipAffordable=true when SIP > Surplus should FAIL:");
const bad4 = { ...validObj, strategy: { ...validObj.strategy, requiredSip: 60000 }, feasibility: { ...validObj.feasibility, sipAffordable: true } };
const r4 = validateGoalPlanningOutput(bad4);
assert("Affordability mismatch: valid===false", r4.valid, false);

// 1e. NaN value in monthlySurplus
console.log("\nTest 1e — NaN in monthlySurplus should FAIL:");
const bad5 = { ...validObj, feasibility: { ...validObj.feasibility, monthlySurplus: NaN } };
const r5 = validateGoalPlanningOutput(bad5);
assert("NaN monthlySurplus: valid===false", r5.valid, false);

// 1f. Negative expectedGain
console.log("\nTest 1f — Negative expectedGain should FAIL:");
const bad6 = { ...validObj, strategy: { ...validObj.strategy, expectedGain: -5000 } };
const r6 = validateGoalPlanningOutput(bad6);
assert("Negative gain: valid===false", r6.valid, false);

// 1g. horizonYears = 0
console.log("\nTest 1g — horizonYears=0 should FAIL:");
const bad7 = { ...validObj, goal: { ...validObj.goal, horizonYears: 0 } };
const r7 = validateGoalPlanningOutput(bad7);
assert("horizonYears=0: valid===false", r7.valid, false);

// 1h. shortfall non-zero when sipAffordable=true
console.log("\nTest 1h — shortfall=500 with sipAffordable=true should FAIL:");
const bad8 = { ...validObj, feasibility: { ...validObj.feasibility, sipAffordable: true, shortfall: 500, monthlySurplus: 50000 } };
const r8 = validateGoalPlanningOutput(bad8);
assert("Shortfall+Achievable conflict: FAIL", r8.valid, false);

// 1i. Invalid status string
console.log("\nTest 1i — Invalid goal.status should FAIL:");
const bad9 = { ...validObj, goal: { ...validObj.goal, status: "Maybe" } };
const r9 = validateGoalPlanningOutput(bad9);
assert("Invalid status: valid===false", r9.valid, false);

// 1j. Missing suggest text
console.log("\nTest 1j — Empty suggest string should FAIL:");
const bad10 = { ...validObj, goal: { ...validObj.goal, suggest: "   " } };
const r10 = validateGoalPlanningOutput(bad10);
assert("Empty suggest: valid===false", r10.valid, false);

// ──────────────────────────────────────────────────────────────────────────────
// SECTION 2: Deterministic Math Engine Unit Tests
// ──────────────────────────────────────────────────────────────────────────────
console.log("\n=== SECTION 2: Deterministic Math Engine Tests ===\n");

const baseRequest = {
    goal: {
        type: "retirement",
        currentAge: 30,
        retirementAge: 60,
        lifeExpectancy: 85,
        targetMonthlyAmount: 50000,
    },
    finance: {
        monthlyIncome: 100000,
        monthlyExpenses: 40000,
        emi: 10000,
        currentSavings: 200000,
        emergencyFundRequired: 100000,
    },
};

console.log("Test 2a — Moderate risk profile should compute correct asset allocation:");
const math = computeDeterministicMath(baseRequest, "moderate", 0.06);
assert("Moderate: equityPercentage=60", math.equityPercentage === 60, true);
assert("Moderate: debtPercentage=40", math.debtPercentage === 40, true);
assert("Moderate: allocation sums to 100", math.equityPercentage + math.debtPercentage === 100, true);

console.log("\nTest 2b — Aggressive risk profile:");
const mathA = computeDeterministicMath(baseRequest, "aggressive", 0.06);
assert("Aggressive: equityPercentage=80", mathA.equityPercentage === 80, true);
assert("Aggressive: debtPercentage=20", mathA.debtPercentage === 20, true);

console.log("\nTest 2c — Conservative risk profile:");
const mathC = computeDeterministicMath(baseRequest, "conservative", 0.06);
assert("Conservative: equityPercentage=30", mathC.equityPercentage === 30, true);
assert("Conservative: debtPercentage=70", mathC.debtPercentage === 70, true);

console.log("\nTest 2d — Monthly surplus correctly deducts EMI:");
assert("Surplus = Income-Expenses-EMI", math.monthlySurplus === 50000, true);

console.log("\nTest 2e — sipAffordable matches SIP vs surplus:");
const expectedAffordable = math.requiredSip <= math.monthlySurplus;
assert("sipAffordable consistent", math.sipAffordable === expectedAffordable, true);

console.log("\nTest 2f — shortfall is 0 when Achievable:");
if (math.sipAffordable) {
    assert("Achievable: shortfall===0", math.shortfall === 0, true);
} else {
    assert("Not Achievable: shortfall>0", math.shortfall > 0, true);
}

console.log("\nTest 2g — No NaN or negative values in output:");
const numericFields = [math.totalGoalAmountFuture, math.requiredSip, math.totalSip,
math.expectedGain, math.monthlySurplus, math.shortfall];
const allValid = numericFields.every(v => !isNaN(v) && isFinite(v) && v >= 0);
assert("All numeric fields: valid & non-negative", allValid, true);

console.log("\nTest 2h — Other goal type (non-retirement):");
const otherReq = {
    goal: { type: "other", name: "Home Loan", timeHorizonYears: 10, targetAmount: 2000000 },
    finance: { monthlyIncome: 80000, monthlyExpenses: 30000, emi: 0, currentSavings: 0, emergencyFundRequired: 0 },
};
const mathOther = computeDeterministicMath(otherReq, "moderate", 0.06);
assert("Other goal: FV > targetAmount (inflation adjusted)", mathOther.totalGoalAmountFuture > 2000000, true);
assert("Other goal: horizonYears=10", mathOther.horizonYears === 10, true);

// ──────────────────────────────────────────────────────────────────────────────
// FINAL SUMMARY
// ──────────────────────────────────────────────────────────────────────────────
console.log("\n══════════════════════════════════════════")
console.log(`Validation Tests: ${passed} passed, ${failed} failed`);
if (failed === 0) {
    console.log("✅ ALL VALIDATION TESTS PASSED");
} else {
    console.log(`❌ ${failed} TESTS FAILED`);
    process.exit(1);
}
