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
  templateUrl: './grafana-dashboard-ids-were-mismatched-with-their-actual-names.html',
  styleUrl: './grafana-dashboard-ids-were-mismatched-with-their-actual-names.scss'
})
export class GrafanaDashboardIdsWereMismatchedWithTheirActualNamesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine, fully-verified inaccuracy caught during this batch',
      points: [
        'The main page originally stated: "Istio official dashboards have IDs 7636 (mesh), 7630 (service), 7645 (workload), 7639 (performance)." Verified directly against grafana.com\'s own listing of the official Istio dashboards, EVERY SINGLE one of these four ID-to-name mappings was wrong — not just one typo, but a consistent, systematic mismatch across all four. The main page has been corrected.',
      ]
    },
    {
      heading: 'The correct mapping, verified against grafana.com\'s own dashboard pages',
      points: [
        '<strong>7639</strong> = Mesh Dashboard (the main page called this "performance"). <strong>7636</strong> = Service Dashboard (the main page called this "mesh"). <strong>7630</strong> = Workload Dashboard (the main page called this "service"). <strong>7645</strong> = Control Plane Dashboard (the main page called this "workload"). A fifth dashboard the main page never mentioned at all: <strong>11829</strong> = Performance Dashboard (the ACTUAL performance dashboard — a different ID than what the main page called "performance").',
        'The pattern suggests the four names were shifted by one position relative to their correct IDs (a classic "off-by-one" transcription error) — knowing the shift pattern doesn\'t make any individual wrong pairing less likely to cause real confusion if acted on directly.',
      ]
    },
    {
      heading: 'Why this specific kind of inaccuracy is worth extra caution',
      points: [
        'Numeric IDs are exactly the kind of fact that reads as authoritative and precise, making it LESS likely a reader double-checks it — a prose claim like "Istio has a dashboard for control plane health" invites no particular scrutiny, but "ID 7645" looks like a citable, verified detail. That precision is exactly why the error was worth catching: importing the wrong dashboard by ID silently gives you the wrong panels with no error message.',
        'The concrete lesson for any future subtopic authoring: when a main page states a SPECIFIC identifier (an ID, a port number, a field name, a default value) rather than a general claim, that specificity deserves its own dedicated verification pass against a primary source — a plausible-sounding number is not the same as a correct one.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The corrected ID-to-dashboard mapping',
      language: 'bash',
      code: `# Import these IDs in Grafana (Dashboards → New → Import):

# 7639  -> Istio Mesh Dashboard
#          (global service graph, mesh-wide overview)

# 7636  -> Istio Service Dashboard
#          (per-service golden signals: rate, errors, duration)

# 7630  -> Istio Workload Dashboard
#          (per-pod / per-workload metrics)

# 7645  -> Istio Control Plane Dashboard
#          (Istiod health: pilot_xds_pushes, CSR counts, etc.)

# 11829 -> Istio Performance Dashboard
#          (resource usage of the mesh's own proxies/control plane)

# Verify BEFORE importing at scale:
curl -s https://grafana.com/api/dashboards/7639 | grep '"name"'
# Confirms the dashboard's actual title matches what you expect
# for that ID before rolling it out to a whole team's Grafana.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform engineer, following the main page\'s ORIGINAL (now-corrected) guidance, imports dashboard ID 7645 into Grafana expecting to see per-workload/per-pod metrics for capacity planning. They open the dashboard and instead see panels about pilot_xds_pushes, CSR counts, and Istiod memory usage — nothing about individual workloads at all. Are they looking at the wrong dashboard, or did the import fail?',
    hint: 'Per the corrected mapping verified against grafana.com, which actual dashboard does ID 7645 correspond to?',
    solution: 'The import worked correctly — the engineer is looking at exactly what ID 7645 is supposed to show, but their EXPECTATION was based on the main page\'s original, incorrect claim that 7645 was the "workload" dashboard. 7645 is actually the Istio Control Plane Dashboard, which is why it shows Istiod health metrics (xDS pushes, CSR counts) rather than per-pod workload data. The dashboard they actually wanted — per-workload metrics — is ID 7630. No troubleshooting of the import process is needed; the fix is simply importing the correct ID for what they intended to see.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s listed Grafana dashboard IDs (7636 for mesh, 7630 for service, 7645 for workload, 7639 for performance) are accurate and safe to use directly.',
      reality: 'Per this subtopic\'s theory (a genuine inaccuracy caught and corrected on the main page during this batch), all four of these ID-to-name pairings were wrong — verified against grafana.com\'s own dashboard listings, the correct mapping is entirely different.'
    },
    {
      thought: 'A specific numeric identifier (like a dashboard ID) in written technical content is inherently more trustworthy than a general prose claim, since numbers are precise and hard to get wrong by accident.',
      reality: 'Per this subtopic\'s theory, precision is not the same as correctness — a specific, confident-sounding number can be just as wrong as a vague claim, and its apparent authority can make readers LESS likely to double-check it before acting on it.'
    },
    {
      thought: 'Since the main page got the FOUR dashboard IDs\' names wrong, the numeric IDs themselves (7636, 7630, 7645, 7639) were probably fabricated or don\'t correspond to real Istio dashboards at all.',
      reality: 'Per this subtopic\'s theory, all four numeric IDs are real, valid, official Istio Grafana dashboard IDs — the error was specifically in which NAME was paired with which ID, not in the existence or validity of the IDs themselves.'
    }
  ];
}
