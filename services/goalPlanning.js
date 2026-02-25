// ============================================================
// GOAL PLANNING SERVICE — DETERMINISTIC OVERRIDE LAYER
//
// SECURITY MODEL:
//  1. Backend calculates 100% of financial math deterministically.
//  2. AI is called ONLY to generate advisory text (suggest, goal.name).
//  3. AI response is parsed and SANITIZED.
//  4. All numeric fields are FORCIBLY OVERWRITTEN with backend values.
//  5. Integrity checks run on the final merged object.
//  6. If AI fails → fallback text is used, math still returns correctly.
// ============================================================

const { HfInference } = require("@huggingface/inference");
const { buildGoalPrompt } = require("./buildGoalPrompt");
const { computeDeterministicMath } = require("../utils/goalPlanningInputMapper");
const { validateGoalPlanningOutput } = require("../utils/validateGoalPlanningOutput");

// Initialize Hugging Face Inference API
const hf = new HfInference(process.env.HF_TOKEN);

// ── TEXT SANITIZATION ───────────────────────────────────────
// Strip markdown, HTML, and limit suggest text to 2 sentences.
const sanitizeText = (raw) => {
    if (!raw || typeof raw !== "string") return "";
    return raw
        .replace(/[<>]/g, "")          // Strip HTML injection
        .replace(/```[a-z]*/gi, "")    // Strip markdown code fences
        .replace(/`/g, "")             // Strip backticks
        .replace(/#{1,6}\s/g, "")     // Strip markdown headers
        .replace(/\*{1,2}/g, "")      // Strip bold/italic
        .trim()
        .split(/[.!?]\s+/)             // Split into sentences
        .slice(0, 2)                   // Max 2 sentences
        .join(". ")
        .trim();
};

// ── FALLBACK SUGGEST MESSAGES ───────────────────────────────
const getFallbackSuggest = (status, goalType) => {
    if (status === "Achievable") {
        return goalType === "retirement"
            ? "Consistent monthly contributions at this level will help you build a secure retirement corpus. Stay invested and review annually."
            : "You are on track to achieve this financial goal. Maintain your SIP discipline to reach your target.";
    }
    return goalType === "retirement"
        ? "Your current surplus falls short of the required SIP. Consider increasing income, reducing EMIs, or extending your retirement age."
        : "Your current monthly capacity is below the required SIP. Increasing your savings rate or extending the time horizon can bridge this gap.";
};

// ── FORCE MERGE BACKEND MATH ────────────────────────────────
// Takes AI parsed JSON (or empty object) and merges deterministic math.
const forceMerge = (aiObj, math, strategyType, fallbackSuggest) => {
    const strategy = aiObj?.strategy || {};
    const goal = aiObj?.goal || {};

    // Sanitize AI-generated text fields
    const rawSuggest = goal?.suggest || "";
    const cleanSuggest = sanitizeText(rawSuggest) || fallbackSuggest;
    const cleanName = sanitizeText(goal?.name || math.goalName);
    const stratType = ["sip", "lumpsum", "hybrid"].includes(strategy?.type?.toLowerCase?.())
        ? strategy.type.toLowerCase()
        : strategyType || "sip";

    // Build the final clean object — all numbers from backend
    return {
        goal: {
            name: cleanName,
            type: math.goalType,
            status: math.status,
            horizonYears: math.horizonYears,
            suggest: cleanSuggest,
        },
        strategy: {
            type: stratType,
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
};

// ── INTEGRITY CHECK ─────────────────────────────────────────
// Final mathematical verification before sending to frontend.
const verifyIntegrity = (obj) => {
    const issues = [];
    const { strategy, allocation, feasibility, goal } = obj;

    if (allocation.equityPercentage + allocation.debtPercentage !== 100)
        issues.push(`Allocation mismatch: ${allocation.equityPercentage}+${allocation.debtPercentage}≠100`);

    const expectedAffordable = strategy.requiredSip <= feasibility.monthlySurplus;
    if (feasibility.sipAffordable !== expectedAffordable)
        issues.push(`sipAffordable mismatch: computed=${expectedAffordable}`);

    const expectedShortfall = feasibility.sipAffordable ? 0 :
        Math.max(0, strategy.requiredSip - feasibility.monthlySurplus);
    if (Math.abs(feasibility.shortfall - expectedShortfall) > 0.01)
        issues.push(`shortfall mismatch: expected=${expectedShortfall}`);

    const expectedStatus = feasibility.sipAffordable ? "Achievable" : "Not Achievable";
    if (goal.status !== expectedStatus)
        issues.push(`status mismatch: expected=${expectedStatus}`);

    const numberFields = [
        ["strategy.totalSip", strategy.totalSip],
        ["strategy.requiredSip", strategy.requiredSip],
        ["strategy.expectedGain", strategy.expectedGain],
        ["allocation.totalGoalAmountFuture", allocation.totalGoalAmountFuture],
        ["feasibility.shortfall", feasibility.shortfall],
        ["feasibility.monthlySurplus", feasibility.monthlySurplus],
    ];

    for (const [name, val] of numberFields) {
        if (typeof val !== "number" || isNaN(val) || val < 0)
            issues.push(`Invalid value for ${name}: ${val}`);
    }

    if (goal.horizonYears <= 0)
        issues.push(`horizonYears must be > 0, got: ${goal.horizonYears}`);

    return issues;
};

// ── MAIN SERVICE ─────────────────────────────────────────────
const goalPlanningService = async (data) => {
    try {
        console.log("[DFE] Goal Planning Service started.");

        // ── STEP 1: DETERMINISTIC MATH (never changes, never depends on AI) ──
        const riskProfile = data.finance?.expectedReturn > 0.1 ? "aggressive" : "moderate";
        const inflationRate = 0.06;
        const math = computeDeterministicMath(data, riskProfile, inflationRate);

        console.log("[DFE] Deterministic math computed:", {
            status: math.status,
            requiredSip: math.requiredSip,
            monthlySurplus: math.monthlySurplus,
            equityPercentage: math.equityPercentage,
        });

        const strategyType = data.finance?.investmentMode?.toLowerCase() || "sip";
        const fallbackText = getFallbackSuggest(math.status, math.goalType);

        // ── STEP 2: AI PROMPT (text advisory only) ──
        let aiObj = null;
        try {
            const prompt = buildGoalPrompt(data, riskProfile, inflationRate);

            console.log("[DFE] Sending advisory prompt to Hugging Face...");
            const response = await hf.chatCompletion({
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 800,
                temperature: 0.2,
            });

            const raw = response.choices[0].message.content;
            let cleanJson = raw.trim()
                .replace(/^```json/, "").replace(/^```/, "")
                .replace(/```$/, "").trim();

            aiObj = JSON.parse(cleanJson);
            console.log("[DFE] AI advisory text received successfully.");
        } catch (aiError) {
            // AI failed — log and continue with fallback text
            console.warn("[DFE] AI advisory call failed (using fallback):", aiError.message);
        }

        // ── STEP 3: FORCE MERGE (backend math overwrites all AI numbers) ──
        const merged = forceMerge(aiObj, math, strategyType, fallbackText);
        console.log("[DFE] Force merge complete. AI text + backend math combined.");

        // ── STEP 4: SCHEMA VALIDATION on merged object ──
        const validation = validateGoalPlanningOutput(merged);
        if (!validation.valid) {
            console.error("[DFE] Schema validation failed:", validation.errors);
            throw new Error("Response failed schema validation: " + JSON.stringify(validation.errors));
        }

        // ── STEP 5: INTEGRITY CHECKS ──
        const integrityIssues = verifyIntegrity(merged);
        if (integrityIssues.length > 0) {
            // Log these but do NOT crash — we already overrode values from backend
            console.warn("[DFE] Integrity check issues logged:", integrityIssues);
        } else {
            console.log("[DFE] All integrity checks passed.");
        }

        return {
            success: true,
            message: "Goal plan generated successfully.",
            aiResponse: merged,
        };

    } catch (error) {
        console.error("[DFE] Critical error in goal planning service:", error);
        throw error;
    }
};

module.exports = goalPlanningService;