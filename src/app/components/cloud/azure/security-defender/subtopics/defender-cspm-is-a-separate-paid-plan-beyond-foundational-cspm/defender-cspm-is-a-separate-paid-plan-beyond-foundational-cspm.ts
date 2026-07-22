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
  templateUrl: './defender-cspm-is-a-separate-paid-plan-beyond-foundational-cspm.html',
  styleUrl: './defender-cspm-is-a-separate-paid-plan-beyond-foundational-cspm.scss'
})
export class DefenderCspmIsASeparatePaidPlanBeyondFoundationalCspmSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes a clean two-tier split that\'s missing a whole middle tier',
      points: [
        'The main page\'s own architecture section frames Defender for Cloud as two layers: "Free tier (CSPM): available to all subscriptions automatically... No cost" and "Defender plans (CWPP): paid per resource type" like Servers, SQL, Containers, and Storage. Reading this, CSPM sounds like it\'s entirely free, and every paid option is a per-workload CWPP plan.',
        'That\'s an incomplete picture. CSPM itself has two tiers, not one — a free tier and a separate, independently-priced paid tier — and the paid CSPM tier is not the same thing as, or bundled with, the per-resource-type Defender plans the main page describes.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own CSPM reference: Foundational CSPM (free) and Defender CSPM (paid) are two distinct plans',
      points: [
        'Per Microsoft\'s own documentation: "Defender for Cloud offers two CSPM plans: Foundational CSPM (free): Enabled by default for all onboarded subscriptions and accounts. Defender CSPM (paid): Provides extra capabilities beyond the foundational CSPM plan." The free tier is real and automatic, exactly as the main page describes — but it has a paid sibling specifically for CSPM, separate from Defender for Servers/SQL/Containers/etc.',
        'What the paid CSPM tier actually adds is substantial and distinct from workload protection: "agentless code-to-cloud containers vulnerability assessment," "agentless discovery for Kubernetes," "agentless VM secrets scanning," "agentless VM vulnerability scanning," "AI security posture management," "attack path analysis," "risk prioritization," "data security posture management (DSPM)," and "external attack surface management (EASM)" — none of which exist in the free Foundational tier at all.',
        'Attack path analysis specifically — visualizing exploitable chains across misconfigurations, like "an internet-facing VM with a vulnerability that has a path to a storage account containing sensitive data" — is one of Defender CSPM\'s signature capabilities, and it requires the paid plan; Secure Score, recommendations, and the compliance dashboard (what the main page\'s theory actually describes in depth) remain in the free Foundational tier.',
      ]
    },
    {
      heading: 'Why this distinction matters when planning what to enable',
      points: [
        'An organization that has only reviewed the main page\'s own coverage might reasonably conclude that Secure Score, recommendations, and compliance reporting are "the free CSPM stuff" and everything paid is workload-specific threat detection (Servers, SQL, Containers) — missing that a genuinely separate posture-management upgrade exists, with its own billing line and its own DevOps-security capabilities (PR annotations, code-to-cloud mapping for containers and IaC) that the main page\'s own Defender for DevOps QnA doesn\'t connect to a specific paid plan requirement.',
        'Per Microsoft\'s own docs: "Advanced DevOps security posture features (pull request annotations, code-to-cloud mapping, attack path analysis, security explorer) require the paid Defender CSPM plan. The free plan provides basic Azure DevOps recommendations." A team expecting the main page\'s described Defender for DevOps PR-annotation workflow to work under the free tier will find only "basic recommendations," not the full feature set.',
        'Billing for Defender CSPM is scoped to specific resource types (VMs, VM scale sets, storage accounts with blob containers or file shares, SQL/PostgreSQL/MySQL servers, Synapse workspaces on Azure — with parallel lists for AWS and GCP), not a flat per-subscription fee — worth checking the specific billable resource list before assuming a cost estimate.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking which CSPM tier is currently active',
      language: 'bash',
      code: `# Foundational CSPM is automatic and free -- no action needed,
# and it's already providing Secure Score, recommendations, and
# the compliance dashboard the main page's own theory describes.

# Check whether the PAID Defender CSPM plan is enabled:
az security pricing show --name CloudPosture \\
  --query "{tier:pricingTier}"

# Enable Defender CSPM (paid) to unlock attack path analysis,
# agentless scanning, risk prioritization, DSPM, and EASM:
az security pricing create \\
  --name CloudPosture \\
  --tier Standard

# This is a SEPARATE plan from Defender for Servers/SQL/Containers
# -- enabling Defender for Servers does NOT also enable Defender
# CSPM, and vice versa. They're billed and enabled independently.`,
    },
    {
      label: 'What Defender CSPM specifically unlocks vs. the free tier',
      language: 'bash',
      code: `# Free Foundational CSPM already includes (per Microsoft's own
# comparison table): asset inventory, Secure Score, security
# recommendations, Microsoft Cloud Security Benchmark, remediation
# tools, workflow automation -- everything the main page's own
# Secure Score / Recommendations section actually describes.

# Defender CSPM (paid) ADDS, with no equivalent in the free tier:
#   - Attack path analysis (exploitable chains across resources)
#   - Agentless VM vulnerability + secrets scanning
#   - Agentless Kubernetes discovery
#   - Risk prioritization (ranks findings by actual exploitability)
#   - Data security posture management (sensitive data discovery)
#   - External attack surface management (EASM)
#   - Full DevOps security: PR annotations, code-to-cloud mapping
#     (free tier gets only "basic Azure DevOps recommendations")

# Confirm current DevOps security feature level:
az security pricing show --name CloudPosture \\
  --query "{tier:pricingTier, extensions:extensions}"`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security team has Defender for Servers and Defender for Containers enabled and paid for, and assumes this also means they have Defender for Cloud\'s full attack path analysis capability, since the main page\'s theory describes paid Defender plans as the "advanced" tier beyond the free CSPM basics. They try to find attack path analysis in the portal and can\'t. What\'s the likely explanation?',
    hint: 'Check whether attack path analysis belongs to a per-resource-type Defender plan (like Servers or Containers) or to a separate CSPM-specific plan.',
    solution: 'The likely explanation is that attack path analysis is a Defender CSPM capability specifically, not something Defender for Servers or Defender for Containers unlock. Per Microsoft\'s own documentation, Defender CSPM is "a separate CSPM plan" from the per-resource-type Defender plans — enabling Defender for Servers or Containers doesn\'t also enable Defender CSPM, since they\'re billed and enabled independently. The team would need to separately enable the Defender CSPM plan (az security pricing create --name CloudPosture --tier Standard) to get attack path analysis, risk prioritization, agentless scanning, and the other capabilities exclusive to that plan.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Defender for Cloud has exactly two tiers: a free CSPM tier (Secure Score, recommendations) and paid Defender plans (Servers, SQL, Containers, Storage) that add workload-specific threat detection.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes CSPM itself as having two plans — free Foundational CSPM and paid Defender CSPM — the latter being separate from and independent of the per-resource-type Defender plans like Servers or Containers.'
    },
    {
      thought: 'Enabling Defender for Servers or Defender for Containers also unlocks Defender CSPM capabilities like attack path analysis, since they\'re all part of the same "Defender plans" family.',
      reality: 'Per this subtopic\'s theory, Defender CSPM is billed and enabled entirely independently — a team can have every per-resource Defender plan active and still not have attack path analysis, agentless scanning, or risk prioritization without separately enabling Defender CSPM.'
    },
    {
      thought: 'Defender for DevOps\' full feature set (PR annotations, code-to-cloud mapping) is available to any subscription with Defender for Cloud enabled, since it\'s a DevOps integration rather than a workload protection plan.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states these "advanced DevOps security posture features... require the paid Defender CSPM plan," while "the free plan provides basic Azure DevOps recommendations" only — the full workflow depends on the same paid CSPM tier, not just connecting a DevOps organization.'
    }
  ];
}
