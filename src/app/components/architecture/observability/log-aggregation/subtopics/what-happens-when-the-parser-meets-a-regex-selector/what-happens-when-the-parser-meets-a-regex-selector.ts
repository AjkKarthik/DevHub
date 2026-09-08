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
    heading: 'The Challenge’s Own Scope Note Doesn’t Mean "Fails Cleanly"',
    points: [
      'The main page’s own Challenge, <code>parseStreamSelector()</code>, explicitly scopes itself: "Only handle exact match (=), no regex." That’s a legitimate, disclosed scope limitation, not a bug — but the page’s OWN QnA one section earlier gives a real LogQL query using exactly the syntax the Challenge excludes: <code>{service=~"order|payment"}</code> (a REGEX selector, using <code>=~</code> instead of a bare <code>=</code>). Feeding that exact query into the Challenge’s own reference solution is worth trying, since nothing on the page ever shows what actually happens.',
      'The solution’s parsing logic finds the FIRST <code>=</code> character in each comma-separated pair via <code>indexOf(&#39;=&#39;)</code> — for <code>service=~"order|payment"</code>, that’s the <code>=</code> INSIDE the two-character <code>=~</code> operator, not a delimiter between a clean key and value. The key comes out correct (<code>service</code>), but the value inherits the leftover <code>~</code> character plus only a PARTIALLY-stripped quote, since the value string starts with <code>~</code> (not <code>"</code>), so the leading-quote half of the strip regex never matches.',
      'This isn’t a silent no-op or a clean rejection — it’s a genuinely GARBLED result that looks superficially plausible (a real key, a value that even contains recognizable text) while being wrong in a way that could easily go unnoticed in a real system consuming this function’s output.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Garbled Result, Verified',
    language: 'typescript',
    code: `// The main page's own Challenge solution, unmodified:
function parseStreamSelector(query: string): Record<string, string> {
  const match = query.match(/\\{([^}]*)\\}/);
  if (!match) return {};
  const inner = match[1].trim();
  if (!inner) return {};
  const result: Record<string, string> = {};
  for (const pair of inner.split(',')) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim();
    const val = pair.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
    if (key && val) result[key] = val;
  }
  return result;
}

// The main page's OWN QnA uses exactly this kind of query:
console.log(parseStreamSelector('{service=~"order|payment"}'));
// -> { service: '~"order|payment' }   -- garbled, not a clean {} rejection

// ── FIXED: explicitly detect and skip regex-operator pairs ───────────
function parseStreamSelectorRobust(query: string): Record<string, string> {
  const match = query.match(/\\{([^}]*)\\}/);
  if (!match) return {};
  const inner = match[1].trim();
  if (!inner) return {};
  const result: Record<string, string> = {};
  for (const pair of inner.split(',')) {
    if (pair.includes('=~')) continue; // regex selector -- explicitly out of scope
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim();
    const val = pair.slice(eqIdx + 1).trim().replace(/^"|"$/g, '');
    if (key && val) result[key] = val;
  }
  return result;
}

console.log(parseStreamSelectorRobust('{service=~"order|payment"}'));
// -> {}  -- cleanly recognizes and skips the regex pair
console.log(parseStreamSelectorRobust('{env="production",service=~"order|payment"}'));
// -> { env: 'production' }  -- still correctly parses the exact-match pair alongside it`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The fixed version checks <code>pair.includes(&#39;=~&#39;)</code> BEFORE computing <code>eqIdx</code>. Would checking AFTER — i.e. still computing <code>eqIdx</code> via <code>indexOf(&#39;=&#39;)</code> first, then separately checking whether the character right after <code>eqIdx</code> is <code>&#39;~&#39;</code> — produce the same correct result?',
  hint: 'Trace what <code>eqIdx</code> actually points to for <code>&#39;service=~"order|payment"&#39;</code>, and whether the character immediately following it is reliably the <code>~</code>.',
  solution: `// Yes -- this alternative approach also works correctly, for the same
// underlying reason: indexOf('=') on 'service=~"order|payment"' finds
// the '=' that is itself part of the '=~' operator (position 7), and
// the very next character (position 8) is '~'. Checking
// pair[eqIdx + 1] === '~' right after computing eqIdx catches the same
// case the includes() check does, just via a different code path.
//
// The two approaches are equivalent for THIS specific input shape, but
// they're not equivalent in general: includes('=~') scans the WHOLE
// pair string for that two-character substring anywhere at all, while
// checking pair[eqIdx + 1] only looks at the character immediately
// after the FIRST '='. If a value could ever legitimately CONTAIN the
// literal text "=~" somewhere inside its quoted content (not the case
// for LogQL's own selector syntax, but worth being precise about), the
// two checks could in principle diverge -- includes() would flag it,
// the position-based check might not, depending on where in the string
// it occurs relative to the first '='.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the Challenge’s own hints explicitly say "Only handle exact match (=), no regex," the garbled output for a regex selector is an intentional, documented limitation — not something worth fixing.',
    reality: 'There’s a real difference between "doesn’t SUPPORT regex" (a disclosed scope limit, entirely reasonable) and "produces a plausible-looking but WRONG result when given regex input" (a genuine robustness gap). The Challenge’s own scope note only promises the first; nothing in the page ever claims the function correctly REJECTS out-of-scope input, and the actual behavior — garbling rather than cleanly skipping — is worth knowing about regardless of whether the Challenge itself needs to be marked "wrong."',
  },
  {
    thought: 'A caller that only ever passes queries generated by their OWN code (never hand-written regex selectors) doesn’t need to worry about this gap at all.',
    reality: 'The main page’s own QnA shows exactly this kind of query — <code>{service=~"order|payment"}</code> — as a REALISTIC example of a query someone would write when filtering logs across multiple services, not a contrived edge case. Any tool built around <code>parseStreamSelector()</code> that lets a user paste in or reuse a real LogQL query they’ve already written elsewhere (a saved dashboard query, a query from Grafana Explore) is exactly the scenario where a regex selector shows up naturally.',
  },
  {
    thought: 'The fixed version’s <code>pair.includes(&#39;=~&#39;)</code> check would also incorrectly skip a legitimate exact-match pair whose VALUE happens to contain a literal tilde character, like <code>{path="/api/~backup"}</code>.',
    reality: 'This specific example is safe: <code>includes(&#39;=~&#39;)</code> checks for the two-character sequence <code>=</code> immediately followed by <code>~</code> — in <code>path="/api/~backup"</code>, the <code>~</code> is preceded by <code>/</code>, not <code>=</code>, so the substring <code>=~</code> never actually occurs in that pair at all. The check would only misfire on a value that happened to contain <code>=~</code> as consecutive characters directly after a quote or equals sign, a narrower and much less likely case than a bare tilde appearing anywhere in a path.',
  },
];

@Component({
  selector: 'app-obs-log-aggregation-regex-selector',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './what-happens-when-the-parser-meets-a-regex-selector.html',
  styleUrl: './what-happens-when-the-parser-meets-a-regex-selector.scss',
})
export class WhatHappensWhenTheParserMeetsARegexSelectorSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
