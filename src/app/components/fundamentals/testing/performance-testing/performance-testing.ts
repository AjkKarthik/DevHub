import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';

@Component({
  selector: 'app-performance-load-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            QuizBlockComponent, QnaBlockComponent],
  templateUrl: './performance-testing.html',
  styleUrl: './performance-testing.scss',
})
export class PerformanceLoadTesting {
  quickRef: QuickRefItem[] = [
    { name: 'k6',              type: 'keyword',  desc: 'Modern load testing tool — scripts in JS, runs as a Go binary, outputs metrics.' },
    { name: 'Virtual User (VU)',type: 'keyword', desc: 'Simulated concurrent user executing your test script in a loop.' },
    { name: 'Throughput (RPS)', type: 'keyword', desc: 'Requests per second — the rate your system processes load.' },
    { name: 'p95 / p99',        type: 'keyword', desc: '95th/99th percentile latency — 95% or 99% of requests finish within this time.' },
    { name: 'Threshold',        type: 'keyword', desc: 'k6: pass/fail criterion — e.g. p(95) < 500ms or error rate < 1%.' },
    { name: 'Ramp-up',          type: 'keyword', desc: 'Gradually increasing load to avoid a thundering-herd spike at test start.' },
    { name: 'Soak test',        type: 'keyword', desc: 'Extended run at moderate load to detect memory leaks and resource exhaustion over time.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'Load Test Types', points: [
      'Smoke test: 1–2 VUs, confirm the script works and baseline latency is sane.',
      'Load test: expected peak traffic — verify the system meets SLAs under normal load.',
      'Stress test: push beyond expected peak to find the breaking point.',
      'Soak test: sustained moderate load for hours — catches memory leaks, connection pool exhaustion.',
      'Spike test: sudden extreme burst of traffic — simulates flash sales or viral events.',
    ]},
    { heading: 'k6 Core Concepts', points: [
      'VUs run your default function() in a loop for the test duration.',
      'Scenarios let you mix different workload shapes in one script.',
      'Thresholds are pass/fail criteria checked at the end of the run.',
      'Checks are pass/fail assertions inside the script (like status === 200).',
      'Output: k6 run -o cloud for Grafana Cloud dashboards; --out json for local analysis.',
    ]},
    { heading: 'Key Metrics to Watch', points: [
      'http_req_duration p(95): 95% of requests complete within this time — most important SLA metric.',
      'http_req_failed: percentage of non-2xx responses — target < 1% under load.',
      'vus_max: maximum concurrent virtual users reached during the test.',
      'http_reqs: total request count — divide by duration for throughput.',
      'iteration_duration: full loop time — rises when the server slows down under load.',
    ]},
    { heading: 'Gatling vs JMeter vs k6', points: [
      'k6: developer-friendly JS scripts, Git-friendly, fast Go binary — best for teams already using JS.',
      'Gatling: Scala/Java DSL, good CI integration, detailed HTML reports — popular in JVM shops.',
      'JMeter: GUI-driven, XML config, huge plugin ecosystem — legacy but still widely used.',
      'All three can integrate with CI/CD — k6 is easiest to script and version-control.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'k6 Load Test', language: 'typescript', code:
`// script.js — run with: k6 run script.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50  },  // ramp up to 50 VUs over 1 minute
    { duration: '3m', target: 50  },  // hold 50 VUs for 3 minutes
    { duration: '1m', target: 0   },  // ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],   // 95% of requests under 500ms
    'http_req_failed':   ['rate<0.01'],   // error rate under 1%
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');

  check(res, {
    'status 200':          r => r.status === 200,
    'response time < 1s':  r => r.timings.duration < 1000,
    'has products':        r => JSON.parse(r.body).length > 0,
  });

  sleep(1);  // think time between iterations
}` },
    { label: 'k6 Scenarios', language: 'typescript', code:
`// Mixed workload: browsing + checkout
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    browse: {
      executor:    'constant-vus',
      vus:         100,
      duration:    '5m',
      exec:        'browseProducts',
    },
    checkout: {
      executor:    'constant-arrival-rate',
      rate:        10,         // 10 iterations per second
      timeUnit:    '1s',
      duration:    '5m',
      preAllocatedVUs: 20,
      exec:        'doCheckout',
    },
  },
};

export function browseProducts() {
  http.get('https://api.example.com/products');
  sleep(2);
}

export function doCheckout() {
  http.post('https://api.example.com/orders', JSON.stringify({ items: [{ id: 1 }] }), {
    headers: { 'Content-Type': 'application/json' },
  });
  sleep(1);
}` },
    { label: 'Gatling (Scala)', language: 'typescript', code:
`// Gatling simulation — build with Maven/Gradle, run with gatling.sh
// ProductSimulation.scala

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class ProductSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("https://api.example.com")
    .acceptHeader("application/json")

  val scn = scenario("Browse Products")
    .exec(
      http("Get products")
        .get("/products")
        .check(status.is(200))
        .check(jsonPath("$[0].id").exists)
    )
    .pause(1)

  setUp(
    scn.inject(
      rampUsers(100).during(1.minute),   // ramp to 100 users
      constantUsersPerSec(20).during(3.minutes),
    )
  ).protocols(httpProtocol)
    .assertions(
      global.responseTime.percentile3.lt(500),   // p95 < 500ms
      global.failedRequests.percent.lt(1),
    )
}` },
    { label: 'Analysing Results', language: 'typescript', code:
`# k6 summary output example
scenarios: (100.00%) 1 scenario, 50 max VUs, 5m30s max duration
default: 50 looping VUs for 5m0s (gracefulStop: 30s)

✓ status 200
✓ response time < 1s

checks.........................: 99.94% 29983 out of 29999
data_received..................: 45 MB 150 kB/s
data_sent......................: 6.2 MB 21 kB/s
http_req_blocked...............: avg=1.44ms   p(95)=5ms
http_req_duration..............: avg=142ms    p(95)=388ms  ← KEY METRIC
http_req_failed................: 0.02%  6 out of 29999
http_reqs......................: 29999  99.99/s
vus............................: 50    min=50 max=50
vus_max........................: 50    min=50 max=50

✓  http_req_duration p(95)<500ms — PASS
✓  http_req_failed   rate<1%    — PASS` },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between a load test and a stress test?', options: ['Load tests use VUs; stress tests use HTTP requests', 'Load test runs at expected peak traffic to verify SLAs; stress test pushes beyond that to find the breaking point', 'Load tests are shorter; stress tests last longer', 'They are the same thing'], answer: 1, explanation: 'A load test validates that your system meets performance SLAs at the expected peak concurrent users. A stress test deliberately exceeds that to find at what point the system degrades or fails.' },
    { q: 'What does a k6 threshold do?', options: ['It limits the maximum number of VUs', 'It defines pass/fail criteria for the test — e.g. p(95) < 500ms', 'It sets the ramp-up duration', 'It filters which requests to include in the report'], answer: 1, explanation: 'Thresholds in k6 are assertions at the test level. If a threshold is not met (e.g. p95 latency exceeds 500ms), k6 exits with a non-zero code, failing the CI pipeline.' },
    { q: 'Why is p95 latency more useful than average latency for SLAs?', options: ['p95 is always lower than average', 'Average hides slow outlier requests; p95 guarantees that 95% of users experience acceptable latency', 'p95 is easier to calculate', 'Average is unreliable in distributed systems'], answer: 1, explanation: 'Average latency is pulled down by fast requests and up by spikes — it does not tell you what most users actually experience. p95 means 95% of requests finish within that time, which matches "the typical user" much better for SLA definitions.' },
    { q: 'What is a soak test (endurance test) and what kind of problem is it specifically designed to catch?', options: ['A test that runs at maximum possible load for a few seconds', 'A test that runs at moderate, sustained load for an extended period (hours) to catch memory leaks, connection pool exhaustion, and other issues that only manifest over time', 'A test that simulates network packet loss', 'A test that only measures cold-start latency'], answer: 1, explanation: 'A soak test runs realistic (not extreme) load for an extended duration — hours rather than minutes — specifically to catch degradation that only appears over time: memory leaks that slowly grow until an OOM crash, database connection pools that leak connections, or log files that fill disk space. A short load test at the same traffic level would never reveal these issues since they need sustained time to accumulate.' },
    { q: 'What is a spike test and why is it different from a standard ramp-up load test?', options: ['A spike test is identical to a stress test', 'A spike test suddenly jumps traffic from baseline to a very high level with no gradual ramp, testing how the system handles sudden bursts (viral traffic, a marketing campaign launch)', 'A spike test only measures database query performance', 'A spike test cannot be automated and must be run manually'], answer: 1, explanation: 'A standard load test gradually ramps virtual users up to a target level, giving auto-scaling and caches time to adapt. A spike test intentionally skips the ramp, jumping immediately to a high load level to simulate sudden real-world traffic surges (a product going viral, a flash sale starting) — testing whether auto-scaling reacts fast enough and whether the system gracefully handles the sudden burst rather than failing outright before scaling catches up.' },
    { q: 'Why does "think time" matter when modeling virtual users in a load test script?', options: ['Think time only affects the test report formatting', 'Think time simulates the realistic pauses a real user takes between actions (reading a page, filling a form); omitting it makes virtual users hammer the server far faster than real users ever would, producing unrealistically pessimistic results', 'Think time is only relevant for mobile app testing', 'Adding think time always makes a test run faster'], answer: 1, explanation: 'Real users pause between actions — reading content, deciding what to click, typing into a form. A load test script that fires requests back-to-back with no delay simulates an unrealistic, much higher request rate than the same number of real concurrent users would actually generate, potentially causing a test to report failures at traffic levels the system would handle fine in production with realistic user pacing.' },
  ];

