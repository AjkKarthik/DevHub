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
    heading: 'Named in the Theory’s Own Example — Never Actually Built',
    points: [
      'The main page’s own theory names the exact scenario: "GET /reports/q3 with Accept: application/json returns JSON; with Accept: text/csv returns CSV. Content negotiation selects the representation." Neither codeTab on the page implements anything resembling this — both always return a fixed JSON shape regardless of headers.',
      'Content negotiation reads the incoming <code>Accept</code> HTTP header and picks a matching response format from a list the server actually supports — it is a real, standard HTTP mechanism (not something the application invents from scratch), which is why Express exposes <code>req.accepts()</code> specifically for it.',
      'A request with no <code>Accept</code> header, or one requesting a format the server does not support, both need an explicit, deliberate fallback — this is exactly the kind of edge case a codeTab needs to show working, not just the single happy-path format.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Same Resource, Two Representations',
    language: 'typescript',
    code: `interface QuarterlyReport {
  quarter: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

function toCsv(report: QuarterlyReport): string {
  const header = 'quarter,revenue,expenses,netIncome';
  const row = \`\${report.quarter},\${report.revenue},\${report.expenses},\${report.netIncome}\`;
  return \`\${header}\\n\${row}\`;
}

app.get('/reports/:quarter', authenticate, async (req, res) => {
  const report = await db.reports.findByQuarter(req.params.quarter);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  // req.accepts() checks the client's Accept header against a list
  // of formats WE actually support, in the client's own preference
  // order -- not just "does the header literally contain this
  // string," which naive Accept-header parsing gets wrong on
  // multi-value headers like "text/csv;q=0.8, application/json".
  switch (req.accepts(['json', 'csv'])) {
    case 'json':
      res.json(report);
      break;
    case 'csv':
      res.type('text/csv').send(toCsv(report));
      break;
    default:
      // The client asked for a format we genuinely don't support
      // (e.g. Accept: application/xml) -- 406, not a silent fallback
      // to JSON, which would hide the mismatch from the client.
      res.status(406).json({ error: 'Supported formats: application/json, text/csv' });
  }
});

// GET /reports/q3  (Accept: application/json) -->
// 200, Content-Type: application/json
// { "quarter": "q3", "revenue": 500000, "expenses": 320000, "netIncome": 180000 }

// GET /reports/q3  (Accept: text/csv) -->
// 200, Content-Type: text/csv
// quarter,revenue,expenses,netIncome
// q3,500000,320000,180000

// GET /reports/q3  (Accept: application/xml) -->
// 406 Not Acceptable
// { "error": "Supported formats: application/json, text/csv" }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A client sends <code>Accept: text/csv, application/json;q=0.5</code> — meaning "I prefer CSV, but JSON is acceptable too." What does <code>req.accepts([\'json\', \'csv\'])</code> return for this header, and why does that matter compared to a naive check like <code>req.headers.accept.includes(\'csv\')</code>?',
  hint: 'The <code>q=0.5</code> is a quality value expressing RELATIVE preference between multiple acceptable formats — does a plain substring check understand preference ordering at all?',
  solution: `// req.accepts(['json', 'csv']) correctly returns 'csv' -- it parses
// the FULL Accept header, including quality values, and returns
// whichever of OUR supported formats the client prefers MOST. Here
// text/csv has no explicit q value (defaults to q=1.0, the highest),
// and application/json is explicitly deprioritized to q=0.5 -- so
// CSV wins, exactly matching what the client actually asked for.

// A naive req.headers.accept.includes('csv') check would ALSO return
// true here (the string genuinely contains "csv") -- so in this
// specific example, both approaches agree by coincidence. The real
// gap shows up with a header like "Accept: application/json,
// text/csv;q=0.3" -- json is now preferred, but a substring check
// for 'csv' would still match first if csv happens to be checked
// before json in the code's own if/else order, silently returning
// the format the client ranked LOWER.

// req.accepts() (and the underlying 'accepts' npm package it wraps)
// implements the actual HTTP content-negotiation algorithm --
// parsing every media type in the header, applying its own quality
// value, and returning the best match against your supported list
// in the CLIENT's stated preference order, not the order your code
// happens to check them in.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Checking the Accept header is just a matter of string-matching for a keyword like "csv" or "json" somewhere in the header value.',
    reality: 'A real <code>Accept</code> header can list MULTIPLE acceptable formats with quality values expressing relative preference (<code>text/csv, application/json;q=0.5</code>) — a substring check has no way to respect that ordering, and can silently return whichever format the CODE happens to check first rather than whichever the CLIENT actually prefers most.',
  },
  {
    thought: 'If a client requests a format the server does not support, the safest behavior is to fall back to a default (like JSON) rather than reject the request.',
    reality: 'The codeTab above deliberately returns <code>406 Not Acceptable</code> instead — silently substituting a different format than what the client explicitly asked for can break a client that specifically needs CSV (e.g. piping the response into a spreadsheet import) and has no idea it received JSON instead until something downstream fails confusingly.',
  },
  {
    thought: 'Content negotiation and API versioning (e.g. <code>/v2/reports</code>) solve the same problem — picking which "shape" of a response a client gets.',
    reality: 'They address different axes: content negotiation picks a REPRESENTATION FORMAT (JSON vs CSV vs XML) of the SAME underlying resource data, driven by the <code>Accept</code> header on a single, unversioned endpoint. API versioning changes the actual SCHEMA/CONTRACT of the resource itself (fields added, removed, or restructured) — a completely different resource shape, not just a different serialization of the same one.',
  },
];

@Component({
  selector: 'app-api-rest-fundamentals-negotiation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './content-negotiation-the-same-resource-json-or-csv.html',
  styleUrl: './content-negotiation-the-same-resource-json-or-csv.scss',
})
export class ContentNegotiationTheSameResourceJsonOrCsvSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
