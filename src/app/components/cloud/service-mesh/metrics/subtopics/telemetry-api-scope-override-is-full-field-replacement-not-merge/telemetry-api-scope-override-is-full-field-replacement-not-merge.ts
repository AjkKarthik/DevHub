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
  templateUrl: './telemetry-api-scope-override-is-full-field-replacement-not-merge.html',
  styleUrl: './telemetry-api-scope-override-is-full-field-replacement-not-merge.scss'
})
export class TelemetryApiScopeOverrideIsFullFieldReplacementNotMergeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s original "additive and composable" phrasing invited the wrong mental model',
      points: [
        'The main page originally described the Telemetry API\'s scope hierarchy as "additive and composable," alongside "mesh-level policies are overridden by namespace-level, which are overridden by workload-level." Read together, "additive and composable" suggests unspecified fields at a narrower scope would still inherit from the broader scope — like CSS cascading, or how many override mechanisms merge partial configuration. This is now tightened on the main page, since the actual mechanics are more absolute than that phrasing implied.',
      ]
    },
    {
      heading: 'The reality, verified against Istio\'s own Telemetry API task guide',
      points: [
        'Per Istio\'s own documentation: "Any fields specified in the namespace configuration will completely override the field from the parent configuration" — and the identical principle applies one level deeper: "Any fields specified in the workload-specific resource will completely override the inherited field configuration from the configuration hierarchy."',
        'Istio\'s own worked example makes the practical consequence concrete: a namespace-scoped Telemetry resource that sets custom tracing tags causes a PARENT tag (like <code>foo: bar</code> configured mesh-wide) to simply disappear for that namespace — "the custom tags behavior completely overrides the behavior configured in the mesh-default... resource," not merges with it.',
        'The scope of "field" here matters: it\'s not the entire Telemetry resource that gets replaced wholesale, it\'s each SPECIFIC field (like the tracing config, or a particular metric override) that a narrower resource touches. But for whichever field IS touched, the replacement is total — none of the broader scope\'s configuration for that field carries over.',
      ]
    },
    {
      heading: 'Why this distinction has real operational consequences',
      points: [
        'A team that sets a namespace-level Telemetry resource intending to ADD one extra custom metric tag — while assuming everything else configured mesh-wide (other tag overrides, sampling rates, disabled metrics) will keep applying automatically — will be surprised when those other mesh-level behaviors silently stop applying to their namespace the moment they touch the SAME field at the narrower scope.',
        'The safe practice: when writing a namespace- or workload-level Telemetry override, treat it as a COMPLETE replacement for whichever fields it touches, not an incremental addition — explicitly re-declare anything from the broader scope that still needs to apply, rather than assuming it carries forward.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Mesh-level baseline (two tag overrides configured)',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: mesh-default
  namespace: istio-system
spec:
  metrics:
  - providers:
    - name: prometheus
    overrides:
    - match:
        metric: REQUEST_COUNT
      tagOverrides:
        customer_tier:
          value: "request.headers['x-customer-tier'] | 'standard'"
        environment:
          value: "'production'"
EOF
# Mesh-wide: every metric gets BOTH customer_tier AND
# environment tags.`,
    },
    {
      label: 'Namespace override -- a SURPRISE: environment tag disappears',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: telemetry.istio.io/v1alpha1
kind: Telemetry
metadata:
  name: checkout-custom
  namespace: checkout
spec:
  metrics:
  - providers:
    - name: prometheus
    overrides:
    - match:
        metric: REQUEST_COUNT
      tagOverrides:
        customer_tier:              # only re-declaring THIS one
          value: "request.headers['x-customer-tier'] | 'standard'"
        # environment tag NOT re-declared here --
EOF
# The team's intent: "keep the mesh default, just confirm
# customer_tier still applies in checkout." The ACTUAL result:
# metrics in the checkout namespace now have customer_tier
# but LOSE the environment tag entirely -- because the
# namespace resource's "overrides" field for REQUEST_COUNT
# completely replaces the mesh-level one, not merges with it.
# To keep BOTH tags, "environment" must be re-declared here too.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A mesh-wide Telemetry resource in istio-system adds two tag overrides to every metric: customer_tier and environment. A team working on the "checkout" namespace applies their own namespace-scoped Telemetry resource, re-declaring only customer_tier because they assume the mesh-wide environment tag will keep applying automatically (since they didn\'t touch it). After deploying, they notice their Grafana dashboards for the checkout namespace no longer show an environment label at all. What happened?',
    hint: 'When a namespace-level Telemetry resource specifies overrides for the SAME metric match (REQUEST_COUNT) as the mesh-level one, does it merge with the parent\'s tagOverrides, or completely replace them?',
    solution: 'The namespace-level Telemetry resource\'s tagOverrides for REQUEST_COUNT completely REPLACED the mesh-level configuration for that same match, rather than merging with it — per Istio\'s own documentation, a narrower-scoped field configuration "completely overrides" the parent, it does not add to it. Since the checkout namespace\'s resource only re-declared customer_tier and never mentioned environment, the environment tag simply stopped being applied to metrics in that namespace — not because it was explicitly removed, but because the entire tagOverrides block for REQUEST_COUNT was replaced by the namespace resource\'s own (incomplete) version. The fix is re-declaring BOTH tag overrides (customer_tier AND environment) in the namespace-level resource, even though only customer_tier needed to change.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A namespace- or workload-level Telemetry resource merges with the broader-scoped configuration — fields you don\'t explicitly set continue inheriting from the parent scope.',
      reality: 'Per this subtopic\'s theory, Istio\'s own documentation explicitly states a narrower-scoped field configuration "completely overrides" the parent for that field — there is no merging. Any field you touch at a narrower scope must be fully re-specified, including parts you intended to keep unchanged.'
    },
    {
      thought: 'Describing the Telemetry API\'s scope hierarchy as "additive and composable" accurately conveys how mesh/namespace/workload configurations combine.',
      reality: 'Per this subtopic\'s theory, "additive" is a misleading way to describe complete field-level replacement — a more accurate framing is that narrower scopes REPLACE (not add to) whichever specific fields they touch, while leaving completely untouched fields to inherit from the broader scope.'
    },
    {
      thought: 'Since the override behavior is "complete," touching ANY part of a namespace\'s Telemetry configuration wipes out ALL mesh-level Telemetry behavior for that namespace, across every metric and field.',
      reality: 'Per this subtopic\'s theory, the override is scoped to the SPECIFIC field being touched (e.g. the tagOverrides for one particular metric match), not the entire Telemetry resource — other untouched fields and other metric matches still inherit normally from the broader scope.'
    }
  ];
}
