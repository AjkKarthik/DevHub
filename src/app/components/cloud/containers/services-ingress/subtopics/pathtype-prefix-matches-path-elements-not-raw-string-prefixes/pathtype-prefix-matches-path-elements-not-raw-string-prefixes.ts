import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './pathtype-prefix-matches-path-elements-not-raw-string-prefixes.html',
  styleUrl: './pathtype-prefix-matches-path-elements-not-raw-string-prefixes.scss'
})
export class PathtypePrefixMatchesPathElementsNotRawStringPrefixesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry phrases Prefix matching in a way that reads like a raw string prefix',
      points: [
        'The main page\'s own "Mixing path types Prefix and Exact incorrectly" mistake entry says, for the correct/right example: "For subtrees use Prefix: path: /api, pathType: Prefix # matches /api, /api/users, /api/v2/..." Every example given genuinely does start with the literal characters "/api" followed by a "/" — which is consistent with (but does not rule out) a reader assuming Prefix is simply "does the path start with this string."',
        'Nothing on the main page states the actual boundary rule Kubernetes uses, or gives a counter-example showing where a naive "starts with this string" reading would be WRONG.',
      ]
    },
    {
      heading: 'What Prefix matching actually does: element-wise comparison, split on "/", never a raw substring test',
      points: [
        'Per Kubernetes\' own Ingress documentation, Prefix path matching is "based on a URL path prefix split by \'/\'... matching is case sensitive and done on a path element by element basis" — a "path element" is one segment between slashes, not an arbitrary run of characters.',
        'This means `path: /api, pathType: Prefix` matches `/api`, `/api/`, `/api/users`, `/api/v2/items` — every one of these SHARES the complete `api` element as their first segment — but it does NOT match `/apiv2` or `/application`, even though both of those strings literally start with the characters "/api". Split on "/", `/apiv2`\'s first element is `apiv2`, a completely different, unequal string from `api` — no partial-string credit is given.',
        'This element-wise rule is exactly what prevents `pathType: Prefix, path: /api` from accidentally intercepting traffic meant for an entirely unrelated route like `/apiv2-legacy` or `/application-status` — a genuine, useful safety property of the design that the main page\'s own examples happen to never illustrate, since every one of its own examples is built from a clean `/api/...` sub-path.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Prefix /api matches sub-paths, but not a similarly-spelled sibling route',
      language: 'bash',
      code: `# The main page's own Ingress + TLS code tab uses exactly this rule:
# - path: /api
#   pathType: Prefix
#   backend: { service: { name: api, port: { number: 80 } } }

# Requests that DO match (share the complete "api" path element):
curl https://api.example.com/api          # matches
curl https://api.example.com/api/         # matches
curl https://api.example.com/api/users    # matches
curl https://api.example.com/api/v2/items # matches

# A request that looks similar but does NOT match, because its
# first path element ("apiv2") is a DIFFERENT string from "api" --
# not a shared prefix credit, just two unrelated segments:
curl https://api.example.com/apiv2-legacy/status
# -> falls through to another Ingress rule, or the default backend
#    if nothing else matches -- it is NEVER routed to the "api"
#    backend Service by this /api Prefix rule, despite both paths
#    literally starting with the same four characters "/api"`,
    },
    {
      label: 'Why this makes overlapping-looking rules safe without extra ordering logic',
      language: 'bash',
      code: `# A team defines two SEPARATE Ingress rules, worried that request
# ordering or rule priority might cause one to accidentally "steal"
# traffic meant for the other, since both paths start with "/api":

# rules:
#   - path: /api
#     pathType: Prefix
#     backend: { service: { name: api-v1, port: { number: 80 } } }
#   - path: /apiv2-legacy
#     pathType: Prefix
#     backend: { service: { name: legacy-svc, port: { number: 80 } } }

# Per this subtopic's theory, there was never a real overlap risk
# here at all -- element-wise matching means "/api" and
# "/apiv2-legacy" are on entirely DISJOINT first path elements
# ("api" vs. "apiv2-legacy"), regardless of which rule is listed
# first in the manifest:

curl https://api.example.com/api/orders       # -> always api-v1
curl https://api.example.com/apiv2-legacy/x   # -> always legacy-svc

# A genuinely overlapping pair -- e.g. "/api" and "/api/v2" -- DOES
# require Kubernetes' own separate longest-matching-path precedence
# rule to resolve which one wins; two paths that only share a raw
# character PREFIX without sharing a full path ELEMENT, like this
# example, were never actually competing for the same traffic.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team defines two Ingress rules — <code>pathType: Prefix, path: /api</code> routing to one Service, and <code>pathType: Prefix, path: /apiv2-legacy</code> routing to a different, older Service. Worried that listing <code>/api</code> first in the manifest might cause it to "win" and swallow traffic meant for <code>/apiv2-legacy</code>, they consider reordering the rules or switching one to <code>pathType: Exact</code> to be safe. Using this subtopic\'s theory, is that reordering necessary?',
    hint: 'Split both paths on "/" into their individual elements. Do <code>/api</code> and <code>/apiv2-legacy</code> share a complete first path element, or just the same leading characters?',
    solution: 'No — per this subtopic\'s theory, the reordering (or switching to Exact) is unnecessary, because there was never any real overlap between these two rules to begin with. Prefix matching in Kubernetes is done element-by-element after splitting on "/", not as a raw character-prefix test. Splitting `/api` gives the element `api`; splitting `/apiv2-legacy` gives the element `apiv2-legacy` — these are two completely different, unequal strings as far as element-wise matching is concerned, even though they happen to share the same first four characters when read as plain text. A request to `/apiv2-legacy/anything` was never going to be routed by the `/api` Prefix rule regardless of manifest ordering, because Prefix matching never gives partial credit for a shared character run that isn\'t also a shared complete path element. The team\'s concern would be valid for a GENUINELY overlapping pair like `/api` and `/api/v2` — where Kubernetes\' own longest-matching-path precedence rule does need to resolve which wins — but `/api` and `/apiv2-legacy` were never in that situation at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own <code>pathType: Prefix</code> matches any incoming path that starts with the same characters as the configured prefix — a plain string-prefix test, the way "startsWith" works in most programming languages.',
      reality: 'Per this subtopic\'s theory, Kubernetes\' own documented Prefix matching is element-wise, splitting both the rule\'s path and the incoming request path on "/" and comparing whole segments — `/api` does NOT match `/apiv2`, even though the raw characters "/api" are a literal prefix of "/apiv2", because "api" and "apiv2" are different complete path elements.'
    },
    {
      thought: 'Two Ingress rules whose paths share the same leading characters (like <code>/api</code> and <code>/apiv2-legacy</code>) always need careful ordering or an explicit pathType: Exact to avoid one rule accidentally intercepting traffic meant for the other.',
      reality: 'Per this subtopic\'s exercise, element-wise Prefix matching already prevents this specific kind of accidental interception on its own — paths that share only a character run but not a complete first path element were never actually competing for the same traffic, regardless of rule order.'
    },
    {
      thought: 'Element-wise Prefix matching means a genuinely nested pair like <code>/api</code> and <code>/api/v2</code> also never overlap, the same way <code>/api</code> and <code>/apiv2</code> don\'t.',
      reality: 'Per this subtopic\'s theory, `/api/v2` DOES share a complete matching first element ("api") with the `/api` rule — this is a real overlap case, resolved by Kubernetes\' own separate longest-matching-path precedence rule, unlike the `/apiv2`-style case where the paths never share a full element at all.'
    }
  ];
}
