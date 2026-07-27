const ExcelJS = require('exceljs');

async function generateReport(results, outputPath) {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    summarySheet.addRows([
        ['Metric', 'Value'],
        ['Total Tests', totalTests],
        ['Passed', passedTests],
        ['Failed', failedTests],
        ['Pass Rate', `${passRate.toFixed(2)}%`]
    ]);
    
    // Sheet 2: By Category
    const categorySheet = workbook.addWorksheet('By Category');
    categorySheet.addRow(['Category', 'Total', 'Passed', 'Failed']);
    
    const categoryMap = {};
    results.forEach(r => {
        if (!categoryMap[r.parent]) {
            categoryMap[r.parent] = { total: 0, passed: 0, failed: 0 };
        }
        categoryMap[r.parent].total++;
        if (r.passed) categoryMap[r.parent].passed++;
        else categoryMap[r.parent].failed++;
    });
    
    for (const [category, stats] of Object.entries(categoryMap)) {
        categorySheet.addRow([category, stats.total, stats.passed, stats.failed]);
    }
    
    // Sheet 3: Test Cases
    const testCasesSheet = workbook.addWorksheet('Test Cases');
    testCasesSheet.addRow(['Category', 'Test Name', 'Status', 'Duration (ms)', 'Error']);
    
    results.forEach(r => {
        testCasesSheet.addRow([
            r.parent,
            r.title,
            r.passed ? 'PASS' : 'FAIL',
            r.duration,
            r.error || ''
        ]);
    });
    
    await workbook.xlsx.writeFile(outputPath);
}

module.exports = { generateReport };
