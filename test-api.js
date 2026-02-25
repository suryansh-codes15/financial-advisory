const http = require('http');

const testCases = [
    {
        name: "Valid Retirement Goal",
        payload: {
            goal: { type: "Retirement", currentAge: 30, retirementAge: 60, lifeExpectancy: 85, targetMonthlyAmount: 50000 },
            finance: { monthlyIncome: 100000, monthlyExpenses: 40000, emi: 0, currentSavings: 200000, emergencyFundRequired: 120000, investmentMode: "sip" }
        },
        expectedStatus: 200
    },
    {
        name: "Invalid Retirement Goal (missing currentAge)",
        payload: {
            goal: { type: "Retirement", retirementAge: 60, lifeExpectancy: 85, targetMonthlyAmount: 50000 },
            finance: { monthlyIncome: 100000, monthlyExpenses: 40000, emi: 0, currentSavings: 200000, emergencyFundRequired: 120000, investmentMode: "sip" }
        },
        expectedStatus: 400
    },
    {
        name: "Valid Other Goal",
        payload: {
            goal: { type: "other", timeHorizonYears: 5, targetAmount: 100000 },
            finance: { monthlyIncome: 100000, monthlyExpenses: 40000, emi: 0, currentSavings: 200000, emergencyFundRequired: 120000, investmentMode: "sip" }
        },
        expectedStatus: 200
    },
    {
        name: "Invalid Finance Data (negative income)",
        payload: {
            goal: { type: "other", timeHorizonYears: 5, targetAmount: 100000 },
            finance: { monthlyIncome: -100, monthlyExpenses: 40000, emi: 0, currentSavings: 200000, emergencyFundRequired: 120000, investmentMode: "sip" }
        },
        expectedStatus: 400
    }
];

const runTest = (testCase) => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const req = http.request('http://localhost:3000/api/goal-planning', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                const duration = Date.now() - startTime;
                const passed = res.statusCode === testCase.expectedStatus;
                console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testCase.name} - Expected: ${testCase.expectedStatus}, Got: ${res.statusCode} (${duration}ms)`);
                if (!passed) console.log(`Response: ${data}`);
                resolve(passed);
            });
        });
        req.on('error', (e) => {
            console.error(`[ERROR] ${testCase.name} - ${e.message}`);
            resolve(false);
        });
        req.write(JSON.stringify(testCase.payload));
        req.end();
    });
};

const runAll = async () => {
    let allPassed = true;
    for (const testCase of testCases) {
        const passed = await runTest(testCase);
        if (!passed) allPassed = false;
    }
    console.log(`\nOverall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
};

runAll();
