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
  templateUrl: './control-plane-can-be-up-to-3-minor-versions-ahead-of-nodes.html',
  styleUrl: './control-plane-can-be-up-to-3-minor-versions-ahead-of-nodes.scss'
})
export class ControlPlaneCanBeUpTo3MinorVersionsAheadOfNodesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA explains WHY control plane upgrades come first, but never HOW FAR node pools are allowed to lag behind before an upgrade is mandatory',
      points: [
        'The main page\'s own QnA states: "The Kubernetes API server on the control plane must always be at a version equal to or newer than the kubelet version running on nodes... within Kubernetes\' supported version skew, typically 2 minor versions... AKS enforces this ordering at the platform level: you cannot upgrade a node pool to a Kubernetes version higher than the control plane\'s current version." This correctly explains the ORDERING rule and cites the general open-source Kubernetes skew policy — but never states AKS\'s own specific enforced limit.',
        'This gap matters operationally: a team that upgrades only the control plane (to test new API features, exactly as the main page\'s own theory recommends as a valid pattern) needs to know exactly how much runway they have before their UN-upgraded node pools become a compliance problem, not just that skew "typically" exists as a concept.',
      ]
    },
    {
      heading: 'AKS documents an exact, specific number: the control plane can run up to THREE minor versions ahead of any node pool',
      points: [
        'Per Microsoft\'s own AKS upgrade documentation: "The control plane can be up to three minor versions ahead of node pools. For example, if your control plane is at 1.35.x, your node pools can be at 1.32.x, 1.33.x, 1.34.x, or 1.35.x." This is AKS\'s own specific, platform-enforced number — distinct from generic upstream Kubernetes version-skew policy, and more generous than the "typically 2" figure the main page\'s own QnA cites for the general Kubernetes concept.',
        'Sequential upgrades are mandatory regardless of how much skew is allowed: "When you upgrade a supported AKS cluster, you can\'t skip Kubernetes minor versions. You must perform all upgrades sequentially by minor version number. For example, upgrades between 1.28.x -> 1.29.x or 1.29.x -> 1.30.x are allowed. 1.28.x -> 1.30.x isn\'t allowed." This applies independently of the skew allowance — a control plane 3 versions ahead of its nodes still cannot jump the NODE POOL itself by more than one minor version in a single upgrade operation once that upgrade is finally performed.',
        'AKS can also silently upgrade node pools on your behalf under specific conditions, a behavior the main page never mentions at all: "AKS might trigger a rolling node pool upgrade alongside a control plane upgrade to keep the cluster compliant and healthy. This upgrade typically occurs when a previous node upgrade failed or left nodes on mixed versions." A team assuming a control-plane-only upgrade NEVER touches node pools could be surprised to see node pool version changes they didn\'t explicitly request.',
        'Control plane upgrades and node pool upgrades have genuinely different typical durations, worth planning around: "Control plane upgrades typically complete within 5-15 minutes... Node pool upgrades take longer as they involve draining and reimaging nodes." A maintenance window sized only for the (usually faster) control plane step can run short if a node pool upgrade is bundled into the same operation.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming current skew before it becomes a problem',
      language: 'bash',
      code: `# Check control plane version
az aks show --resource-group my-rg --name my-aks \\
  --query kubernetesVersion --output tsv
# 1.35.2

# Check every node pool's own version
az aks nodepool list --resource-group my-rg --cluster-name my-aks \\
  --query "[].{Name:name,Version:orchestratorVersion}" --output table
# Name        Version
# ----------  --------
# systempool  1.32.4    <- 3 minor versions behind control plane;
#                          at the MAXIMUM allowed skew per
#                          Microsoft's own docs -- one more
#                          untouched control-plane upgrade and
#                          this pool becomes out of compliance
# userpool    1.34.1    <- 1 minor version behind, comfortable margin`,
    },
    {
      label: 'Upgrading node pools sequentially -- can\'t skip minor versions',
      language: 'bash',
      code: `# Node pool at 1.32.4, control plane at 1.35.2 -- 3-version gap,
# right at the documented maximum
az aks nodepool upgrade \\
  --resource-group my-rg --cluster-name my-aks \\
  --name systempool --kubernetes-version 1.35.2
# FAILS -- per Microsoft's own docs: "You can't skip Kubernetes
# minor versions. You must perform all upgrades sequentially by
# minor version number." 1.32.x -> 1.35.x jumps 3 minor versions
# in one operation -- not allowed, regardless of the skew being
# within the documented 3-version LIMIT.

# Correct: upgrade one minor version at a time
az aks nodepool upgrade --resource-group my-rg --cluster-name my-aks \\
  --name systempool --kubernetes-version 1.33.0
az aks nodepool upgrade --resource-group my-rg --cluster-name my-aks \\
  --name systempool --kubernetes-version 1.34.0
az aks nodepool upgrade --resource-group my-rg --cluster-name my-aks \\
  --name systempool --kubernetes-version 1.35.2`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own recommended pattern of testing new Kubernetes API features via a control-plane-only upgrade, a team upgrades their control plane four separate times over several months — from 1.31 to 1.32, then 1.33, then 1.34, then 1.35 — without ever touching their node pools, which remain at 1.31. Using this subtopic\'s theory, what happens on the next control plane upgrade attempt, or before it?',
    hint: 'Per Microsoft\'s own documentation, is there a maximum number of minor versions the control plane is allowed to be ahead of a node pool — and what happens once that maximum would be exceeded?',
    solution: 'Per this subtopic\'s theory, the team is already at or past the documented limit before attempting anything further. Microsoft\'s own documentation states "the control plane can be up to three minor versions ahead of node pools" — after four control-plane-only upgrades from 1.31 to 1.35 with node pools frozen at 1.31, the gap is FOUR minor versions, one more than AKS allows. In practice, AKS enforces this at the platform level, so at some point before or during that fourth control-plane upgrade, the operation would either be blocked outright, or — per Microsoft\'s own documented behavior — "AKS might trigger a rolling node pool upgrade alongside a control plane upgrade to keep the cluster compliant," silently upgrading the node pools as part of the same operation to bring them back within the allowed 3-version skew, whether or not the team planned or wanted a node pool upgrade at that moment. The lesson is that "control-plane-only" upgrades are not an indefinitely repeatable pattern — node pools eventually have to catch up, on a schedule bounded by the 3-minor-version limit, not on a schedule the team fully controls if they ignore it too long.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The control plane can be any number of minor versions ahead of node pools, as long as it is never BEHIND them.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states an exact, enforced maximum: "The control plane can be up to three minor versions ahead of node pools" — exceeding this limit is not allowed, even though the direction (control plane ahead) is otherwise correct.'
    },
    {
      thought: 'A "control plane only" upgrade pattern can be repeated indefinitely without ever needing to touch node pools, as long as the team never explicitly requests a node pool upgrade.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms AKS "might trigger a rolling node pool upgrade alongside a control plane upgrade to keep the cluster compliant and healthy" — node pools can be upgraded automatically, without an explicit separate request, once staying within the allowed version skew requires it.'
    },
    {
      thought: 'Since the control plane can be up to 3 minor versions ahead, a node pool can jump straight from its current version to match the control plane in a single upgrade operation.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states sequential upgrades are mandatory regardless of the allowed skew: "You can\'t skip Kubernetes minor versions. You must perform all upgrades sequentially by minor version number" — a 3-version gap still requires 3 separate, sequential node pool upgrade operations.'
    }
  ];
}