  qna: QnaItem[] = [
    { q: 'How many virtual users should I use in my load test?', a: 'Base it on your actual usage analytics. A common starting point: concurrent users = (requests per second) × (average session duration in seconds). If your peak is 500 RPS and sessions last 2 minutes, you need ~60,000 concurrent users — but most are idle between actions, so factor in think time. Start with smoke (1–5 VUs), then build up.' },
    { q: 'Should performance tests run in CI on every commit?', a: 'Smoke tests (1 VU, quick) on every PR to catch regressions. Full load tests nightly or on release branches — they take minutes and need a staging environment. Running full stress tests on every commit is expensive and can interfere with shared environments.' },
    { q: 'What is the difference between k6 checks and thresholds?', a: 'Checks are per-request assertions (like status === 200) that contribute to a pass/fail count visible in the summary. They do NOT fail the test on their own. Thresholds are test-level criteria that determine the overall pass/fail exit code — e.g. the check pass rate itself can be a threshold: checks { rate > 0.99 }.' },
    { q: 'Why is it important to run performance tests against an environment that closely mirrors production, rather than a smaller staging environment?', a: 'Performance characteristics (database query plans, cache hit ratios, connection pool behavior, auto-scaling thresholds) often do not scale linearly — a system that performs well on a staging environment with a fraction of production\'s database size or instance count can behave completely differently under real production conditions. A query that uses an index efficiently on a small staging dataset might fall back to a full table scan on a production-sized table. Testing against a production-like environment (same instance types, comparable data volume, same scaling configuration) gives meaningfully more trustworthy results than testing against an underpowered staging copy.' },
    { q: 'What is the difference between client-side (browser-based) and server-side (protocol-level) load testing tools?', a: 'Protocol-level tools (k6, JMeter, Gatling) simulate load by directly issuing HTTP requests without rendering a real browser — extremely resource-efficient, allowing a single machine to simulate thousands of virtual users, but they do not execute JavaScript or measure real browser rendering performance. Browser-based tools (Lighthouse, WebPageTest, Playwright-driven load tests) launch real browser instances, capturing actual rendering metrics (LCP, CLS) but consuming far more resources per simulated user, limiting practical concurrency to a much smaller number. Use protocol-level tools for backend/API load testing at scale; use browser-based tools for measuring real frontend user experience under typically much lower concurrency.' },
    { q: 'What is the difference between throughput and latency as performance metrics, and why can optimizing for one hurt the other?', a: 'Throughput measures how many requests a system processes per unit of time (requests/second); latency measures how long each individual request takes to complete. They can trade off against each other: batching requests together to maximize throughput (processing many at once) can increase the latency experienced by any individual request waiting in that batch. Conversely, optimizing aggressively for the lowest possible per-request latency (processing each request immediately, one at a time) can leave throughput capacity on the table. Performance testing should report both metrics together, since a system optimized purely for one without considering the other may not actually meet real user-facing SLAs.' },
  ];
}
