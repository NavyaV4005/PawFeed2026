const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ExcelReporter {
    constructor() {
        this.workbook = new ExcelJS.Workbook();
        this.workbook.creator = 'Automation Framework';
        this.workbook.created = new Date();

        this.executedSheet = this.workbook.addWorksheet('Executed Test Cases');
        this.passedSheet = this.workbook.addWorksheet('Passed Tests');
        this.failedSheet = this.workbook.addWorksheet('Failed Tests');
        this.skippedSheet = this.workbook.addWorksheet('Skipped Tests');
        this.metricsSheet = this.workbook.addWorksheet('Execution Metrics');
        
        this.setupHeaders();
        this.testResults = [];
    }

    setupHeaders() {
        const columns = [
            { header: 'Test ID', key: 'id', width: 15 },
            { header: 'Module', key: 'module', width: 20 },
            { header: 'Test Name', key: 'name', width: 50 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Execution Time (ms)', key: 'duration', width: 20 },
            { header: 'Priority', key: 'priority', width: 15 },
            { header: 'Error', key: 'error', width: 50 }
        ];

        [this.executedSheet, this.passedSheet, this.failedSheet, this.skippedSheet].forEach(sheet => {
            sheet.columns = columns;
            sheet.getRow(1).font = { bold: true };
        });

        this.metricsSheet.columns = [
            { header: 'Metric', key: 'metric', width: 25 },
            { header: 'Value', key: 'value', width: 15 }
        ];
        this.metricsSheet.getRow(1).font = { bold: true };
    }

    addResult(result) {
        this.testResults.push(result);
        
        this.executedSheet.addRow(result);
        
        if (result.status === 'passed') {
            this.passedSheet.addRow(result);
        } else if (result.status === 'failed') {
            this.failedSheet.addRow(result);
        } else if (result.status === 'skipped') {
            this.skippedSheet.addRow(result);
        }
    }

    async generateReport() {
        const passed = this.testResults.filter(t => t.status === 'passed').length;
        const failed = this.testResults.filter(t => t.status === 'failed').length;
        const skipped = this.testResults.filter(t => t.status === 'skipped').length;
        const total = this.testResults.length;
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%';

        this.metricsSheet.addRows([
            { metric: 'Total Tests', value: total },
            { metric: 'Passed Tests', value: passed },
            { metric: 'Failed Tests', value: failed },
            { metric: 'Skipped Tests', value: skipped },
            { metric: 'Pass Rate', value: passRate }
        ]);

        const reportsDir = path.join(__dirname, '..', 'reports', 'Excel');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reportPath = path.join(reportsDir, 'Automation_Test_Report.xlsx');
        await this.workbook.xlsx.writeFile(reportPath);
        console.log(`Excel report generated at: ${reportPath}`);
    }
}

module.exports = new ExcelReporter();
