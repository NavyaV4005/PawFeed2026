const path = require('path');
const { generateReport } = require('./xlsxReporter');
const { generateHtmlReport } = require('./generateHtmlReport');
const fs = require('fs-extra');

async function generateFallbackReport() {
    const fallbackData = [{
        title: 'Fatal Appium/WDIO Setup Crash',
        parent: 'System Execution',
        passed: false,
        duration: 10,
        error: 'The test runner crashed before specs could complete.'
    }];
    const excelOutputPath = path.join(__dirname, '..', 'reports', 'test-results.xlsx');
    const htmlOutputPath = path.join(__dirname, '..', 'reports', 'execution-report.html');
    
    fs.ensureDirSync(path.join(__dirname, '..', 'reports'));
    await generateReport(fallbackData, excelOutputPath);
    await generateHtmlReport(fallbackData, htmlOutputPath);
}

module.exports = { generateFallbackReport };

if (require.main === module) {
    generateFallbackReport().catch(console.error);
}
