import React from 'react';

// Risk profile auto-suggestions for investment assumptions
const RISK_PRESETS = {
    conservative: { equityPct: '30', debtPct: '70', equityReturnRate: '8', debtReturnRate: '5' },
    moderate: { equityPct: '60', debtPct: '40', equityReturnRate: '12', debtReturnRate: '7' },
    aggressive: { equityPct: '80', debtPct: '20', equityReturnRate: '15', debtReturnRate: '9' },
};

const getRiskKey = (riskString) => {
    switch (riskString) {
        case 'Invest More': return 'aggressive';
        case 'Withdraw': return 'conservative';
        default: return 'moderate';
    }
};

const GoalFlows = ({
    step, goalType, goalData, updateData,
    investmentAssumptions, updateAssumption, riskProfile,
    onNext, onBack, setLoading, setApiResult, fullFormData
}) => {
    const ia = investmentAssumptions || {};
    const riskKey = getRiskKey(riskProfile);

    const equityPct = Number(ia.equityPct) || 60;
    const debtPct = Number(ia.debtPct) || 40;
    const allocationValid = equityPct + debtPct === 100;

    // ── Auto-fill from risk profile ────────────────────────
    const applyRiskPreset = () => {
        const preset = RISK_PRESETS[riskKey];
        if (!preset) return;
        Object.entries(preset).forEach(([k, v]) => updateAssumption(k, v));
    };

    // ── Submit to API ──────────────────────────────────────
    const submitToAPI = async () => {
        setLoading(true);
        try {
            let goalPayload = {};
            if (goalType === 'Retirement Planning') {
                goalPayload = {
                    type: "Retirement",
                    currentAge: Number(fullFormData.profile.age) || 30,
                    retirementAge: Number(goalData.retirementAge) || 60,
                    lifeExpectancy: Number(goalData.lifeExpectancy) || 85,
                    targetMonthlyAmount: Number(goalData.targetExpense) || 50000,
                };
            } else {
                goalPayload = {
                    type: "other",
                    timeHorizonYears: Number(goalData.loanTenure) || 5,
                    targetAmount: Math.max(
                        (Number(goalData.propertyValue) || 0) - (Number(goalData.downPayment) || 0),
                        100000
                    ),
                };
            }

            const payload = {
                goal: goalPayload,
                finance: {
                    monthlyIncome: Number(fullFormData.profile.monthlyIncome) || 0,
                    monthlyExpenses: Number(fullFormData.profile.monthlyExpenses) || 0,
                    emi: Number(fullFormData.profile.emi) || 0,
                    currentSavings: Number(fullFormData.profile.currentSavings) || 0,
                    emergencyFundRequired: Number(fullFormData.profile.emergencyFundRequired) || 0,
                    investmentMode: 'sip',
                    // User-provided investment assumptions
                    inflationRate: Number(ia.inflationRate) / 100,
                    equityPct: Number(ia.equityPct) / 100,
                    debtPct: Number(ia.debtPct) / 100,
                    equityReturnRate: Number(ia.equityReturnRate) / 100,
                    debtReturnRate: Number(ia.debtReturnRate) / 100,
                },
            };

            const res = await fetch('http://localhost:3000/api/goal-planning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const responseData = await res.json();
            if (responseData.success) {
                const aiData = responseData.data?.aiResponse || responseData.aiResponse;
                setApiResult(aiData);
            } else {
                setApiResult({
                    error: true,
                    message: responseData.message || "Unknown API Error",
                    details: responseData.errors || [],
                });
            }
        } catch (err) {
            setApiResult({ error: true, message: "Network request failed. Is the backend running?" });
        } finally {
            setLoading(false);
        }
    };

    // ── SHARED: Investment Assumptions Step ─────────────────
    // This step is shown as the LAST step before "Generate Plan"
    // for both goal types.
    const renderInvestmentAssumptionsStep = () => (
        <div>
            <h2 className="headline">Investment Assumptions</h2>
            <p className="subtext">
                Review and adjust returns, inflation, and allocation.
                Auto-filled from your <strong>{riskKey}</strong> risk profile.
            </p>

            <button
                type="button"
                onClick={applyRiskPreset}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    marginBottom: '1.5rem', padding: '0.45rem 1rem',
                    background: 'rgba(99, 102, 241, 0.12)', color: '#a78bfa',
                    border: '1px solid rgba(167, 139, 250, 0.3)',
                    borderRadius: '999px', fontSize: '0.85rem', cursor: 'pointer',
                }}
            >
                ⚡ Auto-fill from Risk Profile
            </button>

            {/* Inflation Rate */}
            <div className="form-group">
                <label className="form-label">Inflation Rate (%)</label>
                <input
                    type="number" className="form-input" placeholder="e.g. 6"
                    min="0" max="10" step="0.5"
                    value={ia.inflationRate ?? '6'}
                    onChange={(e) => updateAssumption('inflationRate', e.target.value)}
                />
                {Number(ia.inflationRate) < 0 || Number(ia.inflationRate) > 10
                    ? <p style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '0.3rem' }}>Must be between 0–10%</p>
                    : null}
            </div>

            {/* Equity / Debt Allocation */}
            <div className="allocation-grid" style={{ marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Equity Allocation (%)</label>
                    <input
                        type="number" className="form-input" placeholder="e.g. 60"
                        min="0" max="100"
                        value={ia.equityPct ?? '60'}
                        onChange={(e) => {
                            const v = Number(e.target.value);
                            updateAssumption('equityPct', e.target.value);
                            updateAssumption('debtPct', String(100 - v));
                        }}
                    />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Debt Allocation (%)</label>
                    <input
                        type="number" className="form-input" placeholder="e.g. 40"
                        min="0" max="100"
                        value={ia.debtPct ?? '40'}
                        onChange={(e) => {
                            const v = Number(e.target.value);
                            updateAssumption('debtPct', e.target.value);
                            updateAssumption('equityPct', String(100 - v));
                        }}
                    />
                </div>
            </div>
            {!allocationValid && (
                <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    ⚠ Equity + Debt must equal 100%. Currently: {equityPct + debtPct}%
                </p>
            )}
            {allocationValid && (
                <p style={{ color: 'var(--success-color)', fontSize: '0.82rem', marginBottom: '1rem', opacity: 0.9 }}>
                    ✓ Allocation: {equityPct}% Equity + {debtPct}% Debt = 100%
                </p>
            )}

            {/* Equity / Debt Return Rates */}
            <div className="allocation-grid">
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Equity Return Rate (%)</label>
                    <input
                        type="number" className="form-input" placeholder="e.g. 12"
                        min="0" max="20" step="0.5"
                        value={ia.equityReturnRate ?? '12'}
                        onChange={(e) => updateAssumption('equityReturnRate', e.target.value)}
                    />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Debt Return Rate (%)</label>
                    <input
                        type="number" className="form-input" placeholder="e.g. 7"
                        min="0" max="20" step="0.5"
                        value={ia.debtReturnRate ?? '7'}
                        onChange={(e) => updateAssumption('debtReturnRate', e.target.value)}
                    />
                </div>
            </div>

            <div className="btn-group">
                <button className="btn btn-secondary" onClick={onBack}>Back</button>
                <button
                    className="btn btn-primary"
                    onClick={submitToAPI}
                    disabled={
                        !allocationValid ||
                        Number(ia.inflationRate) < 0 || Number(ia.inflationRate) > 10 ||
                        Number(ia.equityReturnRate) < 0 || Number(ia.equityReturnRate) > 20 ||
                        Number(ia.debtReturnRate) < 0 || Number(ia.debtReturnRate) > 20
                    }
                >
                    Generate Plan
                </button>
            </div>
        </div>
    );

    // ── RETIREMENT PLANNING FLOW (Steps 8, 9, 10, 11) ──────
    if (goalType === 'Retirement Planning') {
        switch (step) {
            case 8:
                return (
                    <div>
                        <h2 className="headline">Retirement Age</h2>
                        <p className="subtext">At what age do you plan to retire?</p>
                        <div className="form-group">
                            <input
                                type="number" className="form-input" placeholder="e.g. 60"
                                value={goalData.retirementAge || ''}
                                onChange={(e) => updateData('retirementAge', e.target.value)} autoFocus
                            />
                            {goalData.retirementAge !== undefined && goalData.retirementAge !== '' && Number(goalData.retirementAge) <= Number(fullFormData.profile.age) && (
                                <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>
                                    Retirement age must be greater than your current age ({fullFormData.profile.age}).
                                </p>
                            )}
                        </div>
                        <div className="btn-group">
                            <button className="btn btn-secondary" onClick={onBack}>Back</button>
                            <button
                                className="btn btn-primary" onClick={onNext}
                                disabled={!goalData.retirementAge || Number(goalData.retirementAge) <= Number(fullFormData.profile.age)}
                            >Continue</button>
                        </div>
                    </div>
                );
            case 9:
                return (
                    <div>
                        <h2 className="headline">Life Expectancy</h2>
                        <p className="subtext">To calculate your corpus duration.</p>
                        <div className="form-group">
                            <input
                                type="number" className="form-input" placeholder="e.g. 85"
                                value={goalData.lifeExpectancy || ''}
                                onChange={(e) => updateData('lifeExpectancy', e.target.value)} autoFocus
                            />
                            {goalData.lifeExpectancy !== undefined && goalData.lifeExpectancy !== '' && Number(goalData.lifeExpectancy) <= Number(goalData.retirementAge) && (
                                <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>
                                    Life expectancy must be greater than your retirement age ({goalData.retirementAge}).
                                </p>
                            )}
                        </div>
                        <div className="btn-group">
                            <button className="btn btn-secondary" onClick={onBack}>Back</button>
                            <button
                                className="btn btn-primary" onClick={onNext}
                                disabled={!goalData.lifeExpectancy || Number(goalData.lifeExpectancy) <= Number(goalData.retirementAge)}
                            >Continue</button>
                        </div>
                    </div>
                );
            case 10:
                return (
                    <div>
                        <h2 className="headline">Target Monthly Expense</h2>
                        <p className="subtext">Expected monthly expense in today's value after retirement.</p>
                        <div className="form-group">
                            <label className="form-label">Amount (₹)</label>
                            <input
                                type="number" className="form-input" placeholder="e.g. 50000"
                                value={goalData.targetExpense || ''}
                                onChange={(e) => updateData('targetExpense', e.target.value)} autoFocus
                            />
                            {goalData.targetExpense !== undefined && goalData.targetExpense !== '' && Number(goalData.targetExpense) <= 0 && (
                                <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>Amount must be greater than zero.</p>
                            )}
                        </div>
                        <div className="btn-group">
                            <button className="btn btn-secondary" onClick={onBack}>Back</button>
                            <button
                                className="btn btn-primary" onClick={onNext}
                                disabled={!goalData.targetExpense || Number(goalData.targetExpense) <= 0}
                            >Continue</button>
                        </div>
                    </div>
                );
            case 11:
                return renderInvestmentAssumptionsStep();
            default: return null;
        }
    }

    // ── HOME LOAN / OTHER GOAL FLOW (Steps 8, 9, 10, 11, 12) ──
    if (goalType === 'Home Loan Planning') {
        switch (step) {
            case 8:
                return (
                    <div>
                        <h2 className="headline">Property Value</h2>
                        <p className="subtext">What is the total cost of the property (₹)?</p>
                        <div className="form-group">
                            <label className="form-label">Amount (₹)</label>
                            <input
                                type="number" className="form-input" placeholder="e.g. 10000000"
                                value={goalData.propertyValue || ''}
                                onChange={(e) => updateData('propertyValue', e.target.value)} autoFocus
                            />
                        </div>
                        <div className="btn-group">
                            <button className="btn btn-secondary" onClick={onBack}>Back</button>
                            <button className="btn btn-primary" onClick={onNext} disabled={!goalData.propertyValue || Number(goalData.propertyValue) <= 0}>Continue</button>
                        </div>
                    </div>
                );
            case 9:
                return (
                    <div>
                        <h2 className="headline">Down Payment</h2>
                        <p className="subtext">Amount you will pay upfront.</p>
                        <div className="form-group">
                            <label className="form-label">Amount (₹)</label>
                            <input
                                type="number" className="form-input" placeholder="e.g. 2000000"
                                value={goalData.downPayment || ''}
                                onChange={(e) => updateData('downPayment', e.target.value)} autoFocus
                            />
                        </div>
                        <div className="btn-group">
                            <button className="btn btn-secondary" onClick={onBack}>Back</button>
                            <button className="btn btn-primary" onClick={onNext} disabled={!goalData.downPayment}>Continue</button>
                        </div>
                    </div>
                );
            case 10:
                return (
                    <div>
                        <h2 className="headline">Loan Tenure</h2>
                        <p className="subtext">Duration of the loan in years.</p>
                        <div className="form-group">
                            <input
                                type="number" className="form-input" placeholder="e.g. 20"
                                value={goalData.loanTenure || ''}
                                onChange={(e) => updateData('loanTenure', e.target.value)} autoFocus
                            />
                        </div>
                        <div className="btn-group">
                            <button className="btn btn-secondary" onClick={onBack}>Back</button>
                            <button className="btn btn-primary" onClick={onNext} disabled={!goalData.loanTenure || Number(goalData.loanTenure) <= 0}>Continue</button>
                        </div>
                    </div>
                );
            case 11:
                return renderInvestmentAssumptionsStep();
            default: return null;
        }
    }

    return null;
};

export default GoalFlows;
