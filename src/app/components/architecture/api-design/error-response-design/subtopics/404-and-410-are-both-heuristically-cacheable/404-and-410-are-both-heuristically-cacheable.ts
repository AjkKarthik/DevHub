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
    heading: 'The QnA Said "404 Tells Caches to Retry" — RFC 9111 Says Otherwise',
    points: [
      'The main page’s own 404-vs-410 QnA originally claimed "410 can be cached indefinitely (the resource is gone forever). 404 tells caches to retry" — framing it as a binary cacheable-vs-not distinction. Verified against RFC 9111 (HTTP Caching) §4.2.2: BOTH 404 and 410 are on the list of status codes a cache MAY heuristically cache by default, with no explicit <code>Cache-Control</code> header required at all.',
      'The real distinction isn’t whether caching is allowed — it’s about DURATION and INTENT. 410’s defining property is that it signals the removal is PERMANENT; a cache implementation can reasonably use that signal to justify a longer heuristic freshness lifetime (or a different default) than an ordinary 404, which carries no such permanence guarantee.',
      'This has been fixed on the main page to state the accurate distinction — this subtopic builds RFC 9111’s own documented heuristic freshness FORMULA (verified via WebSearch against the spec’s own worked example) to make concrete what "heuristically cacheable" actually computes to.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'RFC 9111’s Own Heuristic Freshness Formula, Applied',
    language: 'typescript',
    code: `// RFC 9111 §4.2.2's own documented heuristic: when a response has a
// Last-Modified header and no explicit freshness directive, a cache
// is encouraged to use roughly 10% of the age since Last-Modified as
// the heuristic freshness lifetime. The spec's own worked example:
// Last-Modified 10 days ago -> ~1 day of heuristic freshness.

function heuristicFreshnessSeconds(lastModified: Date, responseTime: Date): number {
  const ageSeconds = (responseTime.getTime() - lastModified.getTime()) / 1000;
  return ageSeconds * 0.10; // the spec's own commonly-cited 10% fraction
}

const lastModified = new Date('2026-08-20T00:00:00Z');
const responseTime = new Date('2026-08-30T00:00:00Z'); // 10 days later

console.log(heuristicFreshnessSeconds(lastModified, responseTime) / 86400);
// 1 -- exactly matches RFC 9111's own "10 days -> ~1 day" example.

// This formula applies to ANY heuristically-cacheable response WITH
// a Last-Modified header -- it is not status-code-specific. What IS
// status-code-specific is simply WHETHER a status code is on the
// heuristically-cacheable list at all (both 404 and 410 are).`,
  },
  {
    label: 'What Actually Differs: Signaling Permanence, Not Cacheability',
    language: 'typescript',
    code: `interface ErrorResponseMeta {
  status: 404 | 410;
  lastModified?: Date;
}

// Neither status code is MORE or LESS cacheable by the spec -- both
// are on RFC 9111's heuristically-cacheable-by-default list. What a
// cache implementation MAY reasonably choose to do differently is
// use 410's permanence signal to justify a LONGER default freshness
// lifetime when no Last-Modified header is present at all (a case
// the 10%-formula above can't even apply to, since there's no age
// to compute a fraction of).
function suggestedFallbackFreshnessSeconds(meta: ErrorResponseMeta): number {
  if (meta.lastModified) {
    return heuristicFreshnessSeconds(meta.lastModified, new Date());
  }
  // No Last-Modified at all -- RFC 9111 gives no formula for this
  // case; this is genuinely IMPLEMENTATION-SPECIFIC cache policy,
  // not a spec requirement. A 410's permanence signal is a
  // reasonable basis for choosing a longer default here than a 404.
  return meta.status === 410 ? 86400 : 300; // illustrative, not spec-mandated
}

function heuristicFreshnessSeconds(lastModified: Date, responseTime: Date): number {
  return ((responseTime.getTime() - lastModified.getTime()) / 1000) * 0.10;
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate reads the fixed QnA and concludes "so 404 and 410 behave identically for caching purposes — there’s no real difference at all." What’s the more precise, correct takeaway?',
  hint: 'The FIX corrects a claim about whether caching is ALLOWED at all — does that mean there’s no meaningful difference in how LONG a cache might choose to treat each as fresh?',
  solution: `// The more precise takeaway: both are ALLOWED to be heuristically
// cached by the spec (that's what the fix corrects), but nothing
// says a cache implementation has to treat them IDENTICALLY once
// that permission exists. RFC 9111's own 10%-of-Last-Modified-age
// formula applies equally to both status codes when a Last-Modified
// header is present -- so in THAT specific case, they genuinely do
// compute the same heuristic freshness lifetime, no special-casing
// by status code at all.

// But the ORIGINAL claim wasn't really about that formula -- it was
// framed as a binary "can be cached indefinitely" vs. "tells caches
// to retry," which is simply false as a description of what the
// spec permits. The real, defensible distinction is narrower and
// more implementation-dependent: 410's permanence signal is a
// reasonable basis for a cache to choose a LONGER FALLBACK default
// specifically in the no-Last-Modified case (illustrated in the
// second codeTab above), and it's also why 410 gets stronger
// treatment from search engine crawlers (the main page's own SEO
// point, which the fix left untouched since it was already
// accurate). "No real difference at all" overcorrects -- the
// difference is narrower and more nuanced than the original claim,
// not nonexistent.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A response needs an explicit Cache-Control or Expires header to be cached at all.',
    reality: 'RFC 9111 defines HEURISTIC caching specifically for the case where no explicit freshness information is present — a cache MAY still store and reuse certain status codes (including both 404 and 410) based on other signals like the age since <code>Last-Modified</code>, using its own heuristic algorithm.',
  },
  {
    thought: 'The 10%-of-age heuristic formula is specific to error status codes like 404 and 410.',
    reality: 'It’s a GENERAL heuristic freshness calculation that applies to any heuristically-cacheable response with a <code>Last-Modified</code> header, regardless of status code — the codeTab above applies it identically to both. What’s status-code-specific is only the separate, binary question of whether heuristic caching is permitted for that status code AT ALL.',
  },
  {
    thought: 'RFC 9111 specifies exactly how long a 410 response should be cached when there is no Last-Modified header at all.',
    reality: 'It does not — the 10% formula only applies when a <code>Last-Modified</code> value exists to compute an age from. In its absence, the actual fallback duration is genuinely up to the cache implementation’s own policy (illustrated as a clearly-labeled, non-spec-mandated example in the second codeTab above), not a value RFC 9111 itself prescribes.',
  },
];

@Component({
  selector: 'app-api-error-response-caching',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './404-and-410-are-both-heuristically-cacheable.html',
  styleUrl: './404-and-410-are-both-heuristically-cacheable.scss',
})
export class Http404And410AreBothHeuristicallyCacheableSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
