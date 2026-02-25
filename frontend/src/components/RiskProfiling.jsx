import React from 'react';

const RiskProfiling = ({ value, onChange, onNext, onBack }) => {
    return (
        <div>
            <h2 className="headline">Market Reaction</h2>
            <p className="subtext">If your investment portfolio drops 20% in value over a short period, what would you do?</p>

            <div className="options-grid" style={{ gridTemplateColumns: '1fr' }}>
                {[
                    { label: 'Withdraw all funds immediately', value: 'Withdraw' },
                    { label: 'Wait and watch the market', value: 'Wait' },
                    { label: 'Invest more at lower prices', value: 'Invest More' }
                ].map(opt => (
                    <div
                        key={opt.value}
                        className={`option-card ${value === opt.value ? 'selected' : ''}`}
                        onClick={() => onChange(opt.value)}
                        style={{ textAlign: 'left' }}
                    >
                        {opt.label}
                    </div>
                ))}
            </div>

            <div className="btn-group">
                <button className="btn btn-secondary" onClick={onBack}>Back</button>
                <button
                    className="btn btn-primary"
                    onClick={onNext}
                    disabled={!value}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default RiskProfiling;
