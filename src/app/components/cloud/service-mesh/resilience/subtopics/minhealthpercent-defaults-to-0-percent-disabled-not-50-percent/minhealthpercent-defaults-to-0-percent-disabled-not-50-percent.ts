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
  templateUrl: './minhealthpercent-defaults-to-0-percent-disabled-not-50-percent.html',
  styleUrl: './minhealthpercent-defaults-to-0-percent-disabled-not-50-percent.scss'
})
export class MinhealthpercentDefaultsTo0PercentDisabledNot50PercentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A real inaccuracy caught during this batch: the main page\'s own QnA claimed the wrong default',
      points: [
        'The main page\'s QnA on <code>minHealthPercent</code> originally stated: "<code>minHealthPercent</code> (default 50%) is an emergency brake..." Verified directly against Istio\'s own DestinationRule reference documentation, this default is wrong — the actual default is <strong>0%</strong>, meaning the safety valve is OFF unless explicitly configured. The main page has been corrected.',
      ]
    },
    {
      heading: 'What the 0% default actually means: this safety valve does nothing unless you turn it on',
      points: [
        'Istio\'s own documentation explains the reasoning directly: <code>minHealthPercent</code> defaults to 0% specifically because it "is not typically applicable in k8s environments with few pods per service" — a sensible default for HashiCorp/VM-style deployments with many replicas, but one that leaves the safety-valve behavior completely inactive out of the box for a typical Kubernetes service.',
        'A team relying on the main page\'s ORIGINAL (incorrect) claim — assuming a 50% floor already existed by default — would have believed their outlier detection already had cascading-failure protection it does not actually have, unless they had explicitly set <code>minHealthPercent</code> themselves.',
      ]
    },
    {
      heading: 'What minHealthPercent actually does when configured: a more complete behavior than "stop ejecting"',
      points: [
        'The precise mechanism, per Istio\'s own docs: when the percentage of healthy hosts in the pool drops below <code>minHealthPercent</code>, outlier detection is DISABLED entirely, and the proxy load-balances across ALL hosts — healthy and unhealthy alike. This is a stronger statement than "no more new ejections" — it means already-ejected hosts are brought BACK into rotation too, since the ejection mechanism itself switches off.',
        'The practical takeaway: if cascading-failure protection via <code>minHealthPercent</code> is desired (and for most production Kubernetes services, it is worth having explicitly), it must be set as a real value in the DestinationRule — never assume it is already providing a floor "by default."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Without minHealthPercent: no safety valve exists',
      language: 'bash',
      code: `apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: catalog
spec:
  host: catalog
  trafficPolicy:
    outlierDetection:
      consecutiveGatewayErrors: 5
      maxEjectionPercent: 90
      # minHealthPercent NOT set -- defaults to 0%, meaning OFF

# During a widespread failure where most pods start failing:
# outlier detection keeps ejecting pods up to maxEjectionPercent
# (90%) with NO earlier safety brake -- minHealthPercent being
# unset does NOT provide any implicit floor.`,
    },
    {
      label: 'Explicitly setting minHealthPercent for real protection',
      language: 'bash',
      code: `apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: catalog
spec:
  host: catalog
  trafficPolicy:
    outlierDetection:
      consecutiveGatewayErrors: 5
      maxEjectionPercent: 90
      minHealthPercent: 30    # explicit -- now genuinely active

# NOW: if ejecting the next unhealthy pod would drop the
# healthy-pod percentage below 30%, outlier detection disables
# itself entirely -- traffic falls back to ALL pods (healthy
# and unhealthy) rather than continuing to shrink the pool.
# This is what the main page's ORIGINAL QnA incorrectly implied
# was already happening by default at 50%.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team reads that minHealthPercent provides a 50% default safety floor and, based on that assumption, configures outlierDetection with consecutiveGatewayErrors and maxEjectionPercent but never sets minHealthPercent explicitly, believing the 50% floor is already active. During an incident, outlier detection ejects 85% of pods before the situation stabilizes. Was their assumption correct, and what should the configuration have included?',
    hint: 'What is the actual default value of minHealthPercent when it is not explicitly set in a DestinationRule?',
    solution: 'Their assumption was incorrect — minHealthPercent defaults to 0%, not 50%, meaning the safety valve is OFF by default. With no explicit minHealthPercent set, there was no floor at all preventing outlier detection from continuing to eject pods (up to whatever maxEjectionPercent allowed), which is exactly what happened at 85%. The configuration should have explicitly included minHealthPercent set to a real value (e.g. 30 or 50) — only an explicit setting activates the behavior of disabling outlier detection (and restoring all pods to rotation) once the healthy-pod percentage would drop below that threshold.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'minHealthPercent has a default value of 50%, providing baseline cascading-failure protection even in a DestinationRule that never explicitly sets it.',
      reality: 'Per this subtopic\'s theory (a genuine inaccuracy caught and corrected on the main page during this batch), the actual default is 0% — meaning this safety valve is OFF unless explicitly configured with a real value.'
    },
    {
      thought: 'When minHealthPercent\'s threshold is crossed, outlier detection simply stops ejecting any NEW hosts, while already-ejected hosts remain excluded from the pool.',
      reality: 'Per this subtopic\'s theory, crossing the threshold disables outlier detection ENTIRELY — already-ejected hosts are restored to rotation too, since the proxy falls back to load-balancing across all hosts, healthy and unhealthy, not just halting further ejections.'
    },
    {
      thought: 'Since minHealthPercent is described as a "safety valve" in Istio\'s documentation, it is reasonable to assume it behaves like other safety defaults in the platform and is enabled unless explicitly disabled.',
      reality: 'Per this subtopic\'s theory, Istio\'s own documentation explains the opposite reasoning — the 0% default exists specifically because this floor is "not typically applicable in k8s environments with few pods per service," meaning it must be deliberately opted into, not assumed active.'
    }
  ];
}
