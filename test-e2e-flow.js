/**
 * END-TO-END FLOW TEST - Tests exact payload the frontend sends
 * including investment assumption fields.
 */
const { computeDeterministicMath } = require("./utils/goalPlanningInputMapper");
const { validateGoalPlanningOutput } = require("./utils/validateGoalPlanningOutput");
const { validateGoalPlanningInput } = require("./utils/validateGoalPlanningInput");

let passed = 0, failed = 0;
const ok = (label, bool) => { bool ? (passed++, console.log(`  ✅ ${label}`)) : (failed++, console.log(`  ❌ ${label}`)); };

// Simulated full payload the frontend sends (after user fills Investment Assumptions)
const frontendPayload = {
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
        investmentMode: "sip",
        // User-provided investment assumptions (frontend divides by 100)
        inflationRate: 0.06,
        equityPct: 0.60,
        debtPct: 0.40,
        equityReturnRate: 0.12,
        debtReturnRate: 0.07,
    },
};

console.log("\n=== INPUT VALIDATION ===");
const inputVal = validateGoalPlanningInput(frontendPayload);
console.log("Errors:", inputVal.errors);
ok("Input validation passes", inputVal.valid);
if (!inputVal.valid) {
    inputVal.errors.forEach(e => console.log("   ⛔", e.message || e));
}

console.log("\n=== MATH ENGINE ===");
const math = computeDeterministicMath(frontendPayload, "moderate", 0.06);
console.log("  Total SIP:", math.totalSip);
console.log("  Equity SIP:", math.equitySip);
console.log("  Debt SIP:", math.debtSip);
console.log("  FV:", math.totalGoalAmountFuture);
console.log("  Equity Goal:", math.equityGoalAmount);
console.log("  Debt Goal:", math.debtGoalAmount);
console.log("  Expected Gain:", math.expectedGain);
console.log("  Monthly Surplus:", math.monthlySurplus);
console.log("  Status:", math.status);

ok("FV > 0", math.totalGoalAmountFuture > 0);
ok("SIP > 0", math.totalSip > 0);
ok("Equity SIP > 0", math.equitySip > 0);
ok("Debt SIP > 0", math.debtSip > 0);
ok("Surplus = 70000", math.monthlySurplus === 70000);
ok("Status = Achievable", math.status === "Achievable");
ok("equityPercentage = 60", math.equityPercentage === 60);
ok("debtPercentage = 40", math.debtPercentage === 40);
ok("equityReturnRate = 12", math.equityReturnRate === 12);
ok("debtReturnRate = 7", math.debtReturnRate === 7);
ok("inflationRate = 6", math.inflationRate === 6);

// Simulate what the service force-merge produces
console.log("\n=== SIMULATED MERGED OUTPUT ===");
const merged = {
    goal: {
        name: "Retirement",
        type: math.goalType,
        status: math.status,
        horizonYears: math.horizonYears,
        suggest: "Stay disciplined with your monthly SIP contributions to build a secure retirement corpus.",
    },
    strategy: {
        type: "sip",
        totalSip: math.totalSip,
        requiredSip: math.requiredSip,
        expectedGain: math.expectedGain,
        totalInvestment: math.totalInvestmentAmount,
        equitySip: math.equitySip,
        debtSip: math.debtSip,
    },
    allocation: {
        totalGoalAmountFuture: math.totalGoalAmountFuture,
        equityGoalAmount: math.equityGoalAmount,
        debtGoalAmount: math.debtGoalAmount,
        equityPercentage: math.equityPercentage,
        debtPercentage: math.debtPercentage,
        equityReturnRate: math.equityReturnRate,
        debtReturnRate: math.debtReturnRate,
        inflationRate: math.inflationRate,
    },
    feasibility: {
        sipAffordable: math.sipAffordable,
        shortfall: math.shortfall,
        monthlySurplus: math.monthlySurplus,
    },
};

console.log("\n=== OUTPUT SCHEMA VALIDATION ===");
const outVal = validateGoalPlanningOutput(merged);
console.log("Errors:", outVal.errors);
ok("Output schema passes", outVal.valid);
if (!outVal.valid) {
    outVal.errors.forEach(e => console.log("   ⛔", e));
}

console.log(`\n${'═'.repeat(40)}`);
console.log(`Result: ${passed} passed, ${failed} failed`);
if (failed > 0) { console.log("❌ ISSUES FOUND"); process.exit(1); }
else console.log("✅ ALL CHECKS PASSED");
