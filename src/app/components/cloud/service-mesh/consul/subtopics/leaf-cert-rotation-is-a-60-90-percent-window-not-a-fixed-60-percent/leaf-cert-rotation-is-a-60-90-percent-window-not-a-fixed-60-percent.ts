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
  templateUrl: './leaf-cert-rotation-is-a-60-90-percent-window-not-a-fixed-60-percent.html',
  styleUrl: './leaf-cert-rotation-is-a-60-90-percent-window-not-a-fixed-60-percent.scss'
})
export class LeafCertRotationIsA6090PercentWindowNotAFixed60PercentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A precision claim worth checking before writing an exact rotation-timing runbook',
      points: [
        'The main page originally described consul-dataplane\'s leaf-certificate rotation as happening "before expiry (at 60% of TTL)" — phrasing that reads as a single, fixed trigger point. Checking this against Consul\'s own documentation, the real behavior is a RANGE, not a fixed point. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: refresh happens somewhere in a 60%–90% window, deliberately jittered',
      points: [
        'Consul\'s own leaf-certificate documentation states certificates are refreshed once "between 60% and 90%" of their configured lifetime has elapsed — not at a single fixed 60% mark. With the default 72-hour leaf TTL, that\'s a refresh window roughly between the 43.2-hour and 64.8-hour marks after issuance, not one specific hour.',
        'This is a deliberate design choice, not an implementation looseness: jittering the refresh point within a window (rather than every proxy refreshing at the exact same fraction of its TTL) spreads out CA request load — if every one of thousands of proxies in a mesh refreshed at the identical 60%-of-TTL instant, the Consul CA (or Vault PKI backend) would see a synchronized request spike instead of smoothly distributed load.',
      ]
    },
    {
      heading: 'Why "fixed 60%" vs. "60%–90% window" changes how you reason about cert lifetime',
      points: [
        'If you were debugging "why did this proxy\'s cert refresh happen at hour 50 instead of the expected hour 43.2 (60% of a 72-hour TTL)," the fixed-60%-point framing would make that look like a bug. Knowing the real window is 60%–90% (43.2–64.8 hours), a refresh at hour 50 is completely normal, expected behavior — not a symptom of anything wrong.',
        'This same jittered-window principle is common across many distributed systems\' cert/token refresh logic (Kubernetes\' own kubelet certificate rotation uses a similar jittered-window approach) — recognizing the pattern helps you avoid mis-diagnosing similar "why isn\'t this happening at exactly the expected instant" questions elsewhere.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Observing the jittered refresh window in practice',
      language: 'bash',
      code: `# Default leaf cert TTL: 72 hours
# Refresh window: 60%-90% of TTL elapsed = hours 43.2 to 64.8
# NOT a single fixed point at hour 43.2 (60%)

# Check the configured leaf cert TTL:
consul connect ca get-config | grep -i leafcertttl

# Watch a proxy's actual cert issuance/refresh timestamps
# across several rotations -- expect DIFFERENT elapsed times
# each cycle, all falling somewhere in the 60%-90% window,
# not landing on the identical fraction every time:
consul connect ca get-config
kubectl logs <consul-dataplane-pod> -n consul | grep -i "cert"

# This jitter is intentional -- it spreads CA request load
# across many proxies instead of synchronizing them.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An SRE, working from the main page\'s original (now-corrected) "rotates at 60% of TTL" claim, sets up an alert that fires if a proxy\'s cert has NOT refreshed by exactly 60% of its 72-hour TTL (43.2 hours). The alert fires constantly on healthy proxies. What\'s the most likely explanation?',
    hint: 'Is 60% of TTL the ONLY valid refresh point, or one edge of a wider window?',
    solution: 'The alert is very likely miscalibrated based on an incorrect assumption. Consul\'s real behavior refreshes leaf certs somewhere in a 60%–90% window of elapsed lifetime, deliberately jittered per-proxy to spread out CA request load — not at a single fixed 60% instant. A healthy proxy refreshing at, say, hour 55 or hour 60 (both within the 43.2–64.8-hour window for a 72-hour TTL) is completely normal and expected, not a fault. The SRE should widen the alert threshold to the full 60%–90% window (or better, alert only on certs that exceed 90% without refreshing, since that\'s the actual point something is wrong) rather than expecting every proxy to refresh at the same fixed fraction of its TTL.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'consul-dataplane refreshes a proxy\'s leaf certificate at a single fixed point — exactly 60% of its TTL.',
      reality: 'Per this subtopic\'s theory (a precision claim corrected on the main page during this batch), the real refresh point is jittered somewhere within a 60%–90% window of elapsed lifetime, not a fixed 60% instant.'
    },
    {
      thought: 'The jitter in Consul\'s cert refresh timing is just implementation looseness, not a deliberate design choice.',
      reality: 'Per this subtopic\'s theory, the window is deliberate — it spreads CA request load across many proxies rather than synchronizing every proxy in the mesh to refresh at the identical instant.'
    },
    {
      thought: 'A proxy cert refreshing later than the expected "60% of TTL" point is a sign something is wrong.',
      reality: 'Per this subtopic\'s theory, any refresh within the 60%–90% window is normal, healthy behavior — only a cert that exceeds 90% of its TTL without refreshing indicates an actual problem worth alerting on.'
    }
  ];
}
