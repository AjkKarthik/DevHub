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
  templateUrl: './revision-uninstall-checks-active-proxies-not-namespace-labels.html',
  styleUrl: './revision-uninstall-checks-active-proxies-not-namespace-labels.scss'
})
export class RevisionUninstallChecksActiveProxiesNotNamespaceLabelsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s canary-upgrade sequence ends with an uninstall step, presented as safe once "all namespaces are migrated"',
      points: [
        'The main page\'s "Canary Upgrade" code sample ends with: "Step 5: After validating all namespaces, remove old revision: <code>istioctl uninstall --revision 1-21-0</code>." This reads as safe once you\'ve manually confirmed every namespace has moved on — it doesn\'t describe what safety check (if any) the uninstall command itself performs before removing that revision\'s control plane.',
      ]
    },
    {
      heading: 'What the uninstall command actually checks: live proxies, not namespace labels',
      points: [
        '<code>istioctl uninstall --revision</code> does include a safety check — it looks for PROXIES (running sidecars) still connected to and using the specified revision\'s control plane, and warns if any are found. This genuinely protects against removing a revision that\'s actively serving live traffic somewhere.',
        'What this check does NOT reliably cover: a namespace still LABELED with the old revision (<code>istio.io/rev=1-21-0</code>) but which happens to have ZERO running pods at the exact moment the uninstall runs — no active proxy exists yet to trigger the warning, even though the namespace\'s own configuration would inject the next pod created there from that same, soon-to-be-deleted revision.',
      ]
    },
    {
      heading: 'The practical risk: a scaled-to-zero (or between-deployments) namespace slips through',
      points: [
        'This is a genuine, documented gap — the safety check is proxy-based (live, currently-connected sidecars), not label-based (static namespace configuration) — so a namespace mid-deployment, temporarily scaled to zero, or simply between rollouts at uninstall time produces no warning at all, even though it still points at the revision about to be removed.',
        'The safe discipline, beyond what the main page\'s own "after validating all namespaces" step implies: explicitly check namespace LABELS across the whole cluster for the revision being removed (<code>kubectl get namespaces -l istio.io/rev=1-21-0</code>), not just trust that the uninstall command\'s own live-proxy warning would catch every affected namespace — move any remaining labeled namespaces to a different revision (or the default) FIRST, independent of whether they currently have any running pods.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The gap: a labeled-but-empty namespace produces no warning',
      language: 'bash',
      code: `# Namespace "batch-jobs" is labeled for the old revision, but
# currently has zero running pods (e.g. a CronJob-only namespace
# between scheduled runs, or scaled to zero for cost reasons)
kubectl get namespace batch-jobs --show-labels
# istio.io/rev=1-21-0

kubectl get pods -n batch-jobs
# No resources found -- nothing running right now

# Uninstalling the old revision -- the live-proxy check finds
# NOTHING to warn about in batch-jobs, since there's no running
# proxy connected to 1-21-0 from that namespace at this moment:
istioctl uninstall --revision 1-21-0 -y
# (no warning mentions batch-jobs at all)

# Days later, a scheduled CronJob run creates a new pod in
# batch-jobs -- it's still labeled istio.io/rev=1-21-0, but that
# control plane no longer exists:
kubectl get pods -n batch-jobs
# batch-job-xyz   0/1   Init:Error   -- injection webhook for
# revision 1-21-0 can't find its control plane; sidecar init fails`,
    },
    {
      label: 'The safe discipline: check labels explicitly, not just live proxies',
      language: 'bash',
      code: `# Before uninstalling a revision, check labels across the WHOLE
# cluster -- not just currently-running proxies:
kubectl get namespaces -l istio.io/rev=1-21-0

# NAME          STATUS   AGE
# batch-jobs    Active   45d    <- still labeled, even with 0 pods
# staging       Active   90d

# Move EVERY labeled namespace off the old revision first,
# regardless of whether it currently has any running pods:
kubectl label namespace batch-jobs istio.io/rev=1-22-0 --overwrite
kubectl label namespace staging istio.io/rev=1-22-0 --overwrite

# THEN confirm zero namespaces remain on the old revision:
kubectl get namespaces -l istio.io/rev=1-21-0
# No resources found -- now safe to actually uninstall

istioctl uninstall --revision 1-21-0 -y`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team completes a canary migration, checks istioctl proxy-status (all synced to the new revision) and runs istioctl uninstall --revision 1-21-0, which completes with no warnings. A week later, a low-traffic namespace that only runs a nightly batch job — scaled to zero the rest of the day — starts failing that job with a sidecar injection error. The namespace was never mentioned in any migration step. Why did the uninstall not catch this, and what should the team have checked beforehand?',
    hint: 'Does istioctl uninstall --revision\'s safety check look at namespace LABELS across the cluster, or at currently-running PROXIES connected to that revision?',
    solution: 'The uninstall command\'s safety check is based on live, currently-connected proxies — at the moment of uninstall, the batch-job namespace had zero running pods (scaled to zero between nightly runs), so there was no active proxy to trigger a warning, even though the namespace was still labeled istio.io/rev=1-21-0. The uninstall proceeded cleanly because nothing was actively using that revision at that exact moment. The team should have explicitly checked namespace LABELS across the entire cluster (kubectl get namespaces -l istio.io/rev=1-21-0) before uninstalling, not relied solely on the uninstall command\'s own live-proxy check or on istioctl proxy-status (which similarly only reflects currently-running proxies) — a labeled-but-momentarily-empty namespace is exactly the kind of gap that check misses.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'istioctl uninstall --revision\'s built-in safety check examines every namespace still labeled with that revision, so completing the uninstall with no warnings means no namespace is still configured to use it.',
      reality: 'Per this subtopic\'s theory, the safety check is based on live, currently-connected PROXIES, not namespace labels — a namespace still labeled for the old revision but with zero running pods at uninstall time produces no warning at all.'
    },
    {
      thought: 'istioctl proxy-status showing all proxies synced to the new revision is sufficient confirmation that no namespace anywhere is still configured to use the old revision.',
      reality: 'Per this subtopic\'s theory, proxy-status only reflects currently-RUNNING proxies — a namespace with no active pods at that moment (scaled to zero, between deployments) has no proxy to show up in that status at all, even though its own label configuration is unchanged.'
    },
    {
      thought: 'A namespace that runs infrequently (e.g. only a nightly batch job) is low-risk during a revision uninstall, since it spends most of its time with no running pods anyway.',
      reality: 'Per this subtopic\'s theory, infrequent-running namespaces are actually HIGHER risk for this specific gap — they are more likely to have zero pods at the exact moment an uninstall runs, meaning the live-proxy check is least likely to catch them, while their next scheduled run will still fail once the revision they\'re labeled for no longer exists.'
    }
  ];
}
