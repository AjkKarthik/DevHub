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
    heading: 'Three Tool Categories Named, None Shown Catching Anything',
    points: [
      'The theory names all three "shift-left" tool categories with real tool names: "SAST... Semgrep, CodeQL — analyses source code for patterns like SQL concatenation. SCA... Snyk, Dependabot — finds known CVEs... DAST... OWASP ZAP, Burp Suite — probes a running app." No codeTab on the page ever shows a piece of code one of these tools would actually flag, or what the flagged pattern looks like once fixed.',
      'This subtopic focuses on SAST specifically — the theory\'s own named example ("patterns like SQL concatenation") — building the exact vulnerable pattern a SAST scanner is designed to catch, and the fix that makes the scan pass clean.',
    ],
  },
  {
    heading: 'What SAST Actually Does, Mechanically',
    points: [
      'A SAST tool doesn\'t RUN the code — it parses source into an abstract syntax tree and pattern-matches against known-dangerous SHAPES: string concatenation flowing into a query execution call, unsanitized input flowing into <code>eval()</code> or a shell command, a hardcoded credential literal. This is why SAST can run on every commit, in seconds, with no running application needed — and also why it can only catch patterns it was TAUGHT to recognize, not genuinely novel logic flaws.',
      'This directly complements the main page\'s own "Input Validation" codeTab, which already fixes SQL injection via parameterized queries — SAST is the AUTOMATED, continuous version of catching that exact mistake before a human reviewer even looks at the code.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'What a SAST Scanner Flags',
    language: 'typescript',
    code: `// A SAST rule (conceptually, what a Semgrep pattern for this looks
// like): "flag any call to db.query() whose FIRST argument is a
// template literal containing an interpolated expression."

// FLAGGED — string concatenation into a query, exactly the shape
// the main page's own theory bullet names.
app.get('/orders', async (req, res) => {
  const { status } = req.query;
  const orders = await db.query(\`SELECT * FROM orders WHERE status = '\${status}'\`);
  // A SAST scanner doesn't need to RUN this to flag it -- the
  // TEMPLATE LITERAL itself, with an interpolated \${status} feeding
  // directly into a raw SQL string, matches the dangerous pattern
  // regardless of what value status actually holds at runtime.
  res.json(orders);
});

// NOT FLAGGED — parameterized query, the exact shape SAST rules for
// this category are designed to recognize as safe.
app.get('/orders', async (req, res) => {
  const { status } = req.query;
  const orders = await db.query('SELECT * FROM orders WHERE status = $1', [status]);
  // The query string itself is a STATIC literal with no
  // interpolation -- the value is passed as a separate, properly
  // escaped parameter. A SAST scanner's pattern for "dangerous SQL
  // concatenation" simply doesn't match this shape at all.
  res.json(orders);
});`,
  },
  {
    label: 'A Pattern SAST Would Miss',
    language: 'typescript',
    code: `// This ALSO builds a query via a template literal -- but SAST tools
// commonly only flag string interpolation feeding a query/exec call
// DIRECTLY. Routing the same unsafe value through an intermediate
// variable, or a helper function, can slip past a naive pattern match
// that isn't tracking data flow across multiple lines.
function buildStatusFilter(status: string): string {
  return \`status = '\${status}'\`;   // still raw concatenation...
}

app.get('/orders', async (req, res) => {
  const filter = buildStatusFilter(req.query.status as string);
  const orders = await db.query(\`SELECT * FROM orders WHERE \${filter}\`);
  // ...just one function call removed from the call site SAST was
  // watching. A simple, single-call pattern match can miss this;
  // more sophisticated SAST tools do real data-flow/taint analysis
  // across function boundaries specifically to catch cases like this.
  res.json(orders);
});`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The main page\'s own theory lists SCA (Snyk, Dependabot) as catching "known CVEs in third-party dependencies." Would a SCA tool catch the SQL-injection pattern shown above? Why or why not?',
  hint: 'Think about what SCA tools actually SCAN — the application\'s own source code, or something else entirely.',
  solution: `// No -- SCA tools scan a project's DEPENDENCY MANIFEST (package.json,
// package-lock.json) against a database of known vulnerabilities in
// THIRD-PARTY packages, not the application's own hand-written source
// code. The SQL-injection pattern above is a vulnerability in code
// the TEAM wrote themselves, using a database driver that is (most
// likely) not itself vulnerable -- SCA would report nothing wrong
// here at all.

// This is exactly why the main page's own theory lists all three
// categories together rather than treating any single one as
// sufficient: SAST catches unsafe patterns in YOUR OWN code, SCA
// catches known-vulnerable THIRD-PARTY packages, and DAST catches
// what actually happens when a REAL running instance is probed --
// three genuinely different blind spots, not three ways of finding
// the same thing.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the "NOT FLAGGED" parameterized-query version passes a SAST scan clean, that\'s proof the code has no SQL injection risk at all.',
    reality: 'A clean SAST scan means the scanner found no MATCHING PATTERN — it is not a formal proof of safety, and the second codeTab shows exactly how a genuinely unsafe pattern (concatenation routed through a helper function) can slip past a scanner that only checks the immediate call site. SAST is one layer in the main page\'s own defence-in-depth model, not a replacement for actually understanding why parameterized queries are safe in the first place.',
  },
  {
    thought: 'SAST tools execute the code in a sandbox to see if it behaves dangerously, similar to how DAST works.',
    reality: 'SAST is specifically STATIC analysis — it never runs the code at all, which is precisely why it can scan on every commit in seconds without needing a deployed environment, test data, or running services. DAST (the main page\'s own OWASP ZAP/Burp Suite example) is the one that actually runs the application and sends it real requests. The two are complementary specifically BECAUSE they work at different stages (source code vs. a live running instance) and catch different classes of issue as a result.',
  },
];

@Component({
  selector: 'app-sec-fund-sast',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './what-sast-actually-catches.html',
  styleUrl: './what-sast-actually-catches.scss',
})
export class WhatSastActuallyCatchesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
