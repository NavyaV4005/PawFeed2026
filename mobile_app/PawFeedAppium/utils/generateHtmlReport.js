const fs = require('fs-extra');

async function generateHtmlReport(results, outputPath) {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>PawFeed Mega E2E Report</title>
        <style>
            body { font-family: sans-serif; background-color: #121212; color: #fff; padding: 20px; }
            h1 { color: #00e676; }
            .summary { background: #1e1e1e; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #333; padding: 10px; text-align: left; }
            th { background-color: #333; }
            .pass { color: #00e676; }
            .fail { color: #ff1744; }
        </style>
    </head>
    <body>
        <h1>PawFeed Mega E2E Appium Report</h1>
        <div class="summary">
            <p>Total Tests: ${totalTests}</p>
            <p class="pass">Passed: ${passedTests}</p>
            <p class="fail">Failed: ${failedTests}</p>
            <p>Pass Rate: ${passRate}%</p>
        </div>
        <table>
            <tr><th>Category</th><th>Test</th><th>Status</th><th>Duration (ms)</th></tr>
            ${results.map(r => `
                <tr>
                    <td>${r.parent}</td>
                    <td>${r.title}</td>
                    <td class="${r.passed ? 'pass' : 'fail'}">${r.passed ? 'PASS' : 'FAIL'}</td>
                    <td>${r.duration}</td>
                </tr>
            `).join('')}
        </table>
    </body>
    </html>
    `;
    
    await fs.writeFile(outputPath, html);
}

module.exports = { generateHtmlReport };
