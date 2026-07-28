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
  templateUrl: './kia0201-is-duplicate-destinationrules-not-missing-subset.html',
  styleUrl: './kia0201-is-duplicate-destinationrules-not-missing-subset.scss'
})
export class Kia0201IsDuplicateDestinationRulesNotMissingSubsetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine, double inaccuracy caught during this batch — the main page contradicted itself too',
      points: [
        'The main page\'s quiz asked which code indicates "a VirtualService is routing to a non-existent subset" and answered <strong>KIA0201</strong>. Separately, the main page\'s own "mistakes" block showed Kiali displaying a DIFFERENT message text for that same code: "KIA0201 - VirtualService has no route for host." Neither description matches Kiali\'s actual, real KIA0201 check — and the two main-page mentions did not even agree with EACH OTHER on what KIA0201 means. The main page has been corrected in both places.',
      ]
    },
    {
      heading: 'The reality, verified against Kiali\'s own validation documentation',
      points: [
        '<strong>KIA0201</strong> actually means: "More than one DestinationRule for the same host/subset combination" — a WARNING about duplicate/conflicting DestinationRule resources, not a missing-subset error at all.',
        'The check that actually corresponds to a VirtualService referencing a subset that doesn\'t exist in any DestinationRule is a DIFFERENT code entirely: <strong>KIA1107 — "Subset not found."</strong> Its real description: "The subsets referred in a VirtualService have to be defined in one DestinationRule" — this is the check that fires for the exact scenario the main page\'s quiz and mistakes-block example were both describing.',
      ]
    },
    {
      heading: 'Why getting the exact code wrong matters in practice, not just as trivia',
      points: [
        'Kiali\'s validation codes are the precise, greppable identifiers teams use in CI/CD pipelines, runbooks, and alerting rules — a script that filters Kiali validation API output for `"code": "KIA1107"` to catch missing-subset errors would silently never match if someone had instead configured it (based on incorrect documentation) to look for `"KIA0201"`.',
        'Practical takeaway: when documenting or automating around a specific error code from any tool\'s validation/linting system, verify the EXACT code against that tool\'s own current documentation or source — a plausible-sounding code number attached to an accurate-sounding description is not the same as the actually-correct pairing.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The REAL KIA1107 -- missing subset (what the main page\'s example actually describes)',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment
spec:
  hosts:
  - payment
  http:
  - route:
    - destination:
        host: payment
        subset: canary   # <- "canary" subset never defined below
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment
spec:
  host: payment
  subsets:
  - name: v1
    labels:
      version: v1
  # NOTE: no "canary" subset defined here at all
EOF

# Kiali's REAL validation output for this exact scenario:
# {
#   "code": "KIA1107",
#   "message": "Subset not found",
#   "severity": "error"
# }`,
    },
    {
      label: 'The REAL KIA0201 -- a completely different problem: duplicate DestinationRules',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment-primary
spec:
  host: payment
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payment-canary-override   # SAME host, DIFFERENT resource
spec:
  host: payment
  subsets:
  - name: canary
    labels:
      version: canary
EOF

# Kiali's REAL validation output for THIS scenario:
# {
#   "code": "KIA0201",
#   "message": "More than one DestinationRules for the
#                same host subset combination",
#   "severity": "warning"
# }
# Two separate DestinationRule resources both target the
# "payment" host -- Kiali flags this as ambiguous/risky,
# even though each one individually looks valid.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes a CI/CD pipeline step that fails the build if Kiali\'s validation API returns any entry with "code": "KIA0201", believing this catches VirtualServices that route to non-existent subsets (based on documentation they read). During testing, they deliberately introduce a VirtualService referencing a subset that doesn\'t exist anywhere — and the pipeline step passes cleanly, with no failure. What went wrong?',
    hint: 'Is KIA0201 actually the check that fires for a missing/non-existent subset reference, or does it check for something else entirely?',
    solution: 'The pipeline is checking for the wrong code — KIA0201 is not the "missing subset" check at all; it fires for a completely different scenario (more than one DestinationRule targeting the same host/subset combination). The check that actually fires for a VirtualService referencing a non-existent subset is KIA1107 ("Subset not found"). Since the deliberately-broken VirtualService in the test never triggers KIA0201 (there was only one DestinationRule involved, not a duplicate), the pipeline step found nothing to flag and passed — even though a real, catchable misconfiguration was present. The fix is updating the CI/CD check to filter for "code": "KIA1107" instead.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'KIA0201 is the Kiali validation code for a VirtualService referencing a subset that does not exist in any DestinationRule.',
      reality: 'Per this subtopic\'s theory (a genuine double inaccuracy caught and corrected on the main page during this batch), KIA0201 actually means something entirely different — more than one DestinationRule targeting the same host/subset combination. The real "subset not found" code is KIA1107.'
    },
    {
      thought: 'Since the main page mentioned "KIA0201" in two different places (a quiz and a mistakes-block example) with two different descriptions, at least one of those descriptions must be the correct one.',
      reality: 'Per this subtopic\'s theory, BOTH mentions were inaccurate — neither of the main page\'s two different descriptions for "KIA0201" matched the code\'s actual, real meaning, and they did not even agree with each other.'
    },
    {
      thought: 'A validation error code and its severity level (error vs. warning) are minor implementation details not worth verifying precisely when documenting or automating around them.',
      reality: 'Per this subtopic\'s theory, an exact code (and by extension its real severity) is exactly the kind of specific, automatable detail where an error is not cosmetic — a CI/CD check filtering for the wrong code silently fails to catch the real problem it was built to catch, with no indication anything is wrong until the underlying misconfiguration causes a production incident.'
    }
  ];
}
