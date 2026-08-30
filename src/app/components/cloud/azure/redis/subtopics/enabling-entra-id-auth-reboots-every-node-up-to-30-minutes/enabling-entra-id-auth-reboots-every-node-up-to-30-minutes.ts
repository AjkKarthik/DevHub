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
  templateUrl: './enabling-entra-id-auth-reboots-every-node-up-to-30-minutes.html',
  styleUrl: './enabling-entra-id-auth-reboots-every-node-up-to-30-minutes.scss'
})
export class EnablingEntraIdAuthRebootsEveryNodeUpTo30MinutesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page frames Entra ID authentication as a purely additive security upgrade',
      points: [
        'The main page\'s own "Security & Access" theory presents Entra ID authentication as something you simply turn on instead of using access keys — "use Managed Identity to authenticate to Redis instead of access keys" — with no mention of any operational impact from making that switch on an already-running cache.',
        'Nothing on the main page suggests that enabling this feature, or later disabling access keys once Entra auth is in place, touches the running cache instance itself rather than being a purely configuration-side change.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own documentation: both changes reboot every node and can take up to 30 minutes',
      points: [
        'Per Microsoft\'s own Entra authentication guide, immediately after describing how to enable it: "After the enable operation is finished, the nodes in your cache instance reboot to load the new configuration. We recommend that you perform this operation during your maintenance window or outside your peak business hours. The operation can take up to 30 minutes." This is stated as an unconditional consequence of enabling the feature, not an edge case.',
        'The same warning is repeated verbatim for the separate step of assigning a data access policy through the Data Access Configuration blade — meaning changing WHO has access, not just enabling the feature in the first place, ALSO reboots the cache\'s nodes and can take up to 30 minutes.',
        'Disabling access keys has its own, distinct impact that doesn\'t even require a reboot to hurt: "When you disable access key authentication for a cache, all existing client connections are terminated, whether they use access keys or Microsoft Entra authentication." Every connected client — including ones that were already correctly using Entra tokens — gets dropped at that moment and must reconnect.',
      ]
    },
    {
      heading: 'The cross-cutting trap: geo-replicated caches need an extra unlink/relink dance first',
      points: [
        'Confirmed via the same documentation, a geo-replicated cache (the main page\'s own "Geo-Replication" quick-ref item, described as linking a primary and secondary Premium instance) cannot simply have access keys disabled directly — Microsoft\'s own required procedure is: "1. Unlink the caches. 2. Disable access keys. 3. Relink the caches." Skipping the unlink step is not documented as an option.',
        'This means a security hardening change (moving to Entra-only authentication) on a geo-replicated Premium cache is really a THREE-step operation that touches the cache\'s replication topology, not a single toggle — exactly the kind of interaction between two features the main page covers separately (Security & Access; Geo-Replication) but never connects.',
        'None of this is optional or skippable to avoid downtime — the reboot and the connection termination are the documented mechanism by which the new configuration is loaded, not a side effect of doing it "the slow way." Planning the change for an actual maintenance window, exactly as Microsoft\'s own recommendation states, is the only way to control when the impact happens, not whether it happens.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s framing vs. what actually happens on enable',
      language: 'bash',
      code: `# Main page's own framing: "use Managed Identity to authenticate to
# Redis instead of access keys" -- reads as a config-only change.

# What Microsoft's own docs say actually happens when you enable it
# (Azure portal: Resource menu -> Authentication -> Microsoft Entra
# Authentication tab -> Enable Microsoft Entra Authentication -> Save):
#
#   "After the enable operation is finished, the nodes in your cache
#    instance reboot to load the new configuration... The operation
#    can take up to 30 minutes."
#
# The SAME warning repeats for assigning a data access policy via
# Data Access Configuration -- not just the initial enable step:
#
#   "After the enable operation is finished, the nodes in your cache
#    instance reboot to load the new configuration... up to 30
#    minutes." (Data Access Configuration -> Add -> New Redis User)

# Net effect: BOTH turning the feature on AND granting the first
# user/identity access to it are node-reboot events -- plan for a
# maintenance window each time, not just once.`,
    },
    {
      label: 'Disabling access keys on a geo-replicated cache: the required 3-step order',
      language: 'bash',
      code: `# WRONG -- attempting to disable access keys directly on a
# geo-replicated Premium cache is not the documented path:
# (Portal: Authentication -> Access keys -> Disable Access Keys
#  Authentication -> Save)  <-- skips a required step for geo-replicated caches

# Per Microsoft's own documented procedure for geo-replicated caches,
# the required order is:
#   1. Unlink the caches
az redis server-link delete \\
  --name my-redis-primary --resource-group my-rg \\
  --linked-server-name my-redis-secondary

#   2. THEN disable access keys (only after unlinking)
#      (Portal: Authentication -> Access keys ->
#       Disable Access Keys Authentication -> Save)
#      -- also terminates ALL existing connections, Entra-based ones
#         included, per: "all existing client connections are
#         terminated, whether they use access keys or Microsoft
#         Entra authentication."

#   3. Relink the caches
az redis server-link create \\
  --name my-redis-primary --resource-group my-rg \\
  --linked-server-name my-redis-secondary \\
  --server-role Secondary

# Skipping step 1 is not a documented supported path for a
# geo-replicated cache -- this is a genuinely 3-step operation,
# not a single toggle.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team plans to disable access keys on their production Azure Cache for Redis instance (Premium tier, geo-replicated to a secondary region) during a routine Tuesday-afternoon deploy, expecting a brief, low-risk config change with no downtime since their application already uses Entra ID authentication exclusively. What two things about this plan does Microsoft\'s own documentation contradict?',
    hint: 'Check what disabling access keys does to EVERY existing connection regardless of how it authenticated, and what extra step a geo-replicated cache specifically requires before that toggle can even be applied.',
    solution: 'Two things: first, disabling access keys terminates ALL existing client connections, not just ones still using access keys — per Microsoft\'s own docs, "all existing client connections are terminated, whether they use access keys or Microsoft Entra authentication," so even a fully Entra-authenticated application will be disconnected and must reconnect, meaning this is not a zero-impact change regardless of authentication method. Second, because the cache is geo-replicated, access keys cannot be disabled directly at all — Microsoft\'s own required procedure is to unlink the caches first, disable access keys, and then relink them, a three-step operation that touches the replication topology, not a single settings toggle. Both points argue against treating this as a low-risk mid-afternoon change — Microsoft\'s own guidance explicitly recommends performing operations like this during a scheduled maintenance window instead.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Enabling Microsoft Entra ID authentication on Azure Cache for Redis is a config-only change with no impact on the running cache.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states plainly that enabling it (and separately, granting the first data access policy assignment) reboots every node in the cache instance and can take up to 30 minutes — recommended for a maintenance window, not a routine mid-day change.'
    },
    {
      thought: 'If an application already authenticates exclusively via Entra ID tokens, disabling access keys afterward has no effect on that application\'s existing connections.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs are explicit that disabling access keys terminates ALL existing client connections, "whether they use access keys or Microsoft Entra authentication" — an Entra-authenticated application still gets disconnected and must reconnect.'
    },
    {
      thought: 'Disabling access keys on any Azure Cache for Redis instance is a single toggle in the Authentication settings, regardless of how the cache is configured.',
      reality: 'Per this subtopic\'s theory, a geo-replicated cache has an additional documented requirement — the caches must be unlinked first, then access keys disabled, then the caches relinked — making it a three-step operation for that configuration, not a single setting change.'
    }
  ];
}
