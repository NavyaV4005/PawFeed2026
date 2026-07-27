# Load Test Report

- **Date / Time**: 2026-07-27T06:30:57.990Z
- **Target URL**: `http://localhost:5000/api/health`
- **Concurrency**: 100 virtual users
- **Target Duration**: 60 seconds
- **Actual Duration**: 60.06 seconds

## Performance Summary

| Metric | Value | Description |
| --- | --- | --- |
| **Total Requests** | 727900 | Total number of HTTP requests sent and processed |
| **Overall RPS** | **12118.54 req/sec** | Average throughput during the test |
| **Success Rate** | 100.00% | Percentage of successful requests (2xx status) |
| **Errors** | 0 | Total number of failed or non-2xx requests |

## Response Times

| Percentile / Metric | Response Time (ms) |
| --- | --- |
| **Minimum** | 4.03 ms |
| **Median (p50)** | 7.11 ms |
| **Average** | 8.24 ms |
| **90th Percentile (p90)** | 11.33 ms |
| **95th Percentile (p95)** | 17.56 ms |
| **99th Percentile (p99)** | 21.40 ms |
| **Maximum** | 87.81 ms |

## HTTP Status Codes

```json
{
  "200": 727900
}
```
