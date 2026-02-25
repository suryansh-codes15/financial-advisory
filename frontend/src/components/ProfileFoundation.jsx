import React from 'react';

const ProfileFoundation = ({ step, formData, updateData, onNext, onBack }) => {

    const renderContent = () => {
        switch (step) {
            case 1:
                return (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <h1 className="headline">Build Your Personalized Financial Plan</h1>
                        <p className="subtext" style={{ fontSize: '1.1rem' }}>Structured goal analysis based on your financial profile.</p>
                        <button className="btn btn-primary" onClick={onNext} style={{ marginTop: '1rem' }}>
                            Start Planning
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div>
                        <h2 className="headline">What is your current age?</h2>
                        <p className="subtext">This helps us calculate your time horizon.</p>

                        <div className="form-group">
                            <label className="form-label">Age</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 30"
                                value={formData.age}
                                onChange={(e) => updateData('age', e.target.value)}
                                autoFocus
                            />
                            {formData.age && (formData.age < 18 || formData.age > 80) && (
                                <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>Age must be between 18 and 80.</p>
                            )}
                        </div>

                        <div className="btn-group">
                            <button className="btn btn-secondary" onClick={onBack}>Back</button>
                            <button
                                className="btn btn-primary"
                                onClick={onNext}
                                disabled={!formData.age || formData.age < 18 || formData.age > 80}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div>
                        <h2 className="headline">Employment Type</h2>
                        <p className="subtext">Select your primary source of income.</p>

                        <div className="options-grid">
                            {['Salaried', 'Self-employed', 'Business'].map(type => (
                                <div
                                    key={type}
                                    className={`option-card ${formData.employmentType === type ? 'selected' : ''}`}
                                    onClick={() => updateData('employmentType', type)}
                                >
                                    {type}
                                </div>
                            ))}
                        </div>

                        <div className="btn-group">
                            <button className="btn btn-secondary" onClick={onBack}>Back</button>
                            <button
                                className="btn btn-primary"
                                onClick={onNext}
                                disabled={!formData.employmentType}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div>
                        <h2 className="headline">Income & Savings</h2>
                        <p className="subtext">Your monthly take-home pay and current liquid savings.</p>

                        <div className="form-group">
                            <label className="form-label">Monthly Income (₹)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 100000"
                                value={formData.monthlyIncome}
                                onChange={(e) => updateData('monthlyIncome', e.target.value)}
                                autoFocus
                            />
                            {formData.monthlyIncome && formData.monthlyIncome < 0 && (
                                <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>Income cannot be negative.</p>
                            )}
                        </div>

                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label className="form-label">Current Savings / Invested Wealth (₹)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 200000"
                                value={formData.currentSavings || ''}
                                onChange={(e) => updateData('currentSavings', e.target.value)}
                            />
                            {formData.currentSavings && formData.currentSavings < 0 && (
                                <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>Savings cannot be negative.</p>
                            )}
                        </div>

                        <div className="btn-group">
                            <button className="btn btn-secondary" onClick={onBack}>Back</button>
                            <button
                                className="btn btn-primary"
                                onClick={onNext}
                                disabled={
                                    !formData.monthlyIncome ||
                                    Number(formData.monthlyIncome) < 0 ||
                                    (formData.currentSavings && Number(formData.currentSavings) < 0)
                                }
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div>
                        <h2 className="headline">Expenses & Liabilities</h2>
                        <p className="subtext">Your fixed and variable expenses, along with buffer funds.</p>

                        <div className="form-group">
                            <label className="form-label">Monthly Expenses (₹)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 40000"
                                value={formData.monthlyExpenses}
                                onChange={(e) => updateData('monthlyExpenses', e.target.value)}
                                autoFocus
                            />
                            {formData.monthlyExpenses !== '' && Number(formData.monthlyExpenses) < 0 && (
                                <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>Expenses cannot be negative.</p>
                            )}
                        </div>

                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label className="form-label">Total Monthly EMI (₹)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 15000"
                                value={formData.emi || ''}
                                onChange={(e) => updateData('emi', e.target.value)}
                            />
                            {formData.emi !== '' && Number(formData.emi) < 0 && (
                                <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>EMI cannot be negative.</p>
                            )}
                        </div>

                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label className="form-label">Required Emergency Fund (₹)</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g. 120000"
                                value={formData.emergencyFundRequired || ''}
                                onChange={(e) => updateData('emergencyFundRequired', e.target.value)}
                            />
                            {formData.emergencyFundRequired !== '' && Number(formData.emergencyFundRequired) < 0 && (
                                <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>Emergency Fund cannot be negative.</p>
                            )}
                        </div>

                        {(Number(formData.monthlyIncome) > 0 && Number(formData.monthlyExpenses) >= 0) && (
                            <div style={{ marginTop: '1.5rem', padding: '1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Estimated Investable Surplus</p>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', paddingTop: '0.25rem' }}>
                                    ₹{Math.max(0, Number(formData.monthlyIncome) - Number(formData.monthlyExpenses) - (Number(formData.emi) || 0)).toLocaleString('en-IN')}
                                </p>
                                {(Number(formData.monthlyIncome) - Number(formData.monthlyExpenses) - (Number(formData.emi) || 0) <= 0) && (
                                    <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>You have no investable surplus left for goals.</p>
                                )}
                            </div>
                        )}

                        <div className="btn-group">
                            <button className="btn btn-secondary" onClick={onBack}>Back</button>
                            <button
                                className="btn btn-primary"
                                onClick={onNext}
                                disabled={
                                    formData.monthlyExpenses === '' ||
                                    Number(formData.monthlyExpenses) < 0 ||
                                    (formData.emi !== '' && Number(formData.emi) < 0) ||
                                    (formData.emergencyFundRequired !== '' && Number(formData.emergencyFundRequired) < 0) ||
                                    (Number(formData.monthlyIncome) - Number(formData.monthlyExpenses) - (Number(formData.emi) || 0) <= 0)
                                }
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div>
            {renderContent()}
        </div>
    );
};

export default ProfileFoundation;
