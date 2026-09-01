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
    heading: 'The QnA Describes the Process — Not the Endpoint Itself',
    points: [
      'The main page\'s own QnA lays out the full rollout recipe precisely: deploy <code>Content-Security-Policy-Report-Only</code>, add a <code>report-uri</code>/<code>report-to</code> directive, collect violation reports, refine the policy, then switch to enforcement. No codeTab on the page ever builds the endpoint that actually RECEIVES those reports.',
      'A CSP violation report arrives as a JSON body with a specific, browser-defined shape — <code>blocked-uri</code>, <code>violated-directive</code>, <code>document-uri</code>, and several other fields describing exactly what was blocked and why.',
      'The modern replacement for the older <code>report-uri</code> directive is <code>report-to</code>, which points at a name registered via the separate <code>Reporting-Endpoints</code> header, sends batched reports with a different content type (<code>application/reports+json</code>), and — in browsers that support it — makes them IGNORE <code>report-uri</code> entirely if both are set on the same policy. <code>report-uri</code> alone (no <code>report-to</code>) still works broadly and is simpler to wire up, which is why it\'s the one built out here.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'CSP in Report-Only Mode, Pointed at a Real Endpoint',
    language: 'typescript',
    code: `import helmet from 'helmet';

app.use(helmet.contentSecurityPolicy({
  reportOnly: true, // logs violations, blocks NOTHING yet
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc:  ["'self'"],
    imgSrc:     ["'self'", 'data:'],
    // The directive that tells the browser WHERE to POST violation
    // reports -- this is the piece the main page's own QnA never
    // shows wired up to anything real.
    reportUri:  ['/api/csp-report'],
  },
}));`,
  },
  {
    label: 'The Endpoint: Receiving and Logging Reports',
    language: 'typescript',
    code: `import express from 'express';
const app = express();

// Browsers POST violation reports with this specific Content-Type --
// NOT application/json -- express.json() alone won't parse it.
app.post(
  '/api/csp-report',
  express.json({ type: 'application/csp-report' }),
  (req, res) => {
    const report = req.body['csp-report'];

    if (report) {
      console.warn('[CSP Violation]', {
        blockedUri:        report['blocked-uri'],
        violatedDirective: report['violated-directive'],
        documentUri:       report['document-uri'],
        // In production: write to a real log/metrics store instead of
        // console.warn, and rate-limit this endpoint -- a single
        // misconfigured directive can generate thousands of reports
        // per second once real traffic hits it.
      });
    }

    // 204 No Content -- the browser doesn't care about the response
    // body, just that the request succeeded.
    res.status(204).end();
  }
);

// Example report body a browser actually sends:
// {
//   "csp-report": {
//     "document-uri": "https://app.example.com/dashboard",
//     "violated-directive": "script-src 'self'",
//     "blocked-uri": "https://evil.com/malicious.js",
//     "original-policy": "default-src 'self'; script-src 'self'; report-uri /api/csp-report"
//   }
// }`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The endpoint is registered as <code>app.post(\'/api/csp-report\', express.json({ type: \'application/csp-report\' }), ...)</code>. A teammate removes the <code>{ type: \'application/csp-report\' }</code> option, assuming plain <code>express.json()</code> is equivalent. What breaks?',
  hint: 'What does a browser actually set as the Content-Type header when it POSTs a CSP violation report?',
  solution: `// req.body ends up empty (or express.json() silently skips parsing
// the request entirely).

// Browsers send CSP violation reports with
// Content-Type: application/csp-report, not application/json.
// express.json() only parses request bodies whose Content-Type it
// recognizes -- by default that's application/json specifically. A
// request with a DIFFERENT Content-Type passes through express.json()
// untouched, leaving req.body undefined (or {}, depending on
// downstream middleware) -- report['csp-report'] would then throw or
// silently be undefined, and every violation report would be quietly
// dropped with the endpoint still returning 204 as if everything
// worked.

// The { type: 'application/csp-report' } option is what tells
// express.json() to ALSO treat that specific Content-Type as JSON --
// it's not a cosmetic detail, it's the difference between the
// endpoint actually working and silently receiving nothing at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A CSP violation report arrives with <code>Content-Type: application/json</code>, so plain <code>express.json()</code> is enough to parse it.',
    reality: 'Browsers send it as <code>Content-Type: application/csp-report</code> specifically — <code>express.json()</code> only parses bodies whose Content-Type it\'s configured to recognize, so this needs the explicit <code>{ type: \'application/csp-report\' }</code> option or the body is silently never parsed.',
  },
  {
    thought: 'Once report-only mode collects zero violations, the policy is guaranteed safe to enforce.',
    reality: 'Zero violations means zero violations from the TRAFFIC PATTERNS that occurred during the collection window — a legitimate but rarely-triggered code path (an error page, an admin-only feature, a monthly batch report) can still break the moment enforcement begins, if it happens to load a resource the policy doesn\'t allow.',
  },
  {
    thought: 'A violation-report endpoint just needs to log reports somewhere — traffic volume isn\'t a real concern.',
    reality: 'A single misconfigured or overly strict directive can generate one violation report per page load, per blocked resource — at real production traffic, that can mean thousands of requests per second hitting this endpoint alone, which is why the main page\'s own general defense-in-depth principles (and the codeTab\'s own comment) call out rate-limiting it.',
  },
];

@Component({
  selector: 'app-sec-headers-csp-report',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './wiring-a-real-csp-violation-report-endpoint.html',
  styleUrl: './wiring-a-real-csp-violation-report-endpoint.scss',
})
export class WiringARealCspViolationReportEndpointSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
