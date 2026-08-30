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
  templateUrl: './mma-agent-fully-retired-defender-servers-now-agentless.html',
  styleUrl: './mma-agent-fully-retired-defender-servers-now-agentless.scss'
})
export class MmaAgentFullyRetiredDefenderServersNowAgentlessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page originally described an ongoing transition — but that transition finished, and a hard cutoff date has since passed',
      points: [
        'The main page\'s own theory originally framed this as an in-progress migration: "The newer AMA is replacing the legacy MMA." This phrasing suggests both agents remain viable side by side, with AMA simply the recommended newer option — a reasonable-sounding but now outdated description.',
        'The actual status is more final and more urgent than "replacing": the Log Analytics Agent (MMA/OMS) was fully retired on a specific, already-passed date, with consequences that recently became active.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own migration documentation: MMA is retired, unsupported, and now has an active data-loss cutoff',
      points: [
        'Per Microsoft\'s own documentation: "The Log Analytics agent was retired on August 31, 2024." Since that date: "You can\'t install the Log Analytics agent from the Azure portal," "Microsoft doesn\'t support the Log Analytics agent," and "The Log Analytics agent no longer receives new distributions or service packs."',
        'A second, more urgent deadline has since arrived: "After March 2, 2026, data upload from the Log Analytics agent can stop at any time without further notice." As of any date after that cutoff, an organization still running MMA agents isn\'t just unsupported — its actual telemetry ingestion can silently stop at any moment, with no warning.',
        'This matters specifically for Defender for Cloud: "If you use Defender for Servers Plan 2, change your agent deployment in Defender for Cloud from the Log Analytics agent to agentless scanning." This is a more significant change than "install a different agent" — Plan 2\'s vulnerability and secrets detection for VMs moved to an agentless model entirely, not a like-for-like agent swap to AMA.',
      ]
    },
    {
      heading: 'What this means for an environment that hasn\'t migrated yet',
      points: [
        'An environment still relying on MMA for Defender for Servers Plan 2 signals is at risk of a real, silent security-visibility gap — not a deprecation warning, but a live possibility that data simply stops arriving with zero notice, precisely because the shutdown is explicitly "without further notice."',
        'The fix isn\'t a straight agent swap: Defender for Servers Plan 2\'s own vulnerability/secrets scanning has moved to agentless scanning specifically, while any OTHER custom security event collection that still needs in-VM telemetry should move to Azure Monitor Agent (AMA) configured via Data Collection Rules (DCRs) — a genuinely different configuration model from MMA\'s workspace-based setup.',
        'Microsoft provides purpose-built tooling for this exact migration — an "Azure Monitor Agent Migration Helper workbook" to inventory remaining MMA agents and a "DCR Config Generator" to convert existing MMA workspace configuration into the DCR format AMA requires — worth using rather than reconfiguring from scratch.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking Defender for Servers agent dependency',
      language: 'bash',
      code: `# Check current Defender for Servers plan and sub-plan settings
az security pricing show --name VirtualMachines \\
  --query "{tier:pricingTier, subPlan:subPlan}"

# If still configured for agent-based scanning under Plan 2, the
# fix is NOT "install AMA instead of MMA" -- Defender for Servers
# Plan 2's vulnerability/secrets detection moved to AGENTLESS
# scanning specifically. Enable it via:
az security pricing create \\
  --name VirtualMachines \\
  --tier Standard \\
  --sub-plan P2

# Agentless scanning requires no agent installation on the VM at
# all -- it inspects VM disks directly via the Azure platform,
# distinct from both MMA and AMA.`,
    },
    {
      label: 'Migrating remaining custom telemetry from MMA to AMA',
      language: 'bash',
      code: `# For any OTHER custom security event collection still depending
# on MMA (not Defender's own vulnerability scanning), migrate to
# AMA via Data Collection Rules:

# 1. Inventory remaining MMA agents (Microsoft's own tooling):
#    Azure Monitor Agent Migration Helper workbook -- shows agent
#    count, workspace usage, and per-solution migration guidance.

# 2. Convert existing MMA workspace config to DCR format:
#    DCR Config Generator -- automates the conversion rather than
#    hand-authoring new Data Collection Rules from scratch.

# 3. Deploy AMA + DCR association at scale via Azure Policy:
az policy assignment create \\
  --name deploy-ama-dcr \\
  --policy "<built-in-AMA-deployment-policy-id>" \\
  --scope "/subscriptions/{subscription-id}"

# 4. Only after validating AMA data collection matches MMA's
#    (compare Heartbeat table records, check for data gaps), remove
#    MMA using Microsoft's own MMA Discovery and Removal tool.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An organization\'s security team notices Defender for Cloud alerts for a specific VM have simply stopped appearing over the past few weeks, with no error or warning anywhere in the portal. Investigation shows the VM still has the legacy Log Analytics Agent (MMA) installed and was never migrated to Azure Monitor Agent or agentless scanning. Is this consistent with a known, documented behavior, and what should the team check first?',
    hint: 'Check the exact retirement and data-upload cutoff dates Microsoft has published for the Log Analytics Agent, and whether Defender for Servers Plan 2 specifically requires a different migration path than "install AMA instead."',
    solution: 'Yes, this is consistent with documented behavior. Per Microsoft\'s own migration guidance, "the Log Analytics agent was retired on August 31, 2024," and "after March 2, 2026, data upload from the Log Analytics agent can stop at any time without further notice." A VM still running MMA past that cutoff can have its telemetry silently stop with zero warning — exactly the symptom described. The team\'s first check should be confirming the VM\'s current agent status and Defender for Servers plan configuration; the fix for Defender for Servers Plan 2 specifically is enabling agentless scanning (not simply installing AMA as a drop-in MMA replacement), while any other custom telemetry needs should move to AMA configured via Data Collection Rules.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The Log Analytics Agent (MMA) is being gradually phased out in favor of Azure Monitor Agent, but it still works fine as a supported option today for teams that haven\'t migrated yet.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the Log Analytics agent "was retired on August 31, 2024" and is no longer supported — and as of a subsequent cutoff date, its data upload "can stop at any time without further notice," meaning it is an active reliability risk, not a stable legacy option.'
    },
    {
      thought: 'Migrating away from MMA for Defender for Servers Plan 2 just means installing Azure Monitor Agent instead — a like-for-like agent swap.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states Defender for Servers Plan 2 specifically moved to agentless scanning for vulnerability and secrets detection — a fundamentally different model than any installed agent, not a simple MMA-to-AMA substitution.'
    },
    {
      thought: 'If Log Analytics Agent telemetry silently stops arriving, it would show up as an error or explicit failure notification somewhere in the Azure portal.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation explicitly describes this cutoff as happening "without further notice" — there is no guaranteed warning, making proactive migration (rather than waiting for a visible failure) the only reliable approach.'
    }
  ];
}
