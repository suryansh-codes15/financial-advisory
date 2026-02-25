import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ProfileFoundation from './components/ProfileFoundation';
import RiskProfiling from './components/RiskProfiling';
import GoalSelection from './components/GoalSelection';
import GoalFlows from './components/GoalFlows';
import ResultScreen from './components/ResultScreen';
import './App.css';

const STEPS = {
  PROFILE: [1, 2, 3, 4, 5],
  RISK: [6],
  GOAL_SELECTION: [7],
  GOAL_FLOWS: [8, 9, 10, 11], // dynamically assigned; always ends with Investment Assumptions
  RESULT: [99]
};

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(12); // changes based on goal

  const [formData, setFormData] = useState({
    profile: {
      age: '',
      employmentType: '',
      monthlyIncome: '',
      monthlyExpenses: '',
      emi: '',
      currentSavings: '',
      emergencyFundRequired: ''
    },
    riskProfile: '',
    goalType: '',
    goalData: {},
    investmentAssumptions: {
      inflationRate: '6',
      equityPct: '60',
      debtPct: '40',
      equityReturnRate: '12',
      debtReturnRate: '7',
    }
  });

  const [apiResult, setApiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleNext = () => setCurrentStep(prev => prev + 1);
  const handleBack = () => setCurrentStep(prev => prev - 1);

  const updateFormData = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateRootData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateSurplus = () => {
    const inc = Number(formData.profile.monthlyIncome) || 0;
    const exp = Number(formData.profile.monthlyExpenses) || 0;
    const emi = Number(formData.profile.emi) || 0;
    return Math.max(0, inc - exp - emi);
  };

  // Render correct component based on step
  const renderStep = () => {
    if (STEPS.PROFILE.includes(currentStep)) {
      return (
        <ProfileFoundation
          step={currentStep}
          formData={formData.profile}
          updateData={(field, val) => updateFormData('profile', field, val)}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    }

    if (STEPS.RISK.includes(currentStep)) {
      return (
        <RiskProfiling
          value={formData.riskProfile}
          onChange={(val) => updateRootData('riskProfile', val)}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    }

    if (STEPS.GOAL_SELECTION.includes(currentStep)) {
      return (
        <GoalSelection
          value={formData.goalType}
          onChange={(val) => {
            updateRootData('goalType', val);
            // set total steps based on goal
            setTotalSteps(11); // Both paths now have 11 total steps (7 profile/risk/goal + 4 goal-flow steps incl. Investment Assumptions)
          }}
          onNext={handleNext}
          onBack={handleBack}
        />
      );
    }

    if (STEPS.GOAL_FLOWS.includes(currentStep)) {
      return (
        <GoalFlows
          step={currentStep}
          goalType={formData.goalType}
          goalData={formData.goalData}
          updateData={(field, val) => updateFormData('goalData', field, val)}
          investmentAssumptions={formData.investmentAssumptions}
          updateAssumption={(field, val) => updateFormData('investmentAssumptions', field, val)}
          riskProfile={formData.riskProfile}
          onNext={handleNext}
          onBack={handleBack}
          setLoading={setLoading}
          setApiResult={(res) => {
            setApiResult(res);
            setCurrentStep(99);
          }}
          fullFormData={{ ...formData, surplus: calculateSurplus() }}
        />
      );
    }

    if (currentStep === 99) {
      return (
        <ResultScreen
          apiResult={apiResult}
          onRestart={() => {
            setCurrentStep(1);
            setApiResult(null);
            setFormData({ ...formData, goalType: '', goalData: {} });
          }}
        />
      );
    }

    return null;
  };

  // Transition variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 },
  };

  const isCalculating = loading;

  return (
    <div className="app-container">
      {/* Fixed Navbar */}
      <header className="navbar">
        <div className="brand-logo">Aarixa Innovix</div>
        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Financial Advisory</div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="dynamic-card">

          {/* Progress Bar (hide on loading and result) */}
          {currentStep < 99 && !isCalculating && (
            <div className="progress-container">
              <span className="progress-text">Step {currentStep} of {totalSteps}</span>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {isCalculating ? (
            <div className="step-container" style={{ textAlign: 'center', padding: '3rem 0' }}>
              <h2 className="headline">Analyzing Your Profile</h2>
              <p className="subtext">Our AI engine is processing your financial data to generate a strategy...</p>
              <div className="spinner"></div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={{ duration: 0.3 }}
                className="step-container"
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
