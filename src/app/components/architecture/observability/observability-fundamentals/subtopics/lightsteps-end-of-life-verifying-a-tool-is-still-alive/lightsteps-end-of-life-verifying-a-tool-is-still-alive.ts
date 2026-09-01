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
    heading: 'A "Modern Observability" Example That Stopped Existing',
    points: [
      'The main page’s own quiz grouped Lightstep alongside Honeycomb and Jaeger as an example of "modern observability" tooling capable of querying arbitrary high-cardinality data. Checked directly against ServiceNow’s own official end-of-life notice (Lightstep was acquired by ServiceNow in 2021 and rebranded to "ServiceNow Cloud Observability" in 2023): the service reached end-of-life on March 1, 2026, with ServiceNow explicitly stating "no replacement for this product" and "no direct migration" path to anything else on their platform.',
      'This has now been fixed on the main page — the quiz explanation swaps Lightstep for Grafana Tempo (a genuinely current, actively-maintained tracing backend), with a short explanatory note kept in place rather than silently erased, since the underlying lesson ("verify a named tool is still actively maintained before adopting it") is itself worth preserving, matching a pattern this hub’s own sibling API Design hub already established for a different tool (Optic).',
      'Two DIFFERENT flavors of "a tool went away" are worth distinguishing precisely: a tool being ARCHIVED (a maintainer decision to stop developing it, but the existing software may keep running indefinitely) versus a tool being fully END-OF-LIFED (a vendor actively shutting down the hosted SERVICE itself, on a fixed date, after which the tool is genuinely unusable for most customers, not merely unmaintained).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Tool-Lifecycle Status Checker',
    language: 'typescript',
    code: `interface ToolLifecycleStatus {
  eolDate?: string; // ISO date -- the date the SERVICE itself stops working
}

function assessToolLifecycle(status: ToolLifecycleStatus, nowMs: number): 'supported' | 'eol-scheduled' | 'end-of-life' {
  if (status.eolDate && nowMs >= Date.parse(status.eolDate)) return 'end-of-life';
  if (status.eolDate) return 'eol-scheduled';
  return 'supported';
}

// Lightstep's own confirmed EOL date (ServiceNow's official notice):
// "The service will no longer be supported as of March 1, 2026 or your
// subscription term end date, whichever is later."
const lightstepStatus: ToolLifecycleStatus = { eolDate: '2026-03-01' };

console.log(assessToolLifecycle(lightstepStatus, Date.parse('2026-09-01'))); // 'end-of-life'
console.log(assessToolLifecycle(lightstepStatus, Date.parse('2025-12-01'))); // 'eol-scheduled'

// A tool with no announced EOL date at all -- the default, healthy state.
const grafanaTempoStatus: ToolLifecycleStatus = {};
console.log(assessToolLifecycle(grafanaTempoStatus, Date.parse('2026-09-01'))); // 'supported'

// The important distinction this function deliberately does NOT try to
// capture: an EOL DATE is a much stronger, more actionable signal than a
// GitHub repo simply going quiet -- an eolDate comes from the VENDOR
// itself, announced in advance, with a hard cutover point, whereas "no
// recent commits" could mean anything from abandonment to genuine
// feature-completeness.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'ServiceNow’s own EOL notice states the cutover is "March 1, 2026 OR your subscription term end date, whichever is later." A customer’s subscription runs through June 15, 2026. Using <code>assessToolLifecycle()</code>’s underlying logic, what date should THIS specific customer treat as their real end-of-life date, and why doesn’t the function above capture that nuance?',
  hint: 'The codeTab’s function only ever checks a single, fixed <code>eolDate</code> — it has no way to represent "whichever is later" between two different dates from two different sources (the vendor’s announcement and the customer’s own contract).',
  solution: `// The customer's real EOL date is June 15, 2026 -- their subscription end
// date is LATER than the vendor's blanket March 1, 2026 cutoff, and the
// vendor's own wording ("whichever is later") means the later of the two
// dates always wins for a given customer.
//
// assessToolLifecycle() as written cannot represent this at all -- it
// takes a single eolDate, with no way to combine a vendor-wide date and a
// customer-specific contract date. A more complete version would need:
//
//   function realEolDate(vendorEol: string, subscriptionEnd?: string): string {
//     if (!subscriptionEnd) return vendorEol;
//     return Date.parse(subscriptionEnd) > Date.parse(vendorEol) ? subscriptionEnd : vendorEol;
//   }
//
// The broader lesson: a vendor's own EOL announcement is rarely a single
// flat date for every customer -- always check whether YOUR specific
// contract terms extend (or, less commonly, shorten) the general
// timeline before treating a blanket announcement as your own deadline.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Lightstep being "rebranded to ServiceNow Cloud Observability" and Lightstep being "end-of-life" are the same event, just described two different ways.',
    reality: 'They are two SEPARATE events, roughly two years apart: the rebrand happened in August 2023 (same product, new name, same functionality, per ServiceNow’s own changelog) — the actual end-of-life announcement came later, in August 2025, with support ending March 1, 2026. A tool being renamed does not mean it is being discontinued, and confusing the two would have led to fixing this page two years too early, missing the actual, more consequential EOL fact entirely.',
  },
  {
    thought: 'Once a hosted observability tool reaches its vendor-announced end-of-life date, existing customers can generally keep using it as-is, just without new features or support tickets.',
    reality: 'ServiceNow’s own EOL notice describes the SERVICE itself no longer being supported after the cutoff — not merely a feature freeze. Since Cloud Observability is a hosted SaaS product (not self-hosted software a customer runs independently), "end of support" for a service like this typically means the service stops being accessible at all past the cutoff, a meaningfully more disruptive outcome than an open-source repo simply going unmaintained while continuing to run.',
  },
  {
    thought: 'A distributed-tracing tool recommendation is a minor implementation detail — swapping one name for another in a quiz explanation is not worth the same rigor as fixing a genuine code bug.',
    reality: 'A tool recommendation IS a factual claim a reader is meant to trust and act on — recommending a fully-discontinued, unreplaceable product to a learner who might actually adopt it for a real project is a real, practical harm, not a cosmetic one, which is exactly why this fix (like the sibling API Design hub’s own Optic fix) verified the claim directly against the vendor’s own primary source rather than assuming the original text was still accurate.',
  },
];

@Component({
  selector: 'app-obs-fundamentals-lightstep-eol',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './lightsteps-end-of-life-verifying-a-tool-is-still-alive.html',
  styleUrl: './lightsteps-end-of-life-verifying-a-tool-is-still-alive.scss',
})
export class LightstepsEndOfLifeVerifyingAToolIsStillAliveSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
