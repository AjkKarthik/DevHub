import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'From "Audit Script" to "Regression Test"',
    points: [
      'The main page\'s own "Security Headers Audit" codeTab already builds an <code>auditSecurityHeaders()</code> function that fetches a URL and checks its headers — but it\'s a standalone script you\'d run manually, not something that fails a CI build.',
      'The QnA describes exactly this next step in prose ("write integration tests that make requests to your application and assert the presence and value of security headers") but never shows the actual test file.',
      'The key difference between the two: an audit script REPORTS problems for a human to notice; a CI test FAILS the build the moment a header regresses — the same distinction between a linter you remember to run and one wired into your build pipeline.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Test Suite',
    language: 'typescript',
    code: `import request from 'supertest';
import { app } from '../src/app';

describe('Security Headers', () => {
  it('sets Strict-Transport-Security with a sufficient max-age', async () => {
    const res = await request(app).get('/');
    const hsts = res.headers['strict-transport-security'];

    expect(hsts).toBeDefined();
    expect(hsts).toContain('max-age=');

    // Not just "present" -- actually parse and check the VALUE.
    // A one-year minimum, matching the main page's own recommendation.
    const maxAge = Number(hsts.match(/max-age=(\\d+)/)?.[1]);
    expect(maxAge).toBeGreaterThanOrEqual(31536000);
  });

  it('sets X-Content-Type-Options: nosniff', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options to DENY or SAMEORIGIN', async () => {
    const res = await request(app).get('/');
    expect(['DENY', 'SAMEORIGIN']).toContain(res.headers['x-frame-options']);
  });

  it('sets a Content-Security-Policy with no unsafe-inline or unsafe-eval', async () => {
    const res = await request(app).get('/');
    const csp = res.headers['content-security-policy'];

    expect(csp).toBeDefined();
    // Checking PRESENCE alone would pass even for a CSP the main
    // page's own mistake block explicitly warns against -- this test
    // asserts the value doesn't regress into that exact mistake.
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
  });

  it('does not use the weak no-referrer-when-downgrade Referrer-Policy', async () => {
    const res = await request(app).get('/');
    expect(res.headers['referrer-policy']).not.toBe('no-referrer-when-downgrade');
  });
});`,
  },
  {
    label: 'Why "Present" Isn\'t Enough — a Regression This Suite Catches',
    language: 'typescript',
    code: `// A teammate, migrating from helmet's default CSP config to a
// custom one, accidentally reintroduces 'unsafe-inline' while trying
// to fix an unrelated inline-style warning:
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc:  ["'self'"],
    styleSrc:   ["'self'", "'unsafe-inline'"], // "quick fix" for now
  },
}));

// A test that only checks PRESENCE:
//   expect(res.headers['content-security-policy']).toBeDefined();
// -- still PASSES. The header exists. Nothing caught the regression.

// The test suite above catches it immediately:
//   expect(csp).not.toContain('unsafe-inline');
// -- FAILS, exactly at the moment the risky value was introduced,
// not months later when someone happens to run the main page's own
// manual "Security Headers Audit" script against production.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The HSTS test checks <code>maxAge &gt;= 31536000</code>. A teammate sets <code>max-age=3600</code> (1 hour) "temporarily, for testing in staging" and the change accidentally ships to the production config. Does this test suite catch it, and what would the actual CI failure message tell the teammate?',
  hint: 'Trace exactly what value gets extracted by the regex, and what the assertion compares it against.',
  solution: `// Yes -- it fails immediately.

// The regex /max-age=(\\d+)/ extracts "3600" from the header value,
// Number('3600') is 3600, and:
//   expect(3600).toBeGreaterThanOrEqual(31536000)
// fails with a message naming the exact numbers -- something like
// "Expected: >= 31536000, Received: 3600" -- immediately pointing the
// teammate at the actual problem (a too-short max-age) rather than a
// vague "security headers test failed."

// This is exactly why the test parses and compares the NUMERIC value
// instead of just checking the header exists or contains the string
// "max-age=" -- a header containing "max-age=3600" would pass a
// presence-only or substring-only check while still being a real,
// shipped regression.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Testing that a security header is present (<code>toBeDefined()</code>) is sufficient CI coverage for that header.',
    reality: 'A header can be present with a WEAK or actively wrong value — <code>max-age=1</code> technically satisfies "HSTS is present," and a CSP containing <code>unsafe-inline</code> technically satisfies "CSP is present." The suite above checks specific values, not just presence, which is what actually catches a regression like the one in the Try It.',
  },
  {
    thought: 'The main page\'s own "Security Headers Audit" codeTab already provides CI coverage since it checks the same headers.',
    reality: 'That codeTab is a standalone script meant to be run manually against a URL — it doesn\'t fail a build, doesn\'t run automatically on every commit, and someone has to remember to run it. A Jest/Supertest suite that runs as part of the normal test command is what actually blocks a regression from merging.',
  },
  {
    thought: 'Once a security-headers test suite is written, it needs no further maintenance.',
    reality: 'The main page\'s own gotcha names this directly: middleware or framework upgrades can silently change or drop default headers — the test suite is what surfaces that the NEXT time a dependency update changes helmet\'s defaults, not a one-time check that stays valid forever.',
  },
];

@Component({
  selector: 'app-sec-headers-ci',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './security-headers-in-ci-a-real-jest-supertest-suite.html',
  styleUrl: './security-headers-in-ci-a-real-jest-supertest-suite.scss',
})
export class SecurityHeadersInCiARealJestSupertestSuiteSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
