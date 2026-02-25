import React from 'react';

const GoalSelection = ({ value, onChange, onNext, onBack }) => {
    return (
        <div>
            <h2 className="headline">Select Your Goal</h2>
            <p className="subtext">What are you planning for?</p>

            <div className="options-grid" style={{ gridTemplateColumns: '1fr' }}>
                {[
                    { id: 'Retirement Planning', description: 'Plan your long-term wealth for retirement.' },
                    { id: 'Home Loan Planning', description: 'Analyze the feasibility of your new home purchase.' }
                ].map(goal => (
                    <div
                        key={goal.id}
                        className={`option-card ${value === goal.id ? 'selected' : ''}`}
                        onClick={() => onChange(goal.id)}
                        style={{ textAlign: 'left' }}
                    >
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>{goal.id}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>{goal.description}</div>
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

export default GoalSelection;
