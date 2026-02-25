import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, ShieldCheck, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';

const parseNum = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
};

const fmt = (v) => parseNum(v).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const Row = ({ label, value, valueColor, bold }) => (
    <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{
            fontSize: bold ? '1.05rem' : '0.95rem',
            fontWeight: bold ? 700 : 500,
            color: valueColor || 'var(--text-main)',
        }}>{value}</span>
    </div>
);

const SectionCard = ({ title, icon, children, accentColor }) => (
    <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: `1px solid ${accentColor || 'rgba(255,255,255,0.08)'}`,
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1rem',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ color: accentColor || 'var(--text-muted)' }}>{icon}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: accentColor || 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        </div>
        {children}
    </motion.div>
);

// Simple pure-CSS allocation bar (replaces chart library dependency)
const AllocationBar = ({ equityPct, debtPct }) => (
    <div style={{ marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', height: '28px' }}>
            <div style={{ width: `${equityPct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{equityPct}%</span>
            </div>
            <div style={{ width: `${debtPct}%`, background: 'linear-gradient(90deg,#06b6d4,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{debtPct}%</span>
            </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6', display: 'inline-block' }} />
                Equity
            </span>
            <span style={{ fontSize: '0.78rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9', display: 'inline-block' }} />
                Debt
            </span>
        </div>
    </div>
);

const ResultScreen = ({ apiResult, onRestart }) => {
    if (!apiResult) return null;

    if (apiResult.error) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <AlertCircle size={48} color="var(--danger-color)" style={{ marginBottom: '1rem' }} />
                <h2 style={{ color: 'var(--text-main)' }}>Analysis Failed</h2>
                <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.5rem' }}>{apiResult.message}</p>
                <button className="btn btn-primary" onClick={onRestart}>Try Again</button>
            </div>
        );
    }

    const { goal, strategy, allocation, feasibility } = apiResult;
    const isAchievable = goal?.status === "Achievable";

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* ── HEADER: Strategic Plan Title ── */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.6rem', margin: 0, color: 'var(--text-main)' }}>Strategic Plan</h2>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {goal?.name} — {goal?.horizonYears} Year Horizon
                </p>
            </div>

            {/* ── STATUS BADGE ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.4rem 1rem', borderRadius: '999px', marginBottom: '1.5rem',
                    background: isAchievable ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                    border: `1px solid ${isAchievable ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: isAchievable ? '#4ade80' : '#f87171',
                    fontSize: '0.85rem', fontWeight: 600,
                }}
            >
                {isAchievable
                    ? <><CheckCircle size={14} /> ACHIEVABLE</>
                    : <><AlertCircle size={14} /> ACTION REQUIRED</>
                }
            </motion.div>

            {/* ── SECTION 1: SIP HERO CARD ── */}
            <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
                style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Monthly SIP Required</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                            <span style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>₹</span>
                            <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                {fmt(strategy?.totalSip)}
                            </span>
                        </div>
                        {!isAchievable && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                ↗ Gap Amount: ₹{fmt(feasibility?.shortfall)}
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Your Monthly Capacity</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: isAchievable ? 'var(--success-color)' : 'var(--danger-color)' }}>
                            ₹{fmt(feasibility?.monthlySurplus)}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── SECTION 2: GOAL SUMMARY ── */}
            <SectionCard title="Goal Summary" icon={<Info size={14} />} accentColor="rgba(148,163,184,0.6)">
                <Row label="Goal Type" value={goal?.type === 'retirement' ? 'Retirement Planning' : 'Investment Goal'} />
                <Row label="Time Horizon" value={`${goal?.horizonYears} Years`} />
                <Row label="Inflation Rate" value={`${allocation?.inflationRate ?? 6}%`} />
                <Row label="Investment Mode" value={(strategy?.type || 'SIP').toUpperCase()} />
            </SectionCard>

            {/* ── SECTION 3: FINANCIAL BREAKDOWN ── */}
            <SectionCard title="Financial Breakdown" icon={<TrendingUp size={14} />} accentColor="rgba(99,102,241,0.5)">
                <Row label="Future Goal Amount (FV)"
                    value={`₹${fmt(allocation?.totalGoalAmountFuture)}`} bold />
                <Row label="Equity Goal Amount"
                    value={`₹${fmt(allocation?.equityGoalAmount)}`} valueColor="#a78bfa" />
                <Row label="Debt Goal Amount"
                    value={`₹${fmt(allocation?.debtGoalAmount)}`} valueColor="#38bdf8" />
                <Row label="Equity SIP"
                    value={`₹${fmt(strategy?.equitySip)}/mo`} valueColor="#a78bfa" />
                <Row label="Debt SIP"
                    value={`₹${fmt(strategy?.debtSip)}/mo`} valueColor="#38bdf8" />
                <Row label="Total SIP"
                    value={`₹${fmt(strategy?.totalSip)}/mo`} bold />
                <Row label="Total Investment"
                    value={`₹${fmt(strategy?.totalInvestment)}`} />
                <Row label="Expected Gain"
                    value={`+₹${fmt(strategy?.expectedGain)}`} valueColor="var(--success-color)" bold />
                <Row label="Monthly Surplus"
                    value={`₹${fmt(feasibility?.monthlySurplus)}`} />
                {!isAchievable && (
                    <Row label="Shortfall"
                        value={`₹${fmt(feasibility?.shortfall)}`} valueColor="var(--danger-color)" bold />
                )}
            </SectionCard>

            {/* ── SECTION 4: ASSET ALLOCATION ── */}
            <SectionCard title="Asset Allocation" icon={<PieChart size={14} />} accentColor="rgba(139,92,246,0.5)">
                <AllocationBar equityPct={allocation?.equityPercentage || 60} debtPct={allocation?.debtPercentage || 40} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(139,92,246,0.08)', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                        <div style={{ fontSize: '0.78rem', color: '#a78bfa', marginBottom: '0.2rem' }}>Equity</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#a78bfa' }}>{allocation?.equityPercentage || 60}%</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Return: {allocation?.equityReturnRate ?? 12}% p.a.</div>
                    </div>
                    <div style={{ padding: '0.75rem', background: 'rgba(14,165,233,0.08)', borderRadius: '8px', borderLeft: '3px solid #0ea5e9' }}>
                        <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginBottom: '0.2rem' }}>Debt</div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8' }}>{allocation?.debtPercentage || 40}%</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Return: {allocation?.debtReturnRate ?? 7}% p.a.</div>
                    </div>
                </div>
            </SectionCard>

            {/* ── SECTION 5: NOT ACHIEVABLE — RECOMMENDATIONS ── */}
            {!isAchievable && (
                <SectionCard title="Recommended Adjustments" icon={<AlertCircle size={14} />} accentColor="rgba(239,68,68,0.4)">
                    {[
                        ['Increase Monthly Investment', 'Boost your monthly SIP to close the shortfall gap.'],
                        ['Extend Time Horizon', 'More years means more compounding power.'],
                        ['Reduce Target Amount', 'Adjust expectations to match your current surplus.'],
                    ].map(([title, desc]) => (
                        <div key={title} style={{ padding: '0.75rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: '3px solid rgba(239,68,68,0.4)' }}>
                            <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{title}</strong>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{desc}</span>
                        </div>
                    ))}
                </SectionCard>
            )}

            {/* ── SECTION 6: AI ADVISORY TEXT ── */}
            {goal?.suggest && (
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        borderLeft: '3px solid rgba(99,102,241,0.6)',
                        padding: '1rem 1.25rem',
                        background: 'rgba(99,102,241,0.05)',
                        borderRadius: '0 8px 8px 0',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.6,
                    }}
                >
                    {goal.suggest}
                </motion.div>
            )}

            {/* ── CTA BUTTONS ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="btn-group"
                style={{ flexDirection: 'column', gap: '0.75rem' }}
            >
                <button className="btn btn-primary" style={{ padding: '1rem', fontSize: '1rem' }}>
                    Download Detailed Plan
                </button>
                <button className="btn btn-secondary" style={{ padding: '1rem', fontSize: '1rem' }}>
                    Schedule Consultation
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={onRestart}
                    style={{ border: 'none', textDecoration: 'underline', color: 'var(--text-muted)', backgroundColor: 'transparent', padding: '0.5rem', fontSize: '0.9rem' }}
                >
                    Recalculate Goal
                </button>
            </motion.div>
        </motion.div>
    );
};

export default ResultScreen;
