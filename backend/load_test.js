import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:5000/api/health';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '100', 10);
const DURATION_MS = parseInt(process.env.DURATION || '60000', 10);

console.log(`=========================================`);
console.log(`Starting Load Test`);
console.log(`Target URL:   ${TARGET_URL}`);
console.log(`Concurrency:  ${CONCURRENCY} virtual users`);
console.log(`Duration:     ${DURATION_MS / 1000} seconds`);
console.log(`=========================================`);

let shouldStop = false;
const results = [];
let activeConnections = 0;

// Track request progress per second
let lastReportTime = Date.now();
let lastRequestCount = 0;

async function runWorker(workerId) {
  activeConnections++;
  while (!shouldStop) {
    const start = performance.now();
    try {
      const res = await fetch(TARGET_URL);
      const end = performance.now();
      const duration = end - start;
      
      results.push({
        workerId,
        status: res.status,
        duration,
        timestamp: Date.now()
      });
    } catch (err) {
      const end = performance.now();
      const duration = end - start;
      results.push({
        workerId,
        status: 'ERROR',
        error: err.message,
        duration,
        timestamp: Date.now()
      });
    }
  }
  activeConnections--;
}

const startTime = Date.now();

// Start reporting interval
const reportInterval = setInterval(() => {
  const now = Date.now();
  const elapsedSec = (now - startTime) / 1000;
  const currentTotal = results.length;
  const reqsInWindow = currentTotal - lastRequestCount;
  const windowSec = (now - lastReportTime) / 1000;
  const currentRps = reqsInWindow / windowSec;
  
  console.log(`[${elapsedSec.toFixed(1)}s] Active Users: ${activeConnections} | Total Requests: ${currentTotal} | Current RPS: ${currentRps.toFixed(2)}`);
  
  lastReportTime = now;
  lastRequestCount = currentTotal;
}, 1000);

// Start workers
const workers = [];
for (let i = 0; i < CONCURRENCY; i++) {
  workers.push(runWorker(i));
}

// Stop after duration
setTimeout(() => {
  shouldStop = true;
  clearInterval(reportInterval);
  console.log(`\nStopping load test... Waiting for active requests to finish.`);
  
  // Wait for all workers to finish and compile results
  Promise.all(workers).then(() => {
    const totalTimeMs = Date.now() - startTime;
    compileResults(totalTimeMs);
  });
}, DURATION_MS);

function compileResults(totalTimeMs) {
  const totalRequests = results.length;
  if (totalRequests === 0) {
    console.error("No requests were completed.");
    process.exit(1);
  }

  let successCount = 0;
  let errorCount = 0;
  const durations = [];
  const statusCodes = {};

  for (const r of results) {
    if (typeof r.status === 'number') {
      statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;
      if (r.status >= 200 && r.status < 300) {
        successCount++;
      } else {
        errorCount++;
      }
    } else {
      statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;
      errorCount++;
    }
    durations.push(r.duration);
  }

  // Sort durations to compute percentiles
  durations.sort((a, b) => a - b);

  const min = durations[0];
  const max = durations[durations.length - 1];
  const sum = durations.reduce((a, b) => a + b, 0);
  const avg = sum / totalRequests;
  
  const p50 = durations[Math.floor(durations.length * 0.50)];
  const p90 = durations[Math.floor(durations.length * 0.90)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];

  const overallRps = (totalRequests / (totalTimeMs / 1000)).toFixed(2);

  console.log(`\n================ RESULTS ================`);
  console.log(`Total Duration:      ${(totalTimeMs / 1000).toFixed(2)} seconds`);
  console.log(`Total Requests:      ${totalRequests}`);
  console.log(`Overall RPS:         ${overallRps} req/sec`);
  console.log(`Success Rate:        ${((successCount / totalRequests) * 100).toFixed(2)}% (${successCount} OK / ${errorCount} Errors)`);
  console.log(`Response Times:`);
  console.log(`  Min:               ${min.toFixed(2)} ms`);
  console.log(`  Average:           ${avg.toFixed(2)} ms`);
  console.log(`  Median (p50):      ${p50.toFixed(2)} ms`);
  console.log(`  90th % (p90):      ${p90.toFixed(2)} ms`);
  console.log(`  95th % (p95):      ${p95.toFixed(2)} ms`);
  console.log(`  99th % (p99):      ${p99.toFixed(2)} ms`);
  console.log(`  Max:               ${max.toFixed(2)} ms`);
  console.log(`Status Codes:`, JSON.stringify(statusCodes, null, 2));
  console.log(`=========================================`);

  // Write markdown report
  const reportPath = path.join(__dirname, 'load_test_report.md');
  const reportContent = `# Load Test Report

- **Date / Time**: ${new Date().toISOString()}
- **Target URL**: \`${TARGET_URL}\`
- **Concurrency**: ${CONCURRENCY} virtual users
- **Target Duration**: ${DURATION_MS / 1000} seconds
- **Actual Duration**: ${(totalTimeMs / 1000).toFixed(2)} seconds

## Performance Summary

| Metric | Value | Description |
| --- | --- | --- |
| **Total Requests** | ${totalRequests} | Total number of HTTP requests sent and processed |
| **Overall RPS** | **${overallRps} req/sec** | Average throughput during the test |
| **Success Rate** | ${((successCount / totalRequests) * 100).toFixed(2)}% | Percentage of successful requests (2xx status) |
| **Errors** | ${errorCount} | Total number of failed or non-2xx requests |

## Response Times

| Percentile / Metric | Response Time (ms) |
| --- | --- |
| **Minimum** | ${min.toFixed(2)} ms |
| **Median (p50)** | ${p50.toFixed(2)} ms |
| **Average** | ${avg.toFixed(2)} ms |
| **90th Percentile (p90)** | ${p90.toFixed(2)} ms |
| **95th Percentile (p95)** | ${p95.toFixed(2)} ms |
| **99th Percentile (p99)** | ${p99.toFixed(2)} ms |
| **Maximum** | ${max.toFixed(2)} ms |

## HTTP Status Codes

\`\`\`json
${JSON.stringify(statusCodes, null, 2)}
\`\`\`
`;

  fs.writeFileSync(reportPath, reportContent, 'utf8');
  console.log(`Report successfully written to ${reportPath}`);
}
