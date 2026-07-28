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
  templateUrl: './trafficsplit-cannot-be-self-referential-apex-needs-its-own-name.html',
  styleUrl: './trafficsplit-cannot-be-self-referential-apex-needs-its-own-name.scss'
})
export class TrafficsplitCannotBeSelfReferentialApexNeedsItsOwnNameSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A real inaccuracy caught during this batch: the main page\'s own TrafficSplit example used a self-referential apex name',
      points: [
        'The main page\'s original "Traffic Split (Canary)" example set <code>spec.service: myapp</code> (the apex/root service clients call) AND listed <code>service: myapp</code> as one of its own backends — using the same name for both. The SMI TrafficSplit specification explicitly documents this exact pattern as prohibited, calling it out by name as "self-referential." The main page has been corrected to use a distinct name (<code>myapp-stable</code>) for the stable backend, separate from the apex.',
      ]
    },
    {
      heading: 'Why self-referential TrafficSplits are explicitly disallowed',
      points: [
        'When a backend shares the apex service\'s own name, that backend becomes a superset containing potentially many different underlying pod versions — SMI\'s own reasoning is that this makes it genuinely hard for anyone reading the TrafficSplit to reason about exactly where traffic is actually going, since one of the "distinct" traffic destinations is ambiguously entangled with the routing decision itself.',
        'The rule is simple and absolute: <code>spec.service</code> (the apex) must never appear as the <code>service</code> value of any entry in <code>spec.backends</code> — every backend, including whatever represents the "stable"/current version, needs its own distinct Kubernetes Service name.',
      ]
    },
    {
      heading: 'The practical pattern: three real Kubernetes Services, not two',
      points: [
        'A correct canary TrafficSplit setup needs THREE separate Kubernetes Service objects: the apex (e.g. <code>myapp</code>, the name clients actually call and the name referenced in <code>spec.service</code>), and two (or more) backend services with their own distinct names (e.g. <code>myapp-stable</code>, <code>myapp-canary</code>) that each select a different set of pods by label.',
        'This is a genuinely easy trap to fall into precisely because it feels natural to reuse the "main" service name for whatever the CURRENT/stable version is — the fix requires deliberately creating an extra, differently-named Service specifically for the stable backend, which many teams don\'t expect to need until they hit exactly this validation concern (or, since Linkerd doesn\'t reject it outright, exactly the reasoning confusion SMI\'s own docs warn about).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Wrong: self-referential apex/backend',
      language: 'bash',
      code: `# Only TWO Kubernetes Services exist: myapp and myapp-canary
# "myapp" is being asked to serve as BOTH the apex AND its own
# "stable" backend -- explicitly prohibited by the SMI spec

apiVersion: split.smi-spec.io/v1alpha1
kind: TrafficSplit
metadata:
  name: myapp-split
spec:
  service: myapp        # apex
  backends:
  - service: myapp       # SAME name as the apex -- self-referential
    weight: 900m
  - service: myapp-canary
    weight: 100m

# The SMI spec's own reasoning: "myapp" as a backend is a superset
# containing potentially multiple pod versions -- readers of this
# TrafficSplit cannot cleanly reason about where the 90% actually goes.`,
    },
    {
      label: 'Correct: three distinct, real Kubernetes Services',
      language: 'bash',
      code: `# THREE Kubernetes Services required:
# 1. myapp          -- the apex, what clients actually call
# 2. myapp-stable    -- selects the current/stable pod version
# 3. myapp-canary    -- selects the new/canary pod version

apiVersion: v1
kind: Service
metadata: { name: myapp-stable }
spec:
  selector: { app: myapp, version: stable }
  ports: [{ port: 8080 }]
---
apiVersion: v1
kind: Service
metadata: { name: myapp-canary }
spec:
  selector: { app: myapp, version: canary }
  ports: [{ port: 8080 }]
---
apiVersion: split.smi-spec.io/v1alpha1
kind: TrafficSplit
metadata:
  name: myapp-split
spec:
  service: myapp          # apex -- distinct from BOTH backends
  backends:
  - service: myapp-stable # distinct name, unambiguous
    weight: 900m
  - service: myapp-canary
    weight: 100m`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team has exactly two Kubernetes Services: "orders" (selecting all order-service pods, both v1 and v2) and "orders-v2" (selecting only the v2 pods). They write a TrafficSplit with spec.service: orders and a backend entry service: orders alongside service: orders-v2, intending a 90/10 split. Is this a valid SMI TrafficSplit, and if not, what needs to change?',
    hint: 'Does the apex service name (spec.service) appear as the name of one of the entries in spec.backends here?',
    solution: 'This is not a valid, well-formed SMI TrafficSplit — it is self-referential, since "orders" is used as both spec.service (the apex) and the name of one of the backend entries, which the SMI specification explicitly documents as prohibited. The fix requires creating a genuinely separate, distinctly-named Kubernetes Service for the stable version — e.g. "orders-stable" — selecting only the v1 pods, and using that name (not "orders") as the stable backend entry. The apex "orders" Service should exist purely as the name clients call and the value of spec.service, never appearing inside spec.backends itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A TrafficSplit\'s apex service (spec.service) can also serve as one of its own backends, since the apex Service already selects the full set of pods including the "stable" ones.',
      reality: 'Per this subtopic\'s theory, this is explicitly prohibited by the SMI specification as a self-referential TrafficSplit — the apex must never appear as a backend, since it creates an ambiguous superset that makes traffic routing hard to reason about.'
    },
    {
      thought: 'A canary rollout with Linkerd TrafficSplit only ever needs two Kubernetes Services — the apex/main one and the new canary version.',
      reality: 'Per this subtopic\'s theory, a correctly-structured TrafficSplit needs THREE distinct Services — the apex, plus a separately-named service for each backend (including whatever represents the "stable" version) — reusing the apex\'s own name for the stable backend is the exact self-referential mistake to avoid.'
    },
    {
      thought: 'Since the main page\'s own original example used a self-referential apex/backend pattern, that pattern must be valid — the documentation wouldn\'t show something that violates the spec.',
      reality: 'Per this subtopic\'s theory, this was a genuine inaccuracy caught and corrected during this batch — the original example was checked directly against the SMI specification\'s own documented prohibition and fixed to use a distinct backend name.'
    }
  ];
}
