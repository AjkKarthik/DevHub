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
  ];

  qna: QnaItem[] = [
    { q: 'How many virtual users should I use in my load test?', a: 'Base it on your actual usage analytics. A common starting point: concurrent users = (requests per second) × (average session duration in seconds). If your peak is 500 RPS and sessions last 2 minutes, you need ~60,000 concurrent users — but most are idle between actions, so factor in think time. Start with smoke (1–5 VUs), then build up.' },
    { q: 'Should performance tests run in CI on every commit?', a: 'Smoke tests (1 VU, quick) on every PR to catch regressions. Full load tests nightly or on release branches — they take minutes and need a staging environment. Running full stress tests on every commit is expensive and can interfere with shared environments.' },
    { q: 'What is the difference between k6 checks and thresholds?', a: 'Checks are per-request assertions (like status === 200) that contribute to a pass/fail count visible in the summary. They do NOT fail the test on their own. Thresholds are test-level criteria that determine the overall pass/fail exit code — e.g. the check pass rate itself can be a threshold: checks { rate > 0.99 }.' },
  ];
}
